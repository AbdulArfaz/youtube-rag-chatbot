import { agent } from "../services/agent.service.js";
import { cleanYouTubeVideoId } from "../services/transcript.service.js";

export const generateResponse = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const { query, video_id, thread_id } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        role: "assistant",
        content: "Please provide a valid query.",
      });
    }

    const cleanVideoId = cleanYouTubeVideoId(video_id || "");

    const activeThreadId = thread_id || "default_thread";

    const results = await agent.invoke(
      {
        messages: [
          {
            role: "user",
            content: query.trim(),
          },
        ],
      },
      {
        configurable: {
          thread_id: activeThreadId,
          video_id: cleanVideoId,
        },
      }
    );

    const messages = results.messages || [];

    const aiMessage = [...messages].reverse().find(
      (message) =>
        (
          message._getType?.() === "ai" ||
          message.role === "assistant" ||
          message.constructor?.name === "AIMessage"
        ) &&
        message.content
    );

    const content =
      typeof aiMessage?.content === "string"
        ? aiMessage.content
        : JSON.stringify(
            aiMessage?.content || "No response generated."
          );

    return res.json({
      role: "assistant",
      content,
    });
  } catch (error) {
    console.error("Agent execution error:", error);

    return res.status(500).json({
      role: "assistant",
      content: `Server Error: ${error.message}`,
    });
  }
};