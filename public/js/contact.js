emailjs.init("YJ6TetlfB6x7bthIQ");

document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('.contact-form');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = form.querySelector('input[name="name"]').value.trim();
      const email = form.querySelector('input[name="email"]').value.trim();
      const subject = form.querySelector('input[name="subject"]').value.trim();
      const message = form.querySelector('textarea[name="message"]').value.trim();

      if (!name || !email || !subject || !message) {
        alert("Please fill in all fields before submitting.");
        return;
      }

      // Send email
      emailjs.send("service_8xmduza", "template_ptaa2ue", {
        from_name: name,
        from_email: email,
        subject: subject,
        message: message
      }).then(() => {
        console.log("Email sent!");

        // Setup headers conditionally
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        fetch('http://localhost:5000/submit', {
          method: 'POST',
          headers,
          body: JSON.stringify({ subject, message })
        })
        .then(res => res.json())
        .then(data => {
          console.log("Data saved:", data);

          const popup = document.getElementById('message-popup');
          if (popup) {
            popup.style.display = 'block';
            setTimeout(() => popup.style.display = 'none', 3000);
          }

          form.reset();
        })
        .catch(err => {
          console.error("Failed to save data:", err);
          alert("Email sent but saving to server failed.");
        });

      }, function (error) {
        console.error("Email failed:", error);
        alert("Something went wrong sending your message.");
      });
    });
  }

  // Adjust nav links based on login
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (token) {
    document.querySelector('[href="login.html"]').style.display = 'none';
    document.querySelector('[href="register.html"]').style.display = 'none';

    const nav = document.querySelector('.nav-list');
    const logoutItem = document.createElement('li');
    logoutItem.innerHTML = '<a href="#">Logout</a>';
    logoutItem.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.reload();
    });
    nav.appendChild(logoutItem);
  }

  // Hide name/email fields if user is logged in
  const nameField = document.querySelector('input[name="name"]');
  const emailField = document.querySelector('input[name="email"]');
  if (user) {
    if (nameField) nameField.parentElement.style.display = "none";
    if (emailField) emailField.parentElement.style.display = "none";
  }
});
