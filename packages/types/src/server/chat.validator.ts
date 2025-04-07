import z from "zod";

//validation for list
export const GetUserChatsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});