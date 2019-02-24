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
const mustacheExpress = require('mustache-express');
const nocache = require('nocache');

const app = express();

let port = process.env.PORT || 8000;

app.engine('html', mustacheExpress());
app.set('views', __dirname + '/templates');
app.set('view engine', 'html');

app.use(nocache());
app.use('/build', express.static('build'));
app.use('/css', express.static('css'));
app.use('/images', express.static('images'));
app.get('/host', (req,res) => {
	let path = 'https://api.rhapsody.com/oauth/authorize?' + querystring.stringify({
		response_type: 'code',
		client_id: 'ZmZjNTMwOTEtYmQ1MC00MGY0LThhNmYtMmQzNmEwNGZhMzIw',
		redirect_uri: req.protocol+'://'+req.hostname + ':' + port + '/authorize'
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
			redirect_uri: clientRequest.protocol+'://'+clientRequest.hostname + ':' + port + '/authorize',
			grant_type: 'authorization_code'
		}
	}, (error, response, body) => {
		//console.log(body);
		body = JSON.parse(body);
		clientResponse.redirect(clientRequest.protocol+'://'+clientRequest.hostname + ':' + port + '?' + querystring.stringify({
			accessToken: body.access_token,
			refreshToken: body.refresh_token
		}));
	});
});
app.get('/', (req, res) => {
	let ua = req.get('User-Agent').toLowerCase();
	let isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series([46])0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br([ev])w|bumb|bw-([nu])|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do([cp])o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly([-_])|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-([mpt])|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c([- _agpst])|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac([ -\/])|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja([tv])a|jbro|jemu|jigs|kddi|keji|kgt([ \/])|klon|kpt |kwc-|kyo([ck])|le(no|xi)|lg( g|\/([klu])|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t([- ov])|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30([02])|n50([025])|n7(0([01])|10)|ne(([cm])-|on|tf|wf|wg|wt)|nok([6i])|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan([adt])|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c([-01])|47|mc|nd|ri)|sgh-|shar|sie([-m])|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel([im])|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c([- ])|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(ua.substr(0,4));
	res.render('index', {isMobile: isMobile});
});

let codeCounter = 0;
const users = new Array(100000);
const userToCode = new Map();

const httpServer = app.listen(port);
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
	TimSort.sort(obj.nextSongs, (A,B) => B[1] - A[1]); // needs to be stable
	
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

