#!/usr/bin/env node
'use strict';
var fs = require('fs');
var querystring = require('querystring');
var readline = require('readline-sync');
var request = require('request');

console.log("Hello Cmail");

if (process.argv[2] === undefined) {
  console.log('argv:', process.argv);
}

if (process.argv[2] === 'home') {
  console.log('HOME:', process.env.HOME);
}

if (process.argv[2] === 'auth') {
  var config = JSON.parse(fs.readFileSync(',/config.json')).installed;
  var params = {
    response_type: 'code',
    access_type: 'offline',
    approval_prompt: 'force',
    client_id: config.client_id,
    redirect_uri: config.redirect_uris[0],
    scope: 'https://www.googleapis.com/auth/gmail.labels',
    state: 'some random string haha'
  };
  var uri = config.auth_uri +'?'+ querystring.encode(params);
  console.log(uri);
}

if (process.argv[2] === 'token') {
  var config = JSON.parse(fs.readFileSync(',/config.json')).installed;
  var code = readline.question('Input returned code: ');
  var params = {
    grant_type: 'authorization_code',
    code: code,
    client_id: config.client_id,
    client_secret: config.client_secret,
    redirect_uri: config.redirect_uris[0]
  };
  var options = {
    uri: config.token_uri,
    form: params,
    json: true
  };
  request.post(options, function (error, response, body) {
    if (response.statusCode !== 200) {
      console.log("Error:", error);
      console.log("Status code:", response.statusCode);
      console.log("Body:", body);
      return false;
    }
    fs.writeFileSync(',/token.json', JSON.stringify(body));
  });
}

if (process.argv[2] === 'refresh') {
  var config = JSON.parse(fs.readFileSync(',/config.json')).installed;
  var tokens = JSON.parse(fs.readFileSync(',/token.json'));
  var endpoint = 'https://www.googleapis.com/oauth2/v3/token';
  var params = {
    grant_type: 'refresh_token',
    client_id: config.client_id,
    client_secret: config.client_secret,
    refresh_token: tokens.refresh_token
  };
  var options = {
    uri: endpoint,
    form: params,
    json: true
  };
  request.post(options, function (error, response, body) {
    if (response.statusCode !== 200) {
      console.log("Error:", error);
      console.log("Status code:", response.statusCode);
      console.log("Body:", body);
      return false;
    }
    tokens.access_token = body.access_token;
    tokens.expires_in = body.expires_in;
    tokens.token_type = body.token_type;
    fs.writeFileSync(',/token.json', JSON.stringify(tokens));
  });
}

if (process.argv[2] === 'labels') {
  var tokens = JSON.parse(fs.readFileSync(',/token.json'));
  var endpoint = 'https://www.googleapis.com/gmail/v1/users/me/labels'
  var params = {
    access_token: tokens.access_token,
    prettyPrint: true
  };
  var options = {
    uri: endpoint,
    qs: params,
    json: true
  };
  request.get(options, function (error, response, body) {
    if (response.statusCode !== 200) {
      console.log("Error:", error);
      console.log("Status code:", response.statusCode);
      console.log("Body:", body);
      return false;
    }
    var sysLabels = body.labels.filter(function (item) {
      return item.type === 'system';
    });
    var usrLabels = body.labels.filter(function (item) {
      return item.type === 'user';
    });
    console.log("System Labels");
    sysLabels.forEach(function (item) {
      console.log(item.id, ':', item.name);
    });
    console.log("User Labels");
    usrLabels.forEach(function (item) {
      console.log(item.id, ':', item.name);
    });
  });

}
