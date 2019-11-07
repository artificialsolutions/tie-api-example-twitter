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
  oa = new OAuth(
    "https://twitter.com/oauth/request_token"
  , "https://twitter.com/oauth/access_token"
  , twitter_oauth.consumer_key
  , twitter_oauth.consumer_secret
  , "1.0A"
  , "https://f48be735.ngrok.io" + ":" + "5000" + "/authn/twitter/callback"
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
app.post('/webhook/twitter', async function(request, response){
 
  if(!(request.body.direct_message_indicate_typing_events == undefined)){
    console.log("Typing.....")
  }
  else{

    //Detect Tweet replies and mentions
    if(request.body.tweet_create_events){
      
      const tweetEvent = request.body.tweet_create_events[0]
      const senderUserID = tweetEvent.user.id
      const forUserID = request.body.for_user_id

      if(!(senderUserID==forUserID)){  //make sure the bot doesn't reply to its own messages.
        const tweetID = tweetEvent.id
        const inReplyToTweetID = tweetEvent.in_reply_to_status_id_str
        const replyToTweetID = tweetEvent.id_str //id of the incoming tweet where your bot was mentioned
        
        var tweetText = tweetEvent.text
        tweetText = tweetText.replace('@'+tweetEvent.in_reply_to_screen_name,"") //trim @mention from user text

        //console.log(`TWEET EVENT: ${JSON.stringify(tweetEvent)}`)
        //console.log(`TWEET EVENT.BODY: ${JSON.stringify(request.body)}`)
        if(inReplyToTweetID){  //User replied to one of your bot's tweet
          console.log(`*Tweet Reply Event`)
          console.log(`User ${senderUserID} replied to your bot, on a tweet with ID:${replyToTweetID}: ${tweetText}`);
        }
        else{ //User mentioned your bot
          console.log(`*Tweet Mention Event`)
          console.log(`User ${senderUserID} mentioned your bot on his timeline, tweetID: ${tweetID}: ${tweetText}`)
        }

        // Check if we have stored an engine sessionid for this user
        const teneoSessionId = sessionHandler.getSession(senderUserID);

        // Send the user's input from the DM to Teneo, and obtain a response.
        const teneoResponse = await teneoApi.sendInput(teneoSessionId, { 'text': tweetText, 'channel': 'twitter-tweet', 'twitterSenderID': senderUserID, 'tweetID': replyToTweetID});

        // Stored engine sessionid for this caller
        sessionHandler.setSession(senderUserID, teneoResponse.sessionId);

        // Send TIE's response to the user via DM
        // The tweet must include a mention to the target user
        var tweetResponse = "@"+tweetEvent.user.screen_name+" "+teneoResponse.output.text
        console.log(`Teneo bot reply: ${tweetResponse}`)

        makeTweet(replyToTweetID, tweetResponse, function (error, data) {
          if(error) {
            console.log(require('sys').inspect(error));
          } else {
            //console.log(data);
            console.log('[Twitter timeline has been updated]');
          }
        });
      }
    }//end tweet_create_events


    //Detect incoming and outgoing DM events
    if(request.body.direct_message_events){
      var directMessageEvent = request.body.direct_message_events[0]
      if(directMessageEvent.type == "message_create"){
    
        const senderUserID = directMessageEvent.message_create.sender_id
        const sourceAppID = directMessageEvent.message_create.source_app_id
        const messageText = directMessageEvent.message_create.message_data.text    

        // The www.your.domain/Webhook/twitter endpoint is used to SEND, as well as to RECEIVE DMs.
        // SourceAppID becomes "undefined" when the "message_create" event originated 
        // from a DM message that was sent from a Twitter user to your bot's Twitter App.
        // If that is the case, relay the user's input to Teneo engine for processing.
        if(sourceAppID == undefined){

          console.log(`DM user ${senderUserID}: ${messageText}`)
          const teneoSessionId = sessionHandler.getSession(senderUserID);
          const teneoResponse = await teneoApi.sendInput(teneoSessionId, { 'text': messageText, 'channel': 'twitter-dm', 'senderTwitterID': senderUserID});
          sessionHandler.setSession(senderUserID, teneoResponse.sessionId);

          // Send TIE's response to the user via DM
          console.log(`DM Teneo bot: ${teneoResponse.output.text}`)
          sendDM(senderUserID, teneoResponse.output.text)
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
  }
}