/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';
const pkgcloud = require('pkgcloud');

var env = {
	username: process.env.HUBOT_BLUEMIX_USER,
	password: process.env.HUBOT_BLUEMIX_PASSWORD,
	provider: process.env.HUBOT_VIRTUAL_SERVER_PROVIDER || 'openstack',
	region: process.env.HUBOT_VIRTUAL_SERVER_REGION,
	authUrl: process.env.HUBOT_VIRTUAL_SERVER_AUTH_URL,
	keystoneAuthVersion: process.env.HUBOT_VIRTUAL_SERVER_AUTH_VERSION || 'v3',
	domainName: process.env.HUBOT_VIRTUAL_SERVER_DOMAIN_NAME
};

// gracefully output message and exit if any required config is undefined
if (!env.username) {
	console.error('HUBOT_BLUEMIX_USER not set');
	process.exit(1);
}

if (!env.password) {
	console.error('HUBOT_BLUEMIX_PASSWORD not set');
	process.exit(1);
}

if (env.authUrl) {
	env.authUrl = env.authUrl.match(/(http:\/\/|https:\/\/)?([^\/]*)/i)[0];
}

const client = pkgcloud.compute.createClient({
	provider: env.provider,
	username: env.username,
	password: env.password,
	region: env.region,
	authUrl: env.authUrl,
	keystoneAuthVersion: env.keystoneAuthVersion,
	domainName: env.domainName
});

function getServers() {
	return new Promise((resolve, reject) => {
		client.getServers((err, server) => {
			if (err)
				reject(err);
			else
        resolve(server);
		});
	});
}

function startServerByName(serverName) {
	return new Promise((resolve, reject) => {
		this.getServers().then((servers) => {
			let found = false;
			for (let i = 0; i < servers.length; i++) {
				if (servers[i].name === serverName) {
					found = true;
					client.startServer(servers[i], (err) => {
						if (err)
							reject(err);
						else
              resolve(servers[i]);
					});
				}
			}
			if (!found)
				reject({statusCode: 404});
		}, (err) => {
			reject(err);
		});
	});
}

function stopServerByName(serverName) {
	return new Promise((resolve, reject) => {
		this.getServers().then((servers) => {
			let found = false;
			for (let i = 0; i < servers.length; i++) {
				if (servers[i].name === serverName) {
					found = true;
					client.stopServer(servers[i], (err) => {
						if (err)
							reject(err);
						else
              resolve(servers[i]);
					});
				}
			}
			if (!found)
				reject({statusCode: 404});
		}, (err) => {
			reject(err);
		});
	});
}

function rebootServerByName(serverName) {
	return new Promise((resolve, reject) => {
		this.getServers().then((servers) => {
			let found = false;
			for (let i = 0; i < servers.length; i++) {
				if (servers[i].name === serverName) {
					found = true;
					client.rebootServer(servers[i], (err, body, res) => {
						if (err)
							reject(err);
						else
              resolve(servers[i]);
					});
				}
			}
			if (!found)
				reject({statusCode: 404});
		}, (err) => {
			reject(err);
		});
	});
}

function destroyServerByName(serverName) {
	return new Promise((resolve, reject) => {
		this.getServers().then((servers) => {
			let found = false;
			for (let i = 0; i < servers.length; i++) {
				if (servers[i].name === serverName) {
					found = true;
					client.destroyServer(servers[i], (err, serverId) => {
						if (err)
							reject(err);
						else
              resolve(servers[i]);
					});
				}
			}
			if (!found)
				reject({statusCode: 404});
		}, (err) => {
			reject(err);
		});
	});
}

module.exports = {
	getServers: getServers,
	startServerByName: startServerByName,
	stopServerByName: stopServerByName,
	rebootServerByName: rebootServerByName,
	destroyServerByName: destroyServerByName
};
