export interface Message {
  notification_type: string;
  name: string;
  message: string;
}

export interface SingleMessage {
  id: number;
  created_at: string;
  notification_type: string;
  name: string;
  message: string;
}

export interface SendPush {
  notification_type: string;
  email: string;
}
