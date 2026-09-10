require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

const CLIENT_ID = process.env.SATUSEHAT_CLIENT_ID;
const CLIENT_SECRET = process.env.SATUSEHAT_CLIENT_SECRET;
const BASE_URL = "https://api-satusehat-stg.dto.kemkes.go.id";

app.use(cors());
app.use(express.json());

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);

  const response = await fetch(`${BASE_URL}/oauth2/v1/accesstoken?grant_type=client_credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (parseInt(data.expires_in || 3000) - 60) * 1000;
  return cachedToken;
}

app.get('/api/token', async (req, res) => {
  try {
    const token = await getAccessToken();
    res.json({ access_token: token, cached: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/obat', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    if (!keyword) return res.json({ total: 0, data: [] });

    const token = await getAccessToken();
    const url = `${BASE_URL}/kfa-v2/products/all?keyword=${encodeURIComponent(keyword)}&product_type=farmasi&size=15&page=1`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pasien', async (req, res) => {
  try {
    const nik = req.query.nik || '';
    if (!nik) return res.json({ total: 0, entry: [] });

    const token = await getAccessToken();
    const url = `${BASE_URL}/fhir-r4/v1/Patient?identifier=https://fhir.kemkes.go.id/id/nik|${encodeURIComponent(nik)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/nakes', async (req, res) => {
  try {
    const nik = req.query.nik || '';
    const id = req.query.id || '';
    if (!nik && !id) return res.json({ total: 0, entry: [] });

    const token = await getAccessToken();
    let url;
    if (id) {
      url = `${BASE_URL}/fhir-r4/v1/Practitioner/${encodeURIComponent(id)}`;
    } else {
      url = `${BASE_URL}/fhir-r4/v1/Practitioner?identifier=https://fhir.kemkes.go.id/id/nik|${encodeURIComponent(nik)}`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();

    if (id && data.resourceType === 'Practitioner') {
      return res.json({ total: 1, entry: [{ resource: data }] });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Backend jalan di http://localhost:${PORT}`);
  console.log('Client ID terbaca:', CLIENT_ID ? 'YA' : 'TIDAK');
});
