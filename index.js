/**
 * @author Landmaster
 */

const express = require('express');
const WebSocket = require('ws');
const app = express();

app.use('/build', express.static('build'));
app.get('/', (req,res) => {
	res.sendFile(__dirname+'/index.html');
});
app.get('/host', (req,res) => {
	res.sendFile(__dirname+'/host.html');
});

const httpServer = app.listen(8000);
const wss = new WebSocket.Server({server: httpServer});

wss.on('connection', (ws, req) => {
	console.log('Connected');
});
