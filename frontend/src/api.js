const BASE = import.meta.env.VITE_API_URL || '/api'

async function handle(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.detail) message = body.detail
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return res.json()
}

export async function fetchVoices() {
  const res = await fetch(`${BASE}/voices`)
  return handle(res)
}

export async function enrollVoice(label, files) {
  const form = new FormData()
  form.append('label', label)
  files.forEach((f) => form.append('files', f))
  const res = await fetch(`${BASE}/voices`, { method: 'POST', body: form })
  return handle(res)
}

export async function deleteVoice(id) {
  const res = await fetch(`${BASE}/voices/${id}`, { method: 'DELETE' })
  return handle(res)
}

export async function verifyVoice(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/verify`, { method: 'POST', body: form })
  return handle(res)
}
