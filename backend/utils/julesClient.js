import axios from "axios";

const JULES_API_BASE = "https://jules.googleapis.com/v1alpha";

export async function createJulesSession(prompt) {
  const apiKey = process.env.JULES_API_KEY;
  const body = {
    // minimal example body; adjust per Jules docs if needed
    prompt,
    // you can include more fields (e.g., sourceContext) here if required
  };

  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
  };

  const res = await axios.post(`${JULES_API_BASE}/sessions`, body, { headers });
  return res.data;
}

export async function sendJulesMessage(sessionId, message) {
  const apiKey = process.env.JULES_API_KEY;
  const body = { prompt: message };
  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
  };

  const res = await axios.post(
    `${JULES_API_BASE}/sessions/${encodeURIComponent(sessionId)}:sendMessage`,
    body,
    { headers }
  );
  return res.data;
}
