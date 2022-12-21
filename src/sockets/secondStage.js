module.exports = function (io, socket, Game) {

  socket.on('sendFine', (id, gravity) => {
    let room = Game.selectRoom(socket.roomId);
    let player1 = room.selectPlayerOffice(socket.id);
    let player2 = room.selectPlayer(id);
    room.applyFine(player1, player2, gravity);

    io.to(player1.id).emit('updatePlayer', player1);
    // io.to(player2.id).emit('updatePlayer', player2);
  });

  socket.on('sendStamp', (id, parcelLands) => {
    let room = Game.selectRoom(socket.roomId);
    let player1 = room.selectPlayerOffice(socket.id);
    let player2 = room.selectPlayer(id);
    player1.applyStamp(player2, parcelLands);

    io.to(player1.id).emit('updatePlayer', player1);
    // io.to(player2.id).emit('updatePlayer', player2);
  });

  socket.on('applyPrevention', (prevention) => {
    let room = Game.selectRoom(socket.roomId);
    let player = room.selectPlayerOffice(socket.id);
    room.applyPrevention(player, prevention);

    io.to(socket.id).emit('updatePlayer', player);
    io.to(socket.roomId).emit('refreshPlayers', room.playersOffice);
    io.to(socket.roomId).emit('updateGame', room.match);
    // io.to(socket.roomId).emit('updateGlobalPollution', room.match.globalPollution);
  });

  socket.on('applyTax', (newTax) => {
    let room = Game.selectRoom(socket.roomId);
    let player = room.selectPlayerOffice(socket.id);
    room.applyTax(player, newTax);

    io.to(player.id).emit('updatePlayer', player);
    io.to(socket.roomId).emit('refreshPlayers', room.playersOffice);
  });

  socket.on('suggestPrevention', (suggest) => {
    let room = Game.selectRoom(socket.roomId);
    let player = room.selectPlayerOffice(socket.id);
    player.addSuggestPrevention(suggest);

    let pref = room.playersOffice.find(p => player.city === p.city && p.office === 'Prefeito');
    io.to(player.id).emit('updatePlayer', player);
    io.to(player.id).emit('getSuggests', [...player.suggestTax, ...player.suggestPrevention]);
    if (pref) {
      io.to(pref.id).emit('enableNotifySuggests');
      io.to(pref.id).emit('getSuggests', [...player.suggestTax, ...player.suggestPrevention].filter(s => s.approved === null));
    }
  });

  socket.on('suggestTax', (suggest) => {
    let room = Game.selectRoom(socket.roomId);
    let player = room.selectPlayerOffice(socket.id);
    room.addSuggestTax(suggest, player);

    let pref = room.playersOffice.find(p => player.city === p.city && p.office === 'Prefeito');
    io.to(player.id).emit('getSuggests', [...player.suggestTax, ...player.suggestPrevention]);
    io.to(player.id).emit('updatePlayer', { ...player, coin: player.coin });
    if (pref) {
      io.to(pref.id).emit('enableNotifySuggests');
      io.to(pref.id).emit('getSuggests', [...player.suggestTax, ...player.suggestPrevention].filter(s => s.approved === null));
    }
  });

  socket.on('deleteSuggest', (suggest) => {
    let room = Game.selectRoom(socket.roomId);
    let player = room.selectPlayerOffice(socket.id);
    player.deleteSuggest(suggest);

    let pref = room.playersOffice.find(p => player.city === p.city && p.office === 'Prefeito');
    io.to(player.id).emit('getSuggests', [...player.suggestTax, ...player.suggestPrevention]);
    if (pref) io.to(pref.id).emit('getSuggests', [...player.suggestTax, ...player.suggestPrevention].filter(s => s.approved === null));
  });

  socket.on('toggleApprovedSuggest', (suggest, status) => {
    let room = Game.selectRoom(socket.roomId);
    let player = room.selectPlayerOffice(socket.id);
    let v = room.toggleApprovedSuggest(suggest, status, player);

    if (status) {
      io.to(player.id).emit('updatePlayer', player);
      io.to(socket.roomId).emit('refreshPlayers', room.playersOffice);
    }
    if (suggest.type === 'prevention') io.to(socket.roomId).emit('updateGame', room.match);
    io.to(player.id).emit('getSuggests', [...v.suggestTax, ...v.suggestPrevention].filter(s => s.approved === null));
    io.to(v.id).emit('getSuggests', [...v.suggestTax, ...v.suggestPrevention]);
    io.to(v.id).emit('enableNotifySuggests');
  });
}