const great_btn = document.getElementById('great_btn');
const okay_btn = document.getElementById('okay_btn');
const not_good_btn = document.getElementById('not_good_btn');
let isGreatbtnPushed = false;
let isOkaybtnPushed = false;
let isNotGoodbtnPushed = false;

const work_btn = document.getElementById('work_btn');
const relationship_btn = document.getElementById('relationship_btn');
const finance_btn = document.getElementById('finance_btn');
const health_btn = document.getElementById('health_btn');
const others_btn = document.getElementById('others_btn');
let isWorkbtnPushed = false;
let isRelationshipbtnPushed = false;
let isFinancebtnPushed = false;
let isHealthbtnPushed = false;
let isOthersbtnPushed = false;

let initial_feelings_configs = []
let initial_sources_configs = []

great_btn.addEventListener('click', () => {
    if (!isGreatbtnPushed) {
        great_btn.disabled = true;
        initial_feelings_configs.push("Today I had a great day");
        // alert(initial_configs);
    }
    isGreatbtnPushed = true;
});
okay_btn.addEventListener('click', () => {
    if (!isOkaybtnPushed) {
        okay_btn.disabled = true;
        initial_feelings_configs.push("Today was okay");
        // alert(initial_configs);   
    }
    isOkaybtnPushed = true;
});
not_good_btn.addEventListener('click', () => {
    if (!isNotGoodbtnPushed) {
        not_good_btn.disabled = true;
        initial_feelings_configs.push("Today was not good");
        // alert(initial_configs);       
    }
    isNotGoodbtnPushed = true;
});


work_btn.addEventListener('click', () => {
    if (!isWorkbtnPushed) {
        work_btn.disabled = true;
        initial_sources_configs.push("I feel like work is stressfull");
        // alert(initial_configs);
    }
    isWorkbtnPushed = true;
});
relationship_btn.addEventListener('click', () => {
    if (!isRelationshipbtnPushed) {
        relationship_btn.disabled = true;
        initial_sources_configs.push("I feel like my relationship is stressfull");
        // alert(initial_configs);
    }
    isRelationshipbtnPushed = true;
});
finance_btn.addEventListener('click', () => {
    if (!isFinancebtnPushed) {
        finance_btn.disabled = true;
        initial_sources_configs.push("I feel like my finance situatiob is stressfull");
        // alert(initial_configs);
    }
    isFinancebtnPushed = true;
});
health_btn.addEventListener('click', () => {
    if (!isHealthbtnPushed) {
        health_btn.disabled = true;
        initial_sources_configs.push("I feel like my health condition is stressfull");
        // alert(initial_configs);
    }
    isHealthbtnPushed = true;
});
others_btn.addEventListener('click', () => {
    if (!isOthersbtnPushed) {
        others_btn.disabled = true;
        initial_sources_configs.push("I feel like something is stressfull");
        // alert(initial_configs);
    }
    isOthersbtnPushed = true;
});

const completeButton = document.getElementById('complete-btn');
completeButton.addEventListener('click', () => {
    localStorage.setItem('initial_feelings_configs', initial_feelings_configs.join());
    localStorage.setItem('initial_sources_configs', initial_sources_configs.join());
})