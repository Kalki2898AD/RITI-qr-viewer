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

// Start scanner when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Create scanner instance
    scanner = new Instascan.Scanner({
        video: videoPreview,
        mirror: false,
        backgroundScan: false,
        continuous: true
    });

    // Handle successful scans
    scanner.addListener('scan', handleQRScan);

    // Start camera with back camera first
    Instascan.Camera.getCameras().then(cameras => {
        if (cameras.length > 0) {
            // Try to get the back camera
            const backCamera = cameras.find(camera => camera.name.toLowerCase().includes('back')) || cameras[0];
            scanner.start(backCamera).catch(console.error);
        }
    }).catch(console.error);
});

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
    }
}

// Handle visibility change to pause/resume scanner
document.addEventListener('visibilitychange', function() {
    if (scanner) {
        if (document.hidden) {
            scanner.stop();
        } else {
            Instascan.Camera.getCameras().then(cameras => {
                if (cameras.length > 0) {
                    const backCamera = cameras.find(camera => camera.name.toLowerCase().includes('back')) || cameras[0];
                    scanner.start(backCamera).catch(console.error);
                }
            }).catch(console.error);
        }
    }
});
