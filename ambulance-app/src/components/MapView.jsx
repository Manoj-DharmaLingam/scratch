import React, { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Warm / natural map styles — matches the organic cream palette
const DARK_MAP_STYLES = [
  { elementType: 'geometry',             stylers: [{ color: '#f5ede3' }] },
  { elementType: 'labels.text.stroke',   stylers: [{ color: '#f9f4ef' }] },
  { elementType: 'labels.text.fill',     stylers: [{ color: '#7a6a60' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#4a3a30' }] },
  { featureType: 'poi',                  elementType: 'labels.text.fill',     stylers: [{ color: '#8a7a70' }] },
  { featureType: 'poi.park',             elementType: 'geometry',              stylers: [{ color: '#d4e6c3' }] },
  { featureType: 'poi.park',             elementType: 'labels.text.fill',      stylers: [{ color: '#6a8a5a' }] },
  { featureType: 'road',                 elementType: 'geometry',              stylers: [{ color: '#ffffff' }] },
  { featureType: 'road',                 elementType: 'geometry.stroke',       stylers: [{ color: '#e8d8c8' }] },
  { featureType: 'road',                 elementType: 'labels.text.fill',      stylers: [{ color: '#7a6a60' }] },
  { featureType: 'road.highway',         elementType: 'geometry',              stylers: [{ color: '#f0d8b8' }] },
  { featureType: 'road.highway',         elementType: 'geometry.stroke',       stylers: [{ color: '#e0c8a0' }] },
  { featureType: 'road.highway',         elementType: 'labels.text.fill',      stylers: [{ color: '#5a4a38' }] },
  { featureType: 'transit',              elementType: 'geometry',              stylers: [{ color: '#ede4d8' }] },
  { featureType: 'transit.station',      elementType: 'labels.text.fill',      stylers: [{ color: '#7a6a60' }] },
  { featureType: 'water',                elementType: 'geometry',              stylers: [{ color: '#b8d4e8' }] },
  { featureType: 'water',                elementType: 'labels.text.fill',      stylers: [{ color: '#5a7a9a' }] },
];

// SVG marker creation
function makeAmbulanceMarker(maps) {
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    fillColor: '#6b5b95',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 1.6,
    anchor: new maps.Point(12, 22),
  };
}

function makeHospitalMarker(maps) {
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    fillColor: '#ff3b3b',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.5,
    scale: 1.4,
    anchor: new maps.Point(12, 22),
  };
}

export default function MapView({ ambulanceLat, ambulanceLng, hospitals, selectedHospital }) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const routeRendererRef = useRef(null);
  const isMapsConfigured = Boolean(MAPS_API_KEY && MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE');
  const configError = isMapsConfigured
    ? null
    : 'Google Maps API key not configured. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.';
  const [mapError, setMapError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(() => Boolean(window.google && window.google.maps));

  // Load Google Maps script once
  useEffect(() => {
    if (!isMapsConfigured) {
      return;
    }
    if (window.google && window.google.maps) {
      return;
    }

    const existing = document.getElementById('gmaps-script');
    if (existing) { existing.onload = () => setMapLoaded(true); return; }

    const script = document.createElement('script');
    script.id = 'gmaps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=directions`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setMapError('Failed to load Google Maps. Check your API key and network.');
    document.head.appendChild(script);
  }, [isMapsConfigured]);

  // Initialise or update map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const maps = window.google.maps;
    const center = ambulanceLat && ambulanceLng
      ? { lat: ambulanceLat, lng: ambulanceLng }
      : { lat: 13.0827, lng: 80.2707 }; // Default: Chennai

    if (!googleMapRef.current) {
      googleMapRef.current = new maps.Map(mapRef.current, {
        center,
        zoom: 13,
        styles: DARK_MAP_STYLES,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    } else if (ambulanceLat && ambulanceLng) {
      googleMapRef.current.setCenter(center);
    }
  }, [mapLoaded, ambulanceLat, ambulanceLng]);

  // Update markers
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;
    const maps = window.google.maps;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Ambulance marker
    if (ambulanceLat && ambulanceLng) {
      const amb = new maps.Marker({
        position: { lat: ambulanceLat, lng: ambulanceLng },
        map: googleMapRef.current,
        title: 'Your Ambulance',
        icon: makeAmbulanceMarker(maps),
        zIndex: 10,
      });
      markersRef.current.push(amb);
    }

    // Hospital markers
    (hospitals || []).forEach((h, i) => {
      const marker = new maps.Marker({
        position: { lat: h.latitude, lng: h.longitude },
        map: googleMapRef.current,
        title: h.hospital_name,
        icon: makeHospitalMarker(maps),
        zIndex: i === 0 ? 9 : 8,
      });
      const infoWindow = new maps.InfoWindow({
        content: `
          <div style="background:#1a1a1a;color:#fff;padding:10px;border-radius:8px;font-family:Inter,sans-serif;min-width:180px;">
            <strong style="color:#00d4ff;">${h.hospital_name}</strong><br/>
            <span style="font-size:12px;color:#aaa;">🕐 ${Math.round(h.eta_minutes)} mins · 📍 ${h.distance_km} km</span><br/>
            <span style="font-size:12px;color:#aaa;">🛏 ${h.available_icu_beds} ICU beds</span>
          </div>
        `,
      });
      marker.addListener('click', () => infoWindow.open(googleMapRef.current, marker));
      markersRef.current.push(marker);
    });
  }, [mapLoaded, ambulanceLat, ambulanceLng, hospitals]);

  // Draw route to selected hospital
  useEffect(() => {
    if (!mapLoaded || !googleMapRef.current) return;
    const maps = window.google.maps;

    if (!selectedHospital || !ambulanceLat || !ambulanceLng) {
      if (routeRendererRef.current) {
        routeRendererRef.current.setMap(null);
        routeRendererRef.current = null;
      }
      return;
    }

    if (!routeRendererRef.current) {
      routeRendererRef.current = new maps.DirectionsRenderer({
        polylineOptions: { strokeColor: '#6b5b95', strokeWeight: 4, strokeOpacity: 0.85 },
        suppressMarkers: true,
      });
      routeRendererRef.current.setMap(googleMapRef.current);
    }

    const service = new maps.DirectionsService();
    service.route(
      {
        origin: { lat: ambulanceLat, lng: ambulanceLng },
        destination: { lat: selectedHospital.latitude, lng: selectedHospital.longitude },
        travelMode: maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') routeRendererRef.current.setDirections(result);
      }
    );
  }, [mapLoaded, selectedHospital, ambulanceLat, ambulanceLng]);

  return (
    <div className="map-container" id="map-view">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {(configError || mapError) && (
        <div className="map-overlay">
          <AlertCircle size={32} color="var(--danger)" />
          <span style={{ maxWidth: 340, textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-mid)' }}>{configError || mapError}</span>
        </div>
      )}
      {!mapLoaded && !configError && !mapError && (
        <div className="map-overlay">
          <MapPin size={28} color="var(--purple-accent)" />
          <span className="spinner" />
          <span style={{ color: 'var(--text-mid)' }}>Loading map…</span>
        </div>
      )}
    </div>
  );
}
