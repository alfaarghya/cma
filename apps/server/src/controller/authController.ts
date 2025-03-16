import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserSignInSchema, UserSignUpSchema } from "@cma/types/serverTypes";
import prisma from "@cma/db/prisma";
import { Status, StatusMessages } from "../statusCode/response";
import { COOKIE_OPTIONS } from "../utils/cookieOptions";

// User Signup Controller
export const signup = async (req: Request, res: Response) => {
  const validation = UserSignUpSchema.safeParse(req.body);
  
  // check: if the request body is valid
  if (!validation.success) {
    res.status(Status.InvalidInput).json({
      status: Status.InvalidInput,
      statusMessage: StatusMessages[Status.InvalidInput],
      message: "Invalid input, please check your input and try again",
      errors: validation.error.errors,
    });
    return;
  }

  const { username, email, password } = validation.data;

  try {
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      res.status(Status.Conflict).json({
        status: Status.Conflict,
        statusMessage: StatusMessages[Status.Conflict],
        message: "Username or email already exists",
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email },
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // Set token in cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(Status.Success).json({
      status: Status.Success,
      statusMessage: StatusMessages[Status.Success],
      message: "Account created successfully",
      username: newUser.username,
    });
    return;
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Internal server error, please try again later",
    });
    return;
  }
};

// User Signin Controller
export const signin = async (req: Request, res: Response) => {
  const validation = UserSignInSchema.safeParse(req.body);
  // check: if the request body is valid
  if (!validation.success) {
    res.status(Status.InvalidInput).json({
      status: Status.InvalidInput,
      statusMessage: StatusMessages[Status.InvalidInput],
      message: "Invalid input, please check your input and try again",
      errors: validation.error.errors,
    });
    return;
  }

  const { username, password } = validation.data;

  try {
    // Find user
    const user = await prisma.user.findFirst({ where: { username } });

    if (!user) {
      res.status(Status.NotFound).json({
        status: Status.NotFound,
        statusMessage: StatusMessages[Status.NotFound],
        message: "User not found, please sign up first",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(Status.Forbidden).json({
        status: Status.Forbidden,
        statusMessage: StatusMessages[Status.Forbidden],
        message: "Incorrect password, please try again",
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // Set token in cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(Status.Success).json({
      status: Status.Success,
      statusMessage: StatusMessages[Status.Success],
      message: "Signed in successfully",
      username: user.username,
    });
    return;
  } catch (error) {
    console.error("Error in signin:", error);
    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Internal server error, please try again later",
    });
    return;
  }
};