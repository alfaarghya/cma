import { z } from "zod";

// User Signup Schema
export const UserSignUpSchema = z.object({
  name: z.string().max(50).nonempty("Name can't be empty"),
  username: z.string().max(25, "user name must be within 25 characters").nonempty("username can't be empty"),
  email: z.string().email().nonempty("email can't be empty"),
  password: z.string().min(8, "password need to be at least 8 characters").nonempty("password can't be empty"),
});

// User Signin Schema
export const UserSignInSchema = z.object({
  username: z.string().max(25, "user name must be within 25 characters").nonempty("username can't be empty"),
  password: z.string().min(8, "password need to be at least 8 characters").nonempty("password can't be empty"),
});
