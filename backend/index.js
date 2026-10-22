require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const items = [
  { id: 1, name: "Élément de démonstration", description: "Données en mémoire (avant MongoDB)" },
];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Le serveur répond" });
});

app.get("/api/items", (req, res) => {
  res.json(items);
});

app.post("/api/items", (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const description = typeof req.body?.description === "string" ? req.body.description.trim() : "";
  if (!name) return res.status(400).json({ error: 'Le champ "name" est obligatoire.' });
  if (name.length > 100) return res.status(400).json({ error: '"name" ne doit pas dépasser 100 caractères.' });

  const item = { id: items.length + 1, name, description };
  items.push(item);
  res.status(201).json(item);
});

app.use((req, res) => res.status(404).json({ error: "Route introuvable" }));

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON invalide" });
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

app.listen(port, () => console.log("Server qui tourne sur le port : " + port));