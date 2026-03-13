# 🚑 Ambulance Emergency Routing System

A **production-ready** ambulance-side emergency dashboard built with **React (Vite)**, **Pure CSS3**, and **Google Maps JavaScript API**.

---

## Features

| Feature | Details |
|---|---|
| 📍 **GPS Location** | Auto-detects ambulance location via browser Geolocation API |
| 📝 **Patient Form** | Blood group, SpO₂, condition notes, severity level with validation |
| 🏥 **Hospital Finder** | Ranked hospitals with ICU availability and specialty match |
| 🗺️ **Route Map** | Google Maps with dark theme, ambulance/hospital markers, driving route |
| 🔄 **Live Polling** | Hospital list refreshes every 5 seconds without page reload |
| 🔔 **Alerts** | Sends pre-arrival alert to selected hospital |
| 🌙 **Demo Mode** | Works fully with mock data when no backend is connected |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env` and fill in your values:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
```

> **Get a Google Maps API Key**: [console.cloud.google.com](https://console.cloud.google.com)  
> Enable: **Maps JavaScript API** and **Directions API**.

### 3. Run dev server

```bash
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

---

## Backend API Contract

The app connects to a **FastAPI + PostgreSQL** backend at `VITE_API_BASE_URL`.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/ambulance/request` | Register ambulance location + patient details |
| `GET` | `/ambulance/recommend-hospital` | Fetch ranked hospital list |
| `POST` | `/alerts` | Send pre-arrival alert to selected hospital |

If the backend is unreachable the app seamlessly falls back to **demo/mock data**.

---

## Hospital Scoring Model

| Severity | ETA Weight | ICU Weight | Specialty Weight |
|---|---|---|---|
| Critical | 0.55 | 0.35 | 0.10 |
| Serious   | 0.45 | 0.35 | 0.20 |
| Moderate  | 0.30 | 0.40 | 0.30 |

---

## Project Structure

```
src/
├── components/
│   ├── HospitalCard.jsx        # Individual hospital card with stats & badge
│   ├── HospitalList.jsx        # Polling list of hospital cards
│   ├── PatientForm.jsx         # Emergency patient input form
│   ├── MapView.jsx             # Google Maps with route rendering
│   └── RecommendationBanner.jsx# Top recommended hospital banner
├── pages/
│   └── Dashboard.jsx           # Main page layout
├── services/
│   └── api.js                  # All backend API calls + mock fallback
├── hooks/
│   └── useLocation.js          # Browser geolocation hook
└── styles/
    ├── main.css                # CSS variables & global reset
    ├── dashboard.css           # Layout styles
    └── components.css          # Component-level styles
```

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`.
