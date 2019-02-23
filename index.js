/**
 * @author Landmaster
 */

const express = require('express');
const WebSocket = require('ws');
const MessageTypes = require('./message_types');
const querystring = require("querystring");
const request = require('request');
const https = require('https');
const Promise = require('bluebird');
const TimSort = require('timsort');

const app = express();

app.use('/build', express.static('build'));
app.get('/host', (req,res) => {
	let path = 'https://api.rhapsody.com/oauth/authorize?' + querystring.stringify({
		response_type: 'code',
		client_id: 'ZmZjNTMwOTEtYmQ1MC00MGY0LThhNmYtMmQzNmEwNGZhMzIw',
		redirect_uri: req.protocol+'://'+req.hostname + ':' + 8000 + '/authorize'
	});
	res.redirect(path);
});
app.get('/authorize', (clientRequest, clientResponse) => {
	//console.log(clientRequest.query.code);
	request.post({
		url: 'https://api.rhapsody.com/oauth/access_token',
		form: {
			client_id: 'ZmZjNTMwOTEtYmQ1MC00MGY0LThhNmYtMmQzNmEwNGZhMzIw',
			client_secret: process.env.RHAPSODY_SECRET,
			response_type: 'code',
			code: clientRequest.query.code,
			redirect_uri: clientRequest.protocol+'://'+clientRequest.hostname + ':' + 8000 + '/authorize',
			grant_type: 'authorization_code'
		}
	}, (error, response, body) => {
		//console.log(body);
		body = JSON.parse(body);
		clientResponse.redirect(clientRequest.protocol+'://'+clientRequest.hostname + ':' + 8000 + '?' + querystring.stringify({
			accessToken: body.access_token,
			refreshToken: body.refresh_token
		}));
	});
});
app.get('/', (req, res) => {
	res.sendFile(__dirname+'/index.html');
});
<<<<<<< HEAD
=======
app.get('/host_app', (req,res) => {
	res.sendFile(__dirname+'/host.html');
});
app.get('/indexStyle.css', (req, res) => {
	res.sendFile(__dirname+'/indexStyle.css');
})
app.use('/images', express.static('images'));
<<<<<<< HEAD
>>>>>>> Add content files
=======
>>>>>>> Add content files

let codeCounter = 0;
const users = new Array(100000);
const userToCode = new Map();

const httpServer = app.listen(8000);
const wss = new WebSocket.Server({server: httpServer});

function genCode(ws) {
	for ( ; ; codeCounter = (codeCounter+1)%100000) {
		//console.log(codeCounter);
		if (users[codeCounter] === undefined) {
			users[codeCounter] = new Set([ws]);
			users[codeCounter].currentSong = null;
			users[codeCounter].nextSongEntries = new Map();
			users[codeCounter].wsToSong = new Map();
			
			userToCode.set(ws, codeCounter);
			break;
		}
	}
	return codeCounter;
}

function sendTrendingUpdate(code) {
	let obj = {type: MessageTypes.UPDATE_TRENDING};
	obj.currentSong = users[code].currentSong;
	obj.nextSongs = [];
	for (let [songID, wsSet] of users[code].nextSongEntries) {
		obj.nextSongs.push([songID, wsSet.size]);
	}
	TimSort.sort(obj.nextSongs, (A,B) => B[1] - A[1]);
	
	let stringified = JSON.stringify(obj);
	for (let endpoint of users[code]) {
		endpoint.send(stringified);
	}
}

wss.on('connection', (ws, req) => {
	ws.on('message', data => {
		let code = userToCode.get(ws);
		let obj = JSON.parse(data);
		switch (obj.type) {
			case MessageTypes.GENERATE_CODE:
				code = genCode(ws);
				ws.send(JSON.stringify({type: MessageTypes.FOUND_CODE, code: code}));
				break;
			case MessageTypes.JOIN:
				if (typeof obj.code === 'number') {
					if (users[obj.code] instanceof Set) {
						users[obj.code].add(ws);
						userToCode.set(ws, obj.code);
						ws.send(JSON.stringify({type: MessageTypes.CONFIRM_JOIN}));
					} else {
						ws.send(JSON.stringify({type: MessageTypes.DENY_JOIN, message: 'No such code '+obj.code+'!'}));
					}
				}
				break;
			case MessageTypes.SONG_REQUEST:
				https.get('https://api.napster.com/v2.2/tracks/'+encodeURIComponent(obj.trackId)+'?'+querystring.stringify({apikey: 'ZmZjNTMwOTEtYmQ1MC00MGY0LThhNmYtMmQzNmEwNGZhMzIw'}), res => {
					//console.log(res.statusCode);
					if (res.statusCode === 200) {
						res.setEncoding('utf8');
						let rawData = '';
						res.on('data', (chunk) => { rawData += chunk; });
						res.on('end', () => {
							let parsed = JSON.parse(rawData);
							if (parsed.tracks.length >= 1) {
								if (!users[code].nextSongEntries.has(obj.trackId)) {
									users[code].nextSongEntries.set(obj.trackId, new Set());
								}
								users[code].nextSongEntries.get(obj.trackId).add(ws);
								
								if (users[code].wsToSong.has(ws)) { // delete previous
									users[code].nextSongEntries.get(users[code].wsToSong.get(ws)).delete(ws);
								}
								users[code].wsToSong.set(ws, obj.trackId);
								//console.log(obj.trackId);
								
								//console.log('Queueing '+obj.trackId);
								
								if (users[code].currentSong === null) {
									users[code].currentSong = {trackId: obj.trackId, trackName: parsed.tracks[0].name, trackArtist: parsed.tracks[0].artistName};
									
									for (let endpoint of (users[code].nextSongEntries.get(users[code].currentSong.trackId)||[])) {
										users[code].wsToSong.delete(endpoint);
									}
									users[code].nextSongEntries.delete(users[code].currentSong.trackId);
									// grab host
									users[code][Symbol.iterator]().next().value.send(
										JSON.stringify({
											type: MessageTypes.NEXT_SONG,
											trackId: users[code].currentSong.trackId,
											trackName: users[code].currentSong.trackName,
											trackArtist: users[code].currentSong.trackArtist
										}));
								}
								
								sendTrendingUpdate(code);
							}
						});
					}
				});
				break;
			case MessageTypes.NEXT_SONG:
				let curMax = 0;
				let curMaxSong = null;
				for (let song of users[code].nextSongEntries.keys()) {
					if (curMax < users[code].nextSongEntries.get(song).size) {
						curMax = users[code].nextSongEntries.get(song).size;
						curMaxSong = song;
					}
				}
				https.get('https://api.napster.com/v2.2/tracks/'+encodeURIComponent(curMaxSong)+'?'+querystring.stringify({apikey: 'ZmZjNTMwOTEtYmQ1MC00MGY0LThhNmYtMmQzNmEwNGZhMzIw'}), res => {
					//console.log(res.statusCode);
					if (res.statusCode === 200) {
						res.setEncoding('utf8');
						let rawData = '';
						res.on('data', (chunk) => { rawData += chunk; });
						res.on('end', () => {
							let parsed = JSON.parse(rawData);
							if (parsed.tracks.length >= 1) {
								users[code].currentSong = {trackId: curMaxSong, trackName: parsed.tracks[0].name, trackArtist: parsed.tracks[0].artistName};
							}
							if (users[code].currentSong) {
								for (let endpoint of (users[code].nextSongEntries.get(users[code].currentSong.trackId)||[])) {
									users[code].wsToSong.delete(endpoint);
								}
								users[code].nextSongEntries.delete(users[code].currentSong.trackId);
							}
							ws.send(JSON.stringify({
								type: MessageTypes.NEXT_SONG,
								trackId: users[code].currentSong.trackId,
								trackName: users[code].currentSong.trackName,
								trackArtist: users[code].currentSong.trackArtist
							}));
							sendTrendingUpdate(code);
						});
					}
				});
				break;
		}
	});
});
