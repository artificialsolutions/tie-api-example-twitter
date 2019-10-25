# tie-api-example-twitter
This Node.js connector acts as a middleware that implements communication via Direct Messages between a Teneo bot and Twitter users. Communication with persisting state and conversational position. The connector uses Twitter's [Account Activity API](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/overview) to detect and react to new DM events, without quickly exhausting Twitter's Rate Limit.


## Prerequisites
### Teneo Engine
Your bot needs to be published and you need to know the engine url.

### Twitter account
You will need to apply for a Twitter Developer Account and then create a Twitter app, as described ahead.

### HTTPS
A [Heroku](https://www.heroku.com/home) account is required to deploy the connector online.

Or, to run the connector locally, [ngrok](https://ngrok.com/) is preferred to make the connector available via HTTPS.



## Create a Twitter app

1. Apply for a Twitter Developer account on [developer.twitter.com](https://developer.twitter.com/en/apps), selecting "Making a Bot", and filling in all required fields. On the specifics section, set "Will your app use Tweet, Retweet, like, follow, or Direct Message functionality?" to YES. You may set all other options to No. Continue filling in required descriptions and validating the Twitter's activation email.

2. Create a Twitter App [here](https://developer.twitter.com/en/apps/create). Fill in all required fields and tap "Create"

The configuration of this Twitter app continues ahead.

## Create a Twitter Account Activity API
In the Account Activity API/Sandbox section, click [Setup Dev Environment](https://developer.twitter.com/en/account/environments). Link this new environment to the App you created in the previous step and take note of the `environment_label` for later use.

## Configure the Twitter App
1. Open your app's [Details](https://developer.twitter.com/en/apps)
2. Navigate into Permissions > Edit > Access permission section > Enable Read, Write and direct messages.
3. On the Keys and Tokens tab > Access token & access token secret section > click Create button. Take note of all four keys and tokens.


## Connector Setup Instructions
Two ways of running this connector are described ahead. The first way, is by [running the connector online with Heroku](#running-the-connector-on-heroku). This is the easiest to get the connector running for non-developers since it does not require you to run Node.js or download or modify any code.

The second way is to [run the connector locally](#running-the-connector-locally) or to deploy it on a server of your choice. This is preferred if you're familiar with node.js development and want to have a closer look at the code, or implement modifications and enhancements.

# running-the-connector-locally
Next, we need to make the connector available via https. We'll use [ngrok](https://ngrok.com) for this.

1. Start ngrok. The connector runs on port 5000 by default, so we need to start ngrok like this:
    ```
    ngrok http 5000
    ```
2. Running the command above will display a public forwarding https URL. Copy it, we will use it as a `webhook_url` in the final step below.

3. Revisit your [https://developer.twitter.com/en/apps](Details), click 'Edit', and add the following URL values as whitelisted Callback URLs:

    ```
    https://yoururl.ngrok.io/webhook/twitter
    https://yoururl.ngrok.io/callbacks/addsub
    https://yoururl.ngrok.io/callbacks/removesub
    ```
## Create a Twitter Webhook Configuration
A Free Twitter Developer account allows configuring one webhook_url, to receive user events on a web app. Set up a webhook by running this command on the project's root folder:

    node example_scripts/webhook_management/create-webhook-config.js -e <environment_label> -u <https://yoururl.ngrok.io/webhook/twitter>
    
When succesful, the create-webhook-config command should return a webhook_id.
**Note:** More example scripts can be found in the [example_scripts](example_scripts) directory to:
    * Create, delete, and retrieve webhook configs.
    * Add, remove, and list user subscriptions.


## Subscribe to App Owner 
Subscribe the Account Activity API Environment to listen to activity that happens on the Twitter account that owns the app, such as incoming DMs, tweets, and mentions. 
WIP ADD INFO ABOUT ADD/RMV/MOD webhook

    node example_scripts/subscription_management/add-subscription-app-owner.js -e <environment_label>
    
    
## Setup & run the Node.js web app

1. Clone this repository:

    ```
    git clone https://github.com/artificialsolutions/tie-api-example-twitter.git
    ```

2. Install Node.js dependencies:

    ```
    npm install
    ```

3. Create a new `config.json` file based on `config.sample.json` and fill in your Twitter keys, tokens and webhook environment name. Twitter keys and access tokens are found on your app page on [apps.twitter.com](https://apps.twitter.com/). 

4. Run locally:

    ```bash
    npm start
    ```
    
That's it! Send a Twitter DM to you bot, from another Twitter account, and the Teneo bot will send a reply back.


WIP: Move this section up, above LOCAL deployment
### Running the connector on Heroku
1. Click the button below to deploy the connector to Heroku:

    [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/artificialsolutions/tie-api-example-twitter.git)

2. In the 'Config Vars' section, add the following:
    * **TWITTER_CONSUMER_KEY** [Your app Details](https://developer.twitter.com/en/apps/) > 'Keys and Tokens' Tab
    * **TWITTER_CONSUMER_SECRET** 
    * **TWITTER_ACCESS_TOKEN** 
    * **TWITTER_ACCESS_TOKEN_SECRET**
    * **TWITTER_WEBHOOK_ENV** `environment_label` from [here](https://developer.twitter.com/en/account/environments)
    * **TENEO_ENGINE_URL:** The engine url of your bot.
3. Click on 'Deploy App', and wait for Heroku to complete the deployment. Click 'View' to see your new Heroku's app URL. Copy it, we will use it as a `webhook_url` in the next step.

4. Revisit your [https://developer.twitter.com/en/apps](Details), click 'Edit', and add the following URL values as whitelisted Callback URLs:

    ```
    https://your.herokuapp.com/webhook/twitter
    https://your.herokuapp.com/callbacks/addsub
    https://your.herokuapp.com/callbacks/removesub
    ```

## Create a Twitter Webhook Configuration
Set up a webhook to receive user events on the web app by running this command on the project's root folder:

    node example_scripts/webhook_management/create-webhook-config.js -e <environment_label> -u <your.herokuapp.com/webhook/twitter>
    
## Subscribe to App Owner 
Subscribe the Account Activity API Environment to listen to activity that happens on the Twitter account that owns the app, such as incoming DMs, tweets, and mentions. 
WIP ADD INFO ABOUT ADD/RMV/MOD webhook

    node example_scripts/subscription_management/add-subscription-app-owner.js -e <environment_label>
    
    
That's it! Send a Twitter DM to you bot, from another Twitter account, and the Teneo bot will send a reply back.



**Note:** The free tier of Heroku will put your app to sleep after 30 minutes. On cold start, you app will have very high latency which may result in a CRC failure that deactivates your webhook. To trigger a challenge response request and re-validate, run the following script.

    node example_scripts/webhook_management/validate-webhook-config.js -e <environment> -i <webhook_id>
    

## Production considerations

This app is for demonstration purposes only, and should not be used in production without further modifcations. The application can handle light usage, but you may experience API rate limit issues under heavier load. Consider storing data locally in a secure database, caching requests, or applying for a business account for increased Rate Limits.

