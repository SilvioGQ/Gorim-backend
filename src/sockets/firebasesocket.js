const FunctionalityService = require('../firebase/FunctionalityService');

module.exports = function (Game, socket) {
  socket.on('getProducts', (name = null) => {

    if (name) {
      return FunctionalityService.getProduct(name).then(res => {
        socket.emit('getProducts', res);
      });
    } else {
      return FunctionalityService.getProducts().then(res => {
        socket.emit('getProducts', res);
      });
    }
  });

  socket.on('getPreventions', () => {
    FunctionalityService.getPreventions().then(res => {
      socket.emit('getPreventions', res);
    });
  });

  socket.on('getCityTax', () => {
    let room = Game.selectRoom(socket.roomId);
    let player = room.selectPlayer(socket.id);
    
    FunctionalityService.getTaxs().then(res => {
      let cityProduction = room.cities.find(c => c.name === player.city);

      let lowProduction = res.filter(tax => tax.label === 'Produtividade nula').sort((a, b) => a - b);
      let mediumProduction = res.filter(tax => tax.label === 'Produtividade entre 1 e 200').sort((a, b) => a - b);
      let highProduction = res.filter(tax => tax.label === 'Produtividade acima de 200').sort((a, b) => a - b);
      
      selectTax(lowProduction, cityProduction.lowProduction);
      selectTax(mediumProduction, cityProduction.mediumProduction);
      selectTax(highProduction, cityProduction.highProduction);
      
	    console.log(res)
      socket.emit('getCityTax', res);
    });

  });

  const selectTax = (allTax, tax) => {
    if (tax === 'Baixo') allTax[0].selected = true;
    if (tax === 'Médio') allTax[1].selected = true;
    if (tax === 'Alto') allTax[2].selected = true;
  }
}