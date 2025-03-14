# RITI QR Code Scanner

A QR code scanner for verifying RITI participants using their QR codes. Built with Node.js, Express, and Google Sheets API.

## Features

- Dark theme UPI-style QR scanner
- Real-time participant verification
- Automatic back camera selection
- Secure HTTPS and camera access handling
- Integration with Google Sheets for participant data

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```env
# Google Sheets API Credentials
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PRIVATE_KEY="your_private_key"
GOOGLE_CLIENT_EMAIL=your_client_email
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_X509_CERT_URL=your_client_x509_cert_url

# Google Sheets Configuration
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEET_RANGE="Form Responses 1!A2:J"

# Server Configuration
PORT=3000
```

3. Make sure your Google Service Account has access to the Google Sheet containing participant data.

## Development

Run the development server:
```bash
npm run dev
```

## Production

Run the production server:
```bash
npm start
```

## Security

- All sensitive credentials are stored in environment variables
- HTTPS is enforced for secure camera access
- Proper security headers are implemented
- CORS is configured for secure cross-origin requests

## Google Sheets Structure

The application expects the following column structure in your Google Sheet:
- Column B: Name
- Column C: Hall Ticket
- Column D: Branch
- Column E: Year
- Column F: Section
- Column G: Package
- Column H: Payment Method
- Column I: Amount
- Column J: QR Code ID
