console.log('=== ChatGPT Counter Extension Starting ===');

chrome.runtime.sendMessage({ type: "showNotification" }, (response) => {
  console.log(response.status);
});

let messageCount = {
  count: 0,
  lastUpdated: new Date().toISOString()
};

// Load stored count from localStorage
const storedData = localStorage.getItem('chatgptMessageCount');
if (storedData) {
  messageCount = JSON.parse(storedData);
  console.log('Loaded existing count:', messageCount);
}

function updateCount() {
  messageCount.count++;
  messageCount.lastUpdated = new Date().toISOString();
  localStorage.setItem('chatgptMessageCount', JSON.stringify(messageCount));
  console.log('Message counted! New count:', messageCount.count);
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
      // Retrieve the message count from localStorage
      const data = localStorage.getItem('chatgptMessageCount');

      // Parse the data to ensure it's in the right format
      const parsedData = JSON.parse(data) || { count: 0, lastUpdated: null };

      // Respond with the message count and last updated time
      sendResponse(JSON.stringify({
          count: parsedData.count,
          lastUpdated: parsedData.lastUpdated ? new Date(parsedData.lastUpdated).getTime() : null
      }));
  } else if (message === 'resetChatGPTMessageCount') {
      // Reset the message count in localStorage
      const newMessageCount = { count: 0, lastUpdated: new Date().toISOString() };
      localStorage.setItem('chatgptMessageCount', JSON.stringify(newMessageCount));
      
      // Update the in-memory count
      messageCount = newMessageCount;

      // Send a response confirming the reset
      sendResponse('Message count reset');
  }
});

window.testCounter = function() {
  alert('Counter is active! Current count: ' + messageCount.count);
};

console.log('=== ChatGPT Counter Ready ===');