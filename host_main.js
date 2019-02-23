/**
 * @author Landmaster
 */

const getWS = require('./get_ws');
const MessageTypes = require('./message_types');
const ViewManager = require('./view_manager');
const NapsterUtils = require("./napster_utils");
const Promise = require('bluebird');
const ManualResolvePromise = require('./manual_resolve_promise');

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

let currentSong = null;

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
		case MessageTypes.NEXT_SONG:
			//console.log(obj.trackId);
			if (obj.trackId) {
				napsterPromise.then(() => {
					Napster.player.play(obj.trackId);
					currentSong = obj.trackId;
					window.addEventListener('message', event => {
						if (event.data.data.code === 'PlayComplete' && currentSong !== null) {
							currentSong = null;
							ws.send(JSON.stringify({type: MessageTypes.NEXT_SONG}));
						}
					});
				});
			} else {
				currentSong = null;
			}
			break;
	}
});

let napsterPromise = new ManualResolvePromise();
Napster.player.on('ready', e => {
	//console.log('Ready!');
	let params = NapsterUtils.getParameters();
	if (params.accessToken) {
		Napster.member.set(params);
	}
	napsterPromise.resolve();
	//console.log(params);
});
