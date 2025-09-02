const config = require("./utils/config");
const app = require("./app");
const http = require("http");
const { initWebSocket } = require("./websocket");

const server = http.createServer(app);

initWebSocket(server);

const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`Server running with HTTP + WebSocket on port ${PORT}`);
});
