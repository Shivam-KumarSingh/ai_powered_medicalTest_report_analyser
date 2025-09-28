# AI Medical Report Simplifier: Intelligent Data Pipeline

This repository contains a full-stack application designed to securely and intelligently process unstructured medical lab reports (images or raw text) into structured, patient-friendly summaries. It utilizes a robust Node.js/Express backend integrated with Google's Generative AI and Vision APIs, coupled with a modular React frontend.

The project is built around a chained AI pipeline to ensure data **accuracy**, **safety**, and **clarity**.

---

##  Architecture and Code Organization

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

## AI Methodology: Chaining and Prompt Engineering

This system employs a **multi-step chaining pattern** to ensure the output is correct (schema adherence) and safe (hallucination prevention).

### Model Configuration

All primary AI logic uses **Gemini 2.5 Flash** (`gemini-2.5-flash-preview-05-20`) for its low latency and superior adherence to JSON output schemas.

* **Temperature:** Consistently set to **0.2** to ensure deterministic, fact-based output.
* **System Instructions:** Used for **Role-Fixing** (e.g., "Act as a clinical data normalization engine...") to maintain the required persona.

### Prompting Techniques and Refinements

The AI steps utilize advanced prompt engineering techniques for high-fidelity output:

| Step | Goal & Technique | Description & Refinement |
| :--- | :--- | :--- |
| **Normalization** | **Goal:** Extract accurate JSON schema (`tests` array) from unstructured OCR text. | **Craft Method & One-Shot Prompting:** A highly detailed **System Instruction** defines the exact output schema. A **few-Shot Example** (input ➞ perfect structured JSON) is provided in the prompt payload to train the model instantly on the expected structure, improving parsing reliability. |
| **Guardrail/Validation** | **Goal:** Prevent AI **hallucination** (fabricating results not in the original report). | **Validation Check:** The system runs a programmatic check comparing the normalized tests against the original raw text and fallback to LLM. The LLM is used in this stage to define boundaries and flags for suspicious content. If the check fails, the pipeline returns a specific `unprocessed` status. |
| **Summarization** | **Goal:** Translate technical data into patient-friendly language. | **Role-Fixing & one-Shot:** The model's role is fixed as a "Patient Advocate/Educator." **one-Shot example** demonstrate the required tone (empathetic, non-diagnostic) and structure (summary + bulleted explanations), ensuring the output is safe and clear. |

---
### ModeL Configuration

generationConfig = {
  temperature: 0.2,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 8196,
  responseMimeType: 'application/json',
};
### system Prompt:
You are a highly skilled medical data normalization and summarization assistant.
Your role is to accurately extract and correct laboratory test information from text.
Always respond ONLY in valid JSON. Never include markdown, commentary, or code fences.
Be precise, factual, and medically neutral.


##  Setup and Local Execution

### Prerequisites

* Node.js (v18+)
* A **Google Cloud Project** with the **Vision API** and **Generative AI API** enabled.
* **Environment Variable:** Credentials must be provided as an environment variable (`GCP_CREDENTIALS_JSON`) for local and cloud usage.

### Local Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Shivam-KumarSingh/ai_powered_medicalTest_report_analyser
    cd ai_powered_medicalTest_report_analyser
    ```

2.  **Install Server & Client Dependencies:**
    ```bash
    # Install server dependencies first
    npm install
    
    # Install client dependencies and build the frontend (creates /frontend/assets)
    cd frontend
    npm i
    npm run build
    cd ..
    ```
3. **Configure Environment Variables:**

##### Create a .env file in the root directory:
```bash
PORT=5500
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS= Path_To_cloud credentials
GCP_PROJECT_ID=your_gcp_project_id
GCP_PROJECT_LOCATION=your_gcp_project_location
```


4.  **Run Server:**
    Start the API server, which serves the compiled React client.

    ```bash
    # Starts server.js at http://localhost:5500
    npm start
    ```

---

## 🌐 API Reference and Usage Examples

The entire application communicates via a single, multipurpose endpoint.

### Endpoint: `POST /api/simplify-report`
### API Server Link:
https://ai-powered-medicaltest-report-analyser-yew7.onrender.com/api/simplify-report

Processes input (text or file) and returns the structured analysis.

| Method | URL | Input Format |
| :--- | :--- | :--- |
| **POST** | `/api/simplify-report` | `multipart/form-data` |

### A. Sample Request 1: Text Input (Testing Normalization)

```bash
curl --location 'https://ai-powered-medicaltest-report-analyser-yew7.onrender.com/api/simplify-report' \
--form 'text="CBC: Hemoglobin 10.2 g/dL (Low), WBC 11,200 /uL (High)"'

```

#### Test Output:
```bash
{
    "status": "ok",
    "tests": [
        {
            "name": "Hemoglobin",
            "value": 10.2,
            "unit": "g/dL",
            "status": "low",
            "ref_range": {
                "low": 12,
                "high": 15
            }
        },
        {
            "name": "WBC",
            "value": 11200,
            "unit": "/uL",
            "status": "high",
            "ref_range": {
                "low": 4000,
                "high": 11000
            }
        }
    ],
    "summary": "Your results show a low hemoglobin level and a high white blood cell count.",
    "explanations": [
        "Low hemoglobin may relate to anemia.",
        "High WBC can occur with infections."
    ],
    "confidence": 1,
    "normalizationConfidence": 0.98
}
```

### B. Sample Request 2: File Input (Testing OCR Pipeline )
```bash

curl --location 'https://ai-powered-medicaltest-report-analyser-yew7.onrender.com/api/simplify-report' \
--form 'file=@"/home/shivam/Pictures/Screenshots/Screenshot from 2025-09-27 11-57-05.png"'

```

#### Test Output:
```bash
{
    "status": "ok",
    "tests": [
        {
            "name": "WBC NBT Count -EDTA",
            "value": 6100,
            "unit": "Cells / cu mm",
            "status": "normal",
            "ref_range": {
                "low": 3500,
                "high": 10000
            }
        },
        {
            "name": "NEUTROPHILS",
            "value": 71,
            "unit": "%",
            "status": "normal",
            "ref_range": {
                "low": 12,
                "high": 80
            }
        },
        {
            "name": "LYMPHOCYTES",
            "value": 24,
            "unit": "%",
            "status": "normal",
            "ref_range": {
                "low": 10,
                "high": 50
            }
        },
        {
            "name": "EOSINOPHILS",
            "value": 5,
            "unit": "%",
            "status": "normal",
            "ref_range": {
                "low": 2,
                "high": 6
            }
        },
        {
            "name": "MONOCYTES",
            "value": 0,
            "unit": "%",
            "status": "low",
            "ref_range": {
                "low": 2,
                "high": 10
            }
        },
        {
            "name": "BASOPHILS",
            "value": 0,
            "unit": "%",
            "status": "normal",
            "ref_range": {
                "low": 0,
                "high": 2
            }
        },
        {
            "name": "HAEMOGLOBIN",
            "value": 14.3,
            "unit": "gms/dl",
            "status": "normal",
            "ref_range": {
                "low": 11.5,
                "high": 16.5
            }
        },
        {
            "name": "RBC COUNT",
            "value": 3.9,
            "unit": "Millions/cu mm",
            "status": "normal",
            "ref_range": {
                "low": 3.5,
                "high": 5.5
            }
        },
        {
            "name": "PCV-HAEMATOCRIT",
            "value": 40,
            "unit": "%",
            "status": "normal",
            "ref_range": {
                "low": 35,
                "high": 55
            }
        },
        {
            "name": "MCV",
            "value": 103,
            "unit": "fl",
            "status": "high",
            "ref_range": {
                "low": 75,
                "high": 100
            }
        },
        {
            "name": "MCH",
            "value": 36,
            "unit": "pg",
            "status": "high",
            "ref_range": {
                "low": 27,
                "high": 32
            }
        },
        {
            "name": "MCHC",
            "value": 35,
            "unit": "%",
            "status": "normal",
            "ref_range": {
                "low": 31,
                "high": 38
            }
        },
        {
            "name": "PLATELET COUNT",
            "value": 247000,
            "unit": "cells.cu/mm",
            "status": "normal",
            "ref_range": {
                "low": 130000,
                "high": 400000
            }
        },
        {
            "name": "ESR 30 MINS",
            "value": 3,
            "unit": "mm/hr",
            "status": "normal",
            "ref_range": {
                "low": 0,
                "high": 15
            }
        },
        {
            "name": "ESR 60 MINS",
            "value": 8,
            "unit": "mm/hr",
            "status": "normal",
            "ref_range": {
                "low": 0,
                "high": 15
            }
        }
    ],
    "summary": "Your results show a low monocyte count, and high MCV and MCH levels.",
    "explanations": [
        "Low monocytes can sometimes be seen with certain infections or conditions affecting the bone marrow.",
        "High MCV (mean corpuscular volume) means your red blood cells are larger than average, which can be due to various reasons like vitamin deficiencies.",
        "High MCH (mean corpuscular hemoglobin) means your red blood cells contain more hemoglobin than average, often seen when MCV is also high."
    ],
    "confidence": 0.9,
    "normalizationConfidence": 0.95
}

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
##### If guardrail is triggered:
```bash
{
  "status": "unprocessed",
  "reason": "hallucinated tests not present in input"
}
```
#### Guardrails & Error Handling
##### Guardrails:

Checks if all normalized test names are present in the raw input (substring or AI validation).
If hallucination detected, returns status: "unprocessed".
##### Error Handling:

All errors return JSON with status: "error" and a descriptive message.

#### API Endpoint For testing :
#### Use This Link For API Testing in postman or anywhere
https://ai-powered-medicaltest-report-analyser-yew7.onrender.com/api/simplify-report

#### Live website Demo Instance
https://ai-powered-medicaltest-report-analyser.onrender.com/

