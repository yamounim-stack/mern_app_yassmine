// Client API avec basculement automatique : principal -> secours.
// Échec = erreur réseau, délai dépassé (AbortController) ou réponse HTTP non réussie (!response.ok).
(function () {
  var cfg = window.APP_CONFIG;

  function ApiError(message, kind, status) {
    var e = new Error(message);
    e.name = "ApiError";
    e.kind = kind; // "network" | "timeout" | "http"
    e.status = status || null;
    return e;
  }

  // Une tentative sur UNE url, avec délai maximal (couvre aussi la lecture du corps).
  async function attempt(url, options) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, cfg.TIMEOUT_MS);
    try {
      var response = await fetch(url, Object.assign({}, options, { signal: controller.signal }));
      var data = null;
      try { data = await response.json(); } catch (_) { /* corps vide ou non JSON */ }

      if (!response.ok) { // fetch ne rejette PAS les 4xx/5xx : on vérifie nous-mêmes
        var msg = data && data.error ? data.error : "Erreur HTTP " + response.status;
        if (data && Array.isArray(data.details)) msg += " — " + data.details.join(" ");
        throw ApiError(msg, "http", response.status);
      }
      return data;
    } catch (err) {
      if (err.name === "ApiError") throw err;
      if (err.name === "AbortError") throw ApiError("Délai dépassé (" + cfg.TIMEOUT_MS + " ms)", "timeout");
      throw ApiError("Erreur réseau", "network");
    } finally {
      clearTimeout(timer);
    }
  }

  // apiRequest("/api/items", { method: "POST", body: {...} })
  // => { data, backend: "primary" | "secondary", url }
  async function apiRequest(path, opts) {
    opts = opts || {};
    var options = { method: opts.method || "GET", headers: {} };
    if (opts.body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(opts.body);
    }

    var bases = [
      { name: "primary", url: cfg.PRIMARY_API_URL },
      { name: "secondary", url: cfg.SECONDARY_API_URL },
    ].filter(function (b) { return b.url; });

    var lastError = null;
    for (var i = 0; i < bases.length; i++) {
      var base = bases[i];
      try {
        var data = await attempt(base.url.replace(/\/+$/, "") + path, options);
        return { data: data, backend: base.name, url: base.url };
      } catch (err) {
        lastError = err;
        console.warn("[API] " + base.name + " en échec (" + err.kind + ") : " + err.message);
      }
    }

    // Tous les backends ont échoué : message compréhensible pour l'utilisateur.
    var finalError;
    if (lastError && lastError.kind === "http" && lastError.status >= 400 && lastError.status < 500) {
      finalError = ApiError(lastError.message, "http", lastError.status); // ex. validation refusée
    } else {
      finalError = ApiError(
        "Impossible de joindre le serveur (principal et secours). Vérifiez votre connexion puis réessayez.",
        "unavailable"
      );
    }
    throw finalError;
  }

  window.apiRequest = apiRequest;
})();
