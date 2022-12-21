const { serverHttp, io } = require("./app");

let Game = require('./src/resources/Game');
Game = new Game;

require('./src/websocket')(io, Game);

serverHttp.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on port ${process.env.PORT || 3000}`);
});