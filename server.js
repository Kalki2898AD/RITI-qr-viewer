const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

// Set OpenSSL configuration
process.env.OPENSSL_CONF = '/dev/null';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Google Sheets Configuration
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1wVWWOjFWaSqgR0pHCUvjwdxfscwxN2lK9uA_WW4ZrbU';

// Create auth client
const getAuthClient = () => {
    try {
        const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
        if (!privateKey) {
            throw new Error('Private key is missing');
        }

        return new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 'ritiactivityserviceaccount@zap-kitchen.iam.gserviceaccount.com',
                private_key: privateKey
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
    } catch (error) {
        logger.error('Auth client creation error:', error);
        throw error;
    }
};

// Test connection on startup
(async () => {
    try {
        const auth = await getAuthClient();
        const client = await auth.getClient();
        logger.info('Successfully created auth client');

        const sheets = google.sheets({ version: 'v4', auth: client });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A1:A1'
        });
        logger.info('Successfully accessed Google Sheet:', response.data);
    } catch (error) {
        logger.error('Google Sheets connection error:', {
            message: error.message,
            code: error.code,
            response: error.response?.data
        });
    }
})();

// Participant verification endpoint
app.get('/api/participant/:id', async (req, res) => {
    try {
        const auth = await getAuthClient();
        const client = await auth.getClient();
        logger.info('Successfully created auth client for verification');

        const sheets = google.sheets({ version: 'v4', auth: client });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1'
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No participants found'
            });
        }

        // Find participant by ID
        const participantId = req.params.id;
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
