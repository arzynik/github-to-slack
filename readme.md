GitHub to Slack event forwarding
=======================

The purpose of this script is to group up issue closing, their comments, and forward it to slack as a notification. Slacks current integration sends too much data that I typicaly do not need.

### Installation
1. Add a custom webhook integration for [Slack](http://slack.com) at https://**TEAMDOMAIN**.slack.com/services/new/incoming-webhook replacing **TEAMDOMAIN** with your url.
2. Add a new [GitHub](http://github.com) webhook by going to https://github.com/**ORGANIZATION**/**REPOSITORY**/settings/hooks/new, replacing **ORGANIZATION** and **REPOSITORY**.
3. Enter the **Payload URL** as whereever you have your github-to-slack integration hosted.
4. Set **Content-Type** to **application/json**.
6. Select **Let me select individual events**, and choose **Issues** and **Issue comment**.
7. Leave **Active** checked.
8. Press **Add Webhook**.
9. If you are on [Heroku](http://heroku.com), [AppFog](http://appfog.com) or some other host where you can define your environment variables, define them as described below. Otherwise you can edit your **index.js** file.

### Configuration
- **SLACK_WEBHOOK_URL** - Webhook url generated in Installation step 1.
- **SLACK_CHANEL** (optional) - Channel overwrite with hash prefix.
- **SLACK_USERNAME** (optional) - Username of the bot.
- **SLACK_ICON_URL** (optional) - Icon url of the bot. 
- **SLACK_ICON_EMOJI** (optional) - Emoji iconcon of the bot.
- **SLACK_AUTHOR_NAMETYPE** (optional) - First (default), last, full, or login. Sends an additional request to github to get users names.