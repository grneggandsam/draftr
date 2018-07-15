var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var server = app.listen(3000, function() {
    console.log("server started on port 3000");
});

//Database Stuff
var mongo = require('mongodb');
var monk = require('monk');
const db = monk('localhost:27017/codopolis');
db.on('error', function (err) { console.error(err); });
db.on('open', function () { console.log('open'); });
db.then(() => {
  console.log('Connected correctly to server')
})

// include a few things
var session = require('express-session');
var cookieParser = require('cookie-parser');
var RedisStore = require("connect-redis")(session);
var map = require('./server/map.js');
var users = require('./server/routes/users');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var sessionMiddleware = session({
    secret: 'samwise',
    resave: false,
    saveUninitialized: true
    // store: new RedisStore()
});

app.use(sessionMiddleware);

// Make our db accessible to our router
app.use(function (req, res, next) {
    req.db = db;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// For login API
app.use('/users', users);

// Global Variables
var unitWidth = 60;
var unitHeight = 100;
var numConnected = 0;
var alreadySending = false;
const speed = 30;
const saveInterval = 900;
const damage = 30;
var sAddresses = {};
let charsLoaded = false;

app.use(cookieParser());

// set up static file serving from the public directory
app.use('/static', express.static(__dirname + '/client'));

map.readDBMap(db);

// Setup Routing for main page
app.get('/', function(req, res){
  // if(!req.session.user) {
  //   // Show Login
  //   res.sendFile(__dirname + '/client/login.html');
  // }
  // else {
    res.cookie('userId', req.session.user);
    res.cookie('MAP', map.map);

    res.sendFile(__dirname + '/client/index.html');
  // }
});

module.exports = app;
