// ======================================================
// FILE: /js/modules/give-2/public-give.js
// PROJECT: IATTV Website
// PURPOSE:
// Public Give 2 form shell. Loads public funds and
// collects gift details. Does not charge a card.
// ======================================================

import { db } from "/js/services/firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const form = document.getElementById("give2Form");
const fundSelect = document.getElementById("fundSelect");
const customAmount = document.getElementById("customAmount");
const statusEl = document.getElementById("give2Status");

let frequency = "one-time";
let selectedAmount = null;

document.querySelectorAll(".give2-freq").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".give2-freq").forEach((item) => {
      item.classList.remove("active");
    });
    button.classList.add("active");
        frequency = button.dataset.frequency;
    updateSummary();
  });
});

function updateSummary() {
  const amountText =
    selectedAmount && selectedAmount > 0 ? `$${selectedAmount}` : "No amount entered";
  const frequencyText = frequency === "monthly" ? "Monthly" : "One-Time";
  statusEl.textContent = `Selected gift: ${amountText} • ${frequencyText}`;
}

customAmount.addEventListener("input", () => {
  selectedAmount = customAmount.value ? Number(customAmount.value) : null;
  updateSummary();
});

async function loadPublicFunds() {
  fundSelect.innerHTML = `<option value="">Loading funds...</option>`;

  try {
    const fundsQuery = query(
      collection(db, "givingFunds"),
      where("isPublic", "==", true),
      where("active", "==", true),
    );

    const snapshot = await getDocs(fundsQuery);
    const funds = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (!funds.length) {
      fundSelect.innerHTML = `<option value="">No funds available yet</option>`;
      return;
    }

    fundSelect.innerHTML =
      `<option value="">Select a fund</option>` +
      funds
        .map(
          (fund) =>
            `<option value="${fund.id}" data-name="${fund.name || ""}">${fund.name}</option>`,
        )
        .join("");
  } catch (error) {
    console.error("Unable to load Give 2 funds:", error);
    fundSelect.innerHTML = `<option value="">Unable to load funds</option>`;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(selectedAmount);
  const fundId = fundSelect.value;
  const fundName = fundSelect.selectedOptions[0]?.dataset.name || "";

  if (!amount || amount < 1) {
    statusEl.textContent = "Please select or enter an amount.";
    return;
  }

  if (!fundId) {
    statusEl.textContent = "Please select a fund.";
    return;
  }

  const draft = {
    amount,
    currency: "USD",
    frequency,
    fundId,
    fundName,
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
  };

  console.log("Give 2 draft (not charged):", draft);

  statusEl.textContent =
    `Ready: ${frequency === "monthly" ? "Monthly" : "One-time"} $${amount} to ${fundName}. Stripe checkout will be connected next.`;
});

loadPublicFunds();