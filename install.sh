#!/bin/sh

read -e -p "Enter your GitHub username: " USER
read -e -p "Enter repository owner: " OWNER
read -e -p "Enter repository name: " REPO
read -e -p "Enter your github-to-slack url: " HOOK

# -F "hub.callback=http://TESTcrunchbutton-github-to-slack.herokuapp.com/slack/issues"

curl -H "Content-Type: application/json" \
	-u "${USER}" \
	-X POST -d '{"name":"web","active":true,"events":["issues","issue_comment"],"config":{"url":"${HOOK}","content_type":"json"}}' \
	https://api.github.com/repos/${OWNER}/${REPO}/hooks
