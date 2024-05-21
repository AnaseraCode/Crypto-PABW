// Import library dan setup lainnya
const express = require('express'); // Import library Express.js untuk membuat server HTTP
const axios = require('axios'); // Import library Axios untuk melakukan HTTP request
const bodyParser = require('body-parser'); // Middleware untuk parsing body dari request
const dotenv = require('dotenv'); // Modul untuk mengelola variabel lingkungan

dotenv.config(); // Menggunakan dotenv untuk mengelola variabel lingkungan

const app = express(); // Membuat instance dari aplikasi Express
const port = 3000; // Port yang akan digunakan untuk server
const apiKey = process.env.COINMARKETCAP_API_KEY; // Mendapatkan API key dari variabel lingkungan

let coinsData = []; // Array untuk menyimpan data koin dari API
let currentPage = 1; // Menyimpan nomor halaman yang sedang ditampilkan
const pageSize = 50; // Jumlah data koin yang ditampilkan per halaman

app.set('view engine', 'ejs'); // Menggunakan EJS sebagai view engine
app.use(express.static('public')); // Menyediakan file statis dari direktori 'public'
app.use(bodyParser.urlencoded({ extended: true })); // Middleware untuk parsing body dari request

// Fungsi untuk mendapatkan data koin dari CoinMarketCap API
async function fetchCoins(start) {
  try {
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey // Menggunakan API key dalam header request
      },
      params: {
        start: start, // Mengatur parameter untuk memulai dari indeks tertentu
        limit: pageSize // Mengatur jumlah data yang akan diambil
      }
    });
    return response.data.data; // Mengembalikan data koin dari response API
  } catch (error) {
    console.error('Error fetching data from CoinMarketCap API:', error); // Menangani error saat fetching data dari API
    throw new Error('Error fetching data from CoinMarketCap API'); // Mengembalikan pesan error
  }
}

// Route untuk halaman utama dengan pagination
app.get('/', async (req, res) => {
    try {
      let start = parseInt(req.query.start) || 1; // Mengambil nomor halaman dari query parameter
      const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest', {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey // Menggunakan API key dalam header request
        },
        params: {
          start: start, // Mengatur parameter untuk memulai dari indeks tertentu
          limit: 50 // Mengatur jumlah data yang akan diambil
        }
      });
      const coins = response.data.data; // Mendapatkan data koin dari response API
      const currentPage = Math.floor(start / 50) + 1; // Menghitung nomor halaman saat ini
      res.render('index', { coins, currentPage }); // Merender halaman index.ejs dengan data koin dan nomor halaman saat ini
    } catch (error) {
      console.error(error); // Menangani error
      res.status(500).send('Error fetching data from CoinMarketCap API'); // Mengirim status error 500
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

// Route untuk halaman selanjutnya
app.get('/nextPage', async (req, res) => {
  try {
    let start = parseInt(req.query.start) || 0; // Mendapatkan nomor halaman dari query parameter
    const nextPageCoins = await fetchCoins(start); // Mendapatkan data koin untuk halaman selanjutnya
    const currentPage = Math.floor(start / 50) + 1; // Menghitung nomor halaman saat ini
    res.render('index', { coins: nextPageCoins, currentPage }); // Merender halaman index.ejs dengan data koin dan nomor halaman saat ini
  } catch (error) {
    console.error('Error navigating to next page:', error); // Menangani error saat navigasi ke halaman selanjutnya
    res.status(500).send('Internal Server Error'); // Mengirim status error 500
  }
});

// Route untuk halaman sebelumnya
app.get('/prevPage', async (req, res) => {
  try {
    let start = parseInt(req.query.start) || 0; // Mendapatkan nomor halaman dari query parameter
    let prevStart = Math.max(start - 50, 0); // Menghitung start index untuk halaman sebelumnya
    const prevPageCoins = await fetchCoins(prevStart); // Mendapatkan data koin untuk halaman sebelumnya
    const currentPage = Math.floor(start / 50); // Menghitung nomor halaman saat ini
    res.render('index', { coins: prevPageCoins, currentPage }); // Merender halaman index.ejs dengan data koin dan nomor halaman saat ini
  } catch (error) {
    console.error('Error navigating to previous page:', error); // Menangani error saat navigasi ke halaman sebelumnya
    res.status(500).send('Internal Server Error'); // Mengirim status error 500
  }
});

// Memulai server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); // Menampilkan pesan ketika server berhasil berjalan
});