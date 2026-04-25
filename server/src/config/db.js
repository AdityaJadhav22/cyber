import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    const allowMemory = String(process.env.ALLOW_INMEMORY_DB || "true").toLowerCase() === "true";
    console.error("Database connection failed:", error.message);

    if (!allowMemory) {
      process.exit(1);
    }

    // Dev fallback: start temporary in-memory MongoDB when local Mongo is unavailable.
    const memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log("Connected to in-memory MongoDB fallback");
  }
};
