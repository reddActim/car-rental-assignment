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

// Load Customer Bookings
async function loadCustomerBookings() {
    const token = getToken();
    if (!token) {
        alert('Please login as a customer.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/bookings/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const bookings = await res.json();
        const container = document.getElementById('customerBookingsContainer');

        if (bookings.length === 0) {
            container.innerHTML = '<p>No bookings found.</p>';
            return;
        }

        container.innerHTML = bookings.map(b => `
      <div class="booking-card">
        <p><strong>Car Model:</strong> ${b.vehicle_model}</p>
        <p><strong>Car Number:</strong> ${b.vehicle_number}</p>
        <p><strong>Car ID:</strong> ${b.id}</p>
<p><strong>Start Date:</strong> ${formatDate(b.start_date)}</p>
        <p><strong>Days:</strong> ${b.number_of_days}</p>
        <p><strong>Total Cost:</strong> ₹${b.total_cost}</p>
        <button onclick="cancelBooking(${b.id})">Cancel</button>
        <button onclick="updateBooking(${b.id})">Update</button>
      </div>
    `).join('');
    } catch (err) {
        console.error('Error loading bookings:', err);
        alert('Failed to load bookings.');
    }
}

// Cancel Booking
async function cancelBooking(bookingId) {
    const token = getToken();
    try {
        const res = await fetch(`http://localhost:3000/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Booking cancelled successfully!');
            loadCustomerBookings();
        } else {
            alert('Failed to cancel booking');
        }
    } catch (err) {
        console.error('Error cancelling booking:', err);
    }
}

// Update Booking (simple prompt for new days)
async function updateBooking(bookingId) {
    const token = getToken();
    const newDays = prompt('Enter new number of days:');
    if (!newDays) return;

    try {
        const res = await fetch(`http://localhost:3000/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ number_of_days: parseInt(newDays) })
        });
        const data = await res.json();
        if (res.ok) {
            alert(`Booking updated! New total cost: ₹${data.totalCost}`);
            loadCustomerBookings();
        } else {
            alert(data.error || 'Failed to update booking');
        }
    } catch (err) {
        console.error('Error updating booking:', err);
    }
}

renderNav();
loadCustomerBookings();

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

