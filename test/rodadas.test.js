import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apurarRodada, apurarMao } from '../src/truco.js';
import { carta as c } from '../support/fixtures.js';

const jogadas = cartas => cartas.map((carta, jogador) => ({ jogador, carta }));

describe('CT04 — Rodadas entre duas duplas', () => {
  it('a maior carta pode ser do parceiro na posição 2', () => {
    const resultado = apurarRodada(jogadas([c('4'), c('K'), c('3'), c('6')]), c('7'));
    assert.deepEqual(resultado, { duplaVencedora: 0, proximoJogador: 2 });
  });

  it('a maior carta pode ser do parceiro na posição 3', () => {
    const resultado = apurarRodada(jogadas([c('4'), c('K'), c('6'), c('3')]), c('7'));
    assert.deepEqual(resultado, { duplaVencedora: 1, proximoJogador: 3 });
  });

  it('cartas máximas iguais entre adversários empatam a rodada', () => {
    assert.deepEqual(apurarRodada(jogadas([
      c('3', 'paus'), c('3', 'copas'), c('K'), c('6'),
    ]), c('7')), { duplaVencedora: null, proximoJogador: 0 });
  });

  it('cartas máximas iguais da mesma dupla vencem a rodada', () => {
    assert.deepEqual(apurarRodada(jogadas([
      c('3', 'paus'), c('K'), c('3', 'copas'), c('6'),
    ]), c('7')), { duplaVencedora: 0, proximoJogador: 0 });
  });

  it('um empate entre cartas inferiores não impede a vitória de uma carta superior', () => {
    assert.equal(apurarRodada(jogadas([
      c('6', 'paus'), c('6', 'copas'), c('3'), c('K'),
    ]), c('7')).duplaVencedora, 0);
  });

  it('as manilhas desempatam pelo naipe e superam o três', () => {
    assert.deepEqual(apurarRodada(jogadas([
      c('3'), c('Q', 'copas'), c('Q', 'ouros'), c('Q', 'paus'),
    ]), c('7')), { duplaVencedora: 1, proximoJogador: 3 });
  });

  it('no empate, a próxima rodada começa pelo primeiro a jogar uma carta máxima', () => {
    const mesa = [
      { jogador: 2, carta: c('4') }, { jogador: 3, carta: c('3', 'paus') },
      { jogador: 0, carta: c('3', 'copas') }, { jogador: 1, carta: c('K') },
    ];
    assert.deepEqual(apurarRodada(mesa, c('7')), { duplaVencedora: null, proximoJogador: 3 });
  });

  it('rejeita rodada incompleta', () => {
    assert.throws(() => apurarRodada([], c('7')), /4 jogadas/);
  });

  it('rejeita duas jogadas do mesmo jogador', () => {
    const mesa = jogadas([c('4'), c('5'), c('6'), c('K')]);
    mesa[3].jogador = 0;
    assert.throws(() => apurarRodada(mesa, c('7')), /uma vez/);
  });

  it('rejeita repetição de carta física', () => {
    assert.throws(() => apurarRodada(jogadas([c('4'), c('4'), c('6'), c('K')]), c('7')), /repetida/);
  });

  it('rejeita a vira usada como carta de jogador', () => {
    assert.throws(() => apurarRodada(jogadas([c('4'), c('5'), c('6'), c('7')]), c('7')), /vira/);
  });
});

describe('CT05 — Vitória e todos os padrões de empate da mão', () => {
  const casos = [
    [[0, 0], 0], [[1, 1], 1],
    [[0, null], 0], [[1, null], 1],
    [[null, 0], 0], [[null, 1], 1],
    [[0, 1, 0], 0], [[0, 1, 1], 1],
    [[1, 0, 0], 0], [[1, 0, 1], 1],
    [[0, 1, null], 0], [[1, 0, null], 1],
    [[null, null, 0], 0], [[null, null, 1], 1],
    [[null, null, null], null],
  ];
  for (const [resultados, vencedora] of casos) {
    it(`${JSON.stringify(resultados)} encerra a mão com vencedora ${vencedora}`, () => {
      assert.deepEqual(apurarMao(resultados), { encerrada: true, vencedora });
    });
  }

  for (const resultados of [[], [0], [1], [null], [0, 1], [1, 0], [null, null]]) {
    it(`${JSON.stringify(resultados)} mantém a mão em andamento`, () => {
      assert.deepEqual(apurarMao(resultados), { encerrada: false, vencedora: null });
    });
  }

  it('rejeita resultado de dupla inexistente', () => {
    assert.throws(() => apurarMao([2]), /inválido/);
  });

  it('rejeita mais de três rodadas', () => {
    assert.throws(() => apurarMao([0, 1, null, 0]), /no máximo 3/);
  });

  it('rejeita uma terceira rodada depois de uma mão já decidida', () => {
    assert.throws(() => apurarMao([0, 0, 1]), /já terminou/);
    assert.throws(() => apurarMao([null, 1, 0]), /já terminou/);
  });
});
