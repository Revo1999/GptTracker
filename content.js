console.log('=== ChatGPT Counter Extension Starting ===');

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
              background-color: #212121;
              border: 1px solid #424242;
              padding: 8px 12px;
              border-radius: 100px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              width: 300px;
              height: 40px;
              box-sizing: border-box;
          }

          .water-text {
              color: white;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 14px;
              font-weight: 600;
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

          .circle-svg {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
          }

          .circle-svg-back {
              z-index: 0;
          }

          .circle-svg-front {
              z-index: 1;
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

  createCircleSVGs() {
      return {
          back: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 36 36" fill="none" class="circle-svg circle-svg-back">
                   <circle cx="18" cy="18" r="18" fill="#F4F4F4"/>
                 </svg>`,
          front: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 34 34" fill="none" class="circle-svg circle-svg-front">
                    <circle cx="17" cy="16.9999" r="16.9091" fill="#89BCFF" fill-opacity="0.5"/>
                  </svg>`
      };
  }

  render() {
      this.createStyles();

      const pill = document.createElement('div');
      pill.className = 'water-pill';

      const text = document.createElement('div');
      text.className = 'water-text';
      text.textContent = `Water consumed: ${this.value} mL`;

      const circleContainer = document.createElement('div');
      circleContainer.className = 'water-circle-container';
      
      // Insert both SVG circles
      const svgs = this.createCircleSVGs();
      circleContainer.innerHTML = svgs.back + svgs.front;

      // Add PNG image
      const waterIcon = document.createElement('img');
      waterIcon.className = 'fish';
      waterIcon.src = chrome.runtime.getURL('fish.png');
      waterIcon.alt = 'fish icon';
      circleContainer.appendChild(waterIcon);

      pill.appendChild(text);
      pill.appendChild(circleContainer);

      this.container.appendChild(pill);
  }

  update(newValue) {
      this.value = newValue;
      const text = this.container.querySelector('.water-text');
      text.textContent = `Water consumed: ${this.value} mL`;
  }
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

  // Calculate the most recent Monday 00:01
  const mostRecentMonday = new Date(now);
  mostRecentMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  mostRecentMonday.setHours(0, 1, 0, 0);

  // Reset weekly count if last reset was before this past Monday
  if (lastReset < mostRecentMonday) {
    weeklyMessageCount.count = 0;
    weeklyMessageCount.lastReset = now.toISOString();
    localStorage.setItem('chatgptWeeklyMessageCount', JSON.stringify(weeklyMessageCount));
    console.log('Weekly count reset.');
  }
}

// Call checkAndResetWeeklyCount initially to handle weekly reset
checkAndResetWeeklyCount();

function updateCount() {
  messageCount.count++;
  messageCount.lastUpdated = new Date().toISOString();
  localStorage.setItem('chatgptMessageCount', JSON.stringify(messageCount));
  console.log('Message counted! New count:', messageCount.count);

  if (window.waterIndicator) {
      window.waterIndicator.update(messageCount.count);
  }

  checkAndResetWeeklyCount();
  weeklyMessageCount.count++;
  localStorage.setItem('chatgptWeeklyMessageCount', JSON.stringify(weeklyMessageCount));
  console.log('Weekly message counted! New weekly count:', weeklyMessageCount.count);

  
  let weeklylimitdata;
  let locationselecteddata; 


  chrome.storage.local.get('weeklyLimit', (data) => {
    weeklylimitdata = data.weeklyLimit;
  
    chrome.storage.local.get('locationSelected', (data) => {
      locationselecteddata = data.locationSelected;
      

      let totalML = (locationselecteddata * weeklyMessageCount.count).toFixed(2);
      let output = totalML > 1000 ? (totalML / 1000).toFixed(2) + " L" : totalML + " mL";

      console.log(locationselecteddata);
      console.log(weeklyMessageCount.count);
      document.querySelector('.water-text').textContent = 
      `${"Water consumed: " + output}`
     
    });
  });


}

window.addEventListener('keydown', function(event) {
  console.log('Key pressed:', event.key);
  if (event.key === 'Enter' && !event.shiftKey) {
    console.log('Enter pressed without shift!');
    updateCount();
  }
}, true);

document.addEventListener('submit', function(event) {
  console.log('Form submitted!');
  updateCount();
}, true);

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
  } else if (message === 'resetChatGPTMessageCount') {
      const newMessageCount = { count: 0, lastUpdated: new Date().toISOString() };
      localStorage.setItem('chatgptMessageCount', JSON.stringify(newMessageCount));
      messageCount = newMessageCount;
      sendResponse('Message count reset');
  } else if (message === 'resetChatGPTWeeklyMessageCount') {
      const newWeeklyMessageCount = { count: 0, lastReset: new Date().toISOString() };
      localStorage.setItem('chatgptWeeklyMessageCount', JSON.stringify(newWeeklyMessageCount));
      weeklyMessageCount = newWeeklyMessageCount;
      sendResponse('Weekly message count reset');
  }
});

window.testCounter = function() {
  alert('Counter is active! Current count: ' + messageCount.count + ', Weekly count: ' + weeklyMessageCount.count);
};

console.log('=== ChatGPT Counter Ready !!!');

function initializeObserver() {

  const observer = new MutationObserver(() => {
      const shareButton = document.querySelector('[data-testid="profile-button"]');
      
      //create html div element for water indicator
      if (shareButton && !document.querySelector('.water-pill')) {
          const waterDiv = document.createElement('div');
          
          const waterIndicator = new WaterIndicator(waterDiv, "1");
          
          
          shareButton.parentNode.insertBefore(waterDiv, shareButton);
          console.log("Water indicator injected");

          let weeklylimitdata;
          let locationselecteddata; 
        
        
          chrome.storage.local.get('weeklyLimit', (data) => {
            weeklylimitdata = data.weeklyLimit;
          
            chrome.storage.local.get('locationSelected', (data) => {
              locationselecteddata = data.locationSelected;

              let totalML = (locationselecteddata * weeklyMessageCount.count).toFixed(2);
              let output = totalML > 1000 ? (totalML / 1000).toFixed(2) + " L" : totalML + " mL";
          
              document.querySelector('.water-text').textContent = 
              `${"Water consumed: " + (output)}`
             
            });
          });


          window.waterIndicator = waterIndicator;
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
