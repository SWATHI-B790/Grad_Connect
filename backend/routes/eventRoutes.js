const express = require("express");
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterForEvent,
  getEventAccess,
  getEventRegistrations,
  approveParticipantRegistration,
  rejectParticipantRegistration,
  getMyRegistrations,
  getMyEvents,
  cancelEvent,
} = require("../controllers/eventController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Public & filtered events listing
router.get("/", getEvents);

// Authenticated user event queries (MUST be placed before /:id)
router.get("/my-registrations", protect, getMyRegistrations);
router.get("/my-events", protect, getMyEvents);

// Create event (Alumni proposal or Admin direct publish)
router.post("/", protect, upload.single("bannerImage"), createEvent);

// Get single event details by MongoDB ID or unique slug
router.get("/:id", getEventById);

// Update event (Admin or Alumni creator)
router.put("/:id", protect, upload.single("bannerImage"), updateEvent);

// Delete event (Admin or Alumni creator)
router.delete("/:id", protect, deleteEvent);

// Register for event (Students & Alumni)
router.post("/:id/register", protect, registerForEvent);

// Unregister / cancel registration from event
router.post("/:id/unregister", protect, unregisterForEvent);

// Protected private event access (Meeting Link / Venue)
router.get("/:id/access", protect, getEventAccess);

// Event registrations management for Organizer / Admin
router.get("/:id/registrations", protect, getEventRegistrations);
router.post("/:id/registrations/:registrationId/approve", protect, approveParticipantRegistration);
router.patch("/:id/registrations/:registrationId/approve", protect, approveParticipantRegistration);
router.post("/:id/registrations/:registrationId/reject", protect, rejectParticipantRegistration);
router.patch("/:id/registrations/:registrationId/reject", protect, rejectParticipantRegistration);

// Cancel event
router.post("/:id/cancel", protect, cancelEvent);
router.patch("/:id/cancel", protect, cancelEvent);

module.exports = router;
