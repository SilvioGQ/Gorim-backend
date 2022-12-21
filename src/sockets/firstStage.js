module.exports = function (io, socket, Game) {

	socket.on('toPlant', (parcelLand) => {
		let room = Game.selectRoom(socket.roomId);
		let player = room.selectPlayer(socket.id);

		room.toPlant(player, parcelLand, player => {
			socket.emit('updatePlayer', player);
			socket.emit('enableNotifyScene');
		});
	});

	socket.on('addSprayParcel', (parcelLand) => {
		let room = Game.selectRoom(socket.roomId);
		let player = room.selectPlayer(socket.id);

		room.toPlantSpray(player, parcelLand, (player) => {
			socket.emit('updatePlayer', player);
			socket.emit('enableNotifyScene');
		});
	});

	socket.on('addAdvert', (...obj) => {
		let room = Game.selectRoom(socket.roomId);
		let player = room.selectPlayer(socket.id);
		let notifyClient = player.addOffer(obj);

		if (notifyClient) {
			io.to(obj[3]).emit('getOffers', { forAll: false, offers: room.getOffers(obj[3]) });
			io.to(obj[3]).emit('enableNotifyOffers');
		} else {
			io.to(socket.roomId).emit('getOffers', { forAll: true, offers: room.getOffers() });
		}
		io.to(player.id).emit('updatePlayer', player);
	});

	socket.on('deleteAdvert', (offer) => {
		let room = Game.selectRoom(socket.roomId);
		let player = room.selectPlayer(socket.id);

		if (player.getOffer(offer.id)) {
			player.removeOffer(offer.id);
			
			if (offer.idBuyer === -1) {
				io.to(socket.roomId).emit('getOffers', { forAll: true, offers: room.getOffers() });
			} else {
				io.to(offer.idBuyer).emit('getOffers', { forAll: false, offers: room.getOffers(offer.idBuyer) });
			}
			io.to(player.id).emit('updatePlayer', player);
		}
	});

	socket.on('confirmOffer', (item, amount = null) => {
		let room = Game.selectRoom(socket.roomId);

		room.buyOffer(item, amount, socket.id, item.idSeller, (player1, player2) => {
			if (amount) {
				io.to(socket.roomId).emit('getOffers', { forAll: true, offers: room.getOffers() });
			} else {
				io.to(player1.id).emit('getOffers', { forAll: false, offers: room.getOffers(player1.id) });
			}

			io.to(player1.id).emit('updatePlayer', player1);
			io.to(player2.id).emit('updatePlayer', player2);
			io.to(player1.id).emit('enableNotifyScene');
			io.to(player2.id).emit('enableNotifyScene');
		});
	});

	socket.on('rejectOffer', (item) => {
		let room = Game.selectRoom(socket.roomId);
		let { player1, player2 } = room.rejectOffer(item);

		io.to(socket.roomId).emit('getOffers', { forAll: false, offers: room.getOffers(player1.id) });
		io.to(player2.id).emit('updatePlayer', player2);
	});

	socket.on('requestStamp', (parcelLand) => {
		let room = Game.selectRoom(socket.roomId);
		let player = room.selectPlayer(socket.id);

		player.requestStamp(parcelLand);
		io.to(player.id).emit('updatePlayer', player);
	});
}