console.log('=== ChatGPT Counter Extension Starting ===');

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

  // Update weekly count
  checkAndResetWeeklyCount();
  weeklyMessageCount.count++;
  localStorage.setItem('chatgptWeeklyMessageCount', JSON.stringify(weeklyMessageCount));
  console.log('Weekly message counted! New weekly count:', weeklyMessageCount.count);
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
      
      if (shareButton && !document.querySelector('.info-box')) {
          const infoBox = document.createElement('div');
          infoBox.textContent = "Here is our banner!";
          infoBox.classList.add('info-box');
          shareButton.parentNode.insertBefore(infoBox, shareButton);
          console.log("Button not found, infographics injected");
      }
  });

  if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
  } else {
      console.error("document.body er ikke tilgængelig.");
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeObserver);
} else {
  initializeObserver();
}
