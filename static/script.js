// static/js/main.js - Main JavaScript file

// DOM Elements
const featuredCategories = document.getElementById('featured-categories');
const featuredProducts = document.getElementById('featured-products');
const cartCount = document.getElementById('cart-count');

// API URLs
const API_URL = {
    BASE: 'http://localhost:5000',
    CATEGORIES: '/api/categories',
    PRODUCTS: '/api/products',
    CART: '/api/cart'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load featured categories
    if (featuredCategories) {
        loadFeaturedCategories();
    }
    
    // Load featured products
    if (featuredProducts) {
        loadFeaturedProducts();
    }
    
    // Update cart count
    updateCartCount();
    
    // Add event listeners for add to cart buttons
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-to-cart')) {
            const productId = event.target.getAttribute('data-id');
            addToCart(productId, 1);
        }
    });
});

// Load featured categories
async function loadFeaturedCategories() {
    try {
        const response = await fetch(`${API_URL.CATEGORIES}?featured=true`);
        const categories = await response.json();
        
        if (categories.length > 0) {
            renderCategories(categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Render categories
function renderCategories(categories) {
    featuredCategories.innerHTML = '';
    
    categories.forEach(category => {
        const categoryCard = `
            <div class="category-card">
                <div class="category-image">
                    <img src="${category.image || 'static/images/categories/default-category.jpg'}" alt="${category.name}">
                </div>
                <div class="category-content">
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                    <a href="/products?category=${category.id}" class="btn secondary-btn">Browse</a>
                </div>
            </div>
        `;
        
        featuredCategories.appendChild(categoryCard);
    });
}

// Load featured products
async function loadFeaturedProducts() {
    try {
        const response = await fetch(`${API_URL.PRODUCTS}?featured=true`);
        const products = await response.json();
        
        if (products.length > 0) {
            renderProducts(products);
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Render products
function renderProducts(products) {
    featuredProducts.innerHTML = '';
    
    products.forEach(product => {
        const productCard = `
            <div class="product-card">
                ${product.is_new ? '<span class="product-badge">New</span>' : ''}
                ${product.is_sale ? '<span class="product-badge">Sale</span>' : ''}
                <div class="product-image">
                    <img src="${product.image || 'static/images/products/default-product.jpg'}" alt="${product.name}">
                </div>
                <div class="product-content">
                    <h3>${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-actions">
                        <button class="add-to-cart" data-product-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                        <button class="wishlist-btn"><i class="far fa-heart"></i></button>
                    </div>
                </div>
            </div>
        `;
        
        featuredProducts.appendChild(productCard);
    });
}

// Add product to cart
async function addToCart(productId, quantity = 1) {
    try {
        const response = await fetch(`${API_URL.BASE}${API_URL.CART}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            }),
            credentials: 'include' // Important for cookies
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            updateCartCount();
            showNotification('Product added to cart!', 'success');
            return true;
        } else {
            showNotification(result.error || 'Failed to add product to cart', 'error');
            return false;
        }
    } catch (error) {
        console.error('Cart service error:', error);
        
        // Fallback to localStorage if API fails
        const localCart = JSON.parse(localStorage.getItem('cart')) || { items: [] };
        const existingItem = localCart.items.find(item => item.product_id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            localCart.items.push({ product_id: productId, quantity });
        }
        
        localStorage.setItem('cart', JSON.stringify(localCart));
        updateCartCount();
        showNotification('Added to local cart (offline mode)', 'info');
        return false;
    }
}

// Local storage fallback for cart
function addToCartLocalFallback(productId, quantity) {
    try {
        let cart = JSON.parse(localStorage.getItem('cart')) || { items: [] };
        
        // Find if product already exists in cart
        const existingItem = cart.items.find(item => item.product_id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product_id: productId, quantity });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification('Product added to local cart', 'success');
        return true;
    } catch (error) {
        console.error('Local cart fallback error:', error);
        showNotification('Failed to save cart locally', 'error');
        return false;
    }
}

// Update cart count
async function updateCartCount() {
    try {
        const response = await fetch(`${API_URL.BASE}${API_URL.CART}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const result = await response.json();
            const count = result.cart.items.reduce((total, item) => total + item.quantity, 0);
            document.getElementById('cart-count').textContent = count;
            return;
        }
        
        // Fallback to local storage
        const localCart = JSON.parse(localStorage.getItem('cart')) || { items: [] };
        const count = localCart.items.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-count').textContent = count;
    } catch (error) {
        console.error('Error updating cart count:', error);
        document.getElementById('cart-count').textContent = '0';
    }
}

async function toggleWishlist(productId, button) {
    try {
        const response = await fetch('/api/wishlist/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
            },
            body: JSON.stringify({ product_id: productId })
        });

        if (!response.ok) throw new Error('Wishlist service error');

        const result = await response.json();
        
        if (result.success) {
            const icon = button.querySelector('i');
            if (result.action === 'added') {
                icon.classList.replace('far', 'fas');
                showNotification('Added to wishlist!', 'success');
            } else {
                icon.classList.replace('fas', 'far');
                showNotification('Removed from wishlist', 'info');
            }
        }
    } catch (error) {
        console.error('Wishlist error:', error);
        showNotification('Please login to use wishlist', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    notification.innerHTML = `
        <div class="notification-icon">
            ${type === 'success' ? '✓' : 
              type === 'error' ? '✗' : 
              type === 'warning' ? '⚠' : 'i'}
        </div>
        <div class="notification-content">${message}</div>
        <button class="notification-close">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after duration
    const timer = setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    }, duration);

    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(timer);
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    });
}

// Product detail page quantity selector
document.addEventListener('DOMContentLoaded', () => {
    const quantityBtns = document.querySelectorAll('.quantity-selector button');
    const quantityInput = document.querySelector('.quantity-selector input');
    
    if (quantityBtns.length > 0 && quantityInput) {
        quantityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                let currentValue = parseInt(quantityInput.value);
                
                if (action === 'decrease' && currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                } else if (action === 'increase') {
                    quantityInput.value = currentValue + 1;
                }
            });
        });
    }
    
    // Add to cart from product detail page
    const addToCartBtn = document.querySelector('.product-details .add-to-cart');
    if (addToCartBtn && quantityInput) {
        addToCartBtn.addEventListener('click', () => {
            const productId = addToCartBtn.getAttribute('data-id');
            const quantity = parseInt(quantityInput.value);
            addToCart(productId, quantity);
        });
    }
});

// Cart page functionality
document.addEventListener('DOMContentLoaded', () => {
    const cartItems = document.querySelectorAll('.cart-item');
    
    if (cartItems.length > 0) {
        // Quantity change in cart
        document.querySelectorAll('.cart-item-quantity button').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.getAttribute('data-action');
                const itemId = btn.closest('.cart-item').getAttribute('data-id');
                const quantityInput = btn.parentElement.querySelector('input');
                let currentValue = parseInt(quantityInput.value);
                
                if (action === 'decrease' && currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                    await updateCartItemQuantity(itemId, currentValue - 1);
                } else if (action === 'increase') {
                    quantityInput.value = currentValue + 1;
                    await updateCartItemQuantity(itemId, currentValue + 1);
                }
            });
        });
        
        // Remove item from cart
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', async () => {
                const itemId = btn.closest('.cart-item').getAttribute('data-id');
                await removeCartItem(itemId);
            });
        });
    }
});

// Update cart item quantity
async function updateCartItemQuantity(itemId, quantity) {
    try {
        const response = await fetch(`${API_URL.CART}/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quantity: quantity
            }),
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateCartSummary();
        } else {
            showNotification('Failed to update cart.', 'error');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        showNotification('Error updating cart.', 'error');
    }
}

// Remove item from cart
async function removeCartItem(itemId) {
    try {
        const response = await fetch(`${API_URL.CART}/${itemId}`, {
            method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
            const itemElement = document.querySelector(`.cart-item[data-id="${itemId}"]`);
            if (itemElement) {
                itemElement.remove();
            }
            updateCartSummary();
            updateCartCount();
        } else {
            showNotification('Failed to remove item from cart.', 'error');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showNotification('Error removing item from cart.', 'error');
    }
}

// Update cart summary (continued)
async function updateCartSummary() {
    try {
        const response = await fetch(API_URL.CART);
        const cart = await response.json();
        
        const subtotalElement = document.querySelector('.summary-subtotal .value');
        const shippingElement = document.querySelector('.summary-shipping .value');
        const taxElement = document.querySelector('.summary-tax .value');
        const totalElement = document.querySelector('.summary-total .value');
        
        if (subtotalElement && totalElement) {
            subtotalElement.textContent = `$${cart.subtotal.toFixed(2)}`;
            shippingElement.textContent = `$${cart.shipping.toFixed(2)}`;
            taxElement.textContent = `$${cart.tax.toFixed(2)}`;
            totalElement.textContent = `$${cart.total.toFixed(2)}`;
        }
        
        // Update empty cart message
        const cartContainer = document.querySelector('.cart-container');
        const emptyCartMessage = document.querySelector('.empty-cart-message');
        
        if (cart.items.length === 0) {
            if (!emptyCartMessage) {
                const message = document.createElement('div');
                message.classList.add('empty-cart-message');
                message.innerHTML = `
                    <p>Your cart is empty.</p>
                    <a href="/products" class="btn primary-btn">Continue Shopping</a>
                `;
                cartContainer.innerHTML = '';
                cartContainer.appendChild(message);
            }
        }
    } catch (error) {
        console.error('Error updating cart summary:', error);
    }
}

// Form validation
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!validateForm(this)) {
                event.preventDefault();
            }
        });
    });
});

function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            markInvalid(input, 'This field is required');
            isValid = false;
        } else if (input.type === 'email' && !validateEmail(input.value)) {
            markInvalid(input, 'Please enter a valid email address');
            isValid = false;
        } else if (input.type === 'password' && input.value.length < 8) {
            markInvalid(input, 'Password must be at least 8 characters long');
            isValid = false;
        } else {
            clearInvalid(input);
        }
    });
    
    // Password confirmation validation
    const password = form.querySelector('input[name="password"]');
    const confirmPassword = form.querySelector('input[name="confirm_password"]');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
        markInvalid(confirmPassword, 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function markInvalid(input, message) {
    const formGroup = input.closest('.form-group');
    let errorElement = formGroup.querySelector('.error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.classList.add('error-message');
        formGroup.appendChild(errorElement);
    }
    
    input.classList.add('invalid');
    errorElement.textContent = message;
}

function clearInvalid(input) {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    
    input.classList.remove('invalid');
    if (errorElement) {
        formGroup.removeChild(errorElement);
    }
}

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('.search-form');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const searchInput = this.querySelector('input[name="search"]');
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm) {
                window.location.href = `/products?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    }
});

// Product filtering
document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.querySelector('.product-filters');
    
    if (filterForm) {
        // Price range slider
        const priceRange = filterForm.querySelector('.price-range');
        const minPriceInput = filterForm.querySelector('.min-price');
        const maxPriceInput = filterForm.querySelector('.max-price');
        const priceOutput = filterForm.querySelector('.price-output');
        
        if (priceRange && minPriceInput && maxPriceInput) {
            priceRange.addEventListener('input', function() {
                const minPrice = minPriceInput.value;
                const maxPrice = maxPriceInput.value;
                priceOutput.textContent = `$${minPrice} - $${maxPrice}`;
            });
        }
        
        // Category checkboxes
        const categoryInputs = filterForm.querySelectorAll('input[name="category"]');
        categoryInputs.forEach(input => {
            input.addEventListener('change', applyFilters);
        });
        
        // Sort dropdown
        const sortSelect = filterForm.querySelector('select[name="sort"]');
        if (sortSelect) {
            sortSelect.addEventListener('change', applyFilters);
        }
        
        // Apply filters on form submit
        filterForm.addEventListener('submit', function(event) {
            event.preventDefault();
            applyFilters();
        });
    }
});

async function applyFilters() {
    const filterForm = document.querySelector('.product-filters');
    const productsContainer = document.querySelector('.products-grid');
    
    if (!filterForm || !productsContainer) return;
    
    const formData = new FormData(filterForm);
    const params = new URLSearchParams();
    
    for (const [key, value] of formData) {
        if (value) {
            params.append(key, value);
        }
    }
    
    // Update URL with filters
    const url = new URL(window.location);
    url.search = params.toString();
    window.history.pushState({}, '', url);
    
    // Fetch filtered products
    try {
        const response = await fetch(`/api/products?${params.toString()}`);
        const products = await response.json();
        
        renderProducts(products);
    } catch (error) {
        console.error('Error applying filters:', error);
    }
}

// Checkout process
document.addEventListener('DOMContentLoaded', () => {
    const checkoutForm = document.getElementById('checkout-form');
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            if (!validateForm(this)) {
                return;
            }
            
            const formData = new FormData(this);
            const formObject = {};
            
            for (const [key, value] of formData) {
                formObject[key] = value;
            }
            
            try {
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formObject),
                });
                
                const result = await response.json();
                
                if (result.success) {
                    window.location.href = `/order-confirmation/${result.order_id}`;
                } else {
                    showNotification('Error processing your order. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error during checkout:', error);
                showNotification('Error processing your order. Please try again.', 'error');
            }
        });
    }
});

// Add product to cart
async function addToCart(productId, quantity) {
    try {
        const response = await fetch(API_URL.CART, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            }),
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateCartCount();
            showNotification('Product added to cart!', 'success');
        } else {
            showNotification('Failed to add product to cart.', 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding product to cart.', 'error');
    }
}

// Update cart count
function updateCartCount(count) {
    console.log('Updating cart count to:', count); // Debugging
    
    const cartCountElement = document.getElementById('cart-count');
    
    if (cartCountElement) {
        cartCountElement.textContent = count;
        
        // Make sure the count is visible if greater than 0
        if (count > 0) {
            cartCountElement.style.display = 'inline-block';
            
            // Add a visual indication that the count changed
            cartCountElement.classList.add('cart-count-updated');
            setTimeout(() => {
                cartCountElement.classList.remove('cart-count-updated');
            }, 1000);
        }
    } else {
        console.error('Cart count element not found! Check if element with id "cart-count" exists.');
    }
    
    // Add style for cart count animation
    if (!document.getElementById('cart-count-style')) {
        const style = document.createElement('style');
        style.id = 'cart-count-style';
        style.innerHTML = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .cart-count-updated {
                animation: pulse 0.5s ease;
            }
        `;
        document.head.appendChild(style);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    console.log('Showing notification:', message, type); // Debugging
    
    // Create notification element
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <button class="close-notification"><i class="fas fa-times"></i></button>
    `;
    
    // Add notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.classList.add('notification-container');
        document.body.appendChild(notificationContainer);
        
        // Add style for notifications with enhanced visibility
        const style = document.createElement('style');
        style.innerHTML = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 350px;
            }
            
            .notification {
                display: flex;
                align-items: center;
                background-color: white;
                border-radius: 4px;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                padding: 15px;
                margin-bottom: 10px;
                animation: slideIn 0.3s ease;
                opacity: 1;
            }
            
            .notification-icon {
                font-size: 1.2rem;
                margin-right: 15px;
            }
            
            .notification.success .notification-icon {
                color: #27ae60;
            }
            
            .notification.error .notification-icon {
                color: #e74c3c;
            }
            
            .notification.info .notification-icon {
                color: #3498db;
            }
            
            .notification-message {
                flex: 1;
            }
            
            .close-notification {
                background: none;
                border: none;
                font-size: 0.9rem;
                cursor: pointer;
                color: #7f8c8d;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add notification to container
    notificationContainer.appendChild(notification);
    
    // Close notification on click
    notification.querySelector('.close-notification').addEventListener('click', function() {
        notification.remove();
    });
    
    // Auto remove notification after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 4000);
}

// Product detail page quantity selector
document.addEventListener('DOMContentLoaded', () => {
    const quantityBtns = document.querySelectorAll('.quantity-selector button');
    const quantityInput = document.querySelector('.quantity-selector input');
    
    if (quantityBtns.length > 0 && quantityInput) {
        quantityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                let currentValue = parseInt(quantityInput.value);
                
                if (action === 'decrease' && currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                } else if (action === 'increase') {
                    quantityInput.value = currentValue + 1;
                }
            });
        });
    }
    
    // Add to cart from product detail page
    const addToCartBtn = document.querySelector('.product-details .add-to-cart');
    if (addToCartBtn && quantityInput) {
        addToCartBtn.addEventListener('click', () => {
            const productId = addToCartBtn.getAttribute('data-id');
            const quantity = parseInt(quantityInput.value);
            addToCart(productId, quantity);
        });
    }
});

// Cart page functionality
document.addEventListener('DOMContentLoaded', () => {
    const cartItems = document.querySelectorAll('.cart-item');
    
    if (cartItems.length > 0) {
        // Quantity change in cart
        document.querySelectorAll('.cart-item-quantity button').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.getAttribute('data-action');
                const itemId = btn.closest('.cart-item').getAttribute('data-id');
                const quantityInput = btn.parentElement.querySelector('input');
                let currentValue = parseInt(quantityInput.value);
                
                if (action === 'decrease' && currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                    await updateCartItemQuantity(itemId, currentValue - 1);
                } else if (action === 'increase') {
                    quantityInput.value = currentValue + 1;
                    await updateCartItemQuantity(itemId, currentValue + 1);
                }
            });
        });
        
        // Remove item from cart
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', async () => {
                const itemId = btn.closest('.cart-item').getAttribute('data-id');
                await removeCartItem(itemId);
            });
        });
    }
});

// Update cart item quantity
async function updateCartItemQuantity(itemId, quantity) {
    try {
        const response = await fetch(`${API_URL.CART}/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                quantity: quantity
            }),
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateCartSummary();
        } else {
            showNotification('Failed to update cart.', 'error');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        showNotification('Error updating cart.', 'error');
    }
}

// Remove item from cart
async function removeCartItem(itemId) {
    try {
        const response = await fetch(`${API_URL.CART}/${itemId}`, {
            method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (result.success) {
            const itemElement = document.querySelector(`.cart-item[data-id="${itemId}"]`);
            if (itemElement) {
                itemElement.remove();
            }
            updateCartSummary();
            updateCartCount();
        } else {
            showNotification('Failed to remove item from cart.', 'error');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        showNotification('Error removing item from cart.', 'error');
    }
}

// Update cart summary (continued)
async function updateCartSummary() {
    try {
        const response = await fetch(API_URL.CART);
        const cart = await response.json();
        
        const subtotalElement = document.querySelector('.summary-subtotal .value');
        const shippingElement = document.querySelector('.summary-shipping .value');
        const taxElement = document.querySelector('.summary-tax .value');
        const totalElement = document.querySelector('.summary-total .value');
        
        if (subtotalElement && totalElement) {
            subtotalElement.textContent = `$${cart.subtotal.toFixed(2)}`;
            shippingElement.textContent = `$${cart.shipping.toFixed(2)}`;
            taxElement.textContent = `$${cart.tax.toFixed(2)}`;
            totalElement.textContent = `$${cart.total.toFixed(2)}`;
        }
        
        // Update empty cart message
        const cartContainer = document.querySelector('.cart-container');
        const emptyCartMessage = document.querySelector('.empty-cart-message');
        
        if (cart.items.length === 0) {
            if (!emptyCartMessage) {
                const message = document.createElement('div');
                message.classList.add('empty-cart-message');
                message.innerHTML = `
                    <p>Your cart is empty.</p>
                    <a href="/products" class="btn primary-btn">Continue Shopping</a>
                `;
                cartContainer.innerHTML = '';
                cartContainer.appendChild(message);
            }
        }
    } catch (error) {
        console.error('Error updating cart summary:', error);
    }
}

// Form validation
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!validateForm(this)) {
                event.preventDefault();
            }
        });
    });
});

function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            markInvalid(input, 'This field is required');
            isValid = false;
        } else if (input.type === 'email' && !validateEmail(input.value)) {
            markInvalid(input, 'Please enter a valid email address');
            isValid = false;
        } else if (input.type === 'password' && input.value.length < 8) {
            markInvalid(input, 'Password must be at least 8 characters long');
            isValid = false;
        } else {
            clearInvalid(input);
        }
    });
    
    // Password confirmation validation
    const password = form.querySelector('input[name="password"]');
    const confirmPassword = form.querySelector('input[name="confirm_password"]');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
        markInvalid(confirmPassword, 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function markInvalid(input, message) {
    const formGroup = input.closest('.form-group');
    let errorElement = formGroup.querySelector('.error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.classList.add('error-message');
        formGroup.appendChild(errorElement);
    }
    
    input.classList.add('invalid');
    errorElement.textContent = message;
}

function clearInvalid(input) {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    
    input.classList.remove('invalid');
    if (errorElement) {
        formGroup.removeChild(errorElement);
    }
}

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('.search-form');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const searchInput = this.querySelector('input[name="search"]');
            const searchTerm = searchInput.value.trim();
            
            if (searchTerm) {
                window.location.href = `/products?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    }
});

// Product filtering
document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.querySelector('.product-filters');
    
    if (filterForm) {
        // Price range slider
        const priceRange = filterForm.querySelector('.price-range');
        const minPriceInput = filterForm.querySelector('.min-price');
        const maxPriceInput = filterForm.querySelector('.max-price');
        const priceOutput = filterForm.querySelector('.price-output');
        
        if (priceRange && minPriceInput && maxPriceInput) {
            priceRange.addEventListener('input', function() {
                const minPrice = minPriceInput.value;
                const maxPrice = maxPriceInput.value;
                priceOutput.textContent = `$${minPrice} - $${maxPrice}`;
            });
        }
        
        // Category checkboxes
        const categoryInputs = filterForm.querySelectorAll('input[name="category"]');
        categoryInputs.forEach(input => {
            input.addEventListener('change', applyFilters);
        });
        
        // Sort dropdown
        const sortSelect = filterForm.querySelector('select[name="sort"]');
        if (sortSelect) {
            sortSelect.addEventListener('change', applyFilters);
        }
        
        // Apply filters on form submit
        filterForm.addEventListener('submit', function(event) {
            event.preventDefault();
            applyFilters();
        });
    }
});

async function applyFilters() {
    const filterForm = document.querySelector('.product-filters');
    const productsContainer = document.querySelector('.products-grid');
    
    if (!filterForm || !productsContainer) return;
    
    const formData = new FormData(filterForm);
    const params = new URLSearchParams();
    
    for (const [key, value] of formData) {
        if (value) {
            params.append(key, value);
        }
    }
    
    // Update URL with filters
    const url = new URL(window.location);
    url.search = params.toString();
    window.history.pushState({}, '', url);
    
    // Fetch filtered products
    try {
        const response = await fetch(`/api/products?${params.toString()}`);
        const products = await response.json();
        
        renderProducts(products);
    } catch (error) {
        console.error('Error applying filters:', error);
    }
}

// Checkout process
document.addEventListener('DOMContentLoaded', () => {
    const checkoutForm = document.getElementById('checkout-form');
    
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            if (!validateForm(this)) {
                return;
            }
            
            const formData = new FormData(this);
            const formObject = {};
            
            for (const [key, value] of formData) {
                formObject[key] = value;
            }
            
            try {
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formObject),
                });
                
                const result = await response.json();
                
                if (result.success) {
                    window.location.href = `/order-confirmation/${result.order_id}`;
                } else {
                    showNotification('Error processing your order. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error during checkout:', error);
                showNotification('Error processing your order. Please try again.', 'error');
            }
        });
    }
});

// Check login status and update UI
function checkLoginStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');
    
    if (currentUser && currentUser.loggedIn) {
        // Add logged-in classes to buttons
        if (loginBtn) {
            loginBtn.classList.add('logged-in');
            loginBtn.textContent = 'Logged In';
        }
        if (registerBtn) {
            registerBtn.classList.add('logged-in');
            registerBtn.textContent = 'Account Created';
        }
    } else {
        // Remove logged-in classes
        if (loginBtn) {
            loginBtn.classList.remove('logged-in');
            loginBtn.textContent = 'Login';
        }
        if (registerBtn) {
            registerBtn.classList.remove('logged-in');
            registerBtn.textContent = 'Register';
        }
    }
}

// Show login notification
function showLoginNotification(userName) {
    const notification = document.createElement('div');
    notification.className = 'login-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <div>
            <strong>Welcome back, ${userName}!</strong>
            <p>You are now logged in.</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 5000);
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('loginTimestamp');
    checkLoginStatus();
    
    // In a real app, you would also call your backend API to logout
    showNotification('You have been logged out successfully');
}

// For demo purposes - simulate login
// In a real app, this would be called after successful login
window.login = function(username) {
    const user = {
        name: username || 'User',
        email: 'user@example.com',
        loggedIn: true
    };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    checkLoginStatus();
};

// Initialize user menu dropdown
function initUserMenu() {
    const userMenuButton = document.getElementById('userMenuButton');
    if (userMenuButton) {
        userMenuButton.addEventListener('click', function() {
            document.getElementById('user-menu').classList.toggle('active');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const userMenu = document.getElementById('user-menu');
        const userMenuButton = document.getElementById('userMenuButton');
        
        if (userMenu && userMenu.classList.contains('active') && 
            !userMenu.contains(event.target) && 
            userMenuButton && !userMenuButton.contains(event.target)) {
            userMenu.classList.remove('active');
        }
    });
    
    // Logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Call these functions when the page loads
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    initUserMenu();
});

// Add this function to handle login UI updates
function updateLoginUI(username) {
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    const userGreeting = document.getElementById('user-greeting');
    
    if (username) {
        // User is logged in - hide guest actions, show user actions
        if (guestActions) guestActions.style.display = 'none';
        if (userActions) {
            userActions.style.display = 'flex';
            if (userGreeting) userGreeting.textContent = `Hi, ${username}`;
        }
        
        // Show welcome notification
        showLoginNotification(username);
    } else {
        // User is not logged in - show guest actions, hide user actions
        if (guestActions) guestActions.style.display = 'flex';
        if (userActions) userActions.style.display = 'none';
    }
}

// Update the login function
function login(username) {
    const user = {
        name: username || 'User',
        email: 'user@example.com',
        loggedIn: true
    };
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateLoginUI(user.name);
}

// Update the logout function
function logout() {
    localStorage.removeItem('currentUser');
    updateLoginUI(null);
    showNotification('You have been logged out successfully', 'info');
}

// Check login status on page load
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.loggedIn) {
        updateLoginUI(currentUser.name);
    }
});