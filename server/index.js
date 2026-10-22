import "dotenv/config";
import express from "express";
import cors from "cors";

import { testDatabaseConnection } from "./src/config/database.js";
import { initializeVectorStore } from "./src/services/vector-store.service.js";
import chatRoutes from "./src/routes/chat.routes.js";

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://rag-ai-chat-with-yt.vercel.app",
];

const corsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("YouTube RAG API is running.");
});

app.use("/", chatRoutes);

const startServer = async () => {
  try {
    await testDatabaseConnection();
    await initializeVectorStore();

    app.listen(port, () => {
      console.log(`Server is successfully listening at ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();