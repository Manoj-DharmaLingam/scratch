import React from 'react';
import { Navigation, Bed, Clock } from 'lucide-react';

export default function RecommendationBanner({ hospital }) {
  if (!hospital) return null;

  return (
    <div className="rec-banner">
      <div className="rec-banner__icon">
        <Navigation size={20} />
      </div>
      <div className="rec-banner__info">
        <div className="rec-banner__label">Nearest Available Hospital</div>
        <div className="rec-banner__name">{hospital.hospital_name}</div>
        <div className="rec-banner__meta">
          <Clock size={11} />
          {Math.round(hospital.eta_minutes)} mins
          <span className="meta-sep">·</span>
          <Bed size={11} />
          {hospital.available_icu_beds} ICU bed{hospital.available_icu_beds !== 1 ? 's' : ''}
          <span className="meta-sep">·</span>
          {hospital.distance_km} km
        </div>
      </div>
    </div>
  );
}
