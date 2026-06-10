import { HfInference } from '@huggingface/inference';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const hf = new HfInference(process.env.HF_TOKEN);

async function test() {
    try {
        const audioData = fs.readFileSync('uploads/dummy.webm');
        const audioBase64 = audioData.toString('base64');
        const dataUrl = `data:audio/wav;base64,${audioBase64}`;

        console.log("Calling whisper...");
        const transcription = await hf.automaticSpeechRecognition({
            model: 'openai/whisper-large-v3',
            data: dataUrl as any
        });
        
        console.log(transcription);
    } catch(e: any) {
        console.error("Test Error:", e.message);
    }
}
test();
