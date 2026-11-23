# Elsewhere — Travel Booking Website (MERN Stack)

A full-stack travel website where users can browse destinations, search and filter journeys, save favourite places,
create an account, and send booking enquiries. An admin can manage all content from an admin panel.

**M**ongoDB · **E**xpress.js · **R**eact · **N**ode.js

---

## 1. Features

**For visitors / users**
- Browse destinations and journeys (data comes from MongoDB)
- Search destinations; filter journeys by category, price and duration; sort by rating, price or length
- Register / log in (passwords are hashed with bcrypt, sessions use JWT)
- Save favourite destinations (heart button) — stored in the user's account
- Book a journey: pick a date and travellers, the server calculates the total price
- "My trips" dashboard: saved places and bookings, with a cancel option
- Destination detail pages (`/destinations/bali`) with matching journeys
- "Plan your trip" popup, responsive layout, 404 page

**For the admin**
- Admin panel at `/admin` (only visible to users with the `admin` role)
- Add / edit / delete destinations and journeys
- View every booking made by all users

---

## 2. Tech stack

| Layer | Technology | Used for |
|---|---|---|
| Database | MongoDB + Mongoose | Stores users, destinations, packages, bookings |
| Backend | Node.js + Express 5 | REST API |
| Auth | JSON Web Tokens + bcryptjs | Login, protected routes, admin role |
| Frontend | React 19 + Vite | Single-page application |
| Routing | React Router | `/`, `/destinations/:slug`, `/admin` |
| Styling | Plain CSS (`styles.css`) + Tailwind for the popup components | Same design as before |
| Popups | Radix UI Dialog | Accessible modal windows |

---

## 3. Folder structure

```
elsewhere-mern/
├── package.json            ← root scripts (run client + server together)
├── server/                 ← BACKEND (Node + Express + MongoDB)
│   ├── server.js           ← starts the app, connects middleware and routes
│   ├── .env.example        ← copy to .env and edit
│   ├── config/db.js        ← MongoDB connection
│   ├── models/             ← database schemas: User, Destination, Package, Booking
│   ├── routes/             ← URL → controller mapping
│   ├── controllers/        ← the actual logic for each route
│   ├── middleware/         ← auth.js (JWT check, admin check), errorHandler.js
│   └── seed/               ← sample data + script that loads it
└── client/                 ← FRONTEND (React)
    ├── index.html
    ├── vite.config.js      ← dev server + proxy to the API
    ├── public/images/      ← destination photos
    └── src/
        ├── main.jsx        ← entry point
        ├── App.jsx         ← routes + global popups
        ├── api.js          ← every call to the backend goes through here
        ├── styles.css      ← all the styling
        ├── context/        ← AuthContext (logged-in user), ModalContext (popups)
        ├── pages/          ← Home, DestinationDetail, Admin, NotFound
        ├── components/     ← Header, Hero, cards, dialogs, footer ...
        │   ├── admin/      ← add/edit forms used by the admin panel
        │   └── ui/         ← Button, Input, Dialog
        └── utils/          ← price/date formatting, constants
```

---

## 4. How to run it

### Requirements
- **Node.js 18 or newer** — https://nodejs.org
- **MongoDB** — either
  - *Local:* install MongoDB Community Server and make sure it is running, **or**
  - *Cloud (free):* create a cluster on MongoDB Atlas and copy its connection string

### Steps

```bash
# 1. Install everything (root + server + client)
npm run install-all

# 2. Create the server's settings file
#    Windows (cmd):   copy server\.env.example server\.env
#    Mac / Linux:     cp server/.env.example server/.env
#    Then open server/.env and set JWT_SECRET (and MONGO_URI if you use Atlas)

# 3. Load the sample data (7 destinations, 6 journeys, 2 users)
npm run seed

# 4. Start the backend and the frontend together
npm run dev
```

Open **http://localhost:5173** in your browser. (The API runs on http://localhost:5000.)

### Demo accounts (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@elsewhere.com` | `Admin@123` |
| User | `demo@elsewhere.com` | `Demo@123` |

> `npm run seed` **deletes everything** in the database and starts fresh. Run it again any time to reset.

### Run as one server (production style)

```bash
npm run build     # builds the React app into client/dist
npm start         # Express serves the API *and* the built website on http://localhost:5000
```

---

## 5. How it works (the big picture)

```
 Browser (React)  ──fetch("/api/...")──►  Express server  ──Mongoose──►  MongoDB
  pages, forms,        JSON in / out        routes → controllers          collections:
  popups                                    + JWT middleware              users, destinations,
                                                                          packages, bookings
```

1. React pages call the API through `client/src/api.js` (using `fetch`).
2. In development, Vite forwards every `/api/...` request to Express (`vite.config.js` proxy), so there are no CORS problems.
3. Express matches the URL in `routes/`, runs the function in `controllers/`, which reads/writes MongoDB using the `models/`.
4. For protected routes, `middleware/auth.js` reads the `Authorization: Bearer <token>` header, verifies the JWT and loads the user.

### Login flow
1. User submits email + password → `POST /api/auth/login`
2. Server finds the user, compares the password with `bcrypt`, and returns a **JWT** plus the user info.
3. React saves the token in `localStorage` and keeps the user in `AuthContext`.
4. On every later request `api.js` adds the token to the headers. On page reload `AuthContext` calls `GET /api/auth/me` to restore the session.

### Database design

| Collection | Main fields | Relations |
|---|---|---|
| **users** | name, email, password (hashed), role (`user`/`admin`) | `savedPlaces` → array of destination ids |
| **destinations** | slug, name, country, region, tagline, description, image, days, from, highlights, category | — |
| **packages** | title, location, duration, price, rating, category, image, description | `destination` → destination id |
| **bookings** | bookingCode, title, location, travelDate, travelers, totalPrice, status | `user` → user id, `package` → package id |

---

## 6. REST API reference

| Method | URL | Access | What it does |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create account, returns token |
| POST | `/api/auth/login` | public | Log in, returns token |
| GET | `/api/auth/me` | logged in | Current user |
| GET | `/api/destinations` | public | All destinations |
| GET | `/api/destinations/:slug` | public | One destination |
| GET | `/api/destinations/:slug/packages` | public | Journeys of one destination |
| POST / PUT / DELETE | `/api/destinations` , `/:id` | **admin** | Add / edit / delete |
| GET | `/api/packages?category=&maxPrice=&maxDays=&search=&place=&sort=` | public | Filtered + sorted journeys |
| POST / PUT / DELETE | `/api/packages` , `/:id` | **admin** | Add / edit / delete |
| POST | `/api/bookings` | logged in | Create a booking |
| GET | `/api/bookings/mine` | logged in | My bookings |
| PUT | `/api/bookings/:id/cancel` | logged in | Cancel my booking |
| GET | `/api/bookings` | **admin** | All bookings |
| GET | `/api/users/saved` | logged in | My saved destinations |
| PUT | `/api/users/saved/:destinationId` | logged in | Save / un-save a destination |

You can try the public ones directly in the browser, e.g. http://localhost:5000/api/packages?category=Coast&sort=price-low

---

## 7. What changed compared with the original (Lovable) project

- **Removed** the Lovable/TanStack Start setup, the error-reporting files, `bun.lock`, AI-tool files and **40+ unused UI component files**. Only the three components that are actually used are kept (`Button`, `Input`, `Dialog`).
- **Same UI:** the stylesheet and page markup are kept, so the website looks the same. Small additions: a password field in the login popup, a "Sort" dropdown for journeys, and the admin pages.
- **Added a real backend** (Express + MongoDB) instead of hard-coded data and `localStorage`.
- **Added real authentication** (register, login, hashed passwords, JWT) and an **admin role**.
- **Simplified the frontend:** one huge file (`index.tsx`, ~500 lines on one page) was split into small components, and the duplicated booking/saved-places code now lives in shared contexts.
- Converted from TypeScript to plain JavaScript (JSX) to keep the code easy to read and explain.
- Booking prices are now calculated on the **server**, so they can't be changed from the browser.

---

## 8. Ideas to extend it further (good for extra marks)

- Reviews and ratings for each destination
- Image upload for the admin (with `multer`)
- Payment demo (Razorpay test mode) and a confirmation email (Nodemailer)
- Currency switcher (USD / INR)
- Pagination, wishlist page, forgot-password flow
- Deploy: backend on Render, database on MongoDB Atlas, frontend on Vercel / Netlify
