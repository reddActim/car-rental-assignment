function getUserRole() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

async function loadCars() {
  try {
    const res = await fetch('http://localhost:3000/api/cars');
    const cars = await res.json();
    const role = getUserRole();

    const container = document.getElementById('carsContainer');
    container.innerHTML = cars.map(car => `
  <div class="car-card">
    <h3>${car.vehicle_model}</h3>
    <p><strong>Number:</strong> ${car.vehicle_number}</p>
    <p><strong>Seats:</strong> ${car.seating_capacity}</p>
    <p><strong>Rent/day:</strong> ₹${car.rent_per_day}</p>
    <p><strong>Agency:</strong> ${car.agency_name || 'Unknown'}</p>
    <p>
      <label>Days:
        <select id="days-${car.id}">
          ${[1, 2, 3, 4, 5, 6, 7].map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
      </label>
    </p>
    <p>
      <label>Start Date:
        <input type="date" id="start-${car.id}">
      </label>
    </p>
    <button onclick="rentCar(${car.id})">Rent Car</button>
  </div>
`).join('');

  } catch (err) {
    console.error('Error loading cars:', err);
    document.getElementById('carsContainer').innerHTML = '<p>Failed to load cars.</p>';
  }
}

async function rentCar(carId) {
  const token = localStorage.getItem('token');  
  const role = getUserRole();
  if (!token) {
    alert('Please login as a customer to rent a car.');
    window.location.href = 'login.html';
    return;
  }
    
  if (role === 'AGENCY') {
    alert('Agencies cannot rent cars.');
    return;
  }

  if (role !== 'CUSTOMER') {
    alert('Only customers can rent cars.');
    return;
  }

  const days = document.getElementById(`days-${carId}`).value;
  const startDate = document.getElementById(`start-${carId}`).value;

  if (!startDate) {
    alert('Please select a start date.');
    return;
  }

  // Validate that start date is today or future
  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize to midnight
  const chosenDate = new Date(startDate);

  if (chosenDate < today) {
    alert('You cannot book a car for a past date.');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        car_id: carId,
        start_date: startDate,
        number_of_days: parseInt(days)
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(`Booking successful! Total cost: ₹${data.totalCost}`);
    } else {
      alert(data.error || 'Booking failed');
    }
  } catch (err) {
    console.error('Error booking car:', err);
    alert('Booking failed due to server error.');
  }
}

loadCars();

function renderNav() {
  const nav = document.getElementById('navButtons');
  const token = localStorage.getItem('token');

  if (!token) {
    // Guest view
    nav.innerHTML = `
      <button onclick="window.location.href='login.html'">Login</button>
      <button onclick="window.location.href='register_customer.html'">Register as Customer</button>
      <button onclick="window.location.href='register_agency.html'">Register as Agency</button>
    `;
  } else {
    const role = getUserRole();

    if (role === 'CUSTOMER') {
      nav.innerHTML = `
        <button onclick="window.location.href='customer.html'">Booked Cars</button>
        <button onclick="logout()">Logout</button>
      `;
    } else if (role === 'AGENCY') {
      nav.innerHTML = `
        <button onclick="window.location.href='agency.html'">Agency Dashboard</button>
        <button onclick="logout()">Logout</button>
      `;
    } else {
      // fallback if role is missing/unknown
      nav.innerHTML = `
        <button onclick="logout()">Logout</button>
      `;
    }
  }
}

function logout() {
  localStorage.removeItem('token');
  alert('Logged out successfully!');
  window.location.href = 'index.html';
}

renderNav();
