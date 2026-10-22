// ÉTAPE 4 (Partie 4.2) — une seule URL d'API, centralisée ici.
// Remplacée à l'étape 8 par la version finale (frontend/config.js) avec URL principale + secours.
(function () {
  var isLocal = ["localhost", "127.0.0.1"].indexOf(window.location.hostname) !== -1;
  window.APP_CONFIG = Object.freeze({
    PRIMARY_API_URL: isLocal ? "http://localhost:3000" : "https://REMPLACER-PAR-URL-DU-BACKEND",
    SECONDARY_API_URL: "", // pas de secours avant la Partie 8
    TIMEOUT_MS: 8000,
  });
})();
