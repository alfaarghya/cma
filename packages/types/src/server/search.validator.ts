import z from "zod";

//validate user search
export const UserSearchSchema = z.object({
  username: z.string(),
});
