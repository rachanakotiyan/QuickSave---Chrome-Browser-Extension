
const saveBtn = document.getElementById("saveBtn");
const savedList = document.getElementById("savedList");

async function displayPages() {
  const result = await chrome.storage.local.get("pages");
  const pages = result.pages || [];

  savedList.innerHTML = "";

  pages.forEach((page, index) => {
    const li = document.createElement("li");
    const link = document.createElement("a");

    link.href = page.url;
    link.textContent = page.title;
    link.target = "_blank";

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";

    removeBtn.addEventListener("click", async () => {
      pages.splice(index, 1);
      await chrome.storage.local.set({ pages });
      displayPages();
    });

    li.append(link, removeBtn);
    savedList.appendChild(li);
  });
}

saveBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  const result = await chrome.storage.local.get("pages");
  const pages = result.pages || [];

  if (!tab.url.startsWith("http")) return;

  pages.push({
    title: tab.title,
    url: tab.url
  });

  await chrome.storage.local.set({ pages });
  displayPages();
});

displayPages();
