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

Napster.init({consumerKey: 'ZmZjNTMwOTEtYmQ1MC00MGY0LThhNmYtMmQzNmEwNGZhMzIw', isHTML5Compatible: true});

const ws = new WebSocket(getWS('/'));

let generateCodeBtn = document.getElementById('generate_code');
generateCodeBtn.addEventListener('click', () => {
	ws.send(JSON.stringify({type: MessageTypes.GENERATE_CODE}));
	//Napster.player.play('Tra.5156528');
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

Napster.player.on('ready', function(e) {
	console.log('Ready!');
	let params = NapsterUtils.getParameters();
	if (params.accessToken) {
		Napster.member.set(params);
	}
	console.log(params);
});
