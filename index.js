const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const uploadImage = require('./src/utils/uploadImage'); // Image upload utility

const port = process.env.PORT || 5000;

// Middleware setup
app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS Configuration
const corsOptions = {
  origin: 'https://depstechs-frontend-app.vercel.app', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // Include all necessary methods
  credentials: true, // If cookies or authentication tokens are involved
};
app.use(cors(corsOptions));

// MongoDB connection
async function main() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('MongoDB is successfully connected.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
main();

// Routes
app.get('/', (req, res) => {
  res.send('Depstechs E-commerce Server is running!');
});

// Image Upload Route
app.post('/uploadImage', (req, res) => {
  uploadImage(req.body.image)
    .then((url) => res.send(url))
    .catch((err) => {
      console.error('Error uploading image', err);
      res.status(500).send({ message: 'Image upload failed', error: err });
    });
});

// All other routes
const authRoutes = require('./src/users/user.route');
const productRoutes = require('./src/products/products.route');
const reviewRoutes = require('./src/reviews/reviews.router');
const orderRoutes = require('./src/orders/orders.route');
const statsRoutes = require('./src/stats/stats.route');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
