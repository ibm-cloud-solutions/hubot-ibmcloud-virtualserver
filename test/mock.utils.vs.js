/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const path = require('path');
const nock = require('nock');
nock.disableNetConnect();
nock.enableNetConnect('localhost');

const vs_endpoint = 'http://vstest';

module.exports = {

	setupMockery: function() {
		let vsScope = nock(vs_endpoint)
			.persist();

		vsScope.post('/v3/auth/tokens')
			.reply(201, require(path.resolve(__dirname, 'resources/virtualserver', 'auth.json')));
		vsScope.get('/v2.1/a6944d763bf64ee6a275f1263fae0352/servers/detail')
			.reply(201, require(path.resolve(__dirname, 'resources/virtualserver', 'server.json')));
		vsScope.post('/v2.1/a6944d763bf64ee6a275f1263fae0352/servers/9cbefc35-d372-40c5-88e2-9fda1b6ea12c/action')
			.reply(202);
		vsScope.post('/v2.1/a6944d763bf64ee6a275f1263fae0352/servers/7cbefc35-d372-40c5-88e2-7fda1b6ea32c/action')
			.reply(202);
		vsScope.delete('/v2.1/a6944d763bf64ee6a275f1263fae0352/servers/9cbefc35-d372-40c5-88e2-9fda1b6ea12c')
			.reply(204);

	}
};
