'use strict'

/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var session = require('express-session');
var mysql = require('mysql2')

// MySQL server connection

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

app.use(express.urlencoded({ extended: false }))
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 }
}))



// Session-persisted message middleware
app.get('/', function(req, res, next) {
  if (req.session.views) {
    req.session.views++
    res.setHeader('Content-Type', 'text/html')
    res.write('<p>views: ' + req.session.views + '</p>')
    res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
    res.end()
  } 
})
// deny access to logged out users
function restrict(req, res, next) {
  if (req.session.id) {
    next();
  } else {
    console.log('Access denied!');
    res.redirect('/login');
  }
}

app.get('/', function (req, res) {
  res.redirect('/login');
});

// logged in users can see this
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

app.get('/register', function (req, res) {
  res.render('register');
});
//register user

app.post('/auth/register', function (req, res) {

});

// login and authenticate user
app.post('/auth/login', function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  // Unsafe login query
  if (username && password) {
    connection.query(`SELECT * FROM users WHERE username='${username}' AND password ='${password}'`, function (error, results, fileds) {
      if (error) throw error;
      if (results.length > 0) {
        // set session
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/restricted');
      }
      else {
        res.send('Incorrect Username and/or Password');
      }
      res.end();
    }
    );
  } else {
    res.send('Please enter Username and Password');
    res.end();
  }

});


if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}