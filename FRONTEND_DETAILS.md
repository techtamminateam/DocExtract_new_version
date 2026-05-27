# AIExtracter Frontend - Comprehensive Details

## PROJECT OVERVIEW
**AIExtracter Frontend** is a React-based document intelligence platform that enables users to upload PDF documents, extract specific data fields using AI-powered extraction, integrate with cloud storage services, and manage extraction results with comprehensive analytics.

**Core Purpose**: Intelligent document data extraction with verification, export, and cloud synchronization capabilities.

---

## TECHNOLOGY STACK

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 19.2.5 |
| Build Tool | Create React App (react-scripts) | 5.0.1 |
| UI Icons | Lucide React | 1.8.0 |
| Data Export | XLSX (Excel) | 0.18.5 |
| Testing | React Testing Library | 16.3.2 |
| Backend API | REST (Node/Python) | localhost:5000 |

**Fonts**: Syne, Inter, Space Mono (Google Fonts)
**Browser Support**: Chrome, Firefox, Safari (latest versions)

---

## PROJECT STRUCTURE

```
frontend/app/
├── public/
│   ├── index.html           # HTML template
│   ├── manifest.json        # PWA manifest
│   ├── robots.txt           # SEO
│   └── favicon.ico          # Branding
├── src/
│   ├── App.js               # Root component
│   ├── App.css              # Not used (legacy)
│   ├── App.test.js          # App tests
│   ├── index.js             # React entry point
│   ├── index.css            # Global styles
│   ├── reportWebVitals.js   # Performance metrics
│   ├── setupTests.js        # Test configuration
│   │
│   ├── DocExtract.js        # Main extraction UI component
│   ├── DocExtract.css       # Extraction UI styles
│   │
│   ├── Dashboard.js         # Metrics & analytics dashboard
│   ├── Dashboard.css        # Dashboard styles
│   │
│   ├── history.js           # Export, review, delete functions
│   ├── history.css          # History view styles
│   │
│   ├── integration.js       # Cloud storage (Google Drive, OneDrive)
│   ├── integration.css      # Integration UI styles
│   │
│   └── [Other CSS files]    # Component-specific styles
├── package.json             # Dependencies & scripts
└── README.md                # CRA boilerplate documentation
```

---

## COMPONENT ARCHITECTURE

### **1. App.js** (Entry Point)
```javascript
// Simple wrapper component
import DocExtract from './DocExtract';

function App() {
  return <DocExtract />;
}

export default App;
```
- **Purpose**: Root component that bootstraps the application
- **Renders**: DocExtract component

---

### **2. DocExtract.js** (Main Component - ~800+ lines)
**Purpose**: Central hub for all document extraction operations

#### State Variables
```javascript
const [file, setFile]                      // Current PDF upload
const [dataPoints, setDataPoints]          // Array of extraction fields
const [newField, setNewField]              // New custom field input
const [newPrompt, setNewPrompt]            // Custom extraction prompt
const [dragging, setDragging]              // Drag-and-drop state
const [expanded, setExpanded]              // Result panel expansion
const [result, setResult]                  // Extracted results object
const [view, setView]                      // View mode (upload/extract/results)
const [loading, setLoading]                // Extraction in progress flag
const [prog, setProg]                      // Progress percentage
const [error, setError]                    // Error message
const [selectedPreset, setSelectedPreset]  // Active preset template
const [verifyMode, setVerifyMode]          // Manual verification toggle
const [copiedJSON, setCopiedJSON]          // Copy-to-clipboard feedback
const [withPrompts, setWithPrompts]        // Include prompts in export
```

#### Key Features

**A. Drag & Drop File Upload**
- Accept PDF files only
- Set upload view on file selection
- Visual feedback during drag operation

**B. Preset Templates** (6 Categories)

1. **PRESETS_POLICY_CHECKING** - Insurance Documents
   - Fields: Policy Number, Name Insured, Policy Period, Premium, Issuing Company, Mailing Address, Deductible, Endorsements, Forms & Endorsements
   - AI prompts for precise extraction

2. **PRESETS_FINANCE** - Financial Statements
   - Fields: Revenue, Net Income, Gross Profit, Operating Income, EBITDA, COGS, Total Debt, Interest Expense, Cash & Equivalents, Operating Cash Flow, CapEx, Free Cash Flow, Total Assets/Liabilities, Current Assets/Liabilities, Company Name, Fiscal Year
   - Balance sheet and P&L extraction

3. **PRESETS_HEALTHCARE_DOCUMENTS** - Medical Records
   - Fields: Patient Name, Patient ID/UHID, Demographics, Hospital Name, Doctor Name, Admission/Discharge Dates, Diagnosis, Treatment, Charges (room, medicine, lab, surgery), Insurance Details, Claims, Discharge Summary, Follow-up
   - Medical data extraction

4. **PRESETS_MSA_EXTRACTION** - Master Service Agreements
   - Fields: Title, Dates, Party Info, Scope, SLA, Terms, Pricing, Payment Terms, Termination, Confidentiality, Liability, IP Rights, Data Protection, Compliance, Dispute Resolution, Governing Law, Force Majeure, Penalties, Signatories
   - Contract clause extraction

5. **PRESETS_SOW_EXTRACTION** - Statement of Work
   - Fields: Scope of Work, Deliverables, Milestones, Timeline, Location, Resources, Responsibilities, Pricing, Payment Schedule, Acceptance Criteria, Change Management, Risks, SLAs, Signatories
   - Project documentation extraction

6. **PRESETS_GENERAL_AGREEMENTS** - Generic Contracts
   - Fields: Parties, Addresses, Terms & Conditions, Scope of Agreement
   - General contract extraction

**C. Custom Field Addition**
- Add arbitrary extraction fields beyond presets
- Input field name and AI extraction prompt
- Dynamic array management

**D. Extraction Process**
- POST request to `http://localhost:5000/api/extract`
- Send: file, preset, dataPoints, withPrompts flag
- Receive: extracted results, progress updates
- Real-time progress tracking (0-100%)

**E. Result Display Modes**
- **JSON View**: Syntax-highlighted JSON results
  - Color coding: keys (blue), strings (green), values (red), null (gray)
  - Collapsible JSON explorer
- **Verify Mode**: Edit extracted values before saving
  - Field-by-field manual verification
  - Change/correct AI extraction output

**F. Export & Copy Functions**
- `copyToClipboard()`: Copy JSON to clipboard with feedback
- Export via history component

---

### **3. Dashboard.js** (Analytics & History)
**Purpose**: Display extraction metrics and access historical data

#### Key Metrics Displayed
```
┌─ Total Extractions ──────────────────┐
│ Live count of all extracted documents│
├─ Fields Approved ────────────────────┤
│ Successfully extracted & validated   │
├─ Fields Flagged ─────────────────────┤
│ Issues or manual review required     │
├─ Pending Review ─────────────────────┤
│ Awaiting user verification           │
└───────────────────────────────────────┘
```

#### State Variables
```javascript
const [historyItems, setHistoryItems]                 // List of past extractions
const [reviewItem, setReviewItem]                     // Item being reviewed
const [recentPage, setRecentPage]                     // Pagination page number
const [dashboardMetrics, setDashboardMetrics]         // Metric statistics
```

#### Features
- **History Pagination**: 10 items per page
- **Search**: Alt+S keyboard shortcut to focus search
- **User Profile**: Display user avatar (Young Alaska - Business account)
- **Quick Actions**: Gift, Bell, Add buttons
- **API Calls**:
  - `GET /api/history` - Fetch extraction records
  - `GET /api/result_status` - Get aggregated metrics
  - `DELETE /api/history/delete_pdf/{id}` - Remove record

#### UI Sections
- Top Navigation Bar with search and user profile
- Stats grid (4 metrics)
- Recent items table with pagination
- Review view integration

---

### **4. history.js** (Export, Review, Delete)
**Purpose**: Manage extraction history and result handling

#### Exported Functions

**A. exportToExcel(item)**
```javascript
// Converts extraction results to Excel file
// Input: extraction record with results object
// Output: {filename}_results.xlsx with columns [Field, Value]
// Column widths: Field (30), Value (60)
```

**B. deletePdf(id)**
```javascript
// Soft-delete extraction record
// Confirmation dialog: "Are you sure? This action cannot be undone."
// Endpoint: DELETE /api/history/delete_pdf/{id}
// Feedback: Alert on success/failure, page reload on success
```

**C. ReviewView Component**
```javascript
// Side-by-side PDF and results display
// Shows:
//   - Original PDF document (browser viewer)
//   - Extracted data table [Field, Value]
//   - Extraction statistics (X/Y fields extracted)
//   - Export button
//   - Delete button
```

#### Features
- **PDF Handling**: 
  - Fetch PDF as blob to avoid CORS issues
  - Detect and display PDF loading errors
  - Handle corrupted/empty PDF files
  - Display in browser's native PDF viewer

- **Value Formatting**:
  - Objects/Arrays: Pretty-printed JSON
  - Null values: Display "null"
  - Regular values: String conversion

---

### **5. integration.js** (Cloud Storage)
**Purpose**: Connect and extract from Google Drive and Microsoft OneDrive

#### Supported Providers
```javascript
const PROVIDERS = {
  google: {
    label: "Google Drive",
    authEndpoint: "/auth/google",
    scope: "drive.readonly",
    endpoints: [
      "/auth/google",          // OAuth initiation
      "/auth/status",          // Connection status check
      "/drive/files",          // File listing
      "/extract-from-drive"    // Direct extraction
    ]
  },
  onedrive: {
    label: "Microsoft OneDrive",
    authEndpoint: "/auth/microsoft",
    scope: "Files.Read",
    endpoints: [
      "/auth/microsoft",       // OAuth initiation
      "/onedrive/auth/status", // Connection status check
      "/onedrive/files",       // File listing
      "/onedrive/extract"      // Direct extraction
    ]
  }
}
```

#### DrivePanel Component (Reusable)
```javascript
// State Management
const [files, setFiles]            // Available files from cloud storage
const [connected, setConnected]    // Authentication status
const [loading, setLoading]        // Loading indicator
const [error, setError]            // Error messages
const [toast, setToast]            // Toast notifications (3s auto-hide)
const [extracting, setExtracting]  // Current extracting file ID

// Methods
checkConnection()                  // Verify OAuth token validity
fetchFiles()                       // List files from cloud storage
handleConnect()                    // Redirect to OAuth login
handleDisconnect()                 // Revoke token and clear data
handleExtract()                    // Trigger extraction from cloud file
showToast(msg, type)              // Display notification (success/error)
```

#### Features
- **Authentication**: OAuth 2.0 with credentials inclusion
- **File Browsing**: Display available files in cloud storage
- **Direct Extraction**: Extract without downloading to local storage
- **Connection Management**: Connect/disconnect at any time
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Feedback for all operations

---

## STYLING SYSTEM

### CSS Design Variables (DocExtract.css)

```css
/* Colors */
--bg: #ffffff                  /* Main background */
--surface: #eeeeee             /* Secondary surface */
--surface2: #9fb0de            /* Tertiary surface */
--surface3: #181f30            /* Dark surface */
--cyan: #265cb3                /* Primary brand color */
--cyan-dim: #89a8f2            /* Dimmed cyan */
--cyan-glow: #1e27de1f         /* Glowing cyan effect */
--green: #00ff9d               /* Success color */
--red: #fe0000                 /* Error color */
--yellow: #ffc94d              /* Warning color */
--purple: #b06aff              /* Accent color */
--text: #050505                /* Main text */
--text-dim: #5e6f88            /* Dimmed text */
--text-muted: #9498a0          /* Muted text */

/* Borders */
--border: #b0b3ba
--border2: #9197aa

/* Layout */
--r: 6px                       /* Border radius */
--r-lg: 12px                   /* Large border radius */

/* Typography */
--mono: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif
--sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif
```

### Layout Structure

```
.de-root (Flexbox row)
├── .de-sidebar (220px, sticky)
│   ├── .de-sb-top (Navigation)
│   │   ├── .de-sb-logo (64px height)
│   │   └── .de-sb-logo-box (34x34px cyan box)
│   └── .de-sb-bottom (Bottom nav)
├── [Main Content Area (flex: 1)]
│   ├── File Upload Section
│   ├── Preset Selection
│   ├── Extraction Controls
│   └── Results Panel
```

**Responsive Behavior**:
- Sidebar collapses from 220px to 62px
- Class toggle: `sidebar-collapsed`
- Sidebar remains sticky (position: sticky, top: 0, height: 100vh)

---

## API INTEGRATION

### Base URL
```
http://localhost:5000/api
```

### Extraction Endpoints

| Endpoint | Method | Input | Output | Purpose |
|----------|--------|-------|--------|---------|
| `/extract` | POST | file, preset, dataPoints, withPrompts | results, progress | Extract data from uploaded PDF |
| `/history` | GET | - | historyItems[] | Fetch all past extractions |
| `/result_status` | GET | - | pdf_files_count, status_count | Get dashboard metrics |
| `/history/delete_pdf/{id}` | DELETE | id | - | Remove extraction record |
| `/pdf/{filename}` | GET | filename | blob | Retrieve PDF file for viewing |

### Cloud Integration Endpoints

**Google Drive**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/google` | GET | OAuth 2.0 login redirect |
| `/auth/status` | GET | Check if connected |
| `/drive/files` | GET | List available files |
| `/extract-from-drive` | POST | Extract from selected file |
| `/auth/disconnect` | POST | Revoke authentication |

**OneDrive**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/microsoft` | GET | OAuth 2.0 login redirect |
| `/onedrive/auth/status` | GET | Check if connected |
| `/onedrive/files` | GET | List available files |
| `/onedrive/extract` | POST | Extract from selected file |
| `/onedrive/auth/disconnect` | POST | Revoke authentication |

---

## USER FLOW DIAGRAM

```
┌─────────────────────────────────────┐
│   Start Application                 │
│   ↓                                 │
│   App.js → DocExtract.js            │
└─────────────────────────────────────┘
           ↓
   ┌───────────────────────────┐
   │ Main Navigation Sidebar   │
   ├───────────────────────────┤
   │ • Doc Extract (Active)    │
   │ • Dashboard               │
   │ • History                 │
   │ • Integration             │
   └───────────────────────────┘
           ↓
   ┌───────────────────────────────────┐
   │ View Selection (view state)       │
   ├───────────────────────────────────┤
   │ 1. Upload View (Default)          │
   │    • Drag & drop file upload      │
   │    • Select preset template       │
   │    ↓                              │
   │ 2. Extract View                   │
   │    • Show extraction progress     │
   │    • Display data points          │
   │    ↓                              │
   │ 3. Results View                   │
   │    • JSON display                 │
   │    • Verify mode (edit)           │
   │    • Export to Excel              │
   └───────────────────────────────────┘
           ↓
   ┌───────────────────────────────────┐
   │ Actions                           │
   ├───────────────────────────────────┤
   │ • Export (history.js)             │
   │ • View Dashboard (Dashboard.js)   │
   │ • Integrate Cloud (integration.js)│
   │ • Copy JSON                       │
   │ • Delete Record                   │
   └───────────────────────────────────┘
```

---

## FEATURE MATRIX

### Document Extraction
| Feature | Status | Details |
|---------|--------|---------|
| PDF Upload | ✅ | Drag & drop, click to select |
| Preset Templates | ✅ | 6 types (Insurance, Finance, Healthcare, Contracts) |
| Custom Fields | ✅ | Add arbitrary fields with AI prompts |
| Progress Tracking | ✅ | Real-time 0-100% progress |
| Result Verification | ✅ | Manual edit mode for accuracy |
| JSON Export | ✅ | Syntax-highlighted, copyable |
| Excel Export | ✅ | XLSX format with proper columns |

### Cloud Integration
| Feature | Status | Details |
|---------|--------|---------|
| Google Drive | ✅ | OAuth, file listing, direct extraction |
| Microsoft OneDrive | ✅ | OAuth, file listing, direct extraction |
| Credential Management | ✅ | Connect/disconnect, token refresh |
| Error Handling | ✅ | User-friendly error messages |

### Analytics & Management
| Feature | Status | Details |
|---------|--------|---------|
| Dashboard Metrics | ✅ | Total, approved, flagged, pending counts |
| Extraction History | ✅ | Paginated list (10/page) |
| Record Deletion | ✅ | Soft-delete with confirmation |
| PDF Viewer | ✅ | Native browser viewer |
| Search Functionality | ✅ | Alt+S keyboard shortcut |
| Export Records | ✅ | Excel format per record |

---

## PERFORMANCE OPTIMIZATIONS

1. **State Management**: Minimal re-renders using hooks (useState, useEffect)
2. **File Handling**: Blob conversion for PDF to avoid CORS issues
3. **Dynamic Imports**: Components lazy-loaded as needed
4. **CSS Variables**: Single source of truth for theming
5. **Pagination**: Limited history display (10 items) for performance
6. **Progress Updates**: Real-time visual feedback without blocking UI

---

## ERROR HANDLING

### Frontend Validation
- File type checking (PDF only)
- Empty file detection
- Network error handling (fetch failures)
- Toast notifications for user feedback

### Backend Integration
- HTTP error status checking (404, 500, etc.)
- User-friendly error messages
- Automatic page reload on deletion success
- Confirmation dialogs for destructive actions

---

## KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| Alt + S | Focus dashboard search input |

---

## DEVELOPMENT SCRIPTS

```bash
npm start        # Start dev server (http://localhost:3000)
npm test         # Run test suite (React Testing Library)
npm run build    # Production build
npm run eject    # Expose CRA config (irreversible)
```

---

## DEPENDENCIES BREAKDOWN

| Package | Purpose | Version |
|---------|---------|---------|
| react | UI framework | 19.2.5 |
| react-dom | React renderer | 19.2.5 |
| react-scripts | Build tooling | 5.0.1 |
| lucide-react | Icon library | 1.8.0 |
| xlsx | Excel export | 0.18.5 |
| @testing-library/react | Testing utilities | 16.3.2 |
| @testing-library/dom | DOM testing | 10.4.1 |
| @testing-library/jest-dom | Jest matchers | 6.9.1 |
| @testing-library/user-event | User event simulation | 13.5.0 |
| web-vitals | Performance metrics | 2.1.4 |

---

## CONFIGURATION FILES

### package.json
- **Name**: app
- **Version**: 0.1.0
- **Private**: true (npm registry not used)
- **ESLint**: react-app config
- **Browsers**: Chrome, Firefox, Safari (latest)

### public/index.html
- Standard React SPA template
- Manifest link for PWA support
- Public URL substitution for assets
- Responsive meta tags

### public/manifest.json
- PWA manifest for installability
- App name, icons, theme colors

---

## SECURITY CONSIDERATIONS

1. **CORS Handling**: Blob fetching for same-origin PDF requests
2. **Credentials**: OAuth tokens with `credentials: "include"`
3. **Confirmation Dialogs**: Destructive actions require user confirmation
4. **Input Validation**: File type and size checking
5. **Error Messages**: No sensitive information leakage

---

## FUTURE ENHANCEMENT OPPORTUNITIES

1. **Offline Support**: Service workers for offline functionality
2. **Batch Processing**: Multiple file extraction at once
3. **Advanced Filtering**: Filter history by status, date, type
4. **Custom Branding**: Theme customization per user
5. **Performance**: React.memo for expensive components
6. **Analytics**: Track extraction accuracy metrics
7. **Webhooks**: Real-time extraction notifications
8. **OCR Support**: Handle scanned documents
9. **Version Control**: Track extraction result changes
10. **Role-Based Access**: Admin, reviewer, user roles

---

## DEPLOYMENT CHECKLIST

- [ ] Update API base URL for production
- [ ] Build optimization (npm run build)
- [ ] Environment variables for endpoints
- [ ] HTTPS setup for OAuth
- [ ] CORS configuration for production domain
- [ ] Error logging/monitoring setup
- [ ] Performance monitoring (Web Vitals)
- [ ] Security headers (CSP, X-Frame-Options)
- [ ] PWA manifest customization
- [ ] Asset optimization (images, fonts)

---

**Last Updated**: May 8, 2026
**Frontend Version**: 0.1.0
**React Version**: 19.2.5
