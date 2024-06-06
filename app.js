const express = require('express'); // Mengimpor framework Express
const axios = require('axios'); // Mengimpor library Axios untuk melakukan HTTP requests
const bodyParser = require('body-parser'); // Mengimpor Body-Parser untuk mengurai request body
const dotenv = require('dotenv'); // Mengimpor dotenv untuk mengelola variabel lingkungan

dotenv.config(); // Menginisialisasi dotenv untuk mengakses variabel lingkungan dari file .env

const app = express(); // Membuat instance Express
const port = 3000; // Menentukan port server
const apiKey = process.env.COINMARKETCAP_API_KEY; // Mengambil API key dari lingkungan

const pageSize = 50; // Menentukan ukuran halaman untuk pagination

app.set('view engine', 'ejs'); // Menentukan EJS sebagai view engine
app.use(express.static('public')); // Mengatur folder 'public' sebagai folder statis
app.use(bodyParser.urlencoded({ extended: true })); // Mengurai URL-encoded bodies
app.use(bodyParser.json()); // Mengurai JSON bodies

let watchlistCoins = []; // Array untuk menyimpan watchlist

// Fungsi untuk mengambil data koin dari API CoinMarketCap
async function fetchCoins(start) {
  try {
    start = Math.max(start, 1); // Memastikan nilai start minimal 1
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

// Route untuk menambah koin ke watchlist
app.post('/add-to-watchlist', bodyParser.json(), async (req, res) => {
  console.log("Received request to add to watchlist:", req.body); // Log request body
  const { symbol } = req.body; // Mendapatkan simbol dari request body
  if (!watchlistCoins.some(coin => coin.symbol === symbol)) { // Cek jika koin sudah ada di watchlist
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
      watchlistCoins.push(coinDetails); // Menambahkan koin ke watchlist
      res.json({ success: true, message: "Coin added to watchlist." });
    } catch (error) {
      console.error('Failed to fetch coin data:', error);
      res.status(500).json({ success: false, message: "Failed to fetch coin data." });
    }
  } else {
    res.json({ success: false, message: "Coin already in watchlist." });
  }
});

// Route untuk halaman watchlist
app.get('/watchlist', (req, res) => {
  res.render('watchlist', { watchlistCoins: watchlistCoins });
});

// Route untuk menghapus koin dari watchlist
app.delete('/delete-from-watchlist', async (req, res) => {
  const { symbol } = req.body; // Mendapatkan simbol dari request body
  const index = watchlistCoins.findIndex(coin => coin.symbol === symbol);
  if (index !== -1) {
    watchlistCoins.splice(index, 1); // Menghapus koin dari watchlist
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Coin not found in watchlist.' });
  }
});

// Route untuk halaman utama dengan pagination
app.get('/', async (req, res) => {
  try {
    let start = parseInt(req.query.start) || 1; // Memastikan parameter start minimal 1
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
    start = Math.max(start - pageSize, 1); // Memastikan nilai start minimal 1
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
  // Contoh data portfolio
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
