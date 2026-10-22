// Logique de l'interface. Les appels réseau passent par apiRequest() (api.js).
var form = document.getElementById("item-form");
var nameInput = document.getElementById("name");
var descInput = document.getElementById("description");
var submitBtn = document.getElementById("submit-btn");
var refreshBtn = document.getElementById("refresh-btn");
var listEl = document.getElementById("items");
var emptyEl = document.getElementById("empty");
var errorBox = document.getElementById("error-box");
var statusEl = document.getElementById("server-status");

// Mémorise la tentative d'ajout en cours : si elle échoue et que l'utilisateur
// renvoie le MÊME contenu, on réutilise le même requestId (pas de doublon).
var pending = null;

function newRequestId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
}

function showServer(result) {
  if (result.backend === "primary") {
    statusEl.textContent = "Serveur principal (Railway) — OK";
    statusEl.className = "status ok";
  } else {
    statusEl.textContent = "Serveur de secours (Vercel) utilisé — le principal est indisponible";
    statusEl.className = "status warn";
  }
}

function render(items) {
  listEl.replaceChildren();
  emptyEl.hidden = items.length > 0;
  items.forEach(function (item) {
    var li = document.createElement("li");
    var title = document.createElement("strong");
    title.textContent = item.name; // textContent : pas d'injection HTML
    li.appendChild(title);
    if (item.description) {
      var p = document.createElement("p");
      p.textContent = item.description;
      li.appendChild(p);
    }
    if (item.createdAt) {
      var small = document.createElement("small");
      small.textContent = new Date(item.createdAt).toLocaleString("fr-FR");
      li.appendChild(small);
    }
    listEl.appendChild(li);
  });
}

async function loadItems() {
  clearError();
  refreshBtn.disabled = true;
  try {
    var result = await apiRequest("/api/items");
    render(result.data);
    showServer(result);
  } catch (err) {
    statusEl.textContent = "Serveur indisponible";
    statusEl.className = "status";
    showError(err.message);
  } finally {
    refreshBtn.disabled = false;
  }
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearError();

  var payload = { name: nameInput.value.trim(), description: descInput.value.trim() };
  if (!payload.name) return showError("Le nom est obligatoire.");
  if (payload.name.length > 100) return showError("Le nom ne doit pas dépasser 100 caractères.");

  var same = pending && pending.name === payload.name && pending.description === payload.description;
  if (!same) pending = { name: payload.name, description: payload.description, requestId: newRequestId() };

  submitBtn.disabled = true;
  try {
    var result = await apiRequest("/api/items", {
      method: "POST",
      body: { name: pending.name, description: pending.description, requestId: pending.requestId },
    });
    pending = null;
    form.reset();
    showServer(result);
    await loadItems();
  } catch (err) {
    showError(err.message); // pending conservé : un nouvel essai réutilise le même requestId
  } finally {
    submitBtn.disabled = false;
  }
});

refreshBtn.addEventListener("click", loadItems);
loadItems();
