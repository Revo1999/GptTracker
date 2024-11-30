document.addEventListener('DOMContentLoaded', function () {
    const countElement = document.getElementById('count');
    const weeklyCountElement = document.getElementById('weekly_count');
    const watercountElement = document.getElementById('water_count');
    const weeklyWaterCountElement = document.getElementById('weekly_water_count');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    const resetButton = document.getElementById('resetButton');
    const resetWeeklyButton = document.getElementById('resetWeeklyButton');
    const selectElement = document.getElementById('locationSelect');
    const waterLimitSlider = document.getElementById('waterLimitSlider');
    const waterLimitValueDisplay = document.getElementById('waterLimitValue');
    const promptValueDisplay = document.getElementById('promptsAmount')
    const themeSelect = document.getElementById('themeSelect');
    const saveButton = document.getElementById('saveButton');
    const themePreview = document.getElementById('themePreview');

    // Theme preview functionality
    themeSelect.addEventListener('change', function() {
        const selectedTheme = this.value;
        
        // Remove all theme classes
        themePreview.classList.remove('light', 'dark', 'intrusive');
        
        // Add the selected theme class
        themePreview.classList.add(selectedTheme);
    });

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

    resetButton.addEventListener('click', function () {
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

    resetWeeklyButton.addEventListener('click', function () {
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
        const waterLimit = waterLimitSlider.value;
        localStorage.setItem('waterLimit', waterLimit);
        waterLimitValueDisplay.textContent = `${waterLimit} ml`;
        loadWaterLimit();
    }

    function loadWaterLimit() {
        const savedWaterLimit = localStorage.getItem('waterLimit');
        const location = localStorage.getItem('selectedLocation');
        if (savedWaterLimit) {
            waterLimitSlider.value = savedWaterLimit;
            waterLimitValueDisplay.textContent = `${((savedWaterLimit*location*479005)/1000).toFixed(0)} liters`;
            promptValueDisplay.textContent = `Weekly prompts: ${savedWaterLimit} `;
        }
    }

    function saveTheme() {
        const selectedTheme = themeSelect.value;
        localStorage.setItem('theme', selectedTheme);

        // Send theme to content script
        chrome.tabs.query({}, (tabs) => {
            const chatGPTTabs = tabs.filter(tab => tab.url && tab.url.includes('chatgpt.com'));

            if (chatGPTTabs.length > 0) {
                const tab = chatGPTTabs[0];
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'changeTheme', 
                    theme: selectedTheme 
                });
            }
        });
    }

    
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            themeSelect.value = savedTheme;


            const selectedTheme = savedTheme;
        
            // Remove all theme classes
            themePreview.classList.remove('light', 'dark', 'intrusive');
            
            // Add the selected theme class
            themePreview.classList.add(selectedTheme);
        }
    }

    window.onload = function () {
        loadLocation();
        loadWaterLimit();
        loadTheme();
        saveLocation();

        chrome.storage.local.set({ weeklyLimit: localStorage.getItem('waterLimit') });
        chrome.storage.local.set({ locationSelected: localStorage.getItem('selectedLocation') });
        chrome.storage.local.set({ theme: localStorage.getItem('theme') });
    };

    document.getElementById('locationSelect').addEventListener('change', saveLocation);
    document.getElementById('themeSelect').addEventListener('change', saveTheme);
    waterLimitSlider.addEventListener('input', saveWaterLimit);

    updateDisplay();
});

saveButton.addEventListener('click', function () {
    // Save location
    const selectedLocation = document.getElementById('locationSelect').value;
    localStorage.setItem('selectedLocation', selectedLocation);

    // Save water limit
    const waterLimit = waterLimitSlider.value;
    localStorage.setItem('waterLimit', waterLimit);

    // Save theme
    const selectedTheme = themeSelect.value;
    localStorage.setItem('theme', selectedTheme);

    // Send theme to content script
    chrome.tabs.query({}, (tabs) => {
        const chatGPTTabs = tabs.filter(tab => tab.url && tab.url.includes('chatgpt.com'));

        if (chatGPTTabs.length > 0) {
            const tab = chatGPTTabs[0];
            chrome.tabs.sendMessage(tab.id, { 
                action: 'changeTheme', 
                theme: selectedTheme 
            });
        }
    });

    // Update chrome storage
    chrome.storage.local.set({ 
        weeklyLimit: waterLimit,
        selectedLocation: selectedLocation,
        theme: selectedTheme 
    }, function() {
        // Refresh the page after saving
        location.reload();
    });
});