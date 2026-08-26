// ======================================================
// FILE: /js/admin/give-2.js
// PROJECT: IATTV Website
// PURPOSE:
// Protects Give 2 admin and manages givingFunds CRUD
// for the Phase 1 foundation (admin only).
// ======================================================

import { auth, db } from "/js/services/firebase-config.js";
import { requireAdmin } from "/js/admin/admin-guard.js";

import { signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const loadingEl = document.getElementById("adminLoading");
const appEl = document.getElementById("adminApp");
const adminNameEl = document.getElementById("adminName");
const signOutButton = document.getElementById("signOutButton");

const fundForm = document.getElementById("fundForm");
const fundIdInput = document.getElementById("fundId");
const fundNameInput = document.getElementById("fundName");
const fundOrderInput = document.getElementById("fundOrder");
const fundDescriptionInput = document.getElementById("fundDescription");
const fundActiveInput = document.getElementById("fundActive");
const fundFormTitle = document.getElementById("fundFormTitle");
const fundFormStatus = document.getElementById("fundFormStatus");
const saveFundButton = document.getElementById("saveFundButton");
const cancelFundEditButton = document.getElementById("cancelFundEditButton");

const fundsLoading = document.getElementById("fundsLoading");
const fundsEmpty = document.getElementById("fundsEmpty");
const fundsList = document.getElementById("fundsList");

const settingsForm = document.getElementById("settingsForm");
const settingsCurrency = document.getElementById("settingsCurrency");
const settingsEnabled = document.getElementById("settingsEnabled");
const settingsStatementNote = document.getElementById("settingsStatementNote");
const settingsFormStatus = document.getElementById("settingsFormStatus");
const saveSettingsButton = document.getElementById("saveSettingsButton");

let currentAdmin = null;

const SETTINGS_DOC_ID = "main";

function setSettingsStatus(message, type = "") {
  settingsFormStatus.textContent = message || "";
  settingsFormStatus.className =
    "login-message" + (type ? ` ${type}` : "");
}

async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, "givingSettings", SETTINGS_DOC_ID));

    if (!snap.exists()) {
      settingsCurrency.value = "USD";
      settingsEnabled.checked = true;
      settingsStatementNote.value =
        "This statement reflects gifts recorded by IATTV. Official tax treatment is determined by applicable law and your advisor.";
      return;
    }

    const data = snap.data();
    settingsCurrency.value = data.currency || "USD";
    settingsEnabled.checked = data.enabled !== false;
    settingsStatementNote.value =
      data.statementNote ||
      "This statement reflects gifts recorded by IATTV. Official tax treatment is determined by applicable law and your advisor.";
  } catch (error) {
    console.error("Unable to load giving settings:", error);
    setSettingsStatus("Unable to load settings.", "error");
  }
}

function setStatus(message, type = "") {
  fundFormStatus.textContent = message || "";
  fundFormStatus.className = "login-message" + (type ? ` ${type}` : "");
}

function resetFundForm() {
  fundIdInput.value = "";
  fundNameInput.value = "";
  fundOrderInput.value = "0";
  fundDescriptionInput.value = "";
  fundActiveInput.checked = true;
  fundFormTitle.textContent = "Add Fund";
  cancelFundEditButton.hidden = true;
  saveFundButton.textContent = "Save Fund";
  setStatus("");
}

function startEditFund(fund) {
  fundIdInput.value = fund.id;
  fundNameInput.value = fund.name || "";
  fundOrderInput.value =
    typeof fund.order === "number" ? String(fund.order) : "0";
  fundDescriptionInput.value = fund.description || "";
  fundActiveInput.checked = fund.active !== false;
  fundFormTitle.textContent = "Edit Fund";
  cancelFundEditButton.hidden = false;
  saveFundButton.textContent = "Update Fund";
  setStatus("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => {
    return (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[character] || character
    );
  });
}

async function loadFunds() {
  fundsLoading.hidden = false;
  fundsEmpty.hidden = true;
  fundsList.innerHTML = "";

  try {
    const fundsQuery = query(collection(db, "givingFunds"), orderBy("order"));
    const snapshot = await getDocs(fundsQuery);

    const funds = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    fundsLoading.hidden = true;

    if (!funds.length) {
      fundsEmpty.hidden = false;
      return;
    }

    fundsList.innerHTML = funds
      .map((fund) => {
        const statusLabel = fund.active === false ? "Inactive" : "Active";
        const statusColor = fund.active === false ? "#b42318" : "#0b2b70";

        return `
          <div class="admin-message-item" data-fund-id="${escapeHtml(fund.id)}">
            <div>
              <strong style="color:#123b8f">${escapeHtml(fund.name || "Untitled")}</strong>
              <div style="margin-top:6px;color:#6b7484;font-size:13px">
                Order: ${escapeHtml(String(fund.order ?? 0))}
              </div>
            </div>

            <div>
              <div style="color:${statusColor};font-weight:700;font-size:13px">
                ${statusLabel}
              </div>
              <div style="margin-top:6px;color:#6b7484;font-size:13px">
                ${escapeHtml(fund.description || "No description")}
              </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button
                type="button"
                class="admin-secondary-button"
                data-action="edit"
              >
                Edit
              </button>
              <button
                type="button"
                class="admin-secondary-button"
                data-action="toggle"
              >
                ${fund.active === false ? "Activate" : "Deactivate"}
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    fundsList.querySelectorAll(".admin-message-item").forEach((row) => {
      const fund = funds.find((item) => item.id === row.dataset.fundId);
      if (!fund) return;

      row.querySelector('[data-action="edit"]').addEventListener("click", () => {
        startEditFund(fund);
      });

      row
        .querySelector('[data-action="toggle"]')
        .addEventListener("click", async () => {
          try {
            await updateDoc(doc(db, "givingFunds", fund.id), {
              active: fund.active === false,
              updatedAt: serverTimestamp(),
              updatedBy: currentAdmin?.uid || "",
            });
            await loadFunds();
          } catch (error) {
            console.error("Unable to toggle fund:", error);
            alert("Unable to update fund status.");
          }
        });
    });
  } catch (error) {
    console.error("Unable to load giving funds:", error);
    fundsLoading.hidden = true;
    fundsEmpty.hidden = false;
    fundsEmpty.textContent =
      "Unable to load funds. Check Firestore rules and try again.";
  }
}

fundForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = fundNameInput.value.trim();
  if (!name) {
    setStatus("Fund name is required.", "error");
    return;
  }

  const payload = {
    name,
    description: fundDescriptionInput.value.trim(),
    order: Number(fundOrderInput.value || 0),
    active: fundActiveInput.checked,
    // Public visibility reserved for later public Give 2 page
    isPublic: false,
    updatedAt: serverTimestamp(),
    updatedBy: currentAdmin?.uid || "",
  };

  saveFundButton.disabled = true;
  setStatus("Saving...");

  try {
    const existingId = fundIdInput.value.trim();

    if (existingId) {
      await updateDoc(doc(db, "givingFunds", existingId), payload);
      setStatus("Fund updated.", "success");
    } else {
      await addDoc(collection(db, "givingFunds"), {
        ...payload,
        createdAt: serverTimestamp(),
        createdBy: currentAdmin?.uid || "",
      });
      setStatus("Fund created.", "success");
    }

    resetFundForm();
    await loadFunds();
  } catch (error) {
    console.error("Unable to save fund:", error);
    setStatus("Unable to save fund. Check console and rules.", "error");
  } finally {
    saveFundButton.disabled = false;
  }
});

cancelFundEditButton.addEventListener("click", () => {
  resetFundForm();
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const currency = settingsCurrency.value.trim().toUpperCase() || "USD";

  saveSettingsButton.disabled = true;
  setSettingsStatus("Saving...");

  try {
    await setDoc(
      doc(db, "givingSettings", SETTINGS_DOC_ID),
      {
        currency,
        enabled: settingsEnabled.checked,
        statementNote: settingsStatementNote.value.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: currentAdmin?.uid || "",
      },
      { merge: true },
    );

    setSettingsStatus("Settings saved.", "success");
  } catch (error) {
    console.error("Unable to save giving settings:", error);
    setSettingsStatus("Unable to save settings.", "error");
  } finally {
    saveSettingsButton.disabled = false;
  }
});

signOutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.replace("/admin/");
  } catch (error) {
    console.error("IATTV Give 2 sign-out error:", error);
  }
});

async function initializeGive2Admin() {
  const admin = await requireAdmin();
  if (!admin) return;

  currentAdmin = admin;
  adminNameEl.textContent =
    admin.displayName || admin.email || "Administrator";

    loadingEl.hidden = true;
  appEl.hidden = false;

  await loadSettings();
  await loadFunds();
}

initializeGive2Admin();