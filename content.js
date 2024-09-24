// content.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "generatePost") {
    generatePost();
  }
});

function generatePost() {
  // Create a modal wrapper (for the background overlay)
  const modalWrapper = document.createElement("div");
  modalWrapper.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;

  // Create a modal dialog
  const modal = document.createElement("div");
  modal.style.cssText = `
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    max-width: 600px;
    width: 90%;
    position: relative;
  `;

  // Add content to the modal
  modal.innerHTML = `
    <button id="closeButton" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
    <h2>LinkedIn Post Helper</h2>
    <ol>
      <li>
        <strong>Headline:</strong>
        <input type="text" id="headline" placeholder="Enter attention-grabbing headline">
      </li>
      <li>
        <strong>Target Audience:</strong>
        <input type="text" id="audience" placeholder="Describe your target audience">
      </li>
      <li>
        <strong>Main Point:</strong>
        <textarea id="mainPoint" placeholder="What's the main actionable point?"></textarea>
      </li>
      <li>
        <strong>Pain Point:</strong>
        <input type="text" id="painPoint" placeholder="What problem are you solving?">
      </li>
      <li>
        <strong>Emotion:</strong>
        <select id="emotion">
          <option value="">Select an emotion</option>
          <option value="inspiring">Inspiring</option>
          <option value="surprising">Surprising</option>
          <option value="frustrating">Frustrating</option>
          <option value="exciting">Exciting</option>
        </select>
      </li>
    </ol>
    <button id="generateButton">Generate Post with Claude</button>
    <button id="insertButton" style="display: none;">Insert Prompt into Claude</button>
    <div id="result" style="margin-top: 20px;"></div>
  `;

  // Add the modal to the wrapper, and the wrapper to the page
  modalWrapper.appendChild(modal);
  document.body.appendChild(modalWrapper);

  // Function to close the modal
  function closeModal() {
    document.body.removeChild(modalWrapper);
  }

  // Close modal when clicking outside
  modalWrapper.addEventListener("click", function (event) {
    if (event.target === modalWrapper) {
      closeModal();
    }
  });

  // Close modal when clicking close button
  document.getElementById("closeButton").addEventListener("click", closeModal);

  // Add event listener to the generate button
  document
    .getElementById("generateButton")
    .addEventListener("click", function () {
      const headline = document.getElementById("headline").value;
      const audience = document.getElementById("audience").value;
      const mainPoint = document.getElementById("mainPoint").value;
      const painPoint = document.getElementById("painPoint").value;
      const emotion = document.getElementById("emotion").value;

      const prompt = `Create a LinkedIn post based on the following:
    Headline: ${headline}
    Target Audience: ${audience}
    Main Point: ${mainPoint}
    Pain Point: ${painPoint}
    Emotion to evoke: ${emotion}

    Follow these guidelines:
    1. Use the provided headline as is or improve it to be more attention-grabbing.
    2. Write as if talking to one person from the target audience.
    3. Focus on actionable content that produces quick wins.
    4. Keep the most engaging content in the first half of the post.
    5. Format for mobile: use short paragraphs and line breaks.
    6. Address the specified pain point.
    7. Evoke the chosen emotion.
    8. Keep it concise and avoid over-educating.`;

      document.getElementById("result").innerText =
        "Prompt to send to Claude:\n\n" + prompt;
      document.getElementById("insertButton").style.display = "block";
    });

  // Add event listener to the insert button
  document
    .getElementById("insertButton")
    .addEventListener("click", function () {
      const prompt = document
        .getElementById("result")
        .innerText.replace("Prompt to send to Claude:\n\n", "");
      insertPromptUniversally(prompt);
      closeModal();
    });
}

function insertPromptUniversally(prompt) {
  // Find the active element
  let activeElement = document.activeElement;

  // If no element is actively focused, try to find a visible editable element
  if (!activeElement || activeElement === document.body) {
    activeElement = findVisibleEditableElement();
  }

  if (activeElement) {
    if (isEditableElement(activeElement)) {
      insertTextIntoElement(activeElement, prompt);
    } else {
      console.error("The focused element is not editable.");
      alert("Please click on an editable area before inserting the prompt.");
    }
  } else {
    console.error("Couldn't find an editable element.");
    alert(
      "Couldn't find an editable area. Please click on a text input or editable area before inserting the prompt."
    );
  }
}


function findVisibleEditableElement() {
  const editableElements = document.querySelectorAll(
    'input[type="text"], textarea, [contenteditable="true"]'
  );
  for (let element of editableElements) {
    if (isElementVisible(element)) {
      return element;
    }
  }
  return null;
}

function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

function isEditableElement(element) {
  return (
    element.isContentEditable ||
    element.tagName.toLowerCase() === "input" ||
    element.tagName.toLowerCase() === "textarea"
  );
}

function insertTextIntoElement(element, text) {
  if (element.isContentEditable) {
    // For contenteditable elements
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(text);
    range.deleteContents();
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // For input and textarea elements
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    element.value = value.substring(0, start) + text + value.substring(end);
    element.selectionStart = element.selectionEnd = start + text.length;
  }

  // Trigger input event
  const inputEvent = new Event("input", { bubbles: true, cancelable: true });
  element.dispatchEvent(inputEvent);

  // Focus the element
  element.focus();
}

function insertPromptIntoClaude(prompt) {
  const editorDiv = document.querySelector(
    'div[contenteditable="true"].ProseMirror'
  );
  if (editorDiv) {
    // Clear existing content
    editorDiv.innerHTML = "";

    // Create a new paragraph element
    const p = document.createElement("p");
    p.textContent = prompt;

    // Append the new paragraph to the editor
    editorDiv.appendChild(p);

    // Trigger an input event to notify Claude that the content has changed
    const inputEvent = new Event("input", {
      bubbles: true,
      cancelable: true,
    });
    editorDiv.dispatchEvent(inputEvent);
  } else {
    console.error("Couldn't find Claude's editor.");
    alert(
      "Couldn't find Claude's editor. Please make sure you're on the Claude chat page."
    );
  }
}
