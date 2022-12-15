const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const uuid = require('uuid/v4')
const security = require('./helpers/security')
const auth = require('./helpers/auth')
const cacheRoute = require('./helpers/cache-route')
const socket = require('./helpers/socket')
const app = express()

const TIE = require('@artificialsolutions/tie-api-client');
var request = require('request') 
require('dotenv').config();
OAuth= require('oauth').OAuth

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(passport.initialize());


require('dotenv').config();
// twitter authentication
var twitter_oauth = {
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  token: process.env.TWITTER_ACCESS_TOKEN,
  token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
}
var appconfig = {
  teneoURL: process.env.TENEO_ENGINE_URL,
  port: process.env.PORT
}

const teneoApi = TIE.init(appconfig.teneoURL);

// Initialize session handler to store mapping between a Twitter UserID and an Engine session ID.
const sessionHandler = SessionHandler();

app.set('port', (appconfig.port || 5000))

// start server
const server = app.listen(app.get('port'), function() {
  console.log('Node app is running on port: ', app.get('port'))
  initTwitterOauth()
})


function getDirectMessageRequestOptions(recipientID, messageText){

  var dmParameters = {
    "event": {
      "type": "message_create",
      "message_create": {
        "target": {
          "recipient_id": recipientID
        },
        "message_data": {
          "text": messageText
        }
      }
    }
  }
 
  var requestOptions = {
    url: 'https://api.twitter.com/1.1/direct_messages/events/new.json',
    oauth: twitter_oauth,
    json: true,
    headers: {
      'content-type': 'application/json'
    },
    body: dmParameters
  }

  return requestOptions
}

function sendDM(recipientID, messageText){
  // POST request to send Direct Message
  request.post(getDirectMessageRequestOptions(recipientID, messageText), function (error, response, body) {
    if(error){
      console.log(error)
    }
  })
}


OAuth= require('oauth').OAuth
var oa

// We init OAuth with our consumer key & secret just like with passport
function initTwitterOauth() {

  //Generate random 'nonce' string for this request
  var nonce = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(var i = 0; i < 32; i++) {
    nonce += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  oa = new OAuth(
    "https://twitter.com/oauth/request_token"
  , "https://twitter.com/oauth/access_token"
  , twitter_oauth.consumer_key
  , twitter_oauth.consumer_secret
  , "1.0A"
  , nonce
  , "HMAC-SHA1"
  );
}

// Use OAuth authentication with token and secret to tweet
// https://dev.twitter.com/docs/api/1/post/statuses/update
function makeTweet(replyToTweetID, newTweetText, cb) {
  oa.post(
    "https://api.twitter.com/1.1/statuses/update.json"
  , twitter_oauth.token
  , twitter_oauth.token_secret
  , { "status": newTweetText, "in_reply_to_status_id": replyToTweetID }
  , cb
  );
}



// initialize socket.io
socket.init(server)

// form parser middleware
var parseForm = bodyParser.urlencoded({ extended: false })


/**
 * Activity view
 **/
app.get('/activity', auth.basic, require('./routes/activity'))


/**
 * Handles Twitter sign-in OAuth1.0a callbacks
 **/
app.get('/callbacks/:action', passport.authenticate('twitter', { failureRedirect: '/' }),
  require('./routes/sub-callbacks'))

/***
 * SESSION HANDLER
 ***/
function SessionHandler() {

  // Map a Twitter UserID to the Teneo Engine Session ID.
  // This code keeps the map in memory, which is ok for demo purposes
  // For production usage it is advised to make use of more resilient storage mechanisms like redis
  const sessionMap = new Map();

  return {
    getSession: (userId) => {
      if (sessionMap.size > 0) {
        return sessionMap.get(userId);
      }
      else {
        return "";
      }
    },
    setSession: (userId, sessionId) => {
      sessionMap.set(userId, sessionId)
    }
  }
}