const INITIALCOINMAYOR = 1000, INITIALCOINSUPERVISOR = 0, INITIALCOINCITYCOUNCILOR = 0;

class Elections {

  constructor() {
    this.salaryOffices = {
      'Atlantis': {
        supervisor: INITIALCOINSUPERVISOR, cityCouncilor: INITIALCOINCITYCOUNCILOR, mayor: INITIALCOINMAYOR,
      },
      'Cidadela': {
        supervisor: INITIALCOINSUPERVISOR, cityCouncilor: INITIALCOINCITYCOUNCILOR, mayor: INITIALCOINMAYOR,
      }
    }
  }

	createElection = () => {
		this.election = {
			'Atlantis': {
				supervisor: [], cityCouncilor: [], mayor: [],
			},
			'Cidadela': {
				supervisor: [], cityCouncilor: [], mayor: [],
			}
		}
	}

	addCandidate = (player, candidature) => {
		let cityElections = this.election[player.city];

		if (this.removeCandidate(cityElections, player.id)) {
			let obj = { id: player.id, votes: 0 };

			if (candidature === 'Fiscal') cityElections.supervisor.push(obj);
			if (candidature === 'Vereador') cityElections.cityCouncilor.push(obj);
			if (candidature === 'Prefeito') cityElections.mayor.push(obj);
		}
	}

	removeCandidate = (cityElections, id) => {
		cityElections.supervisor = cityElections.supervisor.filter(candidate => candidate.id != id);
		cityElections.cityCouncilor = cityElections.cityCouncilor.filter(candidate => candidate.id != id);
		cityElections.mayor = cityElections.mayor.filter(candidate => candidate.id != id);

		return true;
	}

	getElections = (player) => {
		return this.election[player.city];
	}

  updateElections = (player, newId) => {
    if (!this.elections) return;
    
    let elections = this.getElections(player);

    for (let i = 0; i < elections.supervisor.length; i++) {
      if (elections.supervisor[i].id == player.id) elections.supervisor[i].id = newId;
    }
    for (let i = 0; i < elections.cityCouncilor.length; i++) {
      if (elections.cityCouncilor[i].id == player.id) elections.cityCouncilor[i].id = newId;
    }
    for (let i = 0; i < elections.mayor.length; i++) {
      if (elections.mayor[i].id == player.id) elections.mayor[i].id = newId;
    }
  }

	addVote = (player, votes) => {
		let cityElections = this.election[player.city];

    if (votes.supervisor !== '') cityElections.supervisor.find(candidate => candidate.id === votes.supervisor).votes++;
    if (votes.cityCouncilor !== '') cityElections.cityCouncilor.find(candidate => candidate.id === votes.cityCouncilor).votes++;
    if (votes.mayor !== '') cityElections.mayor.find(candidate => candidate.id === votes.mayor).votes++;
	}

	getWinners = () => {
		let city1 = this.election['Atlantis'];
		let city2 = this.election['Cidadela'];

		city1.supervisor.sort(function (a, b) { return b.votes - a.votes; });
		city1.cityCouncilor.sort(function (a, b) { return b.votes - a.votes; });
		city1.mayor.sort(function (a, b) { return b.votes - a.votes; });

		city2.supervisor.sort(function (a, b) { return b.votes - a.votes; });
		city2.cityCouncilor.sort(function (a, b) { return b.votes - a.votes; });
		city2.mayor.sort(function (a, b) { return b.votes - a.votes; });

		return { city1, city2 };
	}
}

module.exports = Elections;