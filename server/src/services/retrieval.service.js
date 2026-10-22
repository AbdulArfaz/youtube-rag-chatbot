import {
  vectorStore,
  addYTVideoToVectorStore,
} from "./vector-store.service.js";

import {
  cleanYouTubeVideoId,
  fetchYouTubeTranscript,
} from "./transcript.service.js";

const loadedVideos = new Set();

export const retrieveTranscriptContext = async (query, videoId) => {
  const cleanVideoId = cleanYouTubeVideoId(videoId);

  if (!cleanVideoId) {
    return "No video ID provided.";
  }

  console.log("Searching vector store for:", cleanVideoId);
  console.log("User query:", query);

  if (!loadedVideos.has(cleanVideoId)) {
    try {
      const transcriptData =
        await fetchYouTubeTranscript(cleanVideoId);

      await addYTVideoToVectorStore(transcriptData);

      loadedVideos.add(cleanVideoId);

      console.log(
        `Video ${cleanVideoId} loaded into vector store.`
      );
    } catch (error) {
      console.error("Transcript ingestion error:", error.message);

      return `Unable to load transcript for video ID "${cleanVideoId}".`;
    }
  }

  if (!vectorStore) {
    throw new Error("Vector store has not been initialized.");
  }

  let retrievedDocs = [];

  try {
    retrievedDocs = await vectorStore.similaritySearch(
      query,
      5,
      { video_id: cleanVideoId }
    );
  } catch (error) {
    console.error("Filtered search error:", error.message);
  }

  if (!retrievedDocs || retrievedDocs.length === 0) {
    console.log("Running fallback vector search...");

    const allDocs = await vectorStore.similaritySearch(query, 15);

    retrievedDocs = allDocs.filter(
      (doc) =>
        doc.metadata &&
        String(doc.metadata.video_id) === String(cleanVideoId)
    );
  }

  const contextText = retrievedDocs
    .map((doc) => doc.pageContent)
    .join("\n\n");

  console.log(
    `Retrieved ${retrievedDocs.length} chunks for video ${cleanVideoId}.`
  );

  return (
    contextText ||
    `No transcript chunks found for video ID "${cleanVideoId}".`
  );
};