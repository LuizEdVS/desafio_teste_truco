import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarBaralho, distribuirCartas, obterManilha, compararCartas } from '../src/truco.js';
import { carta as c, baralhoCom, MAOS, VIRA } from '../support/fixtures.js';

describe('CT01 — Baralho e distribuição', () => {
  it('cria exatamente 40 cartas diferentes, com dez valores e quatro naipes', () => {
    const baralho = criarBaralho();
    assert.equal(baralho.length, 40);
    assert.equal(new Set(baralho.map(c => `${c.valor}-${c.naipe}`)).size, 40);
    assert.deepEqual([...new Set(baralho.map(c => c.valor))].sort(), ['2', '3', '4', '5', '6', '7', 'A', 'J', 'K', 'Q']);
    assert.deepEqual([...new Set(baralho.map(c => c.naipe))].sort(), ['copas', 'espadas', 'ouros', 'paus']);
  });

  it('não compartilha objetos entre baralhos novos', () => {
    const primeiro = criarBaralho();
    primeiro[0].valor = 'INVÁLIDO';
    assert.deepEqual(criarBaralho()[0], c('4'));
  });

  it('entrega três cartas por jogador, uma vira e 27 cartas no monte', () => {
    const baralho = baralhoCom();
    const antes = structuredClone(baralho);
    const distribuicao = distribuirCartas(baralho);
    assert.deepEqual(distribuicao.cartas, MAOS);
    assert.deepEqual(distribuicao.vira, VIRA);
    assert.equal(distribuicao.monte.length, 27);
    const cartas = [...distribuicao.cartas.flat(), distribuicao.vira, ...distribuicao.monte];
    assert.equal(new Set(cartas.map(c => `${c.valor}-${c.naipe}`)).size, 40);
    assert.deepEqual(baralho, antes);
    distribuicao.cartas[0][0].valor = 'INVÁLIDO';
    assert.deepEqual(baralho, antes);
  });

  it('distribui alternadamente a partir do jogador informado', () => {
    assert.deepEqual(distribuirCartas(baralhoCom(MAOS, VIRA, 3), 3).cartas, MAOS);
  });

  it('rejeita baralho incompleto', () => {
    assert.throws(() => distribuirCartas(criarBaralho().slice(1)), /40 cartas/);
  });

  it('rejeita baralho com cartas repetidas', () => {
    const baralho = criarBaralho();
    baralho[1] = baralho[0];
    assert.throws(() => distribuirCartas(baralho), /repetidas/);
  });

  it('rejeita carta inválida mesmo no monte que não será distribuído', () => {
    const baralho = criarBaralho();
    baralho[39] = c('8');
    assert.throws(() => distribuirCartas(baralho), /Carta inválida/);
  });
});

describe('CT02 — Manilhas móveis', () => {
  const casos = [
    ['4', '5'], ['5', '6'], ['6', '7'], ['7', 'Q'], ['Q', 'J'],
    ['J', 'K'], ['K', 'A'], ['A', '2'], ['2', '3'], ['3', '4'],
  ];
  for (const [vira, manilha] of casos) {
    it(`vira ${vira} define manilha ${manilha}`, () => {
      assert.equal(obterManilha(c(vira)), manilha);
    });
  }
});

describe('CT03 — Comparação de cartas', () => {
  const casos = [
    ['3', '2', '4'], ['2', 'A', '4'], ['A', 'K', '4'],
    ['K', 'J', '4'], ['J', 'Q', '4'], ['Q', '7', '4'],
    ['7', '6', '4'], ['6', '5', '7'], ['5', '4', '7'],
  ];
  for (const [maior, menor, vira] of casos) {
    it(`${maior} vence ${menor} quando nenhuma é manilha`, () => {
      assert.equal(compararCartas(c(maior), c(menor), c(vira)), 1);
      assert.equal(compararCartas(c(menor), c(maior), c(vira)), -1);
    });
  }

  it('empata cartas comuns do mesmo valor, independentemente do naipe', () => {
    assert.equal(compararCartas(c('3', 'paus'), c('3', 'ouros'), c('7')), 0);
  });

  for (const [maior, menor] of [['paus', 'copas'], ['copas', 'espadas'], ['espadas', 'ouros']]) {
    it(`manilha de ${maior} vence manilha de ${menor}`, () => {
      assert.equal(compararCartas(c('Q', maior), c('Q', menor), c('7')), 1);
      assert.equal(compararCartas(c('Q', menor), c('Q', maior), c('7')), -1);
    });
  }

  it('qualquer manilha supera qualquer carta comum nas dez possibilidades de vira', () => {
    const tabela = [['4', '5'], ['5', '6'], ['6', '7'], ['7', 'Q'], ['Q', 'J'],
      ['J', 'K'], ['K', 'A'], ['A', '2'], ['2', '3'], ['3', '4']];
    for (const [vira, manilha] of tabela) {
      for (const naipe of ['ouros', 'espadas', 'copas', 'paus']) {
        for (const comum of criarBaralho().filter(c => c.valor !== manilha)) {
          assert.equal(compararCartas(c(manilha, naipe), comum, c(vira)), 1);
        }
      }
    }
  });

  for (const invalida of [c('8'), c('9'), c('10'), c('JOKER'), c('A', 'inexistente'), null]) {
    it(`rejeita carta inválida: ${JSON.stringify(invalida)}`, () => {
      assert.throws(() => compararCartas(invalida, c('3'), c('7')), /Carta inválida/);
      assert.throws(() => compararCartas(c('3'), invalida, c('7')), /Carta inválida/);
      assert.throws(() => obterManilha(invalida), /Carta inválida/);
    });
  }
});
