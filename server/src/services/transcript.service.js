import "dotenv/config";

export const cleanYouTubeVideoId = (videoId = "") => {
  const value = videoId.trim();
  const match = value.match(/(?:v=|\/|^)([0-9A-Za-z_-]{11})/);

  return match?.[1] || value;
};

export const fetchYouTubeTranscript = async (videoId) => {
  const cleanVideoId = cleanYouTubeVideoId(videoId);

  if (!cleanVideoId) {
    throw new Error("YouTube video ID is required.");
  }

  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY is missing from environment variables.");
  }

  const url = new URL(
    "https://youtube-transcript3.p.rapidapi.com/api/transcript"
  );

  url.searchParams.set("videoId", cleanVideoId);
  url.searchParams.set("flat_text", "true");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Transcript API failed with status ${response.status}.`
    );
  }

  const data = await response.json();

  let fullText = "";

  if (typeof data.transcript === "string") {
    fullText = data.transcript;
  } else if (typeof data.body === "string") {
    fullText = data.body;
  } else if (typeof data.text === "string") {
    fullText = data.text;
  } else if (Array.isArray(data)) {
    fullText = data
      .map((item) => item.text || item.snippet || "")
      .filter(Boolean)
      .join(" ");
  }

  if (!fullText.trim()) {
    throw new Error(
      `No transcript available for video ID "${cleanVideoId}".`
    );
  }

  console.log(
    `Transcript fetched successfully for ${cleanVideoId}.`
  );

  return {
    video_id: cleanVideoId,
    text: fullText,
  };
};