/**
 * GrowUp Dubai Shopify Theme - Main JavaScript File
 * 
 * This file contains all the main functionality for the GrowUp Dubai theme:
 * - Theme initialization
 * - Cart functionality
 * - Product interactions
 * - UI components
 * - Theme switcher
 * - Platform-specific features
 */

'use strict';

// Global theme object
window.GrowUpDubai = window.GrowUpDubai || {};

(function() {
  
  // Theme configuration
  const config = {
    animations: {
      duration: 300,
      easing: 'ease-in-out'
    },
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    },
    cart: {
      updateDelay: 500
    }
  };

  // Utility functions
  const utils = {
    // Debounce function
    debounce: function(func, wait, immediate) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          timeout = null;
          if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
      };
    },

    // Throttle function
    throttle: function(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    // Get current breakpoint
    getCurrentBreakpoint: function() {
      const width = window.innerWidth;
      if (width < config.breakpoints.mobile) return 'mobile';
      if (width < config.breakpoints.tablet) return 'tablet';
      if (width < config.breakpoints.desktop) return 'desktop';
      return 'large';
    },

    // Animate element
    animate: function(element, animation, duration = config.animations.duration) {
      return new Promise(resolve => {
        element.style.animationDuration = `${duration}ms`;
        element.classList.add(animation);
        
        const handleAnimationEnd = () => {
          element.classList.remove(animation);
          element.removeEventListener('animationend', handleAnimationEnd);
          resolve();
        };
        
        element.addEventListener('animationend', handleAnimationEnd);
      });
    },

    // Format money
    formatMoney: function(amount, format = '${{amount}}') {
      const moneyString = (amount / 100).toFixed(2);
      return format.replace('{{amount}}', moneyString);
    },

    // Get platform from product type or tags
    getPlatform: function(product) {
      if (!product) return null;
      
      const type = (product.type || '').toLowerCase();
      const tags = (product.tags || []).map(tag => tag.toLowerCase());
      
      if (type.includes('instagram') || tags.includes('platform-instagram')) return 'instagram';
      if (type.includes('tiktok') || tags.includes('platform-tiktok')) return 'tiktok';
      if (type.includes('youtube') || tags.includes('platform-youtube')) return 'youtube';
      
      return null;
    },

    // Show toast notification
    showToast: function(message, type = 'info', duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;
      toast.innerHTML = `
        <div class="toast__content">
          <span class="toast__message">${message}</span>
          <button class="toast__close" aria-label="Close">&times;</button>
        </div>
      `;
      
      document.body.appendChild(toast);
      
      // Show toast
      requestAnimationFrame(() => {
        toast.classList.add('toast--show');
      });
      
      // Auto hide
      setTimeout(() => {
        this.hideToast(toast);
      }, duration);
      
      // Close button
      toast.querySelector('.toast__close').addEventListener('click', () => {
        this.hideToast(toast);
      });
      
      return toast;
    },

    hideToast: function(toast) {
      toast.classList.remove('toast--show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, config.animations.duration);
    }
  };

  // Theme switcher functionality
  const themeSwitcher = {
    init: function() {
      this.bindEvents();
      this.loadSavedTheme();
    },

    bindEvents: function() {
      const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
      toggleButtons.forEach(button => {
        button.addEventListener('click', this.toggleTheme.bind(this));
      });
    },

    toggleTheme: function() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      this.setTheme(newTheme);
      this.saveTheme(newTheme);
      this.updateToggleButtons(newTheme);
    },

    setTheme: function(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.classList.toggle('dark-mode', theme === 'dark');
    },

    saveTheme: function(theme) {
      localStorage.setItem('growup-theme', theme);
    },

    loadSavedTheme: function() {
      const savedTheme = localStorage.getItem('growup-theme') || 'light';
      this.setTheme(savedTheme);
      this.updateToggleButtons(savedTheme);
    },

    updateToggleButtons: function(theme) {
      const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
      toggleButtons.forEach(button => {
        const sunIcon = button.querySelector('.sun-icon');
        const moonIcon = button.querySelector('.moon-icon');
        
        if (sunIcon && moonIcon) {
          sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
          moonIcon.style.display = theme === 'dark' ? 'none' : 'block';
        }
      });
    }
  };

  // Cart functionality
  const cart = {
    init: function() {
      this.bindEvents();
      this.updateCartCount();
    },

    bindEvents: function() {
      // Add to cart forms
      document.addEventListener('submit', (e) => {
        if (e.target.matches('.product-form, .product-card-form')) {
          e.preventDefault();
          this.addToCart(e.target);
        }
      });

      // Cart update forms
      document.addEventListener('submit', (e) => {
        if (e.target.matches('.cart-form')) {
          e.preventDefault();
          this.updateCart(e.target);
        }
      });

      // Quantity changes
      document.addEventListener('change', (e) => {
        if (e.target.matches('[data-quantity-input]')) {
          utils.debounce(() => {
            this.updateCartQuantity(e.target);
          }, config.cart.updateDelay)();
        }
      });

      // Quantity buttons
      document.addEventListener('click', (e) => {
        if (e.target.matches('.quantity-button, .quantity-btn')) {
          this.handleQuantityButton(e.target);
        }
      });
    },

    addToCart: function(form) {
      const button = form.querySelector('[type="submit"]');
      const originalText = button.textContent;
      
      this.setButtonLoading(button, 'Adding...');
      
      const formData = new FormData(form);
      
      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        this.setButtonSuccess(button, 'Added!');
        this.updateCartCount();
        utils.showToast('Product added to cart!', 'success');
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('cart:item-added', {
          detail: { item: data }
        }));
        
        setTimeout(() => {
          this.resetButton(button, originalText);
        }, 2000);
      })
      .catch(error => {
        console.error('Error adding to cart:', error);
        this.setButtonError(button, 'Error - Try Again');
        utils.showToast('Error adding product to cart', 'error');
        
        setTimeout(() => {
          this.resetButton(button, originalText);
        }, 3000);
      });
    },

    updateCart: function(form) {
      const formData = new FormData(form);
      
      fetch('/cart/update.js', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        this.updateCartCount();
        utils.showToast('Cart updated!', 'success');
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { cart: data }
        }));
      })
      .catch(error => {
        console.error('Error updating cart:', error);
        utils.showToast('Error updating cart', 'error');
      });
    },

    updateCartQuantity: function(input) {
      const key = input.closest('[data-key]')?.getAttribute('data-key');
      if (!key) return;
      
      const quantity = parseInt(input.value) || 0;
      
      fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: key,
          quantity: quantity
        })
      })
      .then(response => response.json())
      .then(data => {
        this.updateCartCount();
        
        if (quantity === 0) {
          const item = input.closest('.cart-item');
          if (item) {
            utils.animate(item, 'fade-out').then(() => {
              item.remove();
            });
          }
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('cart:quantity-changed', {
          detail: { cart: data, key: key, quantity: quantity }
        }));
      })
      .catch(error => {
        console.error('Error updating quantity:', error);
        utils.showToast('Error updating quantity', 'error');
      });
    },

    handleQuantityButton: function(button) {
      const action = button.getAttribute('data-action') || 
                   (button.getAttribute('name') === 'plus' ? 'increase' : 'decrease');
      const input = button.parentNode.querySelector('input[type="number"]');
      
      if (!input) return;
      
      let currentValue = parseInt(input.value) || 1;
      
      if (action === 'increase') {
        input.value = currentValue + 1;
      } else if (action === 'decrease' && currentValue > 1) {
        input.value = currentValue - 1;
      }
      
      // Trigger change event
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },

    updateCartCount: function() {
      fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
          const countElements = document.querySelectorAll('[data-cart-count]');
          countElements.forEach(element => {
            element.textContent = cart.item_count;
            element.setAttribute('data-cart-count', cart.item_count);
            
            // Hide if empty
            if (cart.item_count === 0) {
              element.style.display = 'none';
            } else {
              element.style.display = '';
            }
          });
        })
        .catch(error => {
          console.error('Error fetching cart:', error);
        });
    },

    setButtonLoading: function(button, text) {
      button.disabled = true;
      button.innerHTML = `<span class="loading-spinner"></span> ${text}`;
    },

    setButtonSuccess: function(button, text) {
      button.innerHTML = `<span>✓</span> ${text}`;
      button.style.background = 'linear-gradient(135deg, #27AE60, #2ECC71)';
    },

    setButtonError: function(button, text) {
      button.innerHTML = `<span>⚠</span> ${text}`;
      button.style.background = 'linear-gradient(135deg, #E74C3C, #C0392B)';
    },

    resetButton: function(button, originalText) {
      button.disabled = false;
      button.innerHTML = originalText;
      button.style.background = '';
    }
  };

  // Product functionality
  const product = {
    init: function() {
      this.bindEvents();
      this.initVariantSelection();
      this.initImageGallery();
    },

    bindEvents: function() {
      // Variant selectors
      document.addEventListener('change', (e) => {
        if (e.target.matches('select[name^="options"]')) {
          this.updateVariant();
        }
      });

      // Product tabs
      document.addEventListener('click', (e) => {
        if (e.target.matches('.tab-button')) {
          this.switchTab(e.target);
        }
      });

      // Product thumbnails
      document.addEventListener('click', (e) => {
        if (e.target.matches('.product-thumbnail, .product-thumbnail img')) {
          const thumbnail = e.target.closest('.product-thumbnail');
          this.switchMainImage(thumbnail);
        }
      });
    },

    initVariantSelection: function() {
      const selects = document.querySelectorAll('select[name^="options"]');
      if (selects.length > 0) {
        this.updateVariant();
      }
    },

    updateVariant: function() {
      const selects = document.querySelectorAll('select[name^="options"]');
      const selectedOptions = Array.from(selects).map(select => select.value);
      
      if (window.productVariants) {
        const matchedVariant = window.productVariants.find(variant => {
          return variant.options.every((option, index) => option === selectedOptions[index]);
        });
        
        if (matchedVariant) {
          this.updatePrice(matchedVariant);
          this.updateAvailability(matchedVariant);
          this.updateVariantId(matchedVariant.id);
          
          if (matchedVariant.featured_media) {
            this.updateMainImage(matchedVariant.featured_media);
          }
        }
      }
    },

    updatePrice: function(variant) {
      const priceElements = document.querySelectorAll('.price');
      priceElements.forEach(element => {
        const salePrice = element.querySelector('.price__sale, .price');
        const regularPrice = element.querySelector('.price__regular');
        
        if (salePrice) {
          salePrice.textContent = utils.formatMoney(variant.price);
        }
        
        if (regularPrice && variant.compare_at_price > variant.price) {
          regularPrice.textContent = utils.formatMoney(variant.compare_at_price);
          regularPrice.style.display = '';
          element.classList.add('price--on-sale');
        } else if (regularPrice) {
          regularPrice.style.display = 'none';
          element.classList.remove('price--on-sale');
        }
      });
    },

    updateAvailability: function(variant) {
      const addButton = document.querySelector('.product-form-cart-button');
      const buttonText = addButton?.querySelector('span');
      
      if (!addButton) return;
      
      if (variant.available) {
        addButton.disabled = false;
        if (buttonText) buttonText.textContent = 'Add to Cart';
        addButton.classList.remove('btn--sold-out');
        addButton.classList.add('btn--primary');
      } else {
        addButton.disabled = true;
        if (buttonText) buttonText.textContent = 'Sold Out';
        addButton.classList.remove('btn--primary');
        addButton.classList.add('btn--sold-out');
      }
    },

    updateVariantId: function(variantId) {
      const hiddenInput = document.querySelector('input[name="id"]');
      if (hiddenInput) {
        hiddenInput.value = variantId;
      }
    },

    updateMainImage: function(media) {
      const mainImage = document.querySelector('#ProductMainImage');
      if (mainImage && media) {
        const newSrc = media.src || media.preview_image?.src;
        if (newSrc) {
          mainImage.src = newSrc.replace(/\.(jpg|jpeg|png|gif|webp)/, '_800x800.$1');
          mainImage.alt = media.alt || '';
        }
      }
    },

    switchTab: function(button) {
      const tabId = button.getAttribute('data-tab');
      const tabContent = document.querySelector(`#tab-${tabId}`);
      
      if (!tabContent) return;
      
      // Remove active classes
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Add active classes
      button.classList.add('active');
      tabContent.classList.add('active');
    },

    switchMainImage: function(thumbnail) {
      const mainImage = document.querySelector('#ProductMainImage');
      const thumbnailImg = thumbnail.querySelector('img');
      
      if (!mainImage || !thumbnailImg) return;
      
      // Remove active class from all thumbnails
      document.querySelectorAll('.product-thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
      });
      
      // Add active class to clicked thumbnail
      thumbnail.classList.add('active');
      
      // Update main image
      const newSrc = thumbnailImg.src.replace(/_(150x150|100x100)/, '_800x800');
      mainImage.src = newSrc;
      mainImage.alt = thumbnailImg.alt;
    },

    initImageGallery: function() {
      // Set first thumbnail as active by default
      const firstThumbnail = document.querySelector('.product-thumbnail');
      if (firstThumbnail) {
        firstThumbnail.classList.add('active');
      }
    }
  };

  // Collection/Search functionality
  const collection = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      // Sort dropdown
      const sortSelect = document.querySelector('#SortBy');
      if (sortSelect) {
        sortSelect.addEventListener('change', this.handleSort.bind(this));
      }

      // Filter buttons
      document.addEventListener('click', (e) => {
        if (e.target.matches('.filter-option')) {
          this.handleFilter(e.target);
        }
      });
    },

    handleSort: function(select) {
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', select.value);
      window.location.href = url.toString();
    },

    handleFilter: function(filterButton) {
      // Add loading state
      filterButton.classList.add('loading');
      
      // Navigate to filtered URL
      window.location.href = filterButton.href;
    }
  };

  // Mobile menu functionality
  const mobileMenu = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      const toggleButton = document.querySelector('.mobile-menu-toggle');
      const closeButton = document.querySelector('.mobile-menu-close');
      const menu = document.querySelector('.mobile-menu');
      
      if (toggleButton) {
        toggleButton.addEventListener('click', this.openMenu.bind(this));
      }
      
      if (closeButton) {
        closeButton.addEventListener('click', this.closeMenu.bind(this));
      }
      
      if (menu) {
        menu.addEventListener('click', (e) => {
          if (e.target === menu) {
            this.closeMenu();
          }
        });
      }
      
      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeMenu();
        }
      });
    },

    openMenu: function() {
      const menu = document.querySelector('.mobile-menu');
      if (menu) {
        menu.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    },

    closeMenu: function() {
      const menu = document.querySelector('.mobile-menu');
      if (menu) {
        menu.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  };

  // FAQ functionality
  const faq = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      document.addEventListener('click', (e) => {
        if (e.target.matches('.faq-question')) {
          this.toggleFaq(e.target);
        }
      });
    },

    toggleFaq: function(question) {
      const faqItem = question.closest('.faq-item');
      const isActive = faqItem.classList.contains('active');
      
      // Close all FAQ items
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Open clicked item if it wasn't active
      if (!isActive) {
        faqItem.classList.add('active');
      }
    }
  };

  // Platform-specific functionality
  const platformFeatures = {
    init: function() {
      this.initNotifications();
      this.initPlatformSwitching();
    },

    initNotifications: function() {
      this.startNotificationCycle();
    },

    startNotificationCycle: function() {
      const notifications = [
        '5,000 Instagram followers delivered',
        '2,500 TikTok likes delivered',
        '10,000 YouTube views delivered',
        '1,000 Instagram likes delivered',
        '3,000 TikTok followers delivered'
      ];
      
      let currentIndex = 0;
      
      const updateNotification = () => {
        const notificationElement = document.querySelector('.notification-text');
        if (notificationElement) {
          notificationElement.textContent = notifications[currentIndex];
          currentIndex = (currentIndex + 1) % notifications.length;
        }
      };
      
      // Update immediately and then every 5-10 seconds
      updateNotification();
      setInterval(updateNotification, Math.random() * 5000 + 5000);
    },

    initPlatformSwitching: function() {
      // Platform cards in carousel
      document.addEventListener('click', (e) => {
        if (e.target.closest('.platform-card')) {
          const card = e.target.closest('.platform-card');
          this.selectPlatform(card);
        }
      });
    },

    selectPlatform: function(card) {
      const platform = card.dataset.platform;
      if (!platform) return;
      
      // Update active state
      document.querySelectorAll('.platform-card').forEach(c => {
        c.classList.remove('active');
      });
      card.classList.add('active');
      
      // Update page content based on platform
      this.updatePlatformContent(platform);
    },

    updatePlatformContent: function(platform) {
      // Update hero text
      const heroTitle = document.querySelector('.hero-title');
      const heroSubtitle = document.querySelector('.hero-subtitle');
      
      if (heroTitle) {
        const serviceType = platform === 'YouTube' ? 'subscribers' : 'followers';
        heroTitle.innerHTML = `Get real Arab ${platform}<br>${serviceType} in seconds! <img src="/assets/uae-flag.gif" alt="UAE Flag" class="hero-flag">`;
      }
      
      // Update service listings
      this.updateServiceListings(platform);
    },

    updateServiceListings: function(platform) {
      const serviceElements = document.querySelectorAll('.service-item');
      serviceElements.forEach(element => {
        const servicePlatform = element.dataset.platform;
        if (servicePlatform) {
          element.style.display = servicePlatform === platform ? 'block' : 'none';
        }
      });
    }
  };

  // Scroll effects
  const scrollEffects = {
    init: function() {
      this.bindEvents();
      this.initStickyHeader();
    },

    bindEvents: function() {
      window.addEventListener('scroll', utils.throttle(() => {
        // Scroll effects (continuazione)
const scrollEffects = {
    init: function() {
      this.bindEvents();
      this.initStickyHeader();
    },

    bindEvents: function() {
      window.addEventListener('scroll', utils.throttle(() => {
        this.updateStickyHeader();
        this.updateScrollProgress();
      }, 16));
    },

    initStickyHeader: function() {
      this.header = document.querySelector('.site-header');
      this.headerHeight = this.header ? this.header.offsetHeight : 0;
    },

    updateStickyHeader: function() {
      if (!this.header) return;
      
      const scrollY = window.scrollY;
      
      if (scrollY > 100) {
        this.header.classList.add('scrolled');
      } else {
        this.header.classList.remove('scrolled');
      }
    },

    updateScrollProgress: function() {
      const progressBar = document.querySelector('.scroll-progress');
      if (!progressBar) return;
      
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      progressBar.style.width = `${scrollPercent}%`;
    }
  };

  // Form validation
  const forms = {
    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      document.addEventListener('submit', (e) => {
        if (e.target.matches('.validate-form')) {
          if (!this.validateForm(e.target)) {
            e.preventDefault();
          }
        }
      });

      // Real-time validation
      document.addEventListener('blur', (e) => {
        if (e.target.matches('.form-control')) {
          this.validateField(e.target);
        }
      }, true);
    },

    validateForm: function(form) {
      const fields = form.querySelectorAll('.form-control[required]');
      let isValid = true;

      fields.forEach(field => {
        if (!this.validateField(field)) {
          isValid = false;
        }
      });

      return isValid;
    },

    validateField: function(field) {
      const value = field.value.trim();
      const type = field.type;
      let isValid = true;
      let errorMessage = '';

      // Required validation
      if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
      }

      // Email validation
      if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
      }

      // Phone validation
      if (type === 'tel' && value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          isValid = false;
          errorMessage = 'Please enter a valid phone number';
        }
      }

      this.showFieldValidation(field, isValid, errorMessage);
      return isValid;
    },

    showFieldValidation: function(field, isValid, errorMessage) {
      const formGroup = field.closest('.form-group');
      const errorElement = formGroup?.querySelector('.form-error');

      // Remove previous validation classes
      field.classList.remove('form-control--error', 'form-control--success');

      if (isValid) {
        field.classList.add('form-control--success');
        if (errorElement) {
          errorElement.textContent = '';
          errorElement.style.display = 'none';
        }
      } else {
        field.classList.add('form-control--error');
        if (errorElement) {
          errorElement.textContent = errorMessage;
          errorElement.style.display = 'block';
        }
      }
    }
  };

  // Search functionality
  const search = {
    init: function() {
      this.bindEvents();
      this.initPredictiveSearch();
    },

    bindEvents: function() {
      const searchForms = document.querySelectorAll('.search-form');
      searchForms.forEach(form => {
        form.addEventListener('submit', this.handleSearch.bind(this));
      });

      const searchInputs = document.querySelectorAll('.search-input');
      searchInputs.forEach(input => {
        input.addEventListener('input', utils.debounce(this.handlePredictiveSearch.bind(this), 300));
        input.addEventListener('focus', this.showPredictiveSearch.bind(this));
        input.addEventListener('blur', this.hidePredictiveSearch.bind(this));
      });
    },

    handleSearch: function(e) {
      e.preventDefault();
      const form = e.target;
      const query = form.querySelector('.search-input').value.trim();
      
      if (query) {
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
      }
    },

    initPredictiveSearch: function() {
      // Initialize predictive search if enabled
      if (window.routes && window.routes.predictive_search_url) {
        this.predictiveSearchEnabled = true;
      }
    },

    handlePredictiveSearch: function(e) {
      if (!this.predictiveSearchEnabled) return;
      
      const query = e.target.value.trim();
      if (query.length < 2) {
        this.hidePredictiveSearch();
        return;
      }

      this.performPredictiveSearch(query);
    },

    performPredictiveSearch: function(query) {
      const url = `${window.routes.predictive_search_url}?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5`;
      
      fetch(url)
        .then(response => response.text())
        .then(html => {
          this.showPredictiveResults(html);
        })
        .catch(error => {
          console.error('Predictive search error:', error);
        });
    },

    showPredictiveResults: function(html) {
      let resultsContainer = document.querySelector('.predictive-search-results');
      
      if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'predictive-search-results';
        document.body.appendChild(resultsContainer);
      }
      
      resultsContainer.innerHTML = html;
      resultsContainer.style.display = 'block';
    },

    showPredictiveSearch: function() {
      const resultsContainer = document.querySelector('.predictive-search-results');
      if (resultsContainer && resultsContainer.innerHTML.trim()) {
        resultsContainer.style.display = 'block';
      }
    },

    hidePredictiveSearch: function() {
      setTimeout(() => {
        const resultsContainer = document.querySelector('.predictive-search-results');
        if (resultsContainer) {
          resultsContainer.style.display = 'none';
        }
      }, 200);
    }
  };

  // Performance optimizations
  const performance = {
    init: function() {
      this.lazyLoadImages();
      this.preloadCriticalResources();
    },

    lazyLoadImages: function() {
      const images = document.querySelectorAll('img[data-src]');
      
      if ('IntersectionObserver' in window) {
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

        images.forEach(img => imageObserver.observe(img));
      } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach(img => {
          img.src = img.dataset.src;
          img.classList.remove('lazy');
        });
      }
    },

    preloadCriticalResources: function() {
      // Preload critical CSS and fonts
      const criticalResources = [
        '/assets/application.css',
        'https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap'
      ];

      criticalResources.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = href.includes('.css') ? 'style' : 'font';
        if (href.includes('font')) {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
      });
    }
  };

  // Analytics and tracking
  const analytics = {
    init: function() {
      this.trackPageView();
      this.bindEvents();
    },

    bindEvents: function() {
      // Track add to cart events
      document.addEventListener('cart:item-added', (e) => {
        this.trackAddToCart(e.detail.item);
      });

      // Track product views
      if (document.body.classList.contains('template-product')) {
        this.trackProductView();
      }

      // Track search
      document.addEventListener('submit', (e) => {
        if (e.target.matches('.search-form')) {
          const query = e.target.querySelector('.search-input').value;
          this.trackSearch(query);
        }
      });
    },

    trackPageView: function() {
      if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
          page_title: document.title,
          page_location: window.location.href
        });
      }
    },

    trackAddToCart: function(item) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'add_to_cart', {
          currency: 'USD',
          value: item.price / 100,
          items: [{
            item_id: item.variant_id,
            item_name: item.product_title,
            category: utils.getPlatform(item) || 'Social Media Service',
            quantity: item.quantity,
            price: item.price / 100
          }]
        });
      }
    },

    trackProductView: function() {
      const productData = window.product;
      if (productData && typeof gtag !== 'undefined') {
        gtag('event', 'view_item', {
          currency: 'USD',
          value: productData.price / 100,
          items: [{
            item_id: productData.id,
            item_name: productData.title,
            category: utils.getPlatform(productData) || 'Social Media Service',
            price: productData.price / 100
          }]
        });
      }
    },

    trackSearch: function(query) {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'search', {
          search_term: query
        });
      }
    }
  };

  // Initialize everything when DOM is ready
  function init() {
    // Core functionality
    themeSwitcher.init();
    cart.init();
    product.init();
    collection.init();
    mobileMenu.init();
    faq.init();
    forms.init();
    search.init();
    scrollEffects.init();
    
    // Platform-specific features
    platformFeatures.init();
    
    // Performance optimizations
    performance.init();
    
    // Analytics
    analytics.init();

    // Add toast styles if not already present
    if (!document.querySelector('#toast-styles')) {
      const toastStyles = document.createElement('style');
      toastStyles.id = 'toast-styles';
      toastStyles.textContent = `
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: var(--z-toast, 1080);
          min-width: 300px;
          max-width: 400px;
          background: white;
          border-radius: var(--border-radius-md, 0.5rem);
          box-shadow: var(--shadow-xl, 0 20px 25px rgba(0,0,0,0.15));
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }
        
        .toast--show {
          transform: translateX(0);
        }
        
        .toast__content {
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        
        .toast__message {
          flex: 1;
          font-weight: 600;
        }
        
        .toast__close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.3s ease;
        }
        
        .toast__close:hover {
          opacity: 1;
        }
        
        .toast--success {
          border-left: 4px solid var(--color-success, #27AE60);
        }
        
        .toast--error {
          border-left: 4px solid var(--color-error, #E74C3C);
        }
        
        .toast--warning {
          border-left: 4px solid var(--color-warning, #F39C12);
        }
        
        .toast--info {
          border-left: 4px solid var(--color-info, #3498DB);
        }
      `;
      document.head.appendChild(toastStyles);
    }

    console.log('🇦🇪 GrowUp Dubai theme initialized successfully!');
  }

  // Expose utilities and modules to global scope
  window.GrowUpDubai = {
    utils,
    cart,
    product,
    themeSwitcher,
    platformFeatures,
    init
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// Additional platform-specific enhancements
document.addEventListener('DOMContentLoaded', function() {
  
  // Enhanced platform switching with smooth animations
  const platformCards = document.querySelectorAll('.platform-card');
  platformCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('fade-in');
    
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Enhanced notification system with realistic timing
  const notificationElement = document.querySelector('.notification-text');
  if (notificationElement) {
    const notifications = [
      { text: '5,000 Instagram followers delivered', platform: 'instagram' },
      { text: '2,500 TikTok likes delivered', platform: 'tiktok' },
      { text: '10,000 YouTube views delivered', platform: 'youtube' },
      { text: '1,000 Instagram likes delivered', platform: 'instagram' },
      { text: '3,000 TikTok followers delivered', platform: 'tiktok' },
      { text: '7,500 YouTube subscribers delivered', platform: 'youtube' }
    ];
    
    let currentIndex = 0;
    
    function updateNotification() {
      const notification = notifications[currentIndex];
      const timeAgo = Math.floor(Math.random() * 120) + 1; // 1-120 seconds ago
      
      notificationElement.textContent = notification.text;
      
      const timeElement = document.querySelector('.notification-time');
      if (timeElement) {
        timeElement.textContent = timeAgo < 60 ? `${timeAgo} sec ago` : `${Math.floor(timeAgo/60)} min ago`;
      }
      
      currentIndex = (currentIndex + 1) % notifications.length;
    }
    
    // Update immediately and then at random intervals
    updateNotification();
    setInterval(updateNotification, Math.random() * 20000 + 10000); // 10-30 seconds
  }

  // Enhanced form handling for Arab/Gulf region
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', function() {
      const email = this.value.toLowerCase();
      
      // Suggest popular Arab domain alternatives
      const arabDomains = ['gmail.com', 'hotmail.com', 'yahoo.com'];
      const commonMistakes = {
        'gmai.com': 'gmail.com',
        'gmial.com': 'gmail.com',
        'hotmai.com': 'hotmail.com',
        'yahooo.com': 'yahoo.com'
      };
      
      for (const [mistake, correction] of Object.entries(commonMistakes)) {
        if (email.includes(mistake)) {
          const correctedEmail = email.replace(mistake, correction);
          if (confirm(`Did you mean: ${correctedEmail}?`)) {
            this.value = correctedEmail;
          }
          break;
        }
      }
    });
  });

  // Platform-specific pricing display
  const priceElements = document.querySelectorAll('.price');
  priceElements.forEach(priceEl => {
    const productCard = priceEl.closest('.card, .product-card');
    if (productCard) {
      const platform = window.GrowUpDubai.utils.getPlatform(productCard.dataset);
      if (platform) {
        priceEl.classList.add(`price--${platform}`);
      }
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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

});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful');
      })
      .catch(function(err) {
        console.log('ServiceWorker registration failed');
      });
  });
}