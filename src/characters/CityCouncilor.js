const Player = require("./Player");
const { v4: uuidv4 } = require('uuid');

const INITIALCOINOFFICE = 0;

class CityCouncilor extends Player {
  constructor(player) {
    super(player.id, player.room, player.name, player.host);
    this.startGame(player.avatar, player.city);

    this.serviceSalary = INITIALCOINOFFICE;
    this.office = 'Vereador';
    this.logsOffice = [];
    this.suggestTax = [];
    this.suggestPrevention = [];
  }

  addLogOffice = (log) => {
		this.logsOffice.push({ ...log, id: uuidv4() });
  }

  addSuggestPrevention = (suggest) => {
    let prevention = {
			id: uuidv4(),
      type: 'prevention',
      value: suggest.value,
      preventionPercentual: suggest.preventionPercentual,
      label: suggest.label,
      namePlayer: this.name,
      avatarPlayer: this.avatar,
      approved: null
    };
    this.suggestPrevention.push(prevention);
  }

  addSuggestTax = (suggest, tax, label, category, labelValue) => {
    let logTax = {
			id: uuidv4(),
      type: 'tax',
      labelValue: labelValue,
      namePlayer: this.name,
      avatarPlayer: this.avatar,
      approved: null,
      ...tax,
      label: label,
      category: category
    };
    this.suggestTax.push(logTax);
  }

  deleteSuggest = (suggest) => {
    if (suggest.type === 'tax') {
      this.suggestTax = this.suggestTax.filter(s => s.id !== suggest.id);
    } else {
      this.suggestPrevention = this.suggestPrevention.filter(s => s.id !== suggest.id);
    }
  }

  resetPlayer = () => {
    this.logsOffice = [];
    this.suggestTax = [];
    this.suggestPrevention = [];
  }
}

module.exports = CityCouncilor;