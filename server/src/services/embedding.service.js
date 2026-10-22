import { pipeline } from "@xenova/transformers";

class XenovaEmbeddings {
  constructor() {
    this.pipe = null;
  }

  async init() {
    if (!this.pipe) {
      console.log(
        "Loading local embedding model (Xenova/all-MiniLM-L6-v2)..."
      );

      this.pipe = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );

      console.log("Local embedding model loaded successfully!");
    }
  }

  async embedDocuments(texts) {
    await this.init();

    const results = [];

    for (const text of texts) {
      const output = await this.pipe(text, {
        pooling: "mean",
        normalize: true,
      });

      results.push(Array.from(output.data));
    }

    return results;
  }

  async embedQuery(text) {
    await this.init();

    const output = await this.pipe(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data);
  }
}

export const embeddings = new XenovaEmbeddings();