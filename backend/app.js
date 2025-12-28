import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { connectToSocket } from "./src/controllers/socketManager.js";
import mongoose from "mongoose";
import cors from "cors";
import userRouter from "./src/routes/usersroutes.js";

const app = express();
const server = createServer(app);


// Use centralized socket manager (handles signaling, rooms, chat)

// Express Middleware Setup
app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/user", userRouter);

// ✅ Define the `start()` function BEFORE calling it
const start = async () => {
  try {
    const connectionDb = await mongoose.connect(
      "mongodb+srv://Avinash123:6O4seNUiQ38kHist@zoomclone.fmrjt0p.mongodb.net/"
    );
    console.log(`MongoDB connected: ${connectionDb.connection.host}`);

    connectToSocket(server);

    server.listen(app.get("port"), () => {
      console.log(`Server running on port ${app.get("port")}`);
    });
  } catch (error) {
    console.error("Error starting server:", error.message);
  }
};

// ✅ Now call it AFTER the function is declared
start();
