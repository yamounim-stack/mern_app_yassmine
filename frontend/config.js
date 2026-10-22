// Configuration NON secrète du frontend (centralisée ici, utilisée par api.js).
// À adapter après le déploiement des deux backends.
(function () {
  var isLocal = ["localhost", "127.0.0.1"].indexOf(window.location.hostname) !== -1;

  window.APP_CONFIG = Object.freeze({
    // Backend principal : Railway
    PRIMARY_API_URL: isLocal ? "http://localhost:3000" : "https://REMPLACER-PAR-URL-RAILWAY.up.railway.app",
    // Backend de secours : Vercel
    SECONDARY_API_URL: isLocal ? "http://localhost:3001" : "https://REMPLACER-PAR-URL-VERCEL.vercel.app",
    // Délai maximal par tentative (ms)
    TIMEOUT_MS: 8000,
  });
})();
