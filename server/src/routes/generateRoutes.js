import { Router } from "express";
import { generateImages, generateSite } from "../controllers/generateController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", asyncHandler(requireAuth), asyncHandler(generateSite));
router.post("/images", asyncHandler(requireAuth), asyncHandler(generateImages));

export default router;
