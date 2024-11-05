document.addEventListener('DOMContentLoaded', function() {
    const countElement = document.getElementById('count');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    const resetButton = document.getElementById('resetButton');

    function updateDisplay() {
        // Find all tabs
        chrome.tabs.query({}, (tabs) => {
            // Safely filter ChatGPT tabs
            const chatGPTTabs = tabs.filter(tab => tab.url && tab.url.includes('chatgpt.com'));
            
            if (chatGPTTabs.length > 0) {
                const tab = chatGPTTabs[0];
                
                chrome.tabs.sendMessage(tab.id, 'getChatGPTMessageCount', (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        return;
                    }
                    
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
            } else {
                countElement.textContent = '0';
                lastUpdatedElement.textContent = 'Please open ChatGPT to view stats';
            }
        });
    }

    resetButton.addEventListener('click', function() {
        chrome.tabs.query({}, (tabs) => {
            // Safely filter ChatGPT tabs
            const chatGPTTabs = tabs.filter(tab => tab.url && tab.url.includes('chatgpt.com'));
            
            if (chatGPTTabs.length > 0) {
                const tab = chatGPTTabs[0];
                
                chrome.tabs.sendMessage(tab.id, 'resetChatGPTMessageCount', (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        return;
                    }
                    updateDisplay();
                });
            }
        });
    });

    // Update display when options page is opened
    updateDisplay();
});