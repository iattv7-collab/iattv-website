// ======================================================
// FILE: /js/modules/give-2/public-give.js
// PROJECT: IATTV Website
// PURPOSE:
// Public Give 2 form shell. Loads public funds and
// collects gift details. Does not charge a card.
// ======================================================

import { db, functions } from "/js/services/firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";
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

function isSpanish() {
  return localStorage.getItem("iattv_language") === "es";
}

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
    selectedAmount && selectedAmount > 0 ? "$" + selectedAmount : isSpanish() ? "Sin cantidad" : "No amount entered";
  const frequencyText = frequency === "monthly"
    ? isSpanish() ? "Mensual" : "Monthly"
    : isSpanish() ? "Una vez" : "One-Time";
  statusEl.textContent = isSpanish()
    ? "Ofrenda: " + amountText + " • " + frequencyText
    : "Selected gift: " + amountText + " • " + frequencyText;
}

customAmount.addEventListener("input", () => {
  selectedAmount = customAmount.value ? Number(customAmount.value) : null;
  updateSummary();
});

async function loadPublicFunds() {
  fundSelect.innerHTML = "<option value=\"\">" +
    (isSpanish() ? "Cargando fondos..." : "Loading funds...") +
    "</option>";

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
      fundSelect.innerHTML = "<option value=\"\">" +
        (isSpanish() ? "No hay fondos todavía" : "No funds available yet") +
        "</option>";
      return;
    }

    fundSelect.innerHTML =
      "<option value=\"\">" +
      (isSpanish() ? "Seleccione un fondo" : "Select a fund") +
      "</option>" +
      funds
        .map((fund) => {
          return "<option value=\"" + fund.id + "\" data-name=\"" +
            (fund.name || "") + "\">" + (fund.name || "") + "</option>";
        })
        .join("");
  } catch (error) {
    console.error("Unable to load Give 2 funds:", error);
    fundSelect.innerHTML = "<option value=\"\">" +
      (isSpanish() ? "No se pudieron cargar los fondos" : "Unable to load funds") +
      "</option>";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const amount = Number(selectedAmount);
  const fundId = fundSelect.value;
  const fundName = fundSelect.selectedOptions[0]
    ? fundSelect.selectedOptions[0].dataset.name || ""
    : "";

  if (!amount || amount < 1) {
    statusEl.textContent = isSpanish()
      ? "Escriba una cantidad."
      : "Please select or enter an amount.";
    return;
  }

  if (!fundId) {
    statusEl.textContent = isSpanish()
      ? "Seleccione un fondo."
      : "Please select a fund.";
    return;
  }

  const draft = {
    amount: amount,
    currency: "USD",
    frequency: frequency,
    fundId: fundId,
    fundName: fundName,
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
  };

  statusEl.textContent = isSpanish()
    ? "Abriendo pago seguro..."
    : "Opening secure checkout...";

  try {
    const createGive2Checkout = httpsCallable(functions, "createGive2Checkout");
    const result = await createGive2Checkout(draft);
    const url = result.data && result.data.url;
    if (!url) {
      throw new Error("No checkout URL");
    }
    window.location.href = url;
  } catch (error) {
    console.error("Give 2 checkout error:", error);
    statusEl.textContent = isSpanish()
      ? "No se pudo abrir el pago. Intente de nuevo."
      : "Unable to open checkout. Please try again.";
  }
});

function applyGive2Language() {
  const es = isSpanish();

  const set = (id, en, spanish) => {
    const el = document.getElementById(id);
    if (el) el.textContent = es ? spanish : en;
  };

  set("give2Eyebrow", "GIVE TO IATTV", "OFRENDA IATTV");
  set("give2Title", "Partner With the Ministry", "Colabore con el ministerio");
  set(
    "give2Intro",
    "Choose an amount, frequency, and fund. Payment processing will be added next. No card information is collected on this page.",
    "Elija cantidad, frecuencia y fondo. El cobro con tarjeta se añadirá después. Esta página no pide datos de tarjeta.",
  );
  set("give2FrequencyTitle", "Frequency", "Frecuencia");
  set("give2OneTime", "One-Time", "Una vez");
  set("give2Monthly", "Monthly", "Mensual");
  set("give2AmountTitle", "Gift Amount", "Cantidad");
  set(
    "give2AmountLabel",
    "Enter the amount you would like to give",
    "Escriba la cantidad que desea ofrendar",
  );
  set("give2FundTitle", "Fund", "Fondo");
  set("give2InfoTitle", "Your Information", "Sus datos");
  set("give2FirstName", "First name", "Nombre");
  set("give2LastName", "Last name", "Apellido");
  set("give2Email", "Email", "Correo");
  set("give2Phone", "Phone (optional)", "Teléfono (opcional)");
  set("give2Submit", "Continue to Give", "Continuar para ofrendar");
  set(
    "give2CardNote",
    "Card payments will be added last. IATTV does not collect card numbers on this page. Cash and check gifts can be recorded by the administrator.",
    "Los pagos con tarjeta se añadirán al final. IATTV no pide números de tarjeta en esta página. El administrador puede registrar ofrendas en efectivo o cheque.",
  );
  set(
    "give2StatementNote",
    "Need a record of gifts already received?",
    "¿Necesita un comprobante de ofrendas recibidas?",
  );
  set("give2StatementLink", "Request a statement", "Solicitar estado de cuenta");

  updateSummary();
  loadPublicFunds();
}

document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => {
    setTimeout(applyGive2Language, 0);
  });
});

applyGive2Language();