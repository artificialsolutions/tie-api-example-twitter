# Command line example scripts

These scripts should be executed from root of the project folder. Your environment, app keys and tokens should be defined in a `config.json` file at the root of this project folder.

---

## Retrieve Messages and mentions

Retrieve incoming DMs, tweets, and mentions.

Keep the web app from the previous step running in one console window, and then open a second console window to retrieve your messages, with the following command:

``` bash
node example_scripts/get-mentions.js -e <environment_label>
```

To retrieve your DM's run the following command

``` bash
node example_scripts/get-direct-messages.js -e <environment_label>
```

That's it! You can now interact with your Teneo solution powered bot with Direct Messages, and Tweet mentions.
