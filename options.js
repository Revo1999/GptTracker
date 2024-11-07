document.addEventListener('DOMContentLoaded', function() {
    const countElement = document.getElementById('count');
    const weeklyCountElement = document.getElementById('weekly_count');
    const watercountElement = document.getElementById('water_count');
    const weeklyWaterCountElement = document.getElementById('weekly_water_count');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    const resetButton = document.getElementById('resetButton');
    const resetWeeklyButton = document.getElementById('resetWeeklyButton');
    const selectElement = document.getElementById('locationSelect');
    const waterLimitInput = document.getElementById('waterLimitInput');

    function updateDisplay() {
        chrome.tabs.query({}, (tabs) => {
            const chatGPTTabs = tabs.filter(tab => tab.url && tab.url.includes('chatgpt.com'));
            
            if (chatGPTTabs.length > 0) {
                const tab = chatGPTTabs[0];
                
                // Fetch total count
                chrome.tabs.sendMessage(tab.id, 'getChatGPTMessageCount', (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        return;
                    }
                    
                    if (response) {
                        try {
                            const parsed = JSON.parse(response);
                            countElement.textContent = parsed.count || 0;
                            
                            const selectedValue = parseFloat(selectElement.value);
                            const totalVolume = parsed.count * selectedValue;
                            const formattedVolume = totalVolume < 1000
                                ? totalVolume.toFixed(2) + " ml"
                                : (totalVolume / 1000).toFixed(2) + " L";

                            watercountElement.textContent = formattedVolume;
                            lastUpdatedElement.textContent = new Date(parsed.lastUpdated).toLocaleString() || 'Never';
                        } catch (error) {
                            console.error('Error parsing retrieved data:', error);
                            countElement.textContent = '0';
                            lastUpdatedElement.textContent = 'Error retrieving time';
                        }
                    }
                });

                // Fetch weekly count
                chrome.tabs.sendMessage(tab.id, 'getChatGPTWeeklyMessageCount', (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        return;
                    }

                    if (response) {
                        try {
                            const parsedWeekly = JSON.parse(response);
                            weeklyCountElement.textContent = parsedWeekly.count || 0;
                            
                            const selectedValue = parseFloat(selectElement.value);
                            const weeklyVolume = parsedWeekly.count * selectedValue;
                            const formattedWeeklyVolume = weeklyVolume < 1000
                                ? weeklyVolume.toFixed(2) + " ml"
                                : (weeklyVolume / 1000).toFixed(2) + " L";

                            weeklyWaterCountElement.textContent = formattedWeeklyVolume;
                        } catch (error) {
                            console.error('Error parsing weekly data:', error);
                            weeklyCountElement.textContent = '0';
                            weeklyWaterCountElement.textContent = '0 ml';
                        }
                    }
                });
            } else {
                countElement.textContent = '0';
                weeklyCountElement.textContent = '0';
                watercountElement.textContent = '0 ml';
                weeklyWaterCountElement.textContent = '0 ml';
                lastUpdatedElement.textContent = 'Please open ChatGPT to view stats';
            }
        });
    }

    // Reset total count with confirmation
    resetButton.addEventListener('click', function() {
        if (confirm("Are you sure you want to reset the total count?")) {
            chrome.tabs.query({}, (tabs) => {
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
        }
    });

    // Reset weekly count with confirmation
    resetWeeklyButton.addEventListener('click', function() {
        if (confirm("Are you sure you want to reset the weekly count?")) {
            chrome.tabs.query({}, (tabs) => {
                const chatGPTTabs = tabs.filter(tab => tab.url && tab.url.includes('chatgpt.com'));
                
                if (chatGPTTabs.length > 0) {
                    const tab = chatGPTTabs[0];
                    
                    chrome.tabs.sendMessage(tab.id, 'resetChatGPTWeeklyMessageCount', (response) => {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError);
                            return;
                        }
                        updateDisplay();
                    });
                }
            });
        }
    });

    function saveLocation() {
        const selectedValue = document.getElementById('locationSelect').value;
        localStorage.setItem('selectedLocation', selectedValue);
        updateDisplay();
    }

    function loadLocation() {
        const savedValue = localStorage.getItem('selectedLocation');
        if (savedValue) {
            document.getElementById('locationSelect').value = savedValue;
        }
    }

    function saveWaterLimit() {
        const waterLimit = waterLimitInput.value;
        localStorage.setItem('waterLimit', waterLimit);
    }

    function loadWaterLimit() {
        const savedWaterLimit = localStorage.getItem('waterLimit');
        if (savedWaterLimit) {
            waterLimitInput.value = savedWaterLimit;
        }
    }

    window.onload = function() {
        loadLocation();
        loadWaterLimit();
        saveLocation()

        chrome.storage.local.set({weeklyLimit: localStorage.getItem('waterLimit')})
        chrome.storage.local.set({locationSelected: localStorage.getItem('selectedLocation')})
    };

    document.getElementById('locationSelect').addEventListener('change', saveLocation);
    waterLimitInput.addEventListener('change', saveWaterLimit);

    updateDisplay();
});
