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

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      return res.status(502).json({
        ok: false,
        persisted: false,
        error: `Tracking upstream rejected event (${upstream.status})`,
        detail: detail.slice(0, 200)
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
