/**
 * @author Landmaster
 */

const getWS = require('./get_ws');
const MessageTypes = require('./message_types');

const ws = new WebSocket(getWS('/'));

let generateCodeBtn = document.getElementById('generate_code');
generateCodeBtn.addEventListener('click', () => {
	ws.send(JSON.stringify({type: MessageTypes.GENERATE_CODE}));
});
ws.addEventListener('message', (event) => {
	let obj = JSON.parse(event.data);
	//console.log('Teehee!');
	switch (obj.type) {
		case MessageTypes.FOUND_CODE:
			console.log(obj.code);
	}
});
