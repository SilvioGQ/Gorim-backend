module.exports = function (io, socket, Game) {
  socket.on('getMessages', () => {
    let room = Game.selectRoom(socket.roomId);
    let messages = room.chat.getMessages(socket.id, room.match.phase);

    socket.emit('getMessages', messages);
  });

  socket.on('sendMessage', (id, msg) => {
    let room = Game.selectRoom(socket.roomId);
    room.chat.sendMessage(socket.id, id, msg, room.match.phase);

    socket.emit('getMessages', room.chat.getMessages(socket.id, room.match.phase));
    io.to(id).emit('enableNotifyMessage', socket.id);
    io.to(id).emit('getMessages', room.chat.getMessages(id, room.match.phase));
  });

  socket.on('sendGroupMessage', (id, msg) => {
    let room = Game.selectRoom(socket.roomId);
    let players = room.match.phase === 1 ? room.players : room.playersOffice;
    let group = room.chat.getGroup(socket.id, id, room.match.phase);
    room.chat.sendGroupMessage(id, socket.id, msg, room.match.phase, players);

    socket.emit('getMessages', room.chat.getMessages(socket.id, room.match.phase));
    for (let i = 0; i < group.players.length; i++) {
      if (socket.id !== group.players[i]) io.to(group.players[i]).emit('enableNotifyMessage', id);
      
      io.to(group.players[i]).emit('getMessages', room.chat.getMessages(group.players[i], room.match.phase));
    }
  });
}