// services/requests.js - This file will contain methods for interfacing with the Postgresql database (located on Heroku) via Prisma ORM

// Require in the Prisma Client
const { PrismaClient } = require('@prisma/client')

// Create new instance of the Prisma Client
const prisma = new PrismaClient()

// GET ALL USERS
async function getAllUsers() {
    try {
        const allUsers = await prisma.app_user.findMany();
        return allUsers;
    } catch (error) {
        throw new Error('Database error: ' + error.message);
    }
}

// GET USER BY EMAIL
async function getUserByEmail(userEmail) {
    try {
        const user = await prisma.app_user.findUnique({
            where: {
                email: userEmail
            }
        });
        return user;
    } catch (error) {
        throw new Error('Database error when fetching user by email: ' + error.message);
    }
}

// GET USER BY ID
async function getUserById(id) {
    try {
        const user = await prisma.app_user.findUnique({
            where: {
                id: id
            }
        });
        return user;
    } catch (error) {
        throw new Error('Database error when fetching user by ID: ' + error.message);
    }
}

// GET USER BY UID
async function getUserByUID(uid) {
    try {
        const user = await prisma.app_user.findFirst({
            where: {
                uid: uid
            }
        });
        return user;
    } catch (error) {
        throw new Error('Database error when fetching user by UID: ' + error.message);
    }
}

// ADD USER
async function addUser(firstName, lastName, email, uid) {
    try {
        const createdUser = await prisma.app_user.create({
            data: {
                first_name: firstName,
                last_name: lastName,
                email: email,
                uid: uid
            }
        });
        return createdUser;
    } catch (error) {
        throw new Error('Database error when adding user: ' + error.message);
    }
}

// UPDATE USER
async function updateUser(id, firstName, lastName, email) {
    try {
        const updateUser = await prisma.app_user.update({
            where: {
                id: id,
            },
            data: {
                first_name: firstName,
                last_name: lastName,
                email: email
            },
        });
        return updateUser;
    } catch (error) {
        throw new Error('Database error when updating user: ' + error.message);
    }
}

// DELETE USER
async function deleteUser(uid) {
    try {
        const deleteUser = await prisma.app_user.deleteMany({
            where: {
                uid: uid,
            }
        });
        return deleteUser;
    } catch (error) {
        throw new Error('Database error when deleting user: ' + error.message);
    }
}

// UPDATE USER PASSWORD
async function updateUserPassword(id, newPassword) {
    try {
        const updateUser = await prisma.app_user.update({
            where: {
                id: id,
            },
            data: {
                password: newPassword
            },
        });
        return updateUser;
    } catch (error) {
        throw new Error('Database error when updating user password: ' + error.message);
    }
}

// GET ALL PRODUCTS
async function getAllProducts() {
    try {
        const allProducts = await prisma.product.findMany();
        return allProducts;
    } catch (error) {
        throw new Error('Database error when fetching all products: ' + error.message);
    }
}

// GET PRODUCT BY ID
async function getProductById(id) {
    try {
        const product = await prisma.product.findUnique({
            where: {
                id: id
            }
        });
        return product;
    } catch (error) {
        throw new Error('Database error when fetching product by ID: ' + error.message);
    }
}

// GET PRODUCT BY QUERY PARAMETER
async function getProductByQuery(query, value) {
    try {
        const products = await prisma.product.findMany({
            where: {
                [query]: value
            }
        });
        return products;
    } catch (error) {
        throw new Error('Database error when fetching product by query: ' + error.message);
    }
}

// GET PRODUCT BY MULTIPLE QUERY PARAMETERS (category_code and discount_type)
async function getProductsByMultiQuery(categoryCode, discountType) {
    try {
        const products = await prisma.product.findMany({
            where: {
                category_code: categoryCode,
                discount_type: discountType
            }
        });
        return products;
    } catch (error) {
        throw new Error('Database error when fetching products by multiple queries: ' + error.message);
    }
}

// ADD CART
async function addCart(userId) {
    try {
        await prisma.cart.create({
            data: {
                user_id: userId
            }
        });
    } catch (error) {
        throw new Error('Database error when adding cart: ' + error.message);
    }
}

// GET CART BY USER ID
async function getCartByUserId(userId) {
    try {
        const cart = await prisma.cart.findFirst({
            where: {
                user_id: userId
            },
            include: {
                cart_product: {
                    select: {
                        product_id: true,
                        quantity: true
                    }
                }
            }
        });
        return cart;
    } catch (error) {
        throw new Error('Database error when fetching cart by user ID: ' + error.message);
    }
}

// ADD PRODUCT TO CART
async function addProductToCart(cartId, productId) {
    try {
        // Check if product is already in cart
        const foundProduct = await prisma.cart_product.findFirst({ where: { cart_id: cartId, product_id: productId } });

        if (foundProduct) {
            // Increment the quantity of the product in the cart
            await prisma.cart_product.updateMany({
                where: {
                    cart_id: cartId,
                    product_id: productId
                },
                data: {
                    quantity: {
                        increment: 1
                    }
                }
            })
        }
        else {
            // Add the product to the cart
            await prisma.cart_product.create({
                data: {
                    cart_id: cartId,
                    product_id: productId
                }
            })
        }

        // Get the product so we can increment the cart's subtotal by the product's price
        const product = await prisma.product.findFirst({ where: { id: productId } });
        const discountPercent = product.discount_percent / 100;
        const finalPrice = product.price - (product.price * discountPercent);

        // Get the cart so we can update it's subtotal, taxes and total
        const cart = await prisma.cart.findFirst({ where: { id: cartId } });
        const updatedSubtotal = parseFloat(cart.subtotal) + finalPrice;
        const updatedTaxes = updatedSubtotal * 0.13;

        // Calculate the total
        // *The postgresql db rounds decimal values to 2 decimal places when entered into the db.
        // 'updatedSubtotal' and 'updatedTaxes' are added to the db as decimals and then rounded automatically by postgres.
        // The 'total' value we add to the db is calculated using the rounded values of 'updatedSubtotal' and 'updatedTaxes',
        // which is how 'updatedSubtotal' and 'updatedTaxes' appear in the db.
        const total = parseFloat(updatedSubtotal.toFixed(2)) + parseFloat(updatedTaxes.toFixed(2));

        // Increment num_items in the user's cart and update the subtotal, taxes and total
        await prisma.cart.update({
            where: {
                id: cartId
            },
            data: {
                subtotal: updatedSubtotal,
                taxes: updatedTaxes,
                total: total,
                num_items: {
                    increment: 1
                }
            }
        })
    } catch (error) {
        throw new Error('Database error when adding product to cart: ' + error.message);
    }
}

// REMOVE PRODUCT FROM CART
async function removeProductFromCart(cartId, productId) {
    try {
        // Check if product is in cart
        const foundProduct = await prisma.cart_product.findFirst({ where: { cart_id: cartId, product_id: productId } });

        if (foundProduct) {
            if (foundProduct.quantity > 1) {
                // Decrement the quantity field of the product in the cart
                await prisma.cart_product.updateMany({
                    where: {
                        cart_id: cartId,
                        product_id: productId
                    },
                    data: {
                        quantity: {
                            decrement: 1
                        }
                    }
                })

                // Get the product so we can decrement the cart's total by the product's price
                const product = await prisma.product.findUnique({ where: { id: productId } });
                const discountPercent = product.discount_percent / 100;
                const finalPrice = product.price - (product.price * discountPercent);

                // Get the cart so we can update it's subtotal, taxes and total
                const cart = await prisma.cart.findFirst({ where: { id: cartId } });
                const updatedSubtotal = parseFloat(cart.subtotal) - finalPrice;
                const updatedTaxes = updatedSubtotal * 0.13;

                // Calculate the total
                // *The postgresql db rounds decimal values to 2 decimal places when entered into the db.
                // 'updatedSubtotal' and 'updatedTaxes' are added to the db as decimals and then rounded automatically by postgres.
                // The 'total' value we add to the db is calculated using the rounded values of 'updatedSubtotal' and 'updatedTaxes',
                // which is how 'updatedSubtotal' and 'updatedTaxes' appear in the db.
                const total = parseFloat(updatedSubtotal.toFixed(2)) + parseFloat(updatedTaxes.toFixed(2));

                // Decrement num_items in the user's cart and update the subtotal, taxes and total  
                await prisma.cart.update({
                    where: {
                        id: cartId
                    },
                    data: {
                        subtotal: updatedSubtotal,
                        taxes: updatedTaxes,
                        total: total,
                        num_items: {
                            decrement: 1
                        }
                    }
                })
                // Product removed
                return true;
            } else {
                // Product found but not removed
                return false;
            }
        } else {
            // Product not found in cart
            return false;
        }
    } catch (error) {
        throw new Error('Database error when removing product from cart: ' + error.message);
    }
}

// DELETE PRODUCT FROM CART
async function deleteProductFromCart(cartId, productId) {
    try {
        // Check if product is in cart
        const foundProduct = await prisma.cart_product.findFirst({ where: { cart_id: cartId, product_id: productId } });

        if (foundProduct) {
            await prisma.cart_product.deleteMany({
                where: {
                    cart_id: cartId,
                    product_id: productId
                }
            })

            const quantity = foundProduct.quantity;

            // Get the product so we can decrement the cart's subtotal by the product's price
            const product = await prisma.product.findUnique({ where: { id: productId } });
            const discountPercent = product.discount_percent / 100;
            let finalPrice = product.price - (product.price * discountPercent);
            finalPrice = Math.floor(finalPrice * 100) / 100;

            // Get the cart so we can update it's subtotal, taxes, total and number of items
            const cart = await prisma.cart.findFirst({ where: { id: cartId } });
            let cartProductTotalTruncated = Math.floor((finalPrice * quantity) * 100) / 100 // (finalPrice * quantity) with 2 decimal places

            // If this product has a discount and...
            // If the cart's subtotal still has a value after deleting this product
            // which happens when: 
            // 1. There are still other products in the cart 
            // 2. There are no other products in cart, but cart.subtotal still has a value from a rounding difference
            if (discountPercent && parseFloat(cart.subtotal) > cartProductTotalTruncated) {
                // Round up cartProductTotalTruncated                        
                cartProductTotalTruncated = cartProductTotalTruncated.toFixed(1);

                // If cartProductTotalTruncated doesn't equal cart.subtotal after rounding cartProductTotalTruncated,
                // try cart.subtotal.toFixed(1) and if it === cartProductTotalTruncated
                if (cartProductTotalTruncated !== parseFloat(cart.subtotal)) {
                    // if cartProductTotalTruncated === cart.subtotal, set cart.subtotal.toFixed(1)
                    if (cartProductTotalTruncated === cart.subtotal.toFixed(1)) {
                        cart.subtotal = cart.subtotal.toFixed(1);
                    }
                }
            }

            // DELETING LAST PRODUCT IN CART...
            // If subtotal still has a value AND that value is equal to finalPrice * quantity
            if (parseFloat(cart.subtotal) > cartProductTotalTruncated && (finalPrice * quantity) === parseFloat(cart.subtotal)) {
                // Set cartProductTotalTruncated = finalPrice * quantity
                cartProductTotalTruncated = finalPrice * quantity;
            }

            // DELETING A PRODUCT FROM THE CART...
            // If subtotal still has a value AND that value is NOT equal to finalPrice * quantity
            if (parseFloat(cart.subtotal) > cartProductTotalTruncated && (finalPrice * quantity) !== parseFloat(cart.subtotal)) {
                // Set cartProductTotalTruncated ?? 
                cartProductTotalTruncated = finalPrice * quantity;
                if (cart.num_items === 1) {
                    console.log("!! CART IS EMPTY(?) !!");
                }
            }

            const updatedSubtotal = parseFloat(cart.subtotal) - parseFloat(cartProductTotalTruncated);
            const updatedTaxes = updatedSubtotal * 0.13;

            // Calculate the total
            // *The postgresql db rounds decimal values to 2 decimal places when entered into the db.
            // 'updatedSubtotal' and 'updatedTaxes' are added to the db as decimals and then rounded automatically by postgres.
            // The 'total' value we add to the db is calculated using the rounded values of 'updatedSubtotal' and 'updatedTaxes',
            // which is how 'updatedSubtotal' and 'updatedTaxes' appear in the db.
            const total = parseFloat(updatedSubtotal.toFixed(2)) + parseFloat(updatedTaxes.toFixed(2));

            // Decrement num_items in the user's cart and update the subtotal, taxes and total  
            await prisma.cart.update({
                where: {
                    id: cartId
                },
                data: {
                    subtotal: updatedSubtotal,
                    taxes: updatedTaxes,
                    total: total,
                    num_items: {
                        decrement: quantity
                    }
                }
            })

            // Product deleted
            return true;
        }
        else {
            // Product not deleted
            return false;
        }
    } catch (error) {
        throw new Error('Database error when deleting product from cart: ' + error.message);
    }
}

// ADD CHECKOUT SESSION
async function addCheckout(userId, cart) {
    try {
        await prisma.checkout_session.create({
            data: {
                user_id: userId,
                cart_id: cart.id
            }
        })
    } catch (error) {
        throw new Error('Database error when adding checkout session: ' + error.message);
    }
}

// GET CHECKOUT SESSION BY USERID
async function getCheckout(userId) {
    try {
        const checkoutSession = await prisma.checkout_session.findFirst({
            where: {
                user_id: userId
            },
            include: {
                cart: {
                    include: {
                        cart_product: true
                    }
                }
            }
        });
        return checkoutSession;
    } catch (error) {
        throw new Error('Database error when getting checkout session: ' + error.message);
    }
}

// DELETE CHECKOUT SESSION
async function deleteCheckout(userId) {
    try {
        await prisma.checkout_session.deleteMany({
            where: {
                user_id: userId
            }
        })
    } catch (error) {
        throw new Error('Database error when deleting checkout session: ' + error.message);
    }
}

// ADD CHECKOUT SESSION SHIPPING ADDRESS
async function addCheckoutSessionShippingAddress(addressObj) {
    try {
        const address = await prisma.address.create({
            data: {
                first_name: addressObj.firstName,
                last_name: addressObj.lastName,
                address: addressObj.address,
                unit: addressObj.unit,
                city: addressObj.city,
                province: addressObj.province,
                country: addressObj.country,
                postal_code: addressObj.postalCode,
                phone_number: addressObj.phoneNumber,
                address_type: addressObj.addressType,
                user_id: addressObj.userId
            }
        })
        return address;
    } catch (error) {
        throw new Error('Database error when adding checkout session shipping address: ' + error.message);
    }
}

// UPDATE CHECKOUT SESSION SHIPPING ADDRESS
async function updateCheckoutShipping(userId, addressId) {
    try {
        // Update the checkout shipping info
        await prisma.checkout_session.updateMany({
            where: {
                user_id: userId
            },
            data: {
                shipping_address_id: addressId
            }
        })

        // If user selected their primary shipping address, delete the alternate shipping address if it exists
        const newShippingAddressChoice = await getAddressById(userId, addressId);
        const foundAltShippingAddress = await getAddressByType(userId, "shipping_alternate");
        if (newShippingAddressChoice.address_type === "shipping_primary" && foundAltShippingAddress) {
            await deleteAddress(foundAltShippingAddress.id);
        }
    } catch (error) {
        throw new Error('Database error when updating checkout shipping: ' + error.message);
    }
}

// UPDATE CHECKOUT SESSION BILLING ADDRESS
async function updateCheckoutBilling(userId, addressId) {
    try {
        await prisma.checkout_session.updateMany({
            where: {
                user_id: userId
            },
            data: {
                billing_address_id: addressId
            }
        })
    } catch (error) {
        throw new Error('Database error when updating checkout billing: ' + error.message);
    }
}

// UPDATE CHECKOUT SESSION STAGE
async function updateCheckoutStage(userId, stageName) {
    try {
        await prisma.checkout_session.updateMany({
            where: {
                user_id: userId
            },
            data: {
                stage: stageName
            }
        })
    } catch (error) {
        throw new Error('Database error when updating checkout stage: ' + error.message);
    }
}

// ADD ADDRESS
async function addAddress(addressObj) {
    try {
        const address = await prisma.address.create({
            data: {
                first_name: addressObj.firstName,
                last_name: addressObj.lastName,
                address: addressObj.address,
                unit: addressObj.unit,
                city: addressObj.city,
                province: addressObj.province,
                country: addressObj.country,
                postal_code: addressObj.postalCode,
                phone_number: addressObj.phoneNumber,
                address_type: addressObj.addressType,
                user_id: addressObj.userId
            }
        })
        return address;
    } catch (error) {
        throw new Error('Database error when adding address: ' + error.message);
    }
}

// GET ADDRESS BY ADDRESS ID
async function getAddressById(userId, addressId) {
    try {
        const foundAddress = await prisma.address.findFirst({
            where: {
                user_id: userId,
                id: addressId
            }
        })
        return foundAddress;
    } catch (error) {
        throw new Error('Database error when getting address by id: ' + error.message);
    }
}

// GET ADDRESS BY ADDRESS TYPE
async function getAddressByType(userId, addressType) {
    try {
        const foundAddress = await prisma.address.findFirst({
            where: {
                user_id: userId,
                address_type: addressType
            }
        })
        return foundAddress;
    } catch (error) {
        throw new Error('Database error when getting address by type: ' + error.message);
    }
}

// UPDATE ADDRESS
async function updateAddress(addressId, userId, addressObj) {
    try {
        await prisma.address.update({
            where: {
                id: addressId,
                user_id: userId
            },
            data: {
                first_name: addressObj.firstName,
                last_name: addressObj.lastName,
                address: addressObj.address,
                unit: addressObj.unit,
                city: addressObj.city,
                province: addressObj.province,
                country: addressObj.country,
                postal_code: addressObj.postalCode,
                phone_number: addressObj.phoneNumber,
            }
        })
    } catch (error) {
        throw new Error('Database error when updating address: ' + error.message);
    }
}

// DELETE ADDRESS
async function deleteAddress(addressId) {
    try {
        await prisma.address.delete({ where: { id: addressId } });
    } catch (error) {
        throw new Error('Database error when deleting address: ' + error.message);
    }
}

// ADD AN ORDER
async function addOrder(userId, cartId) {
    try {
        // Step 1. Get the checkout session
        const checkoutSession = await getCheckout(userId);

        // Step 2: Fetch Shipping Address (if available)
        let shippingAddress = null;
        if (checkoutSession.shipping_address_id) {
            shippingAddress = await getAddressById(userId, checkoutSession.shipping_address_id);

            if (!shippingAddress) {
                throw new Error('Shipping address not found.');
            }
        }

        // Step 3: Fetch Billing Address 
        const billingAddress = await getAddressById(userId, checkoutSession.billing_address_id);

        if (!billingAddress) {
            throw new Error('Billing address not found.');
        }

        // Step 4: Create the order
        const order = await prisma.order.create({
            data: {
                user_id: userId,
                num_items: checkoutSession.cart.num_items,
                subtotal: checkoutSession.cart.subtotal,
                taxes: checkoutSession.cart.taxes,
                total: checkoutSession.cart.total,

                // Embed Shipping Address Fields
                shipping_street_address: shippingAddress.address,
                shipping_unit: shippingAddress.unit,
                shipping_city: shippingAddress.city,
                shipping_province: shippingAddress.province,
                shipping_country: shippingAddress.country,
                shipping_postal_code: shippingAddress.postal_code,
                shipping_phone_number: shippingAddress.phone_number,

                // Embed Billing Address Fields (Similarly)
                billing_street_address: billingAddress.address,
                billing_unit: billingAddress.unit,
                billing_city: billingAddress.city,
                billing_province: billingAddress.province,
                billing_country: billingAddress.country,
                billing_postal_code: billingAddress.postal_code,
                billing_phone_number: billingAddress.phone_number,
            }
        })

        // Step 5: Create an order product for each product in the cart
        const checkoutProducts = checkoutSession.cart.cart_product;
        const orderProducts = [];
        for (const checkoutProduct of checkoutProducts) {
            const orderProduct = await prisma.order_product.create({
                data: {
                    order_id: order.id,
                    product_id: checkoutProduct.product_id,
                    quantity: checkoutProduct.quantity
                }
            })
            // Add order product to array
            orderProducts.push(orderProduct);
        }

        // Step 6: Delete the cart products
        await prisma.cart_product.deleteMany({
            where: {
                cart_id: cartId
            }
        })

        // Step 7: Update product inventory
        for (const orderProduct of orderProducts) {
            await prisma.product.update({
                where: {
                    id: orderProduct.product_id
                },
                data: {
                    total_sold: {
                        increment: orderProduct.quantity
                    },
                    inventory: {
                        decrement: orderProduct.quantity
                    }
                }
            })
        }

        // Step 8: Delete the alternate shipping address if it exists
        if (shippingAddress.address_type === "shipping_alternate") {
            await prisma.address.deleteMany({
                where: {
                    user_id: userId,
                    address_type: "shipping_alternate"
                }
            })
        }

        // Step 9: Delete the checkout session
        await prisma.checkout_session.delete({
            where: {
                id: checkoutSession.id
            }
        })

        // Step 10: Clear the cart
        await prisma.cart.update({
            where: {
                id: cartId
            },
            data: {
                num_items: 0,
                subtotal: 0,
                taxes: 0,
                total: 0
            }
        })
    } catch (error) {
        throw new Error('Database error when adding order: ' + error.message);
    }
}

// GET ORDERS AND INCLUDE ORDER PRODUCTS
async function getOrders(userId) {
    try {
        const foundOrders = await prisma.order.findMany({
            where: {
                user_id: userId
            },
            include: {
                order_product: {
                    include: {
                        product: true,
                    },
                },
            },
        })
        return foundOrders;
    } catch (error) {
        throw new Error('Database error when getting orders: ' + error.message);
    }
}

module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserById,
    getUserByUID,
    addUser,
    updateUser,
    deleteUser,
    updateUserPassword,
    getAllProducts,
    getProductById,
    getProductByQuery,
    getProductsByMultiQuery,
    addCart,
    getCartByUserId,
    addProductToCart,
    removeProductFromCart,
    deleteProductFromCart,
    addCheckout,
    getCheckout,
    deleteCheckout,
    updateCheckoutShipping,
    updateCheckoutBilling,
    updateCheckoutStage,
    getAddressByType,
    getAddressById,
    addAddress,
    updateAddress,
    deleteAddress,
    addOrder,
    getOrders,    
}
