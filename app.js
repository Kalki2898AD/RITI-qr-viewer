// Initialize scanner when the page loads
document.addEventListener('DOMContentLoaded', function() {
    let scanner = null;
    const preview = document.getElementById('preview');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const successAnimation = document.getElementById('success-animation');
    const errorAnimation = document.getElementById('error-animation');
    const scanAgainBtn = document.getElementById('scanAgain');

    // Initialize the QR scanner
    function initializeScanner() {
        // Hide result container and show scanner
        result.classList.add('d-none');
        preview.style.display = 'block';
        
        // Create new scanner instance
        scanner = new Instascan.Scanner({
            video: preview,
            mirror: false
        });

        // Handle successful scans
        scanner.addListener('scan', async function(qrContent) {
            try {
                // Show loading overlay
                loading.classList.remove('d-none');
                
                // Parse QR data
                const qrData = JSON.parse(qrContent);
                
                // Verify participant
                const response = await verifyParticipant(qrData.id);
                
                // Hide scanner and loading
                preview.style.display = 'none';
                loading.classList.add('d-none');
                
                // Display result
                displayResult(response);
                
                // Stop scanner
                if (scanner) {
                    scanner.stop();
                }
            } catch (error) {
                console.error('Error processing QR code:', error);
                showError('Invalid QR code or verification failed');
            }
        });

        // Start camera
        Instascan.Camera.getCameras().then(cameras => {
            if (cameras.length > 0) {
                // Try to use the back camera first
                const backCamera = cameras.find(camera => camera.name.toLowerCase().includes('back'));
                scanner.start(backCamera || cameras[0]);
            } else {
                console.error('No cameras found');
                alert('No cameras found on your device');
            }
        }).catch(err => {
            console.error('Error accessing camera:', err);
            alert('Error accessing camera. Please make sure you have granted camera permissions.');
        });
    }

    // Verify participant with server
    async function verifyParticipant(participantId) {
        try {
            const response = await fetch(`/api/participant/${participantId}`);
            if (!response.ok) {
                throw new Error('Verification failed');
            }
            return await response.json();
        } catch (error) {
            console.error('Error verifying participant:', error);
            throw error;
        }
    }

    // Display verification result
    function displayResult(response) {
        // Show result container
        result.classList.remove('d-none');
        
        if (response.success) {
            // Show success animation
            successAnimation.classList.remove('d-none');
            errorAnimation.classList.add('d-none');
            
            // Update participant details
            document.getElementById('participantId').textContent = response.participant.id;
            document.getElementById('participantName').textContent = response.participant.name;
            document.getElementById('participantHallTicket').textContent = response.participant.hallTicket;
            document.getElementById('participantPackage').textContent = response.participant.selectedPackage;
            document.getElementById('participantPayment').textContent = response.participant.paymentMethod;
        } else {
            showError('Participant not found');
        }
    }

    // Show error state
    function showError(message) {
        result.classList.remove('d-none');
        successAnimation.classList.add('d-none');
        errorAnimation.classList.remove('d-none');
        preview.style.display = 'none';
        loading.classList.add('d-none');
        
        // Clear participant details
        document.getElementById('participantId').textContent = '';
        document.getElementById('participantName').textContent = '';
        document.getElementById('participantHallTicket').textContent = '';
        document.getElementById('participantPackage').textContent = '';
        document.getElementById('participantPayment').textContent = '';
    }

    // Handle scan again button
    scanAgainBtn.addEventListener('click', function() {
        successAnimation.classList.add('d-none');
        errorAnimation.classList.add('d-none');
        initializeScanner();
    });

    // Initialize scanner on page load
    initializeScanner();
});
