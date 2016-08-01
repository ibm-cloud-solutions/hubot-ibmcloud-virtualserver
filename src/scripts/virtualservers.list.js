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
const palette = require('hubot-ibmcloud-utils').palette;
const activity = require('hubot-ibmcloud-activity-emitter');

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

const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;

const SHOW_VS = /(vs|virtual server)\s+((show|list))+/i;

module.exports = (robot) => {
	robot.on('bluemix.vs.list', (res) => {
		robot.logger.debug(`${TAG}: bluemix.vs.list Natural Language match.`);
		listVirtualServers(res);
	});
	robot.respond(SHOW_VS, {id: 'bluemix.vs.list'}, (res) => {
		robot.logger.debug(`${TAG}: bluemix.vs.list Reg Ex match.`);
		listVirtualServers(res);
	});

	function listVirtualServers(res) {
		robot.logger.debug(`${TAG}: bluemix.vs.list res.message.text=${res.message.text}.`);
		robot.logger.info(`${TAG}: Asynch call using vs library to list virtual servers.`);
		vs.getServers().then((servers) => {
			if (servers && servers.length > 0) {
				robot.logger.info(`${TAG}: Result of ${servers.length} virtual servers.`);
				const attachments = servers.map((server) => {
					const ips = server.addresses.private.reduce((list, ip) => {
						if (list) {
							list += ', ';
						}
						// console.log(ip);
						list += ip.addr;
						return list;
					}, '');

					const attachment = {
						title: server.name,
						color: palette[server.status.toLowerCase()] || palette.normal
					};
					attachment.fields = [
						{title: 'requested state', value: server.status.toLowerCase(), short: true},
						{title: 'IPs', value: ips}
					];
					return attachment;
				});

				var vsNames = servers.map(function(server){
					return server.name;
				});
				nlcconfig.updateGlobalParameterValues('IBMcloudVirtualservers_vsname', vsNames);

				// Emit the app status as an attachment
				robot.emit('ibmcloud.formatter', {
					response: res,
					attachments
				});
			}
			else {
				robot.logger.info(`${TAG}: No virtual servers found to list.`);
				robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('vs.not.found')});
			}
			activity.emitBotActivity(robot, res, {activity_id: 'activity.virtualserver.list'});
		}, (err) => {
			robot.emit('ibmcloud.formatter', { response: res, message: i18n.__('vs.list.failure')});
			robot.logger.error(`${TAG}: An error occurred listing virtual servers.`);
			robot.logger.error(err);
		});
	};
};
