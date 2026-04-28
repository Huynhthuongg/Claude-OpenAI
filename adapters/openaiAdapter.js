// Minimal OpenAI adapter. Install: npm i openai
let client = null;
const key = process.env.OPENAI_API_KEY || '';

try {
  const { Configuration, OpenAIApi } = require('openai');
  const cfg = new Configuration({ apiKey: key });
  client = new OpenAIApi(cfg);
} catch (err) {
  console.log('OpenAI module not installed. Install with: npm i openai');
}

module.exports.generate = async (prompt, opts={}) => {
  if(!client) return { text: `OpenAI module not installed. Prompt was: ${prompt}` };
  if(!key) return { text: `OpenAI API key not set. Prompt was: ${prompt}` };
  const resp = await client.createCompletion({
    model: opts.model || 'text-davinci-003',
    prompt,
    max_tokens: opts.max_tokens || 512,
  });
  return { text: resp.data.choices?.[0]?.text || '' };
};
