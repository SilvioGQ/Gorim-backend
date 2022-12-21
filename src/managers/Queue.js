class Queue {

  constructor() {
    this.players = [];
    this.disconnected = [];
  }

  addPlayer = (id) => {
    if (this.players.find(playerId => playerId === id)) return;
    this.players.push(id);
  }

  removePlayer = (id) => {
    this.players = this.players.filter(playerId => playerId !== id);
  }

  removeAllPlayers = () => {
    this.players = [];
  }

  checkQueue = (numberPlayers) => {
    return this.players.length === numberPlayers;
  }

  getQueue = () => {
    return this.players.length;
  }

  updateQueueDisconnected = (id) => {
    this.disconnected.push(id);
  }

  checkQueueDisconnected = (numberPlayers) => {
    return this.disconnected.length === numberPlayers;
  }

  clearQueueDisconnected = () => {
    this.disconnected = [];
  }
}

module.exports = Queue;