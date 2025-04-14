import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
// import { encryptMessage } from "@chatApp/utils";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("🌱 Seeding database...");

  // Hash passwords before storing
  const alicePassword = await hashPassword("password123");
  const bobPassword = await hashPassword("password456");
  const charliePassword = await hashPassword("password789");

  // Create Users
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice",
      username: "alice",
      email: "alice@example.com",
      password: alicePassword, // Hashed password
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob",
      username: "bob",
      email: "bob@example.com",
      password: bobPassword,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {},
    create: {
      name: "Charlie",
      username: "charlie",
      email: "charlie@example.com",
      password: charliePassword,
    },
  });

  console.log("✅ Users created!");

  // Create Chat Rooms
  const generalRoom = await prisma.chatRoom.upsert({
    where: { name: "General" },
    update: {},
    create: {
      name: "General",
      roomAdminId: alice.id, // Alice is the admin
    },
  });

  const techTalkRoom = await prisma.chatRoom.upsert({
    where: { name: "Tech Talk" },
    update: {},
    create: {
      name: "Tech Talk",
      roomAdminId: bob.id, // Bob is the admin
    },
  });

  console.log("✅ Chat Rooms created!");

  // Add users to rooms
  await prisma.userChatRoom.createMany({
    data: [
      { userId: alice.id, roomId: generalRoom.id },
      { userId: bob.id, roomId: generalRoom.id },
      { userId: charlie.id, roomId: generalRoom.id },

      { userId: alice.id, roomId: techTalkRoom.id },
      { userId: bob.id, roomId: techTalkRoom.id },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Users added to rooms!");

  // Create Messages 
  await prisma.message.createMany({
    data: [
      {
        content: "Hello everyone!", // Encrypt before storing
        senderId: alice.id,
        roomId: generalRoom.id,
      },
      {
        content: "Hey Alice! How are you?",
        senderId: bob.id,
        roomId: generalRoom.id,
      },
      {
        content: "This chat room is great!",
        senderId: charlie.id,
        roomId: generalRoom.id,
      },
      {
        content: "Let's talk about Node.js",
        senderId: bob.id,
        roomId: techTalkRoom.id,
      },
      {
        content: "I love TypeScript!",
        senderId: alice.id,
        roomId: techTalkRoom.id,
      },
    ],
  });
  console.log("✅ Messages created in rooms!");

  //create inbox message
  await prisma.message.createMany({
    data: [
      {
        content: "Hey Bob, how's it going?",
        senderId: alice.id,
        receiverId: bob.id,
      },
      {
        content: "Hey Alice! Doing well. How about you?",
        senderId: bob.id,
        receiverId: alice.id,
      },
      {
        content: "Pretty good! Want to catch up later today?",
        senderId: alice.id,
        receiverId: bob.id,
      },
      {
        content: "Sure! Ping me when you're free.",
        senderId: bob.id,
        receiverId: alice.id,
      },
    ],
  });
  console.log("✅ Direct messages between Alice and Bob created!");


  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
