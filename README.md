# tie-api-example-twitter

> [!IMPORTANT]
> This project has been retired and archived  
> If there is a need of continued use / development of this project for your own needs please feel free to fork the project - which will remain here in archived form.

**Note: Starting February 9, twitter will no longer support free access to the Twitter API, both v2 and v1.1. A paid basic tier will be available instead**

This Node.js connector enables communication between a Teneo bot and Twitter users via Direct Messages and Tweets. The connector uses Twitter's [Account Activity API](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/overview) to detect and react to incoming Direct Messages and Tweets, without quickly exhausting Twitter's Rate Limit. This connector is partially based on the [account-activity-dashboard](https://github.com/mkgareja/tbot).

## Prerequisites

### Teneo Engine

Your bot needs to be published and you need to know the Engine URL.

### Twitter account

You will need to apply for a Twitter Developer Account and then create a Twitter App, as described ahead.

### HTTPS

An Azure account with an active subscription is required. [Create an account for free](https://azure.microsoft.com/free/?utm_source=campaign&utm_campaign=vscode-tutorial-app-service-extension&mktingSource=vscode-tutorial-app-service-extension).

To run the connector locally, [ngrok](https://ngrok.com/) is preferred to make the connector available via HTTPS.

### Node
[Node.js via nvm](https://github.com/nvm-sh/nvm)
## GETTING STARTED
### Create a Twitter app

1. Apply for a Twitter Developer account on [developer.twitter.com](https://developer.twitter.com/en/apps), select "Making a Bot", and fill in all required fields. On the Specifics section, set "Will your app use Tweet, Retweet, like, follow, or Direct Message functionality?" to YES. You may set all other options to No. Continue filling in required descriptions and validate Twitter's activation email.
2. Create a Twitter App [here](https://developer.twitter.com/en/apps/create). Tap "Create an App". You will be prompted to apply for a Twitter Developer account. Tap "Apply".
3. Fill all required fields and tap "Let's do this"
4. Accept the Developer Agreement & policy terms
5. After you name your app, tap the "get keys" button
6. Take note of your keys and tokens tap "Dashboard" (and confirm).

### Create a Twitter Dev Environment

1. Tap in the "Projects & Apps" section on the left of your dashboard, click on your project name
2. Apply for Do you need Elevated access for your Project.
3. Fill all required fields and tap "next"
4. Specify how will you use twitter data, required questions and hit "next"
5. Hit next on verification of information.
6. Accept developer agreement & policy

Once your request for elevated Access is approved you should have a list of [environments](https://developer.twitter.com/en/account/environments).

In the Account Activity API/Sandbox section, click Setup Dev Environment. Name your environment and link this new environment to the App you created in the previous step and take note of the `environment_label` for later use.

## Connector Setup Instructions

There are some ways of running this connector and described ahead.

- You can run the connector online with Azure.
- You can [Run the connector locally](#running-the-connector-locally) or deploying it on a server of your choice. This is preferred if you're familiar with Node.js development and want to have a closer look at the code, or to implement modifications and enhancements.

## Running the connector with Azure & Docker

### Prerequisites

- [Install Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
- You must also have [Docker](https://docs.docker.com/get-docker/) installed locally.

#### Build and setup this repository

1. Click the button below to deploy the registry template to Azure

    [![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fartificialsolutions%2Ftie-api-example-twitter%2Fmaster%2Fazuredeploy.json)

    After login you will be prompted to fill deployment basic details for your registry.

    Hit "Review and create"

    After validation passed hit create

    You will be directed to the Overview page after deployment is complete and hit the "Go to resource group" button and you will see your resources click on your App service.
    Copy the login server from your app You will need it for the next step.

### Configure the Twitter App

1. Open your app's [Details](https://developer.twitter.com/en/apps)
2. Tap the edit button on "User authentication settings"
3. Enable Read, Write and direct messages, and "Web App, Automated App or Bot" as a type of APP
4. Under App info paste your azure login server into both "callback url" and "website url", hit save.
5. Take note of the new keys and save them.
6. Under Keys Access Token and Secret click "regenerate" then confirm your option.
7. Copy the new Access token and Keys and substitute the old ones.

### Build and deploy Docker Image

1. Clone this repository:

    ``` bash
    git clone https://github.com/artificialsolutions/tie-api-example-twitter.git
    ```

1. Create a new file called .env based on .env.sample and fill in your Twitter keys, tokens, Teneo Engine URL. Like so.

    | env Key| Twitter Key|
    | ------------- |:-------------:|
    | TWITTER_CONSUMER_KEY| 'Api-key'  |
    | TWITTER_CONSUMER_SECRET| 'Api-Secret'|
    | TWITTER_ACCESS_TOKEN| 'Access Token'|
    | TWITTER_ACCESS_SECRET| 'Access Token Secret'|
    | TWITTER_WEBHOOK_ENV| 'twitter environment name'|
    | TENEO_ENGINE_URL|'url for you teneo webchat' |

1. Create an ACI context which associates Docker with an Azure subscription and resource group so you can create and manage container instances. Remember to Substitute ` nameyourcontext` for one of your choosing.

    ``` bash
    docker login azure
    docker context create aci nameyourcontext
    ```

    When prompted, select your Azure subscription ID, then select an existing resource group (previously created when template deployed)

1. Build the docker image for the connector. Remember to Substitute ` imagename` for one of your choosing.

    ``` bash
    docker build . -t imagename
    ```

Note: if you are using a Mac "M1 Chip" use: ` docker buildx build --platform=linux/amd64 -t imagename . `

### Tag and deploy Docker Image

1. Create an alias of the image with the fully qualified path to your registry. Remember to Substitute ` registryname` and ` imagename` for the one you chose on previous steps.

    ``` bash
    docker tag imagename registryname.azurecr.io/imagename
    ```

1. log into the Azure CLI and then authenticate to your registry:

    ``` bash
    az login
    az acr login --name registryname
    ```

1. Push the image to your registry

    ``` bash
    docker push registryname.azurecr.io/imagename
    ```

1. Use the az acr repository list command to verify that the push was successful

    ``` bash
    az acr repository list -n registryname
    ```

1. Change to your recently created ACI context.  Remember to Substitute ` nameyourcontext` for the one you chose on 'Create an ACI context' step .

    ``` bash
    docker context use nameyourcontext
    ```

1. Use the docker run command to run your image from your registry in your context. Remember to Substitute ` registryname` and ` imagename` for the one you chose on previous steps.

    ``` bash
    docker run -d registryname.azurecr.io/imagename
    ```

    which will return a randomly generated new image name 'RandomGeneratedName'

1. Use the name from the step above to run a bash shell inside the container

   ``` bash
    docker exec -it RandomGeneratedName /bin/bash
    ```

1. Run our script to get direct messages or mentions

    ``` bash
    node example_scripts/get-direct-messages.js
    node example_scripts/get-mentions.js 
    ```

-----

## Running the connector locally

Next, we need to make the connector available via https. We'll use [ngrok](https://ngrok.com) for this.

1. Start ngrok. The connector runs on port 5000 by default, so we need to start ngrok like this:

    ``` bash
    ngrok http 5000
    ```

*Note for Mac Users you might get

 ``` bash
 uncaught exception: listen EADDRINUSE: address already in use :::5000
Error: listen EADDRINUSE: address already in use :::5000
```

Airplay is using port 5000 you can deactivate it in System Preferences › Sharing and uncheck  ```AirPlay  Receiver``` to release port 5000. ([source](https://nono.ma/port-5000-used-by-control-center-in-macos-controlce))

1. Running the command above will display a public forwarding https URL. Copy it, we will use it in the step below.

1. Revisit your app's [Details](https://developer.twitter.com/en/apps)
1. Under App info tap the edit button on "User authentication settings" paste your public forwarding https URL (` https://yoururl.ngrok.io `) into both  "callback url" and "website url", hit save.

#### Setup & run a Node.js web app

1. Clone this repository:

    ``` bash
    git clone https://github.com/artificialsolutions/tie-api-example-twitter.git
    ```

1. Create a new file called .env based on .env.sample and fill in your Twitter keys, tokens, Teneo Engine URL. Like so.

    | env Key| Twitter Key|
    | ------------- |:-------------:|
    | TWITTER_CONSUMER_KEY| 'Api-key'  |
    | TWITTER_CONSUMER_SECRET| 'Api-Secret'|
    | TWITTER_ACCESS_TOKEN| 'Access Token'|
    | TWITTER_ACCESS_SECRET| 'Access Token Secret'|
    | TWITTER_WEBHOOK_ENV| 'twitter environment name'|
    | TENEO_ENGINE_URL|'url for you teneo webchat' |

1. Install dependencies locally:

    ```bash
    npm install
    ```
1. Run our script to get direct messages or mentions

    ``` bash
    node example_scripts/get-direct-messages.js
    node example_scripts/get-mentions.js 
    ```
That's it! You can now interact with your Teneo solution powered bot with Direct Messages and Tweet mentions.

## Production considerations

This app is for demonstration purposes only. The application can handle light usage, but you may experience API rate limit issues under heavier load. Consider storing data locally in a secure database, caching requests, or applying for a business account for increased Rate Limits.
