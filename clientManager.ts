type client = {
  socketId: string;
  user: any;
  socket: WebSocket;
};

export let clients: any = {};
export let clientsUsers: any = {};
