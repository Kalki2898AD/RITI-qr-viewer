// Initialize scanner
let scanner = null;
let currentCamera = 0;

// Elements
const videoPreview = document.getElementById('preview');
const toggleButton = document.getElementById('toggleCamera');
const loadingState = document.getElementById('loadingState');
const successState = document.getElementById('successState');
const errorState = document.getElementById('errorState');
const participantDetails = document.getElementById('participantDetails');

// Detail elements
const participantId = document.getElementById('participantId');
const participantName = document.getElementById('participantName');
const participantHallTicket = document.getElementById('participantHallTicket');
const participantBranch = document.getElementById('participantBranch');
const participantYear = document.getElementById('participantYear');
const participantSection = document.getElementById('participantSection');
const participantPackage = document.getElementById('participantPackage');
const participantPayment = document.getElementById('participantPayment');
const participantAmount = document.getElementById('participantAmount');

// Initialize scanner
async function initializeScanner() {
    try {
        // Request camera permission first
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        scanner = new Instascan.Scanner({
            video: videoPreview,
            mirror: false,
            backgroundScan: false,
            scanPeriod: 3 // Scan every 3 seconds
        });

        const cameras = await Instascan.Camera.getCameras();
        
        if (cameras.length > 0) {
            // Try to use the back camera first
            const backCamera = cameras.find(camera => 
                camera.name.toLowerCase().includes('back') || 
                camera.name.toLowerCase().includes('rear') ||
                camera.name.toLowerCase().includes('environment')
            );
            
            if (backCamera) {
                await scanner.start(backCamera);
                currentCamera = cameras.indexOf(backCamera);
            } else {
                await scanner.start(cameras[0]);
                currentCamera = 0;
            }

            // Show toggle button only if multiple cameras
            toggleButton.style.display = cameras.length > 1 ? 'block' : 'none';
            
            // Handle camera switch
            toggleButton.onclick = async () => {
                currentCamera = (currentCamera + 1) % cameras.length;
                await scanner.start(cameras[currentCamera]);
            };
        } else {
            console.error('No cameras found.');
            alert('No cameras found on your device.');
        }

        // Handle successful scans
        scanner.addListener('scan', handleScan);
    } catch (error) {
        console.error('Error initializing scanner:', error);
        if (error.name === 'NotAllowedError') {
            alert('Camera access denied. Please allow camera access to scan QR codes.');
        } else if (error.name === 'NotFoundError') {
            alert('No camera found on your device.');
        } else {
            alert('Error initializing camera. Please make sure you have given camera permissions.');
        }
    }
}

// Handle QR code scan
async function handleScan(qrContent) {
    try {
        // Parse QR content
        const qrData = JSON.parse(qrContent);
        
        if (!qrData.id) {
            throw new Error('Invalid QR code format');
        }

        showLoading();
        
        // Call API to verify participant
        const response = await fetch(`/api/participant/${qrData.id}`);
        const data = await response.json();
        
        if (data.success && data.participant) {
            showSuccess();
            displayParticipantDetails(data.participant);
        } else {
            showError();
        }
    } catch (error) {
        console.error('Error verifying participant:', error);
        showError();
    }
}

// Display functions
function showLoading() {
    loadingState.classList.remove('d-none');
    successState.classList.add('d-none');
    errorState.classList.add('d-none');
    participantDetails.classList.add('d-none');
}

function showSuccess() {
    loadingState.classList.add('d-none');
    successState.classList.remove('d-none');
    errorState.classList.add('d-none');
    participantDetails.classList.remove('d-none');
}

function showError() {
    loadingState.classList.add('d-none');
    successState.classList.add('d-none');
    errorState.classList.remove('d-none');
    participantDetails.classList.add('d-none');
    
    // Reset error state after 3 seconds
    setTimeout(() => {
        errorState.classList.add('d-none');
    }, 3000);
}

// Display participant details
function displayParticipantDetails(participant) {
    participantId.textContent = participant.id || '';
    participantName.textContent = participant.name || '';
    participantHallTicket.textContent = participant.hallTicket || '';
    participantBranch.textContent = participant.branch || '';
    participantYear.textContent = participant.year || '';
    participantSection.textContent = participant.section || '';
    participantPackage.textContent = participant.selectedPackage || '';
    participantPayment.textContent = participant.paymentMethod || '';
    participantAmount.textContent = participant.amount || '';
}

// Start scanner when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add a slight delay to ensure DOM is fully loaded
    setTimeout(initializeScanner, 1000);
});
