import express from "express";
import authRoutes from "./routes/auth.routes.js";
import cors from "cors";
import preferenceRoutes from "./routes/preference.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.get("/", (_req, res) => {
  res.json({
    message: "Mock AI Interview API is running",
  });
});

app.use("/api/auth/v1", authRoutes);
app.use("/api/preferences/v1", preferenceRoutes);
app.use("/api/interviews/v1", interviewRoutes);
app.use("/api/dashboard/v1", dashboardRoutes);
app.use("/api/notifications/v1", notificationRoutes);
app.use("/api/resume/v1", resumeRoutes);
app.use("/api/chatbot/v1", chatbotRoutes);
export default app;
