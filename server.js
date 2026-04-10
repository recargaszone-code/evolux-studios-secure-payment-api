import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(express.json());

// 🔐 ENV
const TOKEN = process.env.DEBITO_TOKEN;

// Wallets
const WALLETS = {
  mpesa: process.env.WALLET_MPESA,
  emola: process.env.WALLET_EMOLA
};

// 🚫 Rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5
});

app.use("/pay", limiter);

// 🚀 Endpoint principal
app.post("/pay", async (req, res) => {
  try {
    const { msisdn, amount, reference, method } = req.body;

    // ✅ validação
    if (!msisdn || !amount || !reference || !method) {
      return res.status(400).json({ error: "Campos obrigatórios em falta" });
    }

    if (!["mpesa", "emola"].includes(method)) {
      return res.status(400).json({ error: "Método inválido" });
    }

if (!/^(84|85|86|87)\d{7}$/.test(msisdn)) {
  return res.status(400).json({ error: "Número inválido" });
}

    if (amount < 1) {
      return res.status(400).json({ error: "Valor inválido" });
    }

const prefix = msisdn.slice(0, 2);

if (method === "mpesa" && !["84", "85"].includes(prefix)) {
  return res.status(400).json({ error: "MPesa usa números 84 ou 85" });
}

if (method === "emola" && !["86", "87"].includes(prefix)) {
  return res.status(400).json({ error: "eMola usa números 86 ou 87" });
}

    const wallet_id = WALLETS[method];

    const endpoint = `https://my.debito.co.mz/api/v1/wallets/${wallet_id}/c2b/${method}`;

    console.log("🔥 REQUEST:", { msisdn, amount, method });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        msisdn,
        amount,
        reference_description: reference
      })
    });

    const data = await response.json();

    console.log("✅ RESPONSE:", data);

    return res.json({
      method,
      ...data
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

// 🔥 Health check (IMPORTANTE pro Render)
app.get("/", (req, res) => {
  res.send("API ONLINE 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
