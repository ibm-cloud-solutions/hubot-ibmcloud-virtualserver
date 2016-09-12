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

describe('Interacting with Virtual Servers via Natural Language -', function() {
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

			let res = { message: {text: 'help virtual server', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.help', res, {});
			return p;
		});
	});

	context('user calls `virtual server list`', function() {
		it('should send a slack event with a list of virtual servers', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].attachments.length).to.eql(2);
				expect(events[0].attachments[0].title).to.eql('new-server-test');
				expect(events[0].attachments[1].title).to.eql('new-server-test2');
			});

			let res = { message: {text: 'list my virtual servers', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.list', res, {});
			return p;
		});
	});

	context('user calls `virtual server start`', function() {
		it('should respond with succesful virtual server start', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.start.in.progress', 'new-server-test2'));
				expect(events[1].message).to.be.eql(i18n.__('vs.start.success', 'new-server-test2'));
			});

			let res = { message: {text: 'Start my virtual server new-server-test2', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.start', res, {vsname: 'new-server-test2'});
			return p;
		});

		it('should fail to start virtual server due to missing vsname parameter ', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('cognitive.parse.problem.start'));
			});

			let res = { message: {text: 'start virtual server', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.start', res, {});
			return p;
		});
	});

	context('user calls `virtual server stop`', function() {
		let replyFn = function(msg){
			if (msg.indexOf('Are you sure that you want to stop') >= 0) {
				return room.user.say('mimiron', 'yes');
			}
		};

		it('should respond with successful virtual server stop', function() {
			let p = portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[1].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.stop.in.progress', 'new-server-test'));
				expect(events[1].message).to.be.eql(i18n.__('vs.stop.success', 'new-server-test'));
			});

			let res = { message: {text: 'Stop virtual server new-server-test', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.vs.stop', res, {vsname: 'new-server-test'});
			return p;
		});

		it('should fail to stop virtual server due to missing vsname parameter ', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('cognitive.parse.problem.stop'));
			});

			let res = { message: {text: 'stop virtual server', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.stop', res, {});
			return p;
		});
	});

	context('user calls `virtual server destroy`', function() {
		let replyFn = function(msg){
			if (msg.indexOf('Are you sure that you want to destroy') >= 0) {
				return room.user.say('mimiron', 'yes');
			}
		};

		it('should respond with successful virtual server destroy', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.destroy.success', 'new-server-test'));
			});

			let res = { message: {text: 'Destroy virtual server new-server-test', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.vs.destroy', res, {vsname: 'new-server-test'});
			return p;
		});

		it('should fail to destroy virtual server due to missing vsname parameter ', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('cognitive.parse.problem.destroy'));
			});

			let res = { message: {text: 'destroy virtual server', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.destroy', res, {});
			return p;
		});
	});

	context('user calls `virtual server reboot`', function() {
		let replyFn = function(msg){
			if (msg.indexOf('Are you sure that you want to reboot') >= 0) {
				return room.user.say('mimiron', 'yes');
			}
		};

		it('should respond with successful virtual server reboot', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('vs.reboot.success', 'new-server-test'));
			});

			let res = { message: {text: 'Reboot virtual server new-server-test', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.vs.reboot', res, {vsname: 'new-server-test'});
			return p;
		});

		it('should fail to reboot virtual server due to missing vsname parameter ', function() {
			let p = portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.be.eql(i18n.__('cognitive.parse.problem.reboot'));
			});

			let res = { message: {text: 'reboot virtual server', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.reboot', res, {});
			return p;
		});
	});

	context('verify entity functions', function() {
		it('should retrieve set of virtual server names', function(done) {
			const entities = require('../src/lib/virtualservers.entities');
			let res = { message: {text: '', user: {id: 'mimiron'}}, response: room };
			entities.getVirtualServerNames(room.robot, res, 'vsname', {}).then(function(vsNames) {
				expect(vsNames.length).to.eql(2);
				done();
			}).catch(function(error) {
				done(error);
			});
		});
	});
});
