document.addEventListener('DOMContentLoaded', function() {
    const countElement = document.getElementById('count');
    const watercountElement = document.getElementById('water_count');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    const resetButton = document.getElementById('resetButton');
    const selectElement = document.getElementById('locationSelect');

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
                            
                            
                            let selectedValue = parseFloat(selectElement.value); // Get the value of the selected option
                            const totalVolume = parsed.count * selectedValue; // Calculate total volume
                            let formattedVolume; // Variable to hold the formatted string
                            
                            if (totalVolume < 1000) {
                                formattedVolume = totalVolume + " ml"; // If under 1000, use ml
                            } else {
                                formattedVolume = (totalVolume / 1000).toFixed(2) + " L"; // If 1000 or more, convert to liters
                            }
                            
                            watercountElement.textContent = formattedVolume; // Set the text content

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

    // Function to save the selected location to local storage
    function saveLocation() {
        const selectedValue = document.getElementById('locationSelect').value;
        localStorage.setItem('selectedLocation', selectedValue);
        updateDisplay()
    }

    // Function to load the saved location from local storage
    function loadLocation() {
        const savedValue = localStorage.getItem('selectedLocation');
        if (savedValue) {
            document.getElementById('locationSelect').value = savedValue;
        }
    }

    // Load the location when the window is loaded
    window.onload = function() {
        loadLocation();
    };

    // Add an event listener to save the location when it changes
    document.getElementById('locationSelect').addEventListener('change', saveLocation);
    

    // Update display when options page is opened
    updateDisplay();
});