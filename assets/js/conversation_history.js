const conversationHistory = document.getElementById('history');
const showHistoryBtn = document.getElementById('show-history');


// get request
showHistoryBtn.addEventListener('click', async () => {
    try {
        const URL = 'http://localhost:5000/get-chat-history';
        const request = await fetch(URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const response = await request.json();
        // response = response.slice(1)
        let updatedResponse = (response.response).slice(1).slice(0, -1);
        

        console.log(typeof response.response);
        console.log(updatedResponse);

    } catch (error) {
        console.error(error);
    }
});
