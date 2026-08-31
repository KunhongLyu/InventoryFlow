const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, { method = 'GET', body, token, form } = {}) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  let payload
  if (form) {
    // /auth/login expects OAuth2's form-encoded format, not JSON —
    // this is the one endpoint that's different from the rest of the API.
    payload = new URLSearchParams(form)
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  } else if (body !== undefined) {
    payload = JSON.stringify(body)
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = data.detail ?? detail
    } catch {
      // response wasn't JSON — fall back to statusText, already set above
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  register: (email, password) =>
    request('/auth/register', { method: 'POST', body: { email, password } }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', form: { username: email, password } }),

  listProducts: () => request('/products'),
  createProduct: (token, product) =>
    request('/products', { method: 'POST', body: product, token }),
  lowStock: (token) => request('/products/low-stock/list', { token }),

  createOrder: (token, items) =>
    request('/orders', { method: 'POST', body: { items }, token }),
  myOrders: (token) => request('/orders', { token }),

  promote: (token, userId) => request(`/users/${userId}/promote`, { method: 'PATCH', token }),
}
