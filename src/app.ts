import express from "express";
import authRoutes from "./routes/auth.routes.js";
import cors from "cors";
import preferenceRoutes from "./routes/preference.routes.js";
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

export default app;
