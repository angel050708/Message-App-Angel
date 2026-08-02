const BASE = import.meta.env.VITE_API_URL;

export const fileUrl = (path) => (path ? BASE + path : null);

async function request(method, path, body) {
  const init = { method, credentials: 'include' };

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  const res = await fetch(BASE + '/api' + path, init);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data?.error ?? 'Error de red');
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
};
