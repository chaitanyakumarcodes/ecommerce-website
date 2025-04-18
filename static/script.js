// static/js/main.js - Main JavaScript file

// DOM Elements
const featuredCategories = document.getElementById('featured-categories');
const featuredProducts = document.getElementById('featured-products');
const cartCount = document.getElementById('cart-count');

// API URLs
const API_URL = {
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
        const categoryCard = document.createElement('div');
        categoryCard.classList.add('category-card');
        
        categoryCard.innerHTML = `
            <div class="category-img">
                <img src="${category.image}" alt="${category.name}">
            </div>
            <div class="category-info">
                <h3>${category.name}</h3>
                <a href="/products?category=${category.id}" class="btn secondary-btn">View Products</a>
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
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        
        productCard.innerHTML = `
            <div class="product-img">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3><a href="/product/${product.id}">${product.name}</a></h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        `;
        
        featuredProducts.appendChild(productCard);
    });
}

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
async function updateCartCount() {
    try {
        const response = await fetch(API_URL.CART);
        const cart = await response.json();
        
        let count = 0;
        if (cart.items) {
            count = cart.items.reduce((total, item) => total + item.quantity, 0);
        }
        
        cartCount.textContent = count;
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.classList.add('notification', `notification-${type}`);
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
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