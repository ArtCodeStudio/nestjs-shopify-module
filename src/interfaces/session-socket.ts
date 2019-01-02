import { Socket, Handshake } from 'socket.io';
import { Session } from './session'

export interface SessionHandshake extends Handshake {
  session: Session;
}

export interface SessionSocket extends Socket {
  handshake: SessionHandshake;
  id: string;
}