import request from 'supertest';

export async function loginComoAdmin(app, credenciais) {
  const resposta = await request(app).post('/api/auth/login').send(credenciais);

  return resposta.body.token;
}

export async function loginComoAluno(app, credenciais) {
  const resposta = await request(app).post('/api/auth/login').send(credenciais);

  return resposta.body.token;
}