document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('#registerForm');
  const passwordInput = document.querySelector('#password');
  const confirmPasswordInput = document.querySelector('#confirmPassword');
  const passwordStrengthDiv = document.querySelector('#passwordStrength');
  const passwordMatchDiv = document.querySelector('#passwordMatch');
  const submitBtn = form.querySelector('button[type="submit"]');


  const getPasswordStrength = (password) => {
    const regexPatterns = [/[A-Z]/, /[a-z]/, /\d/, /[!@#$%^&*(),.?":{}|<>]/];
    const matches = regexPatterns.filter(pattern => pattern.test(password)).length;

    if (matches === 4) return 'Very Strong';
    if (matches === 3) return 'Strong';
    if (matches === 2) return 'Moderate';
    return 'Weak';
  };

  const getStrengthColor = (strength) => {
    return {
      'Very Strong': 'green',
      'Strong': 'orange',
      'Moderate': 'yellow',
      'Weak': 'red'
    }[strength] || 'black';
  };

  const checkPasswordsMatch = () => {
    if (passwordInput.value && confirmPasswordInput.value) {
      if (passwordInput.value === confirmPasswordInput.value) {
        passwordMatchDiv.textContent = 'Passwords match';
        passwordMatchDiv.style.color = 'green';
      } else {
        passwordMatchDiv.textContent = 'Passwords do not match';
        passwordMatchDiv.style.color = 'red';
      }
    } else {
      passwordMatchDiv.textContent = '';
    }
  };

  passwordInput.addEventListener('input', () => {
    const strength = getPasswordStrength(passwordInput.value);
    passwordStrengthDiv.textContent = `Strength: ${strength}`;
    passwordStrengthDiv.style.color = getStrengthColor(strength);
    checkPasswordsMatch();
  });

  confirmPasswordInput.addEventListener('input', checkPasswordsMatch);

  form.addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent the default form submission

    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const email = form.email.value.trim();
    const workTel = form.workTel.value.trim();
    const mobileTel = form.mobileTel.value.trim();
    const business = form.business.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    const role = form.querySelector('input[name="role"]:checked').value;
    const type = form.type.value;

    if (!firstName || !lastName || !email || !password || !confirmPassword || !mobileTel) {
      alert("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    submitBtn.disabled = true; // Disable button to prevent multiple submissions
    submitBtn.textContent = "Registering...";

    try {
      // Send the POST request to the backend
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email, workTel, mobileTel, business, password, role
        })               
      });

      const data = await response.json();

      console.log(data);  // Log server response to check if the user was created successfully

      if (data.success) {
        // If registration is successful, store the user info and redirect to home
        localStorage.setItem('user', JSON.stringify({ firstName, lastName, email }));
        window.location.href = 'index.html'; // Redirect to home page
      } else {
        alert(data.message || "Registration error."); // Show the error message
      }
    } catch (err) {
      console.error("Registration failed", err);
      alert("Registration failed. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Register"; // Re-enable button after the process is done
    }
  });
});
