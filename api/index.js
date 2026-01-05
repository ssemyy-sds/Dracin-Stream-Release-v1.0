
// Vercel Serverless Function (Node.js)
// Acts as a proxy to bypass CORS in production

export default async function handler(request, response) {
  // Primary API from env, Secondary API hardcoded as requested fallback
  const PRIMARY_API = process.env.UPSTREAM_API_URL;
  const SECONDARY_API = 'https://api.gimita.id';

  let { path, provider } = request.query;
  
  // Robust path extraction
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

  // Determine Base URL
  const baseUrl = (provider === 'secondary' ? SECONDARY_API : PRIMARY_API).replace(/\/$/, '');
  
  // Clean path and construct target URL
  const cleanPathParam = Array.isArray(path) ? path.join('/') : path;
  
  // Handle absolute path vs relative path logic regarding the base url structure
  // If cleanPathParam already contains 'api/', avoid doubling it if the base also has it?
  // Simply appending usually works if UPSTREAM_API_URL is the root domain. 
  // Given user config: UPSTREAM is .../api/dramabox. We append the endpoint.
  
  const targetUrl = new URL(`${baseUrl}/${cleanPathParam}`);
  
  // Forward all other query parameters
  Object.keys(request.query).forEach(key => {
    if (key !== 'path' && key !== 'provider') {
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
      const text = await apiResponse.text();
      console.warn(`Upstream (${provider || 'primary'}) returned non-JSON for ${path}:`, text.substring(0, 100));
      // Return null data but 200 OK so client can handle fallback gracefully
      return response.status(200).json({ data: [], error: 'Upstream returned non-JSON' });
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

    // Pass through the status unless it failed, then maybe mask it? 
    // Let's pass it through.
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
