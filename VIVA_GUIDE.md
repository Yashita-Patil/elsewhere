# Viva / Practical Presentation Guide

## 5-minute demo script
1. **Home page** — "This is a React single-page app. All content comes from MongoDB through our Express API."
2. **Filters** — click *Coast*, choose a price, change the sort. Say: "Each change sends a request like `/api/packages?category=Coast&sort=price-low` and MongoDB does the filtering."
3. **Heart a destination while logged out** — the login popup opens. "Saving needs an account."
4. **Register** a new user → show the dashboard. "The password is hashed with bcrypt; we get back a JWT."
5. **Save a place, book a journey** → open *My trips*. "The total is calculated on the server."
6. **Cancel the booking** → status changes to *Cancelled* (updated in the database).
7. **Open a destination page** (`/destinations/bali`) — dynamic route using the slug.
8. **Log in as admin** → *Admin* → add a destination → it appears on the home page. Show *Bookings* tab (all users).
9. **Open MongoDB Compass** (or mongosh) and show the 4 collections — proves the data is real.

## Questions you may be asked

**MERN basics**
- *What does MERN stand for and what does each part do?* MongoDB (database), Express (web framework on Node), React (UI), Node.js (JavaScript runtime for the server).
- *What is a REST API?* A set of URLs (endpoints) that use HTTP methods — GET read, POST create, PUT update, DELETE remove — and exchange JSON.
- *Why MongoDB?* Flexible JSON-like documents, easy to map to JavaScript objects, works well with Node via Mongoose.
- *What is Mongoose?* A library that gives MongoDB schemas, validation and easy query methods.

**Backend**
- *What is middleware?* A function that runs between the request and the response, e.g. `express.json()`, `cors`, `protect` (checks the JWT).
- *How does authentication work here?* bcrypt hashes passwords; after login the server signs a JWT; the client sends it in the `Authorization` header; `protect` verifies it.
- *Why hash passwords?* So that even if the database leaks, real passwords are not exposed. Hashing is one-way.
- *How is the admin protected?* `adminOnly` middleware checks `req.user.role === "admin"`. Hiding the button in React is not enough, the server must check too.
- *What is the difference between routes and controllers?* Routes map a URL + method to a function; controllers contain that function's logic.
- *What is `populate`?* Replaces a stored id with the full document it points to (used for saved places and booking customers).
- *Where is the error handling?* `middleware/errorHandler.js` converts validation, duplicate-key and bad-id errors into clean JSON messages.

**Frontend**
- *What is a SPA?* One HTML page; React swaps the content without reloading. React Router changes the URL without a page refresh.
- *Explain `useState`, `useEffect`, `useMemo`.* State stores data that changes the UI; `useEffect` runs code after render (fetching data); `useMemo` caches a calculated value (the filtered destination list).
- *What is Context?* A way to share data (the logged-in user) with any component without passing props through every level.
- *What are props?* Inputs passed from a parent component to a child (e.g. `<PackageCard item={...} />`).
- *What is the Vite proxy?* In development it forwards `/api` requests from port 5173 to the Express server on port 5000.
- *Where is the token stored? Any downside?* In `localStorage`. It is simple, but vulnerable to XSS; httpOnly cookies are safer for real production apps.

**Database**
- *Draw the ER diagram.* User 1—N Booking, Package 1—N Booking, Destination 1—N Package, User N—M Destination (saved places).
- *Why is a copy of the package title/price stored inside the booking?* So old bookings stay correct even if the package is edited or deleted later.

## Run-through checklist before the practical
- [ ] MongoDB is running (service started or Atlas URI works)
- [ ] `server/.env` exists and `JWT_SECRET` is set
- [ ] `npm run seed` done once
- [ ] `npm run dev` runs without errors; http://localhost:5173 opens
- [ ] You can log in as admin and as demo user
- [ ] Keep MongoDB Compass open to show the data
