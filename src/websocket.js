module.exports = function (io, Game) {
  io.on('connection', socket => {
    console.log('player connected ' + socket.id);
    
    require('./sockets/globalGameStage.js')(io, socket, Game, updateQueue, clearQueue);
    require('./sockets/firstStage.js')(io, socket, Game);
    require('./sockets/secondStage.js')(io, socket, Game);
    require('./sockets/transitionStage.js')(io, socket, Game, updateQueue, clearQueue);
    require('./sockets/candidature.js')(io, socket, Game, updateQueue, clearQueue);
    require('./sockets/chat.js')(io, socket, Game);
    require('./sockets/firebasesocket.js')(Game, socket);
    
    socket.on('addToRoom', (name) => {
      if (!socket.roomId) {
        
        let room = Game.addRoom();
        let player = room.addPlayer(socket.id, room.id, name, true);
        
        socket.roomId = room.id;
        socket.join(room.id);
        socket.emit('addedToRoom', player);
        socket.emit('refreshPlayers', room.players);
        updateQueue(room, socket.id);
      }
    });
    
    socket.on('joinToRoom', (name, roomId) => {
      let syncPlayer = false;
      
      if (!socket.roomId) {
        
        let room = Game.selectRoom(roomId);
        
        if (!room) return socket.emit('reportMessage', 'notFound');
        if (room.players.length >= 10) return socket.emit('reportMessage', 'maxPlayersToRoom');
        if (room.inGame && room.disconnectedPlayers.length === 0) {
          return socket.emit('reportMessage', 'inGaming');
        } else if (room.disconnectedPlayers.length > 0) {
          syncPlayer = true;
          io.to(roomId).emit('reconnectPlayer');
        }
        
        let player;
        if (!syncPlayer) {
          player = room.addPlayer(socket.id, room.id, name, false);
          
          updateQueue(room, socket.id);
        } else {
          player = room.disconnectedPlayers[0];
          
          room.election.updateElections(player[0], socket.id);
          room.chat.reconnectPlayer(player[0].id, socket.id);
          
          player[0].id = socket.id;
          player[0].name = name;
          player[1].id = socket.id;
          player[1].name = name;
          room.players.push(player[0]);
          room.playersOffice.push(player[1]);
          player = room.match.phase == 1 ? player[0] : player[1];
          
          io.to(socket.id).emit('startGame', room);
          io.to(socket.id).emit('updateGame', room.match);
        }
        
        socket.roomId = room.id;
        socket.join(room.id);
        socket.emit('addedToRoom', player, syncPlayer);
        io.to(socket.roomId).emit('refreshPlayers', room.players);
      }
    });
    
    socket.on('roomReport', (infoTimer, currentScreen) => {
      let room = Game.selectRoom(socket.roomId);
      let p = room.selectPlayer(socket.id);
      
      if (p.host) {
        if (currentScreen == 'Status') {
          let tax = room.calcTax(room.disconnectedPlayers[0][0]);
          let totalProduction = room.disconnectedPlayers[0][0].production
          totalProduction += tax.value;
          
          io.to(room.disconnectedPlayers[0][0].id).emit('endStage', { totalProduction: totalProduction, tax: tax });
        } else if (currentScreen == 'Votacao') {
          room.players.forEach(p => {
            if (room.disconnectedPlayers[0][0].city == p.city) io.to(p.id).emit('getElections', room.election.getElections(p));
          });
        } else if (currentScreen == 'Eleitos') {
          room.players.forEach(p => {
            if (room.disconnectedPlayers[0][0].city == p.city) io.to(p.id).emit('winnersElection', room.election.getElections(p));
          });
        } else if (currentScreen != 'Eleitos' && currentScreen != 'Candidatura' && currentScreen != 'Detalhes') {
          if (room.match.phase === 1) {
            currentScreen = 'MenuJogador';
          } else if (room.match.phase === 2) {
            currentScreen = 'MenuPolitico';
          }
        }

        let now = new Date();
        let maxTime = parseInt(infoTimer.maxTime) + parseInt((now.getTime() - new Date(room.match.freezeTimer).getTime()) / 1000);
        
        infoTimer.startTime = room.match.timer;
        infoTimer.maxTime = maxTime;
        io.to(room.disconnectedPlayers[0][0].id).emit('roomReport', infoTimer, currentScreen, room.endTimer);
        io.to(room.disconnectedPlayers[0][0].id).emit('updateAwaitPlayers', room.queue.getQueue());
        room.disconnectedPlayers.shift();
        
        if (room.disconnectedPlayers.length == 0) {
          setTimeout(() => {
            io.to(socket.roomId).emit('changeStatusTimer', maxTime + 5);
          }, 5000);
          room.match.freezeTimer = null;
        }
      }
    });
    
    socket.on('roomEndTimer', (callback) => {
      let room = Game.selectRoom(socket.roomId);
      room.endTimer = callback;
    });
    
    socket.on('removeFromRoom', () => {
      if (socket.roomId) {
        
        let room = Game.selectRoom(socket.roomId);
        room.removePlayer(socket.id);
        room.removePlayerOffice(socket.id);
        
        if (room.players.length === 0) {
          Game.removeRoom(room.id);
        } else if (!room.checkHost()) {
          let player = room.newHost();
          io.to(player.id).emit('updatePlayer', player);
        }
        console.log('leave from ' + socket.roomId);
        
        socket.leave(socket.roomId);
        socket.emit('reportMessage', 'removedToRoom');
        
        room.queue.removePlayer(socket.id);
        io.to(socket.roomId).emit('updateAwaitPlayers', room.queue.getQueue());
        
        io.to(socket.roomId).emit('refreshPlayers', !room.match ? room.players : room.match.phase === 1 ? room.players : room.playersOffice);
        socket.emit('updatePlayer', {});
        socket.roomId = null;
      }
    });
    
    socket.on('disconnect', () => {
      if (socket.roomId) {
        let room = Game.selectRoom(socket.roomId);

        room.disconnectedPlayer(socket.id);
        io.to(socket.roomId).emit('disconnectPlayer');
        
        room.removePlayer(socket.id);
        room.removePlayerOffice(socket.id);
        
        if (room.players.length === 0) {
          Game.removeRoom(room.id);
        } else if (!room.checkHost()) {
          let player = room.newHost();
          io.to(player.id).emit('updatePlayer', player);
        }
        console.log('leave from ' + socket.roomId);
        
        socket.leave(socket.roomId);
        socket.emit('reportMessage', 'removedToRoom');
        room.queue.removePlayer(socket.id);
        io.to(socket.roomId).emit('updateAwaitPlayers', room.queue.getQueue());
        
        io.to(socket.roomId).emit('refreshPlayers', !room.match ? room.players : room.match.phase === 1 ? room.players : room.playersOffice);
        socket.roomId = null;
      }
      console.log('player disconnected');
    });
  });
  
  const updateQueue = (room, id) => {
    if (id) room.queue.addPlayer(id);
    io.to(room.id).emit('updateAwaitPlayers', room.queue.getQueue());
  }
  
  const clearQueue = (room) => {
    room.queue.removeAllPlayers();
  }
}
