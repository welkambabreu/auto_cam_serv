import { expect } from 'chai';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import dados from './data/api-data.json' with { type: 'json' };
import { loginComoAdmin, loginComoAluno } from './helpers/auth.helpers.js';

describe('Fluxo de administrador e aluno', () => {
  let tokenAdmin;
  let aluno;
  let credenciaisAluno;

  before(async () => {
    tokenAdmin = await loginComoAdmin(app, dados.admin);
    const identificador = `${Date.now()}-${process.pid}`;
    credenciaisAluno = {
      email: `${dados.aluno.emailPrefixo}-${identificador}${dados.aluno.dominio}`,
      senha: dados.aluno.senha,
    };

    const resposta = await request(app)
      .post('/api/admin/alunos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nome: dados.aluno.nome,
        email: credenciaisAluno.email,
        matricula: `${dados.aluno.matriculaPrefixo}${identificador}`,
        senha: credenciaisAluno.senha,
      });

    expect(resposta.status).to.equal(201);
    aluno = resposta.body;

    const disciplinasIds = [...new Set(dados.trabalhos.map((trabalho) => trabalho.disciplinaId))];
    for (const disciplinaId of disciplinasIds) {
      const respostaMatricula = await request(app)
        .post(`/api/admin/disciplinas/${disciplinaId}/matriculas`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ alunoId: aluno.id });

      expect(respostaMatricula.status).to.equal(201);
    }
  });

  after(async () => {
    if (aluno?.id) {
      await request(app)
        .delete(`/api/admin/alunos/${aluno.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
    }
    await mongoose.connection.close();
  });

  for (const caso of dados.trabalhos) {
    it(`deve permitir ao aluno registrar: ${caso.titulo}`, async () => {
      const tokenAluno = await loginComoAluno(app, credenciaisAluno);

      const resposta = await request(app)
        .post(`/api/alunos/${aluno.id}/trabalhos`)
        .set('Authorization', `Bearer ${tokenAluno}`)
        .send(caso);

      expect(resposta.status).to.equal(201);
      expect(resposta.body).to.include({
        alunoId: aluno.id,
        disciplinaId: caso.disciplinaId,
        titulo: caso.titulo,
        descricao: caso.descricao,
        status: 'entregue',
      });
    });
  }
});