import type { Socket, Handshake } from 'socket.io';
import type { Session } from './session';

export interface SessionHandshake extends Handshake {
  session: Session;
  headers: any;
  time: string;
  address: string;
  xdomain: boolean;
  secure: boolean;
  issued: number;
  url: string;
  query: any;
  auth: any;
}

export interface SessionSocket extends Socket {
  handshake: SessionHandshake;
  id: string;
}