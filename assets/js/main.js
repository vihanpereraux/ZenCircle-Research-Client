const userInput = document.getElementById('user-input-text');
const systemResponse = document.getElementById('system-response');
const validationText = document.getElementById('validation-text');
const clearResponse = document.getElementById('clear-response');
const deleteCatMemory = document.getElementById('delete-chat-memory');

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

        const URL = 'http://localhost:5000/get-response?content=' + userInput.value;
        console.log(URL)
        try {
            const response = await fetch(URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: userInput.value
                })
            });
            const data = await response.json();
            console.log("Message - "+ data.message);
            console.log("DB Response - "+ data.db_response);
            systemResponse.value = data.message;
        } catch (error) {
            console.error(error);
        }
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
})



