import "dotenv/config";
import { PGVectorStore } from "@langchain/pgvector";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

import { pgPool } from "../config/database.js";
import { embeddings } from "./embedding.service.js";

export let vectorStore;

export const initializeVectorStore = async () => {
  try {
    vectorStore = await PGVectorStore.initialize(embeddings, {
      pool: pgPool,
      tableName: "transcripts",
      columns: {
        idColumnName: "id",
        vectorColumnName: "vector",
        contentColumnName: "content",
        metadataColumnName: "metadata",
      },
      distanceStrategy: "cosine",
    });

    console.log("Vector store initialized successfully");

    return vectorStore;
  } catch (error) {
    console.error(
      "Failed to initialize vector store:",
      error.message
    );

    throw error;
  }
};

export const addYTVideoToVectorStore = async (videoData) => {
  if (!vectorStore) {
    throw new Error("Vector store has not been initialized.");
  }

  const transcript = videoData.transcript || videoData.text;
  const video_id = videoData.video_id;

  if (!transcript || transcript.trim().length === 0) {
    throw new Error("Transcript is empty or failed to load.");
  }

  if (!video_id) {
    throw new Error("YouTube video ID is required.");
  }

  const docs = [
    new Document({
      pageContent: transcript,
      metadata: { video_id },
    }),
  ];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const rawChunks = await splitter.splitDocuments(docs);

  const chunks = rawChunks.map(
    (chunk) =>
      new Document({
        pageContent: chunk.pageContent,
        metadata: {
          ...chunk.metadata,
          video_id,
        },
      })
  );

  console.log(
    `Prepared ${chunks.length} chunks for video ${video_id}.`
  );

  const batchSize = 20;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    await vectorStore.addDocuments(batch);

    console.log(
      `Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(chunks.length / batchSize)}`
    );
  }

  console.log(
    `Successfully added video (${video_id}) with ${chunks.length} chunks.`
  );

  return chunks.length;
};