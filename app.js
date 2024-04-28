const express = require('express');
const path = require('path');
const bcrypt = require("bcrypt");
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const con = require('./config/db');

const app = express();

// Check database connection
con.connect(function(err) {
    if (err) {
        console.error('Error connecting to database');
        return;
    }
    console.log('Connected to database');
});

// set the public folder
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// for session
app.use(session({
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, //1 day in millisec
    secret: 'mysecretcode',
    resave: false,
    saveUninitialized: true,
    // config MemoryStore here
    store: new MemoryStore({
        checkPeriod: 24 * 60 * 60 * 1000 // prune expired entries every 24h
    })
}));

// ------------- Create hashed password --------------
app.get("/password/:pass", function (req, res) {
    const password = req.params.pass;
    const saltRounds = 10;    //the cost of encrypting see https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds
    bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) {
            return res.status(500).send("Hashing error");
        }
        res.send(hash);
    });
});

// ---------- login -----------
app.post('/login', function (req, res) {
    const { username, password } = req.body;
    const sql = "SELECT user_id, password, role FROM user WHERE username = ?";
    con.query(sql, [username], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        if (results.length != 1) {
            return res.status(401).send("Wrong username");
        }
        // check password
        bcrypt.compare(password, results[0].password, function (err, same) {
            if (err) {
                res.status(500).send("Server error");
            }
            else if (same) {
                // remember user
                req.session.userID = results[0].user_id;
                req.session.username = username;
                req.session.role = results[0].role;
                // role check
                if (results[0].role == 1) {
                    // user
                    res.send('/user/bookPage');
                }
                else if (results[0].role == 2) {
                    // lecturer
                    res.send('/lender/bookPage');
                }
                else if (results[0].role == 3) {
                    // staff
                    res.send('/staff/bookPage');
                }
            }
            else {
                res.status(401).send("Wrong password");
            }
        });
    });
});


app.get('/userInfo', function (req, res) {
    res.json({ "userID": req.session.userID, "username": req.session.username });
});

// ******route for user********//
// ------------ user landing page ----------
app.get('/user/bookPage', function (_req, res) {
    res.sendFile(path.join(__dirname, 'views/user/user_book.html'));
});

// ------------ user book page ----------
app.get('/user/book', function (req, res) {
    const sql = "SELECT * FROM books WHERE Status='available'";
    con.query(sql, function (err, results) {
        if (err) {
            // console.log(sql);
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

// ------------ user history page ----------
app.get('/user/historyPage', function (_req, res) {
    res.sendFile(path.join(__dirname, 'views/user/HistoryUser.html'));
});

// user history route
app.get('/user/history', function (req, res) {
    const userId = req.session.userID;
    // Query database to get pending booking requests for the specific login user ID
    const sql = `
     SELECT bookings.*, books.Title
     FROM bookings 
     JOIN books ON bookings.book_id = books.book_id 
     WHERE bookings.status != 'pending' 
    AND bookings.user_id = ?`;

    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

app.post('/user/book/:bookID', function(req, res) {
    const bookID = req.params.bookID;
    const bookingDate = req.body.bookingDate;
    const returnDate = req.body.bookingDate;
    const status = req.body.status;

    // Assuming you are using MySQL
    const sql = "INSERT INTO bookings (user_id, book_id, booking_date, return_date, status) VALUES (?, ?, ?, ?, ?)";
    con.query(sql, [req.session.userID, bookID, bookingDate, returnDate, status], function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).send('Error while booking');
            return;
        }
        console.log("Booking record inserted");
        res.send('Booking successful!');
    });
});

// ******route for lender********//
// ------------ len landing page ----------
app.get('/lender/bookPage', function (_req, res) {
    res.sendFile(path.join(__dirname, 'views/lender/lender_book.html'));
});

// ------------ user book page ----------
app.get('/user/book', function (req, res) {
    const sql = "SELECT * FROM books";
    con.query(sql, function (err, results) {
        if (err) {
            // console.log(sql);
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

// ------------ user history page ----------
app.get('/lender/historyPage', function (_req, res) {
    res.sendFile(path.join(__dirname, 'views/lender/HistoryLender.html'));
});

// user history route
app.get('/lender/history', function (req, res) {
    const userId = req.session.userID;
    // Query database to get pending booking requests for the specific login user ID
    const sql = `
     SELECT bookings.*, books.Title
     FROM bookings 
     JOIN books ON bookings.book_id = books.book_id 
     WHERE bookings.status != 'pending' 
    AND bookings.action_by = ?`;

    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

app.post('/user/book/:bookID', function(req, res) {
    const bookID = req.params.bookID;
    const bookingDate = req.body.bookingDate;
    const returnDate = req.body.bookingDate;
    const status = req.body.status;

    // Assuming you are using MySQL
    const sql = "INSERT INTO bookings (user_id, book_id, booking_date, return_date, status) VALUES (?, ?, ?, ?, ?)";
    con.query(sql, [req.session.userID, bookID, bookingDate, returnDate, status], function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).send('Error while booking');
            return;
        }
        console.log("Booking record inserted");
        res.send('Booking successful!');
    });
});

// ******route for lender********//
// ------------ lender landing page ----------
app.get('/staff/bookPage', function (_req, res) {
    res.sendFile(path.join(__dirname, 'views/staff/staff_book.html'));
});

// ------------ user book page ----------
app.get('/user/book', function (req, res) {
    const sql = "SELECT * FROM books";
    con.query(sql, function (err, results) {
        if (err) {
            // console.log(sql);
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

// ------------ user history page ----------
app.get('/staff/historyPage', function (_req, res) {
    res.sendFile(path.join(__dirname, 'views/staff/HistoryStaff.html'));
});

// user history route
app.get('/staff/history', function (req, res) {

    const sql = `
    SELECT 
        bookings.*, 
        books.Title, 
        booking_users.username AS student_name, 
        action_users.username AS lender_name
    FROM 
        bookings 
        JOIN rooms ON bookings.book_id = books.book_id 
        JOIN users AS booking_user ON bookings.user_id = booking_user.user_id
        LEFT JOIN users AS action_users ON bookings.action_by = action_users.user_id
    WHERE 
        bookings.status != 'pending';
    `;

    con.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database server error");
        }
        res.json(results);
    });
});

app.post('/user/book/:bookID', function(req, res) {
    const bookID = req.params.bookID;
    const bookingDate = req.body.bookingDate;
    const returnDate = req.body.bookingDate;
    const status = req.body.status;

    // Assuming you are using MySQL
    const sql = "INSERT INTO bookings (user_id, book_id, booking_date, return_date, status) VALUES (?, ?, ?, ?, ?)";
    con.query(sql, [req.session.userID, bookID, bookingDate, returnDate, status], function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).send('Error while booking');
            return;
        }
        console.log("Booking record inserted");
        res.send('Booking successful!');
    });
});

// ------------- Logout --------------
app.get("/logout", function (req, res) {
    //clear session variable
    req.session.destroy(function (err) {
        if (err) {
            console.error(err);
            res.status(500).send("Cannot clear session");
        }
        else {
            res.redirect("/");
        }
    });
});


// ------------ root service ----------
app.get('/', function (_req, res) {
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

const PORT = 3000;
app.listen(PORT, function () {
    console.log('Server is runnint at port ' + PORT);
});