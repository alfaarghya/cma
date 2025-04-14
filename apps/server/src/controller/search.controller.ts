import { Request, Response } from "express";
import prisma from "@cma/db/prisma";
import { Status, StatusMessages } from "../statusCode/response";
import { UserSearchSchema } from "@cma/types/serverTypes";

//search a user by their name
export const searchUser = async (req: Request, res: Response) => {
  try {
    //validate request body
    const validation = UserSearchSchema.safeParse(req.query);
    if (!validation.success) {
      res.status(Status.InvalidInput).json({
        status: Status.InvalidInput,
        statusMessage: StatusMessages[Status.InvalidInput],
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
      return;
    }

    //get valid data
    const { username } = validation.data;

    // Find users where username partially matches the search input
    const matchUsers = await prisma.user.findMany({
      where: {
        username: {
          contains: username, // Case-insensitive search
          mode: "insensitive",
        },
      },
      select: { id: true, username: true },
    });

    //check for matched username
    if (!matchUsers) {
      res.status(Status.NoContent).json({
        status: Status.NoContent,
        statusMessage: StatusMessages[Status.NoContent],
        message: "no user found with username",
        users: matchUsers,
      });
      return;
    }

    res.status(Status.Success).json({
      status: Status.Success,
      statusMessage: StatusMessages[Status.Success],
      message: "found users",
      users: matchUsers,
    });
    return;
  } catch (error) {
    console.error("Error searching user:", error);
    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Error searching user",
    });
    return;
  }
};
