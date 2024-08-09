const express=require("express")
const app=express()
const path=require("path")
const hbs=require("hbs")
const session = require('express-session');
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost', // ganti dengan host MySQL Anda
    user: 'root', // ganti dengan nama pengguna MySQL Anda
    password: '', // ganti dengan kata sandi MySQL Anda
    database: 'tes' // ganti dengan nama database Anda
  });

  connection.connect((err) => {
    if (err) {
      console.error('Koneksi ke database gagal: ' + err.stack);
      return;
    }
    console.log('Terhubung ke database dengan ID koneksi ' + connection.threadId);
  });

app.use(express.static(path.join(__dirname, '../public')));

const templatesPath=path.join(__dirname, '../templates')

app.use(session({
    secret: 'rahasia', // Ganti dengan secret key yang lebih kompleks dan aman
    resave: false,
    saveUninitialized: true
  }));
  
app.use(express.json())
app.set("view engine", "hbs")
app.set("views", templatesPath)
app.use(express.urlencoded({extended:false}))

function generateIdFaktur() {
    const randomNum = Math.floor(Math.random() * 10000000000); // Mengambil angka acak antara 0 dan 999
  
    // Menggabungkan timestamp dan angka acak untuk membentuk id_faktur
    const id_faktur = `${randomNum}`
  
    return id_faktur;
  }
  

app.get("/",(req, res)=>{
    res.render("login")
})

app.get('/ecommerce', (req, res) => {
    // Ambil data pengguna dari session
    const user = req.session.user;
  
    // Cek apakah pengguna telah login atau tidak
    const jumlahKoin = user ? user.koin : 0;
  
    // Render halaman ecommerce dan kirimkan data jumlah koin ke template
    res.render('ecommerce', { jumlahKoin });
  });
  

app.get("/login",(req, res)=>{
    res.render("login")
})

app.get("/register",(req, res)=>{
    res.render("register")
})
app.get("/beranda",(req, res)=>{
    res.render("beranda")
})

app.get("/pesan",(req, res)=>{
    res.render("pesan")
})

app.get("/antarjemput",(req, res)=>{
    res.render("antarjemput")
})
app.post('/register', async (req, res) => {
    const { nama, alamat, tlp, username, password } = req.body;
  
    if (!nama || !alamat || !tlp || !username || !password) {
      res.send('Semua field harus diisi');
      return;
    }
  
    // Periksa apakah username telah terdaftar sebelumnya
    connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
      if (error) throw error;
  
      if (results.length > 0) {
        res.send('Username sudah terdaftar');
      } else {
        // Simpan informasi pengguna baru ke database
        const newUser = {
          nama: nama,
          alamat: alamat,
          NoTelpon: tlp,
          username: username,
          password: password // Simpan password tanpa mengenkripsi
        };
  
        connection.query('INSERT INTO users SET ?', newUser, (error) => {
          if (error) throw error;
          res.render("login");
        });
      }
    });
  });
  
  app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      res.send('Username dan password harus diisi');
      return;
    }
  
    // Periksa apakah username dan password cocok di database
    connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (error, results) => {
      if (error) throw error;
  
      if (results.length === 0) {
        res.send('<script>alert("Password salah"); window.location.href="/login";</script>');
      } else {
        // Password cocok, lakukan tindakan setelah login berhasil
        req.session.user = results[0];
        res.render("beranda");
      }
    });
  });

  app.post('/pesan', (req, res) => {
    const { nama, alamat, tgl_transaksi, qty, harga } = req.body;
    const id_faktur = generateIdFaktur(); 
    const user = req.session.user;
  
    // Menghitung total_bayar
    const total_bayar = qty * harga;
  
    // Memeriksa apakah total_bayar melebihi koin pengguna
    if (total_bayar > user.koin) {
      // Jika total_bayar melebihi koin, tampilkan pesan alert pada sisi klien
      res.send('<script>alert("Maaf koin tidak cukup"); window.location.href="/ecommerce";</script>');
    } else {
      // Memasukkan data ke tabel faktur
      const fakturData = {
        id_faktur: id_faktur,
        username: user.Username,
        nama_penerima: nama,
        alamat_penerima: alamat,
        tgl_transaksi: tgl_transaksi,
        qty: qty,
        harga: harga,
        total_bayar: total_bayar,
      };
  
      connection.query('INSERT INTO faktur SET ?', fakturData, (error) => {
        if (error) throw error;
  
        // Mengurangi koin pengguna di tabel users
        const updatedKoin = user.koin - total_bayar;
        const updateUserQuery = `UPDATE users SET koin = ${updatedKoin} WHERE username = '${user.Username}'`;
        connection.query(updateUserQuery, (error) => {
          if (error) throw error;
          console.log('Koin pengguna telah diperbarui');
  
          res.render("ecommerce");
        });
      });
    }
  });
  
  
  

app.listen(3000,()=>{
    console.log("port connected");
})