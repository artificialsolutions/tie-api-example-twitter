# tie-api-example-twitter

This Node.js connector enables communication between a Teneo bot and Twitter users via Direct Messages and Tweets. The connector uses Twitter's [Account Activity API](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/overview) to detect and react to incoming Direct Messages and Tweets, without quickly exhausting Twitter's Rate Limit. This connector is partially based on the [account-activity-dashboard](https://github.com/mkgareja/tbot).

## Prerequisites

### Teneo Engine

Your bot needs to be published and you need to know the Engine URL.

### Twitter account

You will need to apply for a Twitter Developer Account and then create a Twitter App, as described ahead.

### HTTPS

To run the connector locally, [ngrok](https://ngrok.com/) is preferred to make the connector available via HTTPS.

## GETTING STARTED

### Create a Twitter app

1. Apply for a Twitter Developer account on [developer.twitter.com](https://developer.twitter.com/en/apps), select "Making a Bot", and fill in all required fields. On the Specifics section, set "Will your app use Tweet, Retweet, like, follow, or Direct Message functionality?" to YES. You may set all other options to No. Continue filling in required descriptions and validate Twitter's activation email.

2. Create a Twitter App [here](https://developer.twitter.com/en/apps/create). Fill all required fields and tap "Create"

### Create a Twitter Account Activity API

In the Account Activity API/Sandbox section, click [Setup Dev Environment](https://developer.twitter.com/en/account/environments). Link this new environment to the App you created in the previous step and take note of the `environment_label` for later use.

### Configure the Twitter App

1. Open your app's [Details](https://developer.twitter.com/en/apps)
2. Navigate into Permissions > Edit > Access permission section > Enable Read, Write and direct messages.
3. On the Keys and Tokens tab > click Create button. Take note of all four keys and tokens.

## Connector Setup Instructions

One way of running this connector is described ahead.
[Running the connector locally](#running-the-connector-locally) or deploying it on a server of your choice. This is preferred if you're familiar with Node.js development and want to have a closer look at the code, or to implement modifications and enhancements.

### Running the connector locally

Next, we need to make the connector available via https. We'll use [ngrok](https://ngrok.com) for this.

1. Start ngrok. The connector runs on port 5000 by default, so we need to start ngrok like this:

    ``` bash
    ngrok http 5000
    ```

2. Running the command above will display a public forwarding https URL. Copy it, we will use it as a `webhook_url` in the final step below.

3. Revisit your [https://developer.twitter.com/en/apps](Details), click 'Edit', and use `webhook_url` to form the following URL values and add them as whitelisted Callback URLs:

    ``` bash
    https://yoururl.ngrok.io/webhook/twitter
    https://yoururl.ngrok.io/callbacks/addsub
    https://yoururl.ngrok.io/callbacks/removesub
    ```

#### Setup & run a Node.js web app

1. Clone this repository:

    ``` bash
    git clone https://github.com/artificialsolutions/tie-api-example-twitter.git
    ```

2. Install Node.js dependencies:

    ``` bash
    npm install
    ```

3. Create a new file called `.env` based on `.env.sample` and fill in your Twitter keys, tokens, Teneo Engine URL and webhook environment name. Twitter keys and access tokens are found on your app page on [apps.twitter.com](https://apps.twitter.com/).

4. Run locally:

    ```bash
    npm start
    ```

*Note for Mac Users you might get

 ``` bash
 uncaught exception: listen EADDRINUSE: address already in use :::5000
Error: listen EADDRINUSE: address already in use :::5000
```

Airplay is using port 5000 you can deactivate it in System Preferences › Sharing and uncheck  ```AirPlay  Receiver``` to release port 5000. ([source](https://nono.ma/port-5000-used-by-control-center-in-macos-controlce))

That's it! You can now interact with your Teneo solution powered bot with Direct Messages, Tweet mentions, and Tweet replies.

## Production considerations

This app is for demonstration purposes only. The application can handle light usage, but you may experience API rate limit issues under heavier load. Consider storing data locally in a secure database, caching requests, or applying for a business account for increased Rate Limits.
