import { Router } from "express";

// Mock users — matches the MOCK_USERS in the original BookingModal
const MOCK_USERS = [
  { id: "user-001", name: "Sarah Jenkins" },
  { id: "user-002", name: "David Chen" },
  { id: "user-003", name: "Amara Patel" },
  { id: "user-004", name: "Marcus Johnson" },
  { id: "user-005", name: "Sofia Rodriguez" },
];

const router = Router();

// GET /api/users
router.get("/", (_req, res) => {
  res.json(MOCK_USERS);
});

export default router;
