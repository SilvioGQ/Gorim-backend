const Player = require("./Player");
const { v4: uuidv4 } = require('uuid');

// INITIAL VALUES
const INITIALCOIN = 600, INITIALPRODUCTION = 0, INITIALPOLLUTION = 0, INITIALINVENTORY = [];

const parcel = {
  seed: null,
  fertilizer: null,
  pesticide: null,
  machine: null,
  spray: false,
  planted: false,
  requestStamp: false,
  production: 0,
  pollution: 0
}

class Farmer extends Player {
  constructor(player, city) {
    super(player.id, player.room, player.name, player.host);
    this.startGame('', city);

    this.logs = [];
    this.parcelLand = [];
    this.type = 'Agricultor';
    this.coin = INITIALCOIN;
    this.production = INITIALPRODUCTION;
    this.pollution = INITIALPOLLUTION;
    this.inventory = [...INITIALINVENTORY];

    for (let i = 0; i < 6; i++) this.parcelLand.push({ id: i, ...parcel });
  }

  toPlant = (parcelLand) => {
    this.inventory.forEach(e => {
      if (e.name == parcelLand.seed || e.name == parcelLand.fertilizer || e.name == parcelLand.pesticide || e.name == parcelLand.machine) e.amount = e.amount - 1;
    });

    this.parcelLand[parcelLand.id] = { ...parcelLand, planted: true };
    this.addLog({ type: 'plantation', parcelLand: this.parcelLand[parcelLand.id] });
  }

  addSprayParcel = (parcelLand) => {
    this.inventory.forEach(e => {
      if (e.name == 'Pulverizador') e.amount = e.amount - 1;
    });

    this.parcelLand[parcelLand.id].spray = true;
    this.updateLogPlantation({ type: 'plantation', parcelLand: this.parcelLand[parcelLand.id] });
  }

  requestStamp = (parcelLand) => {
    this.parcelLand[parcelLand.id].requestStamp = true;
  }

  addToInventory = (item, amount) => {
    let foundItem = false;

    this.inventory.forEach(i => {
      if (item.name == i.name) {
        i.amount += item.amount;
        foundItem = true;
      }
    });
    if (!foundItem) this.inventory.push({ name: item.name, type: item.type, amount: amount ? amount : item.amount });
  }

  addLog = (log) => {
		this.logs.push({ ...log, id: uuidv4() });
  }

  updateLogPlantation = (log) => {
    this.logs.forEach(l => {
      if (l.type === 'plantation') {
        if (l.parcelLand.id === log.parcelLand.id) l.parcelLand.spray = true;
      }
    });
  }

  resetPlayer() {
    this.logs = [];
    this.production = 0;
    this.pollution = 0;

    this.parcelLand = [];
    this.inventory = [];
    for (let i = 0; i < 6; i++) this.parcelLand.push({ id: i, ...parcel });
  }
}


module.exports = Farmer;