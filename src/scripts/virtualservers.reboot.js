// Description:
//	Listens for commands to initiate actions against virtual servers
//
// Configuration:
//	 HUBOT_VIRTUAL_SERVER_REGION Bluemix Virtual Server region, OS_REGION_NAME in rcfile
//	 HUBOT_VIRTUAL_SERVER_AUTH_URL Bluemix Virtual Server authentication url, OS_AUTH_URL in rcfile
//	 HUBOT_VIRTUAL_SERVER_DOMIAN_NAME Bluemix Virtual Server domain name, OS_USER_DOMAIN_NAME in rcfile
//
// Author:
// ycao
/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

var path = require('path');
var TAG = path.basename(__filename);

const vs = require('../lib/vs');
const utils = require('hubot-ibmcloud-utils').utils;
const activity = require('hubot-ibmcloud-activity-emitter');
const Conversation = require('hubot-conversation');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
var i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

const REBOOT_VS = /(vs|virtual server)\s+(restart|reboot)\s+(.*)/i;

module.exports = (robot) => {
	const switchBoard = new Conversation(robot);

	robot.on('bluemix.vs.reboot', (res, parameters) => {
		robot.logger.debug(`${TAG}: bluemix.vs.reboot Natural Language match.`);

		if (parameters && parameters.vsname) {
			const serverName = parameters.vsname;
			rebootVirtualServer(res, serverName);
		}
		else {
			robot.logger.error(`${TAG}: Error extracting Virtual Server Name from text=[${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.reboot');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}
	});
	robot.respond(REBOOT_VS, {id: 'bluemix.vs.reboot'}, (res) => {
		robot.logger.debug(`${TAG}: bluemix.vs.reboot Reg Ex match.`);
		const serverName = res.match[3];
		rebootVirtualServer(res, serverName);
	});

	function rebootVirtualServer(res, name) {
		robot.logger.debug(`${TAG}: bluemix.vs.reboot res.message.text=${res.message.text}.`);
		robot.logger.info(`${TAG}: Rebooting the virtual server ${name}`);
		let prompt = i18n.__('vs.reboot.confirm', name);
		let negativeResponse = i18n.__('general.safe.this.time', name);
		utils.getConfirmedResponse(res, switchBoard, prompt, negativeResponse).then((dialogResult) => {
			robot.logger.info(`${TAG}: Asynch call using vs library to reboot virtual server ${name}.`);
			vs.rebootServerByName(name).then((server) => {
				robot.logger.info(`${TAG}: Reboot of virtual server ${name} successful.`);
				let message = i18n.__('vs.reboot.success', server.name);
				robot.emit('ibmcloud.formatter', { response: res, message: message});
				activity.emitBotActivity(robot, res, { activity_id: 'activity.virtualserver.reboot' });
			}, (err) => {
				if (err.statusCode === 404) {
					robot.logger.error(`${TAG}: Reboot of virtual server ${name} failed. Server was not found.`);
					let message = i18n.__('vs.name.not.found', name);
					robot.emit('ibmcloud.formatter', { response: res, message: message});
				}
				else {
					robot.logger.error(`${TAG}: Reboot of virtual server ${name} failed. Error: ${err.result}`);
					let message = i18n.__('vs.reboot.failure', name, JSON.stringify(err.result));
					robot.emit('ibmcloud.formatter', { response: res, message: message});
				}
				robot.logger.error(err);
			});
		});
	};
};
