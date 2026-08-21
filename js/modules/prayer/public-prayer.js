// ======================================================
// FILE: /js/modules/prayer/public-prayer.js
// PROJECT: IATTV Website
// PURPOSE:
// Controls the public prayer-request form.
// ======================================================

import {
  submitPrayerRequest,
} from "/js/services/prayer-request-service.js";


// ======================================================
// ELEMENTS
// ======================================================

const modal =
  document.getElementById("prayerRequestModal");

const form =
  document.getElementById("prayerRequestForm");

const closeButton =
  document.getElementById("closePrayerModal");

const statusEl =
  document.getElementById("prayerFormStatus");

const submitButton =
  document.getElementById("prayerSubmitButton");

const openButtons =
  document.querySelectorAll(
    'a[href="#prayer-request"]',
  );


// ======================================================
// MODAL
// ======================================================

function openModal(event) {
  event.preventDefault();

  if (!modal) {
    return;
  }

  modal.hidden = false;

  document.body.classList.add(
    "modal-open",
  );

  document
    .getElementById("prayerName")
    ?.focus();
}


function closeModal() {
  if (!modal) {
    return;
  }

  modal.hidden = true;

  document.body.classList.remove(
    "modal-open",
  );

  statusEl.textContent = "";
}


openButtons.forEach((button) => {
  button.addEventListener(
    "click",
    openModal,
  );
});


closeButton?.addEventListener(
  "click",
  closeModal,
);


modal?.addEventListener(
  "click",
  (event) => {
    if (event.target === modal) {
      closeModal();
    }
  },
);


document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      modal &&
      !modal.hidden
    ) {
      closeModal();
    }
  },
);


// ======================================================
// SUBMIT
// ======================================================

form?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const request =
      document
        .getElementById("prayerRequest")
        .value
        .trim();

    if (!request) {
      statusEl.textContent =
        "Please enter your prayer request.";

      return;
    }

    submitButton.disabled = true;

    statusEl.textContent =
      "Sending your prayer request...";

    try {
      await submitPrayerRequest({
        name:
          document.getElementById(
            "prayerName",
          ).value,

        email:
          document.getElementById(
            "prayerEmail",
          ).value,

        phone:
          document.getElementById(
            "prayerPhone",
          ).value,

        request,

        confidential:
          document.getElementById(
            "prayerConfidential",
          ).checked,
      });

      form.reset();

      statusEl.textContent =
        "Your prayer request has been received. We will be praying with you.";

      setTimeout(() => {
        closeModal();
      }, 2500);
    } catch (error) {
      console.error(
        "Unable to submit prayer request:",
        error,
      );

      statusEl.textContent =
        "We could not send your prayer request. Please try again.";
    } finally {
      submitButton.disabled = false;
    }
  },
);