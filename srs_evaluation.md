# Shopping Cart Application - SRS Evaluation

## 1. Introduction
### 1.1 Purpose
- [x] Define requirements for an online shopping cart application.
- [x] Allow users to browse and purchase items from multiple categories.
- [x] User authentication (Google, Facebook, Passkey).
- [x] Product management.
- [x] Order calculation.

### 1.2 Scope
- [x] Display items with images and details.
- [x] Allow users to add, edit, and delete items from the cart.
- [x] Maintain multiple product categories.
- [x] Calculate the total price dynamically.
- [x] Provide secure login options (Facebook, Google, Passkey).
- [x] Work on desktop and mobile browsers.

## 2. Overall Description
### 2.1 Product Perspective
- [x] Web-based application.
- [x] Frontend: HTML, CSS, JavaScript framework (React + Tailwind).
- [x] Backend: Database for storing products, categories, and user data (Node.js, Express, MongoDB).

### 2.2 User Characteristics
- [x] End-users with basic internet knowledge.
- [x] Admin users to manage products and categories.

### 2.3 Constraints
- [x] Secure login and data storage.
- [x] Mobile-responsive design.
- [x] Fast loading and easy navigation.

## 3. Functional Requirements
### 1. User Registration and Login
- [x] Users can log in using Facebook, Google, or Passkey authentication.
- [x] Admin users can log in separately.

### 2. Category and Product Browsing
- [x] System displays products in categories: Vegetables, Fruits, Cakes, Biscuits, etc.
- [x] Each product shows an image, name, price, and description.

### 3. Shopping Cart Management
- [x] Add items to the cart.
- [x] Edit item quantities.
- [x] Delete items from the cart.
- [x] Display updated total dynamically.

### 4. Checkout
- [x] Show order summary before payment.

### 5. Admin Features
- [x] Add, edit, and delete products.
- [x] Manage categories.

## 4. Non-Functional Requirements
- [x] **Security**: OAuth integration for Google and Facebook, Passkey support.
- [x] **Performance**: Handle at least 100 concurrent users.
- [x] **Usability**: Simple UI, responsive design.
- [x] **Reliability**: Data backup and error handling.

## 5. System Interfaces
- [x] **Frontend**: Web browsers (Chrome, Edge, Safari).
- [x] **Backend**: Database (MongoDB).
- [x] **Third-party APIs**: Facebook Login API, Google Sign-In, Passkey integration.

## 6. Future Enhancements
- [x] Payment gateway integration (Simulated Stripe payment flow).
- [x] Order history (Users can view past orders in their account).
- [ ] Recommendation system.
