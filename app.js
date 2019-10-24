const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')
const TwitterStrategy = require('passport-twitter')
const uuid = require('uuid/v4')
const security = require('./helpers/security')
const auth = require('./helpers/auth')
const cacheRoute = require('./helpers/cache-route')
const socket = require('./helpers/socket')
const app = express()

const TIE = require('@artificialsolutions/tie-api-client');
var request = require('request') 

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(passport.initialize());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

// load config file
var nconf = require('nconf')
nconf.file({ file: 'config.json' }).env()

// twitter authentication
var twitter_oauth = {
  consumer_key: nconf.get('TWITTER_CONSUMER_KEY'),
  consumer_secret: nconf.get('TWITTER_CONSUMER_SECRET'),
  token: nconf.get('TWITTER_ACCESS_TOKEN'),
  token_secret: nconf.get('TWITTER_ACCESS_TOKEN_SECRET')
}
var appconfig = {
  teneoURL: nconf.get('TENEO_ENGINE_URL'),
  port: nconf.get('PORT')
}

const teneoApi = TIE.init(appconfig.teneoURL);
// Initialize session handler to store mapping between a Twitter UserID and an Engine session ID.
const sessionHandler = SessionHandler();

app.set('port', (appconfig.port || 5000))

// start server
const server = app.listen(app.get('port'), function() {
  console.log('Node app is running on port: ', app.get('port'))
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


// initialize socket.io
socket.init(server)

// form parser middleware
var parseForm = bodyParser.urlencoded({ extended: false })


/**
 * Receives challenge response check (CRC)
 **/
app.get('/webhook/twitter', function(request, response) {

  console.log("CRC")
  var crc_token = request.query.crc_token

  if (crc_token) {
    var hash = security.get_challenge_response(crc_token, auth.twitter_oauth.consumer_secret)

    response.status(200);
    response.send({
      response_token: 'sha256=' + hash
    })
  } else {
    response.status(400);
    response.send('Error: crc_token missing from request.')
  }
})


/**
 * Receives Account Acitivity events
 **/
app.post('/webhook/twitter', async function(request, response) {
 
  if(!(request.body.direct_message_indicate_typing_events == undefined)){
    console.log("Typing.....")
  }
  else{

    //Detect when account tweets
    if(request.body.tweet_create_events){
      var tweetEvent = request.body.tweet_create_events[0]
      console.log(tweetEvent)
      console.log(tweetEvent.user.id)
      console.log(`Timeline Activity: ${tweetEvent.text}`)
    }

    //Detect incoming and outgoing DM events
    if(request.body.direct_message_events){
      var directMessageEvent = request.body.direct_message_events[0]
      if(directMessageEvent.type == "message_create"){
    
        const twitterSenderID = directMessageEvent.message_create.sender_id
        const sourceAppID = directMessageEvent.message_create.source_app_id
        const messageText = directMessageEvent.message_create.message_data.text

        // The www.your.domain/Webhook/twitter endpoint is used to SEND, as well as to RECEIVE DMs.
        // SourceAppID becomes "undefined" when the "message_create" event originated 
        // from a DM message that was sent from a Twitter user to your bot's Twitter App.
        // If that is the case, relay the user's input to Teneo engine for processing.
        if(sourceAppID == undefined){

          console.log(`User: ${messageText}`)
          // Check if we have stored an engine sessionid for this user
          const teneoSessionId = sessionHandler.getSession(twitterSenderID);

          // Send the user's input from the DM to Teneo, and obtain a response.
          const teneoResponse = await teneoApi.sendInput(teneoSessionId, { 'text': messageText, 'channel': 'twitter-dm', 'phoneNumber': twitterSenderID});

          // Stored engine sessionid for this caller
          sessionHandler.setSession(twitterSenderID, teneoResponse.sessionId);

          // Send TIE's response to the user via DM
          sendDM(twitterSenderID, teneoResponse.output.text)
        }
        else{
          console.log(`Bot: ${messageText}`)
        }
      }
    }
    
  }
  
  socket.io.emit(socket.activity_event, {
    internal_id: uuid(),
    event: request.body
  })

  response.send('200 OK')
})

/**
 * Subscription management
 **/
app.get('/subscriptions', auth.basic, cacheRoute(1000), require('./routes/subscriptions'))


/**
 * Starts Twitter sign-in process for adding a user subscription
 **/
app.get('/subscriptions/add', passport.authenticate('twitter', {
  callbackURL: '/callbacks/addsub'
}));

/**
 * Starts Twitter sign-in process for removing a user subscription
 **/
app.get('/subscriptions/remove', passport.authenticate('twitter', {
  callbackURL: '/callbacks/removesub'
}));


/**
 * Webhook management routes
 **/
var webhook_view = require('./routes/webhook')
app.get('/webhook', auth.basic, auth.csrf, webhook_view.get_config)
app.post('/webhook/update', parseForm, auth.csrf, webhook_view.update_config)
app.post('/webhook/validate', parseForm, auth.csrf, webhook_view.validate_config)
app.post('/webhook/delete', parseForm, auth.csrf, webhook_view.delete_config)


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
  };
}