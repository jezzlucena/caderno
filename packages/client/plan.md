# PDF Compilation Feature for Dead Man's Switch

## Problem Statement
When a dead man's switch triggers, the user wants the option to include a PDF compilation of their journal entries (rendered as rich text, not raw markdown) that gets sent to recipients.

## Key Challenge: End-to-End Encryption
Journal entries are E2EE - the server cannot decrypt them. When a switch triggers:
- The server detects the expiration and sends notifications
- But the server has no access to plaintext entries to generate a PDF
- The user may be unavailable/incapacitated (that's why the switch triggered)

## Proposed Solution: Client-Side Pre-Generation

### Architecture Overview
1. **Client generates PDF**: When user enables "Include Journal Entries" for a switch, the client:
   - Allows user to select which entries to include
   - Renders entries as rich text (Markdown -> HTML -> PDF)
   - Encrypts the PDF with a **separate** key (not the user's main key)
   - Uploads the encrypted PDF to the server

2. **Access key for recipients**: The PDF encryption key is either:
   - **Option A**: Derived from a password the user sets (shared with recipients in the trigger email)
   - **Option B**: Stored encrypted and released when switch triggers

3. **Server stores and delivers**: When switch triggers:
   - Server sends email with link to download the encrypted PDF
   - Recipients use the password/key to decrypt and view

### Implementation Steps

#### Step 1: Database Schema Updates
- Add `pdfPayload` (BYTEA/text base64) to store encrypted PDF
- Add `pdfIv` for the IV used in encryption
- Add `pdfAccessKey` (encrypted) or `includeEntries` (boolean)
- Add `selectedEntryIds` (JSON array) to track which entries to include

#### Step 2: Client-Side PDF Generation
- Install PDF generation library (e.g., `@react-pdf/renderer` or `jspdf` + `html2canvas`)
- Install Markdown renderer (already have `@uiw/react-md-editor` which can render)
- Create PDF generation service that:
  - Takes selected entries
  - Renders Markdown to styled HTML
  - Converts to PDF with proper formatting
  - Returns PDF as Blob/ArrayBuffer

#### Step 3: Client-Side PDF Encryption
- Generate a random AES-256 key for the PDF
- Encrypt the PDF with this key
- Either:
  - Derive the key from a user-provided password (PBKDF2)
  - Store the key encrypted with user's main key (released on trigger)

#### Step 4: Update Switch Creation/Edit UI
- Add "Include Journal Entries" toggle in CreateSwitchModal
- Add entry selection interface (checkboxes for each entry)
- Add optional password field for PDF access
- Show PDF generation progress
- Preview functionality

#### Step 5: API Updates
- Update switch create/update endpoints to accept PDF payload
- Add endpoint to retrieve encrypted PDF: `GET /api/switches/:id/pdf`
- Update trigger email template to include PDF download instructions

#### Step 6: PDF Delivery on Trigger
- When switch triggers, email includes:
  - Download link for the encrypted PDF
  - Password/decryption instructions
- Create a simple web page for recipients to:
  - Download the encrypted PDF
  - Enter password to decrypt client-side
  - View/download the decrypted PDF

## Technical Decisions

### PDF Library Choice
- **`@react-pdf/renderer`**: React-native PDF, good for structured docs
- **`jspdf` + `html2canvas`**: Good for HTML-to-PDF conversion
- **`pdfmake`**: JSON-based, good for text documents
- **Recommendation**: `jspdf` with Markdown-to-HTML for rich text rendering

### Security Considerations
- PDF encryption key should be separate from main encryption key
- Password-based approach is simpler and more user-friendly
- Recipients don't need accounts - just the password
- Consider adding expiration to PDF download links

## File Changes Summary

### New Files
- `packages/client/src/lib/pdfGenerator.ts` - PDF generation service
- `packages/client/src/components/EntrySelector.tsx` - Entry selection UI
- `packages/server/src/routes/pdf.ts` - PDF delivery endpoints
- `packages/client/src/pages/ViewPdf.tsx` - Public page for recipients

### Modified Files
- `packages/server/src/db/schema.ts` - Add PDF fields to switches table
- `packages/client/src/pages/Switches.tsx` - Add PDF options to modal
- `packages/client/src/stores/switchesStore.ts` - Handle PDF upload
- `packages/client/src/lib/api.ts` - Add PDF endpoints
- `packages/server/src/services/email.service.ts` - Update trigger email
- `packages/server/src/services/scheduler.service.ts` - Include PDF link in trigger
