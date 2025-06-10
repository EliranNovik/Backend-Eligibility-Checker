const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const path = require('path');

// Your GA4 property ID
const PROPERTY_ID = 'G-492501604';

/**
 * Fetches analytics data for a given date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} Analytics data
 */
async function getAnalyticsData(startDate, endDate) {
  // Create credentials from environment variable if available, otherwise use file
  let credentials;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  } else {
    const KEY_FILE_PATH = path.join(__dirname, 'service-account.json');
    credentials = { keyFilename: KEY_FILE_PATH };
  }

  const analyticsDataClient = new BetaAnalyticsDataClient(credentials);

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'totalUsers' },
      { name: 'sessions' },
      { name: 'bounceRate' },
    ],
  });

  // Parse the response
  const row = response.rows && response.rows[0]?.metricValues ? response.rows[0].metricValues : [];
  return {
    pageViews: row[0]?.value ? Number(row[0].value) : 0,
    users: row[1]?.value ? Number(row[1].value) : 0,
    sessions: row[2]?.value ? Number(row[2].value) : 0,
    bounceRate: row[3]?.value ? Number(row[3].value) : 0,
  };
}

module.exports = {
  getAnalyticsData
}; 