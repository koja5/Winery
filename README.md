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

Fazni plan razvoja (Faza 0–5, 45 taskova) vodi se odvojeno; **Faza 3 — Vinograd završena** (T3.1–T3.9): parcele, utrošak sredstava, radni nalozi, analize zemljišta/loze, GIS mapa (Leaflet+OSM), NDVI vizualizacija (Copernicus Sentinel Hub, besplatan tier), geografski izveštaji (choropleth po parceli). Sledeća faza: **Faza 4 — IoT i hardver**.
