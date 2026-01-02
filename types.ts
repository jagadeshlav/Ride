
export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
}

export interface Rider {
  id: string;
  name: string;
  color: string;
  location: Location;
  status: RiderStatus;
  isMe?: boolean;
}

export enum RiderStatus {
  RIDING = 'RIDING',
  STOPPED = 'STOPPED',
  OFFLINE = 'OFFLINE',
  EMERGENCY = 'EMERGENCY'
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  riders: Rider[];
  startTime: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isAi?: boolean;
}
