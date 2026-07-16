export async function parseApi(res) {
    let json
    try {
        json = await res.json()
    } catch {
        return { ok: false, error: 'Invalid server response' }
    }
    if (!res.ok || !json.success) {
        return { ok: false, error: json.message || json.error || `HTTP ${res.status}` }
    }
    return { ok: true, data: json.data ?? null }
}
