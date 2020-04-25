const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {
	generateMessage,
	generateLocationMessage
} = require('./utils/messages');
const {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {

	socket.on('join', (options, callback) => {

		const {
			error,
			user
		} = addUser({
			id: socket.id,
			...options
		});

		if (error) {
			return callback(error);
		}

		socket.join(user.room);

		socket.emit('message', generateMessage('Admin', `Welcome!`));
		socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined.`));
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room)
		});
		callback();
	});

	socket.on('sendMessage', (msgFromClient, callbackMsg) => {
		const user = getUser(socket.id);
		// bad words filter
		const filter = new Filter();
		if (filter.isProfane(msgFromClient)) {
			return callbackMsg('Bad words not allowed');
		}

		io.to(user.room).emit('message', generateMessage(user.username, msgFromClient));
		callbackMsg();
	});

	socket.on('sendLocation', (location, msgCallback) => {
		console.log(location);
		const user = getUser(socket.id);

		io.to(user.room).emit(
			'locationMessage',
			generateLocationMessage(user.username, `https://www.google.com/maps?q=${location.latitude},${location.longitude}`)
		);
		msgCallback();
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);

		if (user) {
			io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room)
			});
		}

	});
});

const port = process.env.PORT || 3000;
const staticFilePath = path.join(__dirname, '../public/');

app.use(express.static(staticFilePath));

server.listen(port, () => {
	console.log('server is up on port 3000');
});