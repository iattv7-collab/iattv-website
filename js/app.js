// ======================================================
// FILE: /js/app.js
// PROJECT: IATTV Website
// PURPOSE:
// Main client-side behavior, mobile navigation,
// and English / Spanish language switching.
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const mainNav = document.getElementById("mainNav");
  const languageButtons = document.querySelectorAll("[data-language]");

  // ======================================================
  // MOBILE MENU
  // ======================================================

  if (mobileMenuButton && mainNav) {
    mobileMenuButton.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");

      mobileMenuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // ======================================================
  // TRANSLATIONS
  // ======================================================

  const translations = {
    en: {
      pageTitle: "IATTV | I Am The True Vine",

      navHome: "Home",
      navMessages: "Messages",
      navAbout: "About",
      navPrayer: "Prayer",
      navGive: "Give",
      navContact: "Contact",

      joinLiveService: "Watch Live",

      ministryName: "I AM THE TRUE VINE",
      heroJesus: "JESUS CHRIST",
      heroTrueVine: "THE TRUE VINE",
      heroVerse: "“I am the true vine, and my Father is the husbandman.”",
      heroReference: "JOHN 15:1",
      jesusIsLord: "JESUS IS LORD",
      watchMessages: "Watch Messages",

      liveLabel: "You’re Invited",
      liveDay: "Sábados de Maravillas y Milagros",
      liveTime: "7:00 PM EST",
      liveFeatures: "Faith <span>•</span> Word <span>•</span> Power",
      joinService: "Join us this Saturday",

      quickMessagesTitle: "Latest Messages",
      quickMessagesText:
        "Watch recent messages and grow in your faith anytime, anywhere.",
      quickMessagesLink: "Watch Now →",

      quickPrayerTitle: "Prayer Request",
      quickPrayerText:
        "We believe in the power of prayer. Let us pray with you.",
      quickPrayerLink: "Send Request →",

      quickGiveTitle: "Give",
      quickGiveText: "Partner with us in taking the Gospel to the nations.",
      quickGiveLink: "Give Now →",

      missionEyebrow: "IATTV MINISTRY",
      missionTitle: "Our Mission",
      missionText:
        "Our mission is to proclaim Jesus Christ, preach His Word, make disciples, and reach people throughout the world with the Gospel.",
      missionLink: "Learn More About Us →",

      missionVerse:
        "Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine; no more can ye, except ye abide in me.",
      missionReference: "JOHN 15:4",

      declarationTitle: "Jesus Is Lord",
      declarationText: "To the glory of God the Father",

      messagesEyebrow: "GROW IN THE WORD",
      messagesTitle: "Latest Messages",
      messagesViewAll: "View All Messages →",

      message1Title: "Abide in the True Vine",
      message2Title: "The Word That Transforms",
      message3Title: "Walking in His Purpose",
      message4Title: "Fruit That Remains",
      watchMessage: "Watch Message →",

      prayerEyebrow: "WE BELIEVE IN PRAYER",
      prayerTitle: "How Can We Pray for You?",
      prayerText:
        "Whatever you are facing, you do not have to face it alone. Send us your prayer request and allow us to stand with you in faith.",
      prayerButton: "Send a Prayer Request",

      giveEyebrow: "PARTNER WITH THE MINISTRY",
      giveTitle: "Help Take the Gospel Further",
      giveText:
        "Your giving helps IATTV continue proclaiming Jesus Christ and sharing the Word of God with people around the world.",
      giveButton: "Give",

      contactEyebrow: "CONNECT WITH IATTV",
      contactTitle: "Stay Connected",
      contactText:
        "Connect with the ministry for services, messages, prayer, and ministry updates.",

      footerTagline: "I AM THE TRUE VINE",
      footerDeclaration: "Jesus Christ — The True Vine",
      footerReference: "John 15:1",
    },

    es: {
      pageTitle: "IATTV | Yo Soy La Vid Verdadera",

      navHome: "Inicio",
      navMessages: "Mensajes",
      navAbout: "Nosotros",
      navPrayer: "Oración",
      navGive: "Ofrendar",
      navContact: "Contacto",

      joinLiveService: "En vivo",

      ministryName: "YO SOY LA VID VERDADERA",
      heroJesus: "JESUCRISTO",
      heroTrueVine: "LA VID VERDADERA",
      heroVerse: "“Yo soy la vid verdadera, y mi Padre es el labrador.”",
      heroReference: "JUAN 15:1",
      jesusIsLord: "JESÚS ES EL SEÑOR",
      watchMessages: "Ver Mensajes",

      liveLabel: "Estás invitado",
      liveDay: "Sábados de Maravillas y Milagros",
      liveTime: "7:00 PM EST",
      liveFeatures: "Fe <span>•</span> Palabra <span>•</span> Poder",
      joinService: "Entra este sábado",

      quickMessagesTitle: "Últimos Mensajes",
      quickMessagesText:
        "Mira mensajes recientes y crece en tu fe en cualquier momento y lugar.",
      quickMessagesLink: "Ver Ahora →",

      quickPrayerTitle: "Petición de Oración",
      quickPrayerText:
        "Creemos en el poder de la oración. Permítenos orar contigo.",
      quickPrayerLink: "Enviar Petición →",

      quickGiveTitle: "Ofrendar",
      quickGiveText:
        "Únete a nosotros para llevar el Evangelio a las naciones.",
      quickGiveLink: "Ofrendar Ahora →",

      missionEyebrow: "MINISTERIO IATTV",
      missionTitle: "Nuestra Misión",
      missionText:
        "Nuestra misión es proclamar a Jesucristo, predicar Su Palabra, hacer discípulos y alcanzar a personas alrededor del mundo con el Evangelio.",
      missionLink: "Conoce Más Sobre Nosotros →",

      missionVerse:
        "Permaneced en mí, y yo en vosotros. Como el pámpano no puede llevar fruto por sí mismo, si no permanece en la vid, así tampoco vosotros, si no permanecéis en mí.",
      missionReference: "JUAN 15:4",

      declarationTitle: "Jesús Es El Señor",
      declarationText: "Para gloria de Dios Padre",

      messagesEyebrow: "CRECE EN LA PALABRA",
      messagesTitle: "Últimos Mensajes",
      messagesViewAll: "Ver Todos los Mensajes →",

      message1Title: "Permanece en la Vid Verdadera",
      message2Title: "La Palabra Que Transforma",
      message3Title: "Caminando en Su Propósito",
      message4Title: "Fruto Que Permanece",
      watchMessage: "Ver Mensaje →",

      prayerEyebrow: "CREEMOS EN LA ORACIÓN",
      prayerTitle: "¿Cómo Podemos Orar por Ti?",
      prayerText:
        "No importa lo que estés enfrentando, no tienes que enfrentarlo solo. Envíanos tu petición de oración y permítenos unirnos contigo en fe.",
      prayerButton: "Enviar una Petición de Oración",

      giveEyebrow: "APOYA EL MINISTERIO",
      giveTitle: "Ayúdanos a Llevar el Evangelio Más Lejos",
      giveText:
        "Tu ofrenda ayuda a IATTV a continuar proclamando a Jesucristo y compartiendo la Palabra de Dios con personas alrededor del mundo.",
      giveButton: "Ofrendar",

      contactEyebrow: "CONECTA CON IATTV",
      contactTitle: "Mantente Conectado",
      contactText:
        "Conéctate con el ministerio para servicios, mensajes, oración y actualizaciones.",

      footerTagline: "YO SOY LA VID VERDADERA",
      footerDeclaration: "Jesucristo — La Vid Verdadera",
      footerReference: "Juan 15:1",
    },
  };

  // ======================================================
  // HELPER FUNCTIONS
  // ======================================================

  function setText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function setHtml(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.innerHTML = value;
    }
  }

  function setAllText(selector, value) {
    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = value;
    });
  }

  // ======================================================
  // APPLY LANGUAGE
  // ======================================================

  function applyLanguage(language) {
    const t = translations[language] || translations.en;

    document.documentElement.lang = language;
    document.title = t.pageTitle;

    // HEADER
    setText(".main-nav a:nth-child(1)", t.navHome);
    setText(".main-nav a:nth-child(2)", t.navMessages);
    setText(".main-nav a:nth-child(3)", t.navAbout);
    setText(".main-nav a:nth-child(4)", t.navPrayer);
    setText(".main-nav a:nth-child(5)", t.navGive);
    setText(".main-nav a:nth-child(6)", t.navContact);

    setText(".button-live", t.joinLiveService);
    setText(".brand-tagline", t.ministryName);

    // HERO
    setText(".hero-ministry-name", t.ministryName);
    setText(".hero h1 span", t.heroJesus);
    setText(".hero h1 strong", t.heroTrueVine);
    setText(".hero blockquote", t.heroVerse);
    setText(".scripture-reference", t.heroReference);
    setText(".hero .jesus-is-lord", t.jesusIsLord);

    setText(".hero-buttons .button-primary", t.watchMessages);
    setText(".hero-buttons .button-secondary", t.joinLiveService);

    // LIVE CARD is owned by /js/modules/live-service/public-live-service.js
    // so admin can edit the invitation without language files overwriting it.

    // QUICK ACTIONS
    const actionCards = document.querySelectorAll(".action-card");

    if (actionCards[0]) {
      setTextInCard(
        actionCards[0],
        t.quickMessagesTitle,
        t.quickMessagesText,
        t.quickMessagesLink,
      );
    }

    if (actionCards[1]) {
      setTextInCard(
        actionCards[1],
        t.quickPrayerTitle,
        t.quickPrayerText,
        t.quickPrayerLink,
      );
    }

    if (actionCards[2]) {
      setTextInCard(
        actionCards[2],
        t.quickGiveTitle,
        t.quickGiveText,
        t.quickGiveLink,
      );
    }

    // MISSION
    setText(".mission-content .section-eyebrow", t.missionEyebrow);
    setText(".mission-content h2", t.missionTitle);
    setText(".mission-content > p:not(.section-eyebrow)", t.missionText);
    setText(".mission-content .text-link", t.missionLink);

    setText(".mission-scripture blockquote", t.missionVerse);
    setText(".mission-scripture p", t.missionReference);

    setText(".mission-declaration h2", t.declarationTitle);
    setText(".mission-declaration p", t.declarationText);

    // LATEST MESSAGES
    setText(".messages-section .section-eyebrow", t.messagesEyebrow);
    setText(".messages-section .section-heading h2", t.messagesTitle);
    setText(".messages-section .section-heading .text-link", t.messagesViewAll);

    const messageCards = document.querySelectorAll(".message-card");

    if (messageCards[0]) {
      setTextInMessageCard(messageCards[0], t.message1Title, t.watchMessage);
    }

    if (messageCards[1]) {
      setTextInMessageCard(messageCards[1], t.message2Title, t.watchMessage);
    }

    if (messageCards[2]) {
      setTextInMessageCard(messageCards[2], t.message3Title, t.watchMessage);
    }

    if (messageCards[3]) {
      setTextInMessageCard(messageCards[3], t.message4Title, t.watchMessage);
    }

    // PRAYER
    setText(".prayer-section .section-eyebrow", t.prayerEyebrow);
    setText(".prayer-section h2", t.prayerTitle);
    setText(
      ".prayer-section .content-narrow > p:not(.section-eyebrow)",
      t.prayerText,
    );
    setText(".prayer-section .button", t.prayerButton);

    // GIVE
    setText(".give-section .section-eyebrow", t.giveEyebrow);
    setText(".give-section h2", t.giveTitle);
    setText(
      ".give-section .content-narrow > p:not(.section-eyebrow)",
      t.giveText,
    );
    setText(".give-section .button", t.giveButton);

    // CONTACT
    setText(".contact-section .section-eyebrow", t.contactEyebrow);
    setText(".contact-section h2", t.contactTitle);
    setText(
      ".contact-section .content-narrow > p:not(.section-eyebrow)",
      t.contactText,
    );

    // FOOTER
    setText(".footer-brand span", t.footerTagline);

    const footerParagraphs = document.querySelectorAll(".footer-inner > p");

    if (footerParagraphs[0]) {
      footerParagraphs[0].textContent = t.footerDeclaration;
    }

    if (footerParagraphs[1]) {
      footerParagraphs[1].textContent = t.footerReference;
    }

    // ACTIVE LANGUAGE BUTTON
    languageButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.language === language);
    });

    // REMEMBER CHOICE
    localStorage.setItem("iattv_language", language);
  }

  function setTextInCard(card, title, text, link) {
    const titleElement = card.querySelector("h2");
    const textElement = card.querySelector("p");
    const linkElement = card.querySelector("a");

    if (titleElement) {
      titleElement.textContent = title;
    }

    if (textElement) {
      textElement.textContent = text;
    }

    if (linkElement) {
      linkElement.textContent = link;
    }
  }

  function setTextInMessageCard(card, title, link) {
    const titleElement = card.querySelector("h3");
    const linkElement = card.querySelector("a");

    if (titleElement) {
      titleElement.textContent = title;
    }

    if (linkElement) {
      linkElement.textContent = link;
    }
  }

  // ======================================================
  // LANGUAGE BUTTON EVENTS
  // ======================================================

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyLanguage(button.dataset.language);
    });
  });

  // ======================================================
  // INITIAL LANGUAGE
  // ======================================================

  const savedLanguage = localStorage.getItem("iattv_language") || "en";

  applyLanguage(savedLanguage);
});