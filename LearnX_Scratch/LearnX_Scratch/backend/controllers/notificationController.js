const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({
      message: "Failed to load notifications",
      error: err.message,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({
      message: "Failed to update notification",
      error: err.message,
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    res.status(500).json({
      message: "Failed to update notifications",
      error: err.message,
    });
  }
};