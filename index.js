'use strict'

/**
 * Module dependencies.
 */

var express = require('express');
var hash = require('pbkdf2-password')()
var path = require('path');
var session = require('express-session');
var mysql = require('mysql2')

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'Admin',
  password: 'UkR3ROzecWiHVuTUCjVL',
  database: 'userdb'
})




var app = module.exports = express();

// config

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middleware

app.use(express.urlencoded({ extended: false }))
app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'shhhh, very secret'
}));

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


function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}


app.get('/', function (req, res) {
  res.redirect('/login');
});

app.get('/restricted', restrict, function (req, res) {
  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});

app.get('/logout', function (req, res) {
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function () {
    res.redirect('/');
  });
});

app.get('/login', function (req, res) {
  res.render('login');
});

// login and authenticate user

connection.query('SELECT 1 + 1 AS solution', (err, rows, fields) => {
  if (err) throw err

  console.log('The solution is: ', rows[0].solution)
})
app.get('/auth', (req, res) => {
  connection.connect();
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    const query = `SELECT * FROM users WHERE username="${username}" AND password="${password}";`;

    connection.query(query, values, (error, results, fields) => {
      if (error) {
        throw error;
      }
      if (results.length > 0) {
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('back');
      }
      else {
        res.send('Incorrect Username and/or Password');
      }
      res.end();
    })
  } else {
    res.send('Please enter Username and Password');
    res.end();
  }
})
if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}