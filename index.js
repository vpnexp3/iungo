/**
 * @author Landmaster
 */

const express = require('express');
const WebSocket = require('ws');
const MessageTypes = require('./message_types');

const app = express();

app.use('/build', express.static('build'));
app.get('/', (req,res) => {
	res.sendFile(__dirname+'/index.html');
});
app.get('/host', (req,res) => {
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
			users[codeCounter] = [ws];
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
		}
	});
});

