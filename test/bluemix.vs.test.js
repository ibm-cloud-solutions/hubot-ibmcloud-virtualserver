/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const Helper = require('hubot-test-helper');
const helper = new Helper('../src/scripts');
const expect = require('chai').expect;
const mockUtils = require('./mock.utils.vs.js');
const sprinkles = require('mocha-sprinkles');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
var i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../src/messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

// Length of time to wait for a message
const timeout = 10000;

// Return a promise that will be resolved in the specified # of ms.
function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(function(){
			resolve();
		}, ms);
	});
}

function waitForMessageQueue(room, len){
	return sprinkles.eventually({
		timeout: timeout
	}, function() {
		if (room.messages.length < len) {
			throw new Error('too soon');
		}
	}).then(() => false).catch(() => true).then((success) => {
		// Great.  Move on to tests
		expect(room.messages.length).to.eql(len);
	});
}

// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Interacting with Bluemix via Slack', function() {
	let room;

	before(function() {
		mockUtils.setupMockery();
	});

	beforeEach(function() {
		room = helper.createRoom();
		// Force all emits into a reply.
		room.robot.on('ibmcloud.formatter', function(event) {
			if (event.message) {
				event.response.reply(event.message);
			}
			else {
				event.response.send({attachments: event.attachments});
			}
		});
	});

	afterEach(function() {
		room.destroy();
	});

	context('user calls `virtual server show`', function() {
		it('should send a slack event with a list of virtual servers', function(done) {
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.attachments.length).to.eql(2);
				expect(event.attachments[0].title).to.eql('new-server-test');
				expect(event.attachments[1].title).to.eql('new-server-test2');
				done();
			});
			room.user.say('mimiron', '@hubot virtual server show').then();
		});
	});

	context('user calls `virtual server start`', function() {
		it('should respond with started', function() {
			return room.user.say('mimiron', '@hubot virtual server start new-server-test2').then(() => {
				return delay(100);
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.start.success', 'new-server-test2')]);
			});
		});

		it('should respond with not found', function() {
			return room.user.say('mimiron', '@hubot virtual server start new-server-test1').then(() => {
				return delay(100);
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.name.not.found', 'new-server-test1')]);
			});
		});
	});

	context('user calls ` virtual server stop`', function() {
		it('should respond with stopped', function(done) {
			return room.user.say('mimiron', '@hubot virtual server stop new-server-test').then(() => {
				return delay(100);
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.stop.confirm', 'new-server-test')]);
				return room.user.say('mimiron', '@hubot yes');
			}).then(() => {
				setTimeout(() => {
					let response = room.messages[room.messages.length - 2];
					expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.stop.in.progress', 'new-server-test')]);
					response = room.messages[room.messages.length - 1];
					expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.stop.success', 'new-server-test')]);
					done();
				}, 500);
			});
		});

		it('should respond with not found', function() {
			return room.user.say('mimiron', '@hubot virtual server stop new-server-test1').then(() => {
				return delay(100);
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.stop.confirm', 'new-server-test1')]);
				return room.user.say('mimiron', '@hubot yes');
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.stop.in.progress', 'new-server-test1')]);
			});
		});
	});

	context('user calls `virtual server reboot`', function() {
		it('should respond with rebooted', function() {
			return room.user.say('mimiron', '@hubot virtual server reboot new-server-test').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.reboot.confirm', 'new-server-test')]);
				return room.user.say('mimiron', '@hubot yes');
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql([ 'mimiron', '@hubot yes' ]);
			});
		});

		it('should respond with safe', function() {
			return room.user.say('mimiron', '@hubot virtual server reboot new-server-test').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.reboot.confirm', 'new-server-test')]);
				return room.user.say('mimiron', '@hubot no');
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('general.safe.this.time', 'new-server-test')]);
			});
		});

		it('should respond with not found', function() {
			return room.user.say('mimiron', '@hubot virtual server reboot new-server-test-notfound').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.reboot.confirm', 'new-server-test-notfound')]);
				return room.user.say('mimiron', '@hubot yes');
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.name.not.found', 'new-server-test-notfound')]);
			});
		});
	});

	context('user calls `virtual server destroy`', function() {
		it('should respond with destroyed', function(done) {
			return room.user.say('mimiron', '@hubot virtual server destroy new-server-test').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.destroy.confirm', 'new-server-test')]);
				return room.user.say('mimiron', '@hubot yes');
			}).then(() => {
				return waitForMessageQueue(room, 4);
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.destroy.success', 'new-server-test')]);
				done();
			});
		});

		it('should respond with safe', function() {
			return room.user.say('mimiron', '@hubot virtual server destroy new-server-test').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.destroy.confirm', 'new-server-test')]);
				return room.user.say('mimiron', '@hubot no');
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('general.safe.this.time', 'new-server-test')]);
			});
		});

		it('should respond with not found', function() {
			return room.user.say('mimiron', '@hubot virtual server destroy new-server-test1').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.destroy.confirm', 'new-server-test1')]);
				return room.user.say('mimiron', '@hubot yes');
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.name.not.found', 'new-server-test1')]);
			});
		});
	});

	context('user calls `virtual server help`', function() {
		beforeEach(function() {
			return room.user.say('mimiron', '@hubot virtual server help');
		});

		it('should respond with help', function() {
			expect(room.messages.length).to.eql(2);
			let help = 'hubot virtual server delete|destroy|remove [virtualserver] - ' + i18n.__('help.vs.destroy') + '\n'
				+ 'hubot virtual server show|list - ' + i18n.__('help.vs.show') + '\n'
				+ 'hubot virtual server reboot [virtualserver] - ' + i18n.__('help.vs.reboot') + '\n'
				+ 'hubot virtual server start [virtualserver] - ' + i18n.__('help.vs.start') + '\n'
				+ 'hubot virtual server stop [virtualserver] - ' + i18n.__('help.vs.stop') + '\n';
			expect(room.messages[1]).to.eql(['hubot', '@mimiron \n' + help]);
		});
	});
});
