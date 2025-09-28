# AI Medical Report Simplifier: Intelligent Data Pipeline

This repository contains a full-stack application designed to securely and intelligently process unstructured medical lab reports (images or raw text) into structured, patient-friendly summaries. It utilizes a robust Node.js/Express backend integrated with Google's Generative AI and Vision APIs, coupled with a modular React frontend.

The project is built around a chained AI pipeline to ensure data **accuracy**, **safety**, and **clarity**.

---

## 🏗️ Architecture and Code Organization

The system is split into two distinct, independently managed services: a high-performance Express API and a modular React client.

### 1. Backend Service (Root Project)

* **Technologies:** Node.js, Express.js, Google Generative AI SDK, Google Cloud Vision.
* **Role:** Orchestrates the multi-stage AI pipeline, handles file uploads, performs validation, and serves the static frontend assets.
* **Organization:**
    * `server.js`: Express entry point and configuration.
    * `src/services/reportProcessor.js`: The central **Pipeline Orchestrator** (manages the four sequential steps).
    * `src/services/ai/geminiService.js`: Contains AI interaction logic (`normalizeTests`, `generateSummary`).
    * `src/services/ai/visionService.js`: Handles file parsing and OCR.
    * `src/utils/guardrails.js`: Implementation of the hallucination check.

### 2. Frontend Client (`frontend/`)

* **Technologies:** React, Vite (Build Tool), Tailwind CSS.
* **Role:** Provides a responsive, single-page application (SPA) for user interaction, progress tracking, and structured results display.
* **Modularity:** Uses a custom hook (`useReportProcessor.js`) for centralized state management and API calls, assembling modular components (`TestTable`, `ResultsDisplay`, etc.).

---

## 🧠 AI Methodology: Chaining and Prompt Engineering

This system employs a **multi-step chaining pattern** to ensure the output is correct (schema adherence) and safe (hallucination prevention).

### Model Configuration

All primary AI logic uses **Gemini 2.5 Flash** (`gemini-2.5-flash-preview-05-20`) for its low latency and superior adherence to JSON output schemas.

* **Temperature:** Consistently set to **0.1** to ensure deterministic, fact-based output.
* **System Instructions:** Used for **Role-Fixing** (e.g., "Act as a clinical data normalization engine...") to maintain the required persona.

### Prompting Techniques and Refinements

The AI steps utilize advanced prompt engineering techniques for high-fidelity output:

| Step | Goal & Technique | Description & Refinement |
| :--- | :--- | :--- |
| **Normalization** | **Goal:** Extract accurate JSON schema (`tests` array) from unstructured OCR text. | **Craft Method & One-Shot Prompting:** A highly detailed **System Instruction** defines the exact output schema. A **One-Shot Example** (input ➞ perfect structured JSON) is provided in the prompt payload to train the model instantly on the expected structure, improving parsing reliability. |
| **Guardrail/Validation** | **Goal:** Prevent AI **hallucination** (fabricating results not in the original report). | **Validation Check:** The system runs a programmatic check comparing the normalized tests against the original raw text. The LLM is used in this stage to define boundaries and flags for suspicious content. If the check fails, the pipeline returns a specific `unprocessed` status. |
| **Summarization** | **Goal:** Translate technical data into patient-friendly language. | **Role-Fixing & Few-Shot:** The model's role is fixed as a "Patient Advocate/Educator." **Few-Shot examples** demonstrate the required tone (empathetic, non-diagnostic) and structure (summary + bulleted explanations), ensuring the output is safe and clear. |

---

## ⚙️ Setup and Local Execution

### Prerequisites

* Node.js (v18+)
* A **Google Cloud Project** with the **Vision API** and **Generative AI API** enabled.
* **Environment Variable:** Credentials must be provided as an environment variable (`GCP_CREDENTIALS_JSON`) for local and cloud usage.

### Local Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone [YOUR GITHUB REPO LINK HERE]
    cd Plum # or your project root folder
    ```

2.  **Install Server & Client Dependencies:**
    ```bash
    # Install server dependencies first
    npm install
    
    # Install client dependencies and build the frontend (creates /frontend/assets)
    npm install --prefix frontend
    npm run build --prefix frontend
    ```

3.  **Run Server:**
    Start the API server, which serves the compiled React client.

    ```bash
    # Starts server.js at http://localhost:5500
    npm start
    ```

---

## 🌐 API Reference and Usage Examples

The entire application communicates via a single, multipurpose endpoint.

### Endpoint: `POST /api/simplify-report`

Processes input (text or file) and returns the structured analysis.

| Method | URL | Input Format |
| :--- | :--- | :--- |
| **POST** | `/api/simplify-report` | `multipart/form-data` |

### A. Sample Request 1: Text Input (Testing Normalization)

```bash
curl -X POST http://localhost:5500/api/simplify-report \
  -H "Content-Type: multipart/form-data" \
  -F 'text=Patient labs show WBC 14.5 (ref 4.5-11.0), Total Cholesterol 220 mg/dL, and Hemoglobin 14 g/dL. All other values normal.'

```
### B. Sample Request 2: File Input (Testing OCR Pipeline)
```bash

curl -X POST http://localhost:5500/api/simplify-report \
  -H "Content-Type: multipart/form-data" \
  -F 'file=@/path/to/your/report_image.png;type=image/png'

```

### C. Expected JSON Response Schema (Success)
```bash

{
  "status": "ok",
  "tests": [
    {
      "name": "string",
      "value": "number/string",
      "unit": "string",
      "status": "string (high, low, normal)",
      "ref_range": { "low": "number", "high": "number" }
    }
  ],
  "summary": "string (patient-friendly interpretation)",
  "explanations": ["string (bullet point 1)", "string (bullet point 2)"],
  "confidence": "number (OCR/Vision confidence)",
  "normalizationConfidence": "number (LLM confidence)"
}
```


## Live Demo Instance	   https://ai-powered-medicaltest-report-analyser.onrender.com/     
