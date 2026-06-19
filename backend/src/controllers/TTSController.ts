import { Request, Response } from 'express';
import { synthesizeSpeech } from '../services/tts.service';

/**
 * POST /api/tts/synthesize
 * Body: { text: string, language?: string }
 * Returns: audio/wav buffer
 */
export const synthesize = async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for speech synthesis' });
    }

    const result = await synthesizeSpeech(text, language);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="speech.wav"`);
    res.send(result.audioBuffer);
  } catch (error: any) {
    console.error('❌ TTS Synthesis Error:', error?.message || error);
    res.status(500).json({
      error: 'Speech synthesis failed',
      message: error?.message || 'All TTS models failed',
    });
  }
};
