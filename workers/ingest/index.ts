// Ingest Worker - Handles receiving and parsing inbound emails and enqueues them for processing.

import { IRequest, Router, error, json } from 'itty-router';

// Define the router
const router = Router();

// Handle incoming email webhook from SendGrid/Mailgun
router.post('/webhook/gdacs', async (request: IRequest, env: Env) => {
  // TODO: Implement email signature validation

  try {
    // TODO: Implement MIME parsing to extract attachments and body
    const rawEmailPayload = await request.text();
    console.log("Received raw email payload:", rawEmailPayload);

    // TODO: Enqueue parsing tasks using a Durable Object or KV queue
    // For now, just acknowledge receipt
    console.log("Email received and acknowledged. Parsing and enqueuing tasks are TODO.");

    return json({ status: 'received', message: 'Email payload received and processing enqueued (TODO)' });
  } catch (err) {
    console.error("Error processing email webhook:", err);
    return error(500, 'Error processing email');
  }
});

// Handle scheduled cron trigger for alternative polling (if needed)
router.get('/cron/poll-email', async (request: IRequest, env: Env) => {
  // TODO: Implement IMAP/POP3 client to fetch emails

  console.log("Cron trigger received for email polling. Polling logic is TODO.");

  return json({ status: 'triggered', message: 'Email polling triggered (TODO)' });
});

// Catch all for any other requests
router.all('*', () => error(404, 'Not Found'));

// Define the Worker environment
interface Env {
  // Add any necessary environment variables here, e.g.:
  // GDACS_WEBHOOK_SECRET: string;
  // Durable Objects or KV namespaces
  // EMAIL_QUEUE: Queue; // If using Queues
}

// Worker entry point
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env, ctx);
  },

  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Handle scheduled events (for the cron trigger)
    if (event.cron === '5 0 * * *') { // Match the cron pattern defined in wrangler.toml
      console.log('Scheduled cron event triggered.');
      // Manually trigger the cron handler route
      await router.handle(new Request('https://dummy-url/cron/poll-email', { method: 'GET' }), env, ctx);
    }
  },
};