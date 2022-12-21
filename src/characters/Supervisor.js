const Player = require("./Player");
const { v4: uuidv4 } = require('uuid');

const INITIALCOINOFFICE = 0;

class Supervisor extends Player {
  constructor(player) {
    super(player.id, player.room, player.name, player.host);
    this.startGame(player.avatar, player.city);

    this.serviceSalary = INITIALCOINOFFICE;
    this.office = 'Fiscal';
    this.logsOffice = [];
    this.appliedFine = [];
    this.appliedStamp = [];
  }

  addLogOffice = (log) => {
		this.logsOffice.push({ ...log, id: uuidv4() });
  }

  applyFine = (fined, fine, gravity) => {
    if (this.appliedFine.find(f => f === fined.id)) return;
    this.appliedFine.push(fined.id);

    this.addLogOffice({
      type: 'fine',
      ownAction: true,
      namePlayer: fined.name,
      avatarPlayer: fined.avatar,
      percentual: fine.percentual,
      value: fine.value,
      gravity: gravity
    });
    
    fined.coin -= fine.value;
    fined.addLog({ type: 'fine', ownAction: true, namePlayer: this.name, avatarPlayer: this.avatar, percentual: fine.percentual, value: fine.value, gravity: gravity });
  }

  applyStamp = (player, parcelLands) => {
    let value = 0;
    for (let i = 0; i < parcelLands.length; i++) {
      if (this.appliedStamp.indexOf(player.id + parcelLands[i]) == -1) {
        player.logs.forEach(log => {
          if (log.type === 'tax') {
            value = log.value * 0.05;
            player.coin += value;
          }
        });
        this.appliedStamp.push(player.id + parcelLands[i]);
				player.addLog({ type: 'stamp', ownAction: true, namePlayer: this.name, avatarPlayer: this.avatar, parcelId: parcelLands[i], value: value });
				this.addLogOffice({ type: 'stamp', ownAction: true, playerId: player.id, namePlayer: player.name, avatarPlayer: player.avatar, idParcel: parcelLands[i], value: value });
      }
    }
  }

  resetPlayer = () => {
    this.logsOffice = [];
    this.appliedFine = [];
    this.appliedStamp = [];
  }
}

module.exports = Supervisor;