import prisma from "@cma/db/prisma";

const dbConnect = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully!");
  } catch (err) {
    console.error("❌ Error connecting to the database:", err);
    process.exit(1); // Exit if DB connection fails
  }
};

export default dbConnect;
