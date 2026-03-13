import React from 'react';
import { Clock, Bed, MapPin, CheckCircle, XCircle } from 'lucide-react';

function icuClass(beds) {
  if (beds === 0) return 'icu-none';
  if (beds <= 2)  return 'icu-low';
  return 'icu-ok';
}

export default function HospitalCard({ hospital, isRecommended, isSelected, onSelect }) {
  const { hospital_name, distance_km, eta_minutes, available_icu_beds, specialty_match, score = 0 } = hospital;
  const scorePercent = Math.round(score * 100);

  const cardClass = [
    'hospital-card',
    isRecommended ? 'recommended' : '',
    isSelected    ? 'selected'    : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClass}
      onClick={() => onSelect(hospital)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(hospital)}
      id={`hospital-card-${hospital.hospital_id}`}
    >
      <div className="hospital-card__header">
        <span className="hospital-card__name">{hospital_name}</span>
        {isRecommended
          ? <span className="badge badge-recommended">Nearest</span>
          : <span className="badge badge-fallback">Option</span>
        }
      </div>

      <div className="hospital-card__stats">
        <div className="stat-item">
          <span className="stat-label"><MapPin size={10} /> Distance</span>
          <span className="stat-value highlight">{distance_km} km</span>
        </div>
        <div className="stat-item">
          <span className="stat-label"><Clock size={10} /> ETA</span>
          <span className="stat-value highlight">{Math.round(eta_minutes)} mins</span>
        </div>
        <div className="stat-item">
          <span className="stat-label"><Bed size={10} /> ICU Beds</span>
          <span className={`stat-value ${icuClass(available_icu_beds)}`}>
            {available_icu_beds === 0 ? 'None available' : `${available_icu_beds} available`}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Specialty</span>
          <span className={`specialty-match ${specialty_match ? 'matched' : 'unmatched'}`}>
            {specialty_match
              ? <><CheckCircle size={13} /> Matched</>
              : <><XCircle size={13} /> No match</>
            }
          </span>
        </div>
      </div>

      {/* Distance confidence bar */}
      <div className="score-bar">
        <div className="score-bar__fill" style={{ width: `${scorePercent}%` }} />
      </div>

      <button
        className={isSelected ? 'btn btn-outline' : 'btn btn-primary'}
        style={{ fontSize: '0.82rem', padding: '9px 16px' }}
        onClick={e => { e.stopPropagation(); onSelect(hospital); }}
        id={`select-hospital-${hospital.hospital_id}`}
      >
        {isSelected ? 'Hospital Selected' : 'Select This Hospital'}
      </button>
    </div>
  );
}
