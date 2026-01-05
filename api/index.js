
// Vercel Serverless Function (Node.js)
// Acts as a proxy to bypass CORS in production

export default async function handler(request, response) {
  const PRIMARY_API = process.env.UPSTREAM_API_URL;
  const SECONDARY_API = 'https://api.gimita.id';

  // FIX: [DEP0169] DeprecationWarning.
  // We manually parse the URL using WHATWG API to avoid accessing 'request.query'
  // which might trigger legacy url.parse() internally in the serverless environment.
  // We use a dummy base 'http://n' because request.url is relative in Vercel.
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const searchParams = requestUrl.searchParams;

  let path = searchParams.get('path');
  const provider = searchParams.get('provider');
  
  // Robust path extraction if not passed via rewrites (e.g. direct calls)
  if (!path) {
    // Manually split from the pathname to avoid legacy parsing issues
    const pathname = requestUrl.pathname;
    const splitPath = pathname.split('/api/');
    if (splitPath.length > 1) {
      path = splitPath[1];
    }
  }
  
  if (!path || path === 'index.js') {
    return response.status(400).json({ 
      error: 'Path is required', 
      received_url: request.url,
      hint: 'Ensure you are calling /api/endpoint_name'
    });
  }

  // Determine Base URL
  const baseUrl = (provider === 'secondary' ? SECONDARY_API : PRIMARY_API).replace(/\/$/, '');
  
  const cleanPathParam = Array.isArray(path) ? path.join('/') : path;
  
  // Construct target URL using WHATWG API
  const targetUrl = new URL(`${baseUrl}/${cleanPathParam}`);
  
  // Forward all other query parameters
  searchParams.forEach((value, key) => {
    if (key !== 'path' && key !== 'provider') {
      targetUrl.searchParams.append(key, value);
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
      const text = await apiResponse.text();
      // Silently fail for non-json to avoid log spam, return empty data
      // console.warn(`Upstream returned non-JSON for ${path}`);
      return response.status(200).json({ data: [], error: 'Upstream returned non-JSON' });
    }
    
    // Set CORS headers
    response.setHeader('Access-Control-Allow-Credentials', 'true');
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
