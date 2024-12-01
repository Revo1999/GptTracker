document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup opened');
    
    const countElement = document.getElementById('count');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    const optionsLink = document.getElementById('optionsButton');
    const waterPillContainer = document.getElementById('water-pill-container');
    
    // CSS for Water Pill
    const style = document.createElement('style');
    style.textContent = `
        .water-pill {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 110px;
            height: 110px;
            box-sizing: border-box;
            transition: background-color 0.3s ease;
            margin: 10px auto;
        }
    
        .water-pill.light .water-text {
            color: black;
        }
    
        .water-circle-container {
            width: 110px;
            height: 110px;
            flex-shrink: 0;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: none;
        }
    
        .circle-container {
            position: relative;
            width: 110px;
            height: 110px;
            overflow: hidden;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            background: white;
        }
    
        .water-content {
            position: absolute;
            width: 100%;
            height: 150%;
            background: transparent;
        }
    
        .water {
            position: absolute;
            left: 0;
            width: 100%;
            background: #bed7f9;
            transition: transform 0.3s ease, height 0.3s ease;
            animation: animate 4s ease-in-out infinite;
        }
    
       @keyframes animate {
    0%, 100% {
        clip-path: polygon(
            0% 45%,
            5% 45.5%,
            10% 46%,
            15% 46.5%,
            20% 47%,
            25% 48%,
            30% 49%,
            35% 50%,
            40% 51%,
            45% 52%,
            50% 53.5%,
            55% 54.5%,
            60% 55%,
            65% 55.5%,
            70% 56%,
            75% 55.5%,
            80% 55%,
            85% 54.5%,
            90% 53.5%,
            95% 52.5%,
            100% 52%,
            100% 100%,
            0% 100%
        );
    }
    50% {
        clip-path: polygon(
            0% 50%,
            5% 50.5%,
            10% 51%,
            15% 51.5%,
            20% 52%,
            25% 52.5%,
            30% 53%,
            35% 53.5%,
            40% 53.5%,
            45% 53.5%,
            50% 53%,
            55% 52.5%,
            60% 52%,
            65% 51.5%,
            70% 51%,
            75% 50.5%,
            80% 50%,
            85% 49.5%,
            90% 48.5%,
            95% 48%,
            100% 48%,
            100% 100%,
            0% 100%
        );
    }
}
        
        .fish {
            position: absolute;
            width: 90px;
            height: 90px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2;
        }
    `;
    document.head.appendChild(style);
    
    // Create Water Pill Element
    function createWaterPill(weeklyCount, weeklyLimit, locationML) {
        const pill = document.createElement('div');
        pill.className = 'water-pill dark'; // Default to dark theme
        
        // Calculate percentage and total volume
        const percentage = Math.min((weeklyCount / weeklyLimit) * 100, 100);
        const totalML = weeklyCount * locationML;
        const output = totalML > 1000 ? (totalML / 1000).toFixed(1) + " L" : totalML.toFixed(1) + " mL";

        const circleContainer = document.createElement('div');
        circleContainer.className = 'water-circle-container';
        
        const waterContainer = document.createElement('div');
        waterContainer.className = 'circle-container';
        
        const waterContent = document.createElement('div');
        waterContent.className = 'water-content';
        
        const water = document.createElement('div');
        water.className = 'water';
        water.id = 'water';

        // Update water height
        water.style.height = `${230}px`;
        water.style.transform = `translateY(${percentage*1.2-120}px)`;

        waterContent.appendChild(water);
        waterContainer.appendChild(waterContent);
        circleContainer.appendChild(waterContainer);

        // Add fish icon
        const waterIcon = document.createElement('img');
        waterIcon.className = 'fish';
        waterIcon.src = 'upscaled.png';
        waterIcon.alt = 'fish icon';
        circleContainer.appendChild(waterIcon);
        pill.appendChild(circleContainer);

        return { pill, water};
    }
    
    function updateDisplay() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Retrieve message count
            chrome.tabs.sendMessage(tabs[0].id, 'getChatGPTMessageCount', (response) => {
                if (response) {
                    try {
                        const parsed = JSON.parse(response);
                        lastUpdatedElement.textContent = new Date(parsed.lastUpdated).toLocaleString() || 'Never';
                    } catch (error) {
                        console.error('Error parsing retrieved data:', error);
                        countElement.textContent = '0';
                        lastUpdatedElement.textContent = 'Error retrieving time';
                    }
                }
            });

            // Retrieve weekly message count and update water pill
            chrome.tabs.sendMessage(tabs[0].id, 'getChatGPTWeeklyMessageCount', (weeklyResponse) => {
                if (weeklyResponse) {
                    try {
                        const weeklyParsed = JSON.parse(weeklyResponse);
                        countElement.textContent = weeklyParsed.count || 0;
                        
                        // Retrieve additional settings
                        chrome.storage.local.get(['weeklyLimit', 'selectedLocation'], (data) => {
                            const weeklyLimit = data.weeklyLimit || 100; // Default to 100 if not set
                            const locationML = data.selectedLocation || 50; // Default to 50mL if not set

                            // Update water pill
                            const { pill } = createWaterPill(weeklyParsed.count, weeklyLimit, locationML);

                            // Get stored theme and apply
                            chrome.storage.local.get('themeo', (themeData) => {
                                const theme = themeData.themeo || 'dark';
                                pill.classList.remove('light', 'dark', 'intrusive');
                                pill.classList.add(theme);

                                // Clear previous content and add new water pill
                                waterPillContainer.innerHTML = '';
                                waterPillContainer.appendChild(pill);
                            });
                        });
                    } catch (error) {
                        console.error('Error parsing weekly data:', error);
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