function getToken() {
  return localStorage.getItem('token');
}

function renderNav() {
  const nav = document.getElementById('navButtons');
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

// Add Car
const addCarForm = document.getElementById('addCarForm');
if (addCarForm) {
  addCarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getToken();
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

// Load Agency Cars
async function loadAgencyCars() {
  const token = getToken();
  const res = await fetch('https://car-rental-assignment.onrender.com/api/cars/agency', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const cars = await res.json();
  const container = document.getElementById('agencyCarsContainer');

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
}

// Show inline edit form
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

// Update Car
async function updateCar(e, id) {
  e.preventDefault();
  const token = getToken();

  const newModel = document.getElementById(`edit-model-${id}`).value;
  const newNumber = document.getElementById(`edit-number-${id}`).value;
  const newSeats = parseInt(document.getElementById(`edit-seats-${id}`).value);
  const newRent = parseFloat(document.getElementById(`edit-rent-${id}`).value);

  try {
    const res = await fetch(`https://car-rental-assignment.onrender.com/api/cars/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vehicle_model: newModel,
        vehicle_number: newNumber,
        seating_capacity: newSeats,
        rent_per_day: newRent
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert("Car updated successfully!");
      loadAgencyCars();
    } else {
      alert(data.error || "Failed to update car");
    }
  } catch (err) {
    console.error("Error updating car:", err);
    alert("Server error while updating car.");
  }
}

// Delete Car
async function deleteCar(carId) {
  const token = getToken();
  const res = await fetch(`https://car-rental-assignment.onrender.com/api/cars/${carId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.ok) {
    alert('Car deleted successfully!');
    loadAgencyCars();
  } else {
    alert('Failed to delete car');
  }
}

// Load Bookings for Agency
async function loadAgencyBookings() {
  const token = getToken();
  const res = await fetch('https://car-rental-assignment.onrender.com/api/bookings/agency', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const bookings = await res.json();
  const container = document.getElementById('agencyBookingsContainer');

  if (bookings.length === 0) {
    container.innerHTML = '<p>No bookings found for your cars.</p>';
    return;
  }

  container.innerHTML = bookings.map(b => `
    <div class="booking-card">
      <h3>Booking ID #${b.id}</h3>
      <p><strong>Car:</strong> ${b.vehicle_model} (${b.vehicle_number})</p>
      <p><strong>Customer:</strong> ${b.customer_name || 'Unknown'}</p>
      <p><strong>Start Date:</strong> ${formatDate(b.start_date)}</p>
      <p><strong>Days:</strong> ${b.number_of_days}</p>
      <p><strong>Total Cost:</strong> ₹${b.total_cost}</p>
    </div>
  `).join('');
}


renderNav();
loadAgencyCars();
loadAgencyBookings();

// Toggle Add Car Form
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

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}