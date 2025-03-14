const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configure Google Sheets API
const auth = new google.auth.GoogleAuth({
    credentials: {
        type: 'service_account',
        project_id: 'zap-kitchen',
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL || 'ritiactivityserviceaccount@zap-kitchen.iam.gserviceaccount.com',
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1DLyBNPzyYkHHyZNZoUWkWe8HgGHqCVDqPY2Zz_8Gy1I';
const RANGE = process.env.GOOGLE_SHEET_RANGE || 'Form Responses 1!A2:J';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Basic security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// API endpoint for verification
app.post('/api/verify', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Invalid QR code' });
        }

        // Get data from Google Sheets
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        // Find participant by QR code ID
        const participant = rows.find(row => row[9] === id);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        // Map participant data
        const participantData = {
            name: participant[1] || 'N/A',
            hallTicket: participant[2] || 'N/A',
            branch: participant[3] || 'N/A',
            year: participant[4] || 'N/A',
            section: participant[5] || 'N/A',
            package: participant[6] || 'N/A',
            payment: participant[7] || 'N/A',
            amount: participant[8] || 'N/A'
        };

        res.json(participantData);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
