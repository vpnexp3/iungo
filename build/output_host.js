(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * @author Landmaster
 */

const getWS = path => (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.hostname + (location.port ? ':'+location.port : '') + path;
module.exports = getWS;
},{}],2:[function(require,module,exports){
/**
 * @author Landmaster
 */

const getWS = require('./get_ws');
const MessageTypes = require('./message_types');
const ViewManager = require('./view_manager');
const NapsterUtils = require("./napster_utils");

ViewManager.addView('generate_view');
ViewManager.addView('code_view');

ViewManager.setView('generate_view');

//let napsterReady = false;

Napster.init({consumerKey: 'ZmZjNTMwOTEtYmQ1MC00MGY0LThhNmYtMmQzNmEwNGZhMzIw', isHTML5Compatible: true});

const ws = new WebSocket(getWS('/'));

let generateCodeBtn = document.getElementById('generate_code');
generateCodeBtn.addEventListener('click', () => {
	ws.send(JSON.stringify({type: MessageTypes.GENERATE_CODE}));
});

let codeDisps = document.getElementsByClassName('code_display');

ws.addEventListener('message', (event) => {
	let obj = JSON.parse(event.data);
	//console.log('Teehee!');
	switch (obj.type) {
		case MessageTypes.FOUND_CODE:
			for (let codeDisp of codeDisps) {
				codeDisp.textContent = obj.code;
			}
			ViewManager.setView('code_view');
			break;
	}
});

Napster.player.on('ready', e => {
	//console.log('Ready!');
	let params = NapsterUtils.getParameters();
	if (params.accessToken) {
		Napster.member.set(params);
	}
	//console.log(params);
});

},{"./get_ws":1,"./message_types":3,"./napster_utils":4,"./view_manager":5}],3:[function(require,module,exports){
/**
 * @author Landmaster
 */

module.exports = {
	GENERATE_CODE: 'generate_code',
	FOUND_CODE: 'found_code',
	JOIN: 'join',
	CONFIRM_JOIN: 'confirm_join',
	DENY_JOIN: 'deny_join'
};
},{}],4:[function(require,module,exports){
/**
 * @author Landmaster
 */

const NapsterUtils = {};

NapsterUtils.refresh = function (callback) {
	jQuery.ajax({
		url: '/reauthorize',
		method: 'GET',
		data: { refreshToken: Napster.member.refreshToken },
		success: data => {
			Napster.member.set({
				accessToken: data.access_token,
				refreshToken: data.refresh_token
			});
			if (callback) {
				callback(data);
			}
		}
	});
};

NapsterUtils.getParameters = function () {
	let query = window.location.search.substring(1);
	let parameters = {};
	if (query) {
		query.split('&').forEach(function(item) {
			let param = item.split('=');
			parameters[param[0]] = param[1];
		});
	}
	return parameters;
};

module.exports = NapsterUtils;
},{}],5:[function(require,module,exports){
/**
 * @author Landmaster
 */

/**
 *
 * @type {Map<string, Element>}
 */
const viewMap = new Map();

const ViewManager = {};
ViewManager.addView = function (viewID) {
	viewMap.set(viewID, document.getElementById(viewID));
};
ViewManager.setView = function (viewID) {
	for ([id, view] of viewMap) {
		if (id === viewID) {
			view.style.display = '';
		} else {
			view.style.display = 'none';
		}
	}
};
module.exports = ViewManager;
},{}]},{},[2]);
