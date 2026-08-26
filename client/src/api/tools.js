import { request } from './client.js';

export const listTools = (params = {}, opts = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null),
  ).toString();
  return request(`/tools${qs ? `?${qs}` : ''}`, opts).then((r) => r.data);
};

export const createTool = (tool) => request('/tools', { method: 'POST', body: tool }).then((r) => r.data);
export const updateTool = (id, patch) => request(`/tools/${id}`, { method: 'PATCH', body: patch }).then((r) => r.data);
export const deleteTool = (id) => request(`/tools/${id}`, { method: 'DELETE' }).then((r) => r.data);
