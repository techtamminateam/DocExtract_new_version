# AIExtracter

AIExtracter is a document extraction application that helps users upload or connect to documents, define what information should be pulled out, run AI-based extraction, review results, and export structured data for downstream use.

This README is written as a sales and comparison reference. It does not rank competitors. Instead, it describes the product in terms that make side-by-side comparison easier.

## What The Application Does

- Accepts PDF documents for extraction from local upload and cloud sources.
- Uses preset templates for common document classes.
- Supports custom fields and prompts for flexible extraction.
- Shows extracted output for review, correction, and export.
- Keeps extraction history and summary metrics.
- Includes cloud storage integrations and an AI assistant for user guidance.

## Primary User Flow

1. User signs in.
2. User opens the extraction workspace.
3. User uploads a PDF or connects a cloud file source.
4. User selects a preset template or adds custom fields.
5. The system extracts the requested data.
6. User reviews the output, edits values if needed, and exports results.
7. User can return later to history, dashboard, profile, billing, and integrations.

## Current Product Modules

### Document Extraction

- Upload PDF files for extraction.
- Choose from built-in presets for common document types.
- Add custom fields and prompts when a document needs specialized extraction.
- View extraction progress and results.
- Copy or export extracted output.

### Templates

The application currently supports templates for:

- Healthcare documents
- Financial statements
- Master Service Agreements
- Invoice checking
- Legal documents
- Statements of Work
- General agreements

Each template maps to a set of fields and prompts so users can compare how well the product handles structured, semi-structured, and unstructured documents.

### Review And Verification

- Review extracted values before sharing them downstream.
- Edit fields manually when AI output needs correction.
- Track whether fields are approved, flagged, or pending review.

### History And Analytics

- View previous extraction jobs.
- Open source files tied to a record.
- Delete a record when needed.
- See summary metrics such as total extractions and field status counts.

### Cloud Integrations

- Google Drive connection flow is supported.
- Microsoft OneDrive connection flow is supported.
- Drive files can be listed and extracted through the application.

### Chat Assistant

- An embedded assistant helps users understand templates, workflow, and extraction usage.
- Useful for onboarding and support-style questions during demos.

### Authentication And Account Flow

- Sign up and login are supported.
- Password reset and email verification flows are present in the backend.
- User profile and billing-related routes are included.

## Comparison Dimensions For Sales

Use the following dimensions when comparing AIExtracter with another document extraction product.

### 1. Input Sources

- Local PDF upload
- Google Drive ingestion
- OneDrive ingestion
- Ability to scale to other sources later

### 2. Template Flexibility

- Fixed preset templates
- Custom field creation
- Per-field prompt control
- Industry-specific template coverage

### 3. Extraction Workflow

- Single-pass extraction vs multi-step review
- Progress visibility
- Support for manual verification
- Ability to handle both structured and semi-structured documents

### 4. Output Usability

- JSON-style structured results
- Excel export
- Copy-to-clipboard support
- History and review access

### 5. Review And Governance

- Field-level validation
- Correction workflow
- Document preview next to extracted data
- Status tracking for approved, flagged, and pending fields

### 6. Collaboration And Support

- Embedded AI assistant
- Guided onboarding for users
- History for repeatable workflows
- Profile and account management

### 7. Integrations

- Cloud storage connectors
- Authentication-based access
- Extensibility for more file systems and business tools

### 8. Platform And Deployment

- Web application
- Backend API service
- Frontend served from the backend build in production
- Local deployment friendly for demos and internal use

### 9. Commercial Readiness

- Login and account management
- Billing routes and subscription hooks
- Audit-friendly history of extractions
- Exportable results for business users

## Suggested Sales Talk Track

When comparing AIExtracter to another application, focus on these questions:

- How quickly can a user get from document upload to usable structured data?
- Can business users define their own extraction fields without engineering work?
- How easy is it to review and correct AI output before export?
- Does the product support cloud sources, not just local uploads?
- Is there a history trail for previous extractions and outcomes?
- Does the product help users learn and self-serve during onboarding?

## Competitive Positioning Notes

AIExtracter is best positioned as a practical document extraction platform for teams that need:

- Template-driven extraction with custom flexibility
- Human review before export
- Cloud document access
- A clear history and analytics layer
- A simple web workflow that supports demos and internal adoption

It is a strong comparison candidate against:

- Generic OCR tools
- Basic PDF parsing utilities
- Manual data entry workflows
- More complex document intelligence platforms

## What To Highlight In A Demo

- Upload a PDF and select a preset template.
- Show how fields can be added or adjusted.
- Run extraction and point out the progress flow.
- Open the review screen and correct a value.
- Export to Excel.
- Show history or metrics for repeat use.
- Connect a cloud source to demonstrate non-local ingestion.

## Backend Surface Area

The backend includes routes for:

- Extraction
- History
- Result status metrics
- Login and registration
- Profile management
- Google Drive integration
- OneDrive integration
- Chat assistant
- Billing and subscription actions

## Notes For Sales Teams

- This product is strongest where customers value structured extraction plus review.
- It is a good fit for document-heavy processes such as insurance, finance, healthcare, and contracts.
- For comparisons, focus on workflow completeness, flexibility, and ease of review rather than raw model claims alone.

