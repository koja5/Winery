# eVinarija

Sistem za upravljanje vinarijama (podrum, berba, vinograd, IoT, enterprise integracije).
Nezavisna instanca — arhitekturni obrasci su preneti iz eDestilerije kao referenca, kod nije deljen.

## Struktura

- `client/` — Angular 19 + Ionic/Capacitor + PrimeNG + Tailwind
- `server/` — Node/Express + MySQL (mysql2)

## Pokretanje

```bash
# server
cd server
cp .env.example .env   # popuniti DB/JWT/mail podatke
npm install
npm run dev             # http://localhost:3001

# client
cd client
npm install
npm run client           # http://localhost:4201, proxy na /api -> server
```

## Backlog

Fazni plan razvoja (Faza 0–5, 45 taskova) vodi se odvojeno; trenutna faza: **Faza 0 — Temelj**.
