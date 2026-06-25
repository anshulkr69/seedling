import type { Response } from 'express';
import axios from 'axios';
import { env } from '../config/env.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { supabaseAdmin } from '../config/supabase.js';

const engineClient = axios.create({
  baseURL: env.PYTHON_ENGINE_URL,
  timeout: 120_000, // 2 min — matching/drafting can be slow
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Key': env.GITHUB_ACTIONS_WEBHOOK_SECRET,
  },
});

/**
 * POST /engine/match
 * Proxies a matching request to the Python engine for the authenticated org.
 * Triggers: POST /match/{org_id} on the Python engine.
 */
export async function triggerMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const orgId = req.user.orgId;

    const response = await engineClient.post(`/match/${orgId}`);

    res.json({
      status: 'success',
      message: 'Matching triggered successfully',
      data: response.data,
    });
  } catch (err: any) {
    if (err.response) {
      // Python engine returned an error response
      console.error('Engine match error:', err.response.status, err.response.data);
      res.status(err.response.status).json({
        error: 'Matching engine error',
        details: err.response.data,
      });
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.error('Engine unreachable:', err.message);
      res.status(503).json({
        error: 'Matching engine is currently unavailable. Please try again later.',
      });
    } else {
      console.error('triggerMatch error:', err.message);
      res.status(500).json({ error: 'Failed to trigger matching' });
    }
  }
}

/**
 * POST /engine/draft
 * Proxies a draft generation request to the Python engine.
 * Sends org_id + grant_id + application_id to: POST /draft on the Python engine.
 *
 * This route has per-org rate limiting applied at the route level (10/hour).
 */
export async function generateDraft(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { grant_id, application_id } = req.body;

    if (!grant_id) {
      res.status(400).json({ error: 'grant_id is required' });
      return;
    }

    let appId = application_id;
    if (!appId) {
      // Lookup the application record fallback
      const { data: existingApp } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('org_id', req.user.orgId!)
        .eq('grant_id', grant_id)
        .maybeSingle();
      appId = existingApp?.id;
    }

    if (!appId) {
      res.status(404).json({ error: 'No active application found for this grant.' });
      return;
    }

    const response = await engineClient.post('/draft', {
      org_id: req.user.orgId,
      grant_id,
      application_id: appId,
    });

    res.json({
      status: 'success',
      data: response.data,
    });
  } catch (err: any) {
    if (err.response) {
      console.error('Engine draft error:', err.response.status, err.response.data);
      res.status(err.response.status).json({
        error: 'Draft generation engine error',
        details: err.response.data,
      });
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.error('Engine unreachable:', err.message);
      res.status(503).json({
        error: 'Draft generation engine is currently unavailable. Please try again later.',
      });
    } else {
      console.error('generateDraft error:', err.message);
      res.status(500).json({ error: 'Failed to generate draft' });
    }
  }
}
