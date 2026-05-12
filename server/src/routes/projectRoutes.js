import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from "../controllers/projectController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(asyncHandler(requireAuth));
router.get("/", asyncHandler(listProjects));
router.post("/", asyncHandler(createProject));
router.get("/:id", asyncHandler(getProject));
router.put("/:id", asyncHandler(updateProject));
router.delete("/:id", asyncHandler(deleteProject));

export default router;
