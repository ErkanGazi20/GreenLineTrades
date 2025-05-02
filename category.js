document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('name');
  
    const title = document.getElementById('category-title');
    const listingsContainer = document.getElementById('listings-container');
  
    if (!category) {
      title.textContent = "Category not found.";
      return;
    }
  
    // Display the category name
    title.textContent = `Category: ${decodeURIComponent(category).replace(/-/g, ' ')}`;
  
    // Example: Fetch listings by category (you’ll replace this with actual backend request)
    fetch(`http://localhost:5000/listings?category=${encodeURIComponent(category)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success || !data.listings || data.listings.length === 0) {
          listingsContainer.innerHTML = "<p>No listings found for this category.</p>";
          return;
        }
  
        data.listings.forEach(listing => {
          const div = document.createElement('div');
          div.className = 'listing-card';
          div.innerHTML = `
            <h3>${listing.title}</h3>
            <p>${listing.description}</p>
            <p><strong>Price:</strong> ${listing.price}</p>
          `;
          listingsContainer.appendChild(div);
        });
      })
      .catch(err => {
        console.error("Failed to load listings:", err);
        listingsContainer.innerHTML = "<p>Error loading listings. Please try again later.</p>";
      });
  });
  