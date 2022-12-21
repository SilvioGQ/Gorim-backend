const { v4: uuidv4 } = require('uuid');

class Chat {
  
  constructor(players) {
    this.allMessagesStageOne = [];
    this.allMessagesStageTwo = [];
    
    let obj;
    for (let i = 0; i < players.length; i++) {
      obj = { idPlayer: players[i].id, connections: [] }
      
      this.allMessagesStageOne.push(obj);
    }
    
    for (let i = 0; i < players.length; i++) {
      obj = { idPlayer: players[i].id, connections: [] }
      
      this.allMessagesStageTwo.push(obj);
    }
  }
  
  getMessages = (id, stage) => {
    let allMessages = stage === 1 ? this.allMessagesStageOne : this.allMessagesStageTwo;
    
    return allMessages.find(m => m.idPlayer === id).connections;
  }
  
  getGroup = (idPlayer, idGroup, stage) => {
    let allMessages = stage === 1 ? this.allMessagesStageOne : this.allMessagesStageTwo;
    let connections = allMessages.find(m => m.idPlayer === idPlayer).connections;
    
    return connections.find(c => c.id === idGroup);
  }
  
  sendMessage = (messenger, receiver, msg, stage) => {
    let allMessages = stage === 1 ? this.allMessagesStageOne : this.allMessagesStageTwo;
    let player = allMessages.find(m => m.idPlayer === messenger);
    let connection = player.connections.find(c => (c.player1 === messenger && c.player2 === receiver) || c.player1 === receiver && c.player2 === messenger);
    
    if (!connection) {
      this.createConnection(messenger, receiver, stage);
      connection = player.connections.find(c => (c.player1 === messenger && c.player2 === receiver) || c.player1 === receiver && c.player2 === messenger);
    }
    
    connection.messages.push({
      id: uuidv4(),
      sender: messenger,
      message: msg,
      datetime: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    });
  }
  
  sendGroupMessage = (id, messenger, msg, stage, players) => {
    let allMessages = stage === 1 ? this.allMessagesStageOne : this.allMessagesStageTwo;
    let player = allMessages.find(m => m.idPlayer === messenger);
    let connection = player.connections.find(c => c.id === id);
    
    connection.messages.push({
      id: uuidv4(),
      sender: { id: messenger, name: players.find(p => p.id === messenger).name},
      message: msg,
      datetime: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    });
  }
  
  createConnection = (messenger, receiver, stage) => {
    let newConnection = {
      player1: messenger,
      player2: receiver,
      messages: []
    }
    
    let allMessages = stage === 1 ? this.allMessagesStageOne : this.allMessagesStageTwo;
    allMessages.find(m => m.idPlayer === messenger).connections.push(newConnection);
    allMessages.find(m => m.idPlayer === receiver).connections.push(newConnection);
  }
  
  createGroupConnection = (players) => {
    let farmers = players.filter(p => p.type === "Agricultor").map(p => p.id);
    let buss = players.filter(p => p.type === "Empresário").map(p => p.id);
    
    let newConnectionFarmers = {
      id: uuidv4(),
      name: "Agricultores",
      players: farmers,
      messages: []
    }
    
    let newConnectionBusinessman = {
      id: uuidv4(),
      name: "Empresários",
      players: buss,
      messages: []
    }
    
    let bussGroups = [], group = {};
    
    for (let i = 0; i < players.length; i++) {
      
      if (players[i].type === "Empresário") {
        this.allMessagesStageOne.find(m => m.idPlayer === players[i].id).connections.push(newConnectionBusinessman);
        
        group = {
          id: uuidv4(),
          name: `Empresário de ${players[i].specialty} e agricultores`,
          players: [players[i].id, ...farmers],
          messages: []
        }
        bussGroups.push(group);
        this.allMessagesStageOne.find(m => m.idPlayer === players[i].id).connections.push(group);
      }
      
      if (players[i].type === "Agricultor") {
        this.allMessagesStageOne.find(m => m.idPlayer === players[i].id).connections.push(newConnectionFarmers);
        
        for (let j = 0; j < bussGroups.length; j++) {
          this.allMessagesStageOne.find(m => m.idPlayer === players[i].id).connections.push({ ...bussGroups[j] });
        }
      }
    }
  }
  
  reconnectPlayer = (oldId, newId) => {
    let messages = this.allMessagesStageOne;
    let messages2 = this.allMessagesStageTwo;
    
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].idPlayer == oldId) messages[i].idPlayer = newId;
      if (messages2[i].idPlayer == oldId) messages2[i].idPlayer = newId;
      
      for (let j = 0; j < messages[i].connections.length; j++) {
        if (messages[i].connections[j].player1) {
          if (messages[i].connections[j].player1 == oldId) messages[i].connections[j].player1 = newId;
          if (messages[i].connections[j].player2 == oldId) messages[i].connections[j].player2 = newId;
          
        } else {
          
          if (messages[i].connections[j].players.indexOf(oldId) != -1) {
            messages[i].connections[j].players[messages[i].connections[j].players.indexOf(oldId)] = newId;
          }
        }
      }
      
      for (let j = 0; j < messages2[i].connections.length; j++) {
        if (messages2[i].connections[j].player1) {
          
          if (messages2[i].connections[j].player1 == oldId) messages2[i].connections[j].player1 = newId;
          if (messages2[i].connections[j].player2 == oldId) messages2[i].connections[j].player2 = newId;
        } else {
          
          if (messages2[i].connections[j].players.indexOf(oldId) != -1) {
            messages2[i].connections[j].players[messages2[i].connections[j].players.indexOf(oldId)] = newId;
          }
        }
      }
    }
  }
}

module.exports = Chat;