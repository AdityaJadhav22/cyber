import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MongoDB connection failed: MONGO_URI is missing in environment variables.");
    process.exit(1);
  }

  try {
    // Atlas URI is provided through .env to keep secrets out of source control.
    await mongoose.connect(mongoUri);
    console.log("MongoDB Atlas connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
