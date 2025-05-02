document.addEventListener('DOMContentLoaded', function () {
  console.log("✅ DOM fully loaded and parsed");

  // Login / Welcome / Logout Navigation logic
  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    console.error("❌ Failed to parse user from localStorage:", e);
    localStorage.removeItem('user'); // clean up invalid data
  }

  console.log("👤 Loaded user from localStorage:", user);

  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const welcomeMessage = document.getElementById('welcome-message');
  const logoutLink = document.getElementById('logout-link');

  if (user) {
    console.log("🎉 User is logged in, updating navigation");

    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';

    if (welcomeMessage) {
      const name = user.firstName || (user.name ? user.name.split(' ')[0] : 'User');
      welcomeMessage.textContent = `👋 Welcome, ${name}!`;
      welcomeMessage.style.display = 'inline-block';
      welcomeMessage.style.color = 'white';
      console.log("🙌 Welcome message set");
    }

    if (logoutLink) {
      logoutLink.style.display = 'inline-block';
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        location.reload();
      });
      console.log("🚪 Logout link set");
    }

    // Auto-fill and hide name/email if user is logged in
    const contactName = document.getElementById('contact-name');
    const contactEmail = document.getElementById('contact-email');

    if (contactName && contactEmail) {
      const fullName = `${user.firstName} ${user.lastName}`;
      contactName.value = fullName;
      contactEmail.value = user.email;

      contactName.style.display = 'none';
      contactEmail.style.display = 'none';

      contactName.removeAttribute('required');
      contactEmail.removeAttribute('required');
    }
  } else {
    console.log("👤 No user logged in – showing login/register links");
  }

  // ✅ Login form logic
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const identifier = document.getElementById('login-identifier').value.trim();
      const password = document.getElementById('login-password').value.trim();

      if (!identifier || !password) {
        alert("Please enter both identifier and password.");
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log("✅ Logged in:", data.user);

        window.location.href = 'index.html';
      } catch (err) {
        console.error("❌ Login error:", err);
        alert("Login failed. Check credentials or server.");
      }
    });
  }

  // ✅ Register form logic
  const registerForm = document.getElementById('registerForm');

  if (registerForm) {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const strengthDisplay = document.getElementById('passwordStrength');
    const matchDisplay = document.getElementById('passwordMatch');

    passwordInput.addEventListener('input', () => {
      const value = passwordInput.value;
      let strength = 'Weak';
      let color = 'red';

      if (value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) {
        strength = 'Strong';
        color = 'green';
      } else if (value.length >= 6) {
        strength = 'Medium';
        color = 'orange';
      }

      strengthDisplay.textContent = `Password strength: ${strength}`;
      strengthDisplay.style.color = color;
    });

    confirmPasswordInput.addEventListener('input', () => {
      const match = passwordInput.value === confirmPasswordInput.value;
      matchDisplay.textContent = match ? '✅ Passwords match' : '❌ Passwords do not match';
      matchDisplay.style.color = match ? 'green' : 'red';
    });

    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const email = document.getElementById('email').value.trim();
      const workTel = document.getElementById('workTel').value.trim();
      const mobileTel = document.getElementById('mobileTel').value.trim();
      const role = document.querySelector('input[name="role"]:checked').value;
      const business = document.getElementById('business').value.trim();
      const password = passwordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();

      if (!firstName || !lastName || !email || !password || !confirmPassword || !mobileTel) {
        alert("Please fill in all required fields.");
        return;
      }

      if (password !== confirmPassword) {
        matchDisplay.textContent = "Passwords do not match.";
        matchDisplay.style.color = 'red';
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName, lastName, email, password,
            workTel, mobileTel, role, business
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Registration failed");
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log("✅ Registered and logged in:", data.user);

        window.location.href = 'index.html';
      } catch (err) {
        console.error("❌ Registration error:", err);
        alert("Registration failed. See console for details.");
      }
    });
  }

  // Contact form logic
  const contactForm = document.querySelector('.contact-form');

  if (
    contactForm &&
    contactForm.querySelector('input[name="name"]') &&
    contactForm.querySelector('input[name="email"]') &&
    contactForm.querySelector('input[name="subject"]') &&
    contactForm.querySelector('textarea[name="message"]')
  ) {
    console.log("📨 Contact form detected");

    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const name = contactForm.querySelector('input[name="name"]').value.trim();
      const email = contactForm.querySelector('input[name="email"]').value.trim();
      const subject = contactForm.querySelector('input[name="subject"]').value.trim();
      const message = contactForm.querySelector('textarea[name="message"]').value.trim();

      if (!name || !email || !subject || !message) {
        alert("Please fill in all fields before submitting.");
        return;
      }

      try {
        console.log("📧 Sending email via EmailJS...");
        await emailjs.send("service_8xmduza", "template_ptaa2ue", {
          from_name: name,
          from_email: email,
          subject,
          message
        });

        const token = localStorage.getItem('token');
        if (!token) throw new Error("Not authenticated");

        console.log("🔐 Sending message to backend with token:", token);
        const response = await fetch('http://localhost:5000/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({ subject, message })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const popup = document.getElementById('message-popup');
        if (popup) {
          popup.style.display = 'block';
          setTimeout(() => popup.style.display = 'none', 3000);
        }

        console.log("✅ Message sent successfully");
        contactForm.reset();
      } catch (err) {
        console.error("❌ Error during message submission:", err);
        alert("An error occurred. See console for details.");
      }
    });
  }
});
