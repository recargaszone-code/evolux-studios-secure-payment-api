import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(express.json());

// 🔐 ENV
const TOKEN = process.env.DEBITO_TOKEN;
const API_KEY = process.env.API_KEY;

// Wallets
const WALLETS = {
  mpesa: process.env.WALLET_MPESA, // ex: 122767
  emola: process.env.WALLET_EMOLA  // ex: 808471
};

// 🚫 Rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});

app.use("/pay", limiter);

app.post("/pay", async (req, res) => {
  try {
    // 🔐 API KEY check
    if (req.headers["x-api-key"] !== API_KEY) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { msisdn, amount, reference, method } = req.body;

    // ✅ validação
    if (!msisdn || !amount || !reference || !method) {
      return res.status(400).json({ error: "Campos obrigatórios em falta" });
    }

    if (!["mpesa", "emola"].includes(method)) {
      return res.status(400).json({ error: "Método inválido" });
    }

    if (!/^8[45]\d{7}$/.test(msisdn)) {
      return res.status(400).json({ error: "Número inválido" });
    }

    if (amount < 1) {
      return res.status(400).json({ error: "Valor inválido" });
    }

    // 🔥 escolha dinâmica
    const wallet_id = WALLETS[method];
    const endpoint = `https://my.debito.co.mz/api/v1/wallets/${wallet_id}/c2b/${method}`;

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

    return res.json({
      method,
      ...data
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

app.listen(3000, () => {
  console.log("🔥 Proxy running on port 3000");
});
