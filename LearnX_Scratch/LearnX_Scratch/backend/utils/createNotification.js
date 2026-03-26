const Notification = require("../models/Notification");

async function createNotification({
  user,
  type = "system",
  title,
  message,
  link = "",
}) {
  try {
    if (!user || !title || !message) return null;

    return await Notification.create({
      user,
      type,
      title,
      message,
      link,
      read: false,
    });
  } catch (err) {
    console.error("createNotification error:", err);
    return null;
  }
}

module.exports = createNotification;