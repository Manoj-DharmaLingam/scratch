import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BedDouble,
  Bell,
  BellOff,
  Building2,
  CheckCircle2,
  Clock,
  Droplets,
  FileText,
  Loader2,
  LogOut,
  MapPin,
  Navigation,
  XCircle,
} from 'lucide-react';
import './App.css';
import {
  getHospitalAlerts,
  getHospitalMe,
  getPublicHospitals,
  hospitalLogin,
  hospitalSignup,
  updateAlertStatus,
  updateHospitalIcu,
} from './services/api';

const POLL_INTERVAL = 5000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function icuStatus(available, total) {
  if (!total) return { label: 'Unknown', cls: 'badge-muted' };
  const ratio = available / total;
  if (ratio === 0) return { label: 'ICU Full', cls: 'badge-danger' };
  if (ratio <= 0.25) return { label: 'Critical', cls: 'badge-danger' };
  if (ratio <= 0.5) return { label: 'Limited', cls: 'badge-warning' };
  return { label: 'Available', cls: 'badge-success' };
}

function severityCls(sev) {
  const s = (sev || '').toLowerCase();
  if (s === 'critical') return 'sev-critical';
  if (s === 'serious') return 'sev-serious';
  return 'sev-moderate';
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar({ hospitalName, onLogout, onToggleView, viewMode }) {
  return (
    <nav className="topnav">
      <div className="topnav-brand">
        <div className="topnav-icon">
          <Building2 size={20} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <div className="topnav-title">ICU Command</div>
          {hospitalName && <div className="topnav-sub">{hospitalName}</div>}
        </div>
      </div>

      <div className="topnav-tabs">
        <button
          className={`topnav-tab ${viewMode === 'public' ? 'topnav-tab-active' : ''}`}
          onClick={() => onToggleView('public')}
        >
          Public View
        </button>
        <button
          className={`topnav-tab ${viewMode === 'hospital' ? 'topnav-tab-active' : ''}`}
          onClick={() => onToggleView('hospital')}
        >
          Hospital Portal
        </button>
      </div>

      <div className="topnav-right">
        {onLogout && (
          <button className="signout-btn" onClick={onLogout}>
            <LogOut size={15} />
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}

// ─── Public View ─────────────────────────────────────────────────────────────

function PublicView() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getPublicHospitals();
      setHospitals(data);
      setLive(true);
    } catch {
      // retry on next poll
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  if (loading) {
    return (
      <div className="center-state">
        <Loader2 size={32} className="spin-icon" strokeWidth={1.5} />
        <p className="muted-text">Loading hospitals…</p>
      </div>
    );
  }

  return (
    <div className="content-wrap">
      <div className="content-header">
        <div>
          <h1 className="content-title">ICU Availability</h1>
          <p className="content-sub">Live bed status across all registered hospitals</p>
        </div>
        {live && <span className="live-pill">Live</span>}
      </div>

      {hospitals.length === 0 ? (
        <div className="empty-box">
          <Building2 size={52} className="empty-box-icon" strokeWidth={1} />
          <p className="empty-box-text">No hospitals registered yet.</p>
        </div>
      ) : (
        <div className="hosp-grid">
          {hospitals.map((h) => {
            const status = icuStatus(h.available_icu_beds, h.total_icu_beds);
            const occupied = h.total_icu_beds - h.available_icu_beds;
            const pct = h.total_icu_beds
              ? Math.round((occupied / h.total_icu_beds) * 100)
              : 0;
            const fillColor =
              pct >= 75 ? 'var(--danger)' : pct >= 50 ? 'var(--warning)' : 'var(--success)';

            return (
              <div className="hcard" key={h.id}>
                <div className="hcard-head">
                  <h3 className="hcard-name">{h.hospital_name}</h3>
                  <span className={`icu-badge ${status.cls}`}>{status.label}</span>
                </div>

                <p className="hcard-addr">
                  <MapPin size={13} strokeWidth={2} />
                  {h.hospital_address}
                </p>

                <div className="hcard-progress">
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, background: fillColor }}
                    />
                  </div>
                  <div className="progress-meta">
                    <span>{pct}% occupied</span>
                    <span>{h.available_icu_beds} / {h.total_icu_beds} free</span>
                  </div>
                </div>

                <div className="hcard-stats">
                  <div className="hcard-stat">
                    <span className="hstat-val">{h.total_icu_beds}</span>
                    <span className="hstat-lbl">Total</span>
                  </div>
                  <div className="hcard-stat">
                    <span className="hstat-val" style={{ color: 'var(--success)' }}>
                      {h.available_icu_beds}
                    </span>
                    <span className="hstat-lbl">Free</span>
                  </div>
                  <div className="hcard-stat">
                    <span className="hstat-val" style={{ color: 'var(--plum)' }}>
                      {occupied}
                    </span>
                    <span className="hstat-lbl">Occupied</span>
                  </div>
                </div>

                {h.specialties?.length > 0 && (
                  <div className="chip-row">
                    {h.specialties.slice(0, 4).map((s) => (
                      <span className="chip" key={s}>{s}</span>
                    ))}
                    {h.specialties.length > 4 && (
                      <span className="chip chip-more">+{h.specialties.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Hospital Dashboard ───────────────────────────────────────────────────────

const BED_ACTIONS = [
  { mode: 'add',     label: 'Add Beds',       cls: 'bact-primary'   },
  { mode: 'remove',  label: 'Remove Beds',    cls: 'bact-secondary' },
  { mode: 'occupy',  label: 'Mark Occupied',  cls: 'bact-warn'      },
  { mode: 'release', label: 'Mark Available', cls: 'bact-success'   },
  { mode: 'set',     label: 'Set Available',  cls: 'bact-secondary' },
];

function StatCard({ Icon, val, lbl, mod }) {
  return (
    <div className={`sc ${mod}`}>
      <span className="sc-icon">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <div>
        <div className="sc-val">{val}</div>
        <div className="sc-lbl">{lbl}</div>
      </div>
    </div>
  );
}

function HospitalDashboard() {
  const [hospital, setHospital] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  // ── ETA Alarm state ──────────────────────────────────────────────────────────
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [alarmActive, setAlarmActive] = useState(false);
  const silencedRef = useRef(new Set());   // IDs of alerts the user has silenced
  const audioCtxRef = useRef(null);
  const beepTimerRef = useRef(null);

  // Unlock Web Audio on first user gesture (browser autoplay policy)
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        try {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        } catch { /* not supported */ }
      }
      document.removeEventListener('click', unlock, true);
    };
    document.addEventListener('click', unlock, true);
    return () => document.removeEventListener('click', unlock, true);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (beepTimerRef.current) clearInterval(beepTimerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  function _playBeep() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.45, t + 0.04);
      gain.gain.setValueAtTime(0.45, t + 0.18);
      gain.gain.linearRampToValueAtTime(0, t + 0.28);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch { /* ignore */ }
  }

  function startBeep() {
    if (beepTimerRef.current) return;
    _playBeep();
    beepTimerRef.current = setInterval(_playBeep, 900);
  }

  function stopBeep() {
    if (beepTimerRef.current) {
      clearInterval(beepTimerRef.current);
      beepTimerRef.current = null;
    }
  }

  const silenceAlarm = () => {
    criticalAlerts.forEach(a => silencedRef.current.add(a.id));
    setAlarmActive(false);
    stopBeep();
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    try {
      const [me, incoming] = await Promise.all([getHospitalMe(), getHospitalAlerts()]);
      setHospital(me);
      setAlerts(incoming);

      // Detect active alerts with ETA < 5 minutes
      const newCritical = incoming.filter(
        a => (a.status === 'reserved' || a.status === 'acknowledged') && a.eta < 5,
      );
      setCriticalAlerts(newCritical);
      const hasUnseen = newCritical.some(a => !silencedRef.current.has(a.id));
      if (hasUnseen) {
        setAlarmActive(true);
        startBeep();
      } else {
        setAlarmActive(false);
        stopBeep();
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [refresh]);

  const runBedAction = async (mode) => {
    setBusy(mode);
    setError('');
    try {
      const next = await updateHospitalIcu(mode, Number(count) || 1);
      setHospital(next);
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const handleAlert = async (id, status) => {
    try {
      await updateAlertStatus(id, status);
      refresh();
    } catch (err) {
      setError(err.message || 'Failed to update alert');
    }
  };

  if (loading) {
    return (
      <div className="center-state">
        <Loader2 size={32} className="spin-icon" strokeWidth={1.5} />
        <p className="muted-text">Loading dashboard…</p>
      </div>
    );
  }

  const occupied = hospital ? hospital.total_icu_beds - hospital.available_icu_beds : 0;
  const pct = hospital?.total_icu_beds
    ? Math.round((occupied / hospital.total_icu_beds) * 100)
    : 0;
  const status = hospital ? icuStatus(hospital.available_icu_beds, hospital.total_icu_beds) : null;
  const fillColor = pct >= 75 ? 'var(--danger)' : pct >= 50 ? 'var(--warning)' : 'var(--success)';
  const pending = alerts.filter((a) => a.status === 'pending');
  const rest = alerts.filter((a) => a.status !== 'pending');

  return (
    <div className="content-wrap">
      {error && (
        <div className="error-toast" role="alert" onClick={() => setError('')}>
          <span className="toast-inner">
            <AlertTriangle size={16} strokeWidth={2} />
            {error}
          </span>
          <XCircle size={16} strokeWidth={2} className="toast-x" />
        </div>
      )}

      {/* ── ETA Alarm Beam ─────────────────────────────────────────────────── */}
      {alarmActive && criticalAlerts.length > 0 && (
        <div className="eta-alarm-beam" role="alert" aria-live="assertive">
          <div className="eta-alarm-icon">
            <Bell size={28} strokeWidth={2.5} />
          </div>
          <div className="eta-alarm-body">
            <div className="eta-alarm-title">AMBULANCE ARRIVING IN UNDER 5 MINUTES</div>
            <div className="eta-alarm-details">
              {criticalAlerts.map(a => (
                <span key={a.id} className="eta-alarm-chip">
                  {a.severity} · ETA {Math.round(a.eta)} min · {a.blood_group}
                </span>
              ))}
            </div>
          </div>
          <button className="eta-alarm-silence" onClick={silenceAlarm}>
            <BellOff size={16} strokeWidth={2} />
            Silence Alarm
          </button>
        </div>
      )}

      {hospital && (
        <>
          {/* Header */}
          <div className="dash-banner">
            <div>
              <div className="dash-name-row">
                <h1 className="dash-name">{hospital.hospital_name}</h1>
                {status && <span className={`icu-badge ${status.cls}`}>{status.label}</span>}
              </div>
              <p className="dash-addr">
                <MapPin size={14} strokeWidth={2} />
                {hospital.hospital_address}
              </p>
            </div>
            <div className="dash-live">
              <span className="live-dot" />
              <span className="muted-text">Live</span>
            </div>
          </div>

          {/* Stat row */}
          <div className="stat-row">
            <StatCard Icon={BedDouble}    val={hospital.total_icu_beds}     lbl="Total Beds"     mod=""          />
            <StatCard Icon={CheckCircle2} val={hospital.available_icu_beds} lbl="Available"      mod="sc-success" />
            <StatCard Icon={XCircle}      val={occupied}                    lbl="Occupied"       mod="sc-plum"   />
            <StatCard Icon={Bell}         val={pending.length}              lbl="Pending Alerts" mod="sc-warn"   />
          </div>

          {/* Occupancy bar */}
          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">ICU Occupancy</h2>
              <span className="pct-chip">{pct}%</span>
            </div>
            <div className="occ-bar">
              <div className="occ-fill" style={{ width: `${pct}%`, background: fillColor }} />
            </div>
            <div className="occ-labels">
              <span>{hospital.available_icu_beds} available</span>
              <span>{occupied} occupied of {hospital.total_icu_beds}</span>
            </div>
          </div>

          {/* Bed management */}
          <div className="panel">
            <h2 className="panel-title">Bed Management</h2>
            <div className="bedmgmt">
              <div className="bedmgmt-count">
                <label className="count-label">Count</label>
                <input
                  className="count-input"
                  type="number"
                  min="1"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="bedmgmt-actions">
                {BED_ACTIONS.map(({ mode, label, cls }) => (
                  <button
                    key={mode}
                    className={`bact ${cls}`}
                    onClick={() => runBedAction(mode)}
                    disabled={busy !== null}
                  >
                    {busy === mode
                      ? <Loader2 size={14} className="spin-icon" />
                      : label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Alerts */}
      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Incoming Ambulance Alerts</h2>
          {pending.length > 0 && (
            <span className="pending-badge">{pending.length} pending</span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="no-alerts">
            <CheckCircle2 size={16} strokeWidth={2} />
            No active alerts right now
          </div>
        ) : (
          <div className="alerts-stack">
            {[...pending, ...rest].map((a) => (
              <div className={`acard ${severityCls(a.severity)}`} key={a.id}>
                <div className="acard-top">
                  <div className="acard-chips">
                    <span className={`sev-tag sev-tag-${(a.severity || '').toLowerCase()}`}>
                      {a.severity || 'Unknown'}
                    </span>
                    <span className="info-chip">
                      <Clock size={12} strokeWidth={2} />
                      {Math.round(a.eta)} min ETA
                    </span>
                    <span className="info-chip">
                      <Droplets size={12} strokeWidth={2} />
                      {a.blood_group}
                    </span>
                    <span className="info-chip">
                      <Activity size={12} strokeWidth={2} />
                      O₂ {a.oxygen_level}%
                    </span>
                  </div>
                  <span className={`status-tag st-${a.status}`}>{a.status}</span>
                </div>

                {a.patient_condition_notes && (
                  <p className="acard-notes">
                    <FileText size={13} strokeWidth={2} />
                    {a.patient_condition_notes}
                  </p>
                )}

                {a.status === 'pending' && (
                  <div className="acard-actions">
                    <button className="aact aact-ack"
                      onClick={() => handleAlert(a.id, 'acknowledged')}>
                      Acknowledge
                    </button>
                    <button className="aact aact-done"
                      onClick={() => handleAlert(a.id, 'completed')}>
                      Complete
                    </button>
                    <button className="aact aact-cancel"
                      onClick={() => handleAlert(a.id, 'cancelled')}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auth View ────────────────────────────────────────────────────────────────

function AuthView({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    hospital_name: '', hospital_email: '', password: '',
    contact_number: '', latitude: '', longitude: '',
    hospital_address: '', specialties: '', total_icu_beds: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const switchMode = (m) => { setMode(m); setError(''); };

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', String(pos.coords.latitude));
        set('longitude', String(pos.coords.longitude));
        setLocating(false);
      },
      () => setLocating(false),
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let auth;
      if (mode === 'signup') {
        auth = await hospitalSignup({
          hospital_name: form.hospital_name,
          hospital_email: form.hospital_email,
          password: form.password,
          contact_number: form.contact_number,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          hospital_address: form.hospital_address,
          specialties: form.specialties.split(',').map((x) => x.trim()).filter(Boolean),
          total_icu_beds: Number(form.total_icu_beds),
        });
      } else {
        auth = await hospitalLogin({ hospital_name: form.hospital_name, password: form.password });
      }
      localStorage.setItem('hospital_token', auth.access_token);
      onAuthenticated();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Building2 size={36} strokeWidth={1.5} />
        </div>
        <h1 className="auth-heading">Hospital Portal</h1>
        <p className="auth-sub">
          {mode === 'login' ? 'Sign in to manage your ICU' : 'Register your hospital'}
        </p>

        <div className="auth-tabs">
          <button
            className={`atab ${mode === 'login' ? 'atab-on' : ''}`}
            onClick={() => switchMode('login')}
          >
            Login
          </button>
          <button
            className={`atab ${mode === 'signup' ? 'atab-on' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="auth-err">
            <AlertTriangle size={15} strokeWidth={2} />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <div className="fld">
            <label className="fld-lbl">Hospital Name</label>
            <input
              className="fld-inp"
              placeholder="e.g. Apollo Hospital"
              value={form.hospital_name}
              onChange={(e) => set('hospital_name', e.target.value)}
              required
            />
          </div>

          {mode === 'signup' && (
            <>
              <div className="frow2">
                <div className="fld">
                  <label className="fld-lbl">Email</label>
                  <input
                    className="fld-inp"
                    type="email"
                    placeholder="admin@hospital.com"
                    value={form.hospital_email}
                    onChange={(e) => set('hospital_email', e.target.value)}
                    required
                  />
                </div>
                <div className="fld">
                  <label className="fld-lbl">Contact Number</label>
                  <input
                    className="fld-inp"
                    placeholder="+91 9876543210"
                    value={form.contact_number}
                    onChange={(e) => set('contact_number', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="fld">
                <label className="fld-lbl">Hospital Address</label>
                <input
                  className="fld-inp"
                  placeholder="Full address"
                  value={form.hospital_address}
                  onChange={(e) => set('hospital_address', e.target.value)}
                  required
                />
              </div>

              <div className="fld">
                <label className="fld-lbl">
                  Specialties
                  <span className="fld-hint"> — comma-separated</span>
                </label>
                <input
                  className="fld-inp"
                  placeholder="Cardiology, Neurology, Trauma"
                  value={form.specialties}
                  onChange={(e) => set('specialties', e.target.value)}
                  required
                />
              </div>

              <div className="frow2">
                <div className="fld">
                  <label className="fld-lbl">Total ICU Beds</label>
                  <input
                    className="fld-inp"
                    type="number"
                    placeholder="50"
                    value={form.total_icu_beds}
                    onChange={(e) => set('total_icu_beds', e.target.value)}
                    required
                  />
                </div>
                <div className="fld">
                  <label className="fld-lbl">Location</label>
                  <div className="loc-row">
                    <input
                      className="fld-inp"
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={form.latitude}
                      onChange={(e) => set('latitude', e.target.value)}
                      required
                    />
                    <input
                      className="fld-inp"
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={form.longitude}
                      onChange={(e) => set('longitude', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="gps-btn"
                      onClick={detectLocation}
                      disabled={locating}
                      title="Use current location"
                    >
                      {locating
                        ? <Loader2 size={16} className="spin-icon" />
                        : <Navigation size={16} strokeWidth={2} />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="fld">
            <label className="fld-lbl">Password</label>
            <input
              className="fld-inp"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              required
            />
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? <Loader2 size={18} className="spin-icon" />
              : (mode === 'signup' ? 'Create Account' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [viewMode, setViewMode] = useState('public');
  const [authenticated, setAuthenticated] = useState(
    Boolean(localStorage.getItem('hospital_token')),
  );
  const [hospitalName, setHospitalName] = useState('');

  const logout = () => {
    localStorage.removeItem('hospital_token');
    setAuthenticated(false);
    setHospitalName('');
    setViewMode('public');
  };

  const handleAuthenticated = async () => {
    setAuthenticated(true);
    setViewMode('hospital');
    try {
      const me = await getHospitalMe();
      setHospitalName(me.hospital_name);
    } catch {
      // non-critical
    }
  };

  return (
    <div className="app">
      <Navbar
        hospitalName={hospitalName}
        onLogout={authenticated && viewMode === 'hospital' ? logout : null}
        onToggleView={setViewMode}
        viewMode={viewMode}
      />
      <main className="app-main">
        {viewMode === 'public'
          ? <PublicView />
          : authenticated
            ? <HospitalDashboard />
            : <AuthView onAuthenticated={handleAuthenticated} />}
      </main>
    </div>
  );
}
