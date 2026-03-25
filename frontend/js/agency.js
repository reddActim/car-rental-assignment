// ===== JWT Helpers =====
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

function getValidToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("You must log in first!");
    window.location.href = "login.html";
    return null;
  }
  if (isTokenExpired(token)) {
    alert("Your session has expired. Please log in again.");
    localStorage.removeItem('token');
    window.location.href = "login.html";
    return null;
  }
  return token;
}

// Centralized fetch wrapper
async function apiFetch(url, options = {}) {
  const token = getValidToken();
  if (!token) return;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    'Authorization': `Bearer ${token}`
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

// ===== Registration =====
const customerForm = document.getElementById('customerRegisterForm');
if (customerForm) {
  customerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch('https://car-rental-assignment.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'CUSTOMER' })
    });

    const data = await res.json();
    if (res.ok) {
      alert('Customer registered successfully!');
      window.location.href = 'login.html';
    } else {
      alert(data.error || 'Registration failed');
    }
  });
}

const agencyForm = document.getElementById('agencyRegisterForm');
if (agencyForm) {
  agencyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch('https://car-rental-assignment.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role: 'AGENCY' })
    });

    const data = await res.json();
    if (res.ok) {
      alert('Agency registered successfully!');
      window.location.href = 'login.html';
    } else {
      alert(data.error || 'Registration failed');
    }
  });
}

// ===== Login =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch('https://car-rental-assignment.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      alert('Login successful!');
      window.location.href = 'index.html';
    } else {
      alert(data.error || 'Login failed');
    }
  });
}

// ===== Navigation =====
function renderNav() {
  const nav = document.getElementById('navButtons');
  if (!nav) return;
  nav.innerHTML = `
    <button onclick="logout()">Logout</button>
    <button onclick="window.location.href='index.html'">Back to Cars</button>
  `;
}

function logout() {
  localStorage.removeItem('token');
  alert('Logged out successfully!');
  window.location.href = 'index.html';
}

// ===== Car Management =====
const addCarForm = document.getElementById('addCarForm');
if (addCarForm) {
  addCarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const car = {
        vehicle_model: document.getElementById('vehicle_model').value,
        vehicle_number: document.getElementById('vehicle_number').value,
        seating_capacity: parseInt(document.getElementById('seating_capacity').value),
        rent_per_day: parseFloat(document.getElementById('rent_per_day').value)
      };
      await apiFetch('https://car-rental-assignment.onrender.com/api/cars', {
        method: 'POST',
        body: JSON.stringify(car)
      });
      alert('Car added successfully!');
      loadAgencyCars();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function loadAgencyCars() {
  try {
    const cars = await apiFetch('https://car-rental-assignment.onrender.com/api/cars/agency');
    const container = document.getElementById('agencyCarsContainer');
    if (!container) return;
    container.innerHTML = cars.map(car => `
      <div class="car-card" id="car-${car.id}">
        <h3>${car.vehicle_model}</h3>
        <p>Number: ${car.vehicle_number}</p>
        <p>Seats: ${car.seating_capacity}</p>
        <p>Rent/day: ₹${car.rent_per_day}</p>
        <button onclick="showEditForm(${car.id}, '${car.vehicle_model}', '${car.vehicle_number}', ${car.seating_capacity}, ${car.rent_per_day})">Edit</button>
        <button onclick="deleteCar(${car.id})">Delete</button>
        <div class="edit-form" id="edit-${car.id}" style="display:none;"></div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function showEditForm(id, model, number, seats, rent) {
  const formContainer = document.getElementById(`edit-${id}`);
  formContainer.innerHTML = `
    <form onsubmit="updateCar(event, ${id})">
      <input type="text" id="edit-model-${id}" value="${model}" required>
      <input type="text" id="edit-number-${id}" value="${number}" required>
      <input type="number" id="edit-seats-${id}" value="${seats}" required>
      <input type="number" id="edit-rent-${id}" value="${rent}" required>
      <button type="submit">Save</button>
      <button type="button" onclick="cancelEdit(${id})">Cancel</button>
    </form>
  `;
  formContainer.style.display = 'block';
}

function cancelEdit(id) {
  document.getElementById(`edit-${id}`).style.display = 'none';
}

async function updateCar(e, id) {
  e.preventDefault();
  try {
    const newModel = document.getElementById(`edit-model-${id}`).value;
    const newNumber = document.getElementById(`edit-number-${id}`).value;
    const newSeats = parseInt(document.getElementById(`edit-seats-${id}`).value);
    const newRent = parseFloat(document.getElementById(`edit-rent-${id}`).value);

    await apiFetch(`https://car-rental-assignment.onrender.com/api/cars/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        vehicle_model: newModel,
        vehicle_number: newNumber,
        seating_capacity: newSeats,
        rent_per_day: newRent
      })
    });
    alert("Car updated successfully!");
    loadAgencyCars();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteCar(carId) {
  try {
    await apiFetch(`https://car-rental-assignment.onrender.com/api/cars/${carId}`, {
      method: 'DELETE'
    });
    alert('Car deleted successfully!');
    loadAgencyCars();
  } catch (err) {
    alert(err.message);
  }
}

// ===== Bookings =====
async function loadAgencyBookings() {
  try {
    const bookings = await apiFetch('https://car-rental-assignment.onrender.com/api/bookings/agency');
    const container = document.getElementById('agencyBookingsContainer');
    if (!container) return;

    if (bookings.length === 0) {
      container.innerHTML = '<p>No bookings found for your cars.</p>';
      return;
    }

    container.innerHTML = bookings.map(b => `
      <div class="booking-card">
        <h3>Booking ID #${b.id}</h3>
        <p><strong>Car:</strong> ${b.vehicle_model}
                <p><strong>Customer:</strong> ${b.customer_name || 'Unknown'}</p>
        <p><strong>Start Date:</strong> ${formatDate(b.start_date)}</p>
        <p><strong>Days:</strong> ${b.number_of_days}</p>
        <p><strong>Total Cost:</strong> ₹${b.total_cost}</p>
      </div>
    `).join('');
  } catch (err) {
    console.error("Error loading bookings:", err);
    const container = document.getElementById('agencyBookingsContainer');
    if (container) {
      container.innerHTML = '<p>Failed to load bookings. Please try again.</p>';
    }
  }
}

// ===== Utility =====
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// ===== UI Toggles =====
const showAddCarBtn = document.getElementById('showAddCarBtn');
const cancelAddCarBtn = document.getElementById('cancelAddCarBtn');

if (showAddCarBtn && addCarForm && cancelAddCarBtn) {
  showAddCarBtn.addEventListener('click', () => {
    addCarForm.style.display = 'block';
    showAddCarBtn.style.display = 'none';
  });

  cancelAddCarBtn.addEventListener('click', () => {
    addCarForm.style.display = 'none';
    showAddCarBtn.style.display = 'inline-block';
  });
}

// ===== Initial Render =====
renderNav();
loadAgencyCars();
loadAgencyBookings();
