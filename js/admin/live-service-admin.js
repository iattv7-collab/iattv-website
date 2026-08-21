// ======================================================
// FILE: /js/admin/live-service-admin.js
// PROJECT: IATTV Website
// PURPOSE:
// Manages IATTV live-service settings in Firestore.
// ======================================================

import { auth } from "/js/services/firebase-config.js";

import { requireAdmin } from "/js/admin/admin-guard.js";

import {
  getLiveServiceSettings,
  saveLiveServiceSettings,
} from "/js/services/live-service-service.js";

import { signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// ======================================================
// ELEMENTS
// ======================================================

const loadingEl = document.getElementById("adminLoading");

const appEl = document.getElementById("adminApp");

const adminNameEl = document.getElementById("adminName");

const signOutButton = document.getElementById("signOutButton");

const form = document.getElementById("liveServiceForm");

const enabledInput = document.getElementById("enabled");

const serviceTitleInput = document.getElementById("serviceTitle");

const serviceDayInput = document.getElementById("serviceDay");

const serviceTimeInput = document.getElementById("serviceTime");

const timeZoneInput = document.getElementById("timeZone");

const liveUrlInput = document.getElementById("liveUrl");

const noteInput = document.getElementById("note");

const saveButton = document.getElementById("saveButton");

const formStatus = document.getElementById("formStatus");

const savedPreview = document.getElementById("savedPreview");

const savedPreviewContent = document.getElementById("savedPreviewContent");

// ======================================================
// STATE
// ======================================================

let currentAdmin = null;
let savedSettings = null;

// ======================================================
// HELPERS
// ======================================================

function clean(value) {
  return String(value || "").trim();
}

function setStatus(message = "", type = "") {
  formStatus.textContent = message;

  formStatus.className = "login-message";

  if (type) {
    formStatus.classList.add(type);
  }
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

function isValidUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getFormData() {
  return {
    enabled: enabledInput.checked,

    serviceTitle: clean(serviceTitleInput.value),

    serviceDay: clean(serviceDayInput.value),

    serviceTime: clean(serviceTimeInput.value),

    timeZone: clean(timeZoneInput.value),

    liveUrl: clean(liveUrlInput.value),

    note: clean(noteInput.value),
  };
}

function clearForm() {
  enabledInput.checked = false;
  serviceTitleInput.value = "";
  serviceDayInput.value = "";
  serviceTimeInput.value = "";
  timeZoneInput.value = "";
  liveUrlInput.value = "";
  noteInput.value = "";

  saveButton.disabled = true;
}

function validateForm() {
  const settings = getFormData();

  const isValid =
    settings.serviceTitle.length > 0 &&
    settings.serviceDay.length > 0 &&
    settings.serviceTime.length > 0 &&
    settings.timeZone.length > 0 &&
    isValidUrl(settings.liveUrl);

  saveButton.disabled = !isValid;

  return isValid;
}

function sameSettings(a, b) {
  if (!a || !b) {
    return false;
  }

  return (
    a.enabled === b.enabled &&
    a.serviceTitle === b.serviceTitle &&
    a.serviceDay === b.serviceDay &&
    a.serviceTime === b.serviceTime &&
    a.timeZone === b.timeZone &&
    a.liveUrl === b.liveUrl &&
    a.note === b.note
  );
}

function updateSaveState() {
  const valid = validateForm();

  if (!valid) {
    return;
  }

  const current = getFormData();

  saveButton.disabled = sameSettings(current, savedSettings);
}

function renderPreview(settings) {
  if (!settings) {
    savedPreview.hidden = true;
    return;
  }

  const status = settings.enabled === true ? "Enabled" : "Disabled";

  savedPreviewContent.innerHTML = `
    <p>
      <strong>Status:</strong>
      ${escapeHtml(status)}
    </p>

    <p>
      <strong>Service:</strong>
      ${escapeHtml(settings.serviceTitle)}
    </p>

    <p>
      <strong>Schedule:</strong>
      ${escapeHtml(settings.serviceDay)}
      •
      ${escapeHtml(settings.serviceTime)}
      ${escapeHtml(settings.timeZone)}
    </p>

    <p>
      <strong>Live Link:</strong>
      <a
        href="${escapeHtml(settings.liveUrl)}"
        target="_blank"
        rel="noopener"
      >
        Open Live Service
      </a>
    </p>

    ${
      settings.note
        ? `
          <p>
            <strong>Note:</strong>
            ${escapeHtml(settings.note)}
          </p>
        `
        : ""
    }
  `;

  savedPreview.hidden = false;
}

// ======================================================
// LOAD SETTINGS
// ======================================================

async function loadSettings() {
  try {
    const settings = await getLiveServiceSettings();

    if (!settings) {
      validateForm();
      return;
    }

    enabledInput.checked = settings.enabled === true;

    serviceTitleInput.value = settings.serviceTitle || "";

    serviceDayInput.value = settings.serviceDay || "";

    serviceTimeInput.value = settings.serviceTime || "";

    timeZoneInput.value = settings.timeZone || "";

    liveUrlInput.value = settings.liveUrl || "";

    noteInput.value = settings.note || "";

    savedSettings = getFormData();

    renderPreview(savedSettings);

    updateSaveState();
  } catch (error) {
    console.error("Unable to load live-service settings:", error);

    setStatus("Unable to load current settings.", "error");
  }
}

// ======================================================
// FORM CHANGES
// ======================================================

form.addEventListener("input", () => {
  setStatus();
  updateSaveState();
});

form.addEventListener("change", () => {
  setStatus();
  updateSaveState();
});

// ======================================================
// SAVE SETTINGS
// ======================================================

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  setStatus();

  if (!validateForm()) {
    setStatus(
      "Complete all required fields with a valid live-service URL.",
      "error",
    );

    return;
  }

  const settings = getFormData();

  saveButton.disabled = true;

  try {
    await saveLiveServiceSettings(settings, currentAdmin.uid);

    savedSettings = {
      ...settings,
    };

    renderPreview(savedSettings);

    clearForm();

    setStatus("Live-service settings saved successfully.", "success");
  } catch (error) {
    console.error("Unable to save live-service settings:", error);

    setStatus("Unable to save settings.", "error");

    updateSaveState();
  }
});

// ======================================================
// SIGN OUT
// ======================================================

signOutButton.addEventListener("click", async () => {
  await signOut(auth);

  window.location.replace("/admin/");
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
    currentAdmin.displayName || currentAdmin.email || "Administrator";

  loadingEl.hidden = true;
  appEl.hidden = false;

  await loadSettings();
}

initializePage();
