// ======================================================
// FILE: /js/modules/give-2/public-statement.js
// PROJECT: IATTV Website
// PURPOSE:
// Requests a Give 2 statement by email and date range.
// ======================================================

import { functions } from "/js/services/firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

const form = document.getElementById("statementForm");
const emailInput = document.getElementById("statementEmail");
const fromDateInput = document.getElementById("fromDate");
const toDateInput = document.getElementById("toDate");
const customDates = document.getElementById("customDates");
const statusEl = document.getElementById("statementStatus");
const resultEl = document.getElementById("statementResult");
const emailStatementButton = document.getElementById("emailStatementButton");
let lastStatementRequest = null;

let rangeType = "year";
if (customDates) {
  customDates.hidden = true;
}

function toIso(date) {
  return date.toISOString().slice(0, 10);
}

function getRange() {
  const today = new Date();
  const to = toIso(today);

  if (rangeType === "week") {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);
    return { fromDate: toIso(from), toDate: to };
  }

  if (rangeType === "month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { fromDate: toIso(from), toDate: to };
  }

  if (rangeType === "year") {
    const from = new Date(today.getFullYear(), 0, 1);
    return { fromDate: toIso(from), toDate: to };
  }

  return {
    fromDate: fromDateInput.value,
    toDate: toDateInput.value,
  };
}

document.querySelectorAll("[data-range]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-range]").forEach((item) => {
      item.classList.remove("active");
    });
    button.classList.add("active");
    rangeType = button.dataset.range;
    customDates.hidden = rangeType !== "custom";
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  resultEl.hidden = true;

  const email = emailInput.value.trim();
  const { fromDate, toDate } = getRange();

  if (!email || !fromDate || !toDate) {
    statusEl.textContent = "Email and date range are required.";
    return;
  }

  statusEl.textContent = "Looking up gifts...";

  try {
    const getGive2Statement = httpsCallable(functions, "getGive2Statement");
    const result = await getGive2Statement({ email, fromDate, toDate });
    const data = result.data || {};

    document.getElementById("statementTitle").textContent =
      data.donorName ? `${data.donorName} — Giving Statement` : "Giving Statement";
    document.getElementById("statementMeta").textContent =
      `${data.fromDate} to ${data.toDate} • ${email}`;

    const rows = data.gifts || [];
    document.getElementById("statementRows").innerHTML = rows.length
      ? rows
        .map(
          (row) =>
            `<p>${row.giftDate} — ${row.fundName} — $${Number(row.amount).toFixed(2)}</p>`,
        )
        .join("")
      : "<p>No completed gifts were found for this email and date range.</p>";

    document.getElementById("statementTotal").textContent =
      `Total: $${Number(data.total || 0).toFixed(2)}`;
    document.getElementById("statementNote").textContent = data.statementNote || "";

    resultEl.hidden = false;
    statusEl.textContent = "";
    lastStatementRequest = { email, fromDate, toDate };
    if (emailStatementButton) {
      emailStatementButton.hidden = false;
      emailStatementButton.disabled = false;
    }
  } catch (error) {
    console.error("Unable to load statement:", error);
    statusEl.textContent = "Unable to load the statement. Please try again.";
  }
});

emailStatementButton?.addEventListener("click", async () => {
  if (!lastStatementRequest) return;

  emailStatementButton.disabled = true;
  statusEl.textContent = "Sending statement email...";

  try {
    const sendGive2Statement = httpsCallable(functions, "sendGive2Statement");
    await sendGive2Statement(lastStatementRequest);
    statusEl.textContent = "Statement sent. Check that inbox.";
  } catch (error) {
    console.error("Unable to email statement:", error);
    statusEl.textContent = "Unable to send the email. Please try again.";
    emailStatementButton.disabled = false;
  }
});