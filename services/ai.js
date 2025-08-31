const OpenAI = require('openai');
const fetch = require('node-fetch');
const fs = require('fs').promises;

const {
  getOrCreateUser,
  updateLastActive,
  addExperiencePoints,
  saveLesson
} = require('../database');

class MistralAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.mistral.ai/v1';
    this.available = !!apiKey;
  }
  async chatCompletion(messages, model = 'mistral-small-latest') {
    if (!this.available) throw new Error('Mistral API Key nicht verfügbar');
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens: 400, temperature: 0.7 })
    });
    if (!response.ok) throw new Error(`Mistral API Error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0].message.content;
  }
}

class SmartAPIRouter {
  constructor(openai, mistralKey) {
    if (!openai) throw new Error('OPENAI client required');
    this.openai = openai;
    this.mistral = mistralKey ? new MistralAPI(mistralKey) : null;
    this.dailyCosts = 0;
    this.lastResetDate = new Date().toDateString();
    this.apiStats = {
      mistral: { calls: 0 },
      gpt4o_mini: { calls: 0 },
      gpt4o: { calls: 0 }
    };
  }
  analyzeComplexity(message) {
    const msg = (message || '').toLowerCase().trim();
    if (msg.length < 10) return 'simple';
    const simplePatterns = [/^(hallo|hi|hey|hello|bonjour|salut|marhaba|ahlan)/, /(danke|merci|shukran)/];
    if (simplePatterns.some(p => p.test(msg))) return 'simple';
    const complexKeywords = ['grammatik','explain','why','unterschied','regel'];
    const hasComplex = complexKeywords.some(k => msg.includes(k));
    if (hasComplex || msg.length > 150 || (msg.match(/\?/g) || []).length > 2) return 'complex';
    return 'medium';
  }
  selectModel(complexity) {
    if (complexity === 'simple' && this.mistral?.available) {
      return { provider: 'mistral', model: 'mistral-small-latest', estimatedCost: 0 };
    }
    if (complexity === 'complex') return { provider: 'openai', model: 'gpt-4o', estimatedCost: 5.0 };
    return { provider: 'openai', model: 'gpt-4o-mini', estimatedCost: 0.24 };
  }
  async callAPI(messages, selected) {
    if (selected.provider === 'mistral') {
      const res = await this.mistral.chatCompletion(messages, selected.model);
      this.apiStats.mistral.calls++;
      return res;
    }
    const response = await this.openai.chat.completions.create({ model: selected.model, messages, max_tokens: 400, temperature: 0.7 });
    if (selected.model === 'gpt-4o-mini') this.apiStats.gpt4o_mini.calls++; else this.apiStats.gpt4o.calls++;
    return response.choices[0].message.content;
  }
}

function systemPrompt(userLanguage, userLevel, trainingData) {
  return `You are a professional DaF/DaZ teacher.\nUSER LANGUAGE: ${userLanguage}\nGERMAN LEVEL: ${userLevel}\nTRAINING DATA:\n${trainingData || ''}\nAlways reply in the user's language.`;
}

function createAIService(openaiClient, mistralKey) {
  const router = new SmartAPIRouter(openaiClient, mistralKey);
  let training = '';

  async function loadTrainingData() {
    try {
      training = await fs.readFile('./training_data.txt', 'utf8');
    } catch {
      training = 'Standard DaF/DaZ Wissen';
    }
  }

  async function getAIResponse(userMessage, phoneNumber) {
    const user = await getOrCreateUser(phoneNumber);
    if (user.status !== 'approved') {
      return {
        text: (user.preferred_language || 'english') === 'french' ?
          "⏳ Votre inscription n'est pas encore approuvée." :
          (user.preferred_language || 'english') === 'arabic' ?
          '⏳ لم تتم الموافقة على تسجيلك بعد.' :
          '⏳ Your registration is not approved yet.',
        meta: { blocked: true }
      };
    }

    await updateLastActive(phoneNumber);
    const context = { language: user.preferred_language || 'english', level: user.german_level || 'A1' };
    const complexity = router.analyzeComplexity(userMessage, context);
    const selected = router.selectModel(complexity, context);
    const messages = [
      { role: 'system', content: systemPrompt(context.language, context.level, training) },
      { role: 'user', content: userMessage }
    ];
    const content = await router.callAPI(messages, selected);

    let points = 10;
    if (selected.provider === 'openai' && selected.model === 'gpt-4o-mini') points = 15;
    if (selected.provider === 'openai' && selected.model === 'gpt-4o') points = 20;
    await addExperiencePoints(phoneNumber, points, 'conversation');
    await saveLesson(phoneNumber, {
      type: 'conversation', content: userMessage, userResponse: userMessage, aiFeedback: content,
      points, isCorrect: true, level: context.level, grammarTopic: 'conversation'
    });

    return { text: content, meta: { complexity, model: selected } };
  }

  return { loadTrainingData, getAIResponse };
}

module.exports = { createAIService };

