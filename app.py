# app.py - Main Flask application

from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
import os
import json
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from datetime import datetime
from database import db, initialize_db, User, Product, Category, Order, OrderItem, Cart, CartItem
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ecommerce.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database
db.init_app(app)

with app.app_context():
    db.create_all()
    initialize_db()

# Home page
@app.route('/')
def index():
    user = None
    if 'user_id' in session:
        user = {
            'id': session['user_id'],
            'name': session['user_name']
        }
    return render_template('index.html', user=user)

# About page
@app.route('/about')
def about():
    return render_template('about.html')

# Contact page
@app.route('/contact')
def contact():
    return render_template('contact.html')

# FAQ page
@app.route('/faq')
def faq():
    return render_template('faq.html')

# Shipping Policy page
@app.route('/shipping')
def shipping_policy():
    return render_template('policies.html')

# Privacy Policy page
@app.route('/privacy')
def privacy_policy():
    return render_template('policies.html')

# Return Policy page
@app.route('/returns')
def return_policy():
    return render_template('policies.html')

# Terms and Conditions page
@app.route('/terms')
def terms_conditions():
    return render_template('policies.html')

# Products page
@app.route('/products')
def products():
    category_id = request.args.get('category')
    search = request.args.get('search')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    sort = request.args.get('sort', 'newest')
    
    return render_template('products.html', 
                          category_id=category_id, 
                          search=search,
                          min_price=min_price,
                          max_price=max_price,
                          sort=sort)

# Product details page
@app.route('/product/<int:product_id>')
def product_detail(product_id):
    product = Product.query.get_or_404(product_id)
    related_products = Product.query.filter(Product.category_id == product.category_id, 
                                          Product.id != product.id).limit(4).all()
    
    return render_template('product_detail.html', product=product, related_products=related_products)

# Categories page
@app.route('/categories')
def categories():
    all_categories = Category.query.all()
    return render_template('categories.html', categories=all_categories)

# Cart page
@app.route('/cart')
def cart():
    cart_items = []
    subtotal = 0
    
    if 'user_id' in session:
        # Get cart for logged in user
        user_cart = Cart.query.filter_by(user_id=session['user_id']).first()
        if user_cart:
            cart_items = CartItem.query.filter_by(cart_id=user_cart.id).all()
            for item in cart_items:
                subtotal += item.product.price * item.quantity
    elif 'cart' in session:
        # Get cart from session for guest
        for item_id, item_data in session['cart'].items():
            product = Product.query.get(item_data['product_id'])
            if product:
                cart_items.append({
                    'id': item_id,
                    'product': product,
                    'quantity': item_data['quantity']
                })
                subtotal += product.price * item_data['quantity']
    
    # Calculate shipping, tax and total
    shipping = 10.00 if subtotal > 0 else 0
    tax = round(subtotal * 0.1, 2)
    total = subtotal + shipping + tax
    
    return render_template('cart.html', 
                          cart_items=cart_items, 
                          subtotal=subtotal,
                          shipping=shipping,
                          tax=tax,
                          total=total)

# Login page
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            
            # Merge guest cart with user cart if exists
            if 'cart' in session:
                merge_carts(user.id, session['cart'])
                session.pop('cart')
            
            flash('You have been logged in successfully', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('login.html')

# Register page
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Email already exists', 'error')
            return render_template('register.html')
        
        # Check if passwords match
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('register.html')
        
        # Create new user
        hashed_password = generate_password_hash(password)
        new_user = User(name=name, email=email, password=hashed_password)
        
        db.session.add(new_user)
        db.session.commit()
        
        # Create cart for the new user
        new_cart = Cart(user_id=new_user.id)
        db.session.add(new_cart)
        db.session.commit()
        
        flash('Registration successful! You can now login', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

# Logout
@app.route('/logout')
def logout():
    if 'user_id' in session:
        session.pop('user_id')
        session.pop('user_name')
    
    flash('You have been logged out successfully', 'success')
    return redirect(url_for('index'))

@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    if 'user_id' not in session and 'cart' not in session:
        flash('Your cart is empty', 'error')
        return redirect(url_for('cart'))
    
    # Calculate order totals and get cart items (moved this outside POST to be used for both GET and POST)
    cart_items = []
    subtotal = 0
    
    if 'user_id' in session:
        user_cart = Cart.query.filter_by(user_id=session['user_id']).first()
        if user_cart:
            cart_items = CartItem.query.filter_by(cart_id=user_cart.id).all()
            for item in cart_items:
                subtotal += item.product.price * item.quantity
    elif 'cart' in session:
        for item_id, item_data in session['cart'].items():
            product = Product.query.get(item_data['product_id'])
            if product:
                cart_item = type('CartItem', (), {'product': product, 'quantity': item_data['quantity']})
                cart_items.append(cart_item)
                subtotal += product.price * item_data['quantity']
    
    shipping = 10.00 if subtotal > 0 else 0
    tax = round(subtotal * 0.1, 2)
    total = subtotal + shipping + tax
    
    if request.method == 'POST':
        # Process checkout
        shipping_name = request.form.get('shipping_name')
        shipping_address = request.form.get('shipping_address')
        shipping_city = request.form.get('shipping_city')
        shipping_state = request.form.get('shipping_state')
        shipping_zipcode = request.form.get('shipping_zipcode')
        payment_method = request.form.get('payment_method')
        
        # Create order
        new_order = Order(
            user_id=session.get('user_id'),
            order_date=datetime.now(),
            total_amount=total,
            shipping_address=f"{shipping_address}, {shipping_city}, {shipping_state}, {shipping_zipcode}",
            shipping_name=shipping_name,
            payment_method=payment_method,
            order_status='Pending'
        )
        
        db.session.add(new_order)
        db.session.commit()
        
        # Create order items
        for item in cart_items:
            if 'user_id' in session:
                new_order_item = OrderItem(
                    order_id=new_order.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    price=item.product.price
                )
            else:
                new_order_item = OrderItem(
                    order_id=new_order.id,
                    product_id=item.product.id,
                    quantity=item.quantity,
                    price=item.product.price
                )
            
            db.session.add(new_order_item)
        
        # Clear cart
        if 'user_id' in session:
            CartItem.query.filter_by(cart_id=user_cart.id).delete()
        else:
            session.pop('cart', None)
        
        db.session.commit()
        
        # Redirect to order confirmation
        return redirect(url_for('order_confirmation', order_id=new_order.id))
    
    # Pass all necessary variables to the template
    return render_template('checkout.html', 
                          cart_items=cart_items, 
                          subtotal=subtotal,
                          shipping=shipping,
                          tax=tax,
                          total=total)

# Order confirmation page
@app.route('/order_confirmation/<int:order_id>')
def order_confirmation(order_id):
    # Get the order
    order = Order.query.get_or_404(order_id)
    
    # Security check - only allow the user who placed the order to see the confirmation
    if 'user_id' in session and order.user_id and order.user_id != session['user_id']:
        flash('You do not have permission to view this order', 'danger')
        return redirect(url_for('profile'))
    
    # Get order items
    order_items = OrderItem.query.filter_by(order_id=order_id).all()
    
    # For each order item, fetch the associated product
    for item in order_items:
        item.product = Product.query.get(item.product_id)
    
    return render_template('order_confirmation.html', 
                          order=order,
                          order_items=order_items)

# User profile page
@app.route('/profile')
def profile():
    if 'user_id' not in session:
        flash('Please login to access your profile', 'error')
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    orders = Order.query.filter_by(user_id=user.id).order_by(Order.order_date.desc()).all()
    
    return render_template('profile.html', user=user, orders=orders)

# API endpoints
@app.route('/api/categories')
def api_categories():
    featured = request.args.get('featured')
    
    if featured == 'true':
        categories = Category.query.filter_by(is_featured=True).all()
    else:
        categories = Category.query.all()
    
    return jsonify([{
        'id': category.id,
        'name': category.name,
        'description': category.description,
        'image': category.image,
        'is_featured': category.is_featured
    } for category in categories])

@app.route('/api/products')
def api_products():
    featured = request.args.get('featured')
    category_id = request.args.get('category')
    search = request.args.get('search')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    sort = request.args.get('sort', 'newest')
    
    # Base query
    query = Product.query
    
    # Apply filters
    if featured == 'true':
        query = query.filter_by(is_featured=True)
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    if search:
        query = query.filter(Product.name.like(f'%{search}%') | Product.description.like(f'%{search}%'))
    
    if min_price:
        query = query.filter(Product.price >= float(min_price))
    
    if max_price:
        query = query.filter(Product.price <= float(max_price))
    
    # Apply sorting
    if sort == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Product.price.desc())
    elif sort == 'newest':
        query = query.order_by(Product.created_at.desc())
    
    products = query.all()
    
    products_with_category = []
    for product in products:
        product_data = {
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'price': product.price,
            'image': product.image,
            'category_id': product.category_id,
            'category': product.category.name,  # Add category name
            'is_featured': product.is_featured,
            'stock': product.stock
        }
        products_with_category.append(product_data)
    
    # Create pagination response
    return jsonify({
        'products': products_with_category,
        'pagination': {
            'current_page': 1,
            'total_pages': 1,
            'total': len(products_with_category)
        },
        'total': len(products_with_category)
    })

@app.route('/api/cart', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_cart():
    if request.method == 'GET':
        cart_items = []
        subtotal = 0
        
        if 'user_id' in session:
            # Get cart for logged in user
            user_cart = Cart.query.filter_by(user_id=session['user_id']).first()
            if user_cart:
                db_cart_items = CartItem.query.filter_by(cart_id=user_cart.id).all()
                for item in db_cart_items:
                    cart_items.append({
                        'id': item.id,
                        'product_id': item.product_id,
                        'name': item.product.name,
                        'price': item.product.price,
                        'quantity': item.quantity,
                        'image': item.product.image,
                        'subtotal': item.product.price * item.quantity
                    })
                    subtotal += item.product.price * item.quantity
        elif 'cart' in session:
            # Get cart from session for guest
            for item_id, item_data in session['cart'].items():
                product = Product.query.get(item_data['product_id'])
                if product:
                    cart_items.append({
                        'id': item_id,
                        'product_id': product.id,
                        'name': product.name,
                        'price': product.price,
                        'quantity': item_data['quantity'],
                        'image': product.image,
                        'subtotal': product.price * item_data['quantity']
                    })
                    subtotal += product.price * item_data['quantity']
        
        # Calculate shipping, tax and total
        shipping = 10.00 if subtotal > 0 else 0
        tax = round(subtotal * 0.1, 2)
        total = subtotal + shipping + tax
        
        return jsonify({
            'items': cart_items,
            'subtotal': subtotal,
            'shipping': shipping,
            'tax': tax,
            'total': total
        })
    
    elif request.method == 'POST':
        # Add item to cart
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        product = Product.query.get_or_404(product_id)
        
        if 'user_id' in session:
            # Add to database cart
            user_cart = Cart.query.filter_by(user_id=session['user_id']).first()
            if not user_cart:
                user_cart = Cart(user_id=session['user_id'])
                db.session.add(user_cart)
                db.session.commit()
            
            # Check if product already in cart
            cart_item = CartItem.query.filter_by(cart_id=user_cart.id, product_id=product_id).first()
            
            if cart_item:
                cart_item.quantity += quantity
            else:
                cart_item = CartItem(cart_id=user_cart.id, product_id=product_id, quantity=quantity)
                db.session.add(cart_item)
            
            db.session.commit()
        else:
            # Add to session cart
            if 'cart' not in session:
                session['cart'] = {}
            
            item_id = str(uuid.uuid4())
            
            session['cart'][item_id] = {
                'product_id': product_id,
                'quantity': quantity
            }
            
            session.modified = True
        
        return jsonify({'success': True})
    
    elif request.method == 'PUT':
        # Update cart item quantity
        data = request.get_json()
        item_id = request.path.split('/')[-1]
        quantity = data.get('quantity')
        
        if 'user_id' in session:
            # Update database cart
            cart_item = CartItem.query.get_or_404(item_id)
            cart_item.quantity = quantity
            db.session.commit()
        else:
            # Update session cart
            if 'cart' in session and item_id in session['cart']:
                session['cart'][item_id]['quantity'] = quantity
                session.modified = True
        
        return jsonify({'success': True})
    
    elif request.method == 'DELETE':
        # Remove item from cart
        item_id = request.path.split('/')[-1]
        
        if 'user_id' in session:
            # Remove from database cart
            cart_item = CartItem.query.get_or_404(item_id)
            db.session.delete(cart_item)
            db.session.commit()
        else:
            # Remove from session cart
            if 'cart' in session and item_id in session['cart']:
                del session['cart'][item_id]
                session.modified = True
        
        return jsonify({'success': True})

# Helper function to merge guest cart with user cart
def merge_carts(user_id, guest_cart):
    user_cart = Cart.query.filter_by(user_id=user_id).first()
    
    if not user_cart:
        user_cart = Cart(user_id=user_id)
        db.session.add(user_cart)
        db.session.commit()
    
    for item_id, item_data in guest_cart.items():
        product_id = item_data['product_id']
        quantity = item_data['quantity']
        
        # Check if product already in user's cart
        cart_item = CartItem.query.filter_by(cart_id=user_cart.id, product_id=product_id).first()
        
        if cart_item:
            cart_item.quantity += quantity
        else:
            cart_item = CartItem(cart_id=user_cart.id, product_id=product_id, quantity=quantity)
            db.session.add(cart_item)
    
    db.session.commit()

# Run the application
if __name__ == '__main__':
    app.run(debug=True)