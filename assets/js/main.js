const userInput = document.getElementById('user-input-text');
const systemResponse = document.getElementById('system-response');
const validationText = document.getElementById('validation-text');
const clearResponse = document.getElementById('clear-response');
const deleteCatMemory = document.getElementById('delete-chat-memory');
const audioPlayer = document.getElementById('audio-player');

systemResponse.innerText = "Ask something to start the conversation";
systemResponse.style.opacity = .4;
systemResponse.style.fontWeight = 400;

const timeoutDelay = 2000;

// function for the generative conversation
document.getElementById('send-button').addEventListener('click', async () => {
    if (!userInput.value == "") {
        // cleans the previous response
        systemResponse.style.opacity = 1;
        systemResponse.style.fontWeight = 400;
        systemResponse.value = "Generating ...";

        let URL = '';

        if (localStorage.length > 0) {
            let keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                keys.push(localStorage.key(i));
            }
            keys = keys.join();

            URL = 'http://localhost:5000/get-ai-assistant-response?content=' + userInput.value + 'I just want to tell u that I have these feelings or moods in my head. - ' + keys + 'Understand these feelings and please cooperate with me';
            console.log(URL);
        }
        else {
            URL = 'http://localhost:5000/get-ai-assistant-response?content=' + userInput.value;
            console.log(URL);
        }


        fetch(URL)
            .then(response => response.blob())
            .then(blob => {
                var reader = new FileReader();
                reader.onload = function () {
                    audioPlayer.src = reader.result;
                    audioPlayer.play();
                    localStorage.clear();
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => console.error('Error fetching audio:', error));
    }
    else {
        validationText.style.display = 'block';
    }
});


// cleans the system response
clearResponse.addEventListener('click', () => {
    if (systemResponse.value) {
        systemResponse.value = "";
    }
    else {
        alert('Already cleared !')
    }

});


// cleans the chat history on both temp. and perm. memeory(db)
deleteCatMemory.addEventListener('click', async () => {
    try {
        const URL = 'http://localhost:5000/clean-conversation-history';
        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.message == "history cleared") {
            alert(data.message)
        }
        else {
            alert(data.message)
        }
    } catch (error) {
        console.error(error);
    }
});


setTimeout(() => {
    console.log("checking")
}, 5000);

// function that executes every 7 mins
setTimeout(async () => {
    try {
        const URL = 'http://localhost:5000/get_predictions';
        const response = await fetch(URL, {
            method: 'GET',
        });
        const data = await response.json();

        if (data.response) { console.log(data.response) }

        // emotions structure
        let Positive_High_Valence = ['Happy', 'Content', 'Delighted', 'Relaxed'];
        let Positive_Low_Valence = ['Excited', 'Calm'];
        let Negative_Low_Valence = ['Tense', 'Tired'];
        let Negative_High_Valence = ['Angry', 'Frustrated', 'Bored', 'Depressed'];

        let Positive_High_Arousel = ['Tense', 'Excided', 'Angry', 'Delighted'];
        let Positive_Low_Arousel = ['Frustrated', 'Happy', 'Angry', 'Delighted'];
        let Negative_Low_Arousel = ['Depressed', 'Content'];
        let Negative_High_Arousel = ['Bored', 'Relaxed', 'Tired', 'Calm'];

        let combined_labels = []

        switch (data.response[0]) {
            case "Positive_High_Valence":
                combined_labels = combined_labels.concat(Positive_High_Valence)
                break;

            case "Positive_Low_Valence":
                combined_labels = combined_labels.concat(Positive_Low_Valence)
                break;

            case "Negative_Low_Valence":
                combined_labels = combined_labels.concat(Negative_Low_Valence)
                break;

            case "Negative_High_Valence":
                combined_labels = combined_labels.concat(Negative_High_Valence)
                break;

            default:
                break;
        }

        switch (data.response[1]) {
            case "Positive_High_Arousel":
                combined_labels = combined_labels.concat(Positive_High_Arousel)
                break;

            case "Positive_Low_Arousel":
                combined_labels = combined_labels.concat(Positive_Low_Arousel)
                break;

            case "Negative_Low_Arousel":
                combined_labels = combined_labels.concat(Negative_Low_Arousel)
                break;

            case "Negative_High_Arousel":
                combined_labels = combined_labels.concat(Negative_High_Arousel)
                break;

            default:
                break;
        }

        console.log(combined_labels)


        const container = document.getElementById('response-panel'); // Get the div container

        Array.from(new Set(combined_labels)).forEach((item, index) => {
            const button = document.createElement('button'); // Create a new button element
            button.className = 'btn btn-primary';
            button.id = `button${item}`; // Assign a unique ID based on the index
            button.textContent = `${item}`; // Set button text
            button.onclick = function () { localStorage.setItem(button.textContent, 'clicked') }; // Optional: Set what happens on click
            container.appendChild(button); // Append the button to the div
        });

    } catch (error) {
        console.error(error)
    }
}, 1000*60*7);


