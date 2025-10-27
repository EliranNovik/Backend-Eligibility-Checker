const express = require('express');
const cors = require('cors');
const { getAnalyticsData } = require('./src/api/analytics');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json()); // Add body-parser middleware

app.get('/api/proxy', async (req, res) => {
  try {
    const baseUrl = 'https://www.rainmakerqueen.com/hooks/catch/';
    const params = new URLSearchParams(req.query).toString();
    const url = `${baseUrl}?${params}`;

    const response = await fetch(url);
    const text = await response.text();
    
    // Check if this is a Sabatier campaign with additional webhook
    if (req.query.campaign === 'sabatier' && req.query.lead_source === '22186') {
      try {
        console.log('Sabatier campaign detected, sending to additional webhook');
        
        // Prepare data for the additional Sabatier webhook
        const sabatierWebhookData = {
          uid: req.query.uid,
          lead_source: req.query.lead_source,
          sid: req.query.sid,
          name: req.query.name,
          email: req.query.email,
          topic: req.query.topic,
          user_data: req.query.user_data,
          phone: req.query.phone,
          ref_url: req.query.ref_url,
          desc: req.query.desc,
          campaign: req.query.campaign,
          timestamp: req.query.timestamp
        };
        
        // Send to the additional Sabatier webhook
        const sabatierWebhookUrl = 'https://hooks.zapier.com/hooks/catch/5153141/u2i3msj/';
        const sabatierResponse = await fetch(sabatierWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sabatierWebhookData)
        });
        
        if (sabatierResponse.ok) {
          console.log('Successfully sent data to additional Sabatier webhook');
        } else {
          console.warn('Failed to send data to additional Sabatier webhook:', sabatierResponse.status);
        }
      } catch (error) {
        console.error('Error sending data to additional Sabatier webhook:', error);
        // Don't fail the main request if additional webhook fails
      }
    }
    
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

// Leadify webhook endpoint
app.post('/api/leadify-webhook', async (req, res) => {
  try {
    console.log('Leadify webhook received:', req.body);
    
    // Send to Leadify CRM endpoint using public Render URL
    const leadifyResponse = await fetch('https://leadify-crm-backend.onrender.com/api/hook/catch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    console.log('Leadify response status:', leadifyResponse.status);
    
    if (leadifyResponse.ok) {
      console.log('Successfully sent data to Leadify CRM');
      res.status(200).json({ success: true, message: 'Data sent to Leadify CRM' });
    } else {
      console.warn('Failed to send data to Leadify CRM:', leadifyResponse.status);
      const responseText = await leadifyResponse.text();
      console.warn('Leadify response:', responseText);
      res.status(leadifyResponse.status).json({ 
        success: false, 
        error: 'Failed to send to Leadify CRM',
        details: responseText 
      });
    }
  } catch (error) {
    console.error('Leadify webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Leadify webhook error', 
      details: error.message 
    });
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