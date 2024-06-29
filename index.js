'use strict'

/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var session = require('express-session');
var mysql = require('mysql2/promise')
const util = require('util')
const PORT = 3000;

// Error handling
process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

// MySQL server connection

const connection = mysql.createPool({
  host: 'localhost',
  user: 'Admin',
  password: 'UkR3ROzecWiHVuTUCjVL',
  database: 'userdb',
  waitForConnections: true,
  multipleStatements: true,
  keepAliveInitialDelay: 10000,
  enableKeepAlive: true
})



var app = module.exports = express();

// config

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }))
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 600000000 }
}))




// Session-persisted message middleware
app.use(function (req, res, next) {
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

// deny access to logged out users
function restrict(req, res, next) {
  if (req.session) {
    next();
  } else {
    console.log('Access denied!');
    res.redirect('/login');
  }
}

app.get('/', (req, res) => {
  res.render('login', { PORT });
});

// logged in users can see this
app.get('/restricted', restrict, function (req, res) {
  const USERNAME = req.session.username;
  res.render('restricted', { USERNAME });
});

app.get('/logout', function (req, res) {
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function () {
    res.redirect('/login');
  });
});

app.get('/login', function (req, res) {
  res.render('login', { PORT });
});

app.get('/register', function (req, res) {
  res.render('register');
});

app.get('/index', function (req, res) {
  res.render('index');
})
//register and log in user

app.post('/auth/register', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const poolConn = await connection.getConnection();
  // Vulnerable registration
  if (username && password) {
    const [rows] = await poolConn.query(`SELECT * FROM users WHERE username ='${username}'`)
        if (rows.length > 0) {
          res.send('Username already exists, click to <a href="/register">try again</a>');
        }
        else{
          poolConn.query(`INSERT INTO users VALUES (DEFAULT, '${username}', '${password}')`)
          req.session.loggedin = true;
          req.session.username = username;
          res.redirect('../restricted');

        }
  }
  else {
    res.send('Please enter Username and Password then <a href="/register">try again</a>');
    res.end();
  }
});

// login and authenticate user
app.post('/auth/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const poolConn = await connection.getConnection();
  // Vulnerable login query
  if (username && password) {
    const [rows] = await poolConn.query(`SELECT * FROM users WHERE username='${username}' AND userpass ='${password}'`)
    
        if (rows.length > 0) {
          req.session.loggedin = true;
          req.session.username = username;
          res.redirect('../restricted');

        }
        else {
          res.send('Incorrect Username and/or Password, click to <a href="/login">return</a>');
        }
        res.end();
      } else {
    res.send('Please enter Username and Password then <a href="/login">try again</a>');
    res.end();
  }

});

//reset DB
app.post('/auth/ResetDB', function (req, res) {
  connection.query(`TRUNCATE TABLE users; INSERT INTO users VALUES (DEFAULT, 'a', 'a'), (DEFAULT, 'b', 'b');`)
  res.redirect('/login')

})


if (!module.parent) {
  app.listen(PORT);
  console.log(`Express started on port ${PORT}`);
}