const predictionButton = document.getElementById('prediction_button');
let isPredictionbuttonClicked = false;
let model, webcam, labelContainer, maxPredictions;
let facial_emotions = [];

// Load the image model and setup the webcam from the click event
predictionButton.addEventListener('click', async () => {
    predictionButton.style.display = 'none';
    
    setTimeout(async () => {
        const modelURL = "https://teachablemachine.withgoogle.com/models/4cQ4zXIVn/model.json";
        const metadataURL = "https://teachablemachine.withgoogle.com/models/4cQ4zXIVn/metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Convenience function to setup a webcam
        const flip = true; // whether to flip the webcam
        webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // append elements to the DOM
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");
        for (let i = 0; i < maxPredictions; i++) { // and class labels
            labelContainer.appendChild(document.createElement("div"));
        }

        sendData();
        isPredictionbuttonClicked = true;
        predictionButton.disabled = true;
    }, 1000 * 5);

    // clearTimeout(timeout);
});

async function loop() {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);
    facial_emotions.push({
        'Positive_Low_Arousel': prediction[0].probability,
        'Positive_High_Arousel': prediction[1].probability,
        'Negative_Low_Arousel': prediction[2].probability,
        'Negative_High_Arousel': prediction[3].probability,
    });
    // DOUBLE CHECK LABELS !!!!!
    // console.log(prediction[0].className + " - " + prediction[0].probability)
    // console.log(prediction[1].className + " - " + prediction[1].probability)
    // console.log(prediction[2].className + " - " + prediction[2].probability)
    // console.log(prediction[3].className + " - " + prediction[3].probability)

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}


async function sendData() {
    setInterval(async () => {
        // 001 - gathering realtime eeg prediction data
        try {
            const URL = 'http://localhost:5001/process_eeg_data';
            const response = await fetch(URL, {
                method: 'GET'
            });
            const data = await response.json();
            if (data.message == "Service file executed") {
                console.log("task completed - gathering realtime eeg prediction data")
            }
        } catch (error) {
            console.log(error)
        }

        // 002 - gathering facial emotions prediction data
        let key_arr = []
        for (let index = 0; index < facial_emotions.length; index++) {
            let highestKey = '';
            let highestValue = -Infinity;
            for (let key in facial_emotions[index]) {
                if (facial_emotions[index][key] > highestValue) {
                    highestValue = facial_emotions[index][key];
                    //console.log(highestKey)
                    highestKey = key;
                }
            }
            key_arr.push(highestKey);
        }

        let mostCommonValue = findMostCommonValue(key_arr);
        console.log("Most Common Value - " + mostCommonValue);
        console.log("data sent")

        // making the POST request to the controller
        try {
            const URL = 'http://localhost:5000/process_prediction_data?emotions_prediction=' + mostCommonValue;
            const response = await fetch(URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            const data = await response.json();
            if (data.message == "user is updated") {
                console.log("task completed - gathering facial emotion prediction data")
            }
        } catch (error) {
            console.log(error);
        }
    }, 1000 * 60 * 5);
}


function findMostCommonValue(strings) {
    let counts = {};
    let mostCommon = strings[0]; // Assume the first element is the most common initially
    let maxCount = 0;

    // Count each string's occurrences
    strings.forEach(string => {
        counts[string] = (counts[string] || 0) + 1;
    });

    // Find the string with the maximum count
    for (let string in counts) {
        if (counts[string] > maxCount) {
            maxCount = counts[string];
            mostCommon = string;
        }
    }
    return mostCommon;
}
