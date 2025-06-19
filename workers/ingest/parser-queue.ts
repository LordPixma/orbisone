import { parseAndEnrich } from './parser';

interface RawEvent {
  eventId: string;
  source: string;
  payload: any;
}

interface Event {
  id: string;
  type: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  region: string;
  magnitude?: number;
  severityScore: number;
  categories: string[];
  description: string;
}

interface ParserQueueEnv {
  API_URL: string;
}

export class ParserQueue {
  private state: DurableObjectState;
  private env: ParserQueueEnv;

  constructor(state: DurableObjectState, env: ParserQueueEnv) {
    this.state = state;
    this.env = env;
  }

  private async dequeue(): Promise<RawEvent | undefined> {
    const queue = (await this.state.storage.get<RawEvent[]>('queue')) || [];
    const job = queue.shift();
    await this.state.storage.put('queue', queue);
    return job;
  }

  async fetch(_req: Request): Promise<Response> {
    const job = await this.dequeue();
    if (!job) {
      return new Response('No job', { status: 204 });
    }

    const enriched = await parseAndEnrich(job);
    await fetch(`${this.env.API_URL}/internal/store-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enriched),
    });

    return new Response('ok');
  }
}
