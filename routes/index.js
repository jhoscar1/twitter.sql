'use strict';
var express = require('express');
var router = express.Router();
var db = require('../db');
module.exports = router;

// a reusable function
function respondWithAllTweets (req, res, next){
  var allTheTweets;
  db.query('SELECT * from tweets inner join users on users.id=tweets.user_id', function (err, result) {
    if (err) next(err);
    allTheTweets = result.rows;
    
    res.render('index', {
      title: 'Twitter.js',
      tweets: allTheTweets,
      showForm: true
    });
  });

}

// here we basically treet the root view and tweets view as identical
router.get('/', respondWithAllTweets);
router.get('/tweets', respondWithAllTweets);

// single-user page
router.get('/users/:username', function(req, res, next){
  var username = req.params.username;
  var query = 'SELECT * from tweets INNER JOIN users ON tweets.user_id = users.id WHERE users.name = $1';

  db.query(query, [username], function(err, results) {
    if (err) next(err);
    console.log(results);

    var tweetsForName = results.rows;
    res.render('index', {
      title: 'Twitter.js',
      tweets: tweetsForName,
      showForm: true,
      username: req.params.username
    });
  });

});

// single-tweet page
router.get('/tweets/:id', function(req, res, next){
  var query = 'SELECT * from tweets where id=$1';
  var id = +req.params.id;

  db.query(query, [id], function(err, results){
    if (err) next(err);

    var tweetsWithThatId = results.rows;
    res.render('index', {
      title: 'Twitter.js',
      tweets: tweetsWithThatId // an array of only one element ;-)
    });
  });

});

// create a new tweet
router.post('/tweets', function(req, res, next){
  // Tweet properties
  var content = req.body.content;
  var name = req.body.name;

  // Our query strings
  var userIDQueryString = 'Select * from users where users.name = $1';
  var newUserQueryString = 'Insert into users (name) values ($1) Returning *';
  var newTweetWithID = 'Insert into tweets (content, user_id) values ($1, $2) Returning *';

  // Check if user exists
  db.query(userIDQueryString, [name], function(err, results) {
    if (err) next(err);

    if (!results.rows.length) {
      // If user doesn't exist insert new user
      db.query(newUserQueryString, [name], function(userInsertErr, userInsertResults) {
        if (userInsertErr) next(userInsertErr);
        var newUserID = userInsertResults.rows[0].id;
        console.log(newUserID)

        // Use our new user id to add tweet and user_id
        db.query(newTweetWithID, [content, newUserID], function(newTweetWithNewIDErr, newTweetWithNewIDResults) {
          if (newTweetWithNewIDErr) next(newTweetWithNewIDErr);
          console.log('Nailed It. We the best. Who? We');
          res.redirect('/');
        })
      });
    }
    else {
      // else add tweet and associate with existing user_id
      var existingUserID = results.rows[0].id;

      db.query(newTweetWithID, [content, existingUserID], function(newTweetWithIDErr, newTweetWithIDResults) {
        if (newTweetWithIDErr) next(newTweetWithIDErr);
          console.log('Still the best');
          res.redirect('/');
      });
    }
  }); 
});

// Search Route
router.post('/search', function(req, res, next) {
  // console.log(req.body);
  
  var searchKey = req.body.search;

  // res.redirect(`/search?search=${searchKey}`);
  var userSearch = "SELECT * from tweets INNER JOIN users ON tweets.user_id = users.id WHERE users.name LIKE '%' || $1 || '%'";

  var contentSearch = "Select * from tweets inner join users on users.id=tweets.user_id where tweets.content LIKE '%' || $1 || '%'";

  var allTweets = [];

  db.query(userSearch, [searchKey], function(err, results) {
    if (err) console.log(err);
    if (results.rows.length) {
      results.rows.forEach(function(tweet) {
        allTweets.push(tweet);
      });
    }
    db.query(contentSearch, [searchKey], function(contentErr, contentResults) {
      if (contentErr) next(err);
      if (contentResults.rows.length) {
        contentResults.rows.forEach(function(tweet) {
          allTweets.push(tweet);
        });
      }
      res.render('index', {
        title: 'Twitter.js',
        tweets: allTweets,
        showForm: true,
      });
    });
  });
});

// router.get('/search', function(req, res){
  
//   var searchKey = req.query.search;


//   var userSearch = `SELECT * from tweets INNER JOIN users ON tweets.user_id = users.id WHERE users.name LIKE '%${searchKey}%'`;

//   var contentSearch = `Select * from tweets where tweets.content LIKE '%${searchKey}%'`;

//   var allTweets = [];

//   db.query(userSearch, function(err, results) {
//     if (err) console.log(err);
//     if (results.rows.length) {
//       results.rows.forEach(function(tweet) {
//         allTweets.push(tweet);
//       });
//     }
//     db.query(contentSearch, function(err, results) {
//       if (err) next(err);
//       if (results.rows.length) {
//         results.rows.forEach(function(tweet) {
//           allTweets.push(tweet);
//         });
//       }
//     });
//   });

//   res.render('index', {
//     title: 'Twitter.js',
//     tweets: allTweets,
//     showForm: true,
//   });
// })



// // replaced this hard-coded route with general static routing in app.js
// router.get('/stylesheets/style.css', function(req, res, next){
//   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
// });
