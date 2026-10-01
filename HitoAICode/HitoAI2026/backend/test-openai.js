require('dotenv').config();

(async () => {
  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const r = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      input: "Di 'hola' y una recomendación corta para un docente."
    });

    console.log('OK:', r.output_text);
  } catch (e) {
    console.error('FALLÓ:', e?.status, e?.message);
    console.error(e?.error || e);
  }
})();
