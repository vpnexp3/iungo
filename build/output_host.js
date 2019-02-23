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

ViewManager.addView('generate_view');
ViewManager.addView('code_view');

ViewManager.setView('generate_view');

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

},{"./get_ws":1,"./message_types":3,"./view_manager":4}],3:[function(require,module,exports){
/**
 * @author Landmaster
 */

module.exports = {
	GENERATE_CODE: 'generate_code',
	FOUND_CODE: 'found_code'
};
},{}],4:[function(require,module,exports){
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
