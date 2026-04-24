// Minimal OpenAI adapter. Install: npm i openai
const { Configuration, OpenAIApi } = require('openai');
const key = process.env.OPENAI_API_KEY || '';
const cfg = new Configuration({ apiKey: key });
const client = new OpenAIApi(cfg);

module.exports.generate = async (prompt, opts={}) => {
  if(!key) return { text: `OpenAI API key not set. Prompt was: ${prompt}` };
  const resp = await client.createCompletion({
    model: opts.model || 'text-davinci-003',
    prompt,
    max_tokens: opts.max_tokens || 512,
  });
  return { text: resp.data.choices?.[0]?.text || '' };
};
