import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRecommendedHospitals } from '../services/api';
import HospitalCard from './HospitalCard';
import { RefreshCw, Building2 } from 'lucide-react';

function SkeletonCard() {
  return (
    <div className="card skeleton-card" style={{ padding: '1.1rem 1.25rem' }}>
      <div className="skeleton skeleton-line" style={{ height: 20, width: '65%', marginBottom: 14 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div className="skeleton skeleton-line" style={{ height: 14 }} />
        <div className="skeleton skeleton-line" style={{ height: 14 }} />
        <div className="skeleton skeleton-line" style={{ height: 14 }} />
        <div className="skeleton skeleton-line" style={{ height: 14 }} />
      </div>
      <div className="skeleton skeleton-line" style={{ height: 5, marginBottom: 12 }} />
      <div className="skeleton skeleton-line" style={{ height: 40, borderRadius: 999 }} />
    </div>
  );
}

const POLL_MS = 5000;

export default function HospitalList({ lat, lng, severity, requiredSpecialty, onSelect, selectedHospital, onHospitalsLoaded }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const onHospitalsLoadedRef = useRef(onHospitalsLoaded);
  useEffect(() => { onHospitalsLoadedRef.current = onHospitalsLoaded; }, [onHospitalsLoaded]);

  const load = useCallback(async (silent = false) => {
    if (!lat || !lng) return;
    if (!silent) setLoading(true);
    try {
      const data = await fetchRecommendedHospitals(lat, lng, severity, requiredSpecialty);
      setHospitals(data);
      setError('');
      setLastRefresh(new Date());
      if (onHospitalsLoadedRef.current) onHospitalsLoadedRef.current(data);
    } catch (err) {
      if (!silent) {
        setHospitals([]);
        setError(err.message || 'Unable to load hospital recommendations.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [lat, lng, severity, requiredSpecialty]);

  useEffect(() => {
    load(false);
    const timer = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const refreshLabel = lastRefresh
    ? `Updated ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    : 'Loading…';

  return (
    <div>
      <div className="hospital-list__header">
        <span className="hospital-list__title">
          <Building2 size={16} color="var(--purple-accent)" />
          Nearby Hospitals
        </span>
        <button className="btn btn-ghost" type="button" onClick={() => load(false)} style={{ width: 'auto', fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}>
          <RefreshCw size={12} /> {refreshLabel}
        </button>
      </div>

      <div className="hospital-list__scroll">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state__icon"><Building2 size={26} color="var(--text-muted)" /></div>
            <span className="empty-state__title">Recommendations unavailable</span>
            <span className="empty-state__desc">{error}</span>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><Building2 size={26} color="var(--text-muted)" /></div>
            <span className="empty-state__title">No hospitals found</span>
            <span className="empty-state__desc">No hospitals with available ICU beds were found near your location.</span>
          </div>
        ) : (
          hospitals.map((h, idx) => (
            <HospitalCard
              key={h.hospital_id}
              hospital={h}
              isRecommended={idx === 0}
              isSelected={selectedHospital?.hospital_id === h.hospital_id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
