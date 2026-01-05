// api/index.js
export default async function handler(request, response) {
  const PRIMARY_API = process.env.UPSTREAM_API_URL;
  const SECONDARY_API = 'https://api.gimita.id/api';

  // Enable CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { pathname, searchParams } = new URL(request.url, `https://${request.headers.host}`);
  
  let path = searchParams.get('path');
  const provider = searchParams.get('provider');
  
  if (!path) {
    const splitPath = pathname.split('/api/');
    if (splitPath.length > 1) {
      path = splitPath[1];
    }
  }
  
  if (!path || path === 'index.js') {
    return response.status(400).json({ 
      error: 'Path is required', 
      received_url: request.url,
      pathname,
      searchParams: Object.fromEntries(searchParams)
    });
  }

  // Build target URL
  const baseApi = provider === 'secondary' ? SECONDARY_API : PRIMARY_API;
  const targetUrl = new URL(path, baseApi);
  
  // Forward query params
  searchParams.forEach((value, key) => {
    if (key !== 'path' && key !== 'provider') {
      targetUrl.searchParams.append(key, value);
    }
  });

  console.log('[PROXY] Forwarding:', targetUrl.toString());

  try {
    const apiResponse = await fetch(targetUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dracin-Stream-Proxy/1.1' 
      }
    });

    const data = await apiResponse.json();
    
    console.log('[PROXY] Response status:', apiResponse.status);
    console.log('[PROXY] Response preview:', JSON.stringify(data).substring(0, 200));

    return response.status(apiResponse.status).json(data);
  } catch (error) {
    console.error('[PROXY] Error:', error);
    return response.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message,
      target_url: targetUrl.toString()
    });
  }
}
