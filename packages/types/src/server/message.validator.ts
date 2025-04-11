import z from "zod";

// Validation for retrieving messages
export const GetMessagesSchema = z.object({
  userId: z.string().uuid("User ID is required"),
  chatId: z.string().uuid("room or inbox id is required"),
  type: z.string().nonempty("can't leave empty")
});