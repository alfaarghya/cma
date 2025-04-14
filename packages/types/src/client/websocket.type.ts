export interface WebSocketOptions {
  chatId: string;
  type: MessageType;
  userId?: string;
  sender?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMessage: (data: any) => void;
}
type MessageType = "room" | "direct";