const userInput = document.getElementById('user-input-text');
const systemResponse = document.getElementById('system-response');
const validationText = document.getElementById('validation-text');
systemResponse.innerText = "I'm  doing good !!!"


document.getElementById('send-button').addEventListener('click', () => {
    if (!userInput.value == "") {
        // send the API request 
    }
    else {
        validationText.style.display = 'block';
    }
})
