chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.includes("claude.ai")) {
    try {
      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      // Send message to the content script
      chrome.tabs.sendMessage(tab.id, { action: "generatePost" });
    } catch (err) {
      console.error("Error injecting script: ", err);
    }
  } else {
    chrome.tabs.create({ url: "https://www.claude.ai" });
  }
});
