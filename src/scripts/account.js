import { authCall, sync } from '../lib/sync.js';
import { getDone, getDeck, getSynced, setUser, setSynced } from '../lib/store.js';

const $ = (id) => document.getElementById(id);
const form = $('auth-form');
const msg = (t) => { $('auth-msg').textContent = t; };

const NETWORK = '连不上同步服务。检查网络后再试，你的进度还在这个浏览器里。';
const ERRORS = {
  INVALID_EMAIL_OR_PASSWORD: '邮箱或密码不对。',
  USER_ALREADY_EXISTS: '这个邮箱已经注册过，请直接登录。',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: '这个邮箱已经注册过，请直接登录。',
  PASSWORD_TOO_SHORT: '密码至少需要 8 位。',
  INVALID_EMAIL: '邮箱格式不对。',
};

function render(email) {
  form.hidden = Boolean(email);
  $('auth-in').hidden = !email;
  if (!email) return;
  $('auth-email').textContent = email;
  const t = getSynced();
  $('auth-synced').textContent = `${t ? `上次同步：${new Date(t).toLocaleString('zh-CN')}。` : ''}这台设备上有 ${getDone().length} 课已完成，${Object.keys(getDeck()).length} 张复习卡片。`;
}

async function syncNow() {
  try {
    render(await sync());
    msg('');
  } catch {
    msg(NETWORK);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { email, password } = Object.fromEntries(new FormData(form));
  const signUp = e.submitter?.value === 'sign-up';
  msg(signUp ? '正在注册……' : '正在登录……');
  try {
    const res = await authCall(signUp ? 'sign-up/email' : 'sign-in/email', { email, password, ...(signUp && { name: email.split('@')[0] }) });
    if (!res.ok) return msg(ERRORS[res.data.code] ?? `操作没有成功（${res.status}）。请稍后再试。`);
    form.reset();
    await syncNow();
  } catch {
    msg(NETWORK);
  }
});

$('auth-sync').addEventListener('click', syncNow);

$('auth-out').addEventListener('click', async () => {
  try {
    const res = await authCall('sign-out');
    if (!res.ok) return msg(`退出没有成功（${res.status}）。`);
    setUser(null);
    setSynced(0);
    render(null);
    msg('');
  } catch {
    msg(NETWORK);
  }
});

syncNow();
