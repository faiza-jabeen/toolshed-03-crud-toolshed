const BASE = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(message, { status = 0, fields = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;   // { fieldName: message } from the server's validator
  }
}

/**
 * One place that knows how the API reports success and failure. Every caller
 * gets either parsed data or an ApiError — never a raw Response to interpret.
 */
export async function request(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError('Cannot reach the Toolshed server. Is it running?', { status: 0 });
  }

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      payload?.error?.message || `Request failed (${res.status}).`,
      { status: res.status, fields: payload?.error?.fields ?? null },
    );
  }
  return payload;
}
