const express = require('express');
const app = express();
const PORT = 3000;

const CLIENT_ID = process.env.SATUSEHAT_CLIENT_ID;
const CLIENT_SECRET = process.env.SATUSEHAT_CLIENT_SECRET;
const BASE_URL = "https://api-satusehat-stg.dto.kemkes.go.id";

app.use(express.json());

app.get('/api/token', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);

    const response = await fetch(`${BASE_URL}/oauth2/v1/accesstoken?grant_type=client_credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend jalan di http://localhost:${PORT}`);
  console.log('Client ID terbaca:', CLIENT_ID ? 'YA' : 'TIDAK (env var belum keset)');
});