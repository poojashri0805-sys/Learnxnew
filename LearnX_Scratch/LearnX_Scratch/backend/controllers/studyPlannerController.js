const StudyPlan = require("../models/StudyPlan");

exports.getPlans = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const plans = await StudyPlan.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { planId, dayIndex, taskIndex } = req.body;

    const plan = await StudyPlan.findOne({
      _id: planId,
      user: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ message: "Study plan not found" });
    }

    const task = plan.tasks?.[dayIndex]?.tasks?.[taskIndex];

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.completed = !task.completed;

    plan.status = plan.tasks.every((d) =>
      d.tasks.every((t) => t.completed)
    )
      ? "completed"
      : "active";

    await plan.save();

    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ message: "Study plan not found" });
    }

    res.json({ message: "Plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};