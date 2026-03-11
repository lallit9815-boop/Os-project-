# File Allocation Methods Simulation in Operating System

A modern full-stack educational web app with an iOS-inspired UI to simulate file allocation methods:
- Contiguous Allocation
- Linked Allocation
- Indexed Allocation

## Features
- Glassmorphism UI, gradients, rounded cards/buttons, smooth animations
- Responsive design (desktop + mobile)
- Interactive memory block visualization with animated allocation
- Step-by-step simulation and progress bar
- Input validation + error handling
- Simulation log API backed by MongoDB

## Tech Stack
- Frontend: React (CDN, JSX via Babel), HTML, CSS
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)

## Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
3. Start app:
   ```bash
   npm run dev
   ```
4. Open:
   ```
   http://localhost:3000
   ```

## API Endpoints
- `POST /api/simulations` -> save simulation log
- `GET /api/simulations` -> get latest 20 simulation logs

## Notes
- If MongoDB is unavailable, the app still runs; only DB persistence may fail.
