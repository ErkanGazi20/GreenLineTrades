document.addEventListener('DOMContentLoaded', function () {
  console.log("✅ DOM fully loaded and parsed");

  // Login / Welcome / Logout Navigation logic
  const user = JSON.parse(localStorage.getItem('user'));
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

      // Hide the fields visually but keep them in the DOM for form submission
      contactName.style.display = 'none';
      contactEmail.style.display = 'none';

      // Optionally remove "required" so the browser doesn’t complain
      contactName.removeAttribute('required');
      contactEmail.removeAttribute('required');
    }
  } else {
    console.log("👤 No user logged in – showing login/register links");
  }

  // Contact form logic
  const form = document.querySelector('.contact-form');

  if (form) {
    console.log("📨 Contact form detected");

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const name = form.querySelector('input[name="name"]').value.trim();
      const email = form.querySelector('input[name="email"]').value.trim();
      const subject = form.querySelector('input[name="subject"]').value.trim();
      const message = form.querySelector('textarea[name="message"]').value.trim();

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
        form.reset();
      } catch (err) {
        console.error("❌ Error during message submission:", err);
        alert("An error occurred. See console for details.");
      }
    });
  }
});
