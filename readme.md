GitHub event forwarding
=======================

The purpose of this script is to group up issue closing, their comments, and forward it to slack as a notification.

### Instalation
1. Add a custom webhook integration at **https://URL.slack.com/services/new/incoming-webhook** replacing **URL** with your url.
2. Edit the **install.sh** with your **SERVER** path.
3. Run **install.sh** to add the event service hooks to github.
4. If you are on heroku, appfog or some other host where you can define your server variables, define them as described below. Otherwise you can edit your **app.js** file.

### Configuration
- **SLACK_WEBHOOK_URL** - Webhook url generated in step 1
- **SLACK_CHANEL** (optional) - Channel overwrite with hash prefix
- **SLACK_USERNAME** (optional) - Username of the bot
- **SLACK_ICON_URL** (optional) - Icon url of the bot. 
- **SLACK_ICON_EMOJI** (optional) - Emoji iconcon of the bot
  