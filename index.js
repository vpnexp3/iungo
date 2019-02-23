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
		clientResponse.redirect(clientRequest.protocol+'://'+clientRequest.hostname + ':' + 8000 + '/host_app?' + querystring.stringify({
			accessToken: body.access_token,
			refreshToken: body.refresh_token
		}));
	});
});
app.get('/', (req, res) => {
	res.sendFile(__dirname+'/index.html');
});
app.get('/host_app', (req,res) => {
	res.sendFile(__dirname+'/host.html');
});

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
			userToCode.set(ws, codeCounter);
			break;
		}
	}
	return codeCounter;
}

let currentSong = null;
/**
 *
 * @type {Map<string, Set<WebSocket>>}
 */
let nextSongEntries = new Map();

/**
 *
 * @type {Map<WebSocket, string>}
 */
let wsToSong = new Map();

wss.on('connection', (ws, req) => {
	ws.on('message', data => {
		let obj = JSON.parse(data);
		switch (obj.type) {
			case MessageTypes.GENERATE_CODE:
				let code = genCode(ws);
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
								if (!nextSongEntries.has(obj.trackId)) {
									nextSongEntries.set(obj.trackId, new Set());
								}
								nextSongEntries.get(obj.trackId).add(ws);
								
								if (wsToSong.has(ws)) { // delete previous
									nextSongEntries.get(wsToSong.get(ws)).delete(ws);
								}
								wsToSong.set(ws, obj.trackId);
								//console.log(obj.trackId);
								
								//console.log('Queueing '+obj.trackId);
								
								if (currentSong === null) {
									currentSong = obj.trackId;
									
									for (let endpoint of (nextSongEntries.get(currentSong)||[])) {
										wsToSong.delete(endpoint);
									}
									nextSongEntries.delete(currentSong);
									// grab host
									users[userToCode.get(ws)][Symbol.iterator]().next().value.send(JSON.stringify({type: MessageTypes.NEXT_SONG, trackId: currentSong}));
								}
							}
						});
					}
				});
				break;
			case MessageTypes.NEXT_SONG:
				let curMax = 0;
				let curMaxSong = null;
				for (let songID of nextSongEntries.keys()) {
					if (curMax < nextSongEntries.get(songID).size) {
						curMax = nextSongEntries.get(songID).size;
						curMaxSong = songID;
					}
				}
				currentSong = curMaxSong;
				if (currentSong) {
					for (let endpoint of (nextSongEntries.get(currentSong)||[])) {
						wsToSong.delete(endpoint);
					}
					nextSongEntries.delete(currentSong);
				}
				ws.send(JSON.stringify({type: MessageTypes.NEXT_SONG, trackId: currentSong}));
				break;
		}
	});
});

