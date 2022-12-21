const Room = require('./Room');
// const Elections = require('./Elections');

class Game {
  constructor() {
    this.rooms = [];
    // this.logs = [];
    // this.elections = new Elections();
  }

  generateUID = () => {
    let firstPart, secondPart, roomId;

    for (; ;) {
      firstPart = (Math.random() * 46656) | 'A';
      secondPart = (Math.random() * 46656) | 0;

      firstPart = ("000" + firstPart.toString(36)).slice(-3);
      secondPart = ("000" + secondPart.toString(36)).slice(-3);

      roomId = (firstPart + secondPart).toUpperCase();
      if (!this.rooms[roomId]) return roomId;
    }
  }

  addRoom = () => {
    let room = new Room(this.generateUID());
    this.rooms.push(room);

    // this.logs[room.id] = [];

    return room;
  }

  removeRoom = (id) => {
    this.rooms = this.rooms.filter(room => room.id !== id)
  }

  selectRoom = (id) => {
    return this.rooms.find(room => room.id === id);
  }
}

module.exports = Game;