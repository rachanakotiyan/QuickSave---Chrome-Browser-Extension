
const saveBtn = document.getElementById("saveBtn");
const savedList = document.getElementById("savedList");

// Search input
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");

// Display saved pages
async function displayPages(searchText = "") {
  const result = await chrome.storage.local.get("pages");
  const pages = result.pages || [];

  savedList.innerHTML = "";

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchText.toLowerCase())
  );

  filteredPages.forEach(page => {
    const li = document.createElement("li");
    const link = document.createElement("a");

    link.href = page.url;
    link.textContent = page.title;
    link.target = "_blank";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";

    removeBtn.addEventListener("click", async () => {
      const updatedPages = pages.filter(
        item => item.url !== page.url
      );

      await chrome.storage.local.set({
        pages: updatedPages
      });

      displayPages(searchInput.value);
    });

    li.append(link, removeBtn);
    savedList.appendChild(li);
  });
}

// Save current webpage
saveBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab.url || !tab.url.startsWith("http")) {
    message.textContent = "Cannot save this page.";
    return;
  }

  const result = await chrome.storage.local.get("pages");
  const pages = result.pages || [];

  // Check for duplicates
  const alreadySaved = pages.some(
    page => page.url === tab.url
  );

  if (alreadySaved) {
    message.textContent = "Already saved!";
    return;
  }

  pages.push({
    title: tab.title || tab.url,
    url: tab.url
  });

  await chrome.storage.local.set({ pages });

  message.textContent = "Page saved successfully!";
  displayPages(searchInput.value);
});

// Search saved pages
searchInput.addEventListener("input", () => {
  displayPages(searchInput.value);
});

// Initial display
displayPages();
