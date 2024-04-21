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


app.get('/userInfo', function (req, res) {
    res.json({ "userID": req.session.userID, "username": req.session.username });
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
                    res.send('/lecturer/productPage');
                }
                else if (results[0].role == 3) {
                    // staff
                    res.send('/staff/productPage');
                }
            }
            else {
                res.status(401).send("Wrong password");
            }
        });
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

// ------------ user landing page ----------
app.get('/user/bookPage', function (_req, res) {
    res.sendFile(path.join(__dirname, 'views/user_book.html'));
});

// ------------ root service ----------
app.get('/', function (_req, res) {
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

const PORT = 3000;
app.listen(PORT, function () {
    console.log('Server is runnint at port ' + PORT);
});