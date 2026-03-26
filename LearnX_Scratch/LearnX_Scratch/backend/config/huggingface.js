const axios = require("axios");

const getEmbeddingFromHuggingFace = async (text) => {
    const response = await axios.post(
        "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
        {
            inputs: text,
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );

    const embedding = response.data;

    // Some HF models return nested arrays: convert to one vector if needed
    if (Array.isArray(embedding[0])) {
        const tokenVectors = embedding;
        const dimension = tokenVectors[0].length;

        const meanVector = new Array(dimension).fill(0);

        for (const tokenVector of tokenVectors) {
            for (let i = 0; i < dimension; i++) {
                meanVector[i] += tokenVector[i];
            }
        }

        for (let i = 0; i < dimension; i++) {
            meanVector[i] /= tokenVectors.length;
        }

        return meanVector;
    }

    return embedding;
};

module.exports = { getEmbeddingFromHuggingFace };