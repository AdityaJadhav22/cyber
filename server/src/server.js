import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import { detectRapidRequests } from "./middleware/anomaly.js";
import { detectInjectionAttempts } from "./middleware/threatDetection.js";
import { fail } from "./utils/response.js";

const app = express();
connectDB();

// Security headers and policy hardening.
app.use(helmet());

// CORS configured for trusted frontend origin only.
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(morgan("combined"));
app.use(detectRapidRequests);
app.use(detectInjectionAttempts);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/logs", logRoutes);
app.use("/api", securityRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  return fail(res, "Internal server error", 500);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log("HTTPS-ready note: place app behind reverse proxy (Nginx/Caddy) with TLS cert.");
});
