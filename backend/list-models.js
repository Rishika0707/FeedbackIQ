
import dotenv from "dotenv";

dotenv.config();

const key = process.env.GEMINI_API_KEY;

if (!key) {
  console.log("Gemini API key not found in backend/.env");
  process.exit(1);
}

const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models",
  {
    headers: {
      "x-goog-api-key": key
    }
  }
);

if (!response.ok) {
  console.log("Could not list models:", response.status);
  console.log(await response.text());
  process.exit(1);
}

const data = await response.json();

console.log("\nAvailable Gemini models:\n");

for (const model of data.models || []) {
  if (model.supportedGenerationMethods?.includes("generateContent")) {
    console.log(model.name.replace("models/", ""));
  }
}
