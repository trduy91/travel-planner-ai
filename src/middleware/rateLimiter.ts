import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';

const QUESTION_LIMIT = parseInt(process.env.NEXT_PUBLIC_QUESTION_LIMIT || '10', 10);
const COOLDOWN_HOURS = parseInt(process.env.NEXT_PUBLIC_COOLDOWN_HOURS || '1', 10);

const ipUsage: Record<string, { count: number; resetTime: number }> = {};

export function rateLimiter(req: NextApiRequest, res: NextApiResponse, next: Function) {
    const ip = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
    if (!ip) {
      return res.status(400).json({ error: 'Unable to determine IP address' });
    }
  
    const now = Date.now();
    const usage = ipUsage[ip] || { count: 0, resetTime: now + COOLDOWN_HOURS * 60 * 60 * 1000 };
  
    if (now > usage.resetTime) {
      // Reset usage after cooldown
      ipUsage[ip] = { count: 1, resetTime: now + COOLDOWN_HOURS * 60 * 60 * 1000 };
    } else if (usage.count >= QUESTION_LIMIT) {
      // Block if limit exceeded
      const waitTime = Math.ceil((usage.resetTime - now) / (60 * 60 * 1000));
      return res.status(429).json({ error: `Rate limit exceeded. Try again in ${waitTime} hour(s).` });
    } else {
      // Increment usage
      usage.count += 1;
    }
  
    next();
  }