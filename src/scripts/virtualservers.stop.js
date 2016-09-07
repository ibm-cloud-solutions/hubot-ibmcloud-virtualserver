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

const path = require('path');
const TAG = path.basename(__filename);

const vs = require('../lib/vs');
const utils = require('hubot-ibmcloud-utils').utils;
const activity = require('hubot-ibmcloud-activity-emitter');
const Conversation = require('hubot-conversation');
const entities = require('../lib/virtualservers.entities');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
const i18n = new (require('i18n-2'))({
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

const STOP_VS = /(vs|virtual server)\s+stop\s+(.*)/i;

module.exports = (robot) => {

	// Register entity handling functions
	entities.registerEntityFunctions();

	const switchBoard = new Conversation(robot);

	robot.on('bluemix.vs.stop', (res, parameters) => {
		robot.logger.debug(`${TAG}: bluemix.vs.stop Natural Language match.`);

		if (parameters && parameters.vsname) {
			const serverName = parameters.vsname;
			stopVirtualServer(res, serverName);
		}
		else {
			robot.logger.error(`${TAG}: Error extracting Virtual Server Name from text=[${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.stop');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}
	});
	robot.respond(STOP_VS, {id: 'bluemix.vs.stop'}, (res) => {
		robot.logger.debug(`${TAG}: bluemix.vs.stop Reg Ex match.`);
		const serverName = res.match[2];
		stopVirtualServer(res, serverName);
	});

	function stopVirtualServer(res, name) {
		robot.logger.debug(`${TAG}: bluemix.vs.stop res.message.text=${res.message.text}.`);
		robot.logger.info(`${TAG}: Stopping the virtual server ${name}`);

		let prompt = i18n.__('vs.stop.confirm', name);
		let negativeResponse = i18n.__('general.safe.this.time', name);
		utils.getConfirmedResponse(res, switchBoard, prompt, negativeResponse).then((dialogResult) => {
			robot.logger.info(`${TAG}: Asynch call using vs library to stop virtual server ${name}.`);
			let message = i18n.__('vs.stop.in.progress', name);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
			vs.stopServerByName(name).then((server) => {
				robot.logger.info(`${TAG}: Stop of virtual server ${name} successful.`);
				let message = i18n.__('vs.stop.success', server.name);
				robot.emit('ibmcloud.formatter', { response: res, message: message});
				activity.emitBotActivity(robot, res, { activity_id: 'activity.virtualserver.stop' });
			}, (err) => {
				if (err.statusCode === 404) {
					robot.logger.error(`${TAG}: Stop of virtual server ${name} failed. Server was not found.`);
					let message = i18n.__('vs.name.not.found', name);
					robot.emit('ibmcloud.formatter', { response: res, message: message});
				}
				else {
					robot.logger.error(`${TAG}: Stop of virtual server ${name} failed. Error: ${err.result}`);
					let message = i18n.__('vs.stop.failure', name, JSON.stringify(err.result));
					robot.emit('ibmcloud.formatter', { response: res, message: message});
				}
				robot.logger.error(err);
			});
		});
	};
};
