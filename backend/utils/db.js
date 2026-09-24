import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing from the backend .env file");
  }

  const conn = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log(
    `MongoDB connected: ${conn.connection.host}, database: ${conn.connection.name}`
  );

  return conn;
};

