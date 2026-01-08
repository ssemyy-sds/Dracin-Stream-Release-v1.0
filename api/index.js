
// Vercel Serverless Function (Node.js)
// Acts as a proxy to bypass CORS in production
// Supports multiple API providers via ?provider= query param

export default async function handler(request, response) {
    // API Provider configurations (from env vars with fallbacks)
    const API_PROVIDERS = {
        sansekai: process.env.UPSTREAM_API_URL || 'https://api.sansekai.my.id',
        gimita: process.env.SECONDARY_API_URL || 'https://api.gimita.id/api'
    };

    // Set CORS headers early for all responses including errors
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

    // FIX: [DEP0169] DeprecationWarning mitigation.
    const urlParts = (request.url || '').split('?');
    const pathname = urlParts[0];
    const queryString = urlParts.length > 1 ? urlParts[1] : '';
    const searchParams = new URLSearchParams(queryString);

    // Get provider (default: sansekai)
    const provider = searchParams.get('provider') || 'sansekai';

    let path = searchParams.get('path');

    // Robust path extraction
    if (!path) {
        // If request is /api/search/dramabox, split gets ['', 'search/dramabox']
        const splitPath = pathname.split('/api/');
        if (splitPath.length > 1) {
            path = splitPath[1];
        }
    }

    if (!path || path === 'index.js') {
        return response.status(400).json({
            error: 'Path is required',
            received_url: request.url,
            hint: 'Ensure you are calling /api/endpoint_name',
            available_providers: Object.keys(API_PROVIDERS)
        });
    }

    // Determine Base URL based on provider
    const baseUrl = (API_PROVIDERS[provider] || API_PROVIDERS.sansekai).replace(/\/$/, '');

    // Clean path: Ensure no leading slash in path to avoid double slash issues
    const cleanPathParam = (Array.isArray(path) ? path.join('/') : path).replace(/^\//, '');

    // Construct target URL
    const targetUrl = new URL(`${baseUrl}/${cleanPathParam}`);

    // Forward all other query parameters (except provider and path)
    searchParams.forEach((value, key) => {
        if (key !== 'path' && key !== 'provider') {
            targetUrl.searchParams.append(key, value);
        }
    });

    try {
        console.log(`[Proxy] Fetching from ${provider}: ${targetUrl.toString()}`);

        const apiResponse = await fetch(targetUrl.toString(), {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Dracin-Stream-Proxy/1.2'
            }
        });

        // Handle non-JSON or error responses from upstream
        const contentType = apiResponse.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await apiResponse.json();
        } else {
            // Silently return empty on non-JSON to allow client fallback logic to proceed
            return response.status(200).json({ data: [], error: 'Upstream returned non-JSON', provider });
        }

        // Add provider info to response for debugging
        if (typeof data === 'object' && data !== null) {
            data._provider = provider;
        }

        return response.status(apiResponse.status).json(data);
    } catch (error) {
        console.error(`[Proxy] Error from ${provider}:`, error.message);
        return response.status(502).json({
            error: 'Bad Gateway',
            message: 'Failed to communicate with upstream API',
            details: error.message,
            provider
        });
    }
}
