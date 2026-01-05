
// Vercel Serverless Function (Node.js)
// Acts as a proxy to bypass CORS in production

export default async function handler(request, response) {
  const PRIMARY_API = process.env.UPSTREAM_API_URL;
  const SECONDARY_API = 'https://api.gimita.id';

  // FIX: [DEP0169] DeprecationWarning mitigation.
  // Instead of using `new URL(request.url, base)` which might trigger internal legacy parsing
  // on the request object in some Vercel runtimes, we strictly use string splitting.
  const urlParts = (request.url || '').split('?');
  const pathname = urlParts[0];
  const queryString = urlParts.length > 1 ? urlParts[1] : '';
  const searchParams = new URLSearchParams(queryString);

  let path = searchParams.get('path');
  const provider = searchParams.get('provider');
  
  // Robust path extraction
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
      hint: 'Ensure you are calling /api/endpoint_name'
    });
  }

  // Determine Base URL
  const baseUrl = (provider === 'secondary' ? SECONDARY_API : PRIMARY_API).replace(/\/$/, '');
  
  // Clean path
  const cleanPathParam = Array.isArray(path) ? path.join('/') : path;
  
  // Construct target URL
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
      // Silently return empty on non-JSON to allow client fallback logic to proceed
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
