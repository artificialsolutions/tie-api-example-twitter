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
In the Account Activity API/Sandbox section, click [Setup Dev Environment](https://developer.twitter.com/en/account/environments). Link this new environment to the App you created in the previous step and take note of the Environment's Label for later use.

## Configure the Twitter App
1. Open your app's [Details](https://developer.twitter.com/en/apps)
2. Navigate into Permissions > Edit > Access permission section > Enable Read, Write and direct messages.
3. On the Keys and Tokens tab > Access token & access token secret section > click Create button. Take note of all four keys and tokens.

WIP Local!!
## Set up ngrok
WIP

## Create a Webhook endpoint
A Free Twitter Developer account allows the creation of one webhook that can be used to receive user events on a web app.
Set up a webhook by running this command on the project's root folder:

    ```bash
    node example_scripts/webhook_management/create-webhook-config.js -e <environment_label> -u <https.your_url.ngrok.io/webhook/twitter>
    ```

## Subscribe to App Owner 
Subscribe the Account Activity API Environment to listen to activity that happens on the Twitter account that owns the app, such as incoming DMs, tweets, and mentions. 

    ```bash
    node example_scripts/subscription_management/add-subscription-app-owner.js -e <environment_label>
    ```
    
    
## Setup & run the Node.js web app

1. Clone this repository:

    ```bash
    git clone https://github.com/artificialsolutions/tie-api-example-twitter.git
    ```

2. Install Node.js dependencies:

    ```bash
    npm install
    ```

3. Create a new `config.json` file based on `config.sample.json` and fill in your Twitter keys, tokens and webhook environment name. Twitter keys and access tokens are found on your app page on [apps.twitter.com](https://apps.twitter.com/). The basic auth properties can be anything you want, and are used for simple password protection to access the configuration UI.

4. Run locally:

    ```bash
    npm start
    ```

5. Deploy app or setup a tunnel to localhost. To deploy to Heroku see "Deploy to Heroku" instructions below. To setup a tunnel use something like [ngrok](https://ngrok.com/).

    Take note of your webhook URL. For example:

    ```text
    https://your.app.domain/webhook/twitter
    ```

6. Take note of the deployed URL, revisit your developer.twitter.com Apps **Settings** page, and add the following URL values as whitelisted Callback URLs:

    ```text
    http(s)://your.app.domain/callbacks/addsub
    http(s)://your.app.domain/callbacks/removesub
    ```

## Configure webhook to receive events

To configure your webhook you can use this apps' web UI, or use the example scripts from the command line.

### Using the web UI

Load the web app in your browser and follow the instructions below.

1. Setup webhook config. Navigate to the "manage webhook" view. Enter your webhook URL noted earlier and click "Create/Update."

2. Add a user subscription. Navigate to the "manage subscriptions" view. Click "add" and proceed with Twitter sign-in. Once complete your webhook will start to receive account activity events for the user.

### Using the command line example scripts

These scripts should be executed from root of the project folder. Your environment, url or webhook ID should be passed in as command line arguments.

1. Create webhook config.

    ```bash
    node example_scripts/webhook_management/create-webhook-config.js -e <environment> -u <url>
    ```

2. Add a user subscription for the user that owns the app.

    ```bash
    node example_scripts/subscription_management/add-subscription-app-owner.js -e <environment>
    ```

3. To add a user subscription for another user using PIN-based Twitter sign-in.

    ```bash
    node example_scripts/subscription_management/add-subscription-other-user.js -e <environment>
    ```

**Note:** More example scripts can be found in the [example_scripts](example_scripts) directory to:

* Create, delete, retrieve and validate webhook configs.
* Add, remove, retrieve, count and list user subscriptions.

## Deploy to Heroku (optional)

1. Init Heroku app.

    ```bash
    heroku create
    ```

2. Run locally.

    ```text
    heroku local
    ```

3. Configure environment variables. Set up an environment variable for every property on config.json. See Heroku documentation on [Configuration and Config Vars](https://devcenter.heroku.com/articles/config-vars).

4. Deploy to Heroku.

    ```bash
    git push heroku master
    ```

**Note:** The free tier of Heroku will put your app to sleep after 30 minutes. On cold start, you app will have very high latency which may result in a CRC failure that deactivates your webhook. To trigger a challenge response request and re-validate, run the following script.

```bash
node example_scripts/webhook_management/validate-webhook-config.js -e <environment> -i <webhook_id>
```

## Production considerations

This app is for demonstration purposes only, and should not be used in production without further modifcations. Dependencies on databases, and other types of services are intentionally not within the scope of this sample app. Some considerations below:

* With this basic application, user information is stored in server side sessions. This may not provide the best user experience or be the best solution for your use case, especially if you are adding more functionality.
* The application can handle light usage, but you may experience API rate limit issues under heavier load. Consider storing data locally in a secure database, or caching requests.
* To support multiple users (admins, team members, customers, etc), consider implementing a form of Access Control List for better security.
