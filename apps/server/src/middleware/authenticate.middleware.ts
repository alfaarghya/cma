import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Status, StatusMessages } from "../statusCode/response";

// Auth middleware using JWT stored in cookies
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get JWT token from cookies
    const token = req.cookies?.token;

    // If no token is provided, return unauthorized response
    if (!token) {
      res.status(Status.Unauthorized).json({
        status: Status.Unauthorized,
        statusMessage: StatusMessages[Status.Unauthorized],
        message: "Authentication required. Please log in.",
      });
      return;
    }

    // Verify the token
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    if (decoded && decoded.id && decoded.username && decoded.email) {
      // Attach user details to the request
      req.body = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        ...req.body, // Keep existing request body
      };

      next(); //Proceed to the next middleware or route handler
    } else {
      res.status(Status.Unauthorized).json({
        status: Status.Unauthorized,
        statusMessage: StatusMessages[Status.Unauthorized],
        message: "Invalid token. Please log in again.",
      });
      return;
    }
  } catch (error) {
    console.error("JWT verification error:", error);

    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Internal server error. Please try again later.",
    });
    return;
  }
};

export default authenticate;