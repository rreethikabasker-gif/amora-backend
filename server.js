require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const Message = require("./models/Message");
const User = require("./models/User");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const calendarRoutes = require("./routes/calendar");
const photoRoutes = require("./routes/photos");
const noteRoutes = require("./routes/notes");
const memoryRoutes = require("./routes/memories");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || "*" }
});

app.set("io", io);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/memories", memoryRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", async (socket) => {
  const user = await User.findById(socket.userId);
  if (user?.circle) {
    socket.join(String(user.circle));
  }

  socket.on("chat:send", async (payload, ack) => {
    try {
      if (!user?.circle) return ack?.({ error: "Join or create a circle first" });

      const message = await Message.create({
        circle: user.circle,
        sender: socket.userId,
        text: payload.text || ""
      });
      const populated = await message.populate("sender", "name avatar");

      io.to(String(user.circle)).emit("chat:new", populated);
      ack?.({ success: true, message: populated });
    } catch (err) {
      ack?.({ error: err.message });
    }
  });

  socket.on("chat:typing", () => {
    if (user?.circle) {
      socket.to(String(user.circle)).emit("chat:typing", { userId: socket.userId });
    }
  });

  socket.on("disconnect", () => {});
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
