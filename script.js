// Now these should be globally available
const video = document.getElementById('video');
const questionElement = document.getElementById('question');
const leftOptionElement = document.getElementById('leftOption');
const rightOptionElement = document.getElementById('rightOption');

// Sample questions array as before
const questions = [
    {
        question: "CHOOSE YOUR COUTURE",
        leftOption: "Flirtatious",
        rightOption: "Vibrant"
    },
    {
        question: "CHOOSE YOUR COUTURE",
        leftOption: "Flirtatious",
        rightOption: "Vibrant"
    },
    {
        question: "CHOOSE YOUR COUTURE",
        leftOption: "Flirtatious",
        rightOption: "Vibrant"
    },
    {
        question: "CHOOSE YOUR COUTURE",
        leftOption: "Flirtatious",
        rightOption: "Vibrant"
    },
    {
        question: "CHOOSE YOUR COUTURE",
        leftOption: "Flirtatious",
        rightOption: "Vibrant"
    }
];

let currentQuestionIndex = 0;
let selectionInProgress = false;

// ----------------------------------------------------------------------------------
// Setup the webcam stream and start face detection
// ----------------------------------------------------------------------------------
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        displayQuestion(currentQuestionIndex);

        setupFaceMesh();
    })
    .catch(err => {
        console.error("Error accessing webcam: ", err);
    });

// ----------------------------------------------------------------------------------
// Configure and start FaceMesh
// ----------------------------------------------------------------------------------
function setupFaceMesh() {
    // Create a FaceMesh instance
    const faceMesh = new FaceMesh({
        locateFile: (file) => {
            // Load from CDN
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
    });

    // Configure FaceMesh options
    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });

    // Callback whenever FaceMesh computes new results
    faceMesh.onResults(onResults);

    // Use Camera helper from MediaPipe to continuously send frames
    const camera = new Camera(video, {
        onFrame: async () => {
            await faceMesh.send({ image: video });
        },
        width: 640,
        height: 480,
    });
    camera.start();
}

// ----------------------------------------------------------------------------------
// Handle FaceMesh results and compute head tilt angle
// ----------------------------------------------------------------------------------
function onResults(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        return;
    }
    // Only take the first detected face for this example
    const landmarks = results.multiFaceLandmarks[0];

    // Let's take two points for a basic left/right tilt:
    //  e.g., the left eye outer corner (landmarks[33]) and
    //        the right eye outer corner (landmarks[263]).
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    // Convert normalized coordinates [0..1] to an angle
    // dx > 0 => right side is to the right
    // dy > 0 => right side is lower than left side
    const dx = rightEye.x - leftEye.x;
    const dy = rightEye.y - leftEye.y;

    // Angle in radians
    const angleRadians = Math.atan2(dy, dx);
    // Convert to degrees for simpler interpretation
    const angleDegrees = (angleRadians * 180) / Math.PI;

    // Now pass the computed angle to handleHeadTilt
    if (!selectionInProgress) {
        handleHeadTilt(angleDegrees);
    }
}

// ----------------------------------------------------------------------------------
// Original game logic
// ----------------------------------------------------------------------------------
function displayQuestion(index) {
    const currentQuestion = questions[index];
    questionElement.textContent = currentQuestion.question;
    leftOptionElement.textContent = currentQuestion.leftOption;
    rightOptionElement.textContent = currentQuestion.rightOption;
    leftOptionElement.classList.remove('selected');
    rightOptionElement.classList.remove('selected');
}

function handleHeadTilt(angle) {
    // Adjust thresholds to suit your needs.
    if (angle > 10) {
        // Head tilted to the right
        rightOptionElement.classList.add('selected');
        leftOptionElement.classList.remove('selected');
        selectionInProgress = true;
        setTimeout(() => {
            processAnswer('right');
        }, 1000);
    } else if (angle < -10) {
        // Head tilted to the left
        leftOptionElement.classList.add('selected');
        rightOptionElement.classList.remove('selected');
        selectionInProgress = true;
        setTimeout(() => {
            processAnswer('left');
        }, 1000);
    } else {
        // Head is centered
        leftOptionElement.classList.remove('selected');
        rightOptionElement.classList.remove('selected');
    }
}

// Called after tilt-based selection
function processAnswer(selectedSide) {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestion(currentQuestionIndex);
        selectionInProgress = false;
    } else {
        endGame();
    }
}

// Called at end of quiz
function endGame() {
    questionElement.textContent = "Thank you for playing!";
    leftOptionElement.style.display = 'none';
    rightOptionElement.style.display = 'none';
}