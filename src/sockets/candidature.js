const Player = require('../characters/Player');
const Mayor = require('../characters/Mayor');
const Supervisor = require('../characters/Supervisor');
const CityCouncilor = require('../characters/CityCouncilor');

module.exports = function (io, socket, Game, updateQueue, clearQueue) {
  socket.on('addCandidature', (candidature) => {
    let room = Game.selectRoom(socket.roomId);
    let player = room.selectPlayer(socket.id);
    updateQueue(room, socket.id);

    if (candidature === null) {
      checkCandidatures(player, room);
    } else {
      room.election.addCandidate(player, candidature);
    }

    room.playersOffice.forEach(p => {
      if (player.city === p.city) {
        io.to(p.id).emit('getElections', room.election.getElections(player));
      }
    });

    candidatureAtlantis = room.election.election['Atlantis'];
    candidatureCidadela = room.election.election['Cidadela'];
	  if (room.queue.checkQueue(room.players.length) && candidatureAtlantis.supervisor.length >= 1 && candidatureAtlantis.cityCouncilor.length >= 1 && candidatureAtlantis.mayor.length >= 1 && candidatureCidadela.supervisor.length >= 1 && candidatureCidadela.cityCouncilor.length >= 1 && candidatureCidadela.mayor.length >= 1) {
      clearQueue(room);
      room.startTimer();
      io.to(socket.roomId).emit('initVotation', room.match.timer);
    }
  });

  socket.on('addVote', (votes) => {
    let room = Game.selectRoom(socket.roomId);
    let player = room.selectPlayer(socket.id);
    let queueLen = room.queue.getQueue();
    updateQueue(room, socket.id);
		
    if (room.queue.getQueue() !== queueLen) room.election.addVote(player, votes);
    if (room.queue.checkQueue(room.players.length)) {
			clearQueue(room);
      room.startTimer();
      io.to(socket.roomId).emit('initResultsVotation', room.match.timer);
      winnersElection(room);
    }
  });

  socket.on('winnersElection', () => {
    let room = Game.selectRoom(socket.roomId);
    let player = room.selectPlayerOffice(socket.id);

    socket.emit('updatePlayer', player);
    socket.emit('winnersElection', room.election.getElections(player));
  });

  const checkCandidatures = (player, room) => {
    let elections = room.election.getElections(player);

    if (elections.supervisor.length === 0) {
      room.election.addCandidate(player, 'Fiscal');
      return;
    }
    if (elections.cityCouncilor.length === 0) {
      room.election.addCandidate(player, 'Vereador');
      return;
    }
    if (elections.mayor.length === 0) {
      room.election.addCandidate(player, 'Prefeito');
      return;
    }
  }

  const winnersElection = (room) => {
    let { city1, city2 } = room.election.getWinners();

    saveSalaries(room);

    if (city1.supervisor[0]) swapOffice(room, city1.supervisor[0].id, 'Fiscal');
    if (city1.cityCouncilor[0]) swapOffice(room, city1.cityCouncilor[0].id, 'Vereador');
    if (city1.mayor[0]) swapOffice(room, city1.mayor[0].id, 'Prefeito');

    if (city2.supervisor[0]) swapOffice(room, city2.supervisor[0].id, 'Fiscal');
    if (city2.cityCouncilor[0]) swapOffice(room, city2.cityCouncilor[0].id, 'Vereador');
    if (city2.mayor[0]) swapOffice(room, city2.mayor[0].id, 'Prefeito');

    io.to(socket.roomId).emit('refreshPlayers', room.playersOffice);
  }

  const saveSalaries = (room) => {
    room.playersOffice.forEach(player => {
      if (player.office === 'Fiscal') room.election.salaryOffices[player.city].supervisor = player.serviceSalary;
      if (player.office === 'Vereador') room.election.salaryOffices[player.city].cityCouncilor = player.serviceSalary;
      if (player.office === 'Prefeito') room.election.salaryOffices[player.city].mayor = player.serviceSalary;
    });
  }

  const swapOffice = (room, playerId, office) => {
    let aux = {}, j;

    for (let i = 0; i < room.playersOffice.length; i++) {
      if (room.playersOffice[i].id === playerId) {
        j = room.playersOffice.findIndex(p => room.playersOffice[i].city === p.city && p.office === office);
        if (j !== -1 && room.playersOffice[i].id !== room.playersOffice[j].id) {
          aux = { ...room.playersOffice[j] };

          if (office === 'Fiscal') room.playersOffice[i] = new Supervisor(room.playersOffice[i]);
          if (office === 'Vereador') room.playersOffice[i] = new CityCouncilor(room.playersOffice[i]);
          if (office === 'Prefeito') room.playersOffice[i] = new Mayor(room.playersOffice[i]);
          room.playersOffice[i].serviceSalary = room.playersOffice[j].serviceSalary;

          room.playersOffice[j] = new Player(room.playersOffice[j].id, room.id, room.playersOffice[j].name, room.playersOffice[j].host);
          room.playersOffice[j].startGame(aux.avatar, aux.city);
        } else {
          if (office === 'Fiscal') room.playersOffice[i] = new Supervisor(room.playersOffice[i]);
          if (office === 'Vereador') room.playersOffice[i] = new CityCouncilor(room.playersOffice[i]);
          if (office === 'Prefeito') room.playersOffice[i] = new Mayor(room.playersOffice[i]);
        }

        getSalary(room, room.playersOffice[i]);
      }
    }
  }

  getSalary = (room, player) => {
    if (player.office === 'Fiscal') player.serviceSalary = room.election.salaryOffices[player.city].supervisor;
    if (player.office === 'Vereador') player.serviceSalary = room.election.salaryOffices[player.city].cityCouncilor;
    if (player.office === 'Prefeito') player.serviceSalary = room.election.salaryOffices[player.city].mayor;
  }
}