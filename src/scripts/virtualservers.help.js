// Description:
//	Listens for commands to initiate actions against Bluemix for virtual server
//
// Configuration:
//	 HUBOT_VIRTUAL_SERVER_REGION Bluemix Virtual Server region, OS_REGION_NAME in rcfile
//	 HUBOT_VIRTUAL_SERVER_AUTH_URL Bluemix Virtual Server authentication url, OS_AUTH_URL in rcfile
//	 HUBOT_VIRTUAL_SERVER_DOMIAN_NAME Bluemix Virtual Server domain name, OS_USER_DOMAIN_NAME in rcfile
//
// Commands:
//   hubot virtual server(s) help - Show available commands in the virtual server category.
//
// Author:
//	chambrid
//
/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

var path = require('path');
var TAG = path.basename(__filename);

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

const VIRTUAL_SERVER_HELP = /(virtual server|virtual servers)\s+help/i;

module.exports = (robot) => {
	robot.on('bluemix.vs.help', (res) => {
		robot.logger.debug(`${TAG}: bluemix.vs.help Natural Language match.`);
		help(res);
	});
	robot.respond(VIRTUAL_SERVER_HELP, {id: 'bluemix.vs.help'}, (res) => {
		robot.logger.debug(`${TAG}: bluemix.vs.help Reg Ex match.`);
		help(res);
	});

	function help(res) {
		robot.logger.debug(`${TAG}: res.message.text=${res.message.text}.`);
		robot.logger.info(`${TAG}: Listing help virtual server...`);
		// hubot virtualserver delete|destroy|remove [virtualserver] - Deletes a virtual server.
		// hubot virtualserver list|show - Lists all of the virtual servers.
		// hubot virtualserver reboot [virtualserver] - Restarts the virtual server.
		// hubot virtualserver start [virtualserver] - Starts the virtual server.
		// hubot virtualserver stop [virtualserver] - Stops the virtual server.

		let help = robot.name + ' virtual server delete|destroy|remove [virtualserver] - ' + i18n.__('help.vs.destroy') + '\n';
		help += robot.name + ' virtual server show|list - ' + i18n.__('help.vs.show') + '\n';
		help += robot.name + ' virtual server reboot [virtualserver] - ' + i18n.__('help.vs.reboot') + '\n';
		help += robot.name + ' virtual server start [virtualserver] - ' + i18n.__('help.vs.start') + '\n';
		help += robot.name + ' virtual server stop [virtualserver] - ' + i18n.__('help.vs.stop') + '\n';
		robot.emit('ibmcloud.formatter', { response: res, message: '\n' + help});
	};
};
