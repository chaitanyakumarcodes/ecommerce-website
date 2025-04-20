# 🛒 E-Commerce Website

A minimalistic e-commerce web application built with Python and Flask, featuring HTML, CSS, and JavaScript for the frontend. This project serves as a foundational template for developing more complex online shopping platforms.

## 📁 Project Structure

```
ecommerce-website/
├── app.py
├── database.py
├── instance/
├── static/
│   ├── css/
│   ├── js/
│   └── images/
├── templates/
│   ├── index.html
│   ├── product.html
│   └── ...
└── __pycache__/
```

- **app.py**: Main Flask application file handling routing and server configurations.
- **database.py**: Manages database connections and operations.
- **instance/**: Contains instance-specific configurations and the SQLite database file.
- **static/**: Holds static assets like CSS, JavaScript, and images.
- **templates/**: Contains HTML templates rendered by Flask.
- **__pycache__/**: Stores compiled Python files.

## 🛠️ Technologies Used

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite

## ✨ Features

- Homepage displaying a list of products.
- Product detail pages with comprehensive information.
- Basic shopping cart functionality.
- Responsive design for various devices.

## 🚀 Getting Started

### Prerequisites

- Python 3.x installed on your system.
- `pip` package manager.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/chaitanyakumarcodes/ecommerce-website.git
   cd ecommerce-website
   ```

2. **Create a virtual environment (optional but recommended):**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

   *Note: If `requirements.txt` is not present, you may need to install Flask manually:*

   ```bash
   pip install Flask
   ```

4. **Initialize the database:**

   Ensure that `database.py` contains the necessary code to create and initialize the SQLite database. Run the script to set up the database.

   ```bash
   python database.py
   ```

5. **Run the application:**

   ```bash
   python app.py
   ```

6. **Access the website:**

   Open your browser and navigate to `http://127.0.0.1:5000/` to view the application.

## 🧩 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to customize this README further to match the specific functionalities and features of your project. 
