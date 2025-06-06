// GrowUp Dubai Shopify Theme JavaScript

document.addEventListener('DOMContentLoaded', function() {
  
  // Theme Toggle Functionality
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }

  // Cart Functionality
  const cartForm = document.querySelector('.cart');
  if (cartForm) {
    const quantityInputs = cartForm.querySelectorAll('input[name="updates[]"]');
    
    quantityInputs.forEach(input => {
      input.addEventListener('change', function() {
        if (this.value === '0') {
          this.closest('.cart-item')?.remove();
        }
        updateCart();
      });
    });
  }

  // Product Form Handling
  const productForms = document.querySelectorAll('#product-form');
  productForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner"></span> Adding...';
      
      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: form.querySelector('[name="id"]').value,
          quantity: form.querySelector('[name="quantity"]')?.value || 1
        })
      })
      .then(response => response.json())
      .then(data => {
        // Update cart count
        updateCartCount();
        
        // Show success message
        showNotification('Product added to cart!', 'success');
        
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding product to cart', 'error');
        
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      });
    });
  });

  // Quick Add to Cart Buttons
  const quickAddButtons = document.querySelectorAll('.quick-add-btn');
  quickAddButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const variantId = this.dataset.variantId;
      const originalText = this.textContent;
      
      this.disabled = true;
      this.innerHTML = '<span class="spinner"></span>';
      
      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: variantId,
          quantity: 1
        })
      })
      .then(response => response.json())
      .then(data => {
        updateCartCount();
        showNotification('Product added to cart!', 'success');
        
        this.disabled = false;
        this.textContent = originalText;
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('Error adding product to cart', 'error');
        
        this.disabled = false;
        this.textContent = originalText;
      });
    });
  });

  // Mobile Menu Toggle
  const mobileMenuButton = document.querySelector('.mobile-menu-button');
  const mobileMenu = document.querySelector('.mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');
      this.classList.toggle('active');
    });
  }

  // Search Functionality
  const searchInput = document.querySelector('.search-input');
  const searchResults = document.querySelector('.search-results');
  
  if (searchInput && searchResults) {
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      const query = this.value.trim();
      
      if (query.length < 2) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
        return;
      }
      
      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, 300);
    });
  }

  // Smooth Scrolling for Anchor Links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Image Lazy Loading
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => {
    imageObserver.observe(img);
  });

  // Variant Selection
  const variantSelectors = document.querySelectorAll('.variant-selector');
  variantSelectors.forEach(selector => {
    selector.addEventListener('change', function() {
      updateProductInfo(this.value);
    });
  });

  // Wishlist Functionality
  const wishlistButtons = document.querySelectorAll('.wishlist-btn');
  wishlistButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const productId = this.dataset.productId;
      const isWishlisted = this.classList.contains('wishlisted');
      
      if (isWishlisted) {
        removeFromWishlist(productId);
        this.classList.remove('wishlisted');
        showNotification('Removed from wishlist', 'info');
      } else {
        addToWishlist(productId);
        this.classList.add('wishlisted');
        showNotification('Added to wishlist', 'success');
      }
    });
  });

  // Newsletter Signup
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = this.querySelector('input[type="email"]').value;
      const submitButton = this.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      
      submitButton.disabled = true;
      submitButton.textContent = 'Subscribing...';
      
      // Simulate newsletter signup (replace with actual implementation)
      setTimeout(() => {
        showNotification('Successfully subscribed to newsletter!', 'success');
        this.reset();
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }, 1000);
    });
  }

  // Initialize tooltips
  initializeTooltips();
  
  // Initialize animations
  initializeAnimations();
});

// Helper Functions

function updateCart() {
  const cartForm = document.querySelector('.cart');
  if (!cartForm) return;
  
  const formData = new FormData(cartForm);
  
  fetch('/cart/update.js', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(cart => {
    updateCartCount();
    updateCartTotal(cart.total_price);
  })
  .catch(error => {
    console.error('Error updating cart:', error);
    showNotification('Error updating cart', 'error');
  });
}

function updateCartCount() {
  fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      const cartCountElements = document.querySelectorAll('.cart-count');
      cartCountElements.forEach(element => {
        element.textContent = cart.item_count;
      });
    })
    .catch(error => {
      console.error('Error fetching cart:', error);
    });
}

function updateCartTotal(totalPrice) {
  const cartTotalElements = document.querySelectorAll('.cart-total');
  cartTotalElements.forEach(element => {
    element.textContent = formatMoney(totalPrice);
  });
}

function updateProductInfo(variantId) {
  // Find variant data and update price, availability, etc.
  const priceElement = document.querySelector('.product-price');
  const addToCartButton = document.querySelector('.add-to-cart-btn');
  
  // This would typically fetch variant data from Shopify
  // For now, we'll update the form's variant ID
  const hiddenInput = document.querySelector('input[name="id"]');
  if (hiddenInput) {
    hiddenInput.value = variantId;
  }
}

function performSearch(query) {
  const searchResults = document.querySelector('.search-results');
  
  fetch(`/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5`)
    .then(response => response.json())
    .then(data => {
      displaySearchResults(data.resources.results.products);
    })
    .catch(error => {
      console.error('Search error:', error);
    });
}

function displaySearchResults(products) {
  const searchResults = document.querySelector('.search-results');
  
  if (!products || products.length === 0) {
    searchResults.innerHTML = '<p class="no-results">No products found</p>';
    searchResults.style.display = 'block';
    return;
  }
  
  const resultsHTML = products.map(product => `
    <div class="search-result-item">
      <a href="${product.url}" class="search-result-link">
        <img src="${product.featured_image}" alt="${product.title}" class="search-result-image">
        <div class="search-result-info">
          <h4>${product.title}</h4>
          <p>${formatMoney(product.price)}</p>
        </div>
      </a>
    </div>
  `).join('');
  
  searchResults.innerHTML = resultsHTML;
  searchResults.style.display = 'block';
}

function addToWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  if (!wishlist.includes(productId)) {
    wishlist.push(productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }
}

function removeFromWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  wishlist = wishlist.filter(id => id !== productId);
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

function formatMoney(cents) {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
}

function initializeTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  
  tooltipElements.forEach(element => {
    element.addEventListener('mouseenter', function() {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.textContent = this.dataset.tooltip;
      document.body.appendChild(tooltip);
      
      const rect = this.getBoundingClientRect();
      tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
      tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
      
      this._tooltip = tooltip;
    });
    
    element.addEventListener('mouseleave', function() {
      if (this._tooltip) {
        document.body.removeChild(this._tooltip);
        this._tooltip = null;
      }
    });
  });
}

function initializeAnimations() {
  // Fade in elements when they come into view
  const animatedElements = document.querySelectorAll('.fade-in-on-scroll');
  
  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
      }
    });
  });
  
  animatedElements.forEach(element => {
    animationObserver.observe(element);
  });
}

// Global error handler
window.addEventListener('error', function(e) {
  console.error('JavaScript error:', e.error);
  showNotification('An error occurred. Please try again.', 'error');
});













templates/collection.liquid

---
layout: theme
---

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Collection Header -->
  <div class="text-center mb-12">
    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">{{ collection.title }}</h1>
    {% if collection.description != blank %}
      <div class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        {{ collection.description }}
      </div>
    {% endif %}
    
    <div class="mt-6">
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ collection.products_count }} {% if collection.products_count == 1 %}product{% else %}products{% endif %}
      </span>
    </div>
  </div>

  <!-- Filters and Sorting -->
  <div class="flex flex-col md:flex-row justify-between items-center mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
    <!-- Filter by availability -->
    <div class="flex items-center space-x-4 mb-4 md:mb-0">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</label>
      <select id="availability-filter" class="form-input py-2 px-3 text-sm">
        <option value="">All Products</option>
        <option value="available">Available</option>
        <option value="sold-out">Sold Out</option>
      </select>
    </div>

    <!-- Sort Options -->
    <div class="flex items-center space-x-4">
      <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
      <select id="sort-by" class="form-input py-2 px-3 text-sm">
        <option value="manual">Featured</option>
        <option value="best-selling">Best Selling</option>
        <option value="title-ascending">A-Z</option>
        <option value="title-descending">Z-A</option>
        <option value="price-ascending">Price: Low to High</option>
        <option value="price-descending">Price: High to Low</option>
        <option value="created-ascending">Oldest First</option>
        <option value="created-descending">Newest First</option>
      </select>
    </div>
  </div>

  <!-- Products Grid -->
  {% if collection.products.size > 0 %}
    <div class="product-grid" id="products-grid">
      {% for product in collection.products %}
        <div class="product-card fade-in-on-scroll" data-available="{{ product.available }}" data-price="{{ product.price }}">
          <!-- Product Image -->
          <div class="relative overflow-hidden">
            {% if product.featured_image %}
              <a href="{{ product.url }}">
                <img src="{{ product.featured_image | img_url: '400x300' }}" 
                     alt="{{ product.title }}" 
                     class="product-image w-full h-48 object-cover">
              </a>
            {% else %}
              <div class="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
            {% endif %}
            
            <!-- Sale Badge -->
            {% if product.compare_at_price > product.price %}
              <div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                SALE
              </div>
            {% endif %}
            
            <!-- Sold Out Badge -->
            {% unless product.available %}
              <div class="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-sm font-semibold">
                SOLD OUT
              </div>
            {% endunless %}
            
            <!-- Quick Add Button -->
            {% if product.available %}
              <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button class="quick-add-btn bg-brand-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-dark transition-colors"
                        data-variant-id="{{ product.selected_or_first_available_variant.id }}">
                  Quick Add
                </button>
              </div>
            {% endif %}
          </div>

          <!-- Product Info -->
          <div class="product-info p-4">
            <a href="{{ product.url }}" class="block">
              <h3 class="product-title text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-brand-green transition-colors">
                {{ product.title }}
              </h3>
            </a>
            
            {% if product.description != blank %}
              <p class="product-description text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                {{ product.description | strip_html | truncate: 100 }}
              </p>
            {% endif %}
            
            <!-- Price -->
            <div class="flex items-center justify-between mb-3">
              <div class="price-wrapper">
                {% if product.compare_at_price > product.price %}
                  <span class="product-price text-xl font-bold text-brand-green">{{ product.price | money }}</span>
                  <span class="compare-price text-sm text-gray-500 line-through ml-2">{{ product.compare_at_price | money }}</span>
                {% else %}
                  <span class="product-price text-xl font-bold text-brand-green">{{ product.price | money }}</span>
                {% endif %}
              </div>
              
              <!-- Wishlist Button -->
              <button class="wishlist-btn p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      data-product-id="{{ product.id }}">
                <svg class="w-5 h-5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </button>
            </div>
            
            <!-- Add to Cart Button -->
            {% if product.available %}
              <form action="/cart/add" method="post" enctype="multipart/form-data" class="product-form">
                <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">
                <button type="submit" class="w-full btn btn-primary">
                  Add to Cart - {{ product.price | money }}
                </button>
              </form>
            {% else %}
              <button class="w-full btn btn-secondary opacity-50 cursor-not-allowed" disabled>
                Sold Out
              </button>
            {% endif %}
          </div>
        </div>
      {% endfor %}
    </div>

    <!-- Pagination -->
    {% if paginate.pages > 1 %}
      <nav class="mt-12" aria-label="Pagination Navigation">
        <div class="flex justify-center">
          <div class="flex items-center space-x-2">
            {% if paginate.previous %}
              <a href="{{ paginate.previous.url }}" class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Previous
              </a>
            {% endif %}
            
            {% for part in paginate.parts %}
              {% if part.is_link %}
                <a href="{{ part.url }}" class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  {{ part.title }}
                </a>
              {% else %}
                {% if part.title == paginate.current_page %}
                  <span class="px-3 py-2 rounded-lg bg-brand-green text-white font-semibold">
                    {{ part.title }}
                  </span>
                {% else %}
                  <span class="px-3 py-2 text-gray-500 dark:text-gray-400">
                    {{ part.title }}
                  </span>
                {% endif %}
              {% endif %}
            {% endfor %}
            
            {% if paginate.next %}
              <a href="{{ paginate.next.url }}" class="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Next
              </a>
            {% endif %}
          </div>
        </div>
      </nav>
    {% endif %}

  {% else %}
    <!-- Empty State -->
    <div class="text-center py-16">
      <svg class="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
      </svg>
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">This collection is empty or all products are currently unavailable.</p>
      <a href="/collections" class="btn btn-primary">
        Browse All Collections
      </a>
    </div>
  {% endif %}
</div>

<script>
// Collection page functionality
document.addEventListener('DOMContentLoaded', function() {
  const sortSelect = document.getElementById('sort-by');
  const filterSelect = document.getElementById('availability-filter');
  const productsGrid = document.getElementById('products-grid');
  
  // Sort functionality
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const sortValue = this.value;
      const url = new URL(window.location);
      url.searchParams.set('sort_by', sortValue);
      window.location.href = url.toString();
    });
    
    // Set current sort value from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentSort = urlParams.get('sort_by');
    if (currentSort) {
      sortSelect.value = currentSort;
    }
  }
  
  // Filter functionality (client-side)
  if (filterSelect && productsGrid) {
    filterSelect.addEventListener('change', function() {
      const filterValue = this.value;
      const products = productsGrid.querySelectorAll('.product-card');
      
      products.forEach(product => {
        const isAvailable = product.dataset.available === 'true';
        let shouldShow = true;
        
        if (filterValue === 'available' && !isAvailable) {
          shouldShow = false;
        } else if (filterValue === 'sold-out' && isAvailable) {
          shouldShow = false;
        }
        
        product.style.display = shouldShow ? 'block' : 'none';
      });
    });
  }
});
</script>
