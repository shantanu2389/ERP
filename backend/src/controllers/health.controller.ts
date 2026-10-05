import { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service';

export async function healthController(_req: Request, res: Response) {
  try {
    res.json(await getHealthStatus());
  } catch (error: any) {
    res.status(500).json({ status: 'DOWN', error: error.message });
  }
}
