'use strict';

const assert = require('assert');
const Promise = require('bluebird').Promise;
const _ = require('lodash');
const qs = require('querystring');
const http = require('axios');

const directMessageHandle = 'directmessage';
const DEFAULTS = {
  "unfurl_links": true,
  "publish_text": "publish",
  "display": [ "pending", "review" ],
  "pending": {
    "title": "There are `{{count}}` request(s) pending in {{channel}}:",
    "emojis": [ "red_circle", "large_blue_circle", "white_circle" ]
  },
  "review": {
    "title": "There are `{{count}}` request(s) being looked :eyes: at in {{channel}}:",
    "emojis": [ "eyes" ]
  },
  "addressed": {
    "title": "There are `{{count}}` request(s) addressed in {{channel}}:",
    "emojis": [ "white_check_mark" ]
  },
  "help": [
    {
      "color": "#fff",
      "text": "\n"
    },
    {
      "mrkdwn_in": [ "text", "pretext" ],
      "pretext": "Here's how *Triage* works:",
      "text": "I look at messages posted in here since yesterday.\nI only care about messages that have :red_circle:, :large_blue_circle:, or :white_circle:.\nIf a messages has :eyes: reaction, it's in progress. \nIf it has a :white_check_mark:, it's done. Otherwise, it's still pending.\n"
    }
  ],
  "skip_bots": false
};


function getChannelIdByName(slackToken, name) {
  const slackChannelsListURL = 'https://slack.com/api/channels.list';
  const params = qs.stringify({
    token: slackToken
  });

  return http.post(slackChannelsListURL, params)
    .then((resp) => {
      if (!resp.data.ok) {
        console.log(resp.data.error);
        return null;
      }

      const channel = resp.data.channels.filter(
        cn => cn.name.toLowerCase() === name.replace('#', '').toLowerCase()
      );

      if (channel.length === 1) {
        return channel.pop()['id'];
      }

      return null;
    });
}

function getSlackHistory(slackToken, channelId, historySize) {
  const slackHistoryURL = 'https://slack.com/api/channels.history';
  const params = qs.stringify({
    count: historySize,
    token: slackToken,
    channel: channelId
  });

  // Return Promise
  return http.post(slackHistoryURL, params);
}


function getRequest(settings, message) {
  // the emoji that was matched
  let test = new RegExp(settings.pending.emojis.join('|'));
  let match = message.text.match(test);
  let emoji = match ? match[0] : null;

  // flags based on reactions
  let reactions = (message.reactions || []).map(r => r.name);
  let addressed = settings.addressed.emojis.some(e => _.includes(reactions, e));
  let review = settings.review.emojis.some(e => _.includes(reactions, e)) && !addressed;
  let pending = emoji && !review && !addressed;

  let id = message.ts.replace('.', '');
  let bot = settings.skip_bots && (message.subtype === 'bot_message');
  let priority = settings.pending.emojis.indexOf(emoji);

  return { bot, priority, emoji, addressed, pending, review, id, message };
}


function buildSection(settings, requests, payload, name) {
  let channel_id = payload.channel_id;
  let team_domain = payload.team_domain;
  let channel_name = payload.channel_name;

  // Correct the url if this comes from a DM
  if (payload.channel_name === directMessageHandle) {
    channel_name = payload.text;
  }

  let baseUrl = `https://${team_domain}.slack.com/archives/${channel_name}/p`;

  let title = settings[name].title;
  let filtered = requests.filter(r => r[name]);
  let items = filtered.map(r => `:${r.emoji}: ${baseUrl + r.id}`);
  let text = [title].concat(items).join('\n');

  // replace template fields
  text = text.replace(/{{count}}/, filtered.length);
  text = text.replace(/{{channel}}/, `<#${channel_id}|${channel_name}>`);

  return text;
}


function buildMessage(payload, requests, settings) {
  let message = { unfurl_links: settings.unfurl_links };
  let publish_test = new RegExp(settings.publish_text, 'i');

  // build display text
  let map = buildSection.bind(null, settings, requests, payload);
  message.text = settings.display.map(map).join('\n\n\n');

  // attach instructions if not publish else make public
  if (publish_test.test(payload.text)) message.response_type = 'in_channel';
  else message.attachments = settings.help;

  return message;
}

function create(payload, messages, options) {
  let settings = Object.assign({}, DEFAULTS, options);

  let map = getRequest.bind(null, settings);
  let sort = (a, b) => a.priority - b.priority;
  let filter = m => m.emoji && !m.bot;

  let requests = messages.map(map).filter(filter).sort(sort);
  let message = buildMessage(payload, requests, settings);

  return message;
}


function postResults(payload, result) {
  return http.post(payload.response_url, result);
}

function sync_response(cb, text, only_caller) {
  cb(null, { text: text, response_type: only_caller ? 'emphemeral' : 'in_channel' });
}


module.exports = (ctx, cb) => {
  const HISTORY_SIZE = 1000;
  const SLACK_TOKEN = ctx.secrets.SLACK_TOKEN;
  const startTimeout = 1000;
  const isDirectMessage = ctx.body.channel_name === directMessageHandle;

  assert(SLACK_TOKEN, 'SLACK_TOKEN not set.');

  if (isDirectMessage && ctx.body.text.match(/^#/) === null) {
    return sync_response(cb, 'Missing second parameter, channel name i.e. #alerts');
  }

  setTimeout(() => {
    Promise.resolve().then(() => {
      if (isDirectMessage) {
        return getChannelIdByName(SLACK_TOKEN, ctx.body.text.replace('#', ''));
      }

      return Promise.resolve(ctx.body.channel_id);
    }).then((channelID) => {
      if (channelID === null) {
        return cb();
      }

      getSlackHistory(SLACK_TOKEN, channelID, HISTORY_SIZE)
        .then(result => create(ctx.body, result.data.messages))
        .then(result => postResults(ctx.body, result))
        .then(() => sync_response(cb, ' '));
    }).catch((err) => {
      console.log(err);
      console.log(err.stack);
      cb();
    });
  }, startTimeout);
};
