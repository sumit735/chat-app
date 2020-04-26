const socket = io();

const form = document.querySelector('#messageForm');
const msgBox = document.querySelector('#msg');
const sendButton = document.querySelector('#sendMessage');
const sendLocationButton = document.querySelector('#sendLocation');
// alternate
// const msg = e.target.elements.msg
const msgs = document.querySelector('#messages');

// Templates
const msgTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML;

// options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true
});
// const autoscroll = () => {
// 	// New message element
// 	const $newMessage = msgs.lastElementChild;

// 	// Height of the new message
// 	const newMessageStyles = getComputedStyle($newMessage);
// 	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
// 	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

// 	// Visible height
// 	const visibleHeight = msgs.offsetHeight;

// 	// Height of messages container
// 	const containerHeight = msgs.scrollHeight;

// 	// How far have I scrolled?
// 	const scrollOffset = msgs.scrollTop + visibleHeight;

// 	if (containerHeight - newMessageHeight <= scrollOffset) {
// 		msgs.scrollTop = msgs.scrollHeight;
// 	}
// };

function scrollToBottom() {
	msgs.scrollTop = msgs.scrollHeight;
}

socket.on('message', (welcomeMsg) => {
	console.log(welcomeMsg);

	const html = Mustache.render(msgTemplate, {
		username: welcomeMsg.username,
		message: welcomeMsg.text,
		createdAt: moment(welcomeMsg.createdAt).format('h:mm A')
	});
	msgs.insertAdjacentHTML('beforeend', html);
	// autoscroll();
	scrollToBottom();
});

socket.on('locationMessage', (urlObject) => {
	console.log(urlObject);

	const html = Mustache.render(locationMessageTemplate, {
		username: urlObject.username,
		url: urlObject.url,
		createdAt: moment(urlObject.createdAt).format('h:mm A')
	});
	msgs.insertAdjacentHTML('beforeend', html);
	// autoscroll();
	scrollToBottom();
});

socket.on('roomData', ({ room, users }) => {
	console.log(room);
	console.log(users);
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	});
	document.querySelector('#sidebar').innerHTML = html;
});

form.addEventListener('submit', (e) => {
	// prevent form from submitting
	e.preventDefault();

	// disable the form
	sendButton.setAttribute('disabled', 'disabled');

	// get the msg
	const clientMsg = msgBox.value;

	// emit msg to server
	socket.emit('sendMessage', clientMsg, (error) => {
		// enable the form
		sendButton.removeAttribute('disabled');
		// clear the textbox
		msgBox.value = '';
		// add focus
		// msgBox.focus(); //causes issue in mobile
		msgs.focus();

		if (error) {
			return console.log(error);
		}

		console.log('message delivered');
	});
});

sendLocationButton.addEventListener('click', (e) => {
	sendLocationButton.setAttribute('disabled', 'disabled');

	if (!navigator.geolocation) {
		return alert("Geolocation isn't curreently supported by your browser");
	}

	sendLocationButton.setAttribute('disabled', 'disabled');

	navigator.geolocation.getCurrentPosition((position) => {
		// create location object
		const location = {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		};

		// emit to server
		socket.emit('sendLocation', location, () => {
			sendLocationButton.removeAttribute('disabled');
			console.log('Location Shared.');
		});
	});
});

socket.emit(
	'join',
	{
		username,
		room
	},
	(error) => {
		if (error) {
			alert(error);
			location.href = '/';
		}
	}
);
