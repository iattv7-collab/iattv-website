/* ======================================================
FILE: /js/give.js
PROJECT: IATTV Website
PURPOSE:
Controls the public IATTV giving interface including
giving frequency, amount selection, custom amounts,
payment method selection, and gift summary.
====================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const frequencyButtons = document.querySelectorAll(
    ".frequency-button"
  );

  const amountButtons = document.querySelectorAll(
    ".amount-button"
  );

  const customAmountInput =
    document.getElementById("customAmount");

  const paymentMethods = document.querySelectorAll(
    ".payment-method"
  );

  const selectedGiftAmount =
    document.getElementById("selectedGiftAmount");

  const selectedGiftFrequency =
    document.getElementById("selectedGiftFrequency");

  let selectedFrequency = "one-time";
  let selectedAmount = null;
  let selectedPaymentMethod = null;


  /* ====================================================
     FREQUENCY
  ==================================================== */

  frequencyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      frequencyButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      selectedFrequency = button.dataset.frequency;

      updateSummary();
    });
  });


  /* ====================================================
     PRESET AMOUNTS
  ==================================================== */

  amountButtons.forEach((button) => {
    button.addEventListener("click", () => {
      amountButtons.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      customAmountInput.value = "";

      selectedAmount = Number(button.dataset.amount);

      updateSummary();
    });
  });


  /* ====================================================
     CUSTOM AMOUNT
  ==================================================== */

  customAmountInput.addEventListener("input", () => {
    amountButtons.forEach((button) => {
      button.classList.remove("active");
    });

    const amount = Number(customAmountInput.value);

    if (amount > 0) {
      selectedAmount = amount;
    } else {
      selectedAmount = null;
    }

    updateSummary();
  });


  /* ====================================================
     PAYMENT METHOD
  ==================================================== */

  paymentMethods.forEach((button) => {
    button.addEventListener("click", () => {
      paymentMethods.forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      selectedPaymentMethod = button.dataset.method;

      console.log(
        "Selected payment method:",
        selectedPaymentMethod
      );
    });
  });


  /* ====================================================
     SUMMARY
  ==================================================== */

  function updateSummary() {
    if (selectedAmount) {
      selectedGiftAmount.textContent =
        formatCurrency(selectedAmount);
    } else {
      selectedGiftAmount.textContent =
        "Select an amount";
    }

    if (selectedFrequency === "monthly") {
      selectedGiftFrequency.textContent = "Monthly";
    } else {
      selectedGiftFrequency.textContent = "One-Time";
    }
  }


  /* ====================================================
     CURRENCY FORMATTER
  ==================================================== */

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    }).format(amount);
  }


  /* ====================================================
     INITIAL STATE
  ==================================================== */

  updateSummary();
});