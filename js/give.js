// ======================================================
// FILE: /js/give.js
// PROJECT: IATTV Website
// PURPOSE:
// Loads enabled giving methods from Firestore and
// opens the selected payment method.
// ======================================================

import {
  getEnabledGivingMethods,
} from "/js/services/giving-methods-service.js";

document.addEventListener("DOMContentLoaded", () => {
  const paymentMethodsContainer = document.getElementById("paymentMethods");

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

  function getMethodIcon(name) {
    const key = String(name || "").toLowerCase();

    if (key.includes("paypal")) return "P";
    if (key.includes("zelle")) return "Z";
    if (key.includes("cash")) return "$";
    if (key.includes("wise")) return "W";
    return "◆";
  }

  function renderPaymentMethods(methods) {
    if (!methods.length) {
      paymentMethodsContainer.innerHTML =
        "<p>No giving methods are currently available.</p>";
      return;
    }

    paymentMethodsContainer.innerHTML = methods
      .map((method) => {
        const icon = getMethodIcon(method.name || method.label);
        const label = escapeHtml(method.label || method.name || "Give");
        const description = escapeHtml(
          method.description || "Click to continue.",
        );

        return `
          <button
            type="button"
            class="payment-method"
            data-url="${escapeHtml(method.url || "")}"
            data-open-external="${method.openExternal !== false}"
          >
            <span class="payment-icon">${icon}</span>
            <span class="payment-name">${label}</span>
            <span class="payment-provider">${description}</span>
          </button>
        `;
      })
      .join("");
  }

  paymentMethodsContainer.addEventListener("click", (event) => {
    const button = event.target.closest(".payment-method");
    if (!button) return;

    const url = button.dataset.url;
    const openExternal = button.dataset.openExternal !== "false";

    if (!url) return;

    if (openExternal) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  });

  async function loadMethods() {
    try {
      const methods = await getEnabledGivingMethods();
      renderPaymentMethods(methods);
    } catch (error) {
      console.error("Unable to load giving methods:", error);
      paymentMethodsContainer.innerHTML =
        "<p>Unable to load giving methods at this time.</p>";
    }
  }

  loadMethods();
});