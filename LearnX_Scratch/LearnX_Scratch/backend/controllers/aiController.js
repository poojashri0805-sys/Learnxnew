const fetch = require("node-fetch");
const pdfParse = require("pdf-parse");
function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

exports.generateFlashcards = async (req, res) => {
  try {
    const { title = "", content = "" } = req.body;

    let pdfText = "";

    // 📄 Extract PDF text
    if (req.file) {
        const parsed = await pdfParse(req.file.buffer);
        pdfText = parsed.text || "";
    }

    const sourceText = [title, content, pdfText]
      .filter(Boolean)
      .join("\n\n");

    if (!sourceText) {
      return res.status(400).json({
        message: "Provide title, content, or upload PDF",
      });
    }

    const prompt = `
Generate 6 flashcards from the content below.

Return ONLY JSON like:
{
  "flashcards": [
    {
      "front": "Question",
      "back": "Answer",
      "topic": "Topic name",
      "difficulty": "easy | medium | hard"
    }
  ]
}

Content:
${sourceText}
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // fast + free
        messages: [
          {
            role: "system",
            content: "You generate flashcards in JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        message: data?.error?.message || "Groq API error",
      });
    }

    const raw = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch (err) {
      return res.status(500).json({
        message: "Invalid JSON from AI",
      });
    }

    const flashcards = parsed.flashcards || parsed;

    if (!flashcards || !Array.isArray(flashcards)) {
      return res.status(500).json({
        message: "No flashcards generated",
      });
    }

    res.json({ flashcards });

  } catch (error) {
    console.error("Flashcard error:", error.message);
    res.status(500).json({
      message: "Flashcard generation failed",
    });
  }
};

exports.generateQuiz = async (req, res) => {
  try {
    const { content = "", quizType = "MCQ", difficulty = "Medium", numQuestions = 5 } = req.body;

    if (!content) {
      return res.status(400).json({
        message: "Content is required",
      });
    }

    const prompt = `
Generate ${numQuestions} ${quizType} questions from the content below.

Difficulty: ${difficulty}

Rules:
- If MCQ → include 4 options and correctAnswer
- If Short Answer → include only question and correctAnswer
- If Conceptual → include explanation-based answers

Return ONLY JSON like:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A","B","C","D"],
      "correctAnswer": "A"
    }
  ]
}

Content:
${content}
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You generate quizzes in JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({
        message: data?.error?.message || "Groq API error",
      });
    }

    const raw = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch (err) {
      return res.status(500).json({
        message: "Invalid JSON from AI",
      });
    }

    const questions = parsed.questions || parsed;

    if (!questions || !Array.isArray(questions)) {
      return res.status(500).json({
        message: "No questions generated",
      });
    }

    res.json({ questions });

  } catch (error) {
    console.error("Quiz error:", error.message);
    res.status(500).json({
      message: "Quiz generation failed",
    });
  }
};