import { z } from "zod";

// User Signup Schema
export const UserSignUpSchema = z.object({
  username: z.string().max(25),
  email: z.string().email(),
  password: z.string().min(8),
});

// User Signin Schema
export const UserSignInSchema = z.object({
  username: z.string().max(25),
  password: z.string().min(8),
});
