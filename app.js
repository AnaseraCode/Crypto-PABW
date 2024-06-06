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

let watchlistCoins = []; // Array untuk menyimpan watchlist

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
app.post('/add-to-watchlist', bodyParser.json(), async (req, res) => {
  console.log("Received request to add to watchlist:", req.body); // Tambahkan log ini
  const { symbol } = req.body;
  if (!watchlistCoins.some(coin => coin.symbol === symbol)) {
    try {
      const response = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`, {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey
        },
        params: {
          symbol: symbol,
          convert: 'USD'
        }
      });
      const coinData = response.data.data[symbol];
      const coinDetails = {
        symbol: symbol,
        name: coinData.name,
        quote: {
          USD: {
            price: coinData.quote.USD.price,
            percent_change_1h: coinData.quote.USD.percent_change_1h,
            percent_change_24h: coinData.quote.USD.percent_change_24h,
            percent_change_7d: coinData.quote.USD.percent_change_7d
          }
        }
      };
      watchlistCoins.push(coinDetails);
      res.json({ success: true, message: "Coin added to watchlist." });
    } catch (error) {
      console.error('Failed to fetch coin data:', error);
      res.status(500).json({ success: false, message: "Failed to fetch coin data." });
    }
  } else {
    res.json({ success: false, message: "Coin already in watchlist." });
  }
});



// Define a route for the watchlist page
app.get('/watchlist', (req, res) => {
  res.render('watchlist', { watchlistCoins: watchlistCoins });
});

app.delete('/delete-from-watchlist', bodyParser.json(), async (req, res) => {
  const { symbol } = req.body;
  const index = watchlistCoins.findIndex(coin => coin.symbol === symbol);
  if (index !== -1) {
    watchlistCoins.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Coin not found in watchlist.' });
  }
});

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