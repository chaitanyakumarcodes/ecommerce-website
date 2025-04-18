# database.py - Database models and initialization

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# User model
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(200))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    zipcode = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    orders = db.relationship('Order', backref='user', lazy=True)
    cart = db.relationship('Cart', backref='user', lazy=True, uselist=False)

# Category model
class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    image = db.Column(db.String(200))
    is_featured = db.Column(db.Boolean, default=False)
    
    # Relationships
    products = db.relationship('Product', backref='category', lazy=True)

# Product model
class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    image = db.Column(db.String(200))
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign keys
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    
    # Relationships
    order_items = db.relationship('OrderItem', backref='product', lazy=True)
    cart_items = db.relationship('CartItem', backref='product', lazy=True)

# Cart model
class Cart(db.Model):
    __tablename__ = 'carts'
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    items = db.relationship('CartItem', backref='cart', lazy=True, cascade='all, delete-orphan')

# CartItem model
class CartItem(db.Model):
    __tablename__ = 'cart_items'
    
    id = db.Column(db.Integer, primary_key=True)
    quantity = db.Column(db.Integer, default=1)
    
    # Foreign keys
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)

# Order model (continued)
class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    total_amount = db.Column(db.Float, nullable=False)
    shipping_address = db.Column(db.String(200), nullable=False)
    shipping_name = db.Column(db.String(100), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    order_status = db.Column(db.String(50), default='Pending')
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')

# OrderItem model
class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    quantity = db.Column(db.Integer, default=1)
    price = db.Column(db.Float, nullable=False)
    
    # Foreign keys
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)

# Initialize database with some data
def initialize_db():
    # Check if there's data already
    if Category.query.first() is not None:
        return
    
    # Add categories
    categories = [
        {
            'name': 'Electronics',
            'description': 'Latest electronic devices',
            'image': '/static/images/categories/electronics.jpg',
            'is_featured': True
        },
        {
            'name': 'Clothing',
            'description': 'Fashion and accessories',
            'image': '/static/images/categories/clothing.jpg',
            'is_featured': True
        },
        {
            'name': 'Home & Kitchen',
            'description': 'Everything for your home',
            'image': '/static/images/categories/home.jpg',
            'is_featured': True
        },
        {
            'name': 'Books',
            'description': 'Books for all ages',
            'image': '/static/images/categories/books.jpg',
            'is_featured': False
        },
        {
            'name': 'Sports & Outdoors',
            'description': 'Sports gear and outdoor equipment',
            'image': '/static/images/categories/sports.jpg',
            'is_featured': False
        }
    ]
    
    for category_data in categories:
        category = Category(**category_data)
        db.session.add(category)
    
    db.session.commit()
    
    # Add products
    products = [
        # Electronics
        {
            'name': 'Smartphone X',
            'description': 'Latest smartphone with advanced features',
            'price': 699.99,
            'stock': 50,
            'image': '/static/images/products/smartphone.jpg',
            'is_featured': True,
            'category_id': 1
        },
        {
            'name': 'Laptop Pro',
            'description': 'Powerful laptop for work and gaming',
            'price': 1299.99,
            'stock': 30,
            'image': '/static/images/products/laptop.jpg',
            'is_featured': True,
            'category_id': 1
        },
        {
            'name': 'Wireless Earbuds',
            'description': 'High-quality wireless earbuds with noise cancellation',
            'price': 149.99,
            'stock': 100,
            'image': '/static/images/products/earbuds.jpg',
            'is_featured': False,
            'category_id': 1
        },
        {
            'name': 'Smart Watch',
            'description': 'Track your fitness and stay connected',
            'price': 249.99,
            'stock': 75,
            'image': '/static/images/products/smartwatch.jpg',
            'is_featured': False,
            'category_id': 1
        },
        
        # Clothing
        {
            'name': 'Men\'s T-Shirt',
            'description': 'Comfortable cotton t-shirt for men',
            'price': 19.99,
            'stock': 200,
            'image': '/static/images/products/tshirt.jpg',
            'is_featured': True,
            'category_id': 2
        },
        {
            'name': 'Women\'s Dress',
            'description': 'Elegant dress for special occasions',
            'price': 59.99,
            'stock': 100,
            'image': '/static/images/products/dress.jpg',
            'is_featured': False,
            'category_id': 2
        },
        {
            'name': 'Running Shoes',
            'description': 'Lightweight shoes for running and exercise',
            'price': 89.99,
            'stock': 150,
            'image': '/static/images/products/shoes.jpg',
            'is_featured': True,
            'category_id': 2
        },
        {
            'name': 'Winter Jacket',
            'description': 'Warm winter jacket for cold weather',
            'price': 129.99,
            'stock': 80,
            'image': '/static/images/products/jacket.jpg',
            'is_featured': False,
            'category_id': 2
        },
        
        # Home & Kitchen
        {
            'name': 'Coffee Maker',
            'description': 'Automatic coffee maker for your daily brew',
            'price': 79.99,
            'stock': 60,
            'image': '/static/images/products/coffeemaker.jpg',
            'is_featured': True,
            'category_id': 3
        },
        {
            'name': 'Blender',
            'description': 'Powerful blender for smoothies and more',
            'price': 49.99,
            'stock': 90,
            'image': '/static/images/products/blender.jpg',
            'is_featured': False,
            'category_id': 3
        },
        {
            'name': 'Bedding Set',
            'description': 'Comfortable bedding set for better sleep',
            'price': 89.99,
            'stock': 70,
            'image': '/static/images/products/bedding.jpg',
            'is_featured': False,
            'category_id': 3
        },
        {
            'name': 'Smart LED Bulbs',
            'description': 'Control your lights with your phone',
            'price': 39.99,
            'stock': 120,
            'image': '/static/images/products/bulbs.jpg',
            'is_featured': True,
            'category_id': 3
        },
        
        # Books
        {
            'name': 'Mystery Novel',
            'description': 'Bestselling mystery novel',
            'price': 14.99,
            'stock': 100,
            'image': '/static/images/products/novel.jpg',
            'is_featured': False,
            'category_id': 4
        },
        {
            'name': 'Cookbook',
            'description': 'Delicious recipes for every occasion',
            'price': 24.99,
            'stock': 80,
            'image': '/static/images/products/cookbook.jpg',
            'is_featured': False,
            'category_id': 4
        },
        
        # Sports & Outdoors
        {
            'name': 'Yoga Mat',
            'description': 'Non-slip yoga mat for exercise',
            'price': 29.99,
            'stock': 150,
            'image': '/static/images/products/yogamat.jpg',
            'is_featured': False,
            'category_id': 5
        },
        {
            'name': 'Camping Tent',
            'description': 'Spacious tent for outdoor adventures',
            'price': 149.99,
            'stock': 40,
            'image': '/static/images/products/tent.jpg',
            'is_featured': True,
            'category_id': 5
        }
    ]
    
    for product_data in products:
        product = Product(**product_data)
        db.session.add(product)
    
    db.session.commit()