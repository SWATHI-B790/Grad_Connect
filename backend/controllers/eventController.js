const mongoose = require("mongoose");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { logAdminAction } = require("../models/AuditLog");

// Helper: Slugify title
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Helper: Calculate duration between start and end time
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "2 Hours";
  return `${startTime} – ${endTime}`;
};

// @desc    Get all approved/published public events with filters, search, and seat metrics
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const {
      search,
      category,
      domain,
      mode,
      priceType,
      dateFilter,
      sort,
      limit = 50,
      page = 1,
    } = req.query;

    // Public query: ONLY approved/published events, not deleted
    const query = {
      isDeleted: { $ne: true },
      published: true,
      status: {
        $in: [
          "APPROVED",
          "PUBLISHED",
          "Upcoming",
          "Open for Registration",
          "Almost Full",
          "Registration Closed",
        ],
      },
    };

    // Keyword Search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: regex },
        { shortDescription: regex },
        { description: regex },
        { domain: regex },
        { category: regex },
        { eventType: regex },
        { venue: regex },
        { venueName: regex },
        { city: regex },
        { organizer: regex },
        { organizerName: regex },
        { topics: { $in: [regex] } },
      ];
    }

    // Category / EventType filter
    if (category && category !== "All" && category !== "All Events" && category !== "All Categories") {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { category: new RegExp(`^${category.trim()}$`, "i") },
          { eventType: new RegExp(`^${category.trim()}$`, "i") },
        ],
      });
    }

    // Domain filter
    if (domain && domain !== "All" && domain !== "All Domains") {
      query.domain = new RegExp(`^${domain.trim()}$`, "i");
    }

    // Mode filter (Online, Offline, Hybrid)
    if (mode && mode !== "All" && mode !== "All Modes") {
      if (mode.toLowerCase() === "offline" || mode.toLowerCase() === "in-person") {
        query.mode = { $in: ["Offline", "In-person"] };
      } else {
        query.mode = new RegExp(`^${mode.trim()}$`, "i");
      }
    }

    // Price Type filter (Free vs Paid)
    if (priceType && priceType !== "All") {
      if (priceType.toLowerCase() === "free") {
        query.$or = [{ priceType: "Free" }, { price: 0 }, { price: { $exists: false } }];
      } else if (priceType.toLowerCase() === "paid") {
        query.price = { $gt: 0 };
      }
    }

    // Date Filter (upcoming, today, past)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dateFilter === "upcoming" || !dateFilter) {
      query.date = { $gte: startOfToday };
    } else if (dateFilter === "today") {
      query.date = { $gte: startOfToday, $lte: endOfToday };
    } else if (dateFilter === "past") {
      query.date = { $lt: startOfToday };
    }

    let sortOptions = { date: 1 }; // Default: upcoming first
    if (sort === "newest") {
      sortOptions = { createdAt: -1 };
    } else if (sort === "popular") {
      sortOptions = { attendees: -1 };
    } else if (sort === "soonest" || sort === "upcoming") {
      sortOptions = { date: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const skip = (pageNum - 1) * limitNum;

    // Secure projection: strictly strip meetingLink, onlineLink, room from public list
    const [rawEvents, totalCount] = await Promise.all([
      Event.find(query)
        .select("-meetingLink -onlineLink -room")
        .populate("createdBy", "name jobTitle company avatar role department college batch graduationYear email")
        .populate("organizerId", "name jobTitle company avatar role department college batch graduationYear email")
        .populate("domainId", "name slug category icon color")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Event.countDocuments(query),
    ]);

    // Attach real approved count and available seats per event
    const eventIds = rawEvents.map((e) => e._id);
    const registrationAgg = await EventRegistration.aggregate([
      { $match: { eventId: { $in: eventIds }, status: { $in: ["APPROVED", "REGISTERED", "ATTENDED"] } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } },
    ]);

    const registrationMap = {};
    registrationAgg.forEach((r) => {
      registrationMap[r._id.toString()] = r.count;
    });

    const events = rawEvents.map((ev) => {
      const cap = ev.capacity || ev.maxAttendees || 100;
      const approvedCount = registrationMap[ev._id.toString()] || (ev.attendees ? ev.attendees.length : 0);
      const availableSeats = Math.max(0, cap - approvedCount);
      return {
        ...ev,
        capacity: cap,
        approvedCount,
        availableSeats,
        isFull: availableSeats <= 0,
      };
    });

    // Dynamic aggregated stats
    const totalEvents = await Event.countDocuments({
      isDeleted: { $ne: true },
      published: true,
      status: { $in: ["APPROVED", "PUBLISHED", "Upcoming", "Open for Registration"] },
    });

    const totalRegistrations = await EventRegistration.countDocuments({
      status: { $in: ["APPROVED", "REGISTERED", "ATTENDED"] },
    });

    const stats = {
      upcomingEvents: totalEvents,
      totalRegistrations,
    };

    return res.status(200).json({
      success: true,
      events,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum,
      stats,
    });
  } catch (error) {
    console.error("Get Events Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching events" });
  }
};

// @desc    Get single event by ID or Slug (Secure private detail stripping)
// @route   GET /api/events/:idOrSlug
// @access  Public (Details protected based on user registration state)
const getEventById = async (req, res) => {
  try {
    const { id: param } = req.params;

    let query;
    if (mongoose.isValidObjectId(param)) {
      query = { $or: [{ _id: param }, { slug: param }] };
    } else {
      query = { slug: param };
    }

    const event = await Event.findOne(query)
      .populate("createdBy", "name jobTitle company avatar role department college batch graduationYear email bio headline")
      .populate("organizerId", "name jobTitle company avatar role department college batch graduationYear email bio headline")
      .populate("domainId", "name slug category icon color shortDescription")
      .populate("attendees", "name avatar department batch college userType role email createdAt");

    if (!event || event.isDeleted) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Role check: If event is pending, rejected, or draft, only allow creator or Admin
    const isApprovedOrPublished = ["APPROVED", "PUBLISHED", "Upcoming", "Open for Registration", "Almost Full", "Registration Closed"].includes(event.status) && event.published;
    
    let isOwner = false;
    let isAdmin = false;
    let userRegistration = null;

    if (req.user) {
      const userRole = (req.user.role || "").toLowerCase();
      isAdmin = ["admin", "superadmin", "subadmin"].includes(userRole);
      isOwner = event.createdBy && event.createdBy._id.toString() === req.user._id.toString();

      userRegistration = await EventRegistration.findOne({
        eventId: event._id,
        userId: req.user._id,
      });
    }

    if (!isApprovedOrPublished && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "This event is currently pending administrator review and is not publicly accessible.",
      });
    }

    // Seat capacity tracking
    const cap = event.capacity || event.maxAttendees || 100;
    const approvedCount = await EventRegistration.countDocuments({
      eventId: event._id,
      status: { $in: ["APPROVED", "REGISTERED", "ATTENDED"] },
    });
    const pendingCount = await EventRegistration.countDocuments({
      eventId: event._id,
      status: "PENDING",
    });
    const availableSeats = Math.max(0, cap - approvedCount);

    // Secure Data Exposure: Only reveal meetingLink/room if authorized
    const isApprovedAttendee = userRegistration && ["APPROVED", "REGISTERED", "ATTENDED"].includes(userRegistration.status);
    const hasAccess = isOwner || isAdmin || isApprovedAttendee;

    const eventObject = event.toObject();
    if (!hasAccess) {
      delete eventObject.meetingLink;
      delete eventObject.onlineLink;
      delete eventObject.room;
    }

    eventObject.capacity = cap;
    eventObject.approvedCount = approvedCount;
    eventObject.pendingCount = pendingCount;
    eventObject.availableSeats = availableSeats;
    eventObject.isFull = availableSeats <= 0;

    // Related events
    const relatedEvents = await Event.find({
      _id: { $ne: event._id },
      isDeleted: { $ne: true },
      published: true,
      status: { $in: ["APPROVED", "PUBLISHED", "Upcoming", "Open for Registration"] },
      $or: [{ category: event.category }, { domain: event.domain }],
    })
      .select("title slug date time mode venue bannerImage price priceType capacity maxAttendees category")
      .limit(3)
      .lean();

    return res.status(200).json({
      success: true,
      event: eventObject,
      userRegistrationStatus: userRegistration ? userRegistration.status : null,
      userRegistration,
      hasAccess,
      relatedEvents,
    });
  } catch (error) {
    console.error("Get Event By ID Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching event" });
  }
};

// @desc    Create new event (Alumni proposal -> PENDING_ADMIN_APPROVAL, Admin -> APPROVED)
// @route   POST /api/events
// @access  Private (Alumni & Admin only)
const createEvent = async (req, res) => {
  try {
    const userRole = (req.user.role || (req.user.userType === "Alumni" ? "alumni" : "student")).toLowerCase();
    const allowedRoles = ["alumni", "admin", "superadmin", "subadmin"];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only verified alumni and administrators can host events.",
      });
    }

    const isAdmin = ["admin", "superadmin", "subadmin"].includes(userRole);

    let {
      title,
      shortDescription,
      description,
      eventType,
      category,
      domain,
      domainId,
      date,
      startTime,
      endTime,
      duration,
      timezone,
      mode,
      meetingPlatform,
      meetingLink,
      onlineLink,
      venue,
      venueName,
      venueAddress,
      venueCity,
      room,
      city,
      address,
      price,
      priceType,
      currency,
      capacity,
      maxAttendees,
      registrationEnabled,
      registrationDeadline,
      eligibility,
      topics,
      agenda,
      bannerImage,
      featured,
      status,
    } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({
        success: false,
        message: "Event title, description, and event date are required",
      });
    }

    // Validate Time: End time cannot be before Start time
    if (startTime && endTime) {
      const parseTimeToMinutes = (t) => {
        if (!t) return 0;
        const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (!match) return 0;
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period = match[3] ? match[3].toUpperCase() : null;
        if (period === "PM" && hours < 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };

      const startMinutes = parseTimeToMinutes(startTime);
      const endMinutes = parseTimeToMinutes(endTime);
      if (startMinutes && endMinutes && endMinutes <= startMinutes) {
        return res.status(400).json({
          success: false,
          message: "End time cannot be earlier than or equal to start time.",
        });
      }
    }

    // Capacity calculation
    const parsedCapacity = Math.max(1, parseInt(capacity || maxAttendees, 10) || 100);

    // Price handling
    const numericPrice = Number(price) || 0;
    const finalPriceType = numericPrice > 0 ? "Paid" : priceType || "Free";
    const paymentRequired = numericPrice > 0;

    // Mode-specific venue & meeting fields
    const finalMode = mode || "Online";
    const finalMeetingLink = (meetingLink || onlineLink || "").trim();
    const finalVenueName = (venueName || venue || "").trim();
    const finalAddress = (venueAddress || address || "").trim();
    const finalCity = (venueCity || city || "").trim();
    const finalRoom = (room || "").trim();

    // Banner file handling
    let finalBanner = bannerImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop";
    if (req.file) {
      finalBanner = `/uploads/${req.file.filename}`;
    }

    // Editorial status logic:
    // Alumni: strictly PENDING_ADMIN_APPROVAL and published = false
    // Admin: can be DRAFT or APPROVED (default APPROVED)
    let finalStatus = "PENDING_ADMIN_APPROVAL";
    let isPublished = false;
    let adminApproved = false;
    let adminApprovedBy = undefined;
    let adminApprovedAt = undefined;

    if (isAdmin) {
      if (status && (status.toUpperCase() === "DRAFT" || status === "draft")) {
        finalStatus = "DRAFT";
        isPublished = false;
      } else {
        finalStatus = "APPROVED";
        isPublished = true;
        adminApproved = true;
        adminApprovedBy = req.user._id;
        adminApprovedAt = new Date();
      }
    }

    // Slug generation
    let baseSlug = slugify(title);
    let uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    const existingWithSlug = await Event.findOne({ slug: uniqueSlug });
    if (existingWithSlug) {
      uniqueSlug = `${baseSlug}-${Date.now()}`;
    }

    // Parse topics & agenda
    let parsedTopics = [];
    if (Array.isArray(topics)) {
      parsedTopics = topics;
    } else if (typeof topics === "string" && topics.trim()) {
      try {
        parsedTopics = JSON.parse(topics);
      } catch (e) {
        parsedTopics = topics.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }

    let parsedAgenda = [];
    if (Array.isArray(agenda)) {
      parsedAgenda = agenda;
    } else if (typeof agenda === "string" && agenda.trim()) {
      try {
        parsedAgenda = JSON.parse(agenda);
      } catch (e) {
        parsedAgenda = [];
      }
    }

    const event = await Event.create({
      title: title.trim(),
      slug: uniqueSlug,
      shortDescription: shortDescription ? shortDescription.trim() : description.slice(0, 160).trim(),
      description: description.trim(),
      eventType: eventType || category || "Technical Workshop",
      category: category || eventType || "Technical Workshop",
      domain: domain || "Full Stack Development",
      domainId: domainId && mongoose.isValidObjectId(domainId) ? domainId : undefined,
      date: new Date(date),
      time: startTime && endTime ? `${startTime} - ${endTime}` : "10:00 AM - 12:00 PM IST",
      startTime: startTime || "10:00 AM",
      endTime: endTime || "12:00 PM",
      timezone: timezone || "IST",
      duration: duration || calculateDuration(startTime, endTime),
      mode: finalMode,
      meetingPlatform: meetingPlatform || (finalMode !== "Offline" ? "Google Meet" : ""),
      meetingLink: finalMeetingLink,
      onlineLink: finalMeetingLink,
      venue: finalVenueName || (finalMode === "Online" ? "Google Meet" : "Campus Auditorium"),
      venueName: finalVenueName,
      venueAddress: finalAddress,
      venueCity: finalCity,
      room: finalRoom,
      city: finalCity,
      address: finalAddress,
      location: finalVenueName,
      price: numericPrice,
      priceType: finalPriceType,
      paymentRequired,
      currency: currency || "INR",
      bannerImage: finalBanner,
      banner: finalBanner,
      capacity: parsedCapacity,
      maxAttendees: parsedCapacity,
      registrationEnabled: registrationEnabled !== false,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
      eligibility: eligibility || "Open to all verified students and alumni",
      topics: parsedTopics,
      agenda: parsedAgenda,
      status: finalStatus,
      adminApproved,
      adminApprovedBy,
      adminApprovedAt,
      visibility: isPublished ? "PUBLIC" : "UNPUBLISHED",
      published: isPublished,
      featured: Boolean(featured),
      createdBy: req.user._id,
      createdByRole: isAdmin ? (req.user.role || "admin") : "alumni",
      organizer: req.user.name,
      organizerName: req.user.name,
      organizerEmail: req.user.email,
      organizerId: req.user._id,
      attendees: isAdmin && isPublished ? [req.user._id] : [],
      publishedAt: isPublished ? new Date() : undefined,
      publishedBy: isPublished ? req.user._id : undefined,
    });

    // If admin published directly, register admin
    if (isAdmin && isPublished) {
      await EventRegistration.create({
        eventId: event._id,
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role || "admin",
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: req.user._id,
        registeredAt: new Date(),
      });
    }

    // Log action to AuditLog
    await logAdminAction({
      req,
      action: isAdmin ? "ALUMNI_CREATED_EVENT" : "ALUMNI_CREATED_EVENT",
      targetResource: event.title,
      targetType: "Event",
      description: isAdmin
        ? `Admin ${req.user.name} created and published event "${event.title}".`
        : `Alumni ${req.user.name} created event "${event.title}" (Status: PENDING_ADMIN_APPROVAL).`,
      details: { eventId: event._id, status: finalStatus, mode: event.mode, capacity: parsedCapacity },
    });

    // Notify Admins if Alumni submitted
    if (!isAdmin) {
      const adminUsers = await User.find({ role: { $in: ["admin", "superadmin"] } }).select("_id");
      for (const adm of adminUsers) {
        await Notification.create({
          recipient: adm._id,
          sender: req.user._id,
          type: "event_submission",
          message: `New event submitted for review: "${event.title}" by ${req.user.name}.`,
        });
      }

      // Notify the Alumni creator confirmation
      await Notification.create({
        recipient: req.user._id,
        sender: req.user._id,
        type: "event_submission",
        message: `Your event "${event.title}" has been submitted for admin review. You will be notified upon approval.`,
      });
    }

    return res.status(201).json({
      success: true,
      message: isAdmin
        ? "Event created and published successfully!"
        : "Your event has been submitted for admin review.",
      event,
    });
  } catch (error) {
    console.error("Create Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error creating event" });
  }
};

// @desc    Update an event (Alumni edit -> if critical changes on approved event, resets to PENDING_ADMIN_APPROVAL)
// @route   PUT /api/events/:id
// @access  Private (Owner or Admin)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.isDeleted) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const isAdmin = ["admin", "superadmin", "subadmin"].includes(userRole);
    const isOwner = event.createdBy && event.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You are not authorized to edit this event" });
    }

    const {
      title,
      shortDescription,
      description,
      eventType,
      category,
      domain,
      domainId,
      date,
      startTime,
      endTime,
      timezone,
      duration,
      mode,
      meetingPlatform,
      meetingLink,
      venueName,
      venueAddress,
      venueCity,
      room,
      price,
      priceType,
      capacity,
      maxAttendees,
      registrationEnabled,
      eligibility,
      topics,
      agenda,
      bannerImage,
      status,
    } = req.body;

    // Check critical field changes for Alumni on an already approved event
    const isCriticalChange =
      (date && new Date(date).getTime() !== new Date(event.date).getTime()) ||
      (startTime && startTime !== event.startTime) ||
      (endTime && endTime !== event.endTime) ||
      (meetingLink && meetingLink !== event.meetingLink) ||
      (venueName && venueName !== event.venueName) ||
      (mode && mode !== event.mode) ||
      (price !== undefined && Number(price) !== event.price) ||
      (capacity && Number(capacity) !== event.capacity);

    const wasApproved = event.status === "APPROVED" || event.status === "PUBLISHED";

    if (title) event.title = title.trim();
    if (shortDescription !== undefined) event.shortDescription = shortDescription.trim();
    if (description) event.description = description.trim();
    if (eventType) event.eventType = eventType.trim();
    if (category) event.category = category.trim();
    if (domain) event.domain = domain.trim();
    if (domainId && mongoose.isValidObjectId(domainId)) event.domainId = domainId;
    if (date) event.date = new Date(date);
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (startTime && endTime) event.time = `${startTime} - ${endTime}`;
    if (timezone) event.timezone = timezone;
    if (duration) event.duration = duration;
    if (mode) event.mode = mode;
    if (meetingPlatform !== undefined) event.meetingPlatform = meetingPlatform;
    if (meetingLink !== undefined) {
      event.meetingLink = meetingLink.trim();
      event.onlineLink = meetingLink.trim();
    }
    if (venueName !== undefined) {
      event.venueName = venueName.trim();
      event.venue = venueName.trim();
      event.location = venueName.trim();
    }
    if (venueAddress !== undefined) {
      event.venueAddress = venueAddress.trim();
      event.address = venueAddress.trim();
    }
    if (venueCity !== undefined) {
      event.venueCity = venueCity.trim();
      event.city = venueCity.trim();
    }
    if (room !== undefined) event.room = room.trim();

    if (price !== undefined) {
      const numericPrice = Number(price) || 0;
      event.price = numericPrice;
      event.priceType = numericPrice > 0 ? "Paid" : "Free";
      event.paymentRequired = numericPrice > 0;
    }

    if (capacity || maxAttendees) {
      const cap = Math.max(1, parseInt(capacity || maxAttendees, 10) || 100);
      event.capacity = cap;
      event.maxAttendees = cap;
    }

    if (registrationEnabled !== undefined) event.registrationEnabled = registrationEnabled;
    if (eligibility !== undefined) event.eligibility = eligibility;

    if (req.file) {
      event.bannerImage = `/uploads/${req.file.filename}`;
      event.banner = event.bannerImage;
    } else if (bannerImage) {
      event.bannerImage = bannerImage;
      event.banner = bannerImage;
    }

    if (topics) {
      event.topics = Array.isArray(topics) ? topics : (typeof topics === "string" ? topics.split(",").map(t => t.trim()).filter(Boolean) : []);
    }

    if (agenda) {
      event.agenda = Array.isArray(agenda) ? agenda : [];
    }

    // Alumni re-moderation policy
    if (!isAdmin) {
      if (wasApproved && isCriticalChange) {
        event.status = "PENDING_ADMIN_APPROVAL";
        event.published = false;
        event.adminApproved = false;
        event.visibility = "UNPUBLISHED";
      } else if (event.status === "REJECTED") {
        // Resubmitting a previously rejected event
        event.status = "PENDING_ADMIN_APPROVAL";
        event.rejectionReason = "";
        event.published = false;
        event.adminApproved = false;
      }
    } else if (status) {
      event.status = status;
      if (status === "APPROVED" || status === "PUBLISHED") {
        event.published = true;
        event.adminApproved = true;
        event.adminApprovedBy = req.user._id;
        event.adminApprovedAt = new Date();
      }
    }

    event.updatedBy = req.user._id;
    await event.save();

    await logAdminAction({
      req,
      action: isAdmin ? "ADMIN_UPDATED_EVENT" : "EVENT_UPDATED",
      targetResource: event.title,
      targetType: "Event",
      description: `${req.user.name} updated event "${event.title}" (Status: ${event.status}).`,
      details: { eventId: event._id, status: event.status },
    });

    return res.status(200).json({
      success: true,
      message: !isAdmin && wasApproved && isCriticalChange
        ? "Event updated. Major changes were detected, so your event has been resubmitted for admin review."
        : "Event updated successfully.",
      event,
    });
  } catch (error) {
    console.error("Update Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating event" });
  }
};

// @desc    Delete event (Soft deletion)
// @route   DELETE /api/events/:id
// @access  Private (Owner if not completed or Admin)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const isAdmin = ["admin", "superadmin", "subadmin"].includes(userRole);
    const isOwner = event.createdBy && event.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You are not authorized to delete this event" });
    }

    // Soft delete
    event.isDeleted = true;
    event.deletedAt = new Date();
    event.deletedBy = req.user._id;
    event.status = "CANCELLED";
    event.published = false;
    event.visibility = "UNPUBLISHED";
    await event.save();

    await logAdminAction({
      req,
      action: "ADMIN_DELETED_EVENT",
      targetResource: event.title,
      targetType: "Event",
      description: `${req.user.name} deleted event "${event.title}".`,
      details: { eventId: event._id },
    });

    return res.status(200).json({ success: true, message: "Event deleted successfully", id: event._id });
  } catch (error) {
    console.error("Delete Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting event" });
  }
};

// @desc    Register for event (Creates PENDING registration waiting for Alumni approval)
// @route   POST /api/events/:id/register
// @access  Private (Students & Alumni)
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.isDeleted) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Check approval & publication
    const isApprovedOrPublished = ["APPROVED", "PUBLISHED", "Upcoming", "Open for Registration", "Almost Full"].includes(event.status) && event.published;
    if (!isApprovedOrPublished) {
      return res.status(400).json({ success: false, message: "This event is not open for public registration" });
    }

    if (event.registrationEnabled === false) {
      return res.status(400).json({ success: false, message: "Registration is currently disabled for this event" });
    }

    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ success: false, message: "The registration deadline for this event has passed" });
    }

    // Check seat capacity
    const cap = event.capacity || event.maxAttendees || 100;
    const approvedCount = await EventRegistration.countDocuments({
      eventId: event._id,
      status: { $in: ["APPROVED", "REGISTERED", "ATTENDED"] },
    });

    if (approvedCount >= cap) {
      return res.status(400).json({
        success: false,
        message: "REGISTRATION FULL: This event has reached full capacity.",
      });
    }

    // Check duplicate registration
    const existingReg = await EventRegistration.findOne({
      eventId: event._id,
      userId: req.user._id,
    });

    if (existingReg) {
      if (existingReg.status === "APPROVED" || existingReg.status === "REGISTERED" || existingReg.status === "ATTENDED") {
        return res.status(400).json({
          success: false,
          message: "You are already registered and approved for this event.",
        });
      }
      if (existingReg.status === "PENDING") {
        return res.status(400).json({
          success: false,
          message: "Your registration is already submitted and pending organizer approval.",
        });
      }
      // If cancelled or rejected previously, allow re-submitting as PENDING
      existingReg.status = "PENDING";
      existingReg.registeredAt = new Date();
      existingReg.cancelledAt = null;
      existingReg.rejectionReason = "";
      existingReg.name = req.body.name || existingReg.name || req.user.name;
      existingReg.email = req.body.email || existingReg.email || req.user.email;
      existingReg.phone = req.body.phone || existingReg.phone || req.user.phone;
      existingReg.college = req.body.college || existingReg.college || req.user.college || req.user.institution || "";
      existingReg.department = req.body.department || existingReg.department || req.user.department || "";
      existingReg.year = req.body.year || existingReg.year || req.user.batch || req.user.graduationYear || "";
      existingReg.role = req.body.role || existingReg.role || req.user.role || req.user.userType || "student";
      existingReg.reason = req.body.reason || existingReg.reason || "";
      await existingReg.save();
    } else {
      // Create new PENDING registration
      await EventRegistration.create({
        eventId: event._id,
        userId: req.user._id,
        name: (req.body.name || req.user.name || "").trim(),
        email: (req.body.email || req.user.email || "").trim(),
        phone: (req.body.phone || req.user.phone || "").trim(),
        college: (req.body.college || req.user.college || req.user.institution || "").trim(),
        department: (req.body.department || req.user.department || "").trim(),
        year: (req.body.year || req.user.batch || req.user.graduationYear || "").toString().trim(),
        role: (req.body.role || req.user.role || req.user.userType || "student").toString().trim(),
        reason: (req.body.reason || "").trim(),
        status: "PENDING",
        registeredAt: new Date(),
      });
    }

    // Notify Participant
    await Notification.create({
      recipient: req.user._id,
      sender: event.createdBy || null,
      type: "event_registered",
      message: `Registration submitted for "${event.title}". Waiting for event organizer approval.`,
    });

    // Notify Organizer
    if (event.createdBy) {
      await Notification.create({
        recipient: event.createdBy,
        sender: req.user._id,
        type: "event_submission",
        message: `New registration pending approval for "${event.title}" from ${req.user.name}.`,
      });
    }

    // Log action in AuditLog
    await logAdminAction({
      req,
      action: "USER_REGISTERED_EVENT",
      targetResource: event.title,
      targetType: "Event",
      description: `${req.user.name} submitted registration for event "${event.title}" (Status: PENDING).`,
      details: { eventId: event._id, userId: req.user._id },
    });

    return res.status(200).json({
      success: true,
      message: "Registration submitted successfully. Waiting for event organizer approval.",
      registrationStatus: "PENDING",
    });
  } catch (error) {
    console.error("Register For Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error registering for event" });
  }
};

// @desc    Unregister / cancel own registration
// @route   POST /api/events/:id/unregister
// @access  Private
const unregisterForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const reg = await EventRegistration.findOne({
      eventId: event._id,
      userId: req.user._id,
    });

    if (reg) {
      reg.status = "CANCELLED";
      reg.cancelledAt = new Date();
      await reg.save();
    }

    event.attendees = (event.attendees || []).filter((id) => id.toString() !== req.user._id.toString());
    await event.save();

    await logAdminAction({
      req,
      action: "EVENT_REGISTRATION_CANCELLED",
      targetResource: event.title,
      targetType: "Event",
      description: `${req.user.name} cancelled registration for event "${event.title}".`,
      details: { eventId: event._id },
    });

    return res.status(200).json({
      success: true,
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    console.error("Unregister Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error cancelling registration" });
  }
};

// @desc    Get protected private event access (Meeting link & private venue details)
// @route   GET /api/events/:id/access
// @access  Private (Approved participants, Organizer, or Admin only)
const getEventAccess = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.isDeleted) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const isAdmin = ["admin", "superadmin", "subadmin"].includes(userRole);
    const isOwner = event.createdBy && event.createdBy.toString() === req.user._id.toString();

    // 1. Organizer or Admin gets instant access
    if (isOwner || isAdmin) {
      return res.status(200).json({
        success: true,
        accessGranted: true,
        role: isOwner ? "organizer" : "admin",
        meetingPlatform: event.meetingPlatform || "Google Meet",
        meetingLink: event.meetingLink || event.onlineLink || "",
        venueName: event.venueName || event.venue,
        venueAddress: event.venueAddress || event.address,
        venueCity: event.venueCity || event.city,
        room: event.room || "",
        instructions: event.eligibility,
      });
    }

    // 2. Check if event is approved
    const isApprovedOrPublished = ["APPROVED", "PUBLISHED", "Upcoming", "Open for Registration", "Almost Full", "Registration Closed"].includes(event.status) && event.published;
    if (!isApprovedOrPublished) {
      return res.status(403).json({
        success: false,
        accessGranted: false,
        message: "This event is not approved for access.",
      });
    }

    // 3. Check registration approval status
    const registration = await EventRegistration.findOne({
      eventId: event._id,
      userId: req.user._id,
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        accessGranted: false,
        message: "You are not registered for this event. Please register first.",
        status: "NOT_REGISTERED",
      });
    }

    if (registration.status === "PENDING") {
      return res.status(403).json({
        success: false,
        accessGranted: false,
        message: "Your registration is waiting for event organizer approval.",
        status: "PENDING",
      });
    }

    if (registration.status === "REJECTED") {
      return res.status(403).json({
        success: false,
        accessGranted: false,
        message: `Your registration was not approved. Reason: ${registration.rejectionReason || "Criteria not met"}.`,
        status: "REJECTED",
        rejectionReason: registration.rejectionReason,
      });
    }

    if (["APPROVED", "REGISTERED", "ATTENDED"].includes(registration.status)) {
      return res.status(200).json({
        success: true,
        accessGranted: true,
        status: registration.status,
        meetingPlatform: event.meetingPlatform || "Google Meet",
        meetingLink: event.meetingLink || event.onlineLink || "",
        venueName: event.venueName || event.venue,
        venueAddress: event.venueAddress || event.address,
        venueCity: event.venueCity || event.city,
        room: event.room || "",
        instructions: event.eligibility,
      });
    }

    return res.status(403).json({
      success: false,
      accessGranted: false,
      message: "You are not approved for this event.",
      status: registration.status,
    });
  } catch (error) {
    console.error("Get Event Access Error:", error);
    return res.status(500).json({ success: false, message: "Server error checking event access" });
  }
};

// @desc    Get all registrations for an event (Organizer or Admin view)
// @route   GET /api/events/:id/registrations
// @access  Private (Event Organizer or Admin)
const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.isDeleted) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const isAdmin = ["admin", "superadmin", "subadmin"].includes(userRole);
    const isOwner = event.createdBy && event.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view registrations for this event.",
      });
    }

    const registrations = await EventRegistration.find({ eventId: event._id })
      .populate("userId", "name email avatar department college batch graduationYear role userType phone")
      .populate("approvedBy", "name email")
      .sort({ registeredAt: -1 });

    const cap = event.capacity || event.maxAttendees || 100;
    const pendingCount = registrations.filter((r) => r.status === "PENDING").length;
    const approvedCount = registrations.filter((r) => ["APPROVED", "REGISTERED", "ATTENDED"].includes(r.status)).length;
    const rejectedCount = registrations.filter((r) => r.status === "REJECTED").length;
    const availableSeats = Math.max(0, cap - approvedCount);

    return res.status(200).json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        date: event.date,
        time: event.time,
        mode: event.mode,
        capacity: cap,
        status: event.status,
        meetingLink: event.meetingLink,
      },
      stats: {
        capacity: cap,
        pendingCount,
        approvedCount,
        rejectedCount,
        availableSeats,
        totalRegistrations: registrations.length,
      },
      registrations,
    });
  } catch (error) {
    console.error("Get Event Registrations Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching registrations" });
  }
};

// @desc    Approve a participant registration (Organizer or Admin)
// @route   POST /api/events/:id/registrations/:registrationId/approve
// @access  Private (Event Organizer or Admin)
const approveParticipantRegistration = async (req, res) => {
  try {
    const { id: eventId, registrationId } = req.params;

    const event = await Event.findById(eventId);
    if (!event || event.isDeleted) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const isAdmin = ["admin", "superadmin", "subadmin"].includes(userRole);
    const isOwner = event.createdBy && event.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to moderate registrations for this event.",
      });
    }

    const registration = await EventRegistration.findById(registrationId).populate("userId", "name email");
    if (!registration || registration.eventId.toString() !== event._id.toString()) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    // Capacity Check
    const cap = event.capacity || event.maxAttendees || 100;
    const currentApproved = await EventRegistration.countDocuments({
      eventId: event._id,
      status: { $in: ["APPROVED", "REGISTERED", "ATTENDED"] },
    });

    if (currentApproved >= cap) {
      return res.status(400).json({
        success: false,
        message: "Cannot approve: Event has reached full capacity.",
      });
    }

    registration.status = "APPROVED";
    registration.approvedAt = new Date();
    registration.approvedBy = req.user._id;
    registration.rejectionReason = "";
    await registration.save();

    // Sync attendees on Event
    event.attendees = event.attendees || [];
    const uIdStr = registration.userId._id.toString();
    if (!event.attendees.some((id) => id.toString() === uIdStr)) {
      event.attendees.push(registration.userId._id);
      await event.save();
    }

    // Notify Participant
    await Notification.create({
      recipient: registration.userId._id,
      sender: req.user._id,
      type: "event_approved",
      message: `Your registration for "${event.title}" has been approved by the organizer! You can now access event meeting/venue details.`,
    });

    // Log action in AuditLog
    await logAdminAction({
      req,
      action: "ALUMNI_APPROVED_REGISTRATION",
      targetResource: event.title,
      targetType: "Event",
      description: `${req.user.name} approved registration for ${registration.name || registration.userId.name} in event "${event.title}".`,
      details: { eventId: event._id, registrationId: registration._id, participantId: registration.userId._id },
    });

    return res.status(200).json({
      success: true,
      message: `Registration for ${registration.name || registration.userId.name} approved successfully.`,
      registration,
    });
  } catch (error) {
    console.error("Approve Participant Error:", error);
    return res.status(500).json({ success: false, message: "Server error approving registration" });
  }
};

// @desc    Reject a participant registration (Organizer or Admin with mandatory reason)
// @route   POST /api/events/:id/registrations/:registrationId/reject
// @access  Private (Event Organizer or Admin)
const rejectParticipantRegistration = async (req, res) => {
  try {
    const { id: eventId, registrationId } = req.params;
    const { rejectionReason, reason } = req.body;
    const finalReason = (rejectionReason || reason || "").trim();

    if (!finalReason) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required to inform the participant.",
      });
    }

    const event = await Event.findById(eventId);
    if (!event || event.isDeleted) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const isAdmin = ["admin", "superadmin", "subadmin"].includes(userRole);
    const isOwner = event.createdBy && event.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to moderate registrations for this event.",
      });
    }

    const registration = await EventRegistration.findById(registrationId).populate("userId", "name email");
    if (!registration || registration.eventId.toString() !== event._id.toString()) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    registration.status = "REJECTED";
    registration.rejectionReason = finalReason;
    registration.rejectedAt = new Date();
    await registration.save();

    // Remove from event attendees if previously added
    if (registration.userId) {
      const uIdStr = registration.userId._id.toString();
      event.attendees = (event.attendees || []).filter((id) => id.toString() !== uIdStr);
      await event.save();
    }

    // Notify Participant
    await Notification.create({
      recipient: registration.userId._id,
      sender: req.user._id,
      type: "event_rejected",
      message: `Your registration for "${event.title}" was not approved. Reason: ${finalReason}.`,
    });

    // Log action in AuditLog
    await logAdminAction({
      req,
      action: "ALUMNI_REJECTED_REGISTRATION",
      targetResource: event.title,
      targetType: "Event",
      description: `${req.user.name} rejected registration for ${registration.name || registration.userId.name} in event "${event.title}". Reason: "${finalReason}".`,
      details: { eventId: event._id, registrationId: registration._id, reason: finalReason },
    });

    return res.status(200).json({
      success: true,
      message: `Registration for ${registration.name || registration.userId.name} rejected.`,
      registration,
    });
  } catch (error) {
    console.error("Reject Participant Error:", error);
    return res.status(500).json({ success: false, message: "Server error rejecting registration" });
  }
};

// @desc    Get user's registered events with approval status
// @route   GET /api/events/my-registrations
// @access  Private
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await EventRegistration.find({
      userId: req.user._id,
      status: { $ne: "CANCELLED" },
    })
      .populate({
        path: "eventId",
        populate: [
          { path: "createdBy", select: "name avatar role jobTitle company" },
          { path: "domainId", select: "name slug category" },
        ],
      })
      .sort({ registeredAt: -1 });

    const registeredEvents = registrations
      .filter((r) => r.eventId && !r.eventId.isDeleted)
      .map((r) => ({
        registrationId: r._id,
        status: r.status,
        rejectionReason: r.rejectionReason,
        registeredAt: r.registeredAt,
        approvedAt: r.approvedAt,
        event: r.eventId,
      }));

    return res.status(200).json({ success: true, registrations: registeredEvents });
  } catch (error) {
    console.error("Get My Registrations Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching registrations" });
  }
};

// @desc    Get events created by logged-in user with registration counters
// @route   GET /api/events/my-events
// @access  Private (Alumni & Admin)
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      createdBy: req.user._id,
      isDeleted: { $ne: true },
    })
      .populate("domainId", "name slug category icon color")
      .sort({ createdAt: -1 })
      .lean();

    const eventIds = events.map((e) => e._id);
    const regAgg = await EventRegistration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      {
        $group: {
          _id: { eventId: "$eventId", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    const statsByEvent = {};
    regAgg.forEach((item) => {
      const eId = item._id.eventId.toString();
      const status = item._id.status;
      if (!statsByEvent[eId]) {
        statsByEvent[eId] = { pending: 0, approved: 0, rejected: 0, total: 0 };
      }
      statsByEvent[eId].total += item.count;
      if (status === "PENDING") statsByEvent[eId].pending += item.count;
      if (["APPROVED", "REGISTERED", "ATTENDED"].includes(status)) statsByEvent[eId].approved += item.count;
      if (status === "REJECTED") statsByEvent[eId].rejected += item.count;
    });

    const enrichedEvents = events.map((ev) => {
      const cap = ev.capacity || ev.maxAttendees || 100;
      const counts = statsByEvent[ev._id.toString()] || { pending: 0, approved: 0, rejected: 0, total: 0 };
      const availableSeats = Math.max(0, cap - counts.approved);
      return {
        ...ev,
        capacity: cap,
        pendingCount: counts.pending,
        approvedCount: counts.approved,
        rejectedCount: counts.rejected,
        availableSeats,
      };
    });

    return res.status(200).json({ success: true, events: enrichedEvents });
  } catch (error) {
    console.error("Get My Events Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching user events" });
  }
};

// @desc    Cancel an event (Organizer or Admin)
// @route   POST /api/events/:id/cancel
// @access  Private (Owner or Admin)
const cancelEvent = async (req, res) => {
  try {
    const { cancellationReason, reason } = req.body;
    const finalReason = (cancellationReason || reason || "Cancelled by event organizer").trim();

    const event = await Event.findById(req.params.id);
    if (!event || event.isDeleted) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const isAdmin = ["admin", "superadmin", "subadmin"].includes(userRole);
    const isOwner = event.createdBy && event.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "You are not authorized to cancel this event" });
    }

    event.status = "CANCELLED";
    event.cancelledAt = new Date();
    event.cancellationReason = finalReason;
    event.registrationEnabled = false;
    event.published = false;
    await event.save();

    // Notify registered participants
    const registrations = await EventRegistration.find({
      eventId: event._id,
      status: { $in: ["PENDING", "APPROVED", "REGISTERED"] },
    });

    for (const reg of registrations) {
      await Notification.create({
        recipient: reg.userId,
        sender: req.user._id,
        type: "event_cancelled",
        message: `Notice: The event "${event.title}" has been cancelled. Reason: ${finalReason}.`,
      });
    }

    await logAdminAction({
      req,
      action: "EVENT_CANCELLED",
      targetResource: event.title,
      targetType: "Event",
      description: `${req.user.name} cancelled event "${event.title}". Reason: "${finalReason}".`,
      details: { eventId: event._id, reason: finalReason },
    });

    return res.status(200).json({
      success: true,
      message: `Event "${event.title}" has been cancelled.`,
      event,
    });
  } catch (error) {
    console.error("Cancel Event Error:", error);
    return res.status(500).json({ success: false, message: "Server error cancelling event" });
  }
};

module.exports = {
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
};
