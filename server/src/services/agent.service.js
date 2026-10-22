import "dotenv/config";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MemorySaver } from "@langchain/langgraph";

import { retrieveTranscriptContext } from "./retrieval.service.js";

const retrieveTool = tool(
  async ({ query }, config) => {
    const video_id = config?.configurable?.video_id;

    try {
      return await retrieveTranscriptContext(query, video_id);
    } catch (error) {
      console.error("Retrieval tool error:", error.message);

      return "An error occurred while retrieving the video transcript.";
    }
  },
  {
    name: "retrieve",
    description:
      "Retrieve relevant information from a YouTube video's transcript to answer the user's question.",
    schema: z.object({
      query: z.string().describe(
        "The question or search query about the video."
      ),
    }),
  }
);

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash-lite",
  temperature: 0,
  apiKey: process.env.GEMINI_API_KEY,
});

const checkpointer = new MemorySaver();

export const agent = createReactAgent({
  llm,
  tools: [retrieveTool],
  checkpointer,
  prompt: `You are an AI assistant that answers questions about a YouTube video using its transcript.

1. If the user greets you, greet them politely.
2. If the user asks a question about the video, use the retrieve tool.
3. Base your answers strictly on the retrieved transcript content.
4. If the transcript does not contain the answer, clearly say that the information was not found in the transcript.`,
});