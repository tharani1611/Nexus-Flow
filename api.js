import { state } from './state.js';

const BASE_URL = '/api';

async function request(url, options = {}) {
  const headers = { ...options.headers };

  // Set Authorization Header
  if (state.accessToken) {
    headers['Authorization'] = `Bearer ${state.accessToken}`;
  }

  // Set Content-Type unless uploading file (FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers
  };

  try {
    let response = await fetch(`${BASE_URL}${url}`, config);

    // Handle Token Expired (401)
    if (response.status === 401 && state.refreshToken) {
      console.log('Access token expired. Retrying with refresh token...');
      const refreshResult = await attemptTokenRefresh();
      if (refreshResult) {
        // Retry original request with new token
        config.headers['Authorization'] = `Bearer ${state.accessToken}`;
        response = await fetch(`${BASE_URL}${url}`, config);
      } else {
        // Log out user
        state.clearSession();
        window.dispatchEvent(new CustomEvent('auth-failed'));
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `HTTP Error ${response.status}`);
    }

    // Return JSON or text based on response content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (err) {
    console.error('API Request failed:', err.message);
    throw err;
  }
}

async function attemptTokenRefresh() {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: state.refreshToken })
    });

    if (!res.ok) return false;

    const data = await res.json();
    state.accessToken = data.accessToken;
    localStorage.setItem('accessToken', data.accessToken);
    return true;
  } catch (err) {
    console.error('Failed to refresh token:', err);
    return false;
  }
}

export const api = {
  get: (url) => request(url, { method: 'GET' }),
  post: (url, body) => request(url, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  put: (url, body) => request(url, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body)
  }),
  delete: (url) => request(url, { method: 'DELETE' })
};
