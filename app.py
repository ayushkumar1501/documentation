import os
import io
import hashlib
import json
import logging
import traceback
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Import your modules
from ocr_utils import extract_text
# from groq_llm_utils import validate_invoice, get_chat_response # REMOVE THIS LINE
import groq_llm_utils # KEEP THIS LINE, we'll call its functions directly
from database import (
    create_session, list_sessions, get_session_by_id,
    create_message, list_messages_for_session, get_latest_validation_metadata,
    create_invoice_record, find_invoice_by_hash,
)

app = Flask(__name__)
CORS(app, supports_credentials=True)

# --- Constants & System Prompts ---
WELCOME_MESSAGE = """Welcome to Invoice Validator! 🧾
I'm here to help you validate invoices. Please upload a PNG, JPG, or PDF file to get started.
"""

# --- NEW: Checklist Items Definition (Complete this based on your image!) ---
# This dictionary defines the checklist rules for each item and option.
# You MUST fill out all 17 items based on your checklist image.
CHECKLIST_ITEMS = [
    {
        "item_number": 1,
        "description": "Name, address and GSTIN of supplier",
        "extracted_key": "supplier_details", # This is the key you expect from LLM's structured output
        "rules": {
            "option_1": {"required": True, "type": "string"},
            "option_2": {"required": True, "type": "string"},
            "option_3": {"required": False, "type": "string"}
        }
    },
    {
        "item_number": 2,
        "description": "Invoice No - Consecutive Serial Number",
        "extracted_key": "invoice_number",
        "rules": {
            "option_1": {"required": True, "type": "string"},
            "option_2": {"required": True, "type": "string"},
            "option_3": {"required": True, "type": "string"}
        }
    },
    {
        "item_number": 3,
        "description": "Invoice Date",
        "extracted_key": "invoice_date",
        "rules": {
            "option_1": {"required": True, "type": "date"},
            "option_2": {"required": True, "type": "date"},
            "option_3": {"required": True, "type": "date"}
        }
    },
    {
        "item_number": 4,
        "description": "Name, address and GSTIN of recipient, if recipient registered",
        "extracted_key": "recipient_details",
        "rules": {
            "option_1": {"required": True, "type": "string"},
            "option_2": {"required": True, "type": "string"},
            "option_3": {"required": False, "type": "string"}
        }
    },
    {
        "item_number": 5,
        "description": "Name, address of recipient and the address of delivery (with name of state and code), if recipient not registered",
        "extracted_key": "delivery_address_if_unregistered",
        "rules": {
            "option_1": {"required": False, "type": "string"}, # NA in checklist for Option 1
            "option_2": {"required": False, "type": "string"}, # NA in checklist for Option 2
            "option_3": {"required": False, "type": "string"}  # NA in checklist for Option 3
        }
    },
    {
        "item_number": 6,
        "description": "HSN/ SAC Code",
        "extracted_key": "hsn_sac_code",
        "rules": {
            "option_1": {"required": True, "type": "string"},
            "option_2": {"required": True, "type": "string"},
            "option_3": {"required": True, "type": "string"}
        }
    },
    {
        "item_number": 7,
        "description": "HSN Code Description Category",
        "extracted_key": "hsn_description",
        "rules": {
            "option_1": {"required": True, "type": "string"},
            "option_2": {"required": True, "type": "string"},
            "option_3": {"required": True, "type": "string"}
        }
    },
    {
        "item_number": 8,
        "description": "Quantity (Unit or Unique Quantity code) in case of goods",
        "extracted_key": "quantity",
        "rules": {
            "option_1": {"required": True, "type": "number"},
            "option_2": {"required": True, "type": "number"},
            "option_3": {"required": True, "type": "number"}
        }
    },
    {
        "item_number": 9,
        "description": "Total Value of supply",
        "extracted_key": "total_value_of_supply",
        "rules": {
            "option_1": {"required": True, "type": "number"},
            "option_2": {"required": True, "type": "number"},
            "option_3": {"required": False, "type": "number"} # NA for Option 3
        }
    },
    {
        "item_number": 10,
        "description": "Taxable Value of supply",
        "extracted_key": "taxable_value_of_supply",
        "rules": {
            "option_1": {"required": True, "type": "number"},
            "option_2": {"required": True, "type": "number"},
            "option_3": {"required": False, "type": "number"} # NA for Option 3
        }
    },
    {
        "item_number": 11,
        "description": "Tax rate -- (for supply to SEZ, only IGST is applicable)",
        "extracted_key": "tax_rate",
        "rules": {
            "option_1": {"required": True, "value": "0%", "type": "string"}, # "0%"
            "option_2": {"required": True, "type": "string"}, # "XX%"
            "option_3": {"required": False, "type": "string"}
        }
    },
    {
        "item_number": 12,
        "description": "Amount of tax charged",
        "extracted_key": "tax_amount_charged",
        "rules": {
            "option_1": {"required": True, "value": 0, "type": "number"}, # Should be 0 for '0%' tax rate
            "option_2": {"required": True, "type": "number"},
            "option_3": {"required": False, "type": "number"}
        }
    },
    {
        "item_number": 13,
        "description": "Place of supply - State name and State code",
        "extracted_key": "place_of_supply",
        "rules": {
            "option_1": {"required": True, "type": "string"},
            "option_2": {"required": True, "type": "string"},
            "option_3": {"required": True, "type": "string"}
        }
    },
    {
        "item_number": 14,
        "description": "Address of delivery where different than place of supply",
        "extracted_key": "delivery_address_different",
        "rules": {
            "option_1": {"required": False, "type": "string"}, # NA
            "option_2": {"required": False, "type": "string"}, # NA
            "option_3": {"required": False, "type": "string"} # NA
        }
    },
    {
        "item_number": 15,
        "description": "Tax payable on reverse charge basis - Yes or No",
        "extracted_key": "reverse_charge_applicable",
        "rules": {
            "option_1": {"required": True, "type": "boolean"},
            "option_2": {"required": True, "type": "boolean"},
            "option_3": {"required": True, "type": "boolean"}
        }
    },
    {
        "item_number": 16,
        "description": "Manual Signature or digital signature of supplier or his authorised signatory",
        "extracted_key": "supplier_signature_present",
        "rules": {
            "option_1": {"required": True, "type": "boolean"},
            "option_2": {"required": True, "type": "boolean"},
            "option_3": {"required": True, "type": "boolean"}
        }
    },
    {
        "item_number": 17,
        "description": "Remarks on Invoice",
        "extracted_key": "remarks",
        "rules": {
            "option_1": {"required": True, "type": "string"}, # Supply to SEZ for authorised operations under bond or LUT without payment of IGST
            "option_2": {"required": True, "type": "string"}, # Supply to SEZ for authorised operations on payment of IGST
            "option_3": {"required": False, "type": "string"}
        }
    },
]


# --- NEW: Checklist Validation Function ---
def apply_igst_checklist_rules(extracted_data):
    """
    Applies the IGST checklist rules to the extracted data.
    Determines the invoice option and validates required fields for that option.
    """
    validation_status = "Accepted"
    validation_summary = ""
    validation_issues = []
    option_applied = "Unknown Option"
    checklist_breakdown = [] # To store pass/fail status for each item

    # Step 1: Determine the Invoice Option (This logic needs refinement based on your business rules)
    # Example logic:
    has_igst_amount = extracted_data.get('tax_amount_charged', 0) > 0 or (extracted_data.get('tax_rate') and extracted_data['tax_rate'] != '0%')
    has_remarks_option1 = extracted_data.get('remarks', '').lower().strip().startswith("supply to sez for authorised operations under bond or lut without payment of igst")
    has_remarks_option2 = extracted_data.get('remarks', '').lower().strip().startswith("supply to sez for authorised operations on payment of igst")

    if not has_igst_amount and has_remarks_option1:
        option_applied = "option_1" # WITHOUT IGST, Authorised Operations
        validation_summary = "Invoice processed under Option 1 (WITHOUT IGST, Authorised Operations)."
    elif has_igst_amount and has_remarks_option2:
        option_applied = "option_2" # WITH IGST, Authorised Operations
        validation_summary = "Invoice processed under Option 2 (WITH IGST, Authorised Operations)."
    else:
        option_applied = "option_3" # Not for Authorised operations (or fallback)
        validation_summary = "Invoice processed under Option 3 (Not for Authorised operations) or unable to determine a specific authorized option."
        # If we default to Option 3, and it's not truly an Option 3 invoice,
        # it might fail validation for missing Option 1/2 fields.
        # Consider specific checks for Option 3 classification if possible.


    # Step 2: Validate Required Fields for the Determined Option
    for item in CHECKLIST_ITEMS:
        item_rules = item["rules"].get(option_applied, {})
        is_required = item_rules.get("required", False)
        expected_type = item_rules.get("type", "string")
        expected_value = item_rules.get("value") # For specific values like "0%"

        extracted_value = extracted_data.get(item["extracted_key"])

        item_status = "Passed"
        item_notes = ""

        if not is_required:
            item_status = "N/A"
            item_notes = "Not required for this option."
        else:
            if extracted_value is None or (isinstance(extracted_value, str) and not extracted_value.strip()):
                item_status = "Failed"
                item_notes = f"Missing required field: '{item['description']}'."
                validation_issues.append(item_notes)
                validation_status = "Rejected"
            else:
                # Type validation (basic)
                if expected_type == "number":
                    try:
                        float(extracted_value)
                    except (ValueError, TypeError):
                        item_status = "Failed"
                        item_notes = f"Invalid type for '{item['description']}'. Expected number."
                        validation_issues.append(item_notes)
                        validation_status = "Rejected"
                elif expected_type == "date":
                    try:
                        # Basic date format check, can be more robust
                        datetime.fromisoformat(extracted_value.replace('Z', '+00:00') if 'Z' in extracted_value else extracted_value)
                    except ValueError:
                        item_status = "Failed"
                        item_notes = f"Invalid date format for '{item['description']}'. Expected YYYY-MM-DD."
                        validation_issues.append(item_notes)
                        validation_status = "Rejected"
                elif expected_type == "boolean":
                    # Assume LLM outputs true/false or similar for booleans
                    if not isinstance(extracted_value, bool):
                        item_status = "Failed"
                        item_notes = f"Invalid type for '{item['description']}'. Expected boolean (true/false)."
                        validation_issues.append(item_notes)
                        validation_status = "Rejected"
                
                # Check for specific expected value (e.g., "0%" tax rate)
                if expected_value is not None:
                    if str(extracted_value).strip().lower() != str(expected_value).strip().lower():
                        item_status = "Failed"
                        item_notes = f"Value for '{item['description']}' is '{extracted_value}', expected '{expected_value}'."
                        validation_issues.append(item_notes)
                        validation_status = "Rejected"

        checklist_breakdown.append({
            "item_number": item["item_number"],
            "description": item["description"],
            "status": item_status,
            "notes": item_notes,
            "extracted_value": extracted_value # Include for debugging/display
        })

    return {
        "status": validation_status,
        "summary": validation_summary,
        "extracted_data": extracted_data,
        "issues": validation_issues,
        "option_applied": option_applied,
        "checklist_breakdown": checklist_breakdown
    }


# --- Helper Functions (Updated) ---
def generate_invoice_hash(extracted_data):
    """Generates a SHA256 hash from key invoice fields for duplicate checking."""
    # Ensure consistent ordering for hashing
    invoice_number = extracted_data.get('invoice_number', '').strip()
    invoice_date = extracted_data.get('invoice_date', '').strip()
    total_amount = str(extracted_data.get('total_value_of_supply', '')).strip() # Use total_value_of_supply as per checklist

    # Combine significant fields into a single string
    data_string = f"{invoice_number}-{invoice_date}-{total_amount}"
    return hashlib.sha256(data_string.encode('utf-8')).hexdigest()

def format_validation_result_for_chat(result):
    """
    Formats the structured validation result from the checklist into a Markdown string
    for display in the chat interface.
    """
    status = result.get("status", "Rejected")
    summary = result.get("summary", "No summary provided.")
    extracted_data = result.get("extracted_data", {})
    issues = result.get("issues", [])
    option_applied = result.get("option_applied", "Unknown Option")
    checklist_breakdown = result.get("checklist_breakdown", [])

    formatted_message = ""

    if status == "Accepted":
        formatted_message += f"✅ **Invoice Accepted**\n\n"
        formatted_message += f"Processed under: **{option_applied}**\n\n"
        formatted_message += f"{summary}\n\n"
        formatted_message += "All required checklist items appear to be present and valid.\n\n"
    else: # status == "Rejected"
        formatted_message += f"❌ **Invoice Rejected**\n\n"
        formatted_message += f"Processed under: **{option_applied}**\n\n"
        formatted_message += f"{summary}\n\n"

    if extracted_data:
        formatted_message += "<details>\n"
        formatted_message += "<summary>📋 **Extracted Details (for context)**</summary>\n\n"
        formatted_message += "```json\n"
        formatted_message += json.dumps(extracted_data, indent=2)
        formatted_message += "\n```\n"
        formatted_message += "</details>\n\n"

    if issues:
        formatted_message += "**Issues Found:**\n"
        for issue in issues:
            formatted_message += f"- {issue}\n"
        formatted_message += "\n" # Add newline for spacing
    elif status == "Accepted":
        formatted_message += "*No specific issues found.*\n\n"

    # Add detailed checklist breakdown if available
    if checklist_breakdown:
        formatted_message += "**Checklist Validation Summary:**\n"
        for item in checklist_breakdown:
            icon = "✅" if item["status"] == "Passed" else ("❌" if item["status"] == "Failed" else "➖")
            formatted_message += f"{icon} Item {item['item_number']}: {item['description']} - **{item['status']}** ({item['notes']})\n"
        formatted_message += "\n" # Add newline for spacing


    formatted_message += "\n💬 Feel free to ask me any questions about this validation or the extracted data!"

    return formatted_message


# --- API Endpoints ---
# (No changes to  /sessions/<id>/welcome GET, /sessions/<session_id>/messages GET)

@app.route('/sessions', methods=['GET'])
def get_sessions():
    """Lists all chat sessions."""
    try:
        sessions_list = list_sessions()
        # Convert ObjectId to string for JSON serialization
        for s in sessions_list:
            s['_id'] = str(s['_id'])
            s['createdAt'] = s['createdAt'].isoformat() # Convert datetime to string
            s['updatedAt'] = s['updatedAt'].isoformat() # Convert datetime to string
        return jsonify(sessions_list)
    except Exception as e:
        logger.error(f"Error fetching sessions: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to fetch sessions'}), 500

@app.route('/sessions', methods=['POST'])
def post_session():
    """Creates a new chat session."""
    try:
        title = request.json.get('title', 'New Chat')
        session = create_session(title)
        session['_id'] = str(session['_id']) # Convert ObjectId to string
        session['createdAt'] = session['createdAt'].isoformat()
        session['updatedAt'] = session['updatedAt'].isoformat()
        return jsonify(session), 201
    except Exception as e:
        logger.error(f"Error creating session: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to create session'}), 500

@app.route('/sessions/<session_id>/welcome', methods=['POST'])
def send_welcome_message(session_id):
    """Sends the initial welcome message for a new session."""
    try:
        # Check if session exists (to handle race conditions or invalid IDs)
        if not get_session_by_id(session_id):
            return jsonify({'error': 'Session not found'}), 404

        # Check if it's truly a new session (no existing messages)
        if list_messages_for_session(session_id):
            return jsonify({'message': 'Session already has messages'}), 200 # Already initialized

        create_message(session_id, 'assistant', WELCOME_MESSAGE)
        return jsonify({'response': WELCOME_MESSAGE}), 200
    except Exception as e:
        logger.error(f"Error sending welcome message: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to send welcome message'}), 500

@app.route('/sessions/<session_id>/messages', methods=['GET'])
def get_messages(session_id):
    """Retrieves all messages for a given session."""
    try:
        messages = list_messages_for_session(session_id)
        # Convert ObjectId and datetime to string for JSON serialization
        for m in messages:
            m['_id'] = str(m['_id'])
            m['sessionId'] = str(m['sessionId'])
            m['createdAt'] = m['createdAt'].isoformat()
            # Ensure metadata is JSON serializable
            if isinstance(m.get('metadata'), dict):
                # Optionally convert ObjectIds within metadata if any
                pass
        return jsonify(messages)
    except Exception as e:
        logger.error(f"Error fetching messages for session {session_id}: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to fetch messages'}), 500


@app.route('/upload', methods=['POST'])
def upload_invoice():
    """Handles invoice file uploads, OCR, LLM data extraction, checklist validation, and duplicate checking."""
    try:
        if 'invoice' not in request.files:
            return jsonify({"error": "No file part in the request"}), 400

        file = request.files['invoice']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        session_id = request.form.get('session_id')
        if not session_id:
            return jsonify({"error": "No session_id provided"}), 400

        if not get_session_by_id(session_id):
            return jsonify({'error': 'Session not found or invalid'}), 404

        # 1. OCR and Text Extraction
        create_message(session_id, 'system', f"_Processing file:_ **{file.filename}**... Extracting text via OCR.")
        try:
            extracted_raw_text = extract_text(file, file.filename)
            if not extracted_raw_text.strip():
                create_message(session_id, 'assistant', "❌ **Invoice Rejected**\n\nNo readable text could be extracted from the uploaded file. Please ensure it's clear.")
                return jsonify({"status": "Rejected", "message": "No text extracted"}), 200
        except Exception as e:
            logger.error(f"OCR Error: {traceback.format_exc()}")
            create_message(session_id, 'assistant', f"❌ **Invoice Rejected**\n\nError processing the image for text extraction: {str(e)}. Please try a different file.")
            return jsonify({"status": "Rejected", "message": f"OCR error: {str(e)}"}), 200

        # 2. LLM Data Extraction (NEW ROLE)
        create_message(session_id, 'system', "_Text extracted._ Extracting structured data with AI...")
        # Call the LLM to get structured data ONLY
        # The prompt in groq_llm_utils.extract_invoice_data needs to be updated
        extracted_data_from_llm = groq_llm_utils.extract_invoice_data(extracted_raw_text)

        if not isinstance(extracted_data_from_llm, dict):
            logger.error(f"LLM Data Extraction returned non-dict: {extracted_data_from_llm}")
            # Fallback if LLM doesn't return expected JSON
            validation_result = {
                "status": "Rejected",
                "summary": "Internal error: AI data extraction failed or returned malformed data.",
                "extracted_data": extracted_data_from_llm if isinstance(extracted_data_from_llm, str) else {},
                "issues": ["AI model returned an unexpected format for data extraction. Check server logs."],
                "option_applied": "N/A",
                "checklist_breakdown": []
            }
        else:
            # 3. Checklist Validation (NEW STEP)
            create_message(session_id, 'system', "_Structured data extracted._ Applying IGST checklist rules...")
            validation_result = apply_igst_checklist_rules(extracted_data_from_llm)

        # 4. Duplicate Invoice Checking (based on extracted_data from LLM)
        invoice_hash = None
        if validation_result.get('extracted_data'): # Check if LLM extraction was successful
            invoice_hash = generate_invoice_hash(validation_result['extracted_data'])
            if invoice_hash:
                existing_invoice = find_invoice_by_hash(invoice_hash)
                if existing_invoice:
                    validation_result['status'] = 'Rejected'
                    validation_result['summary'] = 'Duplicate invoice detected.'
                    validation_result['issues'].append(f"This invoice (Hash: {invoice_hash}) was previously processed on {existing_invoice['createdAt'].isoformat()}.")
                    # Store message before returning 409
                    create_message(session_id, 'assistant', format_validation_result_for_chat(validation_result), metadata=validation_result)
                    return jsonify({"status": "Rejected", "message": "Duplicate invoice"}), 409 # HTTP 409 Conflict

        # 5. Store Invoice Record & Chat Message
        if validation_result['status'] == 'Accepted' and invoice_hash:
            create_invoice_record({
                "hash": invoice_hash,
                "extracted_data": validation_result['extracted_data'],
                "filename": file.filename,
                "sessionId": session_id,
                "llm_response_id": str(create_message(session_id, 'assistant',
                                                      format_validation_result_for_chat(validation_result),
                                                      metadata=validation_result)['_id'])
            })
        else: # For rejected or if hash couldn't be generated or not accepted
             create_message(session_id, 'assistant',
                            format_validation_result_for_chat(validation_result),
                            metadata=validation_result)

        return jsonify({"status": validation_result['status'], "message": "Validation complete"}), 200

    except Exception as e:
        logger.error(f"Upload/Validation Error: {traceback.format_exc()}")
        # Ensure a full validation_result structure is returned for the frontend
        error_result = {
            "status": "Rejected",
            "summary": "An unexpected server error occurred during validation.",
            "extracted_data": {},
            "issues": [f"Server error: {str(e)}"],
            "option_applied": "N/A",
            "checklist_breakdown": []
        }
        create_message(session_id, 'assistant', format_validation_result_for_chat(error_result), metadata=error_result)
        return jsonify({"error": f"An unexpected server error occurred: {str(e)}"}), 500

@app.route('/sessions/<session_id>/llm_chat', methods=['POST'])
def llm_chat(session_id):
    """Handles follow-up chat questions with the LLM."""
    try:
        data = request.get_json()
        user_message = data.get('content')
        if not user_message:
            return jsonify({'error': 'content is required'}), 400

        create_message(session_id, 'user', user_message)

        # Get the latest structured validation metadata to provide context to the LLM
        validation_metadata = get_latest_validation_metadata(session_id)

        prompt_for_llm_chat = ""
        if validation_metadata and validation_metadata.get('extracted_data'):
            # Provide the full JSON structure as context to the LLM
            # Focus on extracted_data and issues for context
            context_data = {
                "extracted_data": validation_metadata.get('extracted_data', {}),
                "status": validation_metadata.get('status', 'N/A'),
                "issues": validation_metadata.get('issues', []),
                "option_applied": validation_metadata.get('option_applied', 'N/A')
            }
            prompt_for_llm_chat = f"""
            Here is the context from the last invoice processing in this chat:
            ```json
            {json.dumps(context_data, indent=2)}
            ```
            Based on this validation data and the user's question, please provide a detailed explanation.
            If the invoice was accepted, elaborate on the details that were successfully extracted and mention the checklist option applied.
            If the invoice was rejected, specifically explain the reasons found in the 'issues' list and how the 'extracted_data' might be incomplete or incorrect. Refer to the checklist option if relevant.
            User's question: "{user_message}"
            """
        else:
            prompt_for_llm_chat = f"User's question (no specific invoice context available): \"{user_message}\""

        # Use get_chat_response for conversational AI
        reply_content = groq_llm_utils.get_chat_response(prompt_for_llm_chat)

        create_message(session_id, 'assistant', reply_content)
        return jsonify({'response': reply_content}), 200

    except Exception as e:
        logger.error(f"LLM chat error: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to get chat response'}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)
