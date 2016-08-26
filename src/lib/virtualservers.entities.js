/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const vs = require('../lib/vs');
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;

const NAMESPACE = 'IBMcloudVirtualservers';
const PARAM_VSNAME = 'vsname';

var functionsRegistered = false;


function buildGlobalName(parameterName) {
	return NAMESPACE + '_' + parameterName;
}
function buildGlobalFuncName(parameterName) {
	return NAMESPACE + '_func' + parameterName;
}

function registerEntityFunctions() {
	if (!functionsRegistered) {
		nlcconfig.setGlobalEntityFunction(buildGlobalFuncName(PARAM_VSNAME), getVirtualServerNames);
		functionsRegistered = true;
	}
}

function getVirtualServerNames(robot, res, parameterName, parameters) {
	return new Promise(function(resolve, reject) {
		vs.getServers().then((result) => {
			var vsNames = result.map(function(virtualserver){
				return virtualserver.name;
			});
			nlcconfig.updateGlobalParameterValues(buildGlobalName(PARAM_VSNAME), vsNames);
			resolve(vsNames);
		}).catch(function(err) {
			reject(err);
		});
	});
}

module.exports.registerEntityFunctions = registerEntityFunctions;
module.exports.getVirtualServerNames = getVirtualServerNames;
