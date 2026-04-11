async function readJsonOrThrow(resp) {
  const contentType = resp.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  const body = isJson ? await resp.json() : await resp.text()

  if (!resp.ok) {
    const message =
      typeof body === 'object' && body && body.detail
        ? String(body.detail)
        : `Request failed (${resp.status})`
    throw new Error(message)
  }

  return body
}

function adminHeaders(adminPassword) {
  if (!adminPassword) return {}
  return { 'admin-password': adminPassword }
}

export async function createComplaint(apiBaseUrl, payload) {
  const resp = await fetch(`${apiBaseUrl}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return readJsonOrThrow(resp)
}

export async function getComplaint(apiBaseUrl, id) {
  const trimmed = (id || '').trim()
  if (!trimmed) throw new Error('Complaint ID is required')

  const resp = await fetch(`${apiBaseUrl}/complaints/${encodeURIComponent(trimmed)}`)
  return readJsonOrThrow(resp)
}

export async function getAllComplaints(apiBaseUrl, adminPassword) {
  const resp = await fetch(`${apiBaseUrl}/complaints`, {
    headers: { ...adminHeaders(adminPassword) },
  })
  return readJsonOrThrow(resp)
}

export async function updateComplaintStatus(apiBaseUrl, adminPassword, id, status) {
  const resp = await fetch(`${apiBaseUrl}/complaints/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(adminPassword) },
    body: JSON.stringify({ status }),
  })
  return readJsonOrThrow(resp)
}

export async function getInsights(apiBaseUrl, adminPassword) {
  const resp = await fetch(`${apiBaseUrl}/insights`, {
    headers: { ...adminHeaders(adminPassword) },
  })
  return readJsonOrThrow(resp)
}

export async function getMlInsights(apiBaseUrl, adminPassword) {
  const resp = await fetch(`${apiBaseUrl}/ml-insights`, {
    headers: { ...adminHeaders(adminPassword) },
  })
  return readJsonOrThrow(resp)
}
