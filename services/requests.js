// services/requests.js - This file will contain methods for interfacing with the Postgresql database (located on Heroku) via Prisma ORM

// Require in the Prisma Client
const { PrismaClient } = require('@prisma/client')

// Create new instance of the Prisma Client
const prisma = new PrismaClient()

// Require in the dotenv module which will get environment variables located in .env file
require('dotenv').config();

// GET ALL USERS
async function getAllUsers() {
    const allUsers = await prisma.app_user.findMany();
    return allUsers;
}

// GET USER BY EMAIL
async function getUserByEmail(userEmail) {
    const user = await prisma.app_user.findUnique({
        where: {
            email: userEmail
        }
    });
    return user;
}

// GET USER BY ID
async function getUserById(id) {
    const user = await prisma.app_user.findUnique({
        where: {
            id: id
        }
    });
    return user;
}

// ADD USER
async function addUser(firstName, lastName, email, hashedPassword) {
    const createdUser = await prisma.app_user.create({
        data: {
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: hashedPassword
        }
    });
    return createdUser;
}

// UPDATE USER
async function updateUser(id, firstName, lastName, email) {
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
    return updateUser
}

// DELETE USER
async function deleteUser(id) {
    const deleteUser = await prisma.app_user.delete({
        where: {
            id: id,
        }
    });
    return deleteUser
}

// UPDATE USER PASSWORD
async function updateUserPassword(id, newPassword) {
    const updateUser = await prisma.app_user.update({
        where: {
            id: id,
        },
        data: {
            password: newPassword
        },
    });
    return updateUser
}

// GET ALL PRODUCTS
async function getAllProducts() {
    const allProducts = await prisma.product.findMany();
    return allProducts;
}

// GET PRODUCT BY ID
async function getProductById(id) {
    const product = await prisma.product.findUnique({
        where: {
            id: id
        }
    });
    return product;
}

// GET PRODUCT BY QUERY PARAMETER
async function getProductByQuery(query, value) {
    const products = await prisma.product.findMany({
        where: {
            [query]: value
        }
    });
    return products;
}

// GET PRODUCT BY MULTIPLE QUERY PARAMETERS (category_code and discount_type)
async function getProductsByMultiQuery(categoryCode, discountType) {
    const products = await prisma.product.findMany({
        where: {
            category_code: categoryCode,
            discount_type: discountType
        }
    });
    return products;
}

// ADD CART
async function addCart(userId) {
    await prisma.cart.create({
        data: {
            user_id: userId
        }
    })
}

// GET CART BY USER ID
async function getCartByUserId(userId) {
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
}

// ADD PRODUCT TO CART
async function addProductToCart(cartId, productId) {    
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
    const updatedTotal = updatedSubtotal + updatedTaxes;
              
    // Increment num_items in the user's cart and update the subtotal, taxes and total
    await prisma.cart.update({
        where: {
            id: cartId
        },
        data: {
            subtotal: updatedSubtotal,
            taxes: updatedTaxes,
            total: updatedTotal,
            num_items: {
                increment: 1
            }
        }
    })
}

// REMOVE PRODUCT FROM CART
async function removeProductFromCart(cartId, productId) {
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
        }
        else {
            // Delete the product from the cart
            await prisma.cart_product.deleteMany({
                where: {
                    cart_id: cartId,
                    product_id: productId
                }
            })
        }
        
        // Get the product so we can decrement the cart's total by the product's price
        const product = await prisma.product.findUnique({ where: { id: productId } });
        const discountPercent = product.discount_percent / 100;
        const finalPrice = product.price - (product.price * discountPercent);

        // Get the cart so we can update it's subtotal, taxes and total
        const cart = await prisma.cart.findFirst({ where: { id: cartId } });
        const updatedSubtotal = parseFloat(cart.subtotal) - finalPrice;
        const updatedTaxes = updatedSubtotal * 0.13;        
        const updatedTotal = updatedSubtotal + updatedTaxes;
        
        // Decrement num_items in the user's cart and update the subtotal, taxes and total  
        await prisma.cart.update({
            where: {
                id: cartId
            },
            data: {
                subtotal: updatedSubtotal,
                taxes: updatedTaxes,
                total: updatedTotal,
                num_items: {
                    decrement: 1
                }
            }
        })    
        // Product removed / deleted
        return true;
    } else {
        // Product not found in cart
        return false;
    }
}

// ADD CHECKOUT SESSION
async function addCheckout(userId, cart) {        
    await prisma.checkout_session.create({
        data:{
            user_id: userId,
            cart_id: cart.id
        }
    })
}

// GET CHECKOUT SESSION BY USERID
async function getCheckout(userId) {
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
}

// DELETE CHECKOUT SESSION
async function deleteCheckout(userId){
    await prisma.checkout_session.deleteMany({
        where:{
            user_id: userId
        }
    })
}

// UPDATE CHECKOUT SESSION SHIPPING ADDRESS
async function updateCheckoutShipping(userId, addressId) {                
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
}

// UPDATE CHECKOUT SESSION BILLING ADDRESS
async function updateCheckoutBilling(userId, addressId) {                    
    await prisma.checkout_session.updateMany({
        where: {
            user_id: userId
        },
        data: {
            billing_address_id: addressId
        }
    })
}

// UPDATE CHECKOUT SESSION PAYMENT CARD
async function updateCheckoutPaymentCard(userId, paymentCardId) {                    
    await prisma.checkout_session.updateMany({
        where: {
            user_id: userId
        },
        data: {
            payment_card_id: paymentCardId
        }
    })
}

// UPDATE CHECKOUT SESSION STAGE
async function updateCheckoutStage(userId, stageName) {                    
    await prisma.checkout_session.updateMany({
        where: {
            user_id: userId
        },
        data: {
            stage: stageName
        }
    })
}

// ADD ADDRESS
async function addAddress(addressObj) {
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
}

// GET ADDRESS BY ADDRESS ID
async function getAddressById(userId, addressId){
    const foundAddress = await prisma.address.findFirst({
        where:{
            user_id: userId,
            id: addressId            
        }
    })
    return foundAddress;
}

// GET ADDRESS BY ADDRESS TYPE
async function getAddressByType(userId, addressType){
    const foundAddress = await prisma.address.findFirst({
        where:{
            user_id: userId,
            address_type: addressType            
        }
    })
    return foundAddress;
}

// UPDATE ADDRESS
async function updateAddress(addressId, userId, addressObj) {
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
}

// DELETE ADDRESS
async function deleteAddress(addressId){
    await prisma.address.delete({ where: { id: addressId } });
}

// ADD PAYMENT CARD
async function addPaymentCard(cardObj) {        
   const paymentCard = await prisma.payment_card.create({
        data: {
            card_number: cardObj.cardNumber,
            first_name: cardObj.firstName,
            last_name: cardObj.lastName,
            security_code: cardObj.securityCode,
            expiration_month: cardObj.expirationMonth,
            expiration_year: cardObj.expirationYear,
            payment_card_type: cardObj.paymentCardType,
            user_id: cardObj.userId
        }
    })
    return paymentCard;
}

// GET PAYMENT CARD
async function getPaymentCard(userId){
    const paymentCard = await prisma.payment_card.findFirst({
        where:{
            user_id: userId
        }
    })
    return paymentCard;
}

// UPDATE PAYMENT CARD
async function updatePaymentCard(paymentCardId, userId, cardObj) {
    await prisma.payment_card.update({
        where: {
            id: paymentCardId,
            user_id: userId            
        },
        data: {
            card_number: cardObj.cardNumber,
            first_name: cardObj.firstName,
            last_name: cardObj.lastName,
            security_code: cardObj.securityCode,
            expiration_month: cardObj.expirationMonth,
            expiration_year: cardObj.expirationYear
        }
    })
}

// DELETE PAYMENT CARD
async function deletePaymentCard(paymentCardId, userId) {
    await prisma.payment_card.delete({
        where: {
            id: paymentCardId,
            user_id: userId
        }
    })
}

// ADD AN ORDER
async function addOrder(userId, cartId) {
    // 1. Get the checkout session
    const checkoutSession = await getCheckout(userId);

    // 2. Create the order's shipping address
    const checkoutShippingAddress = await getAddressById(userId, checkoutSession.shipping_address_id);
    const orderShippingAddressObj = {
        firstName: checkoutShippingAddress.first_name,
        lastName: checkoutShippingAddress.last_name,
        address: checkoutShippingAddress.address,
        unit: checkoutShippingAddress.unit,
        city: checkoutShippingAddress.city,
        province: checkoutShippingAddress.province,
        country: checkoutShippingAddress.country,
        postalCode: checkoutShippingAddress.postal_code,
        phoneNumber: checkoutShippingAddress.phone_number,
        addressType: "shipping_order",
        userId: userId
    }
    const orderShippingAddress = await addAddress(orderShippingAddressObj);

    // 3. Create the order's billing address (if different from shipping address)
    let orderBillingAddress;
    if (checkoutSession.billing_address_id !== checkoutSession.shipping_address_id) {
        const checkoutBillingAddress = await getAddressById(userId, checkoutSession.billing_address_id);
        const orderBillingAddressObj = {
            firstName: checkoutBillingAddress.first_name,
            lastName: checkoutBillingAddress.last_name,
            address: checkoutBillingAddress.address,
            unit: checkoutBillingAddress.unit,
            city: checkoutBillingAddress.city,
            province: checkoutBillingAddress.province,
            country: checkoutBillingAddress.country,
            postalCode: checkoutBillingAddress.postal_code,
            phoneNumber: checkoutBillingAddress.phone_number,
            addressType: "billing_order",
            userId: userId
        }
        orderBillingAddress = await addAddress(orderBillingAddressObj);
    }else{
        orderBillingAddress = await getAddressById(userId, orderShippingAddress.id);
    }

    // 4. Create the order's payment card
    const checkoutPaymentCard = await getPaymentCard(userId);
    const orderPaymentCardObj = {
        cardNumber: checkoutPaymentCard.card_number,
        firstName: checkoutPaymentCard.first_name,
        lastName: checkoutPaymentCard.last_name,
        securityCode: checkoutPaymentCard.security_code,
        expirationMonth: checkoutPaymentCard.expiration_month,
        expirationYear: checkoutPaymentCard.expiration_year,
        paymentCardType: "order",
        userId: userId
    }
    const orderPaymentCard = await addPaymentCard(orderPaymentCardObj);

    // 5. Create the order
    const order = await prisma.order.create({
        data: {
            user_id: userId,
            num_items: checkoutSession.cart.num_items,
            subtotal: checkoutSession.cart.subtotal,
            taxes: checkoutSession.cart.taxes,
            total: checkoutSession.cart.total,
            payment_card_id: orderPaymentCard.id,
            shipping_address_id: orderShippingAddress.id,
            billing_address_id: orderBillingAddress.id
        }
    })

    // 6. Create the order products
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

    // 7. Delete the checkout session
    await prisma.checkout_session.delete({
        where: {
            id: checkoutSession.id
        }
    })

    // 8. Delete the cart products
    await prisma.cart_product.deleteMany({
        where: {
            cart_id: cartId
        }
    })

    // 9. Clear the cart
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

    // 10. Delete the alternate shipping address if it exists
    if (checkoutShippingAddress.address_type === "shipping_alternate") {
        await prisma.address.deleteMany({
            where: {
                user_id: userId,
                address_type: "shipping_alternate"
            }
        })
    }

    // 11. Update product inventory    
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
}

// GET ORDERS
async function getOrders(userId){
    const foundOrders = await prisma.order.findMany({
        where:{
            user_id: userId
        },
        include:{
            order_product: true
        }
    })
    return foundOrders;
}

module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserById,
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
    addCheckout,
    getCheckout,
    deleteCheckout,
    updateCheckoutShipping,
    updateCheckoutBilling,
    updateCheckoutPaymentCard,
    updateCheckoutStage,
    getAddressByType,
    getAddressById,
    addAddress,
    updateAddress,
    deleteAddress,
    addPaymentCard,
    getPaymentCard,
    updatePaymentCard,
    deletePaymentCard,
    addOrder,
    getOrders
}
