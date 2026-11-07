'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Login() {
  const r = useRouter();
  const [signup, setSignup] = useState(false);
  const [f, setF] = useState({ email: '', password: '', nickname: '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    const { error } = signup
      ? await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { nickname: f.nickname } } })
      : await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
    if (error) return setMsg(error.message);
    if (signup) setMsg('Conta criada. Se o Supabase pedir, confirme o e-mail e depois entre.');
    else r.push('/dashboard');
  }

  return (
    <main className="wrap" style={{ maxWidth: 400, paddingTop: 80 }}>
      <h1>NoxVanta</h1>
      <p className="mute">{signup ? 'Crie sua conta para se candidatar.' : 'Entre na sua conta.'}</p>
      <form onSubmit={submit} className="box">
        {signup && (<><label>Nick</label><input value={f.nickname} onChange={set('nickname')} required /></>)}
        <label>E-mail</label><input type="email" value={f.email} onChange={set('email')} required />
        <label>Senha</label><input type="password" minLength={6} value={f.password} onChange={set('password')} required />
        <button className="btn">{signup ? 'Criar conta' : 'Entrar'}</button>
        {msg && <p className="mute">{msg}</p>}
      </form>
      <button className="btn ghost" onClick={() => setSignup(!signup)}>
        {signup ? 'Já tenho conta' : 'Criar conta'}
      </button>
    </main>
  );
}
