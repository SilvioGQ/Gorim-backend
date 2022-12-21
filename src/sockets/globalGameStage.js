module.exports = function (io, socket, Game, updateQueue, clearQueue) {

	socket.on('startGame', () => {
		let room = Game.selectRoom(socket.roomId);

		if (room.queue.checkQueue(room.players.length)) {
			clearQueue(room);

			room.startGame(player => {
				io.to(player.id).emit('updatePlayer', player);
			});

			io.to(socket.roomId).emit('startGame', room);
			io.to(socket.roomId).emit('updateGame', room.match);

			let interval = setInterval(() => {
				if (room.players.length === room.playersOffice.length) {
					clearInterval(interval);

					io.to(socket.roomId).emit('refreshPlayers', room.players);
					io.to(socket.roomId).emit('reportMessage', 'raffled');
				}
			}, 1000);
		}
	});

	socket.on('selectAvatar', (avatar) => {
		let room = Game.selectRoom(socket.roomId);
		let player1 = room.selectPlayer(socket.id);
		let player2 = room.selectPlayerOffice(socket.id);
		updateQueue(room, socket.id);

		player1.avatar = avatar;
		player2.avatar = avatar;
		socket.emit('updatePlayer', player1);
		io.to(socket.roomId).emit('refreshPlayers', room.players);
	});

	socket.on('selectedAvatars', () => {
		let room = Game.selectRoom(socket.roomId);

		if (room.queue.checkQueue(room.players.length)) {
      let timer = room.startTimer();

      clearQueue(room);
      io.to(socket.roomId).emit('selectedAvatars', timer);
		}
	});

	socket.on('makeTransfer', (coin, receiverId, providerOfficeCoin = false, receiverOfficeCoin = false) => {
		let room = Game.selectRoom(socket.roomId);
		let { player1, player2 } = room.transferCoin(coin, socket.id, receiverId, providerOfficeCoin, receiverOfficeCoin);

		io.to(player1.id).emit('updatePlayer', player1);
		if ((room.match.phase === 1 && !player2.office) || (room.match.phase === 2 && player2.office)) {
			io.to(player2.id).emit('updatePlayer', player2);
			io.to(player2.id).emit('enableNotifyScene');
		}
	});

	socket.on('calcPlayerTax', () => {
		let room = Game.selectRoom(socket.roomId);
		let player = room.selectPlayer(socket.id);

		socket.emit('calcPlayerTax', room.calcTax(player));
	});

	socket.on('suggestFine', () => {
		let room = Game.selectRoom(socket.roomId);
		let suggests = room.suggestFine();

		socket.emit('suggestFine', suggests);
	});

	socket.on('getPlayers', () => {
		let room = Game.selectRoom(socket.roomId);
		socket.emit('getPlayers', room.players);
	});

	socket.on('getPlayersOffice', () => {
		let room = Game.selectRoom(socket.roomId);
		socket.emit('getPlayers', room.playersOffice);
	});
}