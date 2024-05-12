# Electronics Store Backend API

This Node.js/Express.js-based API powers the backend of the Electronics Store e-commerce application. It provides a comprehensive set of endpoints for managing user accounts, products, shopping carts, orders, and checkout processes.

**Base URL:** `https://the-electronics-store-api-962f1726488d.herokuapp.com/`

## Authentication

The API uses Firebase Authentication for secure user management. To interact with protected endpoints, use the provided test user:

![Image of the test user route](/readme_imgs/test_user.png)

## Custom Middleware

Custom middleware functions enhance API security and data integrity:

*   **Token Authentication:** Validates Firebase ID tokens to authorize requests.
*   **Cart Validation:** Ensures cart operations (add, remove, etc.) are performed on the correct user's cart.
*   **User Validation:** Protects user-specific endpoints (e.g., account details) from unauthorized access.

## Form Validation

In addition to client-side form validation, this application also uses the `validator` library for server-side form validation, ensuring data accuracy and prevents invalid submissions.

## Interactive Documentation (Swagger UI)

![Screen shot of Swagger UI](/readme_imgs/swag.png)

Explore and test the API endpoints in real time using the interactive Swagger UI documentation:

`https://the-electronics-store-api-962f1726488d.herokuapp.com/api-docs/`

## Endpoints

### Account

*   `GET /account/primary-address`: Get primary shipping address
*   `POST /account/primary-address`: Add primary shipping address
*   `PUT /account/primary-address`: Update primary shipping address
*   `GET /account/billing-address`: Get billing address
*   `POST /account/billing-address`: Add billing address
*   `PUT /account/billing-address`: Update billing address
*   `DELETE /account/billing-address`: Delete billing address
*   `POST /account/change-password`: Change password

### Addresses

*   `GET /address/{userId}/{addressId}`: Get a specific address

### Cart

*   `GET /cart`: Get cart
*   `POST /cart/add/{productId}`: Add product to cart
*   `POST /cart/remove/{productId}`: Remove product from cart
*   `GET /cart/delete/{productId}`: Delete product from cart

### Checkout

*   `POST /checkout/shipping/alt-address`: Add alternate shipping address
*   `GET /checkout/shipping/alt-address`: Get the alternate shipping address
*   `POST /checkout`: Create a checkout session
*   `GET /checkout`: Get the checkout session
*   `PUT /checkout/shipping/update-alt-address`: Update alternate shipping address
*   `POST /checkout/shipping/{addressId}`: Add shipping address to checkout session
*   `PUT /checkout/shipping/{addressId}`: Update the checkout session's shipping address
*   `POST /checkout/billing/{addressId}`: Add billing address to checkout session
*   `PUT /checkout/payment/billing/{addressId}`: Update billing address
*   `PUT /checkout/stage/{stageName}`: Update the checkout session's stage

### Orders

*   `GET /orders`: Get orders
*   `POST /orders/create`: Create an order

### Products

*   `GET /products`: Get all products
*   `GET /products/{id}`: Get product
*   `GET /products/category/{category_code}`: Get products by category code
*   `GET /products/category/contains/{category_code}`: Get products containing category code
*   `GET /cameras-drones`: Get all cameras and drones products
*   `GET /computers`: Get all computers
*   `GET /gaming`: Get all gaming products
*   `GET /home-electronics`: Get all home electronics products

### Register

*   `POST /register`: Register a new user

### Users

*   `GET /user`: Get user
*   `PUT /users/{id}`: Update user
*   `DELETE /users/{id}`: Delete user

### Test User (Swagger UI)

*   `GET /swagger-test-user`: Set the user to 'test user'

## Technologies Used

*   **Prisma:** ORM for database access
*   `Express.js`: Web framework for building the API
*   **Firebase Admin SDK:** Server-side interaction with Firebase
*   **swagger-jdoc:** Library for generating Swagger documentation from JSDoc comments
*   **swagger-ui-express:** Middleware for serving Swagger UI