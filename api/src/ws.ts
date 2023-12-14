import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';

type MessageType = any;

export class WSClient extends EventEmitter {
  id = nanoid();
  readonly firstSeen = new Date();
  lastSeen = new Date();

  constructor(private ws: WebSocket) {
    super();

    ws.on('error', error => {
      console.log('[ERROR (Handled)]', error.message);
    });

    ws.on('message', (data: string) => {
      this.lastSeen = new Date();
      try {
        this.emit('message', JSON.parse(data));
      } catch {}
    });
  }

  send(message: MessageType) {
    this.sendRaw(JSON.stringify(message));
  }

  sendRaw(data: string) {
    if (this.ws.readyState !== 1) {
      return;
    }

    this.ws.send(data);
  }

  get readyState() {
    return this.ws.readyState;
  }

  close() {
    this.ws.close();
  }
}

export class ClientManager extends EventEmitter {
  private clients = new Set<WSClient>();

  constructor() {
    super();

    setInterval(() => {
      this.purge();
    }, 1000);

    // Ping clients to keep the connection alive (when behind nginx)
    setInterval(() => {
      this.ping();
    }, 5000);
  }

  add(ws: WebSocket) {
    const client = new WSClient(ws);
    this.clients.add(client);
    return client;
  }

  broadcast(message: MessageType) {
    const data = JSON.stringify(message);

    for (const client of this.clients) {
      try {
        client.sendRaw(data);
      } catch {
        this.remove(client);
        client.close();
      }
    }
  }

  ping() {
    const pingMessage: MessageType = {
      event: 'ping',
      data: new Date().getTime(),
    };

    this.broadcast(pingMessage);
  }

  remove(client: WSClient) {
    this.clients.delete(client);
  }

  purge() {
    const minuteAgo = new Date(Date.now() - 1000 * 20);

    for (const client of this.clients) {
      // Remove clients that don't respond to pings.
      if (client.readyState === 1) {
        if (client.lastSeen < minuteAgo) {
          this.remove(client);
          client.close();
        }
      }

      // Remove closing/closed clients.
      if (client.readyState > 1) {
        this.remove(client);
      }
    }
  }
}
