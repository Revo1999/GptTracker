  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "triggerFunction") {
      // Forward the message to options.js
      chrome.runtime.sendMessage({ action: "performActionInOptions" });
      sendResponse({ status: "Message forwarded to options.js" });
    }
  });