  const express = require('express');
  const cors = require('cors');
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const db = require('./config/db');
  const authMiddleware = require('./middleware/authMiddleware');
  const roleCheck = require('./middleware/rolecheckMiddleware');
  const validate = require('./middleware/validationMiddleware');
  const { registerSchema, carSchema, bookingSchema } = require('./validation/schemas');
  require('dotenv').config();

  const PORT = process.env.PORT || 10000;
  const JWT_SECRET = process.env.JWT_SECRET;

  const app = express();
  app.use(cors());
  app.use(express.json());

  // -------------------- ROOT + HEALTH --------------------
  app.get('/', (req, res) => {
    res.send('Backend is running!');
  });

  app.get('/api/health', (req, res) => {
    db.query('SELECT DATABASE()', (err, results) => {
      if (err) {
        console.error('DB connection failed:', err);
        return res.status(500).send('DB connection failed');
      }
      res.send(`DB connected: ${results[0]['DATABASE()']}`);
    });
  });
  // -------------------- AUTH ROUTES --------------------

  // POST /api/auth/register
  // Registers a new user (Customer or Agency).
  // Validates input, hashes password, and stores user in DB.
  app.post('/api/auth/register', validate(registerSchema), async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
      );
      res.json({ message: 'User registered successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // POST /api/auth/login
  // Authenticates a user by email/password.
  // Returns a JWT token with role and ID, expires in 1 hour.
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });


  // -------------------- CAR ROUTES --------------------

  // POST /api/cars
  // Adds a new car to the system.
  // Accessible only to authenticated users with 'AGENCY' role.
  // Validates car details before inserting into DB.
  app.post('/api/cars', authMiddleware, roleCheck('AGENCY'), validate(carSchema), async (req, res) => {
    try {
      const { vehicle_model, vehicle_number, seating_capacity, rent_per_day } = req.body;
      const agencyId = req.user.id;
      await db.query(
        'INSERT INTO cars (agency_id, vehicle_model, vehicle_number, seating_capacity, rent_per_day) VALUES (?, ?, ?, ?, ?)',
        [agencyId, vehicle_model, vehicle_number, seating_capacity, rent_per_day]
      );
      res.json({ message: 'Car added successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add car' });
    }
  });

  // GET /api/cars
  // Public endpoint: fetches all cars with agency info.
  app.get('/api/cars', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT 
          cars.id,
          cars.vehicle_model,
          cars.vehicle_number,
          cars.seating_capacity,
          cars.rent_per_day,
          users.name AS agency_name
        FROM cars
        JOIN users ON cars.agency_id = users.id
      `);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch cars' });
    }
  });

  // GET /api/cars/agency
  // Returns all cars owned by the logged‑in agency.
  // Accessible only to authenticated users with 'AGENCY' role.
  app.get('/api/cars/agency', authMiddleware, roleCheck('AGENCY'), async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT 
          cars.id,
          cars.vehicle_model,
          cars.vehicle_number,
          cars.seating_capacity,
          cars.rent_per_day
        FROM cars
        WHERE agency_id = ?
      `, [req.user.id]);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch agency cars' });
    }
  });

  // GET /api/cars/:id
  // Public endpoint: fetches a single car by ID.
  app.get('/api/cars/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await db.query('SELECT * FROM cars WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Car not found' });
      res.json(rows[0]);
    } catch (err) {
      console.error('Error fetching car:', err);
      res.status(500).json({ error: 'Failed to fetch car' });
    }
  });

  // PUT /api/cars/:id
  // Updates car details.
  // Accessible only to authenticated agencies, restricted to their own cars.
  app.put('/api/cars/:id', authMiddleware, roleCheck('AGENCY'), async (req, res) => {
    try {
      const { id } = req.params;
      const { vehicle_model, vehicle_number, seating_capacity, rent_per_day } = req.body;
      const agencyId = req.user.id;
      const [result] = await db.query(
        'UPDATE cars SET vehicle_model=?, vehicle_number=?, seating_capacity=?, rent_per_day=? WHERE id=? AND agency_id=?',
        [vehicle_model, vehicle_number, seating_capacity, rent_per_day, id, agencyId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Car not found or not owned by this agency' });
      res.json({ message: 'Car updated successfully' });
    } catch (err) {
      console.error('Error updating car:', err);
      res.status(500).json({ error: 'Failed to update car' });
    }
  });

  // DELETE /api/cars/:id
  // Deletes a car owned by the logged‑in agency.
  // Accessible only to authenticated agencies.
  app.delete('/api/cars/:id', authMiddleware, roleCheck('AGENCY'), async (req, res) => {
    try {
      const { id } = req.params;
      const agencyId = req.user.id;
      const [result] = await db.query('DELETE FROM cars WHERE id=? AND agency_id=?', [id, agencyId]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Car not found or not owned by this agency' });
      res.json({ message: 'Car deleted successfully' });
    } catch (err) {
      console.error('Error deleting car:', err);
      res.status(500).json({ error: 'Failed to delete car' });
    }
  });


  // -------------------- BOOKING ROUTES --------------------

  // POST /api/bookings
  // Creates a new booking for a car.
  // Accessible only to authenticated users with 'CUSTOMER' role.
  // Validates booking details, ensures start date is not in the past, calculates total cost.
  app.post('/api/bookings', authMiddleware, roleCheck('CUSTOMER'), validate(bookingSchema), async (req, res) => {
    try {
      const { car_id, start_date, number_of_days } = req.body;
      const customerId = req.user.id;
      const [cars] = await db.query('SELECT rent_per_day FROM cars WHERE id=?', [car_id]);
      if (cars.length === 0) return res.status(404).json({ error: 'Car not found' });

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const chosenDate = new Date(start_date);
      if (chosenDate < today) return res.status(400).json({ error: 'Start date cannot be in the past' });

      const rentPerDay = cars[0].rent_per_day;
      const totalCost = rentPerDay * number_of_days;
      await db.query(
        'INSERT INTO bookings (car_id, customer_id, start_date, number_of_days, total_cost, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [car_id, customerId, start_date, number_of_days, totalCost]
      );
      res.json({ message: 'Booking created successfully', totalCost });
    } catch (err) {
      console.error('Error creating booking:', err);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  });

  // GET /api/bookings/my
  // Returns all bookings made by the logged‑in customer.
  // Accessible only to authenticated users with 'CUSTOMER' role.
  app.get('/api/bookings/my', authMiddleware, roleCheck('CUSTOMER'), async (req, res) => {
    try {
      const customerId = req.user.id;
      const [bookings] = await db.query(`
        SELECT 
          b.id, b.start_date, b.number_of_days, b.total_cost,
          c.vehicle_model, c.vehicle_number
        FROM bookings b
        JOIN cars c ON b.car_id = c.id
        WHERE b.customer_id = ?`,
        [customerId]
      );
      res.json(bookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });

  // GET /api/bookings/agency
  // Returns all bookings for cars owned by the logged‑in agency.
  // Accessible only to authenticated users with 'AGENCY' role.
  // Includes booking details, car info, and customer name.
  app.get('/api/bookings/agency', authMiddleware, roleCheck('AGENCY'), async (req, res) => {
    try {
      const agencyId = req.user.id;
      const [bookings] = await db.query(`
        SELECT 
          b.id, b.start_date, b.number_of_days, b.total_cost,
          c.vehicle_model, c.vehicle_number,
          u.name AS customer_name
        FROM bookings b
        JOIN cars c ON b.car_id = c.id
        JOIN users u ON b.customer_id = u.id
        WHERE c.agency_id = ?`,
        [agencyId]
      );
      res.json(bookings);
    } catch (err) {
      console.error('Error fetching agency bookings:', err);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });

  // PUT /api/bookings/:id
  // Updates an existing booking (number of days).
  // Accessible only to authenticated customers for their own bookings.
  // Recalculates total cost based on updated days.
  app.put('/api/bookings/:id', authMiddleware, roleCheck('CUSTOMER'), async (req, res) => {
    try {
      const { id } = req.params;
      const { number_of_days } = req.body;
      const customerId = req.user.id;

      const [bookings] = await db.query(`
        SELECT b.*, c.rent_per_day 
        FROM bookings b 
        JOIN cars c ON b.car_id = c.id 
        WHERE b.id=? AND b.customer_id=?`,
        [id, customerId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({ error: 'Booking not found or not owned by this customer' });
      }

      const rentPerDay = bookings[0].rent_per_day;
      const totalCost = rentPerDay * number_of_days;

      const [result] = await db.query(
        'UPDATE bookings SET number_of_days=?, total_cost=? WHERE id=? AND customer_id=?',
        [number_of_days, totalCost, id, customerId]
      );

      if (result.affectedRows === 0) {
        return res.status(400).json({ error: 'Failed to update booking' });
      }

      res.json({ message: 'Booking updated successfully', totalCost });
    } catch (err) {
      console.error('Error updating booking:', err);
      res.status(500).json({ error: 'Failed to update booking' });
    }
  });

  // DELETE /api/bookings/:id
  // Cancels a booking.
  // Accessible only to authenticated customers for their own bookings.
  app.delete('/api/bookings/:id', authMiddleware, roleCheck('CUSTOMER'), async (req, res) => {
    try {
      const { id } = req.params;
      const customerId = req.user.id;

      const [result] = await db.query(
        'DELETE FROM bookings WHERE id=? AND customer_id=?',
        [id, customerId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Booking not found or not owned by this customer' });
      }

      res.json({ message: 'Booking cancelled successfully' });
    } catch (err) {
      console.error('Error cancelling booking:', err);
      res.status(500).json({ error: 'Failed to cancel booking' });
    }
  });


  // -------------------- SERVER --------------------

  // Starts the Express server on the configured port.

  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
