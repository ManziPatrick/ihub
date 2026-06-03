import { HfInference } from '@huggingface/inference';
const hf = new HfInference();
async function testModel(modelName: string) {
    try {
        console.log(`Testing ${modelName}...`);
        const res = await hf.chatCompletion({
            model: modelName,
            messages: [{ role: 'user', content: 'Hi' }],
            provider: 'hf-inference'
        });
        console.log(`✅ Success with ${modelName}`);
    } catch(e: any) {
        console.error(`❌ Failed ${modelName}:`, e.message);
    }
}
async function run() {
    await testModel('Qwen/Qwen2.5-1.5B-Instruct');
    await testModel('Qwen/Qwen2.5-0.5B-Instruct');
    await testModel('Qwen/Qwen2.5-7B-Instruct');
    await testModel('openai/whisper-tiny.en');
}
run();
