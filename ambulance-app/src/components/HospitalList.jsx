import React, { useEffect, useRef, useState } from 'react';
import { fetchRecommendedHospitals } from '../services/api';
import HospitalCard from './HospitalCard';
import { RefreshCw, Building2 } from 'lucide-react';

const POLL_INTERVAL = 5000;

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

export default function HospitalList({ lat, lng, severity, requiredSpecialty, onSelect, selectedHospital, onHospitalsLoaded }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);

  const load = async () => {
    if (!lat || !lng) return;
    try {
      const data = await fetchRecommendedHospitals(lat, lng, severity, requiredSpecialty);
      const sorted = [...data].sort((a, b) => b.score - a.score);
      setHospitals(sorted);
      setLastRefresh(new Date());
      if (onHospitalsLoaded) onHospitalsLoaded(sorted);
    } catch { /* errors handled in api.js */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line

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
        <span className="hospital-list__refresh">
          <RefreshCw size={10} /> {refreshLabel}
        </span>
      </div>

      <div className="hospital-list__scroll">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
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
