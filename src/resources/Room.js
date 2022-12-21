// PERCENTUAL VARIABLES
const INITIALGLOBALPOLLUTION = 20, INITIALGLOBALPRODUCTION = 100;
// INITIAL VALUES
const NUMBERBUSINESS = 4, INITIALCITYPRODUCTION = { lowProduction: 'Médio', mediumProduction: 'Médio', highProduction: 'Médio' };

const FunctionalityService = require('../firebase/FunctionalityService');

const Calc = new (require('../managers/Calc'));
const Queue = require('../managers/Queue');
const Election = require('../managers/Election');
const Chat = require('../managers/Chat');

const Player = require('../characters/Player');
const Mayor = require('../characters/Mayor');
const Supervisor = require('../characters/Supervisor');
const CityCouncilor = require('../characters/CityCouncilor');
const Businessman = require('../characters/Businessman');
const Farmer = require('../characters/Farmer');

class Room {
	constructor(roomId) {
		this.id = roomId;
		this.inGame = false;
		this.players = [];
		this.playersOffice = [];
		this.oldLogs = [];
		this.election = new Election;
		this.queue = new Queue;
    this.disconnectedPlayers = [];
	}

	addPlayer = (id, roomId, name, host) => {
		let player = new Player(id, roomId, name, host);
		this.players.push(player);
		return player;
	}

	selectPlayer = (id) => {
		return this.players.find(player => player.id === id);
	}

	selectPlayerOffice = (id) => {
		return this.playersOffice.find(player => player.id === id);
	}

	removePlayer = (id) => {
		this.players = this.players.filter(p => p.id !== id);
	}

	removePlayerOffice = (id) => {
		this.playersOffice = this.playersOffice.filter(p => p.id !== id);
	}

	newHost = () => {
		let player = this.players[0];
		player.host = true;

		if (player = this.playersOffice.find(p => player.id === p.id)) {
			player.host = true;
		}

		return !this.match ? this.players[0] : this.match.phase === 1 ? this.players[0] : player;
	}

	checkHost = () => {
		return !!this.players.find(p => p.host);
	}

	startGame = (callback) => {
		this.inGame = true;
    this.chat = new Chat(this.players);
		this.cities = [
			{ name: 'Atlantis', ...INITIALCITYPRODUCTION },
			{ name: 'Cidadela', ...INITIALCITYPRODUCTION },
		];
		this.match = {
			round: 1,
			phase: 1,
			oldStatus: {
				globalPollution: 0,
				tax: []
			},
			globalPollution: INITIALGLOBALPOLLUTION,
			globalProduction: INITIALGLOBALPRODUCTION,
		}
    this.endTimer = '';
		this.rafflePlayers();
		this.players.forEach(callback);
	}

  startTimer = () => {
    let now = new Date();
    this.match.timer = now.toISOString();

    return this.match.timer;
  }

	rafflePlayers = () => {
		let emp = NUMBERBUSINESS, randomType, randomCity;
		let city1 = Math.floor(this.players.length / 2), city2 = Math.ceil(this.players.length / 2);

		let arr = this.players;
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		this.players = arr;

		for (let i = 0; i < this.players.length; i++) {
			randomType = emp > 0;
			if (randomType) emp--;

			randomCity = city1 >= city2;
			randomCity ? city1-- : city2--;

			if (randomType) {
				this.players[i] = new Businessman(this.players[i], randomCity ? 'Atlantis' : 'Cidadela');
			} else {
				this.players[i] = new Farmer(this.players[i], randomCity ? 'Atlantis' : 'Cidadela');
			}
		}
		this.raffleSpecialty();
		this.raffleOffice();
    this.chat.createGroupConnection(this.players);
	}

	raffleSpecialty = () => {
		let specialty = ['Fertilizante', 'Agrotóxico', 'Máquina', 'Semente'], randomSpecialty;

		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].type === 'Empresário') {
				randomSpecialty = Math.floor(Math.random() * specialty.length);

				this.players[i].specialty = specialty[randomSpecialty];
				specialty = specialty.filter((type, index) => randomSpecialty != index);
			}
		}
	}

	transferCoin = (coin, providerId, receiverId, providerOfficeCoin, receiverOfficeCoin) => {
		let player1 = providerOfficeCoin ? this.selectPlayerOffice(providerId) : this.selectPlayer(providerId);
		let player2 = receiverOfficeCoin ? this.selectPlayerOffice(receiverId) : this.selectPlayer(receiverId);

		let obj = { type: 'transfer', ownAction: true, namePlayer: player2.name, avatarPlayer: player2.avatar, cityPlayer: player2.city, typePlayer: player2.type ? player2.type : player2.office, value: coin }
    let obj2 = { type: 'transfer', ownAction: false, namePlayer: player1.name, avatarPlayer: player1.avatar, cityPlayer: player1.city, typePlayer: player1.type ? player1.type : player1.office, value: coin }

		this.phaseTransfer(player1, providerOfficeCoin, -coin, obj);
		this.phaseTransfer(player2, receiverOfficeCoin, coin, obj2);

		return { player1, player2 };
	}

	phaseTransfer = (player, phase, coin, log) => {
		if (phase) {
			player.serviceSalary = player.serviceSalary + coin;
			player.addLogOffice(log);
		} else {
			player.coin = player.coin + coin;
			player.addLog(log);
		}
	}

	buyOffer = (item, amount, providerId, receiverId, callback) => {
		let player1 = this.selectPlayer(providerId);
		let player2 = this.selectPlayer(receiverId);

		FunctionalityService.getProduct(item.name).then(prod => {

			let o = player2.getOffer(item.id);
			if (o && o.amount > 0) {

				let price = amount ? item.price * amount : item.price * item.amount;
				if (player1.coin >= price) {
					player1.coin -= price;
					
					amount === null ? player2.removeOffer(item.id) : player2.updateOffer(item.id, amount);
					if (amount) item.amount = amount;
	
					Calc.calcSaleProduction(player2, item, amount);
					let pollution = Calc.calcSalePollution(player2, prod, amount);
					player1.addToInventory(item, amount);
					player1.addLog({ type: 'buy', ownAction: true, product: item, namePlayer: player2.name, avatarPlayer: player2.avatar });
					player2.addLog({ type: 'buy', ownAction: false, product: item, namePlayer: player1.name, avatarPlayer: player1.avatar, pollution: pollution });
					callback(player1, player2);
				}
			}
		});
	}

	rejectOffer = (item) => {
		let player1 = this.selectPlayer(item.idBuyer)
		let player2 = this.selectPlayer(item.idSeller);
		if (player2.getOffer(item.id)) player2.removeOffer(item.id);

		return { player1, player2 };
	}

	getOffers = (receiverId = -1) => {
		let offers = [];

		this.players.forEach(player => {
			if (player.type === 'Empresário') {
				player.offers.forEach(offer => {
					if (offer.idBuyer === receiverId) offers.push(offer);
				});
			}
		});
		return offers;
	}

	toPlant = (player, parcelLand, callback) => {
		FunctionalityService.getProducts().then(products => {
			let parcel = player.parcelLand.find(p => parcelLand.id === p.id);

			if (parcel.planted === parcelLand.planted) {
				player.toPlant(parcelLand);
				Calc.calcParcelProduction(player, parcelLand, products);

				Calc.calcParcelPollution(player, parcelLand, products);
				callback(player);
			}
		});
	}

	toPlantSpray = (player, parcelLand, callback) => {
		FunctionalityService.getProducts().then(products => {
			let parcel = player.parcelLand.find(p => parcelLand.id === p.id);

			if (parcel.planted && parcel.planted === parcelLand.planted && !parcel.spray) {
				player.addSprayParcel(parcelLand)

				Calc.calcParcelPollution(player, parcelLand, products);
				callback(player);
			}
		});
	}

	calcGlobalPollution = () => {
		this.match.globalPollution = Calc.calcGlobalPollution(this.players, this.match.globalPollution);
	}

	calcGlobalProduction = () => {
		this.match.globalProduction = Calc.calcGlobalProduction(this.match.globalPollution);
	}

	calcTax = (player) => {
		let city = player.city === 'Atlantis' ? this.cities[0] : this.cities[1];
		return Calc.calcTax(city, player);
	}

	getPlayerStatus = (callback) => {
		let tax, totalProduction, arrecadationCity1 = 0, arrecadationCity2 = 0;

		this.players.forEach(player => {
			totalProduction = player.production;
			player.production = player.production * this.match.globalProduction / 100;
			tax = this.calcTax(player);
			player.production -= tax.value;
			player.coin += player.production;

			callback(totalProduction, tax, player);

			if (player.city === 'Cidadela') {
				arrecadationCity1 += tax.value;
			} else {
				arrecadationCity2 += tax.value;
			}
		});

		this.match.oldStatus.arrecadationCity1 = arrecadationCity1;
		this.match.oldStatus.arrecadationCity2 = arrecadationCity2;
	}

	nextStage = () => {
		let pref1 = this.playersOffice.find(p => p.office === 'Prefeito' && p.city === 'Cidadela');
		let pref2 = this.playersOffice.find(p => p.office === 'Prefeito' && p.city === 'Atlantis');

		if (pref1) pref1.addArrecadation(this.match.oldStatus.arrecadationCity1);
		if (pref2) pref2.addArrecadation(this.match.oldStatus.arrecadationCity2);

		this.match.oldStatus = {
			globalPollution: this.match.globalPollution,
			tax: [
				{ name: 'Atlantis', lowProduction: Calc.calcTax({ lowProduction: this.cities[0].lowProduction }, null), mediumProduction: Calc.calcTax({ mediumProduction: this.cities[0].mediumProduction }, null), highProduction: Calc.calcTax({ highProduction: this.cities[0].highProduction }, null) },
				{ name: 'Cidadela', lowProduction: Calc.calcTax({ lowProduction: this.cities[1].lowProduction }, null), mediumProduction: Calc.calcTax({ mediumProduction: this.cities[1].mediumProduction }, null), highProduction: Calc.calcTax({ highProduction: this.cities[1].highProduction }, null) },
			]
		}
	}

	raffleOffice = () => {
		let city1 = { mayor: 0, cityCouncilor: 0, supervisor: 0 }, city2 = { mayor: 0, cityCouncilor: 0, supervisor: 0 };
		let random, condition = 0, max = this.players.length < 6 ? this.players.length : 6;

		for (let i = 0; condition < max;) {
			random = Math.floor(Math.random() * 3);

			if (random === 0 && this.players[i] && !this.playersOffice[i]) {
				if (city1.mayor === 0 && this.players[i].city === 'Atlantis') {
					city1.mayor = 1;
					this.playersOffice[i] = new Mayor(this.players[i]);
				} else if (city2.mayor === 0 && this.players[i].city === 'Cidadela') {
					city2.mayor = 1;
					this.playersOffice[i] = new Mayor(this.players[i]);
				}
			}

			if (random === 1 && this.players[i] && !this.playersOffice[i]) {
				if (city1.cityCouncilor === 0 && this.players[i].city === 'Atlantis') {
					city1.cityCouncilor = 1;
					this.playersOffice[i] = new CityCouncilor(this.players[i]);
				} else if (city2.cityCouncilor === 0 && this.players[i].city === 'Cidadela') {
					city2.cityCouncilor = 1;
					this.playersOffice[i] = new CityCouncilor(this.players[i]);
				}
			}

			if (random === 2 && this.players[i] && !this.playersOffice[i]) {
				if (city1.supervisor === 0 && this.players[i].city === 'Atlantis') {
					city1.supervisor = 1;
					this.playersOffice[i] = new Supervisor(this.players[i]);
				} else if (city2.supervisor === 0 && this.players[i].city === 'Cidadela') {
					city2.supervisor = 1;
					this.playersOffice[i] = new Supervisor(this.players[i]);
				}
			}

			i = this.players.length === i ? 0 : i + 1;
			condition = city1.mayor + city1.cityCouncilor + city1.supervisor + city2.mayor + city2.cityCouncilor + city2.supervisor;
		}

		this.fillOffices();
	}

	fillOffices = () => {
    this.removeEmptyPlayers();
		let newPlayer;

		this.players.forEach(player => {
			if (!this.playersOffice.find(p => p.id === player.id)) {
				newPlayer = new Player(player.id, this.id, player.name, player.host);
				newPlayer.startGame(player.avatar, player.city);

				this.playersOffice.push(newPlayer);
			}
		});
	}

  removeEmptyPlayers = () => {
    this.playersOffice = this.playersOffice.filter(p => p && p.id);
  }

	suggestFine = (gravity = "") => {
		let suggest = [];

		for (let i = 0; i < this.players.length; i++) {
			suggest.push({ ...Calc.calcFine(this.players[i], gravity), avatar: this.players[i].avatar, name: this.players[i].name, pollution: this.players[i].pollution, city: this.players[i].city, type: this.players[i].type, logs: this.players[i].logs });
		}

		return suggest;
	}

	applyFine = (player1, player2, gravity) => {
		let fine = this.suggestFine(gravity).find(p => player2.id === p.playerId);
		player1.applyFine(player2, fine, gravity);
	}

	applyPrevention = (player, prevention) => {
		player.applyPrevention(prevention);
		this.match.globalPollution = this.match.globalPollution - this.match.globalPollution * prevention.preventionPercentual;
	}

	applyTax = (player, newTax = null) => {
		if (newTax === null) newTax = INITIALCITYPRODUCTION;

		for (let i = 0; i < this.cities.length; i++) {
			if (this.cities[i].name === player.city) {

				if (this.cities[i].lowProduction !== newTax.lowProduction) {
					this.cities[i].lowProduction = newTax.lowProduction;
					player.applyTax(Calc.calcTax({ lowProduction: newTax.lowProduction }, null), 'Produtividade nula');
				}
				if (this.cities[i].mediumProduction !== newTax.mediumProduction) {
					this.cities[i].mediumProduction = newTax.mediumProduction;
					player.applyTax(Calc.calcTax({ mediumProduction: newTax.mediumProduction }, null), 'Produtividade entre 1 e 200');
				}
				if (this.cities[i].highProduction !== newTax.highProduction) {
					this.cities[i].highProduction = newTax.highProduction;
					player.applyTax(Calc.calcTax({ highProduction: newTax.highProduction }, null), 'Produtividade acima de 200');
				}
			}
		}
	}

	addSuggestTax = (suggest, player) => {
		let oldTax = { ...this.cities.find(c => c.name === player.city) };

		if (suggest.lowProduction && oldTax.lowProduction != suggest.lowProduction) {
			player.addSuggestTax(suggest, Calc.calcTax({ lowProduction: suggest.lowProduction }, null), 'Produtividade nula', 'lowProduction', suggest.lowProduction);
		}
		if (suggest.mediumProduction && oldTax.mediumProduction != suggest.mediumProduction) {
			player.addSuggestTax(suggest, Calc.calcTax({ mediumProduction: suggest.mediumProduction }, null), 'Produtividade entre 1 e 200', 'mediumProduction', suggest.mediumProduction);
		}
		if (suggest.highProduction && oldTax.highProduction != suggest.highProduction) {
			player.addSuggestTax(suggest, Calc.calcTax({ highProduction: suggest.highProduction }, null), 'Produtividade acima de 200', 'highProduction', suggest.highProduction);
		}
	}

	toggleApprovedSuggest = (suggest, status, player) => {
		for (let i = 0; i < this.playersOffice.length; i++) {
			if (this.playersOffice[i].city === player.city && this.playersOffice[i].office === 'Vereador') {
        return suggest.type === 'tax' ? this.toggleApprovedSuggestTax(suggest, player, this.playersOffice[i], status) : this.toggleApprovedSuggestPrevention(suggest, player, this.playersOffice[i], status);
			}
		}
	}

  toggleApprovedSuggestTax = (suggest, mayor, cityCouncilor, status) => {
    let s = cityCouncilor.suggestTax.find(s => s.id === suggest.id);
    let cityProduction = this.cities.find(c => c.name === mayor.city);

    if (s.approved === null) {
      s.approved = status;
      if (status) this.applyTax(mayor, { lowProduction: suggest.category === 'lowProduction' ? suggest.labelValue : cityProduction.lowProduction, mediumProduction: suggest.category === 'mediumProduction' ? suggest.labelValue : cityProduction.mediumProduction, highProduction: suggest.category === 'highProduction' ? suggest.labelValue : cityProduction.highProduction });
    }
    return cityCouncilor;
  }

  toggleApprovedSuggestPrevention = (suggest, mayor, cityCouncilor, status) => {
    let s = cityCouncilor.suggestPrevention.find(s => s.id === suggest.id);

    if (s.approved === null) {
      s.approved = status;
      if (status) this.applyPrevention(mayor, suggest);
    }
    return cityCouncilor;
  }

  disconnectedPlayer = (id) => {
    let now = new Date();
    
    this.match.freezeTimer = now.toISOString();
    this.disconnectedPlayers.push([this.selectPlayer(id), this.selectPlayerOffice(id)]);
  }

	// CONTROL FUNCTIONS

	endStage = (callback) => {
		this.oldLogs = [];

		this.calcGlobalPollution();
		this.calcGlobalProduction();

		for (let i = 0; i < this.playersOffice.length; i++) {
			// this.playersOffice[i].addLogOffice({ type: 'info', production: this.playersOffice[i].production, pollution: this.playersOffice[i].pollution });
			this.oldLogs.push({
				id: this.playersOffice[i].id,
				city: this.playersOffice[i].city,
				office: this.playersOffice[i].office,
				logsOffice: this.playersOffice[i].logsOffice ? this.playersOffice[i].logsOffice : [],
			});
			if (this.playersOffice[i].logsOffice) this.playersOffice[i].resetPlayer();
		}
		this.getPlayerStatus(callback);
	}

	endRound = () => {
		this.oldLogs = [];

		for (let i = 0; i < this.players.length; i++) {
			this.players[i].addLog({ type: 'info', production: this.players[i].production, pollution: this.players[i].pollution });
			this.oldLogs.push({
				id: this.players[i].id,
				city: this.players[i].city,
				logs: [...this.players[i].logs],
			});
			this.players[i].resetPlayer();
		}
	}
}

module.exports = Room;