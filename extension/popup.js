const API_BASE = "http://localhost:8000/api";

// DOM Elements
const listView = document.getElementById("listView");
const detailView = document.getElementById("detailView");
const promptList = document.getElementById("promptList");
const searchInput = document.getElementById("searchInput");
const addBtn = document.getElementById("addBtn");
const backBtn = document.getElementById("backBtn");
const saveBtn = document.getElementById("saveBtn");
const copyBtn = document.getElementById("copyBtn");
const deleteBtn = document.getElementById("deleteBtn");
const promptNameInput = document.getElementById("promptName");
const promptContentInput = document.getElementById("promptContent");
const statusMessage = document.getElementById("statusMessage");

let currentPrompts = [];
let currentFilename = null; // null means creating new

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    fetchPrompts();
    
    // Search listener
    searchInput.addEventListener("input", (e) => {
        filterPrompts(e.target.value);
    });

    // Button listeners
    addBtn.addEventListener("click", () => {
        showDetail(null);
    });

    backBtn.addEventListener("click", () => {
        showList();
    });

    saveBtn.addEventListener("click", savePrompt);
    
    copyBtn.addEventListener("click", copyPrompt);

    deleteBtn.addEventListener("click", deletePrompt);
});

// Fetch Prompts
async function fetchPrompts() {
    try {
        const response = await fetch(`${API_BASE}/prompts`);
        if (!response.ok) throw new Error("Failed to fetch prompts");
        const data = await response.json();
        currentPrompts = data.files;
        renderPrompts(currentPrompts);
        setStatus("");
    } catch (err) {
        console.error(err);
        promptList.innerHTML = `<div class="error">Error connecting to server.<br>Is the Python script running?</div>`;
    }
}

// Render List
function renderPrompts(prompts) {
    promptList.innerHTML = "";
    if (prompts.length === 0) {
        promptList.innerHTML = `<div class="empty">No prompts found. Add one!</div>`;
        return;
    }

    prompts.forEach(filename => {
        const item = document.createElement("div");
        item.className = "prompt-item";
        item.textContent = filename;
        item.addEventListener("click", () => loadPrompt(filename));
        promptList.appendChild(item);
    });
}

// Filter Prompts
function filterPrompts(query) {
    const filtered = currentPrompts.filter(p => p.toLowerCase().includes(query.toLowerCase()));
    renderPrompts(filtered);
}

// Load a specific prompt
async function loadPrompt(filename) {
    try {
        const response = await fetch(`${API_BASE}/prompts/${encodeURIComponent(filename)}`);
        if (!response.ok) throw new Error("Failed to load prompt");
        const data = await response.json();
        showDetail(data);
    } catch (err) {
        setStatus("Error loading prompt: " + err.message);
    }
}

// Show Detail View
function showDetail(data) {
    listView.classList.add("hidden");
    detailView.classList.remove("hidden");
    
    if (data) {
        // Editing existing
        currentFilename = data.filename;
        promptNameInput.value = data.filename;
        promptNameInput.disabled = true; // Prevent renaming for simplicity for now
        promptContentInput.value = data.content;
        deleteBtn.style.display = "block";
    } else {
        // Creating new
        currentFilename = null;
        promptNameInput.value = "";
        promptNameInput.disabled = false;
        promptContentInput.value = "";
        deleteBtn.style.display = "none";
    }
    setStatus("");
}

// Show List View
function showList() {
    detailView.classList.add("hidden");
    listView.classList.remove("hidden");
    fetchPrompts(); // Refresh list
}

// Save Prompt
async function savePrompt() {
    const name = promptNameInput.value.trim();
    const content = promptContentInput.value;

    if (!name) {
        setStatus("Please enter a name.");
        return;
    }

    try {
        let url, method, body;
        
        if (currentFilename) {
            // Update
            url = `${API_BASE}/prompts/${encodeURIComponent(currentFilename)}`;
            method = "POST"; // Using POST for update based on our server
            body = { content: content };
        } else {
            // Create
            url = `${API_BASE}/prompts`;
            method = "POST";
            body = { filename: name, content: content };
        }

        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Failed to save");
        }

        setStatus("Saved successfully!");
        setTimeout(() => {
            showList();
        }, 800);
        
    } catch (err) {
        setStatus("Error saving: " + err.message);
    }
}

// Copy Content
function copyPrompt() {
    const content = promptContentInput.value;
    navigator.clipboard.writeText(content).then(() => {
        setStatus("Copied to clipboard!");
        setTimeout(() => setStatus(""), 2000);
    }).catch(err => {
        setStatus("Failed to copy: " + err);
    });
}

// Delete Prompt
async function deletePrompt() {
    if (!currentFilename || !confirm(`Delete "${currentFilename}"?`)) return;

    try {
        const response = await fetch(`${API_BASE}/prompts/${encodeURIComponent(currentFilename)}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Failed to delete");

        setStatus("Deleted.");
        setTimeout(() => {
            showList();
        }, 800);
    } catch (err) {
        setStatus("Error deleting: " + err.message);
    }
}

function setStatus(msg) {
    statusMessage.textContent = msg;
}
