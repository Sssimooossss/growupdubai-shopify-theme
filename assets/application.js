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