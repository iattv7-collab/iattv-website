// ======================================================
// FILE: /functions/index.js
// PROJECT: IATTV Website
// PURPOSE:
// Firebase Cloud Functions for IATTV.
// Sends public prayer requests by email using Resend.
// The destination email is controlled by the IATTV
// administrator through Firestore site settings.
// ======================================================

const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  defineSecret,
} = require("firebase-functions/params");

const {
  setGlobalOptions,
} = require("firebase-functions/v2");

const admin = require("firebase-admin");


// ======================================================
// INITIALIZE
// ======================================================

admin.initializeApp();

const db = admin.firestore();

const RESEND_API_KEY =
  defineSecret("RESEND_API_KEY");

setGlobalOptions({
  maxInstances: 10,
});


// ======================================================
// HELPERS
// ======================================================

/**
 * Cleans and limits user-provided text.
 * @param {*} value Value to clean.
 * @param {number} maxLength Maximum allowed length.
 * @return {string} Cleaned text.
 */
function clean(value, maxLength = 5000) {
  return String(value || "")
      .trim()
      .slice(0, maxLength);
}


/**
 * Validates an optional email address.
 * @param {string} value Email address.
 * @return {boolean} Whether the email is valid.
 */
function validEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value,
  );
}


/**
 * Escapes text for safe HTML output.
 * @param {*} value Value to escape.
 * @return {string} Escaped HTML text.
 */
function escapeHtml(value) {
  return String(value || "").replace(
      /[&<>"']/g,
      (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;",
      })[character],
  );
}


// ======================================================
// SEND PRAYER REQUEST
// ======================================================

exports.sendPrayerRequest = onCall(
    {
      secrets: [
        RESEND_API_KEY,
      ],
    },

    async (request) => {
      const data =
      request.data || {};


      // ==================================================
      // CLEAN PUBLIC INPUT
      // ==================================================

      const name =
      clean(
          data.name,
          150,
      );

      const email =
      clean(
          data.email,
          254,
      );

      const phone =
      clean(
          data.phone,
          50,
      );

      const prayerRequest =
      clean(
          data.request,
          5000,
      );

      const confidential =
      data.confidential === true;


      // ==================================================
      // VALIDATION
      // ==================================================

      if (!prayerRequest) {
        throw new HttpsError(
            "invalid-argument",
            "Prayer request is required.",
        );
      }

      if (!validEmail(email)) {
        throw new HttpsError(
            "invalid-argument",
            "The email address is invalid.",
        );
      }


      // ==================================================
      // GET ADMIN-CONTROLLED DESTINATION
      // ==================================================

      const settingsSnapshot =
      await db
          .collection(
              "siteSettings",
          )
          .doc(
              "prayerRequests",
          )
          .get();

      if (!settingsSnapshot.exists) {
        throw new HttpsError(
            "failed-precondition",
            "Prayer request delivery has not been configured.",
        );
      }

      const settings =
      settingsSnapshot.data() || {};

      const recipientEmail =
      clean(
          settings.recipientEmail,
          254,
      );

      if (
        !recipientEmail ||
      !validEmail(recipientEmail)
      ) {
        throw new HttpsError(
            "failed-precondition",
            "Prayer request destination is not configured correctly.",
        );
      }


      // ==================================================
      // BUILD EMAIL
      // ==================================================

      const displayName =
      name || "Anonymous";

      const subject =
      confidential ?
        "Confidential Prayer Request - IATTV" :
        "New Prayer Request - IATTV";

      const confidentialSection =
      confidential ?
        `
          <p>
            <strong>
              CONFIDENTIAL PRAYER REQUEST
            </strong>
          </p>
        ` :
        "";

      const emailSection =
      email ?
        `
          <p>
            <strong>Email:</strong>
            ${escapeHtml(email)}
          </p>
        ` :
        "";

      const phoneSection =
      phone ?
        `
          <p>
            <strong>Phone:</strong>
            ${escapeHtml(phone)}
          </p>
        ` :
        "";

      const html = `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #222222;
          max-width: 700px;
        "
      >

        <h2
          style="
            color: #003399;
          "
        >
          IATTV Prayer Request
        </h2>

        ${confidentialSection}

        <p>
          <strong>Name:</strong>
          ${escapeHtml(displayName)}
        </p>

        ${emailSection}

        ${phoneSection}

        <hr>

        <p>
          <strong>Prayer Request:</strong>
        </p>

        <p
          style="
            white-space: pre-wrap;
          "
        >${escapeHtml(prayerRequest)}</p>

        <hr>

        <p
          style="
            font-size: 12px;
            color: #666666;
          "
        >
          Submitted through the IATTV website.
        </p>

      </div>
    `;


      // ==================================================
      // BUILD RESEND PAYLOAD
      // ==================================================

      const resendPayload = {
        from: "IATTV Prayer Requests <prayer@iattv.org>",

        to: [
          recipientEmail,
        ],

        subject,

        html,
      };

      if (email) {
        resendPayload.reply_to =
        email;
      }


      // ==================================================
      // SEND THROUGH RESEND
      // ==================================================

      let resendResponse;

      try {
        resendResponse =
        await fetch(
            "https://api.resend.com/emails",
            {
              method: "POST",

              headers: {
                "Authorization":
                `Bearer ${RESEND_API_KEY.value()}`,

                "Content-Type":
                "application/json",
              },

              body:
              JSON.stringify(
                  resendPayload,
              ),
            },
        );
      } catch (error) {
        console.error(
            "Unable to contact Resend:",
            error,
        );

        throw new HttpsError(
            "internal",
            "Unable to send the prayer request.",
        );
      }


      // ==================================================
      // VERIFY RESEND RESPONSE
      // ==================================================

      if (!resendResponse.ok) {
        const errorText =
        await resendResponse.text();

        console.error(
            "Resend rejected prayer request email:",
            resendResponse.status,
            errorText,
        );

        throw new HttpsError(
            "internal",
            "Unable to send the prayer request.",
        );
      }

      const result =
      await resendResponse.json();

      console.log(
          "Prayer request email sent.",
          {
            resendId:
          result.id || "",
          },
      );

      return {
        success: true,
      };
    },
);
