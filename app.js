const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2');

const app = express();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Prevent filename conflicts
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Create MySQL connection
const connection = mysql.createConnection({
    //host: 'localhost',
    //user: 'root',
    //password: '',
    //database: 'buns_recipes' // Changed database name
    host: 'db4free.net',
    user: 'meganlhl12421',
    password: '@Lhlm12421',
    database: 'buns_recipes'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

// Enable static files
app.use(express.static('public'));

// Enable form processing
app.use(express.urlencoded({ extended: false }));

// Generic error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Routes
app.get('/', (req, res) => {
    const { type, country } = req.query;
    let sql = 'SELECT * FROM buns';
    let params = [];

    if (type || country) {
        sql += ' WHERE';
        if (type) {
            sql += ' bunsType = ?';
            params.push(type);
        }
        if (type && country) {
            sql += ' AND';
        }
        if (country) {
            sql += ' bunsCountry = ?';
            params.push(country);
        }
    }

    connection.query(sql, params, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving buns');
        }
        res.render('index', { buns: results });
    });
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', (req, res) => {
    const { username, password, email } = req.body;
    const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
    connection.query(sql, [username, password, email], (error, results) => {
        if (error) {
            console.error("Error signing up:", error);
            res.status(500).send('Error signing up');
        } else {
            res.redirect('/login');
        }
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    connection.query(sql, [username, password], (error, results) => {
        if (error) {
            console.error("Error logging in:", error);
            res.status(500).send('Error logging in');
        } else if (results.length > 0) {
            res.redirect('/');
        } else {
            res.send('Invalid username or password');
        }
    });
});

app.get('/buns/:id', (req, res) => {
    const bunsId = req.params.id;
    const sql = 'SELECT * FROM buns WHERE bunsId = ?';
    connection.query(sql, [bunsId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving buns by ID');
        }
        if (results.length > 0) {
            res.render('buns', { buns: results[0] });
        } else {
            res.status(404).send('Buns not found');
        }
    });
});

app.get('/addBuns', (req, res) => {
    res.render('addBuns');
});

app.post('/addBuns', upload.single('image'), (req, res) => {
    const { bunsName, bunsType, bunsCountry, bunsDesc, recipeIngredients, recipeInstructions } = req.body;
    let image = req.file ? req.file.filename : null;

    const sql = 'INSERT INTO buns (bunsName, bunsType, bunsCountry, bunsDesc, image, recipeIngredients, recipeInstructions) VALUES (?, ?, ?, ?, ?, ?, ?)';
    connection.query(sql, [bunsName, bunsType, bunsCountry, bunsDesc, image, recipeIngredients, recipeInstructions], (error, results) => {
        if (error) {
            console.error("Error adding buns:", error);
            res.status(500).send('Error adding buns');
        } else {
            res.redirect('/');
        }
    });
});

app.get('/editBuns/:id', (req, res) => {
    const bunsId = req.params.id;
    const sql = 'SELECT * FROM buns WHERE bunsId = ?';
    connection.query(sql, [bunsId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving buns by ID');
        }
        if (results.length > 0) {
            res.render('editBuns', { buns: results[0] });
        } else {
            res.status(404).send('Buns not found');
        }
    });
});

app.post('/editBuns/:id', upload.single('image'), (req, res) => {
    const bunsId = req.params.id;
    const { bunsName, bunsType, bunsCountry, bunsDesc, recipeIngredients, recipeInstructions } = req.body;
    let image = req.body.currentImage;
    if (req.file) {
        image = req.file.filename;
    }
    const sql = 'UPDATE buns SET bunsName = ?, bunsType = ?, bunsCountry = ?, bunsDesc = ?, image = ?, recipeIngredients = ?, recipeInstructions = ? WHERE bunsId = ?';
    connection.query(sql, [bunsName, bunsType, bunsCountry, bunsDesc, image, recipeIngredients, recipeInstructions, bunsId], (error, results) => {
        if (error) {
            console.error("Error updating buns:", error);
            res.status(500).send('Error updating buns');
        } else {
            res.redirect('/');
        }
    });
});

app.get('/deleteBuns/:id', (req, res) => {
    const bunsId = req.params.id;
    const sql = 'DELETE FROM buns WHERE bunsId = ?';
    connection.query(sql, [bunsId], (error, results) => {
        if (error) {
            console.error("Error deleting buns:", error);
            res.status(500).send('Error deleting buns');
        } else {
            res.redirect('/');
        }
    });
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.post('/submitInquiry', (req, res) => {
    const { name, username, contactNumber, email, inquiry } = req.body;
    const sql = 'INSERT INTO inquiries (name, username, contactNumber, email, inquiry) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [name, username, contactNumber, email, inquiry], (error, results) => {
        if (error) {
            console.error("Error submitting inquiry:", error);
            res.status(500).send('Error submitting inquiry');
        } else {
            res.redirect('/inquirySuccess');
        }
    });
});

app.get('/inquirySuccess', (req, res) => {
    res.render('inquirySuccess');
});

app.get('/admin', (req, res) => {
    const sql = 'SELECT * FROM inquiries';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving inquiries');
        }
        res.render('admin', { inquiries: results });
    });
});

// Start the server
const PORT = process.env.PORT || 3306;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
