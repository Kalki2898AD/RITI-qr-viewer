const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();
const fs = require('fs');

// Set OpenSSL configuration
process.env.OPENSSL_CONF = '/dev/null';

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(express.json());

// Security headers
app.use((req, res, next) => {
    // Enable HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Allow camera access
    res.setHeader('Permissions-Policy', 'camera=self');
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://rawgit.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self' data:;");
    
    next();
});

app.use(express.static(path.join(__dirname)));

// Logger setup
const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args)
};

// API endpoint to verify participant
app.post('/api/verify', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Missing participant ID' });
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
        const participant = rows.find(row => row[9] === id); // Assuming QR code ID is in column J
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        // Map participant data
        const participantData = {
            name: participant[1] || 'N/A', // Name (Column B)
            hallTicket: participant[2] || 'N/A', // Hall Ticket (Column C)
            branch: participant[3] || 'N/A', // Branch (Column D)
            year: participant[4] || 'N/A', // Year (Column E)
            section: participant[5] || 'N/A', // Section (Column F)
            package: participant[6] || 'N/A', // Package (Column G)
            payment: participant[7] || 'N/A', // Payment Method (Column H)
            amount: participant[8] || 'N/A' // Amount (Column I)
        };

        res.json(participantData);

    } catch (error) {
        logger.error('Error verifying participant:', error);
        res.status(500).json({ error: 'Failed to verify participant' });
    }
});

// Participant verification endpoint
app.get('/api/participant/:id', async (req, res) => {
    try {
        const participantId = req.params.id;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No participants found'
            });
        }

        // Find participant by ID
        const participant = rows.find(row => row[0] === participantId);

        if (!participant) {
            return res.status(404).json({
                success: false,
                message: 'Participant not found'
            });
        }

        // Return participant details
        res.json({
            success: true,
            participant: {
                id: participant[0],
                name: participant[1],
                hallTicket: participant[2],
                mobile: participant[3],
                year: participant[4],
                branch: participant[5],
                section: participant[6],
                selectedPackage: participant[7],
                paymentMethod: participant[8],
                amount: participant[9]
            }
        });

    } catch (error) {
        logger.error('Error verifying participant:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify participant'
        });
    }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
});
