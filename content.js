console.log('=== ChatGPT Counter Extension Starting ===');

themevalue = "intrusive"

console.log(localStorage.getItem('themeo'))
if (localStorage.getItem('themeo') == null) {
  localStorage.setItem('themeo', themevalue)
}

// JS class for the water indicator html element to inject
class WaterIndicator {
  constructor(container, value) {
      this.container = container;
      this.value = value;
      this.render();
  }

  createStyles() {
      const style = document.createElement('style');
      style.textContent = `
          .water-pill {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border: 1px solid #424242;
              padding: 8px 12px;
              border-radius: 100px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              width: 320px;
              height: 40px;
              box-sizing: border-box;
              transition: background-color 0.3s ease;
          }

          .water-pill.light {
              background-color: #f0f0f0;
          }

          .water-pill.dark {
              background-color: #212121;
          }

          .water-pill.intrusive {
              background-color: #ff4c00;
          }

          .water-text {
              color: white;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 14px;
              font-weight: 600;
          }

          .water-pill.light .water-text {
              color: black;
          }

          .water-circle-container {
              width: 50px;
              height: 36px;
              flex-shrink: 0;
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: translateX(10px)
          }

          .circle-container {
              position: relative;
              width: 30px;
              height: 30px;
              overflow: hidden;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
              background: white;
          }

          .water-content {
              position: absolute;
              width: 100%;
              height: 100%;
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
                      16% 47%,
                      33% 50%,
                      54% 55%,
                      70% 56%,
                      84% 54%,
                      100% 52%,
                      100% 100%,
                      0% 100%
                  );
              }

              50% {
                  clip-path: polygon(
                      0% 50%,
                      15% 52%,
                      34% 54%,
                      51% 53%,
                      67% 51%,
                      84% 49%,
                      100% 48%,
                      100% 100%,
                      0% 100%
                  );
              }
          }
          .fish {
              position: absolute;
              width: 15px;
              height: 15px;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 2;
          }
      `;
      document.head.appendChild(style);
  }

  render() {
      this.createStyles();

      const pill = document.createElement('div');
      pill.className = 'water-pill dark'; // Default to dark theme

      const text = document.createElement('div');
      text.className = 'water-text';
      text.textContent = `Water consumed: 0 mL`;

      const circleContainer = document.createElement('div');
      circleContainer.className = 'water-circle-container';
      
      // Create water circle animation
      const waterContainer = document.createElement('div');
      waterContainer.className = 'circle-container';
      
      const waterContent = document.createElement('div');
      waterContent.className = 'water-content';
      
      const water = document.createElement('div');
      water.className = 'water';
      water.id = 'water';

      waterContent.appendChild(water);
      waterContainer.appendChild(waterContent);
      circleContainer.appendChild(waterContainer);

      pill.appendChild(text);
      pill.appendChild(circleContainer);

      this.container.appendChild(pill);
      this.waterElement = water;
      this.pillElement = pill;

      const waterIcon = document.createElement('img');
      waterIcon.className = 'fish';
      
      waterIcon.src = chrome.runtime.getURL('assets/fish.png');
      waterIcon.alt = 'fish icon';
      circleContainer.appendChild(waterIcon);
  }

  update(weeklyCount, weeklyLimit, locationML) {
      // Calculate percentage of weekly limit used
      const percentage = Math.min((weeklyCount / weeklyLimit) * 100, 100);
      
      // Map percentage to water height (0-30px)
      const mappedHeight = percentage;

      // Update water height
      if (this.waterElement) {
          this.waterElement.style.height = `${70}px`;
          this.waterElement.style.transform = `translateY(${0.275 * mappedHeight - 40}px)`;
      }

      // Update text to show consumption
      const text = this.container.querySelector('.water-text');
      
      // Calculate total ML based on the specific location's ML per message
      let totalML = weeklyCount * locationML;
      let output = totalML > 1000 ? (totalML / 1000).toFixed(1) + " L" : totalML.toFixed(1) + " mL";
      text.textContent = `Water consumed: ${output} (${percentage.toFixed(0)}%)`;
  }

  changeTheme(theme) {
    if (this.pillElement) {
        // Remove existing theme classes
        this.pillElement.classList.remove('light', 'dark', 'intrusive');
        // Add the new theme class
        this.pillElement.classList.add(theme);
        console.log(`WaterIndicator theme changed to ${theme}`);
    }
  }
}

// Add start date tracking
if (!localStorage.getItem('chatgptStartDate')) {
  localStorage.setItem('chatgptStartDate', new Date().toISOString());
}

// Initialize weekday counts
let weekdayCounts = {
  Monday: 0,
  Tuesday: 0,
  Wednesday: 0,
  Thursday: 0,
  Friday: 0,
  Saturday: 0,
  Sunday: 0,
  lastReset: new Date().toISOString()
};

// Load stored weekday counts from localStorage
const storedWeekdayCounts = localStorage.getItem('chatgptWeekdayCounts');
if (storedWeekdayCounts) {
  weekdayCounts = JSON.parse(storedWeekdayCounts);
}

chrome.runtime.sendMessage({ type: "showNotification" }, (response) => {
  console.log(response.status);
});

let messageCount = {
  count: 0,
  lastUpdated: new Date().toISOString()
};

// Initialize weekly message count
let weeklyMessageCount = {
  count: 0,
  lastReset: new Date().toISOString()
};

// Load stored counts from localStorage
const storedData = localStorage.getItem('chatgptMessageCount');
if (storedData) {
  messageCount = JSON.parse(storedData);
  console.log('Loaded existing count:', messageCount);
}

const storedWeeklyData = localStorage.getItem('chatgptWeeklyMessageCount');
if (storedWeeklyData) {
  weeklyMessageCount = JSON.parse(storedWeeklyData);
  console.log('Loaded existing weekly count:', weeklyMessageCount);
}

// Function to check and reset the weekly count if it's a new week
function checkAndResetWeeklyCount() {
  const now = new Date();
  const lastReset = new Date(weeklyMessageCount.lastReset);

  const mostRecentMonday = new Date(now);
  mostRecentMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  mostRecentMonday.setHours(0, 1, 0, 0);

  if (lastReset < mostRecentMonday) {
    weeklyMessageCount.count = 0;
    weeklyMessageCount.lastReset = now.toISOString();
    // Reset weekday counts
    weekdayCounts = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
      lastReset: now.toISOString()
    };
    localStorage.setItem('chatgptWeekdayCounts', JSON.stringify(weekdayCounts));
    localStorage.setItem('chatgptWeeklyMessageCount', JSON.stringify(weeklyMessageCount));
    console.log('Weekly count and weekday counts reset.');
  } else {
    // Load existing weekday counts if not resetting
    const storedWeekdayCounts = localStorage.getItem('chatgptWeekdayCounts');
    if (storedWeekdayCounts) {
      try {
        const parsedCounts = JSON.parse(storedWeekdayCounts);
        if (parsedCounts && typeof parsedCounts === 'object' && 'Monday' in parsedCounts) {
          weekdayCounts = parsedCounts;
        }
      } catch (error) {
        console.error('Error loading weekday counts:', error);
      }
    }
  }
}

// Call checkAndResetWeeklyCount initially to handle weekly reset
checkAndResetWeeklyCount();

function updateCount() {
  messageCount.count++;
  messageCount.lastUpdated = new Date().toISOString();
  localStorage.setItem('chatgptMessageCount', JSON.stringify(messageCount));
  console.log('Message counted! New count:', messageCount.count);

  checkAndResetWeeklyCount();
  weeklyMessageCount.count++;
  localStorage.setItem('chatgptWeeklyMessageCount', JSON.stringify(weeklyMessageCount));
  console.log('Weekly message counted! New weekly count:', weeklyMessageCount.count);

  // Update the water indicator if it exists
  if (window.waterIndicator) {
    chrome.storage.local.get(['weeklyLimit', 'selectedLocation', 'themeo'], (data) => {
      const weeklyLimit = data.weeklyLimit || 25; // Default to 100 if not set
      const locationML = data.selectedLocation || 14.794; // Default to 50mL if not set

      window.waterIndicator.update(weeklyMessageCount.count, weeklyLimit, locationML);
    });
  }

  // Add this inside updateCount(), after the weekly message count update:
  // Update weekday count
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[new Date().getDay()];
  weekdayCounts[currentDay]++;
  localStorage.setItem('chatgptWeekdayCounts', JSON.stringify(weekdayCounts));
  console.log('Weekday counts updated:', weekdayCounts);

  chrome.runtime.sendMessage({ action: "triggerFunction" });

}

window.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    updateCount();
  }
}, true);

      // Debounce function to delay the execution of updateCount
      let debounceTimeout;

      function debounceUpdateCount() {
          // Clear the previous timeout if the function is called again before the delay
          clearTimeout(debounceTimeout);

          // Set a new timeout to call updateCount after 300ms (you can adjust the time)
          debounceTimeout = setTimeout(function() {
              updateCount();  // Execute the function after the specified delay
          }, 900);  // Delay in milliseconds (e.g., 300ms)
      }

      // Funktion til at tilføje click event listener, når knappen er aktiveret
      function addClickListenerIfEnabled(sendButton) {
          if (sendButton && !sendButton.disabled) {
              sendButton.addEventListener('click', function() {
                  console.log('Button clicked!');
                  debounceUpdateCount();  // Call the debounced function instead of updateCount directly
              });
          }
      }

      // Vent på, at DOM'en er fuldt indlæst
      document.addEventListener('DOMContentLoaded', function() {
          // Brug MutationObserver til at observere ændringer i DOM'en
          const observer = new MutationObserver(function(mutationsList) {
              for (let mutation of mutationsList) {
                  if (mutation.type === 'childList') {
                      // Tjek om knappen er blevet tilføjet
                      const sendButton = document.querySelector('[data-testid="send-button"]');
                      if (sendButton) {
                          // Når knappen er tilføjet, tilføj event listeneren, hvis den er aktiveret
                          addClickListenerIfEnabled(sendButton);
                      }
                  }
              }
          });

          // Sørg for, at vi observerer et gyldigt container-element
          const container = document.body; // Eller et andet container-element
          if (container) {
              observer.observe(container, { childList: true, subtree: true });
          } else {
              console.error('Container element not found!');
          }
      });



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === 'getChatGPTMessageCount') {
    const data = localStorage.getItem('chatgptMessageCount');
    const parsedData = JSON.parse(data) || { count: 0, lastUpdated: null };
    sendResponse(JSON.stringify({
      count: parsedData.count,
      lastUpdated: parsedData.lastUpdated ? new Date(parsedData.lastUpdated).getTime() : null
    }));
  } else if (message === 'getChatGPTWeeklyMessageCount') {
    const weeklyData = localStorage.getItem('chatgptWeeklyMessageCount');
    const parsedWeeklyData = JSON.parse(weeklyData) || { count: 0, lastReset: null };
    sendResponse(JSON.stringify({
      count: parsedWeeklyData.count,
      lastReset: parsedWeeklyData.lastReset ? new Date(parsedWeeklyData.lastReset).getTime() : null
    }));
  } else if (message === 'getChatGPTStats') {
    const startDate = localStorage.getItem('chatgptStartDate');
    const weekdayData = localStorage.getItem('chatgptWeekdayCounts');
    const weeklyData = localStorage.getItem('chatgptWeeklyMessageCount');
    const parsedWeeklyData = JSON.parse(weeklyData) || { count: 0, lastReset: null };
    
    sendResponse(JSON.stringify({
      startDate: startDate ? new Date(startDate).getTime() : null,
      weekdayCounts: JSON.parse(weekdayData) || {},
      usageStats: {
        totalDays: startDate ? Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24)) : 0,
        weekdayDistribution: JSON.parse(weekdayData) || {},
        avgMessagesPerDay: startDate ? 
          (parsedWeeklyData.count / Math.max(1, Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24)))).toFixed(2) : 0
      }
    }));
  } else if (message === 'resetChatGPTMessageCount') {
    const newMessageCount = { count: 0, lastUpdated: new Date().toISOString() };
    localStorage.setItem('chatgptMessageCount', JSON.stringify(newMessageCount));
    messageCount = newMessageCount;

                                                    // Create the new data object
                                                    const currentDate = new Date().toISOString(); // Get the current date in ISO format
                                                    const now = Date.now(); // Get the current timestamp
                            
                                                    const updatedData = {
                                                        startDate: now, // Set current timestamp as startDate
                                                        weekdayCounts: {
                                                            Monday: 0,
                                                            Tuesday: 0,
                                                            Wednesday: 0,
                                                            Thursday: 0,
                                                            Friday: 0,
                                                            Saturday: 0,
                                                            Sunday: 0,
                                                            lastReset: currentDate // Set current date as lastReset
                                                        },
                                                        usageStats: {
                                                            totalDays: 0,
                                                            weekdayDistribution: {
                                                                Monday: 0,
                                                                Tuesday: 0,
                                                                Wednesday: 0,
                                                                Thursday: 0,
                                                                Friday: 0,
                                                                Saturday: 0,
                                                                Sunday: 0,
                                                                lastReset: currentDate // Set current date as lastReset
                                                            },
                                                            avgMessagesPerDay: "0.00"
                                                        }
                                                    };
                            
                                                    console.log("data deleted")
                            
                                                    // Store it in localStorage
                                                    localStorage.setItem('chatGPTStats', JSON.stringify(updatedData));


                                                    const updatedWeekdayCounts = {
                                                      Monday: 0,
                                                      Tuesday: 0,
                                                      Wednesday: 0,
                                                      Thursday: 0,
                                                      Friday: 0,
                                                      Saturday: 0,
                                                      Sunday: 0,
                                                      lastReset: new Date().toISOString() // Update lastReset to the current date and time
                                                  };
                                                  
                                                  // Store the updated object in localStorage
                                                  localStorage.setItem('chatgptWeekdayCounts', JSON.stringify(updatedWeekdayCounts));
                                                  
                                                  // Log the update
                                                  console.log('Weekday counts reset to zero');

                                                    const newWeeklyMessageCount = { count: 0, lastReset: new Date().toISOString() };
                                                    localStorage.setItem('chatgptWeeklyMessageCount', JSON.stringify(newWeeklyMessageCount));
                                                    weeklyMessageCount = newWeeklyMessageCount;
                                                    sendResponse('Weekly message count reset');
    sendResponse('Message count reset');
  } else if (message === 'resetChatGPTWeeklyMessageCount') {
    const newWeeklyMessageCount = { count: 0, lastReset: new Date().toISOString() };
    localStorage.setItem('chatgptWeeklyMessageCount', JSON.stringify(newWeeklyMessageCount));
    weeklyMessageCount = newWeeklyMessageCount;
    sendResponse('Weekly message count reset');
  } else if (message.action === 'changeTheme') {
    if (window.waterIndicator) {
      localStorage.setItem('themeo', message.theme);
      window.waterIndicator.changeTheme(message.theme);
    }
  }
});

window.testCounter = function() {
  alert('Counter is active! Current count: ' + messageCount.count + ', Weekly count: ' + weeklyMessageCount.count);
};

function initializeObserver() {
  const observer = new MutationObserver(() => {
      const shareButton = document.querySelector('[data-testid="profile-button"]');
      
      if (shareButton && !document.querySelector('.water-pill')) {
          const waterDiv = document.createElement('div');
          
          const waterIndicator = new WaterIndicator(waterDiv, "1");
          
          shareButton.parentNode.insertBefore(waterDiv, shareButton);
          console.log("Water indicator injected");

          // Fetch weekly limit and selected location to calculate water consumption
          chrome.storage.local.get(['weeklyLimit', 'selectedLocation'], (data) => {
              const weeklyLimit = isNaN(data.weeklyLimit) ? 25 : data.weeklyLimit || 25; // Default to 25 if not set
              const locationML = data.selectedLocation || 25; // Default to 25mL if not set
              const theme = localStorage.getItem('themeo')
              
              // Use the existing weeklyMessageCount from localStorage
              const storedWeeklyData = localStorage.getItem('chatgptWeeklyMessageCount');
              const weeklyMessageCount = storedWeeklyData ? JSON.parse(storedWeeklyData).count : 0;

            console.log('=== ChatGPT Counter Ready !!!');

              // Update the water indicator with current weekly count, limit, and location ML
              console.log(locationML)
              waterIndicator.update(weeklyMessageCount, weeklyLimit, locationML);
              waterIndicator.changeTheme(theme);
              window.waterIndicator = waterIndicator;
          });
      }
  });

  if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
  } else {
      console.error("document.body is not available.");
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeObserver);
} else {
  initializeObserver();
}

