"use strict";

const request = require('request');
const config = require('../config/config');

let utils = {
	
	sendTextMessage: (sender, text) => {
		let messageData = {
			text:text
		}
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: { access_token: config.token },
			method: 'POST',
			json: {
				recipient: { id: sender },
				message: messageData,
			}
		}, function(error, response, body) {
			if (error) {
				console.log('Error sending message: ', error);
			} else if (response.body.error) {
				console.log('Error: ', response.body.error);
			}
		});
	},
	
	sendGenericMessage: (sender,text,data) => {
		let messageData = {
			"attachment": {
			"type": "template",
			"payload": {
				"template_type": "button",
				"text": text,
				"buttons": data
			}
			}
		};
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: { access_token: config.token },
			method: 'POST',
			json: {
				recipient: { id: sender },
				message: messageData,
			}
		}, function(error, response, body) {
			if (error) {
				console.log('Error sending message: ', error);
			} else if (response.body.error) {
				console.log('Error: ', response.body.error);
			}
		});
	}
};

module.exports = utils;