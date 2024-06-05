const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3000;
const apiKey = process.env.COINMARKETCAP_API_KEY;

const pageSize = 50;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

async function fetchCoins(start) {
  try {
    start = Math.max(start, 1); // Ensure start is at least 1
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey
      },
      params: {
        start: start,
        limit: pageSize,
        convert: 'USD'
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching data from CoinMarketCap API:', error.response ? error.response.data : error.message);
    throw new Error('Error fetching data from CoinMarketCap API');
  }
}

// Route untuk halaman utama dengan pagination
app.get('/', async (req, res) => {
  try {
    let start = parseInt(req.query.start) || 1; // Ensure the start parameter is at least 1
    const coins = await fetchCoins(start);
    const currentPage = Math.floor((start - 1) / pageSize) + 1;
    res.render('index', { coins, currentPage });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching data from CoinMarketCap API');
  }
});

// Route untuk halaman selanjutnya
app.get('/nextPage', async (req, res) => {
  try {
    let start = parseInt(req.query.start) || 1;
    start += pageSize;
    const coins = await fetchCoins(start);
    const currentPage = Math.floor((start - 1) / pageSize) + 1;
    res.render('index', { coins, currentPage });
  } catch (error) {
    console.error('Error navigating to next page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route untuk halaman sebelumnya
app.get('/prevPage', async (req, res) => {
  try {
    let start = parseInt(req.query.start) || 1;
    start = Math.max(start - pageSize, 1); // Ensure start is at least 1
    const coins = await fetchCoins(start);
    const currentPage = Math.floor((start - 1) / pageSize) + 1;
    res.render('index', { coins, currentPage });
  } catch (error) {
    console.error('Error navigating to previous page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route untuk halaman monitor
app.get('/monitor', async (req, res) => {
  try {
    const selectedCoins = req.query.selected_coins ? req.query.selected_coins.split(',') : [];
    // Panggil fungsi fetchCoins untuk mendapatkan data koin terkait
    const coins = await fetchCoins(selectedCoins.join(',')); // Mengambil data koin berdasarkan simbol yang dipilih
    res.render('monitor', { coins });
  } catch (error) {
    console.error('Error fetching coins data for monitor:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route untuk halaman chart dengan simbol koin tertentu
app.get('/chart/:symbol', (req, res) => {
  const { symbol } = req.params; // Mendapatkan simbol koin dari parameter URL
  res.render('chart', { symbol }); // Merender halaman chart.ejs dengan simbol koin yang dipilih
});

// Route untuk halaman portfolio
app.get('/portfolio', (req, res) => {
  // Example portfolio data
  const portfolio = [
    { name: 'Bitcoin', symbol: 'BTC', quantity: 2, avgPrice: 400000000 },
    { name: 'Ethereum', symbol: 'ETH', quantity: 10, avgPrice: 30000000 },
    { name: 'Ripple', symbol: 'XRP', quantity: 5000, avgPrice: 7000 }
  ];
  res.render('portfolio', { portfolio });
});

// Memulai server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); // Menampilkan pesan ketika server berhasil berjalan
});