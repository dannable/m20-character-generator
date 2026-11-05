// In-memory Server-Sent Events hub for session mode. One Set of connections per
// chronicle. Hidden events go only to Storyteller connections. State is per
// process, which is fine for a single-container deployment; a missed event is
// recovered by the client refetching on reconnect.
const clients = new Map(); // chronicleId -> Set<{ res, st }>

function subscribe(chronicleId, res, st) {
  const c = { res, st };
  if (!clients.has(chronicleId)) clients.set(chronicleId, new Set());
  clients.get(chronicleId).add(c);
  return () => { const set = clients.get(chronicleId); if (set) { set.delete(c); if (!set.size) clients.delete(chronicleId); } };
}
function publish(chronicleId, event, data, opts = {}) {
  const set = clients.get(chronicleId); if (!set) return 0;
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  let n = 0;
  for (const c of set) {
    if (opts.stOnly && !c.st) continue;
    try { c.res.write(msg); n++; } catch {}
  }
  return n;
}
const count = chronicleId => (clients.get(chronicleId) || new Set()).size;
module.exports = { subscribe, publish, count };
