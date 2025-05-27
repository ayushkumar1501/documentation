**Introduction**

  This document outlines the Proof of Concept (POC) for an Invoice Validation Chat Interface. The goal is to demonstrate a working prototype that:
  
  Allows users to upload a single invoice per session
  
  Extracts invoice data via OCR
  
  Validates extracted fields against a predefined checklist using an LLM
  
  Stores full chat history, prompts, responses, and summaries in a database
  
  Provides an interactive chat-style UI for follow-up queries
  
  This POC focuses on the core functionality and data flow; deployment, load testing, and security hardening are outside the current scope.

**Use Case & Objectives**

  Build a chat-like interface for validating invoices against a fixed checklist
  
  Maintain session history, including file uploads, prompts, LLM responses, and a final summary
  
  LLM-powered field validation: The system uses a large language model to check whether key fields (e.g. invoice number, date, amount) meet the checklist criteria
  
  Database persistence: All session metadata, messages, and summaries are persisted for audit and review
  
  Follow-up interaction: After validation, users can ask about next steps or specific details

**High-Level Architecture**

<img width="826" alt="Screenshot 2025-05-27 at 9 59 28 PM" src="https://github.com/user-attachments/assets/0dae0209-ae9e-4937-bc9f-5381e50ed82b" />
                                                      

**Legend:**

  Upload Invoice: User selects and uploads one invoice file (PDF/JPG/PNG) via the UI.
  
  OCR Extraction: The UI server forwards the file to the OCR module for text and field extraction.
  
  Duplicate Check & Queue: Extracted key fields (invoice number, date, amount) are hashed; duplicates are rejected, otherwise queued for validation.
  
  Validation Prompt: Backend assembles system & user prompts with extracted text and invokes the LLM for checklist validation.
  
  Store & Retrieve: Validation results, full conversation, and summary are written to the database. The UI fetches and displays these in the chat interface.

**Component Breakdown**

  User Interface (UI)
  
  Framework: React / Material UI
  
  Key Libraries:
  TypeAnimation for chat-style message rendering
  
  File Upload component limiting to one file per session
  
  Toast Notifications for success, errors, and duplicate alerts

**Features:**

Chat window showing user messages, system prompts, LLM responses

Status indicators: Uploading…, Validating…, Validation Complete

Invoice preview with key fields displayed immediately after OCR

Input box for follow-up questions after validation

**Backend Service**

Framework: Python Flask or Django

**Responsibilities:**

  Handle file uploads (single file limit)
  
  Invoke OCR and process text
  
  Check for duplicate invoices via hashing (e.g. SHA-256 of invoice number + date + amount)
  
  Construct and send prompts to the LLM service
  
  Persist messages, metadata, and summaries into the database
  
  Expose API's endpoints for the UI

**OCR Module**

  Engine Choices: Tesseract OCR 
  
  Integration: Dockerized OCR worker or cloud API call
  
  Output: JSON of extracted key fields (e.g., invoice_number, invoice_date, total_amount) and raw text

**LLM Validation Module**

  Model Provider: Tachyon
  
  **Prompt Strategy:**
  
    System Prompt: Defines checklist and validation rules
    User Prompt: Provides extracted invoice text and asks for validation results
    Response Parsing: The module expects a JSON-formatted answer indicating accepted: true/false, errors: [], and summary.

**Sequence Flow**

  1. User opens chat interface → new session created in sessions table.
  
  2. User uploads invoice → backend computes hash, checks invoices table.
  
  3. If exists → return error toast, HTTP 409.
  
  Else → store record, forward file to OCR.
  
  4. OCR extracts text → backend maps fields and commits messages with raw text.
  
  5. Backend constructs LLM prompt → sends to LLM service.
  
  6. LLM returns validation → backend stores response in messages + summaries.
  
  7. UI displays chat messages + final summary.
  
  8. User may send follow-up query → backend repeats prompt cycle, appends to DB and chat.
     
<img width="575" alt="Screenshot 2025-05-27 at 9 57 41 PM" src="https://github.com/user-attachments/assets/52b88de4-29a8-406f-853b-ebd26191f15f" />


