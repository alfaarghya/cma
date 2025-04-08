import { Request, Response } from "express";
import { Status, StatusMessages } from "../statusCode/response";
import prisma from "@cma/db/prisma";
// import { decryptMessage } from "@chatApp/utils";
import { CreateRoomSchema, DeleteRoomSchema, GetMessagesSchema, GetRoomDetailsSchema, GetUserChatsSchema, JoinRoomSchema, UpdateRoomSchema } from "@cma/types/serverTypes";

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

// get the room details, roomName, created date, users{userIds, usernames}
export const getRoomDetails = async (req: Request, res: Response) => {
  //validate the requested data
  const validation = GetRoomDetailsSchema.safeParse({ roomId: req.params.roomId });
  if (!validation.success) {
    res.status(Status.InvalidInput).json({
      status: Status.InvalidInput,
      statusMessage: StatusMessages[Status.InvalidInput],
      message: validation.error.errors.map(err => err.message).join(", "),
    });
    return;
  }

  try {
    //get valid data
    const { roomId } = validation.data;

    //find the room in db
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });

    //room was not in db
    if (!room) {
      res.status(Status.NotFound).json({
        status: Status.NotFound,
        statusMessage: StatusMessages[Status.NotFound],
        message: "No room found",
      })
      return;
    }

    //mapping userId & username 
    const users = room.users.map((userChatRoom) => ({
      userId: userChatRoom.user.id,
      username: userChatRoom.user.username,
    }));

    //successfully send the data
    res.status(Status.Success).json({
      status: Status.Success,
      statusMessage: StatusMessages[Status.Success],
      message: "Room details found successfully",
      room: {
        roomName: room.name,
        createdAt: room.createdAt,
        users
      }
    })
    return;
  } catch (error) {
    console.error("Error getting the room details:", error);
    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Error getting the room details",
    });
    return;
  }
}

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

// Update room (rename or remove user)
export const updateRoom = async (req: Request, res: Response) => {
  const validation = UpdateRoomSchema.safeParse({
    roomId: req.params.roomId,
    ...req.body
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
    const { roomId, userId, newRoomName, removeUserId } = validation.data;

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || room.roomAdminId !== userId) {
      res.status(Status.Forbidden).json({
        status: Status.Forbidden,
        statusMessage: StatusMessages[Status.Forbidden],
        message: "Only the room admin can update this room",
      });
      return;
    }

    if (newRoomName) {
      const updateRoom = await prisma.chatRoom.update({
        where: { id: roomId },
        data: { name: newRoomName },
      });

      res.status(Status.Success).json({
        status: Status.Success,
        statusMessage: StatusMessages[Status.Success],
        message: "Room updated successfully",
        room: updateRoom
      });
      return;
    }

    if (removeUserId) {
      if (await prisma.userChatRoom.findFirst({
        where: { userId: removeUserId }
      })) {
        res.status(Status.NotFound).json({
          status: Status.NotFound,
          statusMessage: StatusMessages[Status.NotFound],
          message: `${removeUserId} is Not in this room`,
        });
        return;
      }
      await prisma.userChatRoom.deleteMany({
        where: { roomId, userId: removeUserId },
      });

      res.status(Status.Success).json({
        status: Status.Success,
        statusMessage: StatusMessages[Status.Success],
        message: `${removeUserId} removed from room`,
      });
      return;
    }

  } catch (error) {
    console.error("Error updating room:", error);
    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Error updating room",
    });
    return;
  }
};

// Delete a chat room (only by admin)
export const deleteRoom = async (req: Request, res: Response) => {
  const validation = DeleteRoomSchema.safeParse({
    userId: req.body.userId,
    roomId: req.params.roomId
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
    const { roomId, userId } = validation.data;

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      res.status(Status.NotFound).json({
        status: Status.NotFound,
        statusMessage: StatusMessages[Status.NotFound],
        message: "Room not found",
      });
      return;
    }

    if (room.roomAdminId !== userId) {
      res.status(Status.Forbidden).json({
        status: Status.Forbidden,
        statusMessage: StatusMessages[Status.Forbidden],
        message: "Only the room admin can delete this room",
      });
      return;
    }

    //delete room
    await prisma.chatRoom.delete({
      where: { id: roomId },
    });

    //delete all chats
    await prisma.message.deleteMany({
      where: { roomId: roomId }
    })

    res.status(Status.Success).json({
      status: Status.Success,
      statusMessage: StatusMessages[Status.Success],
      message: "Room deleted successfully",
    });
    return;

  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(Status.InternalServerError).json({
      status: Status.InternalServerError,
      statusMessage: StatusMessages[Status.InternalServerError],
      message: "Error deleting room",
    });
    return;
  }
};
