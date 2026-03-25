# Assignment - Software Development Engineering (Web)
## Car Rental Agency System

A web application for managing car rentals with two types of users: **Customers** and **Car Rental Agencies**.  
Implements registration, login, car management, and booking flows with role‑based access control.

---

## Problem Statement

Design a real‑life car rental system with the following requirements:

- Two user types: **Customers** and **Agencies**.
- Separate registration pages for each user type.
- Login functionality for both user types.
- Agencies can add, edit, and delete cars.
- Customers can view available cars and book them.
- Agencies can view bookings for their cars.
- Customers can view, update, and cancel their own bookings.
- Pages must be neat, simple, and user‑friendly.

---

## Pages Implemented

- **Registration Pages**
  - `register_customer.html` → Customer registration
  - `register_agency.html` → Agency registration

- **Login Page**
  - `login.html` → Common login for both roles

- **Car Management (Agency only)**
  - `agency.html` → Add new cars, edit car details, view cars owned by agency

- **Available Cars (Public)**
  - `index.html` → Displays all cars
    - Shows dropdown for number of days and start date only when logged in as Customer
    - Includes **Rent Car** button with role‑based restrictions

- **Bookings**
  - `customer.html` → Customer’s booked cars
  - `agency.html` → Agency’s view of bookings for their cars

---

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript (Bootstrap for styling)  
- **Backend**: Node.js + Express (original assignment allowed PHP, but implemented in Node.js for modularity)  
- **Database**: MySQL (tables: `users`, `cars`, `bookings`)  
- **Authentication**: JWT (JSON Web Tokens)  
- **Validation**: Joi middleware  
- **Password Security**: bcrypt hashing  

---

## Project Structure

project/
│── config/db.js              # Database connection (MySQL2 + .env)
│── middleware/
│    ├── authMiddleware.js    # JWT verification
│    ├── rolecheckMiddleware.js # Role enforcement
│    └── validationMiddleware.js # Input validation
│── validation/schemas.js     # Joi schemas
│── server.js                 # Main Express app with routes
│── frontend/                 # HTML, CSS, JS pages
│    ├── index.html
│    ├── login.html
│    ├── register_customer.html
│    ├── register_agency.html
│    ├── customer.html
│    └── agency.html
│── database.sql              # SQL file to replicate schema

Code

---

## API Endpoints

### Auth
- `POST /api/auth/register` → Register user (Customer/Agency)
- `POST /api/auth/login` → Login, receive JWT

### Cars
- `POST /api/cars` (Agency only) → Add car
- `GET /api/cars` → Get all cars
- `GET /api/cars/:id` → Get car by ID
- `GET /api/cars/agency` (Agency only) → Get cars owned by logged‑in agency
- `PUT /api/cars/:id` (Agency only) → Update car
- `DELETE /api/cars/:id` (Agency only) → Delete car

### Bookings
- `POST /api/bookings` (Customer only) → Create booking
- `GET /api/bookings/my` (Customer only) → View customer’s bookings
- `GET /api/bookings/agency` (Agency only) → View bookings for agency’s cars
- `PUT /api/bookings/:id` (Customer only) → Update booking (extend days)
- `DELETE /api/bookings/:id` (Customer only) → Cancel booking

---

## Testing Instructions

1. Import `database.sql` into MySQL to create tables.  
2. Run backend (`npm start`).  
3. Open frontend pages in browser.  
4. Workflow:
   - Register as Customer and Agency.
   - Login with credentials.
   - Agency adds cars.
   - Customer views cars, selects days + start date, books car.
   - Agency views bookings for their cars.
   - Customer can view, update or cancel bookings.

---

## Notes

- JWT tokens expire in **1 hour**.  
- Customers cannot rent cars if logged in as Agency.  
- Agencies cannot book cars.  
- Start date validation prevents past bookings.  

---

## Future Enhancements

- Prevent overlapping bookings (car availability check).  
- Payment integration (Stripe/Razorpay).  
- Admin dashboard for managing users and agencies.  
- Car filters (price, seating capacity, availability).  
- Analytics (revenue reports, booking trends).  