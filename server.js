require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const fs = require('fs');
const multer = require('multer');
const AWS = require('aws-sdk');
const app = express();
const upload = multer({ dest: 'uploads/' });
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(cors());
app.use(express.json());

// Cấu hình AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// MySQL connection setup
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'midterm_nodejs',
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Render giao diện upload file
app.get('/upload', (req, res) => {
  res.render('upload');
});

// API endpoint để tải lên tệp lên S3
app.post('/upload', upload.single('file'), (req, res) => {
  const fileContent = fs.readFileSync(req.file.path);
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: req.file.originalname,
    Body: fileContent
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Error uploading file:', err);
      return res.status(500).send('Error uploading file');
    }
    res.send(`File uploaded successfully. ${data.Location}`);
  });
});

// API endpoint để lấy danh sách người dùng
app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Route để hiển thị danh sách người dùng
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      return res.status(500).send('Error retrieving users');
    }
    res.render('users', { users: results });
  });
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});