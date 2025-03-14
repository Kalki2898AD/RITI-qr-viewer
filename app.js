// Initialize QR scanner
let scanner = null;

// Elements
const videoPreview = document.getElementById('preview');
const loadingState = document.getElementById('loadingState');
const successState = document.getElementById('successState');
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

// Function to initialize camera
async function initializeCamera() {
    try {
        // First check if we're in a secure context
        if (!window.isSecureContext) {
            throw new Error('Secure context required');
        }

        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API not available');
        }

        // Request camera permission explicitly
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    ideal: 'environment' // Prefer back camera
                }
            }
        });

        // Stop the stream as Instascan will request it again
        stream.getTracks().forEach(track => track.stop());

        // Create scanner instance
        scanner = new Instascan.Scanner({
            video: videoPreview,
            mirror: false,
            backgroundScan: false,
            continuous: true
        });

        // Handle successful scans
        scanner.addListener('scan', handleQRScan);

        // Get available cameras
        const cameras = await Instascan.Camera.getCameras();
        
        if (cameras.length === 0) {
            throw new Error('No cameras found');
        }

        // Try to get the back camera
        const backCamera = cameras.find(camera => 
            camera.name.toLowerCase().includes('back') || 
            camera.name.toLowerCase().includes('rear') ||
            camera.name.toLowerCase().includes('environment')
        ) || cameras[0];

        // Start the scanner
        await scanner.start(backCamera);
        console.log('Camera started successfully');

    } catch (error) {
        console.error('Camera initialization error:', error);
        let errorMessage = 'Error accessing camera. ';

        switch(error.name) {
            case 'NotAllowedError':
                errorMessage += 'Please allow camera access to scan QR codes.';
                break;
            case 'NotFoundError':
                errorMessage += 'No camera found on your device.';
                break;
            case 'NotReadableError':
                errorMessage += 'Camera is already in use or not accessible.';
                break;
            default:
                if (!window.isSecureContext) {
                    errorMessage += 'Camera access requires HTTPS. Please use a secure connection.';
                } else if (error.message === 'Secure context required') {
                    errorMessage += 'Please access this page via HTTPS.';
                } else if (error.message === 'Camera API not available') {
                    errorMessage += 'Your browser does not support camera access.';
                } else {
                    errorMessage += 'Please ensure you have a camera and have given permissions.';
                }
        }

        alert(errorMessage);
    }
}

// Start scanner when page loads
document.addEventListener('DOMContentLoaded', initializeCamera);

// Handle QR code scan
async function handleQRScan(content) {
    try {
        // Show loading state
        loadingState.classList.remove('d-none');
        participantDetails.classList.add('d-none');

        // Parse QR code content
        const data = JSON.parse(content);

        // Validate required fields
        if (!data.id || !data.name) {
            throw new Error('Invalid QR code format');
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update participant details
        participantName.textContent = data.name || 'N/A';
        participantHallTicket.textContent = data.hallTicket || 'N/A';
        participantBranch.textContent = data.branch || 'N/A';
        participantYear.textContent = data.year || 'N/A';
        participantSection.textContent = data.section || 'N/A';
        participantPackage.textContent = data.package || 'N/A';
        participantPayment.textContent = data.payment || 'N/A';
        participantAmount.textContent = data.amount ? `₹${data.amount}` : 'N/A';

        // Show participant details
        loadingState.classList.add('d-none');
        participantDetails.classList.remove('d-none');

        // Play success sound
        const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAUAAAiSAAYGBgYJCQkJCQwMDAwMDw8PDw8SEhISEhUVFRUVGBgYGBgbGxsbGx4eHh4eISEhISEkJCQkJCcnJycnKioqKiourq6urq6urq6xsbGxsbS0tLS0t7e3t7e6urq6ur29vb29v8AAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV');
        audio.play();

    } catch (error) {
        console.error('Error processing QR code:', error);
        
        // Hide loading state
        loadingState.classList.add('d-none');
        participantDetails.classList.add('d-none');

        // Play error sound
        const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAUAAAiSAAYGBgYJCQkJCQwMDAwMDw8PDw8SEhISEhUVFRUVGBgYGBgbGxsbGx4eHh4eISEhISEkJCQkJCcnJycnKioqKiourq6urq6urq6xsbGxsbS0tLS0t7e3t7e6urq6ur29vb29v8AAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV');
        audio.play();
        
        // Show error message
        alert('Error scanning QR code. Please try again.');
    }
}

// Handle visibility change to pause/resume scanner
document.addEventListener('visibilitychange', function() {
    if (scanner) {
        if (document.hidden) {
            scanner.stop();
        } else {
            initializeCamera().catch(console.error);
        }
    }
});
