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

	context('user calls `virtual server list`', function() {
		it('should send a slack event with a list of virtual servers', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.attachments && event.attachments.length >= 1){
					expect(event.attachments.length).to.eql(2);
					expect(event.attachments[0].title).to.eql('new-server-test');
					done();
				}
			});

			var res = { message: {text: 'list my virtual servers', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.list', res, {});
		});
	});

	context('user calls `virtual server start`', function() {
		it('should respond with the cannot find the virtual server', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message === i18n.__('vs.start.in.progress', 'unknownServer')) {
					return;
				}
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('vs.name.not.found', 'unknownServer'));
				done();
			});

			var res = { message: {text: 'Start virtual server unknownServer', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.start', res, {vsname: 'unknownServer'});
		});

		it('should respond with succesful virtual server start', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message === i18n.__('vs.start.in.progress', 'new-server-test2')) {
					return;
				}
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('vs.start.success', 'new-server-test2'));
				done();
			});

			var res = { message: {text: 'Start my virtual server new-server-test2', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.start', res, {vsname: 'new-server-test2'});
		});

		it('should fail to start virtual server due to missing vsname parameter ', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('cognitive.parse.problem.start'));
					done();
				}
			});

			var res = { message: {text: 'start virtual server', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.start', res, {});
		});
	});

	context('user calls `virtual server stop`', function() {
		var replyFn = function(msg){
			if (msg.indexOf('Are you sure that you want to stop') >= 0) {
				return room.user.say('mimiron', 'yes');
			}
		};

		it('should respond with the cannot find the virtual server', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message === i18n.__('vs.stop.in.progress', 'unknownServer')) {
					return;
				}
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('vs.name.not.found', 'unknownServer'));
				done();
			});

			var res = { message: {text: 'Stop virtual server unknownServer', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.vs.stop', res, {vsname: 'unknownServer'});
		});

		it('should respond with successful virtual server stop', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message === i18n.__('vs.stop.in.progress', 'new-server-test')) {
					return;
				}
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('vs.stop.success', 'new-server-test'));
				done();
			});

			var res = { message: {text: 'Stop virtual server new-server-test', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.vs.stop', res, {vsname: 'new-server-test'});
		});

		it('should fail to stop virtual server due to missing vsname parameter ', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('cognitive.parse.problem.stop'));
					done();
				}
			});

			var res = { message: {text: 'stop virtual server', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.stop', res, {});
		});
	});

	context('user calls `virtual server destroy`', function() {
		var replyFn = function(msg){
			if (msg.indexOf('Are you sure that you want to destroy') >= 0) {
				return room.user.say('mimiron', 'yes');
			}
		};

		it('should respond with the cannot find the virtual server', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('vs.name.not.found', 'unknownServer'));
				done();
			});

			var res = { message: {text: 'Destroy virtual server unknownServer', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.vs.destroy', res, {vsname: 'unknownServer'});
		});

		it('should respond with successful virtual server destroy', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('vs.destroy.success', 'new-server-test'));
				done();
			});

			var res = { message: {text: 'Destroy virtual server new-server-test', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.vs.destroy', res, {vsname: 'new-server-test'});
		});

		it('should fail to destroy virtual server due to missing vsname parameter ', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('cognitive.parse.problem.destroy'));
					done();
				}
			});

			var res = { message: {text: 'destroy virtual server', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.destroy', res, {});
		});
	});

	context('user calls `virtual server reboot`', function() {
		var replyFn = function(msg){
			if (msg.indexOf('Are you sure that you want to reboot') >= 0) {
				return room.user.say('mimiron', 'yes');
			}
		};

		it('should respond with the cannot find the virtual server', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('vs.name.not.found', 'unknownServer'));
				done();
			});

			var res = { message: {text: 'Reboot virtual server unknownServer', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.vs.reboot', res, {vsname: 'unknownServer'});
		});

		it('should respond with successful virtual server reboot', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain(i18n.__('vs.reboot.success', 'new-server-test'));
				done();
			});

			var res = { message: {text: 'Reboot virtual server new-server-test', user: {id: 'mimiron'}}, response: room, reply: replyFn };
			room.robot.emit('bluemix.vs.reboot', res, {vsname: 'new-server-test'});
		});

		it('should fail to reboot virtual server due to missing vsname parameter ', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('cognitive.parse.problem.reboot'));
					done();
				}
			});

			var res = { message: {text: 'reboot virtual server', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.reboot', res, {});
		});
	});

	context('user calls `virtual server help`', function() {
		it('should respond with help', function(done) {
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.message) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.contain(i18n.__('help.vs.start'));
					expect(event.message).to.contain(i18n.__('help.vs.stop'));
					expect(event.message).to.contain(i18n.__('help.vs.destroy'));
					expect(event.message).to.contain(i18n.__('help.vs.reboot'));
					expect(event.message).to.contain(i18n.__('help.vs.destroy'));
					done();
				}
			});

			var res = { message: {text: 'help virtual server', user: {id: 'mimiron'}}, response: room };
			room.robot.emit('bluemix.vs.help', res, {});
		});
	});
});
