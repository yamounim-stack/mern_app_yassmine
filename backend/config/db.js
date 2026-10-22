const mongoose = require("mongoose");

let connecting = null;

// Connexion idempotente : réutilisable en local (Railway) et en serverless (Vercel).
async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!process.env.MONGODB_URI) {
    throw new Error("Variable d'environnement MONGODB_URI manquante");
  }

  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
      .then(() => {
        console.log("✅ Connecté à MongoDB Atlas");
        return mongoose.connection;
      })
      .catch((error) => {
        connecting = null; // permet de réessayer à la requête suivante
        throw error;
      });
  }
  return connecting;
}

mongoose.connection.on("disconnected", () => {
  connecting = null;
});

// Middleware : s'assure que la base est connectée avant de traiter la route.
async function ensureDB(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB :", error.message);
    res.status(503).json({ error: "Base de données indisponible" });
  }
}

module.exports = { connectDB, ensureDB };
