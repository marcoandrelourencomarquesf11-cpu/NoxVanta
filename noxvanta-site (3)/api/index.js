// NOXVANTA API (Vercel Serverless) — dados em Upstash Redis
const crypto = require("crypto");
const U = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const T = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const OWN = process.env.OWNER_USER, OPW = process.env.OWNER_PASS, ODN = process.env.OWNER_NAME || "Junior";
const ROLES = ["Duelista","Iniciador","Controlador","Sentinela","IGL / Capitão","Coach","Suplente","Sub-dono","Recrutador","Membro"];
const rd = async (...c) => {
  const r = await fetch(U, { method: "POST", headers: { Authorization: "Bearer " + T }, body: JSON.stringify(c) });
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
};
const jget = async k => { const v = await rd("GET", k); return v ? JSON.parse(v) : null; };
const jset = (k, v) => rd("SET", k, JSON.stringify(v));
const hash = p => { const s = crypto.randomBytes(16).toString("hex"); return s + ":" + crypto.scryptSync(p, s, 32).toString("hex"); };
const check = (p, h) => { const [s, x] = String(h).split(":"); const y = crypto.scryptSync(p, s, 32).toString("hex"); return x.length === y.length && crypto.timingSafeEqual(Buffer.from(x), Buffer.from(y)); };
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const newId = () => { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (const b of crypto.randomBytes(6)) s += A[b % A.length]; return "NOX-" + s; };
const pub = u => ({ id: u.id, name: u.name, dn: u.owner ? ODN : u.name, role: u.role, rank: u.rank || "", owner: !!u.owner, links: u.links || {} });
const sess = async id => { const t = crypto.randomBytes(24).toString("hex"); await rd("SET", "s:" + t, id, "EX", 2592000); return t; };
const str = (v, n) => String(v ?? "").trim().slice(0, n);
const nid = v => { v = str(v, 20).toUpperCase(); return v.startsWith("NOX-") ? v : "NOX-" + v; };

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const ok = d => res.status(200).json(d), er = (m, c = 400) => res.status(c).json({ e: m });
  if (req.method !== "POST") return er("Método inválido", 405);
  if (!U || !T) return er("Base de dados não configurada no Vercel.", 500);
  let b = req.body; if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
  const a = b.a;
  try {
    const ip = String(req.headers["x-forwarded-for"] || "x").split(",")[0];
    if (["register", "login", "apply"].includes(a)) {
      const n = await rd("INCR", "rl:" + a + ":" + ip); if (n === 1) await rd("EXPIRE", "rl:" + a + ":" + ip, 300);
      if (n > 20) return er("Demasiadas tentativas. Espera uns minutos.", 429);
    }
    if (a === "register") {
      const name = str(b.name, 20), pass = String(b.pass || ""), l = name.toLowerCase();
      if (!/^[A-Za-z0-9_.\-]{3,20}$/.test(name)) return er("Nome: 3-20 letras, números, _ . -");
      if (pass.length < 6 || pass.length > 100) return er("A palavra-passe precisa de 6+ caracteres.");
      if (OWN && l === OWN.toLowerCase()) return er("Esse nome já existe.");
      if (await rd("GET", "un:" + l)) return er("Esse nome já existe.");
      let id; do { id = newId(); } while (await rd("GET", "u:" + id));
      const u = { id, name, pw: hash(pass), role: "Membro", rank: "", created: Date.now() };
      await jset("u:" + id, u); await rd("SET", "un:" + l, id); await rd("SADD", "uids", id);
      return ok({ t: await sess(id), me: pub(u) });
    }
    if (a === "login") {
      const l = str(b.name, 20).toLowerCase(), pass = String(b.pass || "");
      const id = await rd("GET", "un:" + l); let u = id ? await jget("u:" + id) : null;
      if (!u && OWN && OPW && l === OWN.toLowerCase() && same(pass, OPW)) {
        const nidv = newId(); u = { id: nidv, name: OWN, pw: hash(pass), role: "Fundador", owner: true, rank: "", created: Date.now() };
        await jset("u:" + nidv, u); await rd("SET", "un:" + l, nidv); await rd("SADD", "uids", nidv);
      }
      if (!u || !check(pass, u.pw)) return er("Dados incorretos.", 401);
      return ok({ t: await sess(u.id), me: pub(u) });
    }
    if (a === "apply") {
      const ap = (await jget("apps")) || []; if (ap.length >= 300) return er("Candidaturas cheias.");
      const n = str(b.n, 40); if (!n) return er("Indica o teu nick.");
      const k0 = str(b.k, 80), i0 = k0 ? await rd("GET", "s:" + k0) : null, u0 = i0 ? await jget("u:" + i0) : null;
      ap.push({ id: Date.now().toString(36) + crypto.randomBytes(2).toString("hex"), uid: u0 ? u0.id : null, un: u0 ? u0.name : "", status: "pendente", n, d: str(b.d, 60), rank: str(b.rank, 30), m: str(b.m, 600), at: Date.now() });
      await jset("apps", ap); return ok({});
    }
    // --- daqui para baixo: precisa de sessão ---
    const tk = str(b.k, 80); const uid = tk ? await rd("GET", "s:" + tk) : null;
    const me = uid ? await jget("u:" + uid) : null; if (!me) return er("Sessão inválida.", 401);
    const mgr = me.owner || me.role === "Sub-dono", coach = mgr || /Coach|IGL/.test(me.role), rec = mgr || me.role === "Recrutador";
    const all = async () => { const ids = await rd("SMEMBERS", "uids"); if (!ids.length) return []; const v = await rd("MGET", ...ids.map(i => "u:" + i)); return v.filter(Boolean).map(x => JSON.parse(x)); };
    const target = async () => {
      const t = await jget("u:" + nid(b.id)); if (!t) return [null, "ID não encontrado."];
      if (t.owner && !me.owner) return [null, "Só o dono mexe no dono."];
      if (t.role === "Sub-dono" && !me.owner) return [null, "Só o dono mexe em sub-donos."];
      return [t];
    };
    switch (a) {
      case "me": return ok({ me: pub(me) });
      case "logout": await rd("DEL", "s:" + tk); return ok({});
      case "chpass": {
        if (!check(String(b.o || ""), me.pw)) return er("Palavra-passe atual errada.");
        const n = String(b.n || ""); if (n.length < 6 || n.length > 100) return er("A nova precisa de 6+ caracteres.");
        me.pw = hash(n); await jset("u:" + me.id, me); return ok({});
      }
      case "links": me.links = { google: str(b.g, 80), apple: str(b.ap, 80) }; await jset("u:" + me.id, me); return ok({ me: pub(me) });
      case "roster": return ok({ l: (await all()).filter(u => u.role !== "Membro").map(u => ({ name: u.owner ? ODN : u.name, role: u.role, rank: u.rank || "" })) });
      case "tacs": return ok({ l: (await jget("tac")) || [] });
      case "tacadd": {
        if (!coach) return er("Sem permissão.", 403); const l = (await jget("tac")) || []; const ti = str(b.ti, 80); if (!ti) return er("Põe um título.");
        l.push({ id: Date.now().toString(36), t: ti, k: str(b.kd, 20), m: str(b.m, 60), c: str(b.c, 3000), by: me.name }); await jset("tac", l); return ok({});
      }
      case "tacdel": { if (!coach) return er("Sem permissão.", 403); const l = ((await jget("tac")) || []).filter(x => x.id !== b.id); await jset("tac", l); return ok({}); }
    }
    if (["apps", "appdel", "appdecide"].includes(a)) {
      if (!rec) return er("Sem permissão.", 403);
      const l = (await jget("apps")) || [];
      if (a === "apps") return ok({ l });
      if (a === "appdel") { await jset("apps", l.filter(x => x.id !== b.id)); return ok({}); }
      const x = l.find(y => y.id === b.id); if (!x) return er("Candidatura não encontrada.");
      x.by = me.name;
      if (!b.ok) { x.status = "recusada"; await jset("apps", l); return ok({}); }
      const role = ["Duelista","Iniciador","Controlador","Sentinela","IGL / Capitão","Coach","Suplente"].includes(b.role) ? b.role : "Suplente";
      x.status = "aceite";
      const t = x.uid ? await jget("u:" + x.uid) : null; let linked = false;
      if (t && !t.owner && t.role === "Membro") { t.role = role; if (!t.rank && x.rank) t.rank = str(x.rank, 30); await jset("u:" + t.id, t); linked = true; }
      await jset("apps", l); return ok({ linked });
    }
    if (!mgr) return er("Sem permissão.", 403);
    switch (a) {
      case "users": return ok({ l: (await all()).map(u => ({ id: u.id, name: u.name, role: u.role, rank: u.rank || "", owner: !!u.owner })).sort((x, y) => x.name.localeCompare(y.name)) });
      case "setrole": {
        const [t, e] = await target(); if (!t) return er(e);
        if (t.owner) return er("O dono não muda de função.");
        if (b.role !== undefined) {
          if (!ROLES.includes(b.role)) return er("Função inválida.");
          if (b.role === "Sub-dono" && !me.owner) return er("Só o dono nomeia sub-donos.");
          t.role = b.role;
        }
        if (b.rank !== undefined) t.rank = str(b.rank, 30);
        await jset("u:" + t.id, t); return ok({ u: { id: t.id, name: t.name, role: t.role } });
      }
      case "createuser": {
        const name = str(b.name, 20), pass = String(b.pass || ""), l = name.toLowerCase(), role = b.role || "Suplente";
        if (!/^[A-Za-z0-9_.\-]{3,20}$/.test(name)) return er("Nome: 3-20 letras, números, _ . -");
        if (pass.length < 6) return er("Palavra-passe: 6+ caracteres.");
        if (!ROLES.includes(role) || (role === "Sub-dono" && !me.owner)) return er("Função inválida.");
        if ((OWN && l === OWN.toLowerCase()) || await rd("GET", "un:" + l)) return er("Esse nome já existe.");
        let id; do { id = newId(); } while (await rd("GET", "u:" + id));
        await jset("u:" + id, { id, name, pw: hash(pass), role, rank: str(b.rank, 30), created: Date.now() });
        await rd("SET", "un:" + l, id); await rd("SADD", "uids", id); return ok({ id });
      }
      case "deluser": {
        const [t, e] = await target(); if (!t) return er(e); if (t.owner) return er("Não podes remover o dono.");
        await rd("DEL", "u:" + t.id); await rd("DEL", "un:" + t.name.toLowerCase()); await rd("SREM", "uids", t.id); return ok({});
      }
      case "resetpw": {
        const [t, e] = await target(); if (!t) return er(e); const p = String(b.pass || ""); if (p.length < 6) return er("6+ caracteres.");
        t.pw = hash(p); await jset("u:" + t.id, t); return ok({});
      }
    }
    return er("Ação desconhecida.");
  } catch (e) { return er("Erro do servidor.", 500); }
};
