import { Request, Response } from "express";
import { Status, StatusMessages } from "../statusCode/response";
import prisma from "@cma/db/prisma";
// import { decryptMessage } from "@chatApp/utils";
import { CreateRoomSchema, GetMessagesSchema, GetUserChatsSchema, JoinRoomSchema } from "@cma/types/serverTypes";

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

// Get messages
export const getMessages = async (req: Request, res: Response) => {
  const validation = GetMessagesSchema.safeParse({
    userId: req.body.userId,
    inboxId: req.params.roomOrInboxId,
    roomId: req.params.roomOrInboxId
  });
  if (!validation.success) {
    res.status(Status.InvalidInput).json({
      status: Status.InvalidInput,
      statusMessage: StatusMessages[Status.InvalidInput],
      message: validation.error.errors.map(err => err.message).join(", "),
    });
    return;
  }

  try {
    const { userId, inboxId, roomId } = validation.data;
    let content;

    if (roomId) {
      // Ensure the user is part of the room
      const isUserInRoom = await prisma.userChatRoom.findUnique({
        where: {
          userId_roomId: { userId, roomId },
        },
      });

      if (!isUserInRoom) {
        res.status(Status.Forbidden).json({
          status: Status.Forbidden,
          statusMessage: StatusMessages[Status.Forbidden],
          message: "You are not a member of this chat room.",
        });
        return;
      }

      //Fetch messages from the room
      content = await prisma.message.findMany({
        where: { roomId },
        orderBy: { createdAt: "asc" },
      });

    } else {
      // Fetch direct messages only if the user is a sender or receiver
      content = await prisma.message.findMany({
        where: {
          senderId: userId, receiverId: inboxId
        },
        orderBy: { createdAt: "asc" },
      });
    }

    content = content.map(msg => ({ ...msg }));
    // content = content.map(msg => ({ ...msg, content: decryptMessage(msg.content) }));

    res.status(Status.Success).json({
      status: Status.Success,
      statusMessage: StatusMessages[Status.Success],
      messages: "messages retrieve successfully",
      content
    });
    return;
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Error fetching messages",
    });
    return;
  }
};

// Create a chat room and assign the creator as the admin
export const createRoom = async (req: Request, res: Response) => {
  const validation = CreateRoomSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(Status.InvalidInput).json({
      status: Status.InvalidInput,
      statusMessage: StatusMessages[Status.InvalidInput],
      message: validation.error.errors.map(err => err.message).join(", "),
    });
    return;
  }

  try {
    const { roomName, userId } = validation.data;

    const existingRoom = await prisma.chatRoom.findFirst({
      where: { name: roomName }
    });

    if (existingRoom) {
      res.status(Status.Conflict).json({
        status: Status.Conflict,
        statusMessage: StatusMessages[Status.Conflict],
        message: "Room already exists, choose a unique name",
      });
      return;
    }

    const room = await prisma.chatRoom.create({
      data: {
        name: roomName,
        roomAdminId: userId, // Set the creator as admin
        users: { create: { userId } }, // Add creator to room
      },
    });

    res.status(Status.Success).json({
      status: Status.Success,
      statusMessage: StatusMessages[Status.Success],
      message: "Chat room created successfully",
      room,
    });
    return;

  } catch (error) {
    console.error("Error creating room:", error);
    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Error creating room",
    });
    return;
  }
};

// Join a chat room
export const joinRoom = async (req: Request, res: Response) => {
  const validation = JoinRoomSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(Status.InvalidInput).json({
      status: Status.InvalidInput,
      statusMessage: StatusMessages[Status.InvalidInput],
      message: validation.error.errors.map(err => err.message).join(", "),
    });
    return;
  }

  try {
    const { roomName, userId } = validation.data;

    const room = await prisma.chatRoom.findUnique({
      where: { name: roomName },
    });

    if (!room) {
      res.status(Status.NotFound).json({
        status: Status.NotFound,
        statusMessage: StatusMessages[Status.NotFound],
        message: "Chat room not found",
      });
      return;
    }

    const existingMembership = await prisma.userChatRoom.findUnique({
      where: {
        userId_roomId: { userId, roomId: room.id },
      },
    });

    if (existingMembership) {
      res.status(Status.Success).json({
        status: Status.Success,
        statusMessage: StatusMessages[Status.Success],
        message: `User is already in room ${room.name}`,
        room,
      });
      return;
    }

    await prisma.userChatRoom.create({
      data: {
        userId,
        roomId: room.id,
      },
    });

    res.status(Status.Success).json({
      status: Status.Success,
      statusMessage: StatusMessages[Status.Success],
      message: `User joined room ${room.name} successfully`,
      room,
    });
    return;

  } catch (error) {
    console.error("Error joining room:", error);
    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Error joining room",
    });
    return;
  }
};
