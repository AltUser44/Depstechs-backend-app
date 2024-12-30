const Order = require('../orders/orders.model');
const express = require('express');
const User = require('../users/user.model');
const router = express.Router();
const Reviews = require('../reviews/reviews.model');
const Products = require('../products/product.model');

// user stats by email

router.get('/user-stats/:email', async (req, res) => {
    const { email } = req.params;
    if(!email) {
        return res.status(400).send({message: "Email is required"});
    }
    try {
        const user = await User.findOne({ email: email})

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        

        // sum of all orders
        const totalPaymentsResult = await Order.aggregate([
            { $match: {email: email}}, 
            {
                $group: {_id: null, totalAmount: {$sum: "$amount"}}
            }
        ])

        const totalPaymentsAmount = totalPaymentsResult.length > 0 ? totalPaymentsResult[0].totalAmount : 0
        
        // get total review
        const totalReviews = await Reviews.countDocuments({userId: user._id})

        //total purchased products
        const purchasedProductsIds = await Order.distinct("products.productId", {email: email});
        const totalPurchasedProducts = purchasedProductsIds.length;

        res.status(200).send({
            totalPayments: totalPaymentsAmount.toFixed(2),
            totalReviews,
            totalPurchasedProducts
        });

    } catch (error) {
        console.error("Error fetching user stats", error);
        res.status(500).send({message: "Failed to fetch user stats"});
    }
})

// admin stats by email
router.get('/admin-stats', async (req, res) => {
    try {
        // Fetch counts of orders, products, reviews, and users
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Products.countDocuments();
        const totalReviews = await Reviews.countDocuments();
        const totalUsers = await User.countDocuments();

        // Calculate total earnings
        const totalEarningsResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: "$amount" } // Corrected typo from $um to $sum
                }
            }
        ]);

        const totalEarnings = totalEarningsResult.length > 0 ? totalEarningsResult[0].totalEarnings : 0;

        // Calculate monthly earnings
        const monthlyEarningsResult = await Order.aggregate([
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    monthlyEarnings: { $sum: "$amount" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 } // Corrected typo from $sor to $sort
            }
        ]);

        // Format monthly earnings
        const monthlyEarnings = monthlyEarningsResult.map(entry => ({
            month: entry._id.month,
            year: entry._id.year,
            earnings: entry.monthlyEarnings.toFixed(2)
        }));

        // Send the response with stats
        res.status(200).json({
            totalOrders,
            totalProducts,
            totalReviews,
            totalUsers,
            totalEarnings,
            monthlyEarnings
        });

    } catch (error) {
        console.error("Error fetching admin stats", error);
        res.status(500).send({ message: "Failed to fetch admin stats" });
    }
});

module.exports = router; 