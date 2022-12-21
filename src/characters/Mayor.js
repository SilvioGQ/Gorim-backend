const Player = require("./Player");
const { v4: uuidv4 } = require('uuid');

const INITIALCOINOFFICE = 1000;

class Mayor extends Player {
  constructor(player) {
    super(player.id, player.room, player.name, player.host);
    this.startGame(player.avatar, player.city);

    this.serviceSalary = INITIALCOINOFFICE;
    this.office = 'Prefeito';
    this.logsOffice = [];
  }

  addLogOffice = (log) => {
		this.logsOffice.push({ ...log, id: uuidv4() });
  }

  addArrecadation = (arrecadation) => {
    this.serviceSalary += arrecadation;
    this.addLogOffice({
      type: 'arrecadation',
      value: arrecadation
    });
  }

  applyPrevention = (prevention) => {
    this.serviceSalary -= prevention.value;
    this.addLogOffice({
      type: 'prevention',
      ownAction: true,
      value: prevention.value,
      preventionPercentual: prevention.preventionPercentual,
      label: prevention.label,
      namePlayer: this.name,
      avatarPlayer: this.avatar
    });
  }

  applyTax = (tax, label) => {
    this.addLogOffice({
      type: 'tax',
      ownAction: true,
      ...tax,
      namePlayer: this.name,
      avatarPlayer: this.avatar,
      label: label
    });
  }

  resetPlayer = () => {
    this.logsOffice = [];
  }
}

module.exports = Mayor;