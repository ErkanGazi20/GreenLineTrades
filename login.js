document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
  
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
  
      const identifier = document.getElementById('login-identifier').value.trim();
      const password = document.getElementById('login-password').value;
  
      if (!identifier || !password) {
        alert("Please fill in both fields.");
        return;
      }
  
      try {
        const response = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
  
        const data = await response.json();
  
        if (!data.success) {
          alert(data.error || "Login failed.");
          return;
        }
  
        // Store token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
  
        // Redirect or show a message
        alert(`Welcome, ${data.user.firstName}!`);
        window.location.href = 'index.html'; // Change destination if needed
  
      } catch (err) {
        console.error("Login error:", err);
        alert("An error occurred. Please try again.");
      }
    });

  });
  