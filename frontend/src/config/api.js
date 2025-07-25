/**
 * Dynamic API configuration that works across all platforms
 * Eliminates hardcoded ports and URLs
 */

const getApiBaseUrl = () => {
  // 1. Environment variable (highest priority)
  if (process.env.REACT_APP_API_URL) {
    console.log('Using API URL from environment:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. Platform auto-detection (no hardcoding needed)
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  console.log('🔍 API Detection Debug:', {
    hostname,
    protocol,
    port,
    fullUrl: window.location.href
  });
  
  // Replit detection
  if (hostname.includes('replit') || hostname.includes('repl.co')) {
    const replitBackendUrl = `${protocol}//${hostname.replace(/:(3000|8080)/, ':8000')}`;
    console.log('✅ Detected Replit, using backend URL:', replitBackendUrl);
    return replitBackendUrl;
  }
  
  // Railway detection
  if (hostname.includes('railway.app')) {
    const railwayUrl = `${protocol}//${hostname}`;
    console.log('✅ Detected Railway, using URL:', railwayUrl);
    return railwayUrl;
  }
  
  // Render detection
  if (hostname.includes('onrender.com')) {
    const renderUrl = process.env.REACT_APP_API_URL || 'https://ai-hedge-fund-backend.onrender.com';
    console.log('✅ Detected Render, using URL:', renderUrl);
    return renderUrl;
  }
  
  // Vercel detection
  if (hostname.includes('vercel.app')) {
    const vercelBackendUrl = process.env.REACT_APP_BACKEND_URL || 'https://your-backend.onrender.com';
    console.log('✅ Detected Vercel, using external backend URL:', vercelBackendUrl);
    return vercelBackendUrl;
  }
  
  // Netlify detection
  if (hostname.includes('netlify.app') || hostname.includes('windsurf.build')) {
    const netlifyBackendUrl = process.env.REACT_APP_BACKEND_URL || 'https://your-backend.onrender.com';
    console.log('✅ Detected Netlify, using external backend URL:', netlifyBackendUrl);
    return netlifyBackendUrl;
  }
  
  // 3. Local development (last resort)
  const localUrl = 'http://localhost:8000';
  console.log('🏠 Using local development URL:', localUrl);
  console.log('💡 If this fails, make sure backend is running on port 8000');
  return localUrl;
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Health check function to verify backend connectivity
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/docs`, {
      method: 'GET',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  BACKTEST: `${API_BASE_URL}/api/backtest`,
  run: `${API_BASE_URL}/api/run`,
  AGENT_CHAT: `${API_BASE_URL}/api/agent-chat`,
  HEALTH: `${API_BASE_URL}/docs`,
  BASE_URL: API_BASE_URL
};

console.log('API Configuration initialized:', {
  baseUrl: API_BASE_URL,
  endpoints: API_ENDPOINTS
});
