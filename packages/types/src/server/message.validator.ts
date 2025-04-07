import z from "zod";

// Validation for retrieving messages
export const GetMessagesSchema = z.object({
  userId: z.string().uuid(),
  inboxId: z.string().uuid().optional(), // Required for direct messages
  roomId: z.string().uuid().optional(), // Required for room messages
}).refine((data) => data.userId || data.roomId, {
  message: "Must provide either userId (for direct messages) or roomId (for room messages)",
});