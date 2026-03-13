const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function authHeaders() {
  const token = localStorage.getItem('ambulance_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const payload = await response.json();
      message = payload.detail || payload.message || JSON.stringify(payload);
    } else {
      const text = await response.text();
      if (text) message = text;
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function ambulanceSignup(payload) {
  return fetchJson('/auth/ambulance/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function ambulanceLogin(payload) {
  return fetchJson('/auth/ambulance/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function postAmbulanceRequest(payload) {
  return fetchJson('/ambulance/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function fetchRecommendedHospitals(lat, lng, severity, requiredSpecialty = '') {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    severity,
  });
  if (requiredSpecialty) params.set('required_specialty', requiredSpecialty);
  return fetchJson(`/ambulance/recommend-hospital?${params.toString()}`, {
    headers: { ...authHeaders() },
  });
}

export async function postAlert(payload) {
  return fetchJson('/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function bookIcu(hospitalId, ambulanceRequestId) {
  return fetchJson('/ambulance/book-icu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ hospital_id: hospitalId, ambulance_request_id: ambulanceRequestId }),
  });
}

export async function getAmbulanceMe() {
  return fetchJson('/ambulance/me', { headers: { ...authHeaders() } });
}

export async function updateAmbulanceLocation(latitude, longitude) {
  return fetchJson('/ambulance/update-location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ latitude, longitude }),
  });
}
