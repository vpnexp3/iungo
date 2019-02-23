/**
 * @author Landmaster
 */

const getWS = require('./get_ws');
const MessageTypes = require('./message_types');
const ViewManager = require('./view_manager');

ViewManager.addView('join_view');
ViewManager.setView('join_view');

console.log(getWS('/'));
const ws = new WebSocket(getWS('/'));

let joinCode = document.getElementById("join_code");
joinCode.addEventListener("keypress", (e) => {
	if (e.keyCode === 13 /* enter */) {
		e.preventDefault();
		//console.log(joinCode.value);
	}
});
