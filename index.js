'use strict'

/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var session = require('express-session');
var mysql = require('mysql2/promise')

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
  cookie: { maxAge: 60 }
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

app.get('/index', function (req, res) {
  res.render('index');
})
//register and log in user

app.post('/auth/register', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const poolConn = await connection.getConnection();
  if (username && password) {
    await poolConn.query(`SELECT * FROM users WHERE username ='${username}'`).then(([rows])=>{
      if (rows != 0) {
        res.send('Username already exists, click to <a href="/register">try again</a>');
      }
      else
       poolConn.query(`INSERT INTO users VALUES (DEFAULT, '${username}', '${password}')`).then(res.redirect('../restricted')).catch(error=>{
          throw error;
        })
  }).catch(error =>{
    throw error;
  });}
  else{
    res.send('Please enter Username and Password then <a href="/register">try again</a>');
    res.end();
  }
});

// login and authenticate user
app.post('/auth/login', function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  // Unsafe login query
  if (username && password) {
    connection.query(`SELECT * FROM users WHERE username='${username}' AND userpass ='${password}'`, function (error, results, fileds) {
      if (error) throw error;
      if (results.length > 0) {
        // set session
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/restricted');
      }
      else {
        res.send('Incorrect Username and/or Password, click to <a href="/login">return</a>');
      }
      res.end();
    }
    );
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
  app.listen(3000);
  console.log('Express started on port 3000');
}