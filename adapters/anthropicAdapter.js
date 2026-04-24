// Stub: replace with anthropic SDK / REST call and set ANTHROPIC_API_KEY
module.exports.generate = async (prompt, opts={}) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if(!key) return { text: `Anthropic key not set. Prompt: ${prompt}` };
  // Implement using Anthropic client here.
  return { text: `Claude response (stub) for: ${prompt}` };
};
