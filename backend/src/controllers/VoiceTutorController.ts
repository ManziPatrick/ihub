import { Request, Response } from 'express';
import { HfInference } from '@huggingface/inference';
import fs from 'fs';

const hf = new HfInference(process.env.HF_TOKEN || '');

export const handleVoiceChat = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No audio file provided' });
            return;
        }

        const audioPath = req.file.path;
        const audioData = fs.readFileSync(audioPath);
        // 1. Speech-to-Text using Whisper (Raw fetch to avoid SDK Blob parsing bugs)
        const hfToken = process.env.HF_TOKEN || '';
        const whisperResponse = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3", {
            headers: {
                Authorization: `Bearer ${hfToken}`,
                "Content-Type": req.file.mimetype || "audio/webm",
            },
            method: "POST",
            body: audioData,
        });

        if (!whisperResponse.ok) {
            const errorText = await whisperResponse.text();
            throw new Error(`Whisper API Error: ${whisperResponse.statusText} - ${errorText}`);
        }

        const transcription = (await whisperResponse.json()) as { text: string };
        const userText = transcription.text;
        
        if (!userText || userText.trim() === '') {
             res.status(400).json({ error: 'Could not transcribe audio or no speech detected.' });
             try { fs.unlinkSync(audioPath); } catch(e) {}
             return;
        }

        // 2. Chat using a smaller, free-tier friendly model
        const chatResponse = await hf.chatCompletion({
            model: 'Qwen/Qwen2.5-7B-Instruct', 
            messages: [
                { role: 'system', content: 'You are an African-friendly AI Voice Tutor learning assistant. You support Kinyarwanda, French, and English. Be concise, encouraging, and helpful. Do not use emojis. Always respond in the language the user speaks to you.' },
                { role: 'user', content: userText }
            ],
            max_tokens: 150,
            provider: 'hf-inference'
        });

        const aiText = chatResponse.choices[0].message.content || 'Hello, I am here to help you.';

        // 3. Text-to-Speech
        // The user requested XTTS-v2. We try to use it via Inference API.
        // If it requires parameters not supplied, it might fail, so we wrap it in a try-catch.
        let base64Audio = '';
        try {
            const audioBlob = await hf.textToSpeech({
                model: 'coqui/XTTS-v2',
                inputs: aiText,
                provider: 'hf-inference'
            });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            base64Audio = buffer.toString('base64');
        } catch (ttsError) {
            console.warn('TTS Generation with XTTS-v2 failed, falling back to MMS:', ttsError);
            try {
                // Fallback to MMS if XTTS-v2 fails due to missing speaker embeddings
                const fallbackBlob = await hf.textToSpeech({
                    model: 'facebook/mms-tts-eng',
                    inputs: aiText,
                    provider: 'hf-inference'
                });
                const arrayBuffer = await fallbackBlob.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                base64Audio = buffer.toString('base64');
            } catch (fallbackError) {
                console.error('Fallback TTS also failed:', fallbackError);
            }
        }

        // Cleanup
        try {
            fs.unlinkSync(audioPath);
        } catch(e) {}

        res.json({
            userText,
            aiText,
            audio: base64Audio ? `data:audio/flac;base64,${base64Audio}` : null
        });

    } catch (error: any) {
        console.error('Voice Tutor Error:', error);
        res.status(500).json({ error: 'Failed to process voice interaction', details: error.message });
    }
};
