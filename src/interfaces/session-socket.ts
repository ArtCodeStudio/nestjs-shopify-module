import { Socket, Handshake } from 'socket.io';
import { Session } from './session';

export interface SessionHandshake extends Handshake {
  session: Session & Handshake['session'];
}

export interface SessionSocket extends Socket {
  handshake: SessionHandshake;
  id: string;
}