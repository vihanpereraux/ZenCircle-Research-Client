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

        // var fileInput = document.getElementById('fileInput');
        // var file = fileInput.files[0]

        const URL = 'http://localhost:5000/get-ai-assistant-response?content=' + userInput.value;
        console.log(URL);
        // try {
        //     const response = await fetch(URL, {
        //         method: 'GET',
        //         headers: {
        //             'Content-Type': 'application/json'
        //         },
        //     });
        //     const data = await response.blob();
        //     console.log(data);
        //     const audio = new Audio(URL.createObjectURL(data));
        //     audio.play();
        // } catch (error) {
        //     console.error(error);
        // }


        fetch(URL)
            .then(response => response.blob())
            .then(blob => {
                
                var reader = new FileReader();
                reader.onload = function () {
                    audioPlayer.src = reader.result;
                    audioPlayer.play();
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
})



