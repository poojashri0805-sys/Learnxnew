const ForestTree = require("../models/ForestTree");

exports.getForestTrees = async (req, res) => {
  try {
    const query = {};
    const userId = req.user?._id || req.user?.id || null;
    if (userId) query.userId = userId;

    const trees = await ForestTree.find(query).sort({ plantedAt: -1 });
    return res.json(trees);
  } catch (error) {
    console.error("Get forest trees error:", error);
    return res.status(500).json({ message: "Failed to load forest trees" });
  }
};

exports.deleteForestTree = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    const userId = req.user?._id || req.user?.id || null;
    if (userId) query.userId = userId;

    const tree = await ForestTree.findOneAndDelete(query);
    if (!tree) return res.status(404).json({ message: "Tree not found" });

    return res.json({ message: "Tree deleted" });
  } catch (error) {
    console.error("Delete forest tree error:", error);
    return res.status(500).json({ message: "Failed to delete forest tree" });
  }
};