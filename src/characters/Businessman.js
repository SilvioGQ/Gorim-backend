const Player = require("./Player");
const { v4: uuidv4 } = require('uuid');

// INITIAL VALUES
const INITIALCOIN = 100, INITIALPRODUCTION = 0, INITIALPOLLUTION = 0;

class Businessman extends Player {
  constructor(player, city) {
    super(player.id, player.room, player.name, player.host);
    this.startGame('', city);

    this.logs = [];
    this.offers = [];
    this.type = 'Empresário';
    this.production = INITIALPRODUCTION;
    this.pollution = INITIALPOLLUTION;
    this.coin = INITIALCOIN;
  }

  addOffer = (obj) => {
    this.offers.push({ id: uuidv4(), name: obj[0], type: obj[1], price: obj[2], idSeller: this.id, avatarSeller: this.avatar, idBuyer: obj[3], amount: obj[4], priceType: obj[5] });
    return obj[3] !== -1;
  }

  getOffer = (id) => {
    return this.offers.find(offer => offer.id === id);
  }

  removeOffer = (id) => {
    this.offers = this.offers.filter(offer => offer.id != id);
  }

  updateOffer = (id, amount) => {
    this.offers.forEach(offer => {
      if (offer.id === id) {
        offer.amount -= amount;
				
				if (offer.amount === 0) this.removeOffer(id);
      }
    });

  }

  addLog = (log) => {
		this.logs.push({ ...log, id: uuidv4() });
  }

  resetPlayer() {
    this.logs = [];
    this.production = 0;
    this.pollution = 0;
    this.offers = [];
  }
}

module.exports = Businessman;