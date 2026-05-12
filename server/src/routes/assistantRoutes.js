import { Router } from "express";
import { assistSite } from "../controllers/assistantController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", asyncHandler(requireAuth), asyncHandler(assistSite));

export default router;
