document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup opened');
    
    const countElement = document.getElementById('count');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    const optionsLink = document.getElementById('optionsLink');
    
    function updateDisplay() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, 'getChatGPTMessageCount', (response) => {
                if (response) {
                    try {
                        const parsed = JSON.parse(response);
                        countElement.textContent = parsed.count || 0;
                        lastUpdatedElement.textContent = new Date(parsed.lastUpdated).toLocaleString() || 'Never';
                    } catch (error) {
                        console.error('Error parsing retrieved data:', error);
                        countElement.textContent = '0';
                        lastUpdatedElement.textContent = 'Error retrieving time';
                    }
                }
            });
        });
    }

    updateDisplay();
    
    optionsLink.addEventListener('click', function(e) {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    });
});