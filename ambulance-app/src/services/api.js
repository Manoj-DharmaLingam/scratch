const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function authHeaders() {
  const token = localStorage.getItem('ambulance_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
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
