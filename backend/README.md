# Emergency ICU Unified Backend

## Run

1. Create PostgreSQL database (example: `emergency_icu`).
2. Copy `.env.example` to `.env` and update credentials.
3. Install dependencies:
   `pip install -r requirements.txt`
4. Start server:
   `uvicorn main:app --reload --port 8000`

## Key Endpoints

- `POST /auth/hospital/signup`
- `POST /auth/hospital/login`
- `POST /auth/ambulance/signup`
- `POST /auth/ambulance/login`
- `GET /public/hospitals`
- `POST /hospital/update-icu`
- `GET /hospital/alerts`
- `POST /ambulance/request`
- `GET /ambulance/recommend-hospital`
- `POST /alerts`
