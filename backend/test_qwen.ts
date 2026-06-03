import { HfInference } from '@huggingface/inference';
const hf = new HfInference();
async function test() {
    try {
        const res = await hf.chatCompletion({
            model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
            messages: [{ role: 'user', content: 'Hi' }]
        });
        console.log("✅ Qwen Coder Success!");
    } catch(e: any) {
        console.error("❌ Qwen Coder Failed:", e.message);
    }
}
test();
