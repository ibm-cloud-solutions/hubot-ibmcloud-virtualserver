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
const activity = require('hubot-ibmcloud-activity-emitter');
const entities = require('../lib/virtualservers.entities');

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

const START_VS = /(vs|virtual server)\s+start\s+(.*)/i;

module.exports = (robot) => {

	// Register entity handling functions
	entities.registerEntityFunctions();

	robot.on('bluemix.vs.start', (res, parameters) => {
		robot.logger.debug(`${TAG}: bluemix.vs.start Natural Language match.`);

		if (parameters && parameters.vsname) {
			const serverName = parameters.vsname;
			startVirtualServer(res, serverName);
		}
		else {
			robot.logger.error(`${TAG}: Error extracting Virtual Server Name from text=[${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.start');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}
	});
	robot.respond(START_VS, {id: 'bluemix.vs.start'}, (res) => {
		robot.logger.debug(`${TAG}: bluemix.vs.start Reg Ex match.`);
		const serverName = res.match[2];
		startVirtualServer(res, serverName);
	});

	function startVirtualServer(res, name) {
		robot.logger.debug(`${TAG}: bluemix.vs.start res.message.text=${res.message.text}.`);
		robot.logger.info(`${TAG}: Starting the virtual server ${name}`);
		let message = i18n.__('vs.start.in.progress', name);
		robot.emit('ibmcloud.formatter', { response: res, message: message});
		robot.logger.info(`${TAG}: Asynch call using vs library to start virtual server ${name}.`);
		vs.startServerByName(name).then((server) => {
			robot.logger.info(`${TAG}: Start of virtual server ${name} successful.`);
			let message = i18n.__('vs.start.success', server.name);
			robot.emit('ibmcloud.formatter', { response: res, message: message});
			activity.emitBotActivity(robot, res, { activity_id: 'activity.virtualserver.start' });
		}, (err) => {
			if (err.statusCode === 404) {
				robot.logger.error(`${TAG}: Start of virtual server ${name} failed. Server was not found.`);
				let message = i18n.__('vs.name.not.found', name);
				robot.emit('ibmcloud.formatter', { response: res, message: message});
			}
			else {
				robot.logger.error(`${TAG}: Start of virtual server ${name} failed. Error: ${err.result}`);
				let message = i18n.__('vs.start.failure', name, JSON.stringify(err.result));
				robot.emit('ibmcloud.formatter', { response: res, message: message});
			}
			robot.logger.error(err);
		});
	};
};
