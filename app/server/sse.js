// sse.js
const clients = {};

function addClient(clientId, res) {
  clients[clientId] = res;
}

function removeClient(clientId) {
  delete clients[clientId];
}

function sendEvent(clientId, event) {
  if (clients[clientId]) {
    clients[clientId].write(`data: ${JSON.stringify(event)}\n\n`);
  } else {
    console.warn(`No SSE connection found for clientId: ${clientId}`);
  }
}

module.exports = { addClient, removeClient, sendEvent, clients };
