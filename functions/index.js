// ======================================================
// FILE: /functions/index.js
// PROJECT: IATTV Website
// PURPOSE:
// Firebase Cloud Functions for IATTV.
// Sends public prayer requests by email using Resend.
// Provides Give 2 statement lookup by email and date range.
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

admin.initializeApp();

const db = admin.firestore();

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

setGlobalOptions({
  maxInstances: 10,
});

function clean(value, maxLength) {
  const limit = maxLength || 5000;
  return String(value || "").trim().slice(0, limit);
}

function validEmail(value) {
  if (!value) {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;",
    }[character];
  });
}

exports.sendPrayerRequest = onCall(
    {
      secrets: [RESEND_API_KEY],
    },
    async (request) => {
      const data = request.data || {};

      const name = clean(data.name, 150);
      const email = clean(data.email, 254);
      const phone = clean(data.phone, 50);
      const prayerRequest = clean(data.request, 5000);
      const confidential = data.confidential === true;

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

      const settingsSnapshot = await db
          .collection("siteSettings")
          .doc("prayerRequests")
          .get();

      if (!settingsSnapshot.exists) {
        throw new HttpsError(
            "failed-precondition",
            "Prayer request delivery has not been configured.",
        );
      }

      const settings = settingsSnapshot.data() || {};
      const recipientEmail = clean(settings.recipientEmail, 254);

      if (!recipientEmail || !validEmail(recipientEmail)) {
        throw new HttpsError(
            "failed-precondition",
            "Prayer request destination is not configured correctly.",
        );
      }

      const displayName = name || "Anonymous";
      const subject = confidential ?
        "Confidential Prayer Request - IATTV" :
        "New Prayer Request - IATTV";

      const confidentialSection = confidential ?
        "<p><strong>CONFIDENTIAL PRAYER REQUEST</strong></p>" :
        "";

      const emailSection = email ?
        "<p><strong>Email:</strong> " + escapeHtml(email) + "</p>" :
        "";

      const phoneSection = phone ?
        "<p><strong>Phone:</strong> " + escapeHtml(phone) + "</p>" :
        "";

      const html =
        "<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:700px\">" +
        "<h2 style=\"color:#003399\">IATTV Prayer Request</h2>" +
        confidentialSection +
        "<p><strong>Name:</strong> " + escapeHtml(displayName) + "</p>" +
        emailSection +
        phoneSection +
        "<hr><p><strong>Prayer Request:</strong></p>" +
        "<p style=\"white-space:pre-wrap\">" + escapeHtml(prayerRequest) + "</p>" +
        "<hr><p style=\"font-size:12px;color:#666\">Submitted through the IATTV website.</p>" +
        "</div>";

      const resendPayload = {
        from: "IATTV Prayer Requests <prayer@iattv.org>",
        to: [recipientEmail],
        subject: subject,
        html: html,
      };

      if (email) {
        resendPayload.reply_to = email;
      }

      let resendResponse;

      try {
        resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + RESEND_API_KEY.value(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(resendPayload),
        });
      } catch (error) {
        console.error("Unable to contact Resend:", error);
        throw new HttpsError(
            "internal",
            "Unable to send the prayer request.",
        );
      }

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
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

      const result = await resendResponse.json();
      console.log("Prayer request email sent.", {
        resendId: result.id || "",
      });

      return {success: true};
    },
);

exports.getGive2Statement = onCall(async (request) => {
  const data = request.data || {};
  const email = clean(data.email, 254).toLowerCase();
  const fromDate = clean(data.fromDate, 10);
  const toDate = clean(data.toDate, 10);

  if (!email || !validEmail(email)) {
    throw new HttpsError(
        "invalid-argument",
        "A valid email is required.",
    );
  }

  if (!fromDate || !toDate) {
    throw new HttpsError(
        "invalid-argument",
        "A date range is required.",
    );
  }

  const snapshot = await db.collection("donations").get();

  const gifts = snapshot.docs.map((item) => {
    const row = item.data() || {};
    return {
      giftDate: String(row.giftDate || ""),
      fundName: String(row.fundNameSnapshot || ""),
      amount: Number(row.amount || 0),
      frequency: String(row.frequency || "one-time"),
      paymentMethod: String(row.paymentMethod || ""),
      status: String(row.status || ""),
      donorName: String(row.donorName || ""),
      donorEmail: String(row.donorEmail || "").toLowerCase(),
    };
  }).filter((row) => {
    return row.donorEmail === email &&
      row.status === "completed" &&
      row.giftDate >= fromDate &&
      row.giftDate <= toDate;
  }).sort((a, b) => a.giftDate.localeCompare(b.giftDate));

  const total = gifts.reduce((sum, row) => sum + row.amount, 0);

  const settingsSnap = await db.collection("givingSettings").doc("main").get();
  const settings = settingsSnap.exists ? settingsSnap.data() : {};

  return {
    success: true,
    email: email,
    fromDate: fromDate,
    toDate: toDate,
    donorName: gifts[0] ? gifts[0].donorName : "",
    statementNote: settings.statementNote ||
      "This statement reflects gifts recorded by IATTV. Official tax treatment is determined by applicable law and your advisor.",
    total: total,
    gifts: gifts.map((row) => {
      return {
        giftDate: row.giftDate,
        fundName: row.fundName,
        amount: row.amount,
        frequency: row.frequency,
        paymentMethod: row.paymentMethod,
      };
    }),
  };
});