/**
 * @author Landmaster
 */

const getWS = require('./get_ws');
const MessageTypes = require('./message_types');
const ViewManager = require('./view_manager');
const Promise = require('bluebird');

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
		let parsedCode = parseInt(joinCode.value, 10);
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
let searchResults = document.getElementById('search_results');
searchBar.addEventListener("keypress", (e) => {
	if (e.keyCode === 13 /* enter */) {
		e.preventDefault();
		Napster.api.get(true, '/search?query='+encodeURIComponent(searchBar.value)+'&type=track', (data) => {
			//console.log(data.search.data.tracks);
			searchResults.innerHTML = '';
			for (let track of data.search.data.tracks) {
				let trackCont = document.createElement('div');
				trackCont.classList.add('track_container');
				trackCont.dataset.trackId = track.id;
				
				let trackNameSpan = document.createElement('span');
				trackNameSpan.classList.add('track_name');
				trackNameSpan.textContent = track.name;
				trackCont.appendChild(trackNameSpan);
				
				trackCont.appendChild(document.createTextNode(' by '));
				
				let artistNameSpan = document.createElement('span');
				artistNameSpan.classList.add('artist_name');
				artistNameSpan.textContent = track.artistName;
				trackCont.appendChild(artistNameSpan);
				
				trackCont.addEventListener('click', (e) => {
					ws.send(JSON.stringify({type: MessageTypes.SONG_REQUEST, trackId: trackCont.dataset.trackId}));
				});
				
				searchResults.appendChild(trackCont);
			}
		});
	}
});
