// Minimal .env loader for local runs (Vercel uses its own environment variables)
try { require('fs').readFileSync('.env', 'utf8').split('\n').forEach(l => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^[\"']|[\"']$/g, ''); }); } catch (e) {}
