const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function authHeaders() {
  const token = localStorage.getItem('hospital_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  if (!response.ok) {
    const text = await response.text();
    const err = new Error(text || `Request failed with ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

export async function hospitalSignup(payload) {
  return fetchJson('/auth/hospital/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function hospitalLogin(payload) {
  return fetchJson('/auth/hospital/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getHospitalMe() {
  return fetchJson('/hospital/me', { headers: { ...authHeaders() } });
}

export async function updateHospitalIcu(mode, count = 1) {
  return fetchJson('/hospital/update-icu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ mode, count }),
  });
}

export async function getHospitalAlerts() {
  return fetchJson('/hospital/alerts', { headers: { ...authHeaders() } });
}

export async function getPublicHospitals() {
  return fetchJson('/public/hospitals');
}

export async function updateHospitalLocation(latitude, longitude) {
  return fetchJson('/hospital/update-location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ latitude, longitude }),
  });
}

export async function updateAlertStatus(alertId, status) {
  return fetchJson(`/alerts/${alertId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });
}
