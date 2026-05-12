import { Router } from "express";
import { generateSite } from "../controllers/generateController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", asyncHandler(requireAuth), asyncHandler(generateSite));

export default router;
