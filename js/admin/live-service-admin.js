// ======================================================
// FILE: /js/admin/live-service-admin.js
// PROJECT: IATTV Website
// PURPOSE:
// Edit the public live invitation card in Firestore.
// ======================================================

import { auth } from "/js/services/firebase-config.js";
import { requireAdmin } from "/js/admin/admin-guard.js";
import {
  getLiveServiceSettings,
  saveLiveServiceSettings,
} from "/js/services/live-service-service.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const loadingEl = document.getElementById("adminLoading");
const appEl = document.getElementById("adminApp");
const adminNameEl = document.getElementById("adminName");
const signOutButton = document.getElementById("signOutButton");
const form = document.getElementById("liveServiceForm");
const saveButton = document.getElementById("saveButton");
const formStatus = document.getElementById("formStatus");
const savedPreview = document.getElementById("savedPreview");
const savedPreviewContent = document.getElementById("savedPreviewContent");

const fields = {
  enabled: document.getElementById("enabled"),
  title: document.getElementById("title"),
  inviteLabelEn: document.getElementById("inviteLabelEn"),
  inviteLabelEs: document.getElementById("inviteLabelEs"),
  dayLineEn: document.getElementById("dayLineEn"),
  dayLineEs: document.getElementById("dayLineEs"),
  serviceTime: document.getElementById("serviceTime"),
  timeZone: document.getElementById("timeZone"),
  featuresEn: document.getElementById("featuresEn"),
  featuresEs: document.getElementById("featuresEs"),
  ctaEn: document.getElementById("ctaEn"),
  ctaEs: document.getElementById("ctaEs"),
  headerButtonEn: document.getElementById("headerButtonEn"),
  headerButtonEs: document.getElementById("headerButtonEs"),
  liveUrl: document.getElementById("liveUrl"),
  note: document.getElementById("note"),
};

let currentAdmin = null;
let savedSettings = null;

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
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
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
    enabled: fields.enabled.checked,
    title: clean(fields.title.value),
    inviteLabelEn: clean(fields.inviteLabelEn.value),
    inviteLabelEs: clean(fields.inviteLabelEs.value),
    dayLineEn: clean(fields.dayLineEn.value),
    dayLineEs: clean(fields.dayLineEs.value),
    serviceTime: clean(fields.serviceTime.value),
    timeZone: clean(fields.timeZone.value),
    featuresEn: clean(fields.featuresEn.value),
    featuresEs: clean(fields.featuresEs.value),
    ctaEn: clean(fields.ctaEn.value),
    ctaEs: clean(fields.ctaEs.value),
    headerButtonEn: clean(fields.headerButtonEn.value),
    headerButtonEs: clean(fields.headerButtonEs.value),
    liveUrl: clean(fields.liveUrl.value),
    note: clean(fields.note.value),
    serviceTitle: clean(fields.title.value),
    serviceDay: clean(fields.dayLineEn.value),
  };
}

function validateForm() {
  const settings = getFormData();
  const required = [
    "title",
    "inviteLabelEn",
    "inviteLabelEs",
    "dayLineEn",
    "dayLineEs",
    "serviceTime",
    "timeZone",
    "featuresEn",
    "featuresEs",
    "ctaEn",
    "ctaEs",
    "headerButtonEn",
    "headerButtonEs",
  ];

  const filled = required.every((key) => settings[key].length > 0);
  const isValid = filled && isValidUrl(settings.liveUrl);
  saveButton.disabled = !isValid;
  return isValid;
}

function sameSettings(a, b) {
  if (!a || !b) {
    return false;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

function updateSaveState() {
  if (!validateForm()) {
    return;
  }
  saveButton.disabled = sameSettings(getFormData(), savedSettings);
}

function fillForm(settings) {
  fields.enabled.checked = settings.enabled === true;
  fields.title.value = settings.title || settings.serviceTitle || "";
  fields.inviteLabelEn.value = settings.inviteLabelEn || "You’re Invited";
  fields.inviteLabelEs.value = settings.inviteLabelEs || "Estás invitado";
  fields.dayLineEn.value = settings.dayLineEn || settings.serviceDay || "";
  fields.dayLineEs.value = settings.dayLineEs || "";
  fields.serviceTime.value = settings.serviceTime || "";
  fields.timeZone.value = settings.timeZone || "";
  fields.featuresEn.value = settings.featuresEn || "";
  fields.featuresEs.value = settings.featuresEs || "";
  fields.ctaEn.value = settings.ctaEn || "";
  fields.ctaEs.value = settings.ctaEs || "";
  fields.headerButtonEn.value = settings.headerButtonEn || "Watch Live";
  fields.headerButtonEs.value = settings.headerButtonEs || "En vivo";
  fields.liveUrl.value = settings.liveUrl || "";
  fields.note.value = settings.note || "";
}

function renderPreview(settings) {
  if (!settings) {
    savedPreview.hidden = true;
    return;
  }

  savedPreviewContent.innerHTML = `
    <p><strong>Status:</strong> ${settings.enabled ? "Live link on" : "Live link off"}</p>
    <p><strong>Title:</strong> ${escapeHtml(settings.title)}</p>
    <p><strong>EN:</strong> ${escapeHtml(settings.inviteLabelEn)} · ${escapeHtml(settings.dayLineEn)} · ${escapeHtml(settings.ctaEn)}</p>
    <p><strong>ES:</strong> ${escapeHtml(settings.inviteLabelEs)} · ${escapeHtml(settings.dayLineEs)} · ${escapeHtml(settings.ctaEs)}</p>
    <p><strong>When:</strong> ${escapeHtml(settings.serviceTime)} ${escapeHtml(settings.timeZone)}</p>
    <p>
      <strong>Live link:</strong>
      <a href="${escapeHtml(settings.liveUrl)}" target="_blank" rel="noopener">Open</a>
    </p>
  `;
  savedPreview.hidden = false;
}

async function loadSettings() {
  try {
    const settings = await getLiveServiceSettings();
    if (!settings) {
      validateForm();
      return;
    }
    fillForm(settings);
    savedSettings = getFormData();
    renderPreview(savedSettings);
    updateSaveState();
  } catch (error) {
    console.error("Unable to load live invitation settings:", error);
    setStatus("Unable to load current settings.", "error");
  }
}

form.addEventListener("input", () => {
  setStatus();
  updateSaveState();
});

form.addEventListener("change", () => {
  setStatus();
  updateSaveState();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus();

  if (!validateForm()) {
    setStatus("Complete every field and use a valid live URL.", "error");
    return;
  }

  const settings = getFormData();
  saveButton.disabled = true;

  try {
    await saveLiveServiceSettings(settings, currentAdmin.uid);
    savedSettings = { ...settings };
    renderPreview(savedSettings);
    setStatus("Invitation saved. Refresh the public homepage to see it.", "success");
    updateSaveState();
  } catch (error) {
    console.error("Unable to save live invitation settings:", error);
    setStatus("Unable to save settings.", "error");
    updateSaveState();
  }
});

signOutButton.addEventListener("click", async () => {
  await signOut(auth);
  window.location.replace("/admin/");
});

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