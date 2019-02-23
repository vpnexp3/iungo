/**
 * @author Landmaster
 */

const getWS = require('./get_ws');
const MessageTypes = require('./message_types');
const ViewManager = require('./view_manager');

ViewManager.addView('join_view');
ViewManager.setView('join_view');

//console.log(getWS('/'));
const ws = new WebSocket(getWS('/'));

let joinCode = document.getElementById("join_code");
let errorJoin = document.getElementById("error_join");

joinCode.addEventListener("keypress", (e) => {
	if (e.keyCode === 13 /* enter */) {
		e.preventDefault();
		let parsedCode = parseInt(joinCode.value);
		if (!isNaN(parsedCode)) {
			ws.send(JSON.stringify({type: MessageTypes.JOIN, code: parsedCode}));
		} else {
			errorJoin.textContent = 'Invalid code';
		}
	}
});

ws.addEventListener('message', event => {
	let obj = JSON.parse(event.data);
	//console.log('Teehee!');
	switch (obj.type) {
		case MessageTypes.CONFIRM_JOIN:
			console.log('Illuminati confirmed');
			break;
		case MessageTypes.DENY_JOIN:
			errorJoin.textContent = obj.message;
			break;
	}
});
