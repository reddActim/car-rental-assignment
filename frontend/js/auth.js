// Helper: decode JWT payload
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

// Customer Registration
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

// Agency Registration
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

// Login
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
      const payload = decodeToken(data.token);
      alert('Login successful!');
      window.location.href = 'index.html'
    } else {
      alert(data.error || 'Login failed');
    }
  });
}
