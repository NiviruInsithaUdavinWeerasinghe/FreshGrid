# FreshGrid

FreshGrid is a modern, full-stack online shopping cart application designed to provide a seamless e-commerce experience. It features secure authentication, dynamic product categorization, a responsive UI, and an administrative dashboard for product and order management.

## 🚀 Features

- **User Authentication**: Secure login via Google, Facebook, and Passkeys.
- **Product Browsing**: Browse items across various categories (e.g., Vegetables, Fruits, Cakes, Biscuits) with detailed images, names, and prices.
- **Shopping Cart**: Add items, edit quantities, remove items, and calculate totals dynamically.
- **Checkout Process**: View order summaries and proceed through a simulated Stripe payment flow.
- **Admin Dashboard**: Dedicated portal for administrators to manage products, categories, special offers, and view orders.
- **Responsive Design**: Fully optimized for both desktop and mobile devices.

## 💻 Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: OAuth (Google, Facebook), WebAuthn (Passkeys)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js installed on your machine
- A running MongoDB instance (local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/NiviruInsithaUdavinWeerasinghe/FreshGrid.git
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory and add the following required environment variables:
- `PORT`: Port for the backend server (e.g., 5000)
- `MONGODB_URI`: Connection string for your MongoDB database (Get it from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Credentials for Cloudinary image storage (Get them from [Cloudinary](https://cloudinary.com/))
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `SESSION_SECRET`: Secrets and config for JSON Web Tokens and sessions
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`: Credentials for Google OAuth login (Get them from [Google Cloud Console](https://console.cloud.google.com/))
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL`: Credentials for Facebook OAuth login (Get them from [Meta for Developers](https://developers.facebook.com/))
- `FRONTEND_URL`: URL of the frontend application (e.g., http://localhost:5173)
- `GOOGLE_MAPS_API_KEY`: API key for Google Maps integration (Get it from [Google Maps Platform](https://developers.google.com/maps))
- `GEMINI_API_KEY`: API key for Google Gemini AI assistant (Get it from [Google AI Studio](https://aistudio.google.com/app/apikey))
- `GMAIL_USER`: Gmail address for sending emails
- `SENDGRID_API_KEY`: API key for SendGrid email service (Get it from [SendGrid](https://sendgrid.com/))
Then, start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend/` directory and configure the required variables:
- `VITE_GOOGLE_MAPS_API_KEY`: API key for Google Maps integration on the frontend (Get it from [Google Maps Platform](https://developers.google.com/maps))
Then, start the frontend development server:
```bash
npm run dev
```

---
## Screenshots

<table>
  <tr>
    <td align="center"><img src="./screenshots%20for%20readme/home.png" width="250" alt="Home"><br><b>Home</b></td>
    <td align="center"><img src="./screenshots%20for%20readme/Shop.png" width="250" alt="Shop"><br><b>Shop</b></td>
    <td align="center"><img src="./screenshots%20for%20readme/About.png" width="250" alt="About"><br><b>About</b></td>
    <td align="center"><img src="./screenshots%20for%20readme/AI%20Chat%20assistant.png" width="250" alt="AI Chat Assistant"><br><b>AI Chat Assistant</b></td>
  </tr>
  <tr>
    <td align="center"><img src="./screenshots%20for%20readme/User%20login_signup.png" width="250" alt="User Login/Signup"><br><b>User Login/Signup</b></td>
    <td align="center"><img src="./screenshots%20for%20readme/User%20account.png" width="250" alt="User Account"><br><b>User Account</b></td>
    <td align="center"><img src="./screenshots%20for%20readme/Cart.png" width="250" alt="Cart"><br><b>Cart</b></td>
    <td align="center"><img src="./screenshots%20for%20readme/Order%20history.png" width="250" alt="Order History"><br><b>Order History</b></td>
  </tr>
  <tr>
    <td align="center"><img src="./screenshots%20for%20readme/Admin%20dashboard%20overview.png" width="250" alt="Admin Dashboard Overview"><br><b>Admin Dashboard Overview</b></td>
    <td align="center"><img src="./screenshots%20for%20readme/Admin%20dashboard%20products.png" width="250" alt="Admin Dashboard Products"><br><b>Admin Dashboard Products</b></td>
    <td align="center"><img src="./screenshots%20for%20readme/Admin%20dashboard%20orders.png" width="250" alt="Admin Dashboard Orders"><br><b>Admin Dashboard Orders</b></td>
    <td align="center"><img src="./screenshots%20for%20readme/Admin%20dashboard%20special%20offers.png" width="250" alt="Admin Dashboard Special Offers"><br><b>Admin Dashboard Special Offers</b></td>
  </tr>
</table>