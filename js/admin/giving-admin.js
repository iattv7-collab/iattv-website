// ======================================================
// FILE: /js/admin/giving-admin.js
// PROJECT: IATTV Website
// PURPOSE:
// Manages IATTV giving / offering payment methods
// in the administration system.
// ======================================================

import { auth } from "/js/services/firebase-config.js";

import { requireAdmin } from "/js/admin/admin-guard.js";

import {
  getGivingMethods,
  saveGivingMethod,
  deleteGivingMethod,
} from "/js/services/giving-methods-service.js";

import { signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// ======================================================
// ELEMENTS
// ======================================================

const loadingEl = document.getElementById("adminLoading");
const appEl = document.getElementById("adminApp");
const adminNameEl = document.getElementById("adminName");
const signOutButton = document.getElementById("signOutButton");

const form = document.getElementById("givingMethodForm");
const methodIdInput = document.getElementById("methodId");
const labelInput = document.getElementById("label");
const nameInput = document.getElementById("name");
const descriptionInput = document.getElementById("description");
const urlInput = document.getElementById("url");
const orderInput = document.getElementById("order");
const enabledInput = document.getElementById("enabled");
const openExternalInput = document.getElementById("openExternal");

const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const formStatus = document.getElementById("formStatus");

const pageStatus = document.getElementById("pageStatus");
const methodCount = document.getElementById("methodCount");
const methodsList = document.getElementById("methodsList");

// ======================================================
// STATE
// ======================================================

let currentAdmin = null;
let methodsCache = [];

// ======================================================
// HELPERS
// ======================================================

function clean(value) {
  return String(value || "").trim();
}

function setFormStatus(message = "", type = "") {
  formStatus.textContent = message;
  formStatus.className = "login-message";
  if (type) formStatus.classList.add(type);
}

function setPageStatus(message = "") {
  pageStatus.textContent = message;
}

function escapeHtml(value) {
  return String(value || "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function resetForm() {
  methodIdInput.value = "";
  labelInput.value = "";
  nameInput.value = "";
  descriptionInput.value = "";
  urlInput.value = "";
  orderInput.value = "0";
  enabledInput.checked = true;
  openExternalInput.checked = true;

  formTitle.textContent = "Add Giving Method";
  saveButton.textContent = "Save Method";
  cancelEditButton.hidden = true;
  setFormStatus("");
}

// ======================================================
// RENDER METHODS LIST
// ======================================================

function renderMethods() {
  if (!methodsCache.length) {
    methodsList.innerHTML = "<p>No giving methods yet. Add the first one above.</p>";
    methodCount.textContent = "";
    return;
  }

  methodCount.textContent = `${methodsCache.length} method${methodsCache.length === 1 ? "" : "s"}`;

  methodsList.innerHTML = methodsCache
    .map((method) => {
      const statusLabel = method.enabled ? "Enabled" : "Disabled";
      const statusClass = method.enabled ? "enabled" : "disabled";

      return `
        <article class="admin-list-item" data-id="${escapeHtml(method.id)}">
          <div class="admin-list-main">
            <h3>${escapeHtml(method.label || method.name || "Untitled")}</h3>
            <p>${escapeHtml(method.description || "No description")}</p>
            <p><strong>URL:</strong> ${escapeHtml(method.url || "—")}</p>
            <p>
              <span class="status-badge ${statusClass}">${statusLabel}</span>
              &nbsp;·&nbsp; Order: ${Number(method.order) || 0}
            </p>
          </div>

          <div class="admin-list-actions">
            <button type="button" data-action="edit" data-id="${escapeHtml(method.id)}">
              Edit
            </button>
            <button type="button" data-action="delete" data-id="${escapeHtml(method.id)}">
              Delete
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

// ======================================================
// LOAD METHODS
// ======================================================

async function loadMethods() {
  try {
    setPageStatus("");
    methodsCache = await getGivingMethods();
    renderMethods();
  } catch (error) {
    console.error("Unable to load giving methods:", error);
    setPageStatus("Unable to load giving methods.");
    methodsList.innerHTML = "<p>Unable to load methods.</p>";
  }
}

// ======================================================
// SAVE METHOD
// ======================================================

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const label = clean(labelInput.value);
  const name = clean(nameInput.value);

  if (!label || !name) {
    setFormStatus("Label and Internal Name are required.", "error");
    return;
  }

  const payload = {
    label,
    name,
    description: clean(descriptionInput.value),
    url: clean(urlInput.value),
    order: Number(orderInput.value) || 0,
    enabled: enabledInput.checked,
    openExternal: openExternalInput.checked,
  };

  const existingId = clean(methodIdInput.value) || null;

  saveButton.disabled = true;
  setFormStatus("Saving...");

  try {
    await saveGivingMethod(existingId, payload, currentAdmin.uid);
    setFormStatus("Method saved successfully.", "success");
    resetForm();
    await loadMethods();
  } catch (error) {
    console.error("Unable to save giving method:", error);
    setFormStatus("Unable to save method.", "error");
  } finally {
    saveButton.disabled = false;
  }
});

// ======================================================
// EDIT / DELETE ACTIONS
// ======================================================

methodsList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const methodId = button.dataset.id;
  const action = button.dataset.action;
  if (!methodId) return;

  const method = methodsCache.find((item) => item.id === methodId);
  if (!method) return;

  if (action === "edit") {
    methodIdInput.value = method.id;
    labelInput.value = method.label || "";
    nameInput.value = method.name || "";
    descriptionInput.value = method.description || "";
    urlInput.value = method.url || "";
    orderInput.value = Number(method.order) || 0;
    enabledInput.checked = Boolean(method.enabled);
    openExternalInput.checked = method.openExternal !== false;

    formTitle.textContent = "Edit Giving Method";
    saveButton.textContent = "Update Method";
    cancelEditButton.hidden = false;
    setFormStatus("");

    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (action === "delete") {
    const firstConfirm = window.confirm(
      `Delete “${method.label || method.name}”?`,
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "This permanently deletes the method. Continue?",
    );
    if (!secondConfirm) return;

    button.disabled = true;

    try {
      await deleteGivingMethod(methodId);
      await loadMethods();
      setPageStatus("Method deleted.");
    } catch (error) {
      console.error("Unable to delete method:", error);
      setPageStatus("Unable to delete method.");
      button.disabled = false;
    }
  }
});

// ======================================================
// CANCEL EDIT
// ======================================================

cancelEditButton.addEventListener("click", () => {
  resetForm();
});

// ======================================================
// SIGN OUT
// ======================================================

signOutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.replace("/admin/");
  } catch (error) {
    console.error("IATTV sign-out error:", error);
  }
});

// ======================================================
// INITIALIZE
// ======================================================

async function initializePage() {
  currentAdmin = await requireAdmin();

  if (!currentAdmin) {
    return;
  }

  adminNameEl.textContent =
    currentAdmin.displayName ||
    currentAdmin.email ||
    "Administrator";

  loadingEl.hidden = true;
  appEl.hidden = false;

  await loadMethods();
}

initializePage();