const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// In-memory database
let products = [
  { id: 1, name: 'T-Shirt', price: 19.99, sizes: ['S', 'M', 'L', 'XL'], colors: ['Red', 'Blue', 'Green', 'Black'] },
  { id: 2, name: 'Jeans', price: 49.99, sizes: ['28', '30', '32', '34'], styles: ['Slim Fit', 'Regular Fit', 'Relaxed Fit'] }
];

let cart = [];

app.get('/', (req, res) => {
  res.render('index', { products });
});

app.post('/add-to-cart', (req, res) => {
  const { productId, size, color, style } = req.body;
  const product = products.find(p => p.id === parseInt(productId));
  
  if (product) {
    const cartItem = { ...product, size, color, style };
    cart.push(cartItem);
    res.json({ success: true, message: 'Product added to cart', item: cartItem });
  } else {
    res.status(404).json({ success: false, message: 'Product not found' });
  }
});

app.get('/cart', (req, res) => {
  res.render('cart', { cart });
});

app.post('/checkout', (req, res) => {
  // Simulate checkout process
  cart = [];
  res.json({ success: true, message: 'Checkout successful' });
});

app.listen(port, () => {
  console.log(`E-commerce app listening at http://localhost:${port}`);
});