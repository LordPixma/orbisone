import { parse } from 'emailjs-mime-parser';

export interface Env {
  MAILGUN_SIGNING_KEY: string;
  SENDGRID_PUBLIC_KEY: string;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const len = bin.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = bin.charCodeAt(i);
  }
  return buf;
}

async function verifyMailgun(form: FormData, key: string): Promise<boolean> {
  const timestamp = form.get('timestamp')?.toString() || '';
  const token = form.get('token')?.toString() || '';
  const signature = form.get('signature')?.toString() || '';
  if (!timestamp || !token || !signature) {
    return false;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(timestamp + token);
  const keyBuf = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex === signature;
}

async function verifySendGrid(
  req: Request,
  body: Uint8Array,
  publicKey: string
): Promise<boolean> {
  const signature = req.headers.get('X-Twilio-Email-Event-Webhook-Signature');
  const timestamp = req.headers.get('X-Twilio-Email-Event-Webhook-Timestamp');
  const nonce = req.headers.get('X-Twilio-Email-Event-Webhook-Nonce');
  if (!signature || !timestamp || !nonce) {
    return false;
  }
  const keyBuf = base64ToUint8Array(publicKey);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'Ed25519' },
    false,
    ['verify']
  );
  const prefix = new TextEncoder().encode(timestamp + nonce);
  const message = new Uint8Array(prefix.length + body.length);
  message.set(prefix, 0);
  message.set(body, prefix.length);
  const sigBuf = base64ToUint8Array(signature);
  return crypto.subtle.verify('Ed25519', cryptoKey, sigBuf, message);
}

interface ParsedResult {
  textParts: string[];
  attachments: Array<{ filename: string; contentType: string; data: Uint8Array }>;
}

function extractMimeParts(raw: Uint8Array): ParsedResult {
  const root = parse(raw);
  const decoder = new TextDecoder();
  const result: ParsedResult = { textParts: [], attachments: [] };

  const walk = (node: any) => {
    if (!node.childNodes || node.childNodes.length === 0) {
      const contentType = node.contentType?.value || '';
      const disposition = node.disposition?.type || '';
      if (contentType.startsWith('text/') && disposition !== 'attachment') {
        result.textParts.push(decoder.decode(node.content));
      }
      if (disposition === 'attachment') {
        result.attachments.push({
          filename: node.disposition?.params?.filename || 'attachment',
          contentType,
          data: node.content,
        });
      }
    } else {
      node.childNodes.forEach((child: any) => walk(child));
    }
  };
  walk(root);
  return result;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const rawBody = new Uint8Array(await req.clone().arrayBuffer());
    const form = await req.formData();

    let isValid = false;
    if (req.headers.get('X-Twilio-Email-Event-Webhook-Signature')) {
      isValid = await verifySendGrid(req, rawBody, env.SENDGRID_PUBLIC_KEY);
    } else if (form.get('signature')) {
      isValid = await verifyMailgun(form, env.MAILGUN_SIGNING_KEY);
    }
    if (!isValid) {
      return new Response('Invalid signature', { status: 403 });
    }

    const emailPart = form.get('email');
    let mimeBuffer: Uint8Array | null = null;
    if (emailPart instanceof File) {
      mimeBuffer = new Uint8Array(await emailPart.arrayBuffer());
    } else if (typeof emailPart === 'string') {
      mimeBuffer = new TextEncoder().encode(emailPart);
    }
    if (!mimeBuffer) {
      return new Response('Bad Request', { status: 400 });
    }

    const parsed = extractMimeParts(mimeBuffer);
    // Additional processing could enqueue tasks or store attachments
    console.log('text parts', parsed.textParts.length);
    console.log('attachments', parsed.attachments.length);

    return new Response('OK');
  },
};

