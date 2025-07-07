// This is a Cloudflare Pages Function. It acts as our secure server.
export async function onRequest(context) {
    // 1. We only accept POST requests
    if (context.request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        // 2. Get the topic from the student's request
        const { topic } = await context.request.json();
        
        if (!topic) {
             return new Response(JSON.stringify({ error: 'Topic is required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // 3. Get your secret API key from Cloudflare's environment variables
        const GEMINI_API_KEY = context.env.GEMINI_API_KEY;

        // 4. Create the detailed prompt for the AI
        const prompt = `You are a helpful English writing assistant for a student in middle school (grades 7-9). Generate a clear, structured, 5-paragraph essay outline for the following topic: "${topic}". The outline must include an introduction with a hook and thesis, three body paragraphs with topic sentences and supporting points, and a conclusion. Format the output using clear headings and bullet points.`;

        // 5. Call the Google Gemini API (server-to-server)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google API Error: ${errorText}`);
        }

        const data = await response.json();

        // 6. Send the AI's response back to the student's browser
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to generate outline.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}