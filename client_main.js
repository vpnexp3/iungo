/**
 * @author Landmaster
 */

const getWS = require('./get_ws');
const MessageTypes = require('./message_types');
const ViewManager = require('./view_manager');

ViewManager.addView('join_view');
ViewManager.addView('search_view');

ViewManager.setView('join_view');

Napster.init({consumerKey: 'ZmZjNTMwOTEtYmQ1MC00MGY0LThhNmYtMmQzNmEwNGZhMzIw', isHTML5Compatible: true});

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
			ViewManager.setView('search_view');
			break;
		case MessageTypes.DENY_JOIN:
			errorJoin.textContent = obj.message;
			break;
	}
});

let searchBar = document.getElementById('search');
searchBar.addEventListener("keypress", (e) => {
	if (e.keyCode === 13 /* enter */) {
		e.preventDefault();
		Napster.api.get(false, '/search?query='+encodeURIComponent(searchBar.value)+'&type=track', (data) => {
			console.log(data.search.data.tracks);
		});
	}
});
