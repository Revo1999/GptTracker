chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "showNotification") {
      chrome.notifications.create(
        "name-for-notification",
        {
          type: "basic",
          iconUrl: "icon16.png",
          title: "ChatGPT Counter",
          message: 'ChatGPT Counter Extension loaded!!!',
        },
        function () {}
      );
      sendResponse({ status: "Notification shown" });
    }
  });