const fs = require("fs");
const pdfParse = require("pdf-parse");
const Textbook = require("../models/Textbook");
const TextbookChunk = require("../models/TextbookChunk");
const { getEmbeddingFromHuggingFace } = require("../config/huggingface");

const uploadTextbook = async (req, res) => {
    try {
        const { gradeClass, subject, title } = req.body;

        if (!gradeClass || !subject || !title || !req.file) {
            return res.status(400).json({
                message: "gradeClass, subject, title and pdf file are required",
            });
        }

        const textbook = await Textbook.create({
            gradeClass: gradeClass.trim(),
            subject: subject.trim(),
            title: title.trim(),
            originalFileName: req.file.originalname,
            filePath: req.file.path,
            uploadedBy: req.user._id,
        });

        const fileBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(fileBuffer);

        let extractedText = pdfData.text || "";

        if (!extractedText.trim()) {
            return res.status(400).json({
                message: "Could not extract text from PDF",
            });
        }

        extractedText = extractedText
            .replace(/\r/g, " ")
            .replace(/\n+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const chunkSize = 1200;
        const overlap = 200;
        const chunks = [];

        let start = 0;
        let chunkIndex = 0;

        while (start < extractedText.length) {
            const end = start + chunkSize;
            const chunkText = extractedText.slice(start, end).trim();

            if (chunkText) {
                const embedding = await getEmbeddingFromHuggingFace(chunkText);

                chunks.push({
                    textbookId: textbook._id,
                    gradeClass: gradeClass.trim(),
                    subject: subject.trim(),
                    title: title.trim(),
                    chunkIndex,
                    chunkText,
                    embedding,
                });

                chunkIndex++;
            }

            start += chunkSize - overlap;
        }

        if (chunks.length === 0) {
            return res.status(400).json({
                message: "No chunks could be created from textbook",
            });
        }

        await TextbookChunk.insertMany(chunks);

        res.status(201).json({
            message: "Textbook uploaded and fully processed successfully",
            textbook: {
                _id: textbook._id,
                gradeClass: textbook.gradeClass,
                subject: textbook.subject,
                title: textbook.title,
                originalFileName: textbook.originalFileName,
                uploadedBy: textbook.uploadedBy,
            },
            totalChunks: chunks.length,
        });
    } catch (error) {
        console.error("Upload Textbook Error:", error.response?.data || error.message);
        res.status(500).json({
            message: "Server error while uploading textbook",
            error: error.response?.data || error.message,
        });
    }
};

const getTextbooksByGrade = async (req, res) => {
    try {
        const { gradeClass } = req.params;

        const textbooks = await Textbook.find({ gradeClass }).sort({ createdAt: -1 });

        res.status(200).json(textbooks);
    } catch (error) {
        console.error("Get Textbooks Error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

const extractTextFromTextbook = async (req, res) => {
    try {
        const { id } = req.params;

        const textbook = await Textbook.findById(id);

        if (!textbook) {
            return res.status(404).json({ message: "Textbook not found" });
        }

        const pdfBuffer = fs.readFileSync(textbook.filePath);
        const data = await pdfParse(pdfBuffer);

        res.status(200).json({
            message: "Text extracted successfully",
            textbookId: textbook._id,
            title: textbook.title,
            totalPages: data.numpages,
            previewText: data.text.substring(0, 3000),
        });
    } catch (error) {
        console.error("Extract Text Error:", error.message);
        res.status(500).json({ message: "Server error while extracting PDF text" });
    }
};
const cleanText = (text) => {
    return text
        .replace(/\r/g, " ")
        .replace(/\t/g, " ")
        .replace(/\n{2,}/g, "\n")
        .replace(/[ ]{2,}/g, " ")
        .replace(/Front page\.indd.*?\n/gi, "")
        .replace(/NOT FOR SALE/gi, "")
        .replace(/www\.textbooksonline\.tn\.nic\.in/gi, "")
        .replace(/Government of Tamil Nadu/gi, "")
        .trim();
};

const removeFrontMatter = (text) => {
    const possibleStartMarkers = [
        "1 INTRODUCTION",
        "1. INTRODUCTION",
        "INTRODUCTION",
        "UNIT 1",
        "Unit 1",
    ];

    for (const marker of possibleStartMarkers) {
        const index = text.indexOf(marker);
        if (index !== -1) {
            return text.slice(index);
        }
    }

    return text;
};

const chunkTextByParagraphs = (text, chunkSize = 1500, overlap = 300) => {
    const paragraphs = text
        .split("\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 30);

    const chunks = [];
    let currentChunk = "";

    for (const para of paragraphs) {
        if ((currentChunk + " " + para).length <= chunkSize) {
            currentChunk += (currentChunk ? " " : "") + para;
        } else {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }

            const overlapText =
                currentChunk.length > overlap
                    ? currentChunk.slice(currentChunk.length - overlap)
                    : currentChunk;

            currentChunk = overlapText + " " + para;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
};

const processTextbookChunks = async (req, res) => {
    try {
        const { id } = req.params;

        const textbook = await Textbook.findById(id);

        if (!textbook) {
            return res.status(404).json({ message: "Textbook not found" });
        }

        const existingChunks = await TextbookChunk.find({ textbookId: id });
        if (existingChunks.length > 0) {
            await TextbookChunk.deleteMany({ textbookId: id });
        }

        const pdfBuffer = fs.readFileSync(textbook.filePath);
        const data = await pdfParse(pdfBuffer);

        let extractedText = data.text || "";

        extractedText = cleanText(extractedText);
        extractedText = removeFrontMatter(extractedText);

        const chunks = chunkTextByParagraphs(extractedText, 1500, 300);

        const chunkDocs = chunks.map((chunk, index) => ({
            textbookId: textbook._id,
            gradeClass: textbook.gradeClass,
            subject: textbook.subject,
            title: textbook.title,
            chunkIndex: index,
            chunkText: chunk,
        }));

        await TextbookChunk.insertMany(chunkDocs);

        res.status(200).json({
            message: "Textbook cleaned, chunked, and saved successfully",
            textbookId: textbook._id,
            totalChunks: chunkDocs.length,
            preview: chunkDocs.slice(0, 2),
        });
    } catch (error) {
        console.error("Process Chunks Error:", error.message);
        res.status(500).json({ message: "Server error while processing chunks" });
    }
};
const generateEmbeddingsForTextbook = async (req, res) => {
    try {
        const { id } = req.params;

        const textbook = await Textbook.findById(id);
        if (!textbook) {
            return res.status(404).json({ message: "Textbook not found" });
        }

        const chunks = await TextbookChunk.find({ textbookId: id });

        if (!chunks.length) {
            return res.status(400).json({ message: "No chunks found for this textbook" });
        }

        let updatedCount = 0;

        for (const chunk of chunks) {
            if (chunk.embedding && chunk.embedding.length > 0) {
                continue;
            }

            const embedding = await getEmbeddingFromHuggingFace(chunk.chunkText);

            chunk.embedding = embedding;
            await chunk.save();
            updatedCount++;
        }

        res.status(200).json({
            message: "Embeddings generated successfully",
            textbookId: textbook._id,
            totalChunks: chunks.length,
            updatedCount,
        });
    } catch (error) {
        console.error("Embedding Error:", error.response?.data || error.message);
        res.status(500).json({
            message: "Server error while generating embeddings",
            error: error.response?.data || error.message,
        });
    }
};

const getAllTextbooks = async (req, res) => {
    try {
        const textbooks = await Textbook.find({
            uploadedBy: req.user._id,
        }).sort({ createdAt: -1 });

        res.status(200).json(textbooks);
    } catch (error) {
        console.error("Get All Textbooks Error:", error.message);
        res.status(500).json({ message: "Server error while fetching textbooks" });
    }
};

module.exports = {
    uploadTextbook,
    getTextbooksByGrade,
    getAllTextbooks,
    extractTextFromTextbook,
    processTextbookChunks,
    generateEmbeddingsForTextbook,
};