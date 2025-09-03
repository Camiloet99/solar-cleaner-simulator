const http = require('http');
const runtimeState = require('../core/runtimeState');

function reply(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function startControlServer({ port, apiKey }, handle) {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/health') {
        return reply(res, 200, { ok: true });
      }

      if (req.method === 'GET' && req.url === '/runtime') {
        return reply(res, 200, runtimeState.getRuntimeSnapshot());
      }

      if (req.method === 'POST' && req.url === '/commands') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const cmd = JSON.parse(body);
            if (!cmd.cause) return reply(res, 422, { error: 'cause is required' });
            const out = await handle(cmd);
            if (out && out.error) return reply(res, out.code || 400, out);
            return reply(res, 200, out);
          } catch (e) {
            return reply(res, 400, { error: 'invalid JSON', details: String(e.message || e) });
          }
        });
        return;
      }

      reply(res, 404, { error: 'not found' });
    } catch (e) {
      reply(res, 500, { error: 'server error', details: String(e.message || e) });
    }
  });

  server.listen(port, () => {
    console.log(`[control] listening on http://localhost:${port}`);
    console.log(`[control] GET /health | GET /runtime | POST /commands`);
  });

  return server;
}

module.exports = { startControlServer };
