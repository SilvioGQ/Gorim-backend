module.exports = function (io, socket, Game, updateQueue, clearQueue) {
	socket.on('endStage', () => {
		let room = Game.selectRoom(socket.roomId);
		updateQueue(room, socket.id);

		if (room.queue.checkQueue(room.players.length)) {
			clearQueue(room);

			room.endStage((totalProduction, tax, player) => {
				player.addLog({ type: 'tax', percentual: tax.percentual, value: tax.value });
				io.to(player.id).emit('updatePlayer', { ...player, coin: player.coin });

        room.startTimer();
				io.to(player.id).emit('endStage', { totalProduction: totalProduction, tax: tax }, room.match.timer);
			});

			io.to(room.id).emit('updateGame', room.match);
			io.to(socket.roomId).emit('getLogs', room.oldLogs);
			io.to(socket.roomId).emit('reportMessage', 'allForEndStage');
		}
	});

	socket.on('nextStage', () => {
		let room = Game.selectRoom(socket.roomId);
		updateQueue(room, socket.id);

		if (room.queue.checkQueue(room.players.length)) {
			clearQueue(room);

			//  || room.match.round === 1
			if (room.match.round % 2 === 0 || room.match.phase % 2 === 0) {
				room.match.phase = 2;
				room.nextStage();

				room.playersOffice.forEach(player => {
					io.to(player.id).emit('updatePlayer', player);
				});
        room.startTimer();

				io.to(socket.roomId).emit('refreshPlayers', room.playersOffice);
				io.to(socket.roomId).emit('nextStage', room.match.timer);
			} else {
				room.election.createElection();
				room.match.phase++;

        room.startTimer();
        io.to(socket.roomId).emit('initElections', room.match.timer);
			}
			io.to(socket.roomId).emit('updateGame', room.match);
		}
	});

	socket.on('endRound', () => {
		let room = Game.selectRoom(socket.roomId);
		updateQueue(room, socket.id);

		if (room.queue.checkQueue(room.players.length)) {
			clearQueue(room);
			
			room.endRound();
      room.startTimer();

			io.to(socket.roomId).emit('updateGame', room.match);
			io.to(socket.roomId).emit('endRound', room.match.oldStatus, room.match.timer);
			io.to(socket.roomId).emit('getLogs', room.oldLogs);
			io.to(socket.roomId).emit('reportMessage', 'allForEndRound');
		}
	});

	socket.on('nextRound', () => {
		let room = Game.selectRoom(socket.roomId);
		updateQueue(room, socket.id);

		if (room.queue.checkQueue(room.players.length)) {
			clearQueue(room);
			
			room.match.phase = 1;
			room.match.round++;

			room.players.forEach(player => {
				io.to(player.id).emit('updatePlayer', player);
			});
      room.startTimer();

			io.to(socket.roomId).emit('updateGame', room.match);
			io.to(socket.roomId).emit('refreshPlayers', room.players);
			io.to(socket.roomId).emit('nextRound', room.match.timer);
		}
	});
}