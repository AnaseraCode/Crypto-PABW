const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3000;
const apiKey = process.env.COINMARKETCAP_API_KEY;

let coinsData = [];
let currentPage = 1;
const pageSize = 50;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

async function fetchCoins(start) {
  try {
    start = Math.max(start, 1); // Ensure start is at least 1
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
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
    const nextPageCoins = await fetchCoins(start);
    const currentPage = Math.floor((start - 1) / pageSize) + 1;
    res.render('index', { coins: nextPageCoins, currentPage });
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
    const prevPageCoins = await fetchCoins(start);
    const currentPage = Math.floor((start - 1) / pageSize) + 1;
    res.render('index', { coins: prevPageCoins, currentPage });
  } catch (error) {
    console.error('Error navigating to previous page:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route untuk pencarian koin (belum diimplementasikan)
app.get('/search', async (req, res) => {
  const searchString = req.query.q; // Mendapatkan query pencarian dari query parameter
  try {
    // Logic untuk mencari koin berdasarkan searchString
    // Contoh: const searchResults = await searchCoins(searchString);
    // res.json(searchResults);
  } catch (error) {
    console.error('Error searching coins:', error); // Menangani error saat mencari koin
    res.status(500).json({ error: 'Internal Server Error' }); // Mengirim status error 500
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
