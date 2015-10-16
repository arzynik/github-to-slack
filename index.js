/**
 * Forwards github events to slack chanels
 *
 * note that this wont work for really busy repositories
 *
 * https://github.com/arzynik/github-to-slack
 *
 */

console.error('Starting github-to-slack...');

var
	express = require('express'),
	app = express(),
	request = require('request'),
	bodyParser = require('body-parser')
	port = process.env.PORT || process.env.VCAP_APP_PORT || 5000,
	webhook = process.env.SLACK_WEBHOOK_URL || 'YOUR_URL',	// your webhok url
	room = process.env.SLACK_CHANEL || null,				// default to webhook chanel
	icon_url = process.env.SLACK_ICON_URL || 'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png',			// url of the icon for your user
	icon_emoji = process.env.SLACK_ICON_EMOJI || null,		// url of the icon for your user
	username = process.env.SLACK_USERNAME || 'GitHub',		// username of the bot
	nametype = process.env.SLACK_AUTHOR_NAMETYPE || 'first',		// first, full, last, login
	queue = [], running = false, users = [], queueTimer = null;

nametype = nametype.toLowerCase();

app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('Bad kitty.');
});

// when we get a comment request
app.post('/', function(req, res) {
	var data = req.body;
	var event = req.get('X-GitHub-Event');
	console.error(event);

	if (event == 'issue_comment' && data.action == 'created' && data.issue && data.comment) {
		addToQueue({
			type: 'comment',
			data: data
		});
	} else if (event == 'push') {
		console.error('Push action');
		console.error('message: ' + data.head_commit.message);

		if (!data.head_commit.message || data.ref != 'refs/heads/' + data.repository.master_branch) {
			console.error('bad message: ' + data.head_commit.message);
			console.error('bad ref: ' + 'refs/heads/' + data.repository.master_branch);
			console.error('bad ref: ' + data.ref);
			res.status(501).send('invalid commit or ref');
			return;
		}

		var id = null;
		var issue = new RegExp('(#([0-9]+))|(https://github.com/' + data.repository.full_name + '/issues/([0-9]+))',"g");

		if (data.head_commit.message.match(issue)) {
			id = data.head_commit.message.replace(issue, '$2$4');
		}

		if (!id) {
			console.error('could not find issue id from commit: ' + data.head_commit.message);
			res.status(501).send('invalid issue id');
			return;
		}

		data.issue = {
			id: id
		};

		addToQueue({
			type: 'push',
			data: data
		});

	} else if (event == 'issues' && data.action == 'closed' && data.issue) {
		addToQueue({
			type: 'issue',
			data: data
		});

	} else {
		res.status(501).send('invalid request type');
	}
	res.end();
});

// add item to que
var addToQueue = function(item) {

	if (nametype != 'login') {
		checkUser(item.data.sender);
	}

	var i = item.data.issue.id;
	var u = item.data.sender.id;

	console.error('queuing: ' + item.type + ' | ' + i + ' | ' + u);

	if (!queue[u]) {
		queue[u] = [];
	}
	if (!queue[u][i]) {
		queue[u][i] = [];
	}

	queue[u][i].push(item);
	triggerQueue();
};

// make sure we have the users data
var checkUser = function(u) {
	if (users[u.id]) {
		return;
	}

	request.get({url: u.url, headers: {'User-Agent': 'github-to-slack'}, json: true}, function(error, response, user) {
		if (!error && response.statusCode == 200 && user) {
			switch (nametype) {
				case 'first':
				default:
					users[u.id] = user.name.split(' ').shift();
					break;
				case 'last':
					users[u.id] = user.name.split(' ').pop();
					break;
				case 'full':
					users[u.id] = user.name;
					break;
				case 'login':
					users[u.id] = user.login;
					break;
			}
		}
	});
};

// lazily return the user
var getDisplayUser = function(u) {
	return users[u.id] || u.login;
};

// instead of an interval, just trigger the que being processed when it needs it
var triggerQueue = function() {
	clearTimeout(queueTimer);
	queueTimer = setTimeout(processQueue, 3000);
};

// process queue so we can group comments and issue closings
var processQueue = function() {
	if (!queue.length || running) {
		return;
	}

	running = true;

	// only has 15 seconds to finish. otherwise it will try again
	setTimeout(function() {
		running = false;
	}, 15000);

	// each user
	for (var u in queue) {
		// each issue
		for (var i in queue[u]) {
			// first make sure we have a close action. if its just a comment we dont care.

			if (!queue[u][i]) {
				continue;
			}

			var closeAction = false;
			for (var x in queue[u][i]) {
				if (queue[u][i][x].type == 'issue' && queue[u][i][x].data.action == 'closed') {
					closeAction = queue[u][i][x];
				}
			}

			if (closeAction) {
				var message = '<' + closeAction.data.sender.html_url + '|' + getDisplayUser(closeAction.data.sender) + '>'
					+ ' closed issue <' + closeAction.data.issue.html_url + '|#' + closeAction.data.issue.number + '>: <' + closeAction.data.issue.html_url + '|' + closeAction.data.issue.title + '>';

				var comments = '';
				for (var x in queue[u][i]) {
					// each comment
					if (queue[u][i][x].type == 'comment') {
						comments += "\n" + queue[u][i][x].data.comment.body;
					} else if (queue[u][i][x].type == 'push') {
						comments += "\n" + queue[u][i][x].data.head_commit.message;
					}
				}

				var data = {
					attachments: [{
						fallback: message + comments,
            			author_name: getDisplayUser(closeAction.data.sender),
            			author_link: closeAction.data.sender.html_url,
            			author_icon: closeAction.data.sender.avatar_url,
						pretext: 'Issue <' + closeAction.data.issue.html_url + '|#' + closeAction.data.issue.number + '>: <' + closeAction.data.issue.html_url + '|' + closeAction.data.issue.title + '> was closed',
						text: comments || 'Closed without comment.',
						mrkdwn_in: ["text", "pretext"]
					}]
				};

				if (room) {
					data.channel = room;
				}

				if (icon_emoji) {
					data.icon_emoji = icon_emoji;
				} else if (icon_url) {
					data.icon_url = icon_url;
				}

				if (username) {
					data.username = username;
				}

				request.post({
					url: webhook,
					body: data,
					json: true
				}, function(err,res,body) {
					console.error(err);
				});
			}
			queue[u][i] = null;
		}
	}

	queue = [];
	running = false;
};

app.listen(port, function() {
	console.error('github-to-slack is running on port ' + port);
});
