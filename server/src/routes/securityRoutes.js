import express from "express";
import { fakeSalaryCanary } from "../controllers/securityController.js";

const router = express.Router();

// Canary token: left unprotected so any reconnaissance scan will trigger monitoring.
router.get("/fake-salary", fakeSalaryCanary);

export default router;
