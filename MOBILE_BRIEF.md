# TMGO Mobile App — Brief for Gemini / Antigravity

## What is TMGO?

TMGO is a **B2B logistics marketplace** for Turkmenistan and Central Asia. It connects **clients** (cargo owners / dispatchers) with **drivers** (truck carriers). Think of it as a stripped-down freight exchange: clients post cargo orders, drivers find and accept them, then communicate through a built-in chat while the cargo is in transit.

Production backend: **`https://tmgo.bridgecore.tech/api`**  
WebSocket base: **`wss://tmgo.bridgecore.tech/api`**

---

## Goal of This Task

The existing frontend is Nuxt 3 (desktop-first, Naive UI). A Capacitor shell already wraps it (`capacitor.config.ts`, `android/` folder present). **The task is to rebuild the mobile cabinet screens as a proper mobile-first app** — the same features, but with a clean native-feeling UI designed for a 375–430px screen. No admin panel needed for mobile.

---

## Tech Stack to Use

| Layer | Choice |
|---|---|
| Framework | **Vue 3 + Vite** (or keep Nuxt 3 SPA mode — your choice) |
| Mobile shell | **Capacitor 8** (already installed: `@capacitor/core`, `@capacitor/android`) |
| UI kit | **Ionic Vue** or **Quasar** — both have Capacitor-native components (bottom nav, safe area, swipe) |
| State | **Pinia** |
| HTTP | `fetch` / `$fetch` with `credentials: 'include'` (session cookies) |
| Maps | **Leaflet** + `vue-leaflet` for order creation map |
| i18n | `vue-i18n` — 3 locales: `ru` (default), `en`, `tk` |
| Geo autocomplete | REST calls to **Nominatim** (OpenStreetMap) — no API key needed |
| WebSocket | Native browser `WebSocket` |

---

## Authentication

Auth is **session-cookie based** (no JWT). Every request must include `credentials: 'include'`.

### Endpoints

```
POST /auth/sign-in          { email, password }  → { user }
POST /auth/sign-up          { name, email, password, role: 'client'|'carrier' }
POST /auth/verify-email-code { code }             → marks email verified
POST /auth/resend-verification                    → resend OTP code
POST /auth/forgot-password  { email }
POST /auth/reset-password   { email, code, password }
POST /auth/sign-out
GET  /auth/get-session                            → { user: AuthUser | null }
```

### AuthUser shape

```ts
interface AuthUser {
  id: string
  name: string
  email: string
  image?: string        // avatar filename — see Avatar section
  phone?: string
  role: 'client' | 'carrier' | 'dispatcher' | 'admin'
  emailVerified: boolean
  createdAt: string
}
```

### Auth flow in the app

1. Guest → `/auth` (single page: login / register / OTP / forgot)
2. After login check `user.role`:
   - `carrier` → **Driver cabinet**
   - `client` → **Client cabinet**
3. New users must verify email first — show OTP input after register
4. If `user.emailVerified === false` on session restore → redirect to OTP screen

---

## Avatar / Profile Images

Avatar filenames are stored in `user.image`. Build the URL as:

```
https://tmgo.bridgecore.tech/api/auth/avatars/<filename>
```

Upload avatar:
```
POST /auth/upload-avatar   multipart/form-data { avatar: File }
```

---

## Role: Driver (carrier)

Driver has a profile card with documents that must be verified by admin before they can accept orders.

### Driver Profile & Documents

```
GET  /cabinet/driver/profile
PUT  /cabinet/driver/profile   { name, phone, ... }

GET  /cabinet/driver/my-card
POST /cabinet/driver/documents/upload   multipart { docType, file }
GET  /cabinet/driver/documents
```

Document types: `passport`, `driver_license`, `vehicle_front`, `vehicle_back`, `selfie`  
Document statuses: `not_submitted` → `draft` → `submitted` → `verified` / `rejected`

### Driver Card change requests

Driver cannot directly edit verified card fields — they submit a change request:

```
POST /cabinet/driver/change-requests   { field, newValue }
GET  /cabinet/driver/change-requests
```

### Driver Vehicles & Trailers

```
GET  /cabinet/driver/vehicles
POST /cabinet/driver/vehicles
GET  /cabinet/driver/vehicles/:id
PUT  /cabinet/driver/vehicles/:id
DELETE /cabinet/driver/vehicles/:id

GET  /cabinet/driver/vehicles/trailers
POST /cabinet/driver/vehicles/trailers
```

### Driver Location (GPS tracking)

Driver sends their GPS position while "online":

```
POST /cabinet/driver/location   { lat: number, lng: number }
```

Call this every 30 seconds via `navigator.geolocation.watchPosition` when driver is online.  
Use `@capacitor/geolocation` for background access on Android.

### Driver Orders

```
GET  /cabinet/driver/orders                     → my accepted orders
GET  /cabinet/driver/orders/:id                 → order detail
GET  /cabinet/driver/orders-near?radius=50      → orders near my location (PostGIS)
POST /cabinet/driver/orders/:id/respond         { price, comment }
PUT  /cabinet/driver/orders/:id/status          { status: 'loading'|'in_transit'|'unloading'|'completed' }
GET  /cabinet/driver/orders/:id/status-log
```

Order status flow for driver:  
`published` → driver responds → client confirms → `in_progress`  
Then driver changes: `in_progress` → `loading` → `in_transit` → `unloading` → `completed`

### Driver Services

Drivers can offer one-time transport services (not order-based):

```
GET  /cabinet/driver/services
POST /cabinet/driver/services   { title, description, price, ... }
GET  /cabinet/driver/services/:id
PUT  /cabinet/driver/services/:id
DELETE /cabinet/driver/services/:id
```

### Driver Reviews

```
GET  /cabinet/driver/reviews    → reviews received
```

---

## Role: Client (customer)

### Client Profile

```
GET  /cabinet/client/profile
PUT  /cabinet/client/profile   { name, phone, companyName, ... }
```

### Client Orders (cargo orders)

```
GET  /cabinet/client/orders               → my orders list
POST /cabinet/client/orders               → create order
GET  /cabinet/client/orders/:id
PUT  /cabinet/client/orders/:id           → edit (only draft)
PATCH /cabinet/client/orders/:id/cancel
GET  /cabinet/client/orders/:id/responses → responses from drivers
POST /cabinet/client/orders/:id/confirm   { responseId } → pick a driver
```

#### Order creation fields

```ts
{
  fromCity: string
  toCity: string
  fromAddress: string
  toAddress: string
  fromLat: number, fromLng: number   // geocoded via Nominatim
  toLat: number, toLng: number
  loadingDate: string                 // ISO date
  unloadingDate?: string
  cargoWeight: number                 // kg
  cargoVolume?: number                // m³
  bodyType: 'tent'|'refrigerator'|'isothermal'|'open'|'tanker'|'container'|'car_carrier'
  price: number
  priceType: 'fix'|'auction'
  comment?: string
  isDangerous?: boolean
  temperature?: number
}
```

### Client Services

Clients can view and book driver services:

```
GET  /cabinet/client/services
GET  /cabinet/client/services/:id
POST /cabinet/client/services/:id/book
```

### Client Reviews

```
GET  /cabinet/client/reviews    → reviews received
```

---

## Public Endpoints (both roles)

### Orders board

```
GET /orders?page=1&limit=20&fromCity=...&toCity=...&bodyType=...&priceMin=...&priceMax=...
GET /orders/:id
```

### Reviews

```
POST /orders/:id/review   { rating: 1-5, comment: string }
GET  /users/:id/reviews
```

### Contacts

```
POST /contacts   { name, email, message }
```

---

## Chat (WebSocket + REST)

Chat is tied to an order. It's created automatically when a client confirms a driver.

### REST

```
GET  /cabinet/chat/list              → list of my chats with unread counts
GET  /cabinet/chat/:orderId/:carrierId/messages?before=<msgId>&limit=30
POST /cabinet/chat/mark-read/:orderId/:carrierId
POST /cabinet/chat/upload            multipart { file } → { url }
```

### WebSocket

Connect to:
```
wss://tmgo.bridgecore.tech/api/ws/chat?orderId=<id>&carrierId=<userId>
```

Cookies are sent automatically (session auth).

#### Message format (send)

```json
{ "type": "message", "content": "text" }
{ "type": "image", "url": "https://..." }
```

#### Message format (receive)

```json
{
  "type": "message",
  "id": "uuid",
  "senderId": "uuid",
  "senderName": "Batyr",
  "senderAvatar": "filename.jpg",
  "content": "text",
  "fileUrl": null,
  "createdAt": "2026-05-21T10:00:00Z",
  "isOwn": true
}
```

Quick reply templates (send as regular messages):
- "Еду" / "On my way"
- "На месте" / "I'm here"
- "Задерживаюсь" / "Running late"

---

## Nominatim Geocoding (no API key)

```
GET https://nominatim.openstreetmap.org/search?q=<query>&format=json&limit=5&accept-language=ru
→ [{ display_name, lat, lon, ... }]

GET https://nominatim.openstreetmap.org/reverse?lat=<lat>&lon=<lon>&format=json
→ { display_name, address }
```

Set `User-Agent: TMGO Mobile App` header on all Nominatim requests.

---

## Screens to Build

### Auth screens
- `AuthScreen` — tabs: Login / Register / OTP / Forgot Password

### Driver screens
| Screen | Route |
|---|---|
| My Orders | `/driver/orders` |
| Available Orders (near me) | `/driver/orders/available` |
| Order Detail | `/driver/orders/:id` |
| Chat | Opens as bottom sheet or push |
| My Card | `/driver/card` |
| Upload Documents | `/driver/card/documents` |
| Vehicles | `/driver/vehicles` |
| Add/Edit Vehicle | `/driver/vehicles/form` |
| Profile | `/driver/profile` |
| Services | `/driver/services` |
| Reviews | `/driver/reviews` |

### Client screens
| Screen | Route |
|---|---|
| My Orders | `/client/orders` |
| Create Order | `/client/orders/create` |
| Order Detail | `/client/orders/:id` |
| Responses (pick driver) | `/client/orders/:id/responses` |
| Chat | Opens as bottom sheet or push |
| Profile | `/client/profile` |
| Services | `/client/services` |
| Reviews | `/client/reviews` |

---

## Mobile UX Guidelines

- **Bottom tab bar** with 4 tabs: Orders / Available (driver only) / Chat / Profile
- **Safe area** insets — use Capacitor's `SafeArea` or CSS `env(safe-area-inset-*)` 
- Chat opens as a **full-screen push** or **bottom sheet**, not a tab
- Order status changes use a **stepper component** (loading → in transit → unloading → done)
- GPS "I'm online" toggle in driver profile — prominent switch
- Pull-to-refresh on all list screens
- Order cards show: route cities, cargo weight, price, loading date, body type badge
- Minimum tap target: **48×48px**

---

## Capacitor Setup (already done in repo)

```ts
// capacitor.config.ts
{
  appId: 'com.tmgo.app',
  appName: 'TMGO',
  webDir: '.output/public',   // or 'dist' if using plain Vite
  server: { androidScheme: 'https' }
}
```

Plugins to add:
```bash
npm install @capacitor/geolocation @capacitor/camera @capacitor/status-bar @capacitor/splash-screen
npx cap sync android
```

---

## Environment

```env
VITE_API_BASE=https://tmgo.bridgecore.tech/api
VITE_WS_URL=wss://tmgo.bridgecore.tech/api
```

All fetch calls: `credentials: 'include'` — session auth via cookies.

---

## What NOT to build

- Admin panel (separate web-only app)
- Dispatcher role (backend exists but no mobile UI needed now)
- Payment / invoicing (not implemented yet)
- Push notifications (not implemented yet — skip or stub)
