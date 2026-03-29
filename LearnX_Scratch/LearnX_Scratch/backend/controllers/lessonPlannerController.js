const fetch = require("node-fetch");

function extractJson(text) {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? match[0] : text;
}

async function searchTrustedResource(subject, topicName) {
    try {
        const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
        const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

        if (!apiKey || !cx) {
            return {
                resourceTitle: `${topicName} resource`,
                resourceSource: "Search not configured",
                resourceLink: "",
            };
        }

        const query = `${subject} ${topicName} site:khanacademy.org OR site:openstax.org OR site:ck12.org`;

        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(
            query
        )}`;

        const response = await fetch(url);
        const data = await response.json();

        const item = data.items?.[0];

        if (!item) {
            return {
                resourceTitle: `${topicName} resource`,
                resourceSource: "No trusted result found",
                resourceLink: "",
            };
        }

        let source = "Trusted Resource";
        if (item.link.includes("khanacademy.org")) source = "Khan Academy";
        else if (item.link.includes("openstax.org")) source = "OpenStax";
        else if (item.link.includes("ck12.org")) source = "CK-12";

        return {
            resourceTitle: item.title || `${topicName} resource`,
            resourceSource: source,
            resourceLink: item.link || "",
        };
    } catch (error) {
        console.error("Resource search error:", error.message);
        return {
            resourceTitle: `${topicName} resource`,
            resourceSource: "Search failed",
            resourceLink: "",
        };
    }
}

async function searchYouTubeVideo(subject, topicName) {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;

        if (!apiKey) {
            return {
                videoTitle: `${topicName} video`,
                videoLink: "",
            };
        }

        const query = `${subject} ${topicName}`;

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(
            query
        )}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        const item = data.items?.[0];

        if (!item) {
            return {
                videoTitle: `${topicName} video`,
                videoLink: "",
            };
        }

        return {
            videoTitle: item.snippet?.title || `${topicName} video`,
            videoLink: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        };
    } catch (error) {
        console.error("YouTube search error:", error.message);
        return {
            videoTitle: `${topicName} video`,
            videoLink: "",
        };
    }
}

exports.generateLessonPlan = async (req, res) => {
    try {
        const {
            subject = "",
            className = "",
            lessonTitle = "",
            lessonContent = "",
            startDate = "",
            deadline = "",
            workingDays = [],
            periodsPerDay = 1,
            hoursPerPeriod = 1,
            learningGoal = "",
        } = req.body;

        if (
            !subject ||
            !className ||
            !lessonTitle ||
            !lessonContent ||
            !startDate ||
            !deadline ||
            !workingDays.length
        ) {
            return res.status(400).json({
                message: "All lesson planning fields are required",
            });
        }

        // Calculate actual teaching dates based on start date, deadline, and selected working days
        const start = new Date(startDate);
        const end = new Date(deadline);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const teachingDates = [];

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayName = dayNames[date.getDay()];
            if (workingDays.includes(dayName)) {
                teachingDates.push({
                    date: date.toISOString().split('T')[0],
                    day: dayName
                });
            }
        }

        const totalPeriodsAvailable = teachingDates.length * periodsPerDay;
        const teachingDatesStr = teachingDates.map(d => `${d.day} - ${d.date}`).join("\n");
        const lastTeachingDate = teachingDates.length > 0 ? teachingDates[teachingDates.length - 1] : null;

        const prompt = `
Generate an adaptive lesson plan in JSON only.

Return ONLY JSON in this exact format:
{
  "lessonTitle": "",
  "subject": "",
  "className": "",
  "startDate": "",
  "deadline": "",
  "summary": "",
  "totalTeachingDays": 0,
  "totalPeriodsAvailable": 0,
  "topics": [
    {
      "topicName": "",
      "difficulty": "easy | medium | hard",
      "estimatedPeriods": 1,
      "learningOutcome": "",
      "activity": "",
      "assessment": "",
      "practiceQuestions": [
        {
          "type": "conceptual",
          "question": ""
        },
        {
          "type": "application",
          "question": ""
        },
        {
          "type": "challenge",
          "question": ""
        }
      ]
    }
  ],
  "schedule": [
    {
      "day": "",
      "date": "",
      "period": 1,
      "focusTopic": "",
      "goal": "",
      "teachingStrategy": "",
      "resource": "",
      "checkpoint": ""
    }
  ],
  "revisionPlan": {
    "overview": "",
    "reviewStrategy": "",
    "topicsToReview": [],
    "timeRequired": "",
    "resources": ""
  },
  "bufferPlan": {
    "overview": "",
    "compressedStrategy": "",
    "prioritizedTopics": [],
    "timeframe": "",
    "alternativeActivities": ""
  },
  "riskAreas": [],
  "fallbackPlan": ""
}

Lesson details:
Subject: ${subject}
Class: ${className}
Lesson Title: ${lessonTitle}
Lesson Content: ${lessonContent}
Start Date: ${startDate}
Deadline: ${deadline}
Periods Per Day: ${periodsPerDay}
Hours Per Period: ${hoursPerPeriod}
Learning Goal: ${learningGoal}
Total Teaching Days: ${teachingDates.length}
Total Periods Available: ${totalPeriodsAvailable}

TEACHING DATES (only schedule for these dates):
${teachingDatesStr}

LAST TEACHING DATE: ${lastTeachingDate ? `${lastTeachingDate.day} - ${lastTeachingDate.date}` : 'N/A'}

Important instructions:
- ONLY create schedule entries for the teaching dates listed above
- Create ${totalPeriodsAvailable} schedule entries total (one for each period across all teaching days)
- Split content by conceptual difficulty, not equally
- REVISION PLAN: Create ONE comprehensive plan to review and revise ALL topics covered in the lesson. Include review strategies, key concepts to revisit, and time estimation.
- BUFFER PLAN: Create ONE alternative compressed plan in case the teacher falls behind. This should prioritize essential topics, suggest intensive teaching methods, and provide backup activities if time runs short.
- Suggest classroom activities
- Suggest mini assessments
- Mention likely student confusion areas
- Create a realistic day-wise teaching plan
- For each topic give 3 practice questions:
  1. conceptual
  2. application
  3. challenge / competitive-exam style
`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: "You generate lesson plans in JSON only.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.7,
                }),
            }
        );

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

        if (parsed?.topics && Array.isArray(parsed.topics)) {
            const enrichedTopics = await Promise.all(
                parsed.topics.map(async (topic) => {
                    const resource = await searchTrustedResource(subject, topic.topicName || "Topic");
                    const video = await searchYouTubeVideo(subject, topic.topicName || "Topic");

                    return {
                        ...topic,
                        resourceTitle: resource.resourceTitle,
                        resourceSource: resource.resourceSource,
                        resourceLink: resource.resourceLink,
                        videoTitle: video.videoTitle,
                        videoLink: video.videoLink,
                    };
                })
            );

            parsed.topics = enrichedTopics;
        }

        // Fix schedule dates to show actual day of week and match teaching dates
        if (parsed?.schedule && Array.isArray(parsed.schedule)) {
            parsed.schedule = parsed.schedule.map((item, index) => {
                // Use the pre-calculated teaching dates
                if (index < teachingDates.length) {
                    const teachingDate = teachingDates[index];
                    return {
                        ...item,
                        day: teachingDate.day,
                        date: teachingDate.date
                    };
                }
                return item;
            }).filter((_, index) => index < teachingDates.length * periodsPerDay);
        }

        // Ensure revision and buffer plans are comprehensive single plans
        // (they're already generated by AI, just ensure they exist)
        if (parsed && !parsed.revisionPlan) {
            parsed.revisionPlan = {
                overview: "Comprehensive review of all topics",
                reviewStrategy: "Systematic review with practice questions",
                topicsToReview: parsed.topics?.map(t => t.topicName) || [],
                timeRequired: "Final 1-2 classes",
                resources: "Practice question sets, concept maps, summary notes"
            };
        }

        if (parsed && !parsed.bufferPlan) {
            parsed.bufferPlan = {
                overview: "Compressed teaching plan if falling behind",
                compressedStrategy: "Focus on core concepts and essential applications",
                prioritizedTopics: parsed.topics?.filter(t => t.difficulty !== "easy").map(t => t.topicName) || [],
                timeframe: "Reduced schedule with intensive sessions",
                alternativeActivities: "Self-study assignments and peer learning groups"
            };
        }

        // Update totals based on actual teaching days
        if (parsed) {
            parsed.totalTeachingDays = teachingDates.length;
            parsed.totalPeriodsAvailable = totalPeriodsAvailable;
        }

        res.json({ lessonPlan: parsed });
    } catch (error) {
        console.error("Lesson planner error:", error.message);
        res.status(500).json({
            message: "Lesson plan generation failed",
        });
    }
};