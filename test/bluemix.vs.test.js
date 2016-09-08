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
const portend = require('portend');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
const i18n = new (require('i18n-2'))({
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

// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Interacting with Bluemix via Slack', function() {
	let room;

	before(function() {
		mockUtils.setupMockery();
	});

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	context('user calls `virtual server help`', function() {
		it('should respond with help', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.contain(i18n.__('help.vs.destroy'));
				expect(events[0].message).to.contain(i18n.__('help.vs.show'));
				expect(events[0].message).to.contain(i18n.__('help.vs.reboot'));
				expect(events[0].message).to.contain(i18n.__('help.vs.start'));
				expect(events[0].message).to.contain(i18n.__('help.vs.stop'));
			});

			room.user.say('mimiron', '@hubot virtual server help');
			return p;
		});
	});

	context('user calls `virtual server show`', function() {
		it('should send a slack event with a list of virtual servers', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].attachments.length).to.eql(2);
				expect(events[0].attachments[0].title).to.eql('new-server-test');
				expect(events[0].attachments[1].title).to.eql('new-server-test2');
			});

			room.user.say('mimiron', '@hubot virtual server show');
			return p;
		});
	});

	context('user calls `virtual server start`', function() {
		it('should respond with started', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.start.in.progress', 'new-server-test2'));
				expect(events[1].message).to.be.eql(i18n.__('vs.start.success', 'new-server-test2'));
			});

			room.user.say('mimiron', '@hubot virtual server start new-server-test2');
			return p;
		});

		it('should respond with not found', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.start.in.progress', 'new-server-test1'));
				expect(events[1].message).to.be.eql(i18n.__('vs.name.not.found', 'new-server-test1'));
			});

			room.user.say('mimiron', '@hubot virtual server start new-server-test1');
			return p;
		});
	});

	context('user calls ` virtual server stop`', function() {
		it('should respond with stopped', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.stop.in.progress', 'new-server-test'));
				expect(events[1].message).to.be.eql(i18n.__('vs.stop.success', 'new-server-test'));
			});

			room.user.say('mimiron', '@hubot virtual server stop new-server-test').then(() => {
				room.user.say('mimiron', '@hubot yes');
			});
			return p;
		});

		it('should respond with not found', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.stop.in.progress', 'new-server-test1'));
				expect(events[1].message).to.be.eql(i18n.__('vs.name.not.found', 'new-server-test1'));
			});

			room.user.say('mimiron', '@hubot virtual server stop new-server-test1').then(() => {
				room.user.say('mimiron', '@hubot yes');
			});
			return p;
		});
	});

	context('user calls `virtual server reboot`', function() {
		it('should respond with rebooted', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.reboot.success', 'new-server-test'));
			});

			room.user.say('mimiron', '@hubot virtual server reboot new-server-test').then(() => {
				room.user.say('mimiron', '@hubot yes');
			});
			return p;
		});

		it('should respond with safe', function() {
			room.user.say('mimiron', '@hubot virtual server reboot new-server-test').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.reboot.confirm', 'new-server-test')]);
				room.user.say('mimiron', '@hubot no').then(() => {
					let response = room.messages[room.messages.length - 1];
					expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('general.safe.this.time', 'new-server-test')]);
				});
			});
		});

		it('should respond with not found', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.name.not.found', 'new-server-test1'));
			});

			room.user.say('mimiron', '@hubot virtual server reboot new-server-test1').then(() => {
				room.user.say('mimiron', '@hubot yes');
			});
			return p;
		});
	});

	context('user calls `virtual server destroy`', function() {
		it('should respond with destroyed', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.destroy.success', 'new-server-test'));
			});

			room.user.say('mimiron', '@hubot virtual server destroy new-server-test').then(() => {
				room.user.say('mimiron', '@hubot yes');
			});
			return p;
		});

		it('should respond with safe', function() {
			room.user.say('mimiron', '@hubot virtual server destroy new-server-test').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('vs.destroy.confirm', 'new-server-test')]);
				room.user.say('mimiron', '@hubot no').then(() => {
					let response = room.messages[room.messages.length - 1];
					expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('general.safe.this.time', 'new-server-test')]);
				});
			});
		});

		it('should respond with not found', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.name.not.found', 'new-server-test1'));
			});

			room.user.say('mimiron', '@hubot virtual server destroy new-server-test1').then(() => {
				room.user.say('mimiron', '@hubot yes');
			});
			return p;
		});
	});
});
