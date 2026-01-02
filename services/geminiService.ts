
import { GoogleGenAI } from "@google/genai";
import { Rider, Trip } from "../types";

export const getRideAdvice = async (trip: Trip, userPrompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const ridersSummary = trip.riders.length > 0 
    ? trip.riders.map(r => `${r.name}: ${r.status} at (${r.location.lat.toFixed(4)}, ${r.location.lng.toFixed(4)})`).join(', ')
    : "Only one rider active.";

  const systemInstruction = `
    You are RideSync AI, a helpful co-pilot for bike trips.
    You have access to the real-time locations of all riders in the group.
    
    Context:
    Trip Name: ${trip.name}
    Final Destination: ${trip.destination}
    Riders Status: ${ridersSummary}
    
    Your Personality:
    - Friendly, street-smart, and helpful.
    - Use the word "Mawa" occasionally (a friendly Telugu term for 'bro/mate').
    - Keep advice concise (riders are on the move!).
    
    Your Tasks:
    1. Always suggest the best route or specific points of interest (POI) on the way to ${trip.destination}.
    2. Mention actual possible landmarks or stops (like fuel, food, scenic spots) relevant to that route.
    3. If riders are split up, suggest a specific meeting point.
    4. If only one rider is present, offer encouraging route advice and POIs.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text || "Eyes on the road, Mawa! I'm here if you need route help.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error syncing with satellites. Stick to the plan, Mawa!";
  }
};

export const getQuickStatusUpdate = async (trip: Trip) => {
  const prompt = "Give me a 1-sentence mawa-style status update of where we stand on this trip.";
  return getRideAdvice(trip, prompt);
};
