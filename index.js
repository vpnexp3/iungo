/**
 * @author Landmaster
 */

const express = require('express');
const WebSocket = require('ws');
const MessageTypes = require('./message_types');
const querystring = require("querystring");
const request = require('request');

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
app.get('/authorize', function(clientRequest, clientResponse) {
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
	}, function(error, response, body) {
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

const httpServer = app.listen(8000);
const wss = new WebSocket.Server({server: httpServer});

function genCode(ws) {
	for ( ; ; codeCounter = (codeCounter+1)%100000) {
		//console.log(codeCounter);
		if (users[codeCounter] === undefined) {
			users[codeCounter] = new Set([ws]);
			break;
		}
	}
	return codeCounter;
}

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
						ws.send(JSON.stringify({type: MessageTypes.CONFIRM_JOIN}));
					} else {
						ws.send(JSON.stringify({type: MessageTypes.DENY_JOIN, message: 'No such code '+obj.code+'!'}));
					}
				}
				break;
		}
	});
});

