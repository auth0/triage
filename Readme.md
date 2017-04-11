# README

## Overview

Triage is a [Slash Webtask](https://webtask.io/slack) that we use to triage our #security-alerts Slack channel.

We took inspiration from the Slack security team ( [talk](https://www.youtube.com/watch?v=Xh-aB8Im_Ys) ) who were kind enough to open source their [code](https://github.com/johnagan/triagebot-example).

After reviewing their example code we realized it was a perfect fit for our own [Webtask](https://webtask.io/) service.

It can run it two modes:

* From within a channel: it will triage the alerts in the channel
* From a DM: when a channel name is passed included in the call it will triage that channel

## Installation

The requirements for Triage are a Slack bot token and the Slash Webtasks Slack app.

1. Follow the instructions [here](https://webtask.io/slack) to enable Slash Webtasks for your Slack organization.
1. After it's installed you create a new Slash Webtask by running `/wt make triage` and then `wt edit triage` to open the Webtask editor.
1. Add your Slack bot token as a [secret](https://webtask.io/docs/editor/secrets) called `SLACK_TOKEN` and copy over the code from this repository.
1. It can be run from within a channel `/wt triage` or from a DM `/wt triage #security-alerts`.

## What is Auth0?

Auth0 helps you to:

* Add authentication with [multiple authentication sources](https://docs.auth0.com/identityproviders), either social like **Google, Facebook, Microsoft Account, LinkedIn, GitHub, Twitter, Box, Salesforce, among others**, or enterprise identity systems like **Windows Azure AD, Google Apps, Active Directory, ADFS or any SAML Identity Provider**.
* Add authentication through more traditional **[username/password databases](https://docs.auth0.com/mysql-connection-tutorial)**.
* Add support for **[linking different user accounts](https://docs.auth0.com/link-accounts)** with the same user.
* Support for generating signed [Json Web Tokens](https://docs.auth0.com/jwt) to call your APIs and **flow the user identity** securely.
* Analytics of how, when and where users are logging in.
* Pull data from other sources and add it to the user profile, through [JavaScript rules](https://docs.auth0.com/rules).


## Create a free account in Auth0

1. Go to [Auth0](https://auth0.com) and click Sign Up.
2. Use Google, GitHub or Microsoft Account to login.


## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.


## Author

[Auth0](https://auth0.com)


## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
