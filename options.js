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

                            // Store the stats data
                            localStorage.setItem('chatgptWeeklyMessageCount', JSON.stringify({
                                count: parsedWeekly.count,
                            }));

                        } catch (error) {
                            console.error('Error parsing weekly data:', error);
                            weeklyCountElement.textContent = '0';
                            weeklyWaterCountElement.textContent = '0 ml';
                        }
                    }
                });
    
                // Fetch stats data
                chrome.tabs.sendMessage(tab.id, 'getChatGPTStats', (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError);
                        return;
                    }
    
                    if (response) {
                        try {
                            const stats = JSON.parse(response);
                            // Store the stats data
                            localStorage.setItem('chatGPTStats', JSON.stringify({
                                startDate: stats.startDate,
                                weekdayCounts: stats.weekdayCounts,
                                usageStats: stats.usageStats
                            }));
                        } catch (error) {
                            console.error('Error storing stats:', error);
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

// Retrieve data from local storage
const rawData = localStorage.getItem('chatGPTStats');
if (!rawData) {
    alert("No data found in localStorage!");
    throw new Error("Local storage data is missing.");
}

                    // Parse the JSON data
                    const data = JSON.parse(rawData);

                    // Get the current date
                    const currentDate = new Date();

                    // Calculate the number of days since the start date
                    const startDate = new Date(data.startDate);
                    const daysElapsed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
                    console.log(daysElapsed)
                    // Avoid division by zero if the recording started today
                    const weeksElapsed = daysElapsed / 7 || 1;
                    console.log(weeksElapsed)

                    // Calculate averages for each weekday
                    const averageUsage = {};
                    Object.keys(data.weekdayCounts).forEach(day => {
                        averageUsage[day] = data.weekdayCounts[day] / weeksElapsed; // Average per week
                    });

                    // Prepare data for Chart.js
                    const labels = Object.keys(averageUsage);

                    const labelsWithoutLastReset = labels.slice(0, labels.length - 1)

                    const values = Object.values(averageUsage);


 // Create the chart
const ctx = document.getElementById('usageChart').getContext('2d');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: labelsWithoutLastReset,
        datasets: [{
            label: 'Average Usage',
            data: values, // This is the data used to calculate the bar heights
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    // Tooltip will show the exact value used to calculate the bar heights
                    label: function(tooltipItem) {
                        // Display the raw value used for the bar height without additional processing
                        return tooltipItem.raw.toFixed(1); // Round to 1 decimal
                    }
                }
            }
        }
    }
});

updateDisplay()

// Get weekly usage and weekly limit values from localStorage
const weeklyChatGPTCount = JSON.parse(localStorage.getItem('chatgptWeeklyMessageCount'))?.count || 0;
console.log(weeklyChatGPTCount)
const weeklyLimit = parseFloat(localStorage.getItem('waterLimit')) || 100; // Default to 1000 ml if no value is found
console.log(weeklyLimit)
// Check if the values are valid numbers
if (isNaN(weeklyChatGPTCount) || isNaN(weeklyLimit)) {
    console.error("Invalid values for weekly usage or weekly limit.");
    alert("There was an issue with retrieving the data for the chart.");
} else {
    // Calculate the percentage of usage
    let usagePercentage = (weeklyChatGPTCount / weeklyLimit) * 100;
    let remainingPercentage = 100 - usagePercentage;
    
    // Ensure usage percentage doesn't exceed 100
    if (usagePercentage > 100) {
        usagePercentage = 100;
        remainingPercentage = 0;
    }

    // Prepare the data for the Doughnut chart
    const doughnutData = {
        labels: ['Used', 'Remaining'],
        datasets: [{
            data: [usagePercentage, remainingPercentage],
            backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'], // Light colors for used and remaining
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'], // Darker borders for contrast
            borderWidth: 1
        }]
    };

    // Create the Doughnut chart
    const ctx1 = document.getElementById('weeklyUsageChart').getContext('2d');
    new Chart(ctx1, {
        type: 'doughnut',
        data: doughnutData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        // Display percentage in tooltip
                        label: function(tooltipItem) {
                            return tooltipItem.raw.toFixed(1) + '%'; // Show percentage with one decimal
                        }
                    }
                }
            }
        }
    });
}



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