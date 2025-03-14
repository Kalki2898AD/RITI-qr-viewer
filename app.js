// Initialize scanner
let scanner = null;
let currentCamera = 0;

// Elements
const videoPreview = document.getElementById('preview');
const toggleButton = document.getElementById('toggleCamera');
const loadingState = document.getElementById('loading');
const successState = document.getElementById('success-animation');
const errorState = document.getElementById('error-animation');
const participantDetails = document.getElementById('result');

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
        scanner = new Instascan.Scanner({
            video: videoPreview,
            mirror: false
        });

        const cameras = await Instascan.Camera.getCameras();
        
        if (cameras.length > 0) {
            // Try to use the back camera first
            const backCamera = cameras.find(camera => camera.name.toLowerCase().includes('back'));
            await scanner.start(backCamera || cameras[currentCamera]);
            
            if (cameras.length > 1) {
                toggleButton.style.display = 'block';
                toggleButton.onclick = () => {
                    currentCamera = (currentCamera + 1) % cameras.length;
                    scanner.start(cameras[currentCamera]);
                };
            } else {
                toggleButton.style.display = 'none';
            }
        } else {
            console.error('No cameras found.');
            alert('No cameras found on your device.');
        }

        // Handle successful scans
        scanner.addListener('scan', handleScan);
    } catch (error) {
        console.error('Error initializing scanner:', error);
        alert('Error initializing camera. Please make sure you have given camera permissions.');
    }
}

// Handle QR code scan
async function handleScan(qrContent) {
    try {
        showLoading();
        
        // Parse QR data
        const qrData = JSON.parse(qrContent);
        
        // Call API to verify participant
        const response = await fetch(`/api/participant/${qrData.id}`);
        const data = await response.json();
        
        if (data.success) {
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
    participantId.textContent = participant.id;
    participantName.textContent = participant.name;
    participantHallTicket.textContent = participant.hallTicket;
    participantBranch.textContent = participant.branch;
    participantYear.textContent = participant.year;
    participantSection.textContent = participant.section;
    participantPackage.textContent = participant.selectedPackage;
    participantPayment.textContent = participant.paymentMethod;
    participantAmount.textContent = participant.amount;
}

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', initializeScanner);
