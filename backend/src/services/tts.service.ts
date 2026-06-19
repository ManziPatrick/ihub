import { InferenceClient } from "@huggingface/inference";

const HF_TOKEN = process.env.HF_TOKEN || "";
const inferenceClient = new InferenceClient(HF_TOKEN);

/** Ordered fallback chain of TTS models to try */
const TTS_MODEL_CHAIN = [
  "facebook/mms-tts",
  "suno/bark-small",
  "espnet/kan-bayashi_ljspeech_vits",
];

/**
 * Interface for the return value of the TTS service.
 */
export interface TTSResult {
  audioBuffer: Buffer;
  contentType: string;
}

/**
 * Converts text to speech using Hugging Face Inference API.
 * Falls back through multiple TTS models if one fails.
 *
 * @param text - The text to synthesize
 * @param language - Optional language code (e.g. "kin" for Kinyarwanda, "eng" for English).
 *                   Note: Only facebook/mms-tts supports multilingual TTS.
 * @returns TTSResult with audio buffer and content type
 */
export const synthesizeSpeech = async (
  text: string,
  language?: string
): Promise<TTSResult> => {
  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for speech synthesis");
  }

  let lastError: any;

  // Try each model in the chain
  for (const model of TTS_MODEL_CHAIN) {
    try {
      // For MMS-TTS, prepend language marker to the text if provided
      // facebook/mms-tts accepts text in format: "<language_code> <text>"
      // e.g. "kin Muraho" for Kinyarwanda
      const inputs = language
        ? `${language} ${text}`
        : text;

      const response = await inferenceClient.textToSpeech({
        model,
        inputs,
      });

      // response is a Blob - convert to Buffer
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      return { audioBuffer, contentType: "audio/wav" };
    } catch (error: any) {
      lastError = error;
      console.warn(`TTS model ${model} failed:`, error?.message || error);
      // Continue to next model in chain
    }
  }

  throw lastError || new Error("All TTS models in fallback chain failed");
};
