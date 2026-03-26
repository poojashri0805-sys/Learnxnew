const axios = require("axios");
const ChatHistory = require("../models/ChatHistory");
const TextbookChunk = require("../models/TextbookChunk");
const { getEmbeddingFromHuggingFace } = require("../config/huggingface");
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        return -1;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
        return -1;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
const askChatbot = async (req, res) => {
    try {
        const { question, subject, sessionId } = req.body;

        if (!question || !sessionId) {
            return res.status(400).json({ message: "Question and sessionId are required" });
        }

        const studentId = req.user._id;
        const gradeClass = req.user.gradeClass;

        if (!gradeClass) {
            return res.status(400).json({ message: "Student gradeClass not found" });
        }

        const questionEmbedding = await getEmbeddingFromHuggingFace(question);

        const chunks = await TextbookChunk.find({
            gradeClass,
            ...(subject ? { subject } : {}),
            embedding: { $exists: true, $ne: [] },
        });

        if (!chunks.length) {
            return res.status(404).json({
                message: "No embedded chunks found for this student's grade and subject",
            });
        }

        const rankedChunks = chunks
            .map((chunk) => {
                const similarity = cosineSimilarity(questionEmbedding, chunk.embedding);
                return {
                    ...chunk.toObject(),
                    similarity,
                };
            })
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);

        const context = rankedChunks
            .map(
                (chunk, index) =>
                    `Chunk ${index + 1} (score: ${chunk.similarity.toFixed(4)}):\n${chunk.chunkText}`
            )
            .join("\n\n");

        const prompt = `
You are a helpful educational assistant for students.

Answer the student's question only based on the provided textbook context.
If the answer is not clearly available in the context, say exactly:
"I could not find the exact answer in the textbook content provided."

Do not use outside knowledge.
Do not guess.
Do not add information not present in the context.

Grade: ${gradeClass}
Subject: ${subject || "General"}

Textbook Context:
${context}

Student Question:
${question}
`;

        const groqResponse = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: "You are a precise and helpful academic tutor.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.1,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const answer =
            groqResponse.data.choices?.[0]?.message?.content ||
            "No response generated.";

        const savedChat = await ChatHistory.create({
            studentId,
            sessionId,
            gradeClass,
            subject: subject || "General",
            question,
            answer,
        });

        res.status(200).json({
            message: "Chatbot response generated successfully",
            answer,
            chatId: savedChat._id,
            sessionId,
            retrievedChunks: rankedChunks.map((chunk) => ({
                chunkIndex: chunk.chunkIndex,
                similarity: Number(chunk.similarity.toFixed(4)),
                preview: chunk.chunkText.substring(0, 250),
            })),
        });
    } catch (error) {
        console.error("Chatbot Error:", error.response?.data || error.message);
        res.status(500).json({
            message: "Server error while generating chatbot response",
            error: error.response?.data || error.message,
        });
    }
};
const getChatHistory = async (req, res) => {
    try {
        const studentId = req.user._id;
        const chats = await ChatHistory.find({ studentId }).sort({ createdAt: 1 });
        res.status(200).json(chats);
    } catch (error) {
        console.error("Get Chat History Error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
module.exports = {
    askChatbot,
    getChatHistory,
};