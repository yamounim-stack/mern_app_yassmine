const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le champ "name" est obligatoire'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    // Identifiant d'idempotence envoyé par le frontend : évite les doublons
    // si la même requête POST est rejouée (nouvelle tentative / bascule).
    requestId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Item", itemSchema);
