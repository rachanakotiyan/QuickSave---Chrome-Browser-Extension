
const saveBtn = document.getElementById("saveBtn");
const categoryInput = document.getElementById("categoryInput");
const collectionsList = document.getElementById("collectionsList");
const pagesList = document.getElementById("pagesList");
const searchInput = document.getElementById("searchInput");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const message = document.getElementById("message");
const pageHeading = document.getElementById("pageHeading");

let categories = [];
let pages = [];

let selectedCategoryId = "all";

// Generate unique IDs
function generateId() {
  return crypto.randomUUID();
}

// Load data from Chrome storage
async function loadData() {
  const data = await chrome.storage.local.get([
    "categories",
    "pages"
  ]);

  categories = data.categories || [];
  pages = data.pages || [];

  renderCategories();
  renderCategoryOptions();
  renderPages();
}

// Save data to Chrome storage
async function saveData() {
  await chrome.storage.local.set({
    categories,
    pages
  });
}

// Show message
function showMessage(text) {
  message.textContent = text;
}

// Create a category
addCategoryBtn.addEventListener("click", async () => {
  const name = prompt("Enter collection name:");

  if (!name || !name.trim()) return;

  const cleanName = name.trim();

  const exists = categories.some(
    category =>
      category.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (exists) {
    showMessage("Collection already exists!");
    return;
  }

  categories.push({
    id: generateId(),
    name: cleanName
  });

  await saveData();

  renderCategories();
  renderCategoryOptions();
  showMessage("Collection created!");
});

// Render categories
function renderCategories() {
  collectionsList.innerHTML = "";

  const allCollection = document.createElement("div");
  allCollection.className = "collection";

  const allButton = document.createElement("button");
  allButton.className = "collection-name";
  allButton.textContent = "All Saved Pages";

  const allCount = document.createElement("span");
  allCount.className = "collection-count";
  allCount.textContent = pages.length;

  allButton.addEventListener("click", () => {
    selectedCategoryId = "all";
    renderPages();
  });

  allCollection.append(allButton, allCount);
  collectionsList.appendChild(allCollection);

  const uncategorized = document.createElement("div");
  uncategorized.className = "collection";

  const uncategorizedButton = document.createElement("button");
  uncategorizedButton.className = "collection-name";
  uncategorizedButton.textContent = "Uncategorized";

  const uncategorizedCount = document.createElement("span");
  uncategorizedCount.className = "collection-count";

  uncategorizedCount.textContent = pages.filter(
    page => !page.categoryId
  ).length;

  uncategorizedButton.addEventListener("click", () => {
    selectedCategoryId = "uncategorized";
    renderPages();
  });

  uncategorized.append(
    uncategorizedButton,
    uncategorizedCount
  );

  collectionsList.appendChild(uncategorized);

  categories.forEach(category => {
    const container = document.createElement("div");
    container.className = "collection";

    const nameButton = document.createElement("button");
    nameButton.className = "collection-name";
    nameButton.textContent = category.name;

    const count = document.createElement("span");
    count.className = "collection-count";

    count.textContent = pages.filter(
      page => page.categoryId === category.id
    ).length;

    nameButton.addEventListener("click", () => {
      selectedCategoryId = category.id;
      renderPages();
    });

    const actions = document.createElement("div");
    actions.className = "collection-actions";

    const renameButton = document.createElement("button");
    renameButton.className = "small-btn";
    renameButton.textContent = "Edit";

    renameButton.addEventListener("click", async () => {
      const newName = prompt(
        "Enter new collection name:",
        category.name
      );

      if (!newName || !newName.trim()) return;

      const cleanName = newName.trim();

      const exists = categories.some(
        item =>
          item.id !== category.id &&
          item.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (exists) {
        showMessage("Collection name already exists!");
        return;
      }

      category.name = cleanName;

      await saveData();
      renderCategories();
      renderCategoryOptions();
      renderPages();

      showMessage("Collection renamed!");
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "small-btn";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async () => {
      const confirmed = confirm(
        `Delete "${category.name}"? Its pages will move to Uncategorized.`
      );

      if (!confirmed) return;

      // Move pages to Uncategorized
      pages = pages.map(page => {
        if (page.categoryId === category.id) {
          return {
            ...page,
            categoryId: null
          };
        }

        return page;
      });

      categories = categories.filter(
        item => item.id !== category.id
      );

      if (selectedCategoryId === category.id) {
        selectedCategoryId = "all";
      }

      await saveData();

      renderCategories();
      renderCategoryOptions();
      renderPages();

      showMessage("Collection deleted.");
    });

    actions.append(renameButton, deleteButton);

    container.append(nameButton, count, actions);

    collectionsList.appendChild(container);
  });
}

// Populate category dropdown
function renderCategoryOptions() {
  categoryInput.innerHTML = "";

  const uncategorizedOption = document.createElement("option");
  uncategorizedOption.value = "";
  uncategorizedOption.textContent = "Uncategorized";

  categoryInput.appendChild(uncategorizedOption);

  categories.forEach(category => {
    const option = document.createElement("option");

    option.value = category.id;
    option.textContent = category.name;

    categoryInput.appendChild(option);
  });
}

// Save current webpage
saveBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab.url || !tab.url.startsWith("http")) {
    showMessage("This page cannot be saved.");
    return;
  }

  const exists = pages.some(
    page => page.url === tab.url
  );

  if (exists) {
    showMessage("This page is already saved!");
    return;
  }

  pages.push({
    id: generateId(),
    title: tab.title || tab.url,
    url: tab.url,
    categoryId: categoryInput.value || null,
    savedAt: new Date().toISOString()
  });

  await saveData();

  renderCategories();
  renderPages();

  showMessage("Page saved successfully!");
});

// Render saved pages
function renderPages() {
  pagesList.innerHTML = "";

  let heading = "All Saved Pages";

  if (selectedCategoryId === "uncategorized") {
    heading = "Uncategorized";
  } else if (selectedCategoryId !== "all") {
    const category = categories.find(
      item => item.id === selectedCategoryId
    );

    heading = category ? category.name : "Saved Pages";
  }

  pageHeading.textContent = heading;

  const searchText = searchInput.value.toLowerCase();

  const filteredPages = pages.filter(page => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchText) ||
      page.url.toLowerCase().includes(searchText);

    let matchesCategory = true;

    if (selectedCategoryId === "uncategorized") {
      matchesCategory = !page.categoryId;
    } else if (selectedCategoryId !== "all") {
      matchesCategory =
        page.categoryId === selectedCategoryId;
    }

    return matchesSearch && matchesCategory;
  });

  if (filteredPages.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No saved pages found.";

    pagesList.appendChild(empty);
    return;
  }

  filteredPages.forEach(page => {
    const card = document.createElement("div");
    card.className = "page-card";

    const link = document.createElement("a");
    link.className = "page-link";
    link.href = page.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = page.title;

    const url = document.createElement("p");
    url.className = "page-url";
    url.textContent = page.url;

    const actions = document.createElement("div");
    actions.className = "page-actions";

    const moveSelect = document.createElement("select");

    const uncategorizedOption = document.createElement("option");
    uncategorizedOption.value = "";
    uncategorizedOption.textContent = "Uncategorized";

    moveSelect.appendChild(uncategorizedOption);

    categories.forEach(category => {
      const option = document.createElement("option");

      option.value = category.id;
      option.textContent = category.name;

      moveSelect.appendChild(option);
    });

    moveSelect.value = page.categoryId || "";

    moveSelect.addEventListener("change", async () => {
      page.categoryId = moveSelect.value || null;

      await saveData();

      renderCategories();
      renderPages();

      showMessage("Page moved successfully!");
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Remove";

    deleteButton.addEventListener("click", async () => {
      const confirmed = confirm(
        "Remove this saved page?"
      );

      if (!confirmed) return;

      pages = pages.filter(
        item => item.id !== page.id
      );

      await saveData();

      renderCategories();
      renderPages();

      showMessage("Page removed.");
    });

    actions.append(moveSelect, deleteButton);

    card.append(link, url, actions);

    pagesList.appendChild(card);
  });
}

// Search pages
searchInput.addEventListener("input", renderPages);

// Initialize extension
loadData();
