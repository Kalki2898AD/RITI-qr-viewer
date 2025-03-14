// Elements
const qrReader = document.getElementById('qr-reader');
const startButton = document.getElementById('startButton');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const participantDetails = document.getElementById('participantDetails');

// Detail elements
const participantName = document.getElementById('participantName');
const participantHallTicket = document.getElementById('participantHallTicket');
const participantBranch = document.getElementById('participantBranch');
const participantYear = document.getElementById('participantYear');
const participantSection = document.getElementById('participantSection');
const participantPackage = document.getElementById('participantPackage');
const participantPayment = document.getElementById('participantPayment');
const participantAmount = document.getElementById('participantAmount');

let html5QrCode = null;

// Start camera when button is clicked
async function startCamera() {
    try {
        // Hide button, show scanner
        startButton.style.display = 'none';
        qrReader.style.display = 'block';
        loadingState.classList.remove('d-none');
        errorState.classList.add('d-none');
        participantDetails.classList.add('d-none');

        // Create scanner
        html5QrCode = new Html5Qrcode("qr-reader");

        // Get cameras
        const devices = await Html5Qrcode.getCameras();
        if (!devices || !devices.length) {
            throw new Error('No cameras found');
        }

        // Try to find back camera
        let cameraId = devices[0].id;
        for (const device of devices) {
            if (device.label.toLowerCase().includes('back')) {
                cameraId = device.id;
                break;
            }
        }

        // Start scanning
        await html5QrCode.start(
            cameraId,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            handleQRScan,
            handleQRError
        );

        loadingState.classList.add('d-none');

    } catch (error) {
        console.error('Camera error:', error);
        startButton.style.display = 'block';
        qrReader.style.display = 'none';
        loadingState.classList.add('d-none');
        
        let message = '';
        if (error.name === 'NotAllowedError') {
            message = 'Camera access denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError' || error.message === 'No cameras found') {
            message = 'No camera found. Please make sure your device has a camera.';
        } else if (error.name === 'NotReadableError') {
            message = 'Cannot access camera. Please close other apps using the camera.';
        } else {
            message = 'Error starting camera. Please check permissions and try again.';
        }
        
        errorState.textContent = message;
        errorState.classList.remove('d-none');
    }
}

// Handle QR scan success
async function handleQRScan(decodedText) {
    try {
        loadingState.classList.remove('d-none');
        participantDetails.classList.add('d-none');
        errorState.classList.add('d-none');

        let data;
        try {
            data = JSON.parse(decodedText);
        } catch (e) {
            data = { id: decodedText };
        }
        
        if (!data.id) {
            throw new Error('Invalid QR code');
        }

        const response = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.id })
        });

        if (!response.ok) {
            throw new Error('Failed to verify participant');
        }

        const participant = await response.json();

        participantName.textContent = participant.name || 'N/A';
        participantHallTicket.textContent = participant.hallTicket || 'N/A';
        participantBranch.textContent = participant.branch || 'N/A';
        participantYear.textContent = participant.year || 'N/A';
        participantSection.textContent = participant.section || 'N/A';
        participantPackage.textContent = participant.package || 'N/A';
        participantPayment.textContent = participant.payment || 'N/A';
        participantAmount.textContent = participant.amount ? `₹${participant.amount}` : 'N/A';

        loadingState.classList.add('d-none');
        participantDetails.classList.remove('d-none');

        // Play success sound
        new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAUAAAiSAAYGBgYJCQkJCQwMDAwMDw8PDw8SEhISEhUVFRUVGBgYGBgbGxsbGx4eHh4eISEhISEkJCQkJCcnJycnKioqKiourq6urq6urq6xsbGxsbS0tLS0t7e3t7e6urq6ur29vb29v8AAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV').play();

        // Pause scanning for a moment
        await html5QrCode.pause();
        setTimeout(async () => {
            await html5QrCode.resume();
        }, 2000);

    } catch (error) {
        console.error('QR scan error:', error);
        loadingState.classList.add('d-none');
        participantDetails.classList.add('d-none');
        errorState.textContent = 'Invalid QR code. Please try again.';
        errorState.classList.remove('d-none');
    }
}

// Handle QR scan error
function handleQRError(error) {
    // Ignore errors, just keep scanning
    console.log('QR scan error (ignored):', error);
}

// Clean up when page is hidden/closed
document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
        if (html5QrCode) {
            await html5QrCode.pause();
        }
    } else {
        if (html5QrCode && html5QrCode.isScanning) {
            await html5QrCode.resume();
        }
    }
});

// Start scanner when page loads
document.addEventListener('DOMContentLoaded', () => {
    startButton.addEventListener('click', startCamera);
});
