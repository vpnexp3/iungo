/**
 * @author Landmaster
 */

const getWS = require('./get_ws');
const MessageTypes = require('./message_types');
const ViewManager = require('./view_manager');
const NapsterUtils = require("./napster_utils");
const Promise = require('bluebird');
const ManualResolvePromise = require('./manual_resolve_promise');

ViewManager.addView('join_view');
ViewManager.addView('search_view');
ViewManager.addView('generate_view');
ViewManager.addView('code_view');
ViewManager.addView('hub_view');

if (!isMobile) ViewManager.linkViews('hub_vote', 'hub_view', 'search_view'); // TODO do not link if mobile

ViewManager.setView(NapsterUtils.getParameters().accessToken ? 'generate_view' : 'join_view');

Napster.init({consumerKey: 'ZmZjNTMwOTEtYmQ1MC00MGY0LThhNmYtMmQzNmEwNGZhMzIw', isHTML5Compatible: true});

//console.log(getWS('/'));
const ws = new WebSocket(getWS('/'));

let joinCode = document.getElementById("join_code");
let errorJoin = document.getElementById("error_join");

function sendCode() {
	let parsedCode = parseInt(joinCode.value, 10);
	if (!isNaN(parsedCode)) {
		ws.send(JSON.stringify({type: MessageTypes.JOIN, code: parsedCode}));
	} else {
		errorJoin.textContent = 'Invalid code';
	}
}

joinCode.addEventListener("keypress", (e) => {
	if (e.keyCode === 13 /* enter */) {
		e.preventDefault();
		sendCode();
	}
});

let joinButton = document.getElementById('join_button');
joinButton.addEventListener('click', e => sendCode());

let nowPlayingClient = document.getElementById('now_playing_client_cont');
let currentTrackClient = document.getElementById('current_track_client');
let currentArtistClient = document.getElementById('current_artist_client');
let trending = document.getElementsByClassName('trending');
//console.log(trending);

ws.addEventListener('message', event => {
	let obj = JSON.parse(event.data);
	//console.log('Teehee!');
	switch (obj.type) {
		case MessageTypes.CONFIRM_JOIN:
			ViewManager.setView('hub_view');
			break;
		case MessageTypes.DENY_JOIN:
			errorJoin.textContent = obj.message;
			break;
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
					currentSongData = {trackArtist: obj.trackArtist, trackName: obj.trackName}
				});
			} else {
				currentSong = null;
			}
			break;
		case MessageTypes.UPDATE_TRENDING:
			//console.log(obj);
			if (obj.currentSong) {
				nowPlayingClient.style.display = '';
				currentTrackClient.textContent = obj.currentSong.trackName;
				currentArtistClient.textContent = obj.currentSong.trackArtist;
			} else {
				nowPlayingClient.style.display = 'none';
			}
			let infoPromises = [];
			for (let [songID, sz] of obj.nextSongs) {
				let deferred = new ManualResolvePromise();
				infoPromises.push(deferred);
				Napster.api.get(true, '/tracks/'+encodeURIComponent(songID), (data) => {
					if (data.tracks && data.tracks.length >= 1) {
						deferred.resolve({trackId: songID, trackName: data.tracks[0].name, trackArtist: data.tracks[0].artistName, sz: sz});
					} else {
						deferred.reject();
					}
				});
			}
			Promise.all(infoPromises).then(data => {
				//console.log(data);
				for (let trendingEntry of trending) {
					trendingEntry.innerHTML = '';
					for (let entry of data) {
						if (entry.sz <= 0) continue;
						
						let trackCont = document.createElement('div');
						trackCont.classList.add('track_container');
						trackCont.dataset.trackId = entry.trackId;
						
						let trackNameSpan = document.createElement('span');
						trackNameSpan.classList.add('track_name');
						trackNameSpan.textContent = entry.trackName;
						trackCont.appendChild(trackNameSpan);
						
						trackCont.appendChild(document.createTextNode(' by '));
						
						let artistNameSpan = document.createElement('span');
						artistNameSpan.classList.add('artist_name');
						artistNameSpan.textContent = entry.trackArtist;
						trackCont.appendChild(artistNameSpan);
						
						trackCont.appendChild(document.createTextNode(': '));
						
						let numVotesSpan = document.createElement('span');
						numVotesSpan.classList.add('num_votes');
						numVotesSpan.textContent = entry.sz + ' vote(s)';
						trackCont.appendChild(numVotesSpan);
						
						if (trendingEntry.id !== 'trending_host') {
							trackCont.addEventListener('click', (e) => {
								ws.send(JSON.stringify({
									type: MessageTypes.SONG_REQUEST,
									trackId: trackCont.dataset.trackId
								}));
							});
						}
						
						trendingEntry.appendChild(trackCont);
						
						//console.log(trendingEntry);
					}
				}
			});
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

let toHostBtn = document.getElementById('to_host');
toHostBtn.addEventListener('click', () => {
	ViewManager.setView('generate_view');
	let params = NapsterUtils.getParameters();
	if (!params.accessToken) {
		location.href = '/host';
	}
});

let toJoinBtn = document.getElementById('to_join');
toHostBtn.addEventListener('click', () => {
	ViewManager.setView('join_view');
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

let generateCodeBtn = document.getElementById('generate_code');
generateCodeBtn.addEventListener('click', () => {
	ws.send(JSON.stringify({type: MessageTypes.GENERATE_CODE}));
});

let codeDisps = document.getElementsByClassName('code_display');

let nowPlayingCont = document.getElementById('now_playing_cont');
let currentTrack = document.getElementById('current_track');
let currentArtist = document.getElementById('current_artist');
let elapsedTime = document.getElementById('elapsed_time');

let currentSong = null;
let currentSongData = null;

window.addEventListener('message', event => {
	if (event.data && event.data.data && event.data.data.code === 'PlayComplete' && currentSong !== null) {
		currentSong = null;
		currentSongData = null;
		nowPlayingCont.style.display = 'none';
		ws.send(JSON.stringify({type: MessageTypes.NEXT_SONG}));
	}
	//console.log(event);
	if (event.data && event.data.type === 'playtimer') {
		let time = event.data.data.currentTime;
		nowPlayingCont.style.display = '';
		currentTrack.textContent = currentSongData.trackName;
		currentArtist.textContent = currentSongData.trackArtist;
		
		let mins = Math.floor(time / 60);
		let secs = Math.floor(time % 60).toString();
		while (secs.length < 2) {
			secs = '0'+secs;
		}
		
		elapsedTime.textContent = mins + ':' + secs;
	}
});
