const express = require('express');
const cors = require('cors');
const { getAnalyticsData } = require('./src/api/analytics');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json()); // Add body-parser middleware

app.get('/api/proxy', async (req, res) => {
  try {
    const baseUrl = 'https://rmqdev.erps.co.il/hooks/catch/';
    const params = new URLSearchParams(req.query).toString();
    const url = `${baseUrl}?${params}`;

    const response = await fetch(url);
    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

// New analytics endpoint
app.post('/api/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const data = await getAnalyticsData(startDate, endDate);
    res.status(200).json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});