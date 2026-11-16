import { http } from './http.js';

// 登入與註冊不帶 Token（skipAuth），失敗的 401 也不會觸發自動登出
export async function login({ email, password }) {
  const { data } = await http.post('/auth/login', { email, password }, { skipAuth: true });
  return data.data;
}

export async function register({ name, email, password }) {
  const { data } = await http.post('/auth/register', { name, email, password }, { skipAuth: true });
  return data.data;
}

export async function fetchMe() {
  const { data } = await http.get('/auth/me');
  return data.data.user;
}
