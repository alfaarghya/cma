import z from "zod";

// Validation for creating a chat room
export const CreateRoomSchema = z.object({
  roomName: z.string().min(3, "Room name must be at least 3 characters long"),
  userId: z.string().uuid("Invalid user ID format"),
});

//validation for joining room
export const JoinRoomSchema = z.object({
  roomName: z.string().min(3, "Room name must be at least 3 characters long"),
  userId: z.string().uuid()
});

//validate update room
export const UpdateRoomSchema = z.object({
  roomId: z.string().uuid("Invalid room ID format"),
  userId: z.string().uuid("Invalid user ID format"),
  newRoomName: z.string().min(3, "Room name must be at least 3 characters long").optional(),
  removeUserId: z.string().uuid("Invalid user ID format").optional(),
});

//validate delete room
export const DeleteRoomSchema = z.object({
  roomId: z.string().uuid("Invalid room ID format"), // Room ID must be a valid UUID
  userId: z.string().uuid("Invalid admin ID format"), // Admin ID must be a valid UUID
});

//validate get Room details
export const GetRoomDetailsSchema = z.object({
  roomId: z.string().uuid("Invalid room ID format")
})