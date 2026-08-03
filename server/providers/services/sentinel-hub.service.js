/**
 * Copernicus Data Space Ecosystem / Sentinel Hub Processing API klijent.
 * Besplatan nalog: 10.000 Processing Units mesečno, dovoljno za povremenu
 * NDVI proveru po parceli. OAuth client_credentials tok, token se kešira
 * u memoriji do isteka.
 */
const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process';

const NDVI_EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "dataMask"],
    output: { bands: 4 }
  };
}

const ramp = [
  [-0.5, 0x0c0c0c],
  [-0.2, 0xbfbfbf],
  [-0.1, 0xdbdbdb],
  [0, 0xeaeaea],
  [0.1, 0xfff9cc],
  [0.2, 0xede8b5],
  [0.3, 0xddd89b],
  [0.4, 0xccc682],
  [0.5, 0xbcb76b],
  [0.6, 0xafc160],
  [0.7, 0x8eb54b],
  [0.8, 0x7ca037],
  [0.9, 0x6f8523],
  [1, 0x496b21]
];

const visualizer = new ColorRampVisualizer(ramp);

function evaluatePixel(sample) {
  const ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  return [...visualizer.process(ndvi), sample.dataMask];
}
`;

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SENTINEL_HUB_CLIENT_ID,
      client_secret: process.env.SENTINEL_HUB_CLIENT_SECRET
    })
  });

  if (!response.ok) {
    throw new Error(`Sentinel Hub autentifikacija nije uspela (${response.status})`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * @param {object} geometry GeoJSON geometrija granice parcele (WGS84)
 * @param {string} dateFrom YYYY-MM-DD
 * @param {string} dateTo YYYY-MM-DD
 * @returns {Promise<Buffer>} PNG snimak NDVI-a obojen po ramp skali
 */
async function fetchNdviImage(geometry, dateFrom, dateTo, width = 512, height = 512) {
  const token = await getAccessToken();

  const requestBody = {
    input: {
      bounds: {
        geometry,
        properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' }
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: { from: `${dateFrom}T00:00:00Z`, to: `${dateTo}T23:59:59Z` },
            maxCloudCoverage: 40,
            mosaickingOrder: 'leastCC'
          }
        }
      ]
    },
    output: {
      width,
      height,
      responses: [{ identifier: 'default', format: { type: 'image/png' } }]
    },
    evalscript: NDVI_EVALSCRIPT
  };

  const response = await fetch(PROCESS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Sentinel Hub Processing API greška (${response.status}): ${detail}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

module.exports = { fetchNdviImage };
