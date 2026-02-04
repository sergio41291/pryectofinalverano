/**
 * API Configuration
 * Obtiene URLs desde variables de entorno o usa valores por defecto
 */

// Obtener WebSocket URL desde import.meta.env o usar valor por defecto
export const getWebSocketUrl = (): string => {
  // En producción, usar el mismo host que el cliente
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    // En producción, usar el mismo protocolo y host que el cliente
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  
  // En desarrollo, usar VITE_WEBSOCKET_URL si está configurado, sino localhost:3001
  const envUrl = import.meta.env.VITE_WEBSOCKET_URL;
  
  if (envUrl) {
    // Convertir http/https a ws/wss si es necesario
    return envUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  }
  
  return 'http://localhost:3001';
};

// Obtener API URL desde import.meta.env o usar valor por defecto
export const getApiUrl = (): string => {
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  const envUrl = import.meta.env.VITE_API_URL;
  // Si VITE_API_URL ya incluye /api, quitarlo para consistencia
  if (envUrl?.endsWith('/api')) {
    return envUrl.slice(0, -4);
  }
  return envUrl || 'http://localhost:3001';
};

// Configuración consolidada
export const API_CONFIG = {
  websocketUrl: getWebSocketUrl(),
  apiUrl: getApiUrl(),
  apiPrefix: '/api',
};

export default API_CONFIG;
