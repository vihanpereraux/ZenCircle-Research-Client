const userInput = document.getElementById('user-input-text');
const systemResponse = document.getElementById('system-response');
const validationText = document.getElementById('validation-text');
systemResponse.innerText = "I'm  doing good !!!"

const timeoutDelay = 2000;

document.getElementById('send-button').addEventListener('click', async () => {
    if (!userInput.value == "") {
        // cleans the previous response
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
            console.log(data.message);
            systemResponse.value = data.message;
        } catch (error) {
            console.error(error);
        }
    }
    else {
        validationText.style.display = 'block';
    }
});



