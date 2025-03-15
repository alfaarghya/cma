// import dbConnect from "./dbConnect";

const startServer = async (port: number) => {
  try {
    console.log("🚀 Starting server...");
    // await dbConnect(); // Connect to database
    console.log(`✅ Server is running on http://localhost:${port} ⚙️`);
  } catch (err) {
    console.log("❌ Error while starting server: " + err);
  }
};

export default startServer;
