module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, persisted: false, error: 'Method not allowed' });
  }

  const gasUrl = process.env.GAS_WEBHOOK_URL;
  if (!gasUrl) {
    return res.status(503).json({
      ok: false,
      persisted: false,
      error: 'GAS_WEBHOOK_URL is not configured'
    });
  }

  const event = {
    ...req.body,
    timestamp: new Date().toISOString()
  };

  try {
    const upstream = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    const raw = await upstream.text().catch(() => '');
    let upstreamResult = null;
    try {
      upstreamResult = raw ? JSON.parse(raw) : null;
    } catch (_) {
      upstreamResult = null;
    }

    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        persisted: false,
        error: `Tracking upstream rejected event (${upstream.status})`,
        detail: raw.slice(0, 200)
      });
    }

    if (!upstreamResult || upstreamResult.persisted !== true) {
      return res.status(502).json({
        ok: false,
        persisted: false,
        error: 'Tracking upstream did not confirm persistence',
        detail: raw.slice(0, 200)
      });
    }

    return res.status(200).json({ ok: true, persisted: true });
  } catch (err) {
    return res.status(502).json({
      ok: false,
      persisted: false,
      error: err?.message || 'Tracking upstream request failed'
    });
  }
};
