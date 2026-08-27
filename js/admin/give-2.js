// ======================================================
// FILE: /js/admin/give-2.js
// PROJECT: IATTV Website
// PURPOSE:
// Protects Give 2 admin, manages funds/settings, and
// records manual gifts to the IATTV ledger.
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
  limit,
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
const fundPublicInput = document.getElementById("fundPublic");
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

const manualGiftForm = document.getElementById("manualGiftForm");
const manualFirstName = document.getElementById("manualFirstName");
const manualLastName = document.getElementById("manualLastName");
const manualEmail = document.getElementById("manualEmail");
const manualAmount = document.getElementById("manualAmount");
const manualDate = document.getElementById("manualDate");
const manualFund = document.getElementById("manualFund");
const manualMethod = document.getElementById("manualMethod");
const manualReference = document.getElementById("manualReference");
const manualNotes = document.getElementById("manualNotes");
const manualGiftStatus = document.getElementById("manualGiftStatus");
const saveManualGiftButton = document.getElementById("saveManualGiftButton");

const donationsLoading = document.getElementById("donationsLoading");
const donationsEmpty = document.getElementById("donationsEmpty");
const donationsList = document.getElementById("donationsList");

let currentAdmin = null;
const SETTINGS_DOC_ID = "main";

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

function setSettingsStatus(message, type = "") {
  if (!settingsFormStatus) return;
  settingsFormStatus.textContent = message || "";
  settingsFormStatus.className = "login-message" + (type ? ` ${type}` : "");
}

function setStatus(message, type = "") {
  fundFormStatus.textContent = message || "";
  fundFormStatus.className = "login-message" + (type ? ` ${type}` : "");
}

function setManualStatus(message, type = "") {
  if (!manualGiftStatus) return;
  manualGiftStatus.textContent = message || "";
  manualGiftStatus.className = "login-message" + (type ? ` ${type}` : "");
}

async function loadSettings() {
  if (!settingsForm) return;
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

function resetFundForm() {
  fundIdInput.value = "";
  fundNameInput.value = "";
  fundOrderInput.value = "0";
  fundDescriptionInput.value = "";
  if (fundPublicInput) fundPublicInput.checked = false;
  fundActiveInput.checked = true;
  fundFormTitle.textContent = "Add Fund";
  cancelFundEditButton.hidden = true;
  saveFundButton.textContent = "Save Fund";
  setStatus("");
}

function startEditFund(fund) {
  fundIdInput.value = fund.id;
  fundNameInput.value = fund.name || "";
  if (fundPublicInput) fundPublicInput.checked = fund.isPublic === true;
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

async function loadFunds() {
  fundsLoading.hidden = false;
  fundsEmpty.hidden = true;
  fundsList.innerHTML = "";

  try {
    const snapshot = await getDocs(
      query(collection(db, "givingFunds"), orderBy("order")),
    );
    const funds = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    fundsLoading.hidden = true;

    if (manualFund) {
      manualFund.innerHTML =
        `<option value="">Select a fund</option>` +
        funds
          .map(
            (fund) =>
              `<option value="${fund.id}">${escapeHtml(fund.name || "Untitled")}</option>`,
          )
          .join("");
    }

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
                ${fund.isPublic ? " • Public" : ""}
              </div>
            </div>
            <div>
              <div style="color:${statusColor};font-weight:700;font-size:13px">${statusLabel}</div>
              <div style="margin-top:6px;color:#6b7484;font-size:13px">
                ${escapeHtml(fund.description || "No description")}
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="admin-secondary-button" data-action="edit">Edit</button>
              <button type="button" class="admin-secondary-button" data-action="toggle">
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
      row.querySelector('[data-action="toggle"]').addEventListener("click", async () => {
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
    fundsEmpty.textContent = "Unable to load funds. Check Firestore rules and try again.";
  }
}

async function findOrCreateDonor({ firstName, lastName, email }) {
  const cleanEmail = (email || "").trim().toLowerCase();

  if (cleanEmail) {
    const existing = await getDocs(collection(db, "donors"));
    const match = existing.docs.find(
      (item) => String(item.data().email || "").toLowerCase() === cleanEmail,
    );
    if (match) {
      await updateDoc(doc(db, "donors", match.id), {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        email: cleanEmail,
        updatedAt: serverTimestamp(),
      });
      return { id: match.id, email: cleanEmail };
    }
  }

  const created = await addDoc(collection(db, "donors"), {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email: cleanEmail,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    source: "manual",
  });

  return { id: created.id, email: cleanEmail };
}

async function loadDonations() {
  if (!donationsList) return;
  donationsLoading.hidden = false;
  donationsEmpty.hidden = true;
  donationsList.innerHTML = "";

  try {
    const snapshot = await getDocs(
      query(collection(db, "donations"), orderBy("giftDate", "desc"), limit(25)),
    );
    const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    donationsLoading.hidden = true;

    if (!rows.length) {
      donationsEmpty.hidden = false;
      return;
    }

    donationsList.innerHTML = rows
      .map((row) => {
        return `
          <div class="admin-message-item">
            <div>
              <strong style="color:#123b8f">${escapeHtml(row.donorName || "Donor")}</strong>
              <div style="margin-top:6px;color:#6b7484;font-size:13px">
                ${escapeHtml(row.giftDate || "")} • ${escapeHtml(row.fundNameSnapshot || "")}
              </div>
            </div>
            <div>
              <div style="font-weight:700">$${Number(row.amount || 0).toFixed(2)}</div>
              <div style="margin-top:6px;color:#6b7484;font-size:13px">
                ${escapeHtml(row.paymentMethod || "manual")} • ${escapeHtml(row.status || "")}
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Unable to load donations:", error);
    donationsLoading.hidden = true;
    donationsEmpty.hidden = false;
    donationsEmpty.textContent =
      "Unable to load donations. If Firestore shows an index link in the console, open it.";
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
    isPublic: fundPublicInput ? fundPublicInput.checked === true : false,
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

if (settingsForm) {
  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveSettingsButton.disabled = true;
    setSettingsStatus("Saving...");
    try {
      await setDoc(
        doc(db, "givingSettings", SETTINGS_DOC_ID),
        {
          currency: settingsCurrency.value.trim().toUpperCase() || "USD",
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
}

if (manualGiftForm) {
  manualGiftForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const firstName = manualFirstName.value.trim();
    const lastName = manualLastName.value.trim();
    const email = manualEmail.value.trim();
    const amount = Number(manualAmount.value);
    const giftDate = manualDate.value;
    const fundId = manualFund.value;
    const fundName = manualFund.selectedOptions[0]?.textContent || "";

    if (!amount || amount <= 0 || !fundId || !giftDate) {
      setManualStatus("Amount, date, and fund are required.", "error");
      return;
    }

    saveManualGiftButton.disabled = true;
    setManualStatus("Saving gift...");

    try {
      const donor = await findOrCreateDonor({ firstName, lastName, email });
      await addDoc(collection(db, "donations"), {
        donorId: donor.id,
        donorName: `${firstName} ${lastName}`.trim(),
        donorEmail: donor.email || "",
        amount,
        currency: "USD",
        giftDate,
        fundId,
        fundNameSnapshot: fundName,
        frequency: "one-time",
        paymentMethod: manualMethod.value,
        processor: "manual",
        processorTransactionId: manualReference.value.trim() || "",
        status: "completed",
        source: "admin-manual",
        notes: manualNotes.value.trim(),
        createdBy: currentAdmin?.uid || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      manualGiftForm.reset();
      if (manualDate) {
        manualDate.value = new Date().toISOString().slice(0, 10);
      }
      setManualStatus("Gift saved to ledger.", "success");
      await loadDonations();
    } catch (error) {
      console.error("Unable to save manual gift:", error);
      setManualStatus("Unable to save gift. Check console and rules.", "error");
    } finally {
      saveManualGiftButton.disabled = false;
    }
  });
}

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
  adminNameEl.textContent = admin.displayName || admin.email || "Administrator";
  loadingEl.hidden = true;
  appEl.hidden = false;

  if (manualDate && !manualDate.value) {
    manualDate.value = new Date().toISOString().slice(0, 10);
  }

  await loadSettings();
  await loadFunds();
  await loadDonations();
}

initializeGive2Admin();