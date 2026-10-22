require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { connectDB, ensureDB } = require("./config/db");
const Item = require("./models/Item");

const app = express();
const port = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

/* ---------- CORS : uniquement les origines frontend prévues ---------- */
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // curl, Postman, health checks
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // En développement, si aucune liste n'est définie, on autorise tout.
      if (!isProd && allowedOrigins.length === 0) return callback(null, true);
      return callback(null, false); // pas d'en-têtes CORS => le navigateur bloque
    },
  })
);

app.use(express.json({ limit: "10kb" }));

/* ---------- Validation ---------- */
function validateItem(body) {
  const errors = [];
  const data = body && typeof body === "object" ? body : {};

  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) errors.push('Le champ "name" est obligatoire.');
  else if (name.length > 100) errors.push('"name" ne doit pas dépasser 100 caractères.');

  let description = "";
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== "string") {
      errors.push('"description" doit être une chaîne de caractères.');
    } else {
      description = data.description.trim();
      if (description.length > 500) errors.push('"description" ne doit pas dépasser 500 caractères.');
    }
  }

  let requestId;
  if (data.requestId !== undefined) {
    if (typeof data.requestId !== "string" || !/^[A-Za-z0-9_-]{8,64}$/.test(data.requestId)) {
      errors.push('"requestId" invalide.');
    } else {
      requestId = data.requestId;
    }
  }

  return { errors, value: { name, description, requestId } };
}

/* ---------- Routes ---------- */
app.get("/", (req, res) => {
  res.json({ message: "API MERN — voir /api/health" });
});

app.get("/api/health", (req, res) => {
  const states = ["déconnectée", "connectée", "connexion", "déconnexion"];
  res.json({
    status: "ok",
    message: "Le serveur répond",
    environment: process.env.NODE_ENV || "development",
    database: states[mongoose.connection.readyState] || "inconnue",
    time: new Date().toISOString(),
  });
});

app.get("/api/items", ensureDB, async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 }).limit(100);
  res.json(items);
});

app.post("/api/items", ensureDB, async (req, res) => {
  const { errors, value } = validateItem(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Données invalides", details: errors });
  }

  try {
    const item = await Item.create(value);
    return res.status(201).json(item);
  } catch (err) {
    // Requête rejouée avec le même requestId : on renvoie l'élément déjà créé.
    if (err.code === 11000 && value.requestId) {
      const existing = await Item.findOne({ requestId: value.requestId });
      if (existing) return res.status(200).json(existing);
    }
    throw err;
  }
});

/* ---------- 404 et gestion d'erreurs ---------- */
app.use((req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON invalide" });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Requête trop volumineuse" });
  if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

/* ---------- Démarrage ---------- */
async function start() {
  try {
    await connectDB(); // l'API n'est "prête" qu'après la connexion à MongoDB
    app.listen(port, () => {
      console.log("Server qui tourne sur le port : " + port);
    });
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB :", error.message);
    process.exit(1);
  }
}

// Lancé directement (node index.js) => Railway / local.
// Importé (Vercel) => on exporte simplement l'application Express.
if (require.main === module) start();

module.exports = app;
