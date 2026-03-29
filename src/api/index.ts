import { Hono } from 'hono';
import { cors } from "hono/cors"

const app = new Hono()
  .basePath('api');

app.use(cors({
  origin: "*"
}))

app.get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }));

app.post('/contact', async (c) => {
  try {
    const body = await c.req.json();
    const { name, company, phone, email, message } = body;

    if (!name || !company || !phone) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Log the submission (in production, you'd store to DB or send email)
    console.log('Contact form submission:', { name, company, phone, email, message });

    // Return success
    return c.json({ success: true, message: 'Form submitted successfully' });
  } catch (err) {
    console.error('Contact form error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
