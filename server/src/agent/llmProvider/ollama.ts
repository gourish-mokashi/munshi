import { createOllama } from "ai-sdk-ollama";
import { aisdk } from '@openai/agents-extensions';

const ollamaClient = createOllama({
    baseURL: "http://localhost:11434",
    apiKey: 'ollama'
});

const model = aisdk(ollamaClient("kimi-k2.5:cloud"));

export default model;


