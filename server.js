// importing the required packages and modules
require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')
const {processURLQueue} = require('./jobs/background')
const path = require('path')
const session = require('express-session')

const app = express();
port = 3000;


// making sure the app can take all kinds of data and has a cookie parser
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser())

// serving static files
app.use(express.static(path.join(__dirname,'public')))
app.use('/public/screenshots',express.static(path.join(__dirname,'public','screenshots')))
app.use(session({
  name: 'sid', // custom session cookie name
  secret: process.env.SESSION_SECRET || 'replace-with-a-secure-secret',
  resave: false,
  saveUninitialized: false, // only create session when needed
  cookie: {
    httpOnly: true,       // not accessible by JS
    secure: true,         // send cookie only over HTTPS (set false for local dev without HTTPS)
    sameSite: 'strict',   // strict CSRF protection
    maxAge: 5 * 60 * 1000 // 5 minutes expiry
  }
}));




// Auth routes
app.use('/auth', require('./routes/auth'));
// User routes
app.use('/user', require('./routes/users'));
// Recorder routes
app.use('/recorder',require('./routes/recorder'))




app.get('/auth/signup', (req, res) => res.sendFile(path.join(__dirname, 'views/signup.html')));
app.get('/auth/login', (req, res) => res.sendFile(path.join(__dirname, 'views/login.html')));
app.get('/home',(req,res) => res.sendFile(path.join(__dirname,'views/home.html')));
app.get('/user/history', (req, res) => res.sendFile(path.join(__dirname, 'views/history.html')));
app.get('/auth/forgot-pass',(req,res)=>{ res.sendFile(path.join(__dirname,'views/fpass.html'))})


// // running the app
app.listen(port, ()=>{
    console.log(`Server running at http://localhost:${port}`);

    processURLQueue()
});

