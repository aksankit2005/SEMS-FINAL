const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');

// Vite proxies this path locally; deployments can configure a separate API.
export const API_BASE_URL = configuredApiUrl || '/api';

export const apiUrl = (path) =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
