const XLSX = require("xlsx");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Performance = require("../models/Performance");
const uploadExcel = async (req, res) => {
    try {
        const { grade, subject } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        if (!grade) {
            return res.status(400).json({ message: "Grade is required" });
        }

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        console.log("DATA FROM EXCEL:", data);

        let created = 0;

        for (let row of data) {
            if (!row.studentId) continue;

            // ✅ CREATE STUDENT (existing logic)
            let student = await User.findOne({ studentId: row.studentId });

            if (!student) {
                const hashedPassword = await bcrypt.hash("default123", 10);

                student = await User.create({
                    studentId: row.studentId,
                    fullName: row.fullName || "Unknown",
                    email: row.email || `${row.studentId}@learnx.com`,
                    password: hashedPassword,
                    role: "student",
                    gradeClass: grade,
                });
            }

            // 🔥 SAVE PERFORMANCE (THIS IS NEW)
            await Performance.create({
                studentId: row.studentId,
                subject: subject.trim(),// 🔥 from UI (NOT Excel)
                topic: row.topic,
                testName: row.testName,
                marksObtained: row.marksObtained || 0,
                totalMarks: row.totalMarks || 100,
                attendance: row.attendance || 0,
                income: row.income || "medium",
                feePaid: row.feePaid || "yes",
                grade: grade,
            });
        }

        res.json({
            message: "Students created successfully",
            created,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { uploadExcel };