const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

/**
 * Thin fetch wrapper.
 * - Always sends cookies (the admin session is an httpOnly cookie).
 * - Adds the custom header the server's CSRF guard requires on every state-changing request.
 * - Throws ApiError with the server's message/fields so forms can show them inline.
 */
async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  if (method !== 'GET') headers['X-Requested-With'] = 'gazva-admin';
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.fields);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isForm: true }),
};

export { ApiError };
