import z from "zod";
import { UserSignInSchema, UserSignUpSchema } from "../server";

export type SignUpFormData = z.infer<typeof UserSignUpSchema>;

export type SignInFormData = z.infer<typeof UserSignInSchema>;
