import { HfInference } from '@huggingface/inference';
const hf = new HfInference();
async function test() {
    try {
        console.log("Calling Qwen...");
        const res = await hf.chatCompletion({
            model: 'Qwen/Qwen2.5-72B-Instruct',
            messages: [{ role: 'user', content: 'Hello' }]
        });
        console.log(res.choices[0].message);
    } catch(e) {
        console.error("Test Error:", e);
    }
}
test();
