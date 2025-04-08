import { Request, Response } from "express";
import { Status, StatusMessages } from "../statusCode/response";
import prisma from "@cma/db/prisma";
// import { decryptMessage } from "@chatApp/utils";
import { GetUserChatsSchema } from "@cma/types/serverTypes";

//get the list of rooms & inbox
export const getUserChats = async (req: Request, res: Response) => {
  const validation = GetUserChatsSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(Status.InvalidInput).json({
      status: Status.InvalidInput,
      statusMessage: StatusMessages[Status.InvalidInput],
      message: validation.error.errors.map(err => err.message).join(", "),
    });
    return;
  }

  try {
    const { userId } = validation.data;

    // Get rooms the user is in
    const userRooms = await prisma.userChatRoom.findMany({
      where: { userId },
      include: {
        room: {
          select: { id: true, name: true, createdAt: true },
        },
      },
    });

    const chatRooms = userRooms.map(({ room }) => room);

    // Get users the user has exchanged direct messages with
    const inboxUsers = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
      distinct: ["senderId", "receiverId"],
    });

    // Format inbox users to exclude the logged-in user
    const inbox = inboxUsers
      .flatMap(({ sender, receiver }) => [sender, receiver])
      .filter(user => user && user.id !== userId);

    res.status(Status.Success).json({
      status: Status.Success,
      statusMessage: StatusMessages[Status.Success],
      chatRooms,
      inbox,
    });
    return;
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Error fetching user chats",
    });
    return;
  }
};


