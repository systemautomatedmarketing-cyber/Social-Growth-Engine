"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateContent = generateContent;
const openai_1 = __importDefault(require("openai"));
async function generateContent(template, variables) {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY not set. Returning mock AI response.");
        return `[Mock AI Output] Generated content for template using variables: ${JSON.stringify(variables)}`;
    }
    const openai = new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY,
    });
    // Replace {{key}} with value
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
        });
        return response.choices[0].message.content || "";
    }
    catch (error) {
        console.error("OpenAI Error:", error);
        throw new Error("Failed to generate content");
    }
}
