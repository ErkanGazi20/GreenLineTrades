const axios = require('axios');

const googleScriptUrl = 'https://script.google.com/macros/s/AKfycby4uejHBE9pIMNxT31VRhXwAqMS7X4Pg5UJZQQgds5hC89g3WotyAZuc2mEQh0ROmzM/exec'; // Replace this with your Google Apps Script web app URL

const data = {
  name: 'Panayiotis Baldirigilli',
  email: 'Panayiotis@example.com',
  subject: 'Test Subject',
  message: 'Hi, We are building an apartment with 16 flats.. We need aluminium windows for the flat and common area. Can a get a quote? Best wishes, Baldirigilli'
};

// Sending data as a POST request
axios.post(googleScriptUrl, data)
  .then(response => {
    console.log('Response from Google Apps Script:', response.data);
  })
  .catch(error => {
    console.error('Error sending data to Google Apps Script:', error);
  });
