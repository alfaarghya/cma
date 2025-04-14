import { Request, Response } from "express";
import { Status, StatusMessages } from "../statusCode/response";
import prisma from "@cma/db/prisma";
// import { decryptMessage } from "@chatApp/utils";
import {
  CreateRoomSchema,
  DeleteRoomSchema,
  GetMessagesSchema,
  GetRoomDetailsSchema,
  GetUserChatsSchema,
  JoinRoomSchema,
  UpdateRoomSchema,
} from "@cma/types/serverTypes";

//get the list of rooms & inbox
export const getUserChats = async (req: Request, res: Response) => {
  try {
    //validate request body
    const validation = GetUserChatsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(Status.InvalidInput).json({
        status: Status.InvalidInput,
        statusMessage: StatusMessages[Status.InvalidInput],
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
      return;
    }

    //get valid data
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

    //filter rooms
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
    });

    // Deduplicate and exclude self
    const userMap = new Map<string, { id: string; username: string }>();

    inboxUsers.forEach(({ sender, receiver }) => {
      if (sender && sender.id !== userId) {
        userMap.set(sender.id, sender);
      }
      if (receiver && receiver.id !== userId) {
        userMap.set(receiver.id, receiver);
      }
    });

    const inbox = Array.from(userMap.values());

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

// Get chat history
export const getMessages = async (req: Request, res: Response) => {
  try {
    //validate request body
    const validation = GetMessagesSchema.safeParse({
      userId: req.body.userId,
      chatId: req.params.chatId,
      type: req.query.type,
    });

    if (!validation.success) {
      res.status(Status.InvalidInput).json({
        status: Status.InvalidInput,
        statusMessage: StatusMessages[Status.InvalidInput],
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
      return;
    }

    //get valid data
    const { userId, chatId, type } = validation.data;
    let content;

    //get the room messages
    if (type == "roomMessage") {
      // Ensure the user is part of the room
      const isUserInRoom = await prisma.userChatRoom.findUnique({
        where: {
          userId_roomId: { userId, roomId: chatId },
        },
      });

      //user is not in the room
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
        where: { roomId: chatId },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { username: true } } },
      });

      //get the inbox messages
    } else if (type === "directMessage") {
      // Fetch direct messages only if the user is a sender or receiver
      content = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: chatId },
            { senderId: chatId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { username: true } } },
      });

      //no type is provided
    } else {
      res.status(Status.NotFound).json({
        status: Status.NotFound,
        statusMessage: StatusMessages[Status.NotFound],
        messages: "type is not provided",
      });
      return;
    }

    // send sender name with content
    content = content.map((msg) => ({
      ...msg,
      sender: msg.sender.username,
    }));
    // content = content.map(msg => ({ ...msg, content: decryptMessage(msg.content) }));

    res.status(Status.Success).json({
      status: Status.Success,
      statusMessage: StatusMessages[Status.Success],
      messages: "messages retrieve successfully",
      content,
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
  try {
    //validate request body
    const validation = CreateRoomSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(Status.InvalidInput).json({
        status: Status.InvalidInput,
        statusMessage: StatusMessages[Status.InvalidInput],
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
      return;
    }

    //get valid data
    const { roomName, userId } = validation.data;

    // room already exists -> can't create new room
    const existingRoom = await prisma.chatRoom.findFirst({
      where: { name: roomName },
    });
    if (existingRoom) {
      res.status(Status.Conflict).json({
        status: Status.Conflict,
        statusMessage: StatusMessages[Status.Conflict],
        message: "Room already exists, choose a unique name",
      });
      return;
    }

    //create a room
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
  try {
    //validate the requested data
    const validation = GetRoomDetailsSchema.safeParse({ roomId: req.params.roomId });
    if (!validation.success) {
      res.status(Status.InvalidInput).json({
        status: Status.InvalidInput,
        statusMessage: StatusMessages[Status.InvalidInput],
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
      return;
    }

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
      });
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
        users,
      },
    });
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
};

// Join a chat room
export const joinRoom = async (req: Request, res: Response) => {
  try {
    //validate request data
    const validation = JoinRoomSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(Status.InvalidInput).json({
        status: Status.InvalidInput,
        statusMessage: StatusMessages[Status.InvalidInput],
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
      return;
    }

    //get valid data
    const { roomName, userId } = validation.data;

    //check for the room with roomName
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

    //check for existing members
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

    // add user into room
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
  try {
    //validate request data
    const validation = UpdateRoomSchema.safeParse({
      roomId: req.params.roomId,
      ...req.body,
    });
    if (!validation.success) {
      res.status(Status.InvalidInput).json({
        status: Status.InvalidInput,
        statusMessage: StatusMessages[Status.InvalidInput],
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
      return;
    }

    //get valid data
    const { roomId, userId, newRoomName, removeUserId } = validation.data;

    //search for room in db
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    //check if current user is admin of room
    if (!room || room.roomAdminId !== userId) {
      res.status(Status.Forbidden).json({
        status: Status.Forbidden,
        statusMessage: StatusMessages[Status.Forbidden],
        message: "Only the room admin can update this room",
      });
      return;
    }

    //update room name
    if (newRoomName) {
      const updateRoom = await prisma.chatRoom.update({
        where: { id: roomId },
        data: { name: newRoomName },
      });

      res.status(Status.Success).json({
        status: Status.Success,
        statusMessage: StatusMessages[Status.Success],
        message: "Room updated successfully",
        room: updateRoom,
      });
      return;
    }

    //kick a member
    if (removeUserId) {
      //user is not a member of the room
      if (
        await prisma.userChatRoom.findFirst({
          where: { userId: removeUserId },
        })
      ) {
        res.status(Status.NotFound).json({
          status: Status.NotFound,
          statusMessage: StatusMessages[Status.NotFound],
          message: `${removeUserId} is Not in this room`,
        });
        return;
      }

      //remove member
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
  try {
    //validate request body
    const validation = DeleteRoomSchema.safeParse({
      userId: req.body.userId,
      roomId: req.params.roomId,
    });

    if (!validation.success) {
      res.status(Status.InvalidInput).json({
        status: Status.InvalidInput,
        statusMessage: StatusMessages[Status.InvalidInput],
        message: validation.error.errors.map((err) => err.message).join(", "),
      });
      return;
    }

    //get valid data
    const { roomId, userId } = validation.data;

    //check for room
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

    // check if user is admin of the room
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
      where: { roomId: roomId },
    });

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
