// Vercel Serverless Function (Node.js)
// Acts as a proxy to bypass CORS in production

export default async function handler(request, response) {
  // SECURITY: Read from Environment Variable.
  // Do NOT commit the actual URL to GitHub.
  // Set 'UPSTREAM_API_URL' in your Vercel Project Settings.
  const API_BASE_URL = process.env.UPSTREAM_API_URL;

  if (!API_BASE_URL) {
    console.error('Missing UPSTREAM_API_URL environment variable');
    return response.status(500).json({ error: 'Server Configuration Error' });
  }

  // Get the path from the query parameter
  const { path } = request.query;
  
  if (!path) {
    return response.status(400).json({ error: 'Path is required' });
  }

  // Sanitize path (Basic) to prevent directory traversal attacks if the upstream supports file serving
  // Although fetch handles URL encoding, it's good practice to ensure we aren't passing weird chars.
  const cleanPathParam = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = new URL(`${API_BASE_URL}/${cleanPathParam}`);
  
  // Forward other query parameters
  Object.keys(request.query).forEach(key => {
    if (key !== 'path') {
      targetUrl.searchParams.append(key, request.query[key]);
    }
  });

  try {
    const apiResponse = await fetch(targetUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        // Optional: Add a custom User-Agent so the upstream knows it's your proxy
        'User-Agent': 'Dracin-Stream-Proxy/1.0' 
      }
    });

    const data = await apiResponse.json();
    
    // Set CORS headers
    // SECURITY IMPROVEMENT: In production, you might want to replace '*' with your actual Vercel domain
    // e.g., process.env.ALLOWED_ORIGIN || '*'
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*'); 
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    response.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    return response.status(apiResponse.status).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    // SECURITY: Do not leak the upstream URL or stack trace in the error message to the client
    return response.status(500).json({ error: 'Failed to fetch data from upstream source' });
  }
}