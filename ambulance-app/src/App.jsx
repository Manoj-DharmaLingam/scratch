import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import { ambulanceLogin, ambulanceSignup } from './services/api';

function AuthView({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    ambulance_id: '',
    driver_name: '',
    driver_phone: '',
    ambulance_registration_number: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const auth = mode === 'signup'
        ? await ambulanceSignup(form)
        : await ambulanceLogin({ email: form.email, password: form.password });
      localStorage.setItem('ambulance_token', auth.access_token);
      onAuthenticated();
    } catch (err) {
      setError(String(err.message || err));
    }
  };

  return (
    <div className="dashboard" style={{ maxWidth: 680, margin: '0 auto', padding: '24px' }}>
      <h2>{mode === 'signup' ? 'Ambulance Signup' : 'Ambulance Login'}</h2>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        {mode === 'signup' && (
          <>
            <input className="form-control" placeholder="Ambulance ID" value={form.ambulance_id} onChange={(e) => setField('ambulance_id', e.target.value)} required />
            <input className="form-control" placeholder="Driver Name" value={form.driver_name} onChange={(e) => setField('driver_name', e.target.value)} required />
            <input className="form-control" placeholder="Driver Phone" value={form.driver_phone} onChange={(e) => setField('driver_phone', e.target.value)} required />
            <input className="form-control" placeholder="Registration Number" value={form.ambulance_registration_number} onChange={(e) => setField('ambulance_registration_number', e.target.value)} required />
          </>
        )}
        <input className="form-control" placeholder="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
        <input className="form-control" placeholder="Password" type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} required />
        <button className="btn btn-primary" type="submit">{mode === 'signup' ? 'Create Ambulance Account' : 'Login'}</button>
      </form>
      <button className="btn btn-ghost" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')} style={{ marginTop: 12 }}>
        {mode === 'signup' ? 'Already have an account?' : 'Need an account? Sign up'}
      </button>
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem('ambulance_token')));

  if (!authenticated) {
    return <AuthView onAuthenticated={() => setAuthenticated(true)} />;
  }

  return <Dashboard onLogout={() => { localStorage.removeItem('ambulance_token'); setAuthenticated(false); }} />;
}
