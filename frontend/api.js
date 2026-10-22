// ÉTAPE 4 (Partie 4.2) — appels fetch() vers UNE seule URL (pas encore de bascule).
// Même interface que la version finale : apiRequest(path, {method, body}) => {data, backend}.
(function () {
  var cfg = window.APP_CONFIG;

  async function apiRequest(path, opts) {
    opts = opts || {};
    var options = { method: opts.method || "GET", headers: {} };
    if (opts.body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(opts.body);
    }
    var response;
    try {
      response = await fetch(cfg.PRIMARY_API_URL.replace(/\/+$/, "") + path, options);
    } catch (e) {
      throw new Error("Impossible de joindre le serveur. Réessayez plus tard.");
    }
    var data = null;
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) { // fetch ne rejette pas les 4xx/5xx
      var msg = data && data.error ? data.error : "Erreur HTTP " + response.status;
      if (data && Array.isArray(data.details)) msg += " — " + data.details.join(" ");
      throw new Error(msg);
    }
    return { data: data, backend: "primary", url: cfg.PRIMARY_API_URL };
  }

  window.apiRequest = apiRequest;
})();
