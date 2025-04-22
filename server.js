
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// ✅ Fix for fetch() in Node.js versions < 18
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/api/token", async (req, res) => {
  const { code, code_verifier, redirect_uri } = req.body;

  const params = new URLSearchParams();
  params.append("client_id", "55f5219aba8a4195b35e5ccb02cf6199");
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirect_uri);
  params.append("code_verifier", code_verifier);

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Token exchange failed:", err);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Spotify Token Server running at http://localhost:${PORT}`);
});
