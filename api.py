import os
import json
import logging
from groq import Groq

logger = logging.getLogger(__name__)

# Initialize Groq client
try:
    GROQ_API_KEY = ""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY environment variable not set.")
    groq_client = Groq(api_key=GROQ_API_KEY)
except Exception as e:
    logger.error(f"Error initializing Groq client: {e}")
    groq_client = None # Set to None if initialization fails

# --- NEW: Function for Invoice Data Extraction ---
def format_remarks(remarks):
    """
    Format remarks to be more readable with proper line breaks.
    """
    if not remarks:
        return None

    # Step 1: Add line breaks after sentence-ending punctuation
    import re
    formatted = re.sub(r'([.!?])\s+', r'\1\n', remarks)

    # Step 2: Add line breaks after commas if the next clause is long
    parts = formatted.split(', ')
    result = []
    for part in parts:
        if len(part) > 50:
            result.append(part + ',\n')
        else:
            result.append(part + ', ')
    # Combine and strip any trailing punctuation artifacts
    final = ''.join(result).rstrip(', \n')
    return final

def extract_invoice_data(invoice_text):
    """
    Uses LLM to extract structured data from raw invoice text.
    It does NOT perform validation against a checklist here.
    """
    if not groq_client:
        logger.error("Groq client not initialized. Cannot extract invoice data.")
        return {"error": "AI service unavailable for extraction."}

    extraction_prompt = f"""
    You are an expert AI assistant specialized in extracting structured data from invoice documents.
    Your task is to parse the provided raw text from an invoice and extract all relevant fields
    that would be required for a tax invoice checklist under IGST.

    Specifically, extract the following fields. If a field is not found, use `null`.
    For boolean fields, use `true` or `false`. For numeric fields, try to convert to float.
    For dates, use 'YYYY-MM-DD' format if possible.

    Expected fields:
    - supplier_details (Name, address and GSTIN of supplier)
    - invoice_number (Invoice No - Consecutive Serial Number)
    - invoice_date (Invoice Date, format YYYY-MM-DD)
    - recipient_details (Name, address and GSTIN of recipient, if recipient registered)
    - delivery_address_if_unregistered (Name, address of recipient and the address of delivery, if recipient not registered)
    - hsn_sac_code (HSN/ SAC Code)
    - hsn_description (HSN Code Description Category)
    - quantity (Quantity / Unit or Unique Quantity code) - should be a number
    - total_value_of_supply (Total Value of supply) - should be a number
    - taxable_value_of_supply (Taxable Value of supply) - should be a number
    - tax_rate (Tax rate -- for supply to SEZ, only IGST is applicable, e.g., "0%", "18%")
    - tax_amount_charged (Amount of tax charged) - should be a number
    - place_of_supply (Place of supply - State name and State code)
    - delivery_address_different (Address of delivery where different than place of supply)
    - reverse_charge_applicable (Tax payable on reverse charge basis - Yes/No, boolean true/false)
    - supplier_signature_present (Manual Signature or digital signature of supplier or his authorised signatory - boolean true/false, infer presence)
    - remarks (Remarks on Invoice, capture full text if present, including Option 1 or 2 specific remarks. Format with line breaks after sentences and long clauses)

    Return the extracted data as a JSON object only. Do NOT include any other text or markdown outside the JSON.

    Invoice Text:
    ```
    {invoice_text}
    ```
    JSON Output:
    ```json
    """
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": extraction_prompt,
                }
            ],
            model="llama3-8b-8192", # Or your preferred Groq model
            response_format={"type": "json_object"}, # IMPORTANT: Force JSON output
            temperature=0.0, # Keep low for consistent extraction
        )
        response_content = chat_completion.choices[0].message.content
        logger.debug(f"LLM Data Extraction Raw Response: {response_content}")
        
        # Parse the JSON response
        extracted_data = json.loads(response_content)
        
        # Format the remarks if they exist
        if 'remarks' in extracted_data and extracted_data['remarks']:
            extracted_data['remarks'] = format_remarks(extracted_data['remarks'])

        return extracted_data
    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON from LLM extraction: {e}. Raw response: {response_content}")
        return {"error": "AI response was not valid JSON for extraction."}
    except Exception as e:
        logger.error(f"Error during LLM invoice data extraction: {e}")
        return {"error": f"LLM extraction failed: {str(e)}"}


# --- Modified Function for General Chat Responses with Restrictions ---
def get_chat_response(prompt_content, extracted_invoice_data=None):
    """
    Uses LLM to generate a conversational response to a given prompt.
    Restricts responses to invoice-related queries only.
    """
    if not groq_client:
        logger.error("Groq client not initialized. Cannot get chat response.")
        return "Sorry, the AI service is currently unavailable."

    # Define the system message to restrict behavior
    system_message = {
        "role": "system",
        "content": """You are a specialized AI assistant whose primary function is to help users understand and analyze invoice data.
        You can answer questions related to the extracted invoice details, provide clarifications about invoice fields, or help with invoice-related inquiries.
        
        If a user asks a question that is NOT related to invoices, their content, or the invoice processing task, you MUST politely decline to answer and redirect them to ask an invoice-related question.
        Do NOT engage in general conversation, personal opinions, or topics outside the scope of invoice data.
        Keep your responses concise and directly relevant to the invoice context.
        """
    }

    messages = [system_message]

    # Add extracted invoice data as context if available
    # This is crucial so the LLM can answer questions about the current invoice.
    if extracted_invoice_data:
        messages.append({
            "role": "user",
            "content": f"The current invoice details are:\n```json\n{json.dumps(extracted_invoice_data, indent=2)}\n```\nBased on these details, please answer my following question:"
        })
    
    # Add the user's actual prompt
    messages.append({
        "role": "user",
        "content": prompt_content,
    })

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama3-8b-8192", # Or your preferred Groq model
            temperature=0.0, # Keep temperature low to enforce strict adherence to rules
        )
        response_content = chat_completion.choices[0].message.content
        return response_content
    except Exception as e:
        logger.error(f"Error during LLM chat response: {e}")
        return f"Sorry, I'm having trouble responding right now: {str(e)}"
