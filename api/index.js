
// Vercel Serverless Function (Node.js)
// Acts as a proxy to bypass CORS in production

export default async function handler(request, response) {
  const API_BASE_URL = process.env.UPSTREAM_API_URL;

  if (!API_BASE_URL) {
    console.error('Missing UPSTREAM_API_URL environment variable');
    return response.status(500).json({ error: 'Server Configuration Error' });
  }

  // Robust path extraction: 
  // 1. Try to get 'path' from query (set by vercel.json rewrite)
  // 2. Fallback to extracting from request.url if query is missing (common in Vercel's direct routing)
  let { path } = request.query;
  
  if (!path) {
    const urlParts = request.url.split('/api/');
    if (urlParts.length > 1) {
      path = urlParts[1].split('?')[0];
    }
  }
  
  if (!path || path === 'index.js') {
    return response.status(400).json({ 
      error: 'Path is required', 
      received_url: request.url,
      hint: 'Ensure you are calling /api/endpoint_name'
    });
  }

  // Clean path and construct target URL
  const cleanPathParam = Array.isArray(path) ? path.join('/') : path;
  const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const targetUrl = new URL(`${baseUrl}/${cleanPathParam}`);
  
  // Forward all other query parameters
  Object.keys(request.query).forEach(key => {
    if (key !== 'path') {
      targetUrl.searchParams.append(key, request.query[key]);
    }
  });

  try {
    const apiResponse = await fetch(targetUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dracin-Stream-Proxy/1.1' 
      }
    });

    // Handle non-JSON or error responses from upstream
    const contentType = apiResponse.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await apiResponse.json();
    } else {
      // If not JSON, return the raw text or a placeholder
      const text = await apiResponse.text();
      console.warn(`Upstream returned non-JSON for ${path}:`, text.substring(0, 100));
      data = { result: null, raw: text.substring(0, 200), message: 'Upstream returned non-JSON response' };
    }
    
    // Set CORS headers
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*'); 
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    response.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
      return response.status(200).end();
    }

    return response.status(apiResponse.status).json(data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    return response.status(502).json({ 
      error: 'Bad Gateway', 
      message: 'Failed to communicate with upstream API',
      details: error.message
    });
  }
}
