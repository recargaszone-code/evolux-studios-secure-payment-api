import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// 🔐 ENV (Render)
const TOKEN = process.env.DEBITO_TOKEN;
const WALLET_ID = process.env.WALLET_ID;

app.post("/pay", async (req, res) => {
  try {
    const { msisdn, amount, reference } = req.body;

    // validação básica
    if (!msisdn || !amount || !reference) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const response = await fetch(
      `https://my.debito.co.mz/api/v1/wallets/${WALLET_ID}/c2b/mpesa`,
      {
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
      }
    );

    const data = await response.json();

    return res.json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
});

app.listen(3000, () => {
  console.log("Proxy running on port 3000");
});
