class Calc {
  calcGlobalPollution = (players, globalPollution) => {
    let pollution = 0;
    players.forEach(player => pollution += player.pollution / 10000);

    return (pollution + (globalPollution / 100)) * 100;
  }

  calcGlobalProduction = (globalPollution) => {
    switch (true) {
      case globalPollution < 30: return 100;
      case globalPollution >= 30 && globalPollution < 40: return 90;
      case globalPollution >= 40 && globalPollution < 50: return 80;
      case globalPollution >= 50 && globalPollution < 60: return 70;
      case globalPollution >= 60 && globalPollution < 70: return 60;
      case globalPollution >= 70 && globalPollution < 80: return 40;
      case globalPollution >= 80 && globalPollution < 100: return 20;
      case globalPollution == 100: return 0;
    }
  }

  calcTax = (city, player) => {
    const tax = { value: 0, percentual: null };

    switch (true) {
      case (!player || player.production <= 0) && city.lowProduction === 'Baixo': { tax.value = 5; break; }
      case (!player || player.production <= 0) && city.lowProduction === 'Médio': { tax.value = 10; break; }
      case (!player || player.production <= 0) && city.lowProduction === 'Alto': { tax.value = 15; break; }

      case (!player || (player.production > 0 && player.production)) < 200 && city.mediumProduction === 'Baixo': { tax.percentual = 5; break; }
      case (!player || (player.production > 0 && player.production)) < 200 && city.mediumProduction === 'Médio': { tax.percentual = 10; break; }
      case (!player || (player.production > 0 && player.production)) < 200 && city.mediumProduction === 'Alto': { tax.percentual = 15; break; }

      case (!player || player.production >= 200) && city.highProduction === 'Baixo': { tax.percentual = 25; break; }
      case (!player || player.production >= 200) && city.highProduction === 'Médio': { tax.percentual = 30; break; }
      case (!player || player.production >= 200) && city.highProduction === 'Alto': { tax.percentual = 35; break; }
    }
    tax.value = tax.percentual && player ? player.production * tax.percentual / 100 : tax.value;

    return tax;
  }

  calcFine = (player, gravity = "") => {
    switch (true) {
      case (player.pollution < 90 && gravity === "") || gravity === "Nenhuma": return { playerId: player.id, gravity: "Nenhuma", value: 0 };
      case (player.pollution >= 90 && player.pollution < 120 && gravity === "") || gravity === "Baixa": return { playerId: player.id, gravity: "Baixa", value: player.pollution };
      case (player.pollution >= 120 && player.pollution < 200 && gravity === "") || gravity === "Média": return { playerId: player.id, gravity: "Média", value: player.pollution * 2 };
      case (player.pollution >= 200 && gravity === "") || gravity === "Alta": return { playerId: player.id, gravity: "Alta", value: player.pollution * 3 };
    }
  }
  
  calcSaleProduction = (player, item, amount) => {
    player.production += item.price * amount;
  }

  calcSalePollution = (player, item, amount) => {
    let pollution = item.pollutionEmp * amount;
    player.pollution += pollution;
    return pollution;
  }

  calcParcelPollution = (player, parcelLand, products) => {
    let p = 1;

    products.forEach(prod => {
      if (prod.name === parcelLand.seed || prod.name === parcelLand.pesticide) p *= prod.pollution;
    });
    if (player.parcelLand[parcelLand.id].spray) {
      player.pollution -= (p / 2) / 6;
      player.parcelLand[parcelLand.id].pollution = p / 2;
    } else {
      player.pollution += p / 6;
      player.parcelLand[parcelLand.id].pollution = p;
    }
  }

  calcParcelProduction = (player, parcelLand, products) => {
    let p = 1, bonus = 1;

    products.forEach(prod => {
      if (prod.name === parcelLand.seed || prod.name === parcelLand.fertilizer || prod.name === parcelLand.machine) p *= prod.productive;
      if (prod.name === parcelLand.pesticide) {
        p *= prod.productive;
        if (parcelLand.seed === 'Arroz') bonus = 2;
        if (parcelLand.seed === 'Soja') bonus = 3;
      }
    });
    player.parcelLand[parcelLand.id].production = p * bonus;
    player.production += p * bonus;
  }
}

module.exports = Calc;