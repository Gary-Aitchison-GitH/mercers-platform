const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),

  // Chat
  sendMessage: (sessionId, content, locale) =>
    request('POST', '/api/chat', { sessionId, content, locale }),

  // Admin
  getConversations: () => request('GET', '/api/admin/conversations'),
  joinConversation:  (sessionId) => request('POST', '/api/admin/join',  { sessionId }),
  leaveConversation: (sessionId) => request('POST', '/api/admin/leave', { sessionId }),
  sendAdminReply:    (sessionId, content) =>
    request('POST', '/api/admin/reply', { sessionId, content }),

  // SEO
  getSeoRecommendations: (page, locale) =>
    request('POST', '/api/seo', { page, locale }),

  // Social
  generateSocialPost: (listingId, platform, locale) =>
    request('POST', '/api/social', { listingId, platform, locale }),
}
