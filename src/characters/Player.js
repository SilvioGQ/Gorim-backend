class Player {
  constructor(id, roomId, name, host) {
    this.id = id;
    this.room = roomId;
    this.name = name;
    this.host = host;
  }
  
  startGame = (avatar = '', city) => {
    this.avatar = avatar;
    this.city = city;
  }
}

module.exports = Player;