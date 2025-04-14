
export interface ChatRoom {
  id: string;
  name: string;
  createdAt: string;
}

export interface InboxUser {
  id: string;
  username: string;
}

export interface User {
  id: string;
  username: string;
}

export interface Message {
  id?: string;
  senderId: string;
  content: string;
  createdAt?: string;
  sender: string;
}