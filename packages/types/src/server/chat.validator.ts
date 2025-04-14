import z from "zod";

//validation for list
export const GetUserChatsSchema = z.object({
  userId: z.string().uuid("User ID is required"),
});
