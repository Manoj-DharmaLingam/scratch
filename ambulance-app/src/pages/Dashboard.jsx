import React, { useState, useCallback } from 'react';
import { useLocation } from '../hooks/useLocation';
import { postAmbulanceRequest, postAlert } from '../services/api';
import PatientForm from '../components/PatientForm';
import HospitalList from '../components/HospitalList';
import RecommendationBanner from '../components/RecommendationBanner';
import MapView from '../components/MapView';
import {
  Ambulance,
  MapPin,
  RefreshCw,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Info,
  HeartPulse,
} from 'lucide-react';

/* ─── Toast component ─────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' && <CheckCircle2 size={15} />}
          {t.type === 'error'   && <AlertCircle  size={15} />}
          {t.type === 'info'    && <Info          size={15} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

let toastId = 0;

export default function Dashboard({ onLogout }) {
  const { lat, lng, error: locError, loading: locLoading, refetch } = useLocation();
  const [patientData, setPatientData]       = useState(null);
  const [formLoading, setFormLoading]       = useState(false);
  const [showHospitals, setShowHospitals]   = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [topHospital, setTopHospital]       = useState(null);
  const [toasts, setToasts]                 = useState([]);
  const [alertSent, setAlertSent]           = useState(false);
  const [ambulanceReqId, setAmbulanceReqId] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    setPatientData(formData);
    setSelectedHospital(null);
    setAlertSent(false);
    setAmbulanceReqId(null);
    try {
      const res = await postAmbulanceRequest({ latitude: lat, longitude: lng, ...formData });
      if (res?.id) setAmbulanceReqId(res.id);
      showToast('Ambulance request registered. Finding hospitals…', 'info');
    } catch {
      showToast('Demo mode — showing nearby hospitals.', 'info');
    } finally {
      setFormLoading(false);
      setShowHospitals(true);
    }
  };

  const handleSelectHospital = async (hospital) => {
    if (alertSent && selectedHospital?.hospital_id === hospital.hospital_id) return;
    setSelectedHospital(hospital);
    try {
      await postAlert({
        hospital_id: hospital.hospital_id,
        ambulance_request_id: ambulanceReqId,
        eta: hospital.eta_minutes || 0,
      });
      showToast(`Alert sent to ${hospital.hospital_name}`, 'success', 5000);
      setAlertSent(true);
    } catch {
      showToast('Alert registered (demo mode).', 'info');
      setAlertSent(true);
    }
  };

  const locationReady = !!lat && !!lng;

  return (
    <div className="dashboard">

      {/* Announcement bar */}
      <div className="announcement-bar">
        Emergency Routing System &nbsp;&middot;&nbsp; Real-Time ICU Bed Availability &nbsp;&middot;&nbsp; Active 24/7
      </div>

      {/* Header */}
      <header className="header">
        <div className="header__brand">
          <div className="header__logo-icon">
            <Ambulance size={21} color="#fff" />
          </div>
          <div>
            <div className="header__title">Emergency Routing</div>
            <div className="header__subtitle">Ambulance · ICU Finder</div>
          </div>
        </div>

        {/* GPS status pill */}
        <div className="header__status">
          {locLoading && (
            <><span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} /> Locating…</>
          )}
          {!locLoading && locationReady && (
            <><span className="status-dot" /> GPS Active</>
          )}
          {!locLoading && locError && (
            <><span className="status-dot danger" /> Location Error</>
          )}
        </div>
        <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
      </header>

      {/* Hero strip */}
      <div className="hero-strip">
        <div className="hero-strip__content">
          <span className="hero-strip__badge">Emergency Mode</span>
          <h1 className="hero-strip__heading">Find the Nearest ICU Hospital</h1>
          <p className="hero-strip__sub">Real-time scoring by ETA · ICU availability · Specialty match</p>
        </div>
      </div>

      {/* Body */}
      <main className="dashboard__body">

        {/* LEFT — location + form */}
        <section className="left-panel">

          {/* Location card */}
          <div className="card location-card">
            <div className="location-icon">
              <MapPin size={18} />
            </div>
            <div className="location-info">
              <div className="location-label">Ambulance Location</div>
              {locLoading && (
                <div className="location-coords">
                  <span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> Detecting…
                </div>
              )}
              {!locLoading && locationReady && (
                <div className="location-coords">{lat.toFixed(6)}°N, {lng.toFixed(6)}°E</div>
              )}
              {!locLoading && locError && (
                <div className="location-error">{locError}</div>
              )}
            </div>
            {!locLoading && locError && (
              <button className="btn-ghost btn" style={{ width: 'auto', fontSize: '0.75rem' }} onClick={refetch}>
                <RefreshCw size={12} /> Retry
              </button>
            )}
          </div>

          {/* Backend offline notice */}
          {!locLoading && !locError && !locationReady && (
            <div className="error-banner">
              <WifiOff size={14} /> Location unavailable — please allow location access.
            </div>
          )}

          {/* Patient form */}
          <div className="card">
            <PatientForm
              onSubmit={handleFormSubmit}
              loading={formLoading}
              locationReady={locationReady}
            />
          </div>
        </section>

        {/* RIGHT — hospitals */}
        <section className="right-panel">
          {showHospitals ? (
            <>
              <RecommendationBanner hospital={topHospital} />
              <div className="card" style={{ padding: '1.25rem' }}>
                <HospitalList
                  lat={lat}
                  lng={lng}
                  severity={patientData?.severity_level || 'Serious'}
                  requiredSpecialty={patientData?.required_specialty || ''}
                  onSelect={handleSelectHospital}
                  selectedHospital={selectedHospital}
                  onHospitalsLoaded={sorted => setTopHospital(sorted[0] || null)}
                />
              </div>
            </>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state__icon">
                  <HeartPulse size={28} color="var(--text-muted)" />
                </div>
                <span className="empty-state__title">Ready to Find Hospitals</span>
                <span className="empty-state__desc">
                  Fill in the patient details on the left and press <strong>Find Best Hospital</strong> to get real-time ICU recommendations ranked by ETA, availability, and specialty.
                </span>
                <div className="deco-line" />
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Map */}
      <section className="map-section">
        <div className="map-section__label">
          <MapPin size={13} color="var(--purple-accent)" />
          Route to Hospital
        </div>
        <MapView
          ambulanceLat={lat}
          ambulanceLng={lng}
          hospitals={showHospitals && topHospital ? [topHospital] : []}
          selectedHospital={selectedHospital}
        />
      </section>

      <Toast toasts={toasts} />
    </div>
  );
}
