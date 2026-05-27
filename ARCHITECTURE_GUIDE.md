# AIExtracter - Complete Architecture: Frontend & Backend Design Spec

## EXECUTIVE SUMMARY

**AIExtracter** is a full-stack document intelligence platform with:
- **Frontend**: React-based UI for document upload, AI extraction, verification, and cloud integration
- **Backend**: API service for PDF processing, AI extraction, history management, and cloud authentication
- This document aligns frontend requirements with backend implementation strategy

---

# PART 1: FRONTEND ARCHITECTURE (Reference)

## Frontend Overview

**Tech Stack**: React 19, Lucide Icons, XLSX Export, CSS Variables
**API Base**: `http://localhost:5000/api`
**Entry Point**: `frontend/app/src/App.js`

### Component Hierarchy
```
App.js
└── DocExtract.js (Main Router)
    ├── File Upload UI
    ├── Preset Templates (6 types)
    ├── Extraction Progress
    ├── Results Display
    ├── Dashboard.js (Metrics)
    ├── history.js (Export/Review)
    └── integration.js (Cloud Storage)
```

### State Management (React Hooks)
```javascript
// File & Upload
const [file, setFile]                    // PDF file object
const [dragging, setDragging]            // Drag-and-drop state

// Extraction Configuration
const [selectedPreset, setSelectedPreset] // Selected template (6 types)
const [dataPoints, setDataPoints]        // Array of fields to extract
const [newField, setNewField]            // Custom field name
const [newPrompt, setNewPrompt]          // Custom extraction prompt

// Extraction Execution
const [loading, setLoading]              // Extraction in progress
const [prog, setProg]                    // Progress: 0-100%
const [error, setError]                  // Error message
const [result, setResult]                // Extracted results object

// UI State
const [view, setView]                    // View mode: upload/extract/results
const [expanded, setExpanded]            // Result panel expansion
const [verifyMode, setVerifyMode]        // Edit extracted data mode
const [copiedJSON, setCopiedJSON]        // Copy feedback
const [withPrompts, setWithPrompts]      // Include prompts in export

// Dashboard
const [historyItems, setHistoryItems]    // Extraction history list
const [dashboardMetrics, setDashboardMetrics] // Aggregated metrics
const [reviewItem, setReviewItem]        // Item under review
```

### Preset Templates (Frontend-Defined)

**1. PRESETS_POLICY_CHECKING** (Insurance)
- Policy Number
- Name Insured
- Policy Period
- Premium
- Issuing Company
- Mailing Address
- Deductible
- Endorsements
- Forms & Endorsements

**2. PRESETS_FINANCE** (Financial Statements)
- Revenue, Net Income, Gross Profit
- Operating Income, EBITDA, COGS
- Total Debt, Interest Expense
- Cash & Equivalents, Operating Cash Flow
- CapEx, Free Cash Flow
- Total Assets/Liabilities
- Current Assets/Liabilities
- Company Name, Fiscal Year

**3. PRESETS_HEALTHCARE_DOCUMENTS** (Medical Records)
- Patient Name, Patient ID/UHID
- Demographics (Age, Gender)
- Hospital Name, Doctor Name
- Admission/Discharge Dates
- Diagnosis, Treatment
- Room/Medicine/Lab/Surgery Charges
- Insurance Provider, Policy Number
- Claims & Approvals
- Discharge Summary, Follow-up

**4. PRESETS_MSA_EXTRACTION** (Contracts)
- Agreement Title, Dates, Parties
- Scope of Services, SLAs
- Terms, Renewal, Payment Terms
- Fees, Invoicing
- Termination, Confidentiality
- Liability, IP Rights, Compliance
- Dispute Resolution, Governing Law
- Signatories

**5. PRESETS_SOW_EXTRACTION** (Project Docs)
- Scope of Work, Deliverables
- Milestones, Timeline
- Location, Resources
- Responsibilities, Dependencies
- Pricing Model, Fees
- Payment Schedule, Acceptance Criteria
- Change Management, Risks
- SLAs, Signatories

**6. PRESETS_GENERAL_AGREEMENTS** (Generic Contracts)
- Parties, Addresses
- Terms & Conditions
- Scope of Agreement

---

## Frontend User Interface Flows

### Flow 1: Document Extraction
```
User Opens App
    ↓
Sees Upload Screen (Drag & Drop)
    ↓
Selects/Drops PDF File
    ↓
Selects Preset Template (or adds custom fields)
    ↓
Clicks "Extract" Button
    ↓
POST /api/extract → Backend
    ↓
Real-time Progress Updates (0-100%)
    ↓
Results Displayed in JSON View
    ↓
User Options:
  • Verify Mode (edit values)
  • Export to Excel
  • Copy JSON
  • Save to History
```

### Flow 2: Dashboard & History
```
User Clicks Dashboard Tab
    ↓
Fetch /api/history → Display records
Fetch /api/result_status → Display metrics
    ↓
Displays:
  • Total Extractions
  • Fields Approved
  • Fields Flagged
  • Pending Review
  • Recent Items (10/page)
    ↓
User Options:
  • View PDF + Results (Review)
  • Export to Excel
  • Delete Record
```

### Flow 3: Cloud Integration
```
User Clicks Integration Tab
    ↓
Selects Provider (Google Drive or OneDrive)
    ↓
If NOT Connected:
  • Click "Connect"
  • Redirected to OAuth Login
  • Returns with token
    ↓
Fetch /api/drive/files or /api/onedrive/files
    ↓
Display available files
    ↓
User selects file
    ↓
POST /api/extract-from-drive (or /onedrive/extract)
    ↓
Extraction proceeds (same as local upload)
    ↓
If Disconnected:
  • Revoke token
  • Clear stored credentials
```

---

# PART 2: BACKEND ARCHITECTURE & DESIGN SPECIFICATION

## Backend Overview

**Purpose**: Process PDFs, extract data using AI, manage history, handle cloud authentication
**Framework**: Python (Flask) or Node.js (Express)
**Port**: 5000
**Database**: SQLite/PostgreSQL for history storage
**External APIs**: Google Drive API, Microsoft Graph API

---

## Backend Technology Stack (Recommended)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Flask / Express.js | REST API server |
| PDF Processing | PyPDF2 / pdfplumber | Extract text from PDFs |
| AI Extraction | OpenAI GPT / Claude API | Extract structured data |
| Database | SQLite / PostgreSQL | Persist extraction history |
| OAuth2 | python-oauth2 / passport.js | Google & Microsoft auth |
| File Storage | Local filesystem / S3 | Store uploaded PDFs |
| Async Processing | Celery / Bull | Background extraction jobs |
| Logging | Python logging / Winston | Error tracking |

---

## Backend Database Schema

### Table: extraction_history
```sql
CREATE TABLE extraction_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pdf_filename VARCHAR(255) NOT NULL UNIQUE,
  file_path VARCHAR(512) NOT NULL,
  file_size INTEGER,
  upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Extraction metadata
  preset_type VARCHAR(100),  -- 'policy', 'finance', 'healthcare', 'msa', 'sow', 'general'
  data_points JSON,          -- Array of requested fields
  
  -- Results
  results JSON,              -- Extracted data object
  extraction_status VARCHAR(50),  -- 'pending', 'completed', 'failed'
  extraction_timestamp DATETIME,
  error_message TEXT,
  
  -- Verification
  review_status VARCHAR(50),  -- 'pending', 'approved', 'flagged'
  reviewed_by VARCHAR(255),
  reviewed_timestamp DATETIME,
  manual_corrections JSON,    -- User-edited values
  
  -- Metadata
  source VARCHAR(50),         -- 'upload', 'google_drive', 'onedrive'
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_pdf_filename ON extraction_history(pdf_filename);
CREATE INDEX idx_upload_timestamp ON extraction_history(upload_timestamp);
CREATE INDEX idx_review_status ON extraction_history(review_status);
```

### Table: users
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

### Table: oauth_tokens
```sql
CREATE TABLE oauth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50),  -- 'google' or 'microsoft'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, provider)
);
```

### Table: cloud_files
```sql
CREATE TABLE cloud_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50),  -- 'google' or 'microsoft'
  cloud_file_id VARCHAR(255),
  file_name VARCHAR(255),
  file_size INTEGER,
  synced_at DATETIME,
  extraction_id INTEGER,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (extraction_id) REFERENCES extraction_history(id)
);
```

---

## Backend API Specifications

### Core Extraction Endpoint

#### **POST /api/extract**
**Purpose**: Extract data from uploaded PDF

**Frontend Request**:
```javascript
const formData = new FormData();
formData.append('file', file);  // PDF file object
formData.append('preset', selectedPreset);  // 'policy' | 'finance' | 'healthcare' | 'msa' | 'sow' | 'general'
formData.append('dataPoints', JSON.stringify(dataPoints));  // Array of field objects
formData.append('withPrompts', withPrompts);  // boolean

fetch('http://localhost:5000/api/extract', {
  method: 'POST',
  body: formData
})
```

**Backend Processing**:
1. Save uploaded PDF to `uploads/{timestamp}_{filename}`
2. Extract text from PDF using PyPDF2/pdfplumber
3. For each dataPoint, call AI API with:
   ```
   {
     "field": "Policy Number",
     "prompt": "Extract the policy number exactly as it appears...",
     "document_text": [extracted_pdf_text],
     "preset": "policy"
   }
   ```
4. Stream progress updates to frontend (progress: 0-100%)
5. Aggregate results into structured object
6. Store in `extraction_history` table
7. Return results JSON

**Frontend Response** (Streaming):
```javascript
// Progress Update (sent every few seconds)
{
  "status": "extracting",
  "progress": 45,
  "current_field": "Policy Number",
  "message": "Extracting field 3 of 9..."
}

// Final Response
{
  "status": "completed",
  "progress": 100,
  "id": 12345,
  "results": {
    "Policy Number": "POL-2024-001234",
    "Name Insured": "John Doe",
    "Policy Period": "01/01/2024 to 12/31/2024",
    "Premium": "$2,500",
    "Issuing Company": "ABC Insurance Co.",
    ...
  },
  "extraction_timestamp": "2026-05-08T14:30:00Z"
}
```

---

### History & Metrics Endpoints

#### **GET /api/history**
**Purpose**: Fetch all extraction records

**Backend Logic**:
1. Query `extraction_history` table (order by upload_timestamp DESC)
2. Join with `users` table if needed
3. Limit to 100 recent records (pagination support)
4. Include: id, pdf_filename, results summary, review_status, extraction_timestamp

**Response**:
```javascript
{
  "history": [
    {
      "id": 12345,
      "pdf_filename": "invoice_2024.pdf",
      "preset": "finance",
      "review_status": "approved",
      "extraction_timestamp": "2026-05-08T14:30:00Z",
      "results": { /* full extracted data */ },
      "manual_corrections": null
    },
    ...
  ],
  "total": 45
}
```

---

#### **GET /api/result_status**
**Purpose**: Get aggregated metrics for dashboard

**Backend Logic**:
1. Count total PDF files: `SELECT COUNT(*) FROM extraction_history`
2. Count by status:
   ```sql
   SELECT 
     review_status, 
     COUNT(*) as count 
   FROM extraction_history 
   GROUP BY review_status
   ```
3. Return aggregated counts

**Response**:
```javascript
{
  "pdf_files_count": 147,
  "status_count": {
    "approved": 120,
    "flagged": 15,
    "pending": 12
  }
}
```

---

#### **DELETE /api/history/delete_pdf/{id}**
**Purpose**: Delete extraction record (soft delete)

**Backend Logic**:
1. Validate ID exists
2. Mark record as deleted OR set extraction_status to 'deleted'
3. Optional: Archive PDF file instead of hard delete
4. Log deletion with timestamp

**Response**:
```javascript
{
  "success": true,
  "message": "Record deleted successfully",
  "id": 12345
}
```

---

#### **GET /api/pdf/{filename}**
**Purpose**: Retrieve PDF file for browser viewing

**Backend Logic**:
1. Validate filename (security: no path traversal)
2. Locate file in uploads directory
3. Return with MIME type: `application/pdf`
4. Add headers: `Content-Disposition: inline`

**Response**: Binary PDF blob

---

### Cloud Integration Endpoints

#### **GET /auth/google**
**Purpose**: Initiate Google OAuth flow

**Backend Logic**:
1. Generate OAuth 2.0 authorization URL with scopes: `drive.readonly`
2. Include client_id, redirect_uri, state (CSRF token)
3. Redirect to Google login page

**Flow**:
```
User clicks "Connect Google Drive"
  ↓
Frontend redirects to /auth/google
  ↓
Backend generates OAuth URL
  ↓
User logs in with Google account
  ↓
Google redirects to /auth/google/callback?code=...&state=...
  ↓
Backend exchanges code for access token
  ↓
Store token in oauth_tokens table
  ↓
Redirect to frontend with success
```

---

#### **GET /auth/google/callback**
**Purpose**: Handle OAuth callback from Google

**Backend Logic**:
1. Validate state parameter (CSRF protection)
2. Exchange authorization code for access token:
   ```python
   token = google.oauth2.exchange_code(code)
   ```
3. Create user record if new
4. Store token in `oauth_tokens` table
5. Set session/cookie with user_id
6. Redirect to frontend dashboard

**Response**: Redirect to `/` with success message

---

#### **GET /auth/status**
**Purpose**: Check Google Drive connection status

**Backend Logic**:
1. Check if user has valid oauth_token for 'google'
2. If expired, attempt refresh with refresh_token
3. Validate token still works (optional: make test API call)
4. Return connection status

**Response**:
```javascript
{
  "connected": true,
  "provider": "google",
  "email": "user@gmail.com",
  "token_expiry": "2026-05-15T14:30:00Z"
}
```

---

#### **GET /drive/files**
**Purpose**: List files from Google Drive

**Backend Logic**:
1. Get user's access token from session
2. Call Google Drive API:
   ```python
   service.files().list(
     pageSize=50,
     spaces='drive',
     fields='files(id, name, mimeType, createdTime, size)',
     q="mimeType='application/pdf' and trashed=false"
   )
   ```
3. Filter for PDF files only
4. Cache results (5-minute TTL)

**Response**:
```javascript
{
  "files": [
    {
      "id": "1A2B3C4D5E",
      "name": "invoice_2024.pdf",
      "size": 245000,
      "createdTime": "2026-05-08T10:00:00Z"
    },
    ...
  ]
}
```

---

#### **POST /api/extract-from-drive**
**Purpose**: Extract data from Google Drive file

**Frontend Request**:
```javascript
{
  "fileId": "1A2B3C4D5E",
  "fileName": "invoice_2024.pdf",
  "preset": "finance",
  "dataPoints": [ /* field array */ ]
}
```

**Backend Logic**:
1. Get user's access token
2. Download file from Google Drive:
   ```python
   request = service.files().get_media(fileId=fileId)
   file_content = request.execute()
   ```
3. Save to temporary location
4. Process as normal extraction (same as /api/extract)
5. Store source='google_drive' in extraction_history
6. Store cloud_file_id for reference

**Response**: Same as /api/extract (streaming progress + results)

---

#### **POST /auth/disconnect**
**Purpose**: Disconnect Google Drive

**Backend Logic**:
1. Get user_id from session
2. Revoke access token if possible:
   ```python
   google.oauth2.revoke_token(access_token)
   ```
3. Delete from `oauth_tokens` table
4. Clear session

**Response**:
```javascript
{
  "success": true,
  "message": "Disconnected from Google Drive"
}
```

---

### OneDrive Integration Endpoints

**Similar to Google Drive with Microsoft Graph API**:

#### **GET /auth/microsoft**
- Initialize Microsoft OAuth with scope: `Files.Read`

#### **GET /onedrive/auth/status**
- Check Microsoft connection status

#### **GET /onedrive/files**
- List PDF files from OneDrive
- API: `https://graph.microsoft.com/v1.0/me/drive/root/children`

#### **POST /onedrive/extract**
- Extract from OneDrive file
- Download via Microsoft Graph API

#### **POST /onedrive/auth/disconnect**
- Revoke Microsoft token

---

## Backend File Structure (Python Flask Example)

```
backend/
├── app.py                 # Main Flask app & route definitions
├── config.py              # Configuration (DB path, API keys, etc.)
├── requirements.txt       # Python dependencies
├── models.py              # SQLAlchemy ORM models
├── database.py            # Database initialization & queries
├── webhook.py             # Webhook handlers
├── handwritten.py         # OCR for handwritten text (optional)
│
├── routes/
│   ├── __init__.py
│   ├── extraction.py      # POST /api/extract, GET /api/pdf
│   ├── history.py         # GET /api/history, DELETE /api/history/delete_pdf
│   ├── dashboard.py       # GET /api/result_status
│   ├── integration.py     # Cloud integration routes
│   ├── oneDrive.py        # OneDrive-specific routes
│   └── templates_tab.py   # Template management (future)
│
├── services/
│   ├── pdf_processor.py   # Extract text from PDF
│   ├── ai_extractor.py    # Call AI API (OpenAI/Claude)
│   ├── google_drive.py    # Google Drive API wrapper
│   ├── onedrive.py        # OneDrive API wrapper
│   └── auth_service.py    # OAuth token management
│
├── utils/
│   ├── validators.py      # Input validation
│   ├── formatters.py      # Format output data
│   └── logger.py          # Logging utility
│
├── uploads/               # Temporary PDF storage
├── logs/                  # Application logs
├── instance/              # SQLite database
└── tests/                 # Unit & integration tests
```

---

## Backend Request/Response Flow

### Extraction Flow (Detailed)

```
1. User Uploads PDF (Frontend)
   ↓
2. Frontend: POST /api/extract with FormData
   ↓
3. Backend: Save file to uploads/{timestamp}_{filename}
   ↓
4. Backend: Extract text from PDF
   ├─ Read PDF bytes
   ├─ Use PyPDF2/pdfplumber to extract text
   ├─ Clean & normalize text
   └─ Detect language (optional)
   ↓
5. Backend: For each dataPoint in dataPoints array:
   ├─ Construct AI prompt:
      {
        "system": "You are a document extraction expert.",
        "user": "Extract [field] from this document text: [pdf_text]",
        "instructions": [specific_prompt_from_frontend],
        "format": "Return only the extracted value, no explanations"
      }
   ├─ Call AI API (OpenAI GPT-4, Claude, etc.)
   ├─ Parse AI response
   ├─ Validate extracted value (type checking, format)
   ├─ Send progress update: {progress: X%, current_field: "..."}
   └─ Store result in results object
   ↓
6. Backend: Create extraction_history record
   ├─ INSERT into extraction_history
   ├─ Set review_status = 'pending'
   ├─ Store results JSON
   └─ Log extraction metadata
   ↓
7. Backend: Return final response
   {
     "status": "completed",
     "progress": 100,
     "id": 12345,
     "results": { /* all extracted fields */ }
   }
   ↓
8. Frontend: Display results in JSON viewer
   ↓
9. User: Verify, edit, export, or save
```

---

## AI Extraction Service Implementation

### Pseudo-Code (Python)

```python
class AIExtractor:
    def __init__(self, api_key, model='gpt-4'):
        self.client = OpenAI(api_key=api_key)
        self.model = model
    
    def extract_field(self, pdf_text, field_name, prompt, preset_type):
        """Extract single field from document text"""
        
        # Build system prompt based on preset
        system_prompt = self._get_system_prompt(preset_type)
        
        # Build user message
        user_message = f"""
        FIELD: {field_name}
        INSTRUCTION: {prompt}
        
        DOCUMENT TEXT:
        {pdf_text}
        
        Extract the requested field exactly as instructed.
        Return only the extracted value, no explanations.
        If not found, return null.
        """
        
        # Call API
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3,  # Low temp for consistency
            max_tokens=500
        )
        
        # Parse response
        extracted_value = response.choices[0].message.content.strip()
        
        # Post-process based on field type
        return self._validate_and_format(extracted_value, field_name, preset_type)
    
    def _get_system_prompt(self, preset_type):
        """Return system prompt for preset"""
        prompts = {
            'policy': "You are an insurance expert extracting policy details...",
            'finance': "You are a financial analyst extracting financial metrics...",
            'healthcare': "You are a medical record specialist extracting patient data...",
            'msa': "You are a legal expert extracting contract clauses...",
            # ... etc
        }
        return prompts.get(preset_type, "You are a document extraction expert.")
    
    def _validate_and_format(self, value, field_name, preset_type):
        """Validate and format extracted value"""
        
        if value.lower() == 'null' or not value:
            return None
        
        # Apply type validation based on field
        if 'amount' in field_name.lower() or 'price' in field_name.lower():
            # Extract numeric value
            return self._extract_number(value)
        
        elif 'date' in field_name.lower():
            # Parse and format date
            return self._parse_date(value)
        
        elif 'array' in field_name.lower():
            # Parse as JSON array
            try:
                return json.loads(value)
            except:
                return value.split(',')
        
        return value
```

---

## Backend Error Handling Strategy

### Error Response Format

```javascript
// 400 - Bad Request
{
  "success": false,
  "error": "Invalid file format. Only PDF files are supported.",
  "error_code": "INVALID_FILE_TYPE",
  "status": 400
}

// 401 - Unauthorized
{
  "success": false,
  "error": "Authentication required. Please log in.",
  "error_code": "UNAUTHORIZED",
  "status": 401
}

// 403 - Forbidden
{
  "success": false,
  "error": "You do not have access to this file.",
  "error_code": "FORBIDDEN",
  "status": 403
}

// 404 - Not Found
{
  "success": false,
  "error": "Extraction record not found.",
  "error_code": "NOT_FOUND",
  "status": 404
}

// 500 - Internal Server Error
{
  "success": false,
  "error": "An unexpected error occurred during extraction.",
  "error_code": "EXTRACTION_FAILED",
  "details": "[error details for logging]",
  "status": 500
}
```

---

## Backend Security Measures

1. **CORS Configuration**:
   ```python
   CORS(app, 
     origins=['http://localhost:3000', 'https://yourdomain.com'],
     allow_headers=['Content-Type', 'Authorization'],
     allow_methods=['GET', 'POST', 'DELETE'],
     supports_credentials=True
   )
   ```

2. **Input Validation**:
   - File type check (PDF only)
   - File size limits (e.g., max 50MB)
   - Filename sanitization (no path traversal)
   - JSON schema validation for dataPoints

3. **Authentication**:
   - Session-based auth for local users
   - OAuth tokens for cloud services
   - Secure token storage (hashed in DB)
   - Token refresh logic

4. **Authorization**:
   - Check user_id matches extraction owner
   - Prevent access to other users' files
   - Role-based access control (future)

5. **Rate Limiting**:
   ```python
   limiter = Limiter(app)
   limiter.limit("100 per hour")(extraction_routes)
   ```

6. **Logging & Monitoring**:
   - Log all extraction attempts
   - Track errors and failures
   - Monitor API performance
   - Alert on suspicious activity

---

## Backend Deployment Architecture

```
Production Server
├── Load Balancer (Nginx)
├── API Container 1 (Flask/Express)
├── API Container 2 (Flask/Express)
├── API Container 3 (Flask/Express)
│
├── Background Job Queue (Celery/Bull)
│   ├── Worker 1 (PDF Processing)
│   ├── Worker 2 (AI Extraction)
│   └── Worker 3 (Cloud Sync)
│
├── Database Server
│   ├── PostgreSQL (Primary)
│   └── PostgreSQL (Replica - read-only)
│
├── Cache Layer (Redis)
│   ├── Session cache
│   ├── Token cache
│   └── File cache
│
├── File Storage
│   ├── Local: /data/uploads (or S3)
│   └── Backup: S3/GCS
│
└── Monitoring & Logging
    ├── Sentry (error tracking)
    ├── Datadog (metrics)
    ├── ELK Stack (logging)
    └── Grafana (dashboards)
```

---

## Backend Configuration (config.py Example)

```python
import os

class Config:
    # Server
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-prod')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///instance/aiextracter.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # API Configuration
    API_BASE_URL = 'http://localhost:5000/api'
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    # AI API
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    AI_MODEL = os.getenv('AI_MODEL', 'gpt-4')
    
    # File Upload
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    ALLOWED_EXTENSIONS = {'pdf'}
    
    # OAuth
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    GOOGLE_REDIRECT_URI = f'{API_BASE_URL}/auth/google/callback'
    
    MICROSOFT_CLIENT_ID = os.getenv('MICROSOFT_CLIENT_ID')
    MICROSOFT_CLIENT_SECRET = os.getenv('MICROSOFT_CLIENT_SECRET')
    MICROSOFT_REDIRECT_URI = f'{API_BASE_URL}/auth/microsoft/callback'
    
    # Session
    SESSION_COOKIE_SECURE = FLASK_ENV == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 7 * 24 * 60 * 60  # 7 days
    
    # CORS
    CORS_ORIGINS = [FRONTEND_URL]
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = 'logs/app.log'
```

---

## Backend Testing Strategy

### Unit Tests
```python
# test_ai_extractor.py
def test_extract_policy_number():
    extractor = AIExtractor()
    pdf_text = "Policy Number: POL-2024-001234"
    result = extractor.extract_field(
        pdf_text,
        'Policy Number',
        'Extract the policy number exactly...',
        'policy'
    )
    assert result == 'POL-2024-001234'

# test_database.py
def test_save_extraction():
    extraction = ExtractionHistory(
        pdf_filename='test.pdf',
        results={'field1': 'value1'},
        review_status='pending'
    )
    db.session.add(extraction)
    db.session.commit()
    
    found = ExtractionHistory.query.filter_by(pdf_filename='test.pdf').first()
    assert found is not None
    assert found.results['field1'] == 'value1'
```

### Integration Tests
```python
# test_extraction_flow.py
def test_full_extraction_flow(test_client):
    # Upload PDF
    response = test_client.post('/api/extract',
        data={'file': test_pdf_file, 'preset': 'finance'}
    )
    assert response.status_code == 200
    result = response.get_json()
    
    # Verify ID returned
    assert 'id' in result
    
    # Fetch from history
    response = test_client.get('/api/history')
    assert response.status_code == 200
    history = response.get_json()
    assert any(h['id'] == result['id'] for h in history['history'])
```

---

## Backend API Integration Checklist

Frontend Requirements → Backend Implementation:

- [x] POST /api/extract - Accept PDF, extract data, stream progress
- [x] GET /api/history - Return extraction records with pagination
- [x] GET /api/result_status - Return aggregated metrics
- [x] DELETE /api/history/delete_pdf/{id} - Soft delete records
- [x] GET /api/pdf/{filename} - Return PDF blob for viewing
- [x] GET /auth/google - Initiate Google OAuth
- [x] GET /auth/google/callback - Handle OAuth callback
- [x] GET /auth/status - Check connection status
- [x] GET /drive/files - List Google Drive PDFs
- [x] POST /api/extract-from-drive - Extract from Google Drive
- [x] POST /auth/disconnect - Revoke Google token
- [x] GET /auth/microsoft - Initiate Microsoft OAuth
- [x] GET /onedrive/auth/status - Check OneDrive status
- [x] GET /onedrive/files - List OneDrive PDFs
- [x] POST /onedrive/extract - Extract from OneDrive
- [x] POST /onedrive/auth/disconnect - Revoke Microsoft token

---

## Environment Variables (.env)

```bash
# Server
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
DEBUG=False

# Database
DATABASE_URL=postgresql://user:password@localhost/aiextracter_db

# AI APIs
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4

# OAuth - Google
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=client-id-here
MICROSOFT_CLIENT_SECRET=secret-here

# URLs
API_BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# File Storage
MAX_FILE_SIZE=52428800
UPLOAD_FOLDER=/data/uploads

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/aiextracter/app.log
```

---

## Performance Optimization Strategies

### Backend Optimizations

1. **Database Query Optimization**:
   - Add indexes on frequently queried columns
   - Use pagination for large result sets
   - Cache frequently accessed data (Redis)

2. **AI API Optimization**:
   - Batch multiple extractions in single API call
   - Implement caching for identical prompts
   - Use lower temperature (0.3) for consistency
   - Implement timeout and retry logic

3. **File Processing**:
   - Stream PDF processing instead of loading entire file
   - Implement file compression for storage
   - Use async/background jobs for long extractions

4. **API Response**:
   - Compress responses (gzip)
   - Implement CDN caching
   - Return only required fields
   - Paginate large datasets

### Frontend Optimizations

1. **Component Rendering**:
   - Use React.memo for expensive components
   - Implement lazy loading for routes
   - Optimize re-renders with proper key props

2. **State Management**:
   - Use useCallback for event handlers
   - Use useMemo for expensive computations
   - Debounce file upload handler

3. **Network**:
   - Stream extraction progress (avoid large updates)
   - Implement request caching
   - Use compression for uploads

4. **Bundle**:
   - Code splitting for components
   - Tree shake unused dependencies
   - Lazy load heavy libraries (XLSX on demand)

---

## Monitoring & Alerting

### Metrics to Track

**Backend**:
- API response time (by endpoint)
- Error rate (by error type)
- PDF extraction success rate
- Average extraction time per preset
- AI API costs and usage
- Database query performance
- File upload sizes and frequency

**Frontend**:
- Page load time
- Component render time
- API call latency
- User interactions
- Error tracking (Sentry)
- Web Vitals (CLS, LCP, FID)

### Alerts

- Extraction failure rate > 5%
- API response time > 5 seconds
- AI API quota exceeded
- Database connection errors
- File storage space low
- OAuth token refresh failures

---

## Roadmap & Future Enhancements

### Phase 1 (Current)
- [x] PDF text extraction
- [x] AI-based field extraction
- [x] 6 preset templates
- [x] History management
- [x] Cloud integration (Google Drive, OneDrive)

### Phase 2
- [ ] Batch processing (multiple files)
- [ ] Custom template builder
- [ ] Advanced search & filtering
- [ ] Export to multiple formats (CSV, JSON, API)
- [ ] Scheduled extractions
- [ ] Webhook notifications

### Phase 3
- [ ] Handwritten text recognition (OCR)
- [ ] Document classification
- [ ] Entity linking & relationship extraction
- [ ] Version control for extractions
- [ ] Audit logs & compliance reports
- [ ] API rate limiting & tier management

### Phase 4
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced ML for field validation
- [ ] Real-time collaboration
- [ ] Workflow automation
- [ ] Marketplace for templates

---

## Summary: Frontend-Backend Alignment

| Frontend Requirement | Backend Implementation |
|----------------------|----------------------|
| PDF Upload | POST /api/extract with file handling |
| Progress Tracking | Streaming progress updates (0-100%) |
| Preset Templates | 6 predefined templates in backend |
| Custom Fields | Dynamic dataPoints array processing |
| Result Display | JSON structure matching frontend expectations |
| History Access | GET /api/history with pagination |
| Metrics Dashboard | GET /api/result_status with aggregated counts |
| Cloud Integration | OAuth + API wrappers for Google/Microsoft |
| Result Export | Excel generation from stored results |
| Error Handling | Consistent error response format |

---

## Conclusion

This document provides:
1. **Complete Frontend Architecture** - Components, state, UI flows
2. **Backend Design Specification** - Database schema, API endpoints, workflow
3. **Implementation Strategy** - Code structure, configuration, testing
4. **Production Readiness** - Security, performance, monitoring

**Next Steps**:
1. Implement backend services (AI extraction, OAuth, database)
2. Create API endpoints following specifications
3. Test frontend-backend integration
4. Deploy to production infrastructure
5. Monitor metrics and iterate

---

**Document Version**: 1.0
**Date**: May 8, 2026
**Status**: Complete
