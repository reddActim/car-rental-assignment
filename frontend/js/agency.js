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
  return Date.now() >= payload.exp * 1000;
}

function getToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  if (isTokenExpired(token)) {
    localStorage.removeItem('token');
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
    return null;
  }
  return token;
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
    const token = getToken();
    if (!token) return;

    const car = {
      vehicle_model: document.getElementById('vehicle_model').value,
      vehicle_number: document.getElementById('vehicle_number').value,
      seating_capacity: parseInt(document.getElementById('seating_capacity').value),
      rent_per_day: parseFloat(document.getElementById('rent_per_day').value)
    };

    const res = await fetch('https://car-rental-assignment.onrender.com/api/cars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(car)
    });

    const data = await res.json();
    if (res.ok) {
      alert('Car added successfully!');
      loadAgencyCars();
    } else {
      alert(data.error || 'Failed to add car');
    }
  });
}

async function loadAgencyCars() {
  const token = getToken();
  if (!token) return;

  const res = await fetch('https://car-rental-assignment.onrender.com/api/cars/agency', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const cars = await res.json();
  const container = document.getElementById('agencyCarsContainer');
  if (!container) return;
  container.innerHTML = cars.map(car => `
    <div class="car-card" id="car-${car.id}">
      <h3>${car.vehicle_model}</h3>
      <p>Number: ${car.vehicle_number}</p>
      <p>Seats: ${car.seating_capacity}</p>
      <p>Rent/day: ₹${car.rent_per_day}</p>
    </div>
  `).join('');
}

// ===== Bookings =====
async function loadAgencyBookings() {
  const token = getToken();
  if (!token) return;

  const res = await fetch('https://car-rental-assignment.onrender.com/api/bookings/agency', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const bookings = await res.json();
  const container = document.getElementById('agencyBookingsContainer');
  if (!container) return;

  if (bookings.length === 0) {
    container.innerHTML = '<p>No bookings found for your cars.</p>';
    return;
  }

  container.innerHTML = bookings.map(b => `
    <div class="booking-card">
      <h3>Booking ID #${b.id}</h3>
      <p><strong>Car:</strong> ${b.vehicle_model}</p>
      <p><strong>Customer:</strong> ${b.customer_name || 'Unknown'}</p>
      <p><strong>Start Date:</strong> ${formatDate(b.start_date)}</p>
      <p><strong>Days:</strong> ${b.number_of_days}</p>
      <p><strong>Total Cost:</strong> ₹${b.total_cost}</p>
    </div>
  `).join('');
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

// ===== UI Toggles for Add Car Form =====
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
