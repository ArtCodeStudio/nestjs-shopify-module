import type { Socket } from "socket.io";
import type { SessionData, Session as ExpressSession } from "express-session";
import type { Session } from "./session";

export interface SessionHandshake {
  session?: Session & ExpressSession & Partial<SessionData>;
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
