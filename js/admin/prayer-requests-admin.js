// ======================================================
// FILE: /js/admin/prayer-requests-admin.js
// PROJECT: IATTV Website
// PURPOSE:
// Manages prayer-request delivery settings and existing
// prayer requests for IATTV administrators.
// ======================================================

import {
  auth,
} from "/js/services/firebase-config.js";

import {
  requireAdmin,
} from "/js/admin/admin-guard.js";

import {
  deletePrayerRequest,
  getPrayerRequests,
  updatePrayerRequestStatus,
} from "/js/services/prayer-request-service.js";

import {
  getPrayerSettings,
  savePrayerSettings,
} from "/js/services/prayer-settings-service.js";

import {
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// ======================================================
// ELEMENTS
// ======================================================

const loadingEl =
  document.getElementById("adminLoading");

const appEl =
  document.getElementById("adminApp");

const adminNameEl =
  document.getElementById("adminName");

const signOutButton =
  document.getElementById("signOutButton");

const settingsForm =
  document.getElementById("prayerSettingsForm");

const recipientEmailInput =
  document.getElementById("recipientEmail");

const saveEmailButton =
  document.getElementById("saveEmailButton");

const settingsStatus =
  document.getElementById("settingsStatus");

const savedEmailPreview =
  document.getElementById("savedEmailPreview");

const savedEmailAddress =
  document.getElementById("savedEmailAddress");

const listEl =
  document.getElementById("prayerRequestsList");

const countEl =
  document.getElementById("requestCount");

const pageStatus =
  document.getElementById("pageStatus");


// ======================================================
// STATE
// ======================================================

let currentAdmin = null;

let requests = [];

let savedRecipientEmail = "";


// ======================================================
// HELPERS
// ======================================================

function clean(value) {
  return String(value || "").trim();
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


function formatDate(value) {
  if (!value) {
    return "";
  }

  if (typeof value.toDate === "function") {
    return value
      .toDate()
      .toLocaleString();
  }

  return "";
}


function setPageStatus(message = "") {
  pageStatus.textContent = message;
}


function setSettingsStatus(
  message = "",
  type = "",
) {
  settingsStatus.textContent = message;

  settingsStatus.className =
    "login-message";

  if (type) {
    settingsStatus.classList.add(type);
  }
}


function isValidEmail(value) {
  const email =
    clean(value);

  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}


function updateEmailSaveState() {
  const currentEmail =
    clean(recipientEmailInput.value);

  const valid =
    isValidEmail(currentEmail);

  const changed =
    currentEmail !== savedRecipientEmail;

  saveEmailButton.disabled =
    !valid || !changed;
}


function renderSavedEmail() {
  if (!savedRecipientEmail) {
    savedEmailPreview.hidden = true;
    savedEmailAddress.textContent = "";
    return;
  }

  savedEmailAddress.textContent =
    savedRecipientEmail;

  savedEmailPreview.hidden = false;
}


// ======================================================
// LOAD PRAYER SETTINGS
// ======================================================

async function loadPrayerSettings() {
  try {
    const settings =
      await getPrayerSettings();

    savedRecipientEmail =
      clean(
        settings?.recipientEmail,
      );

    recipientEmailInput.value =
      savedRecipientEmail;

    renderSavedEmail();

    updateEmailSaveState();
  } catch (error) {
    console.error(
      "Unable to load prayer settings:",
      error,
    );

    setSettingsStatus(
      "Unable to load prayer email settings.",
      "error",
    );
  }
}


// ======================================================
// SAVE PRAYER SETTINGS
// ======================================================

recipientEmailInput.addEventListener(
  "input",
  () => {
    setSettingsStatus();
    updateEmailSaveState();
  },
);


settingsForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    setSettingsStatus();

    const recipientEmail =
      clean(
        recipientEmailInput.value,
      );

    if (!isValidEmail(recipientEmail)) {
      setSettingsStatus(
        "Enter a valid destination email address.",
        "error",
      );

      updateEmailSaveState();
      return;
    }

    saveEmailButton.disabled = true;

    try {
      await savePrayerSettings(
        {
          recipientEmail,
        },
        currentAdmin.uid,
      );

      savedRecipientEmail =
        recipientEmail;

      renderSavedEmail();

      recipientEmailInput.value = "";

      saveEmailButton.disabled = true;

      setSettingsStatus(
        "Prayer request email saved successfully.",
        "success",
      );
    } catch (error) {
      console.error(
        "Unable to save prayer settings:",
        error,
      );

      setSettingsStatus(
        "Unable to save prayer email.",
        "error",
      );

      updateEmailSaveState();
    }
  },
);


// ======================================================
// RENDER EXISTING REQUESTS
// ======================================================

function renderRequests() {
  countEl.textContent =
    `${requests.length} request${
      requests.length === 1
        ? ""
        : "s"
    }`;

  if (!requests.length) {
    listEl.innerHTML = `
      <p>
        No prayer requests have been received.
      </p>
    `;

    return;
  }

  listEl.innerHTML =
    requests
      .map((item) => {
        const status =
          item.status || "new";

        const confidential =
          item.confidential === true
            ? `<strong>Confidential Request</strong>`
            : "";

        return `
          <article
            class="admin-prayer-request"
            data-request-id="${escapeHtml(item.id)}"
          >

            <div class="admin-prayer-request-header">

              <div>

                <h3>
                  ${escapeHtml(
                    item.name ||
                    "Anonymous",
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    formatDate(
                      item.createdAt,
                    ),
                  )}
                </p>

              </div>

              <div>
                ${confidential}
              </div>

            </div>


            <p class="admin-prayer-request-text">
              ${escapeHtml(item.request)}
            </p>


            ${
              item.email
                ? `
                  <p>
                    <strong>Email:</strong>
                    ${escapeHtml(item.email)}
                  </p>
                `
                : ""
            }


            ${
              item.phone
                ? `
                  <p>
                    <strong>Phone:</strong>
                    ${escapeHtml(item.phone)}
                  </p>
                `
                : ""
            }


            <p>
              <strong>Status:</strong>
              ${escapeHtml(status)}
            </p>


            <div class="admin-form-actions">

              ${
                status !== "prayed"
                  ? `
                    <button
                      type="button"
                      class="admin-login-button"
                      data-action="prayed"
                      data-id="${escapeHtml(item.id)}"
                    >
                      Mark as Prayed
                    </button>
                  `
                  : ""
              }


              ${
                status !== "archived"
                  ? `
                    <button
                      type="button"
                      class="admin-signout-button"
                      data-action="archived"
                      data-id="${escapeHtml(item.id)}"
                    >
                      Archive
                    </button>
                  `
                  : ""
              }


              <button
                type="button"
                class="admin-signout-button"
                data-action="delete"
                data-id="${escapeHtml(item.id)}"
              >
                Delete
              </button>

            </div>

          </article>
        `;
      })
      .join("");
}


// ======================================================
// LOAD EXISTING REQUESTS
// ======================================================

async function loadRequests() {
  try {
    setPageStatus("");

    requests =
      await getPrayerRequests();

    renderRequests();
  } catch (error) {
    console.error(
      "Unable to load prayer requests:",
      error,
    );

    setPageStatus(
      "Unable to load prayer requests.",
    );
  }
}


// ======================================================
// EXISTING REQUEST ACTIONS
// ======================================================

listEl.addEventListener(
  "click",
  async (event) => {
    const button =
      event.target.closest(
        "[data-action]",
      );

    if (!button) {
      return;
    }

    const requestId =
      button.dataset.id;

    const action =
      button.dataset.action;

    if (!requestId) {
      return;
    }


    if (action === "delete") {
      const firstConfirm =
        window.confirm(
          "Delete this prayer request?",
        );

      if (!firstConfirm) {
        return;
      }

      const secondConfirm =
        window.confirm(
          "This permanently deletes the prayer request. Continue?",
        );

      if (!secondConfirm) {
        return;
      }
    }


    button.disabled = true;

    try {
      if (action === "delete") {
        await deletePrayerRequest(
          requestId,
        );
      } else {
        await updatePrayerRequestStatus(
          requestId,
          action,
          currentAdmin.uid,
        );
      }

      await loadRequests();
    } catch (error) {
      console.error(
        "Unable to update prayer request:",
        error,
      );

      setPageStatus(
        "Unable to update the prayer request.",
      );

      button.disabled = false;
    }
  },
);


// ======================================================
// SIGN OUT
// ======================================================

signOutButton.addEventListener(
  "click",
  async () => {
    await signOut(auth);

    window.location.replace(
      "/admin/",
    );
  },
);


// ======================================================
// INITIALIZE
// ======================================================

async function initializePage() {
  currentAdmin =
    await requireAdmin();

  if (!currentAdmin) {
    return;
  }

  adminNameEl.textContent =
    currentAdmin.displayName ||
    currentAdmin.email ||
    "Administrator";

  loadingEl.hidden = true;
  appEl.hidden = false;

  await Promise.all([
    loadPrayerSettings(),
    loadRequests(),
  ]);
}


initializePage();