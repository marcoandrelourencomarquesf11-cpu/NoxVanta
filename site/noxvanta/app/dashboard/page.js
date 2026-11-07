'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const FUNCOES = ['IGL', 'Duelista', 'Iniciador', 'Controlador', 'Sentinela', 'Coach'];

export default function Dashboard() {
  const r = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('perfil');

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return r.replace('/');
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setMe(data);
  }
  useEffect(() => { load(); }, []);

  if (!me) return <p className="wrap mute">Carregando…</p>;
  const staff = ['recruiter', 'admin'].includes(me.role);
  const player = me.is_player || staff;
  const tabs = [['perfil', 'Perfil']];
  if (player) tabs.push(['estrategias', 'Estratégias']);
  tabs.push(['call', 'Call'], ['recrutamento', 'Recrutamento']);
  if (staff) tabs.push(['candidaturas', 'Candidaturas']);

  return (
    <main className="wrap">
      <div className="row">
        <h1>NoxVanta</h1>
        <button className="btn ghost" onClick={async () => { await supabase.auth.signOut(); r.replace('/'); }}>Sair</button>
      </div>
      <nav>{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav>
      {tab === 'perfil' && <Perfil me={me} reload={load} />}
      {tab === 'estrategias' && player && <Estrategias staff={staff} me={me} />}
      {tab === 'call' && <Call />}
      {tab === 'recrutamento' && <Candidatar me={me} />}
      {tab === 'candidaturas' && staff && <Candidaturas />}
    </main>
  );
}

function Perfil({ me, reload }) {
  const [f, setF] = useState({ nickname: me.nickname || '', rank: me.rank || '', password: '' });
  const [msg, setMsg] = useState('');
  async function save(e) {
    e.preventDefault();
    const { error } = await supabase.from('profiles').update({ nickname: f.nickname, rank: f.rank }).eq('id', me.id);
    let err = error;
    if (!err && f.password) err = (await supabase.auth.updateUser({ password: f.password })).error;
    setMsg(err ? err.message : 'Alterações salvas.');
    if (!err) { setF({ ...f, password: '' }); reload(); }
  }
  return (
    <form onSubmit={save} className="box">
      <label>Account_ID</label>
      <div className="id">{me.account_id}</div>
      <p className="mute">Envie este ID ao recrutador para ser contratado. Função atual: {me.role}.</p>
      <label>Nick</label><input value={f.nickname} onChange={(e) => setF({ ...f, nickname: e.target.value })} />
      <label>Rank</label><input value={f.rank} onChange={(e) => setF({ ...f, rank: e.target.value })} placeholder="Ex: Ascendente 2" />
      <label>Nova senha (opcional)</label><input type="password" minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <button className="btn">Salvar alterações</button>
      {msg && <p className="mute">{msg}</p>}
    </form>
  );
}

function Estrategias({ staff, me }) {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ title: '', content: '' });
  const load = async () => {
    const { data } = await supabase.from('strategies').select('*').order('created_at', { ascending: false });
    setList(data || []);
  };
  useEffect(() => { load(); }, []);
  async function add(e) {
    e.preventDefault();
    await supabase.from('strategies').insert({ ...f, created_by: me.id });
    setF({ title: '', content: '' });
    load();
  }
  return (
    <>
      {staff && (
        <form onSubmit={add} className="box">
          <h2>Nova estratégia</h2>
          <input placeholder="Título (ex: Ascent, ataque B)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
          <label>Detalhes</label>
          <textarea rows={4} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} required />
          <button className="btn">Publicar estratégia</button>
        </form>
      )}
      {list.length === 0 && <p className="mute">Nenhuma estratégia publicada ainda.</p>}
      {list.map((s) => (
        <div key={s.id} className="box"><h2>{s.title}</h2><div style={{ whiteSpace: 'pre-wrap' }}>{s.content}</div></div>
      ))}
    </>
  );
}

function Call() {
  const url = process.env.NEXT_PUBLIC_DISCORD_URL;
  return (
    <div className="box">
      <h2>Call do time</h2>
      <p className="mute">A call acontece no nosso servidor do Discord.</p>
      {url ? <a className="btn" href={url} target="_blank" rel="noreferrer">Entrar na call</a> : <p className="mute">Defina NEXT_PUBLIC_DISCORD_URL para ativar o botão.</p>}
    </div>
  );
}

function Candidatar({ me }) {
  const [f, setF] = useState({ desired_role: FUNCOES[0], message: '' });
  const [mine, setMine] = useState([]);
  const load = async () => {
    const { data } = await supabase.from('applications').select('*').eq('applicant_id', me.id).order('created_at', { ascending: false });
    setMine(data || []);
  };
  useEffect(() => { load(); }, []);
  async function send(e) {
    e.preventDefault();
    await supabase.from('applications').insert({ ...f, applicant_id: me.id });
    setF({ ...f, message: '' });
    load();
  }
  const label = { pending: 'Em análise', approved: 'Aprovada', rejected: 'Recusada' };
  return (
    <>
      <form onSubmit={send} className="box">
        <h2>Candidatar-se</h2>
        <label>Função desejada</label>
        <select value={f.desired_role} onChange={(e) => setF({ ...f, desired_role: e.target.value })}>{FUNCOES.map((x) => <option key={x}>{x}</option>)}</select>
        <label>Mensagem</label>
        <textarea rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Agentes que joga, experiência, horários" />
        <button className="btn">Enviar candidatura</button>
      </form>
      {mine.map((a) => <div key={a.id} className="box row"><span>{a.desired_role}</span><span className="mute">{label[a.status]}</span></div>)}
    </>
  );
}

function Candidaturas() {
  const [list, setList] = useState([]);
  const load = async () => {
    const { data } = await supabase.from('applications').select('*, profiles!applicant_id(nickname, rank, account_id)').eq('status', 'pending').order('created_at');
    setList(data || []);
  };
  useEffect(() => { load(); }, []);
  const approve = async (id) => { await supabase.rpc('approve_application', { app_id: id }); load(); };
  const reject = async (id) => { await supabase.from('applications').update({ status: 'rejected' }).eq('id', id); load(); };
  if (!list.length) return <p className="mute">Nenhuma candidatura pendente.</p>;
  return list.map((a) => (
    <div key={a.id} className="box">
      <div className="row"><strong>{a.profiles?.nickname}</strong><span className="id" style={{ fontSize: '1rem' }}>{a.profiles?.account_id}</span></div>
      <p className="mute">Rank: {a.profiles?.rank || '—'} · Função: {a.desired_role}</p>
      {a.message && <p>{a.message}</p>}
      <button className="btn" onClick={() => approve(a.id)}>Aprovar</button>{' '}
      <button className="btn ghost" onClick={() => reject(a.id)}>Recusar</button>
    </div>
  ));
}
