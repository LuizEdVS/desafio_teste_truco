import assert from 'node:assert/strict';
import { criarBaralho, Partida } from '../src/truco.js';

export const carta = (valor, naipe = 'ouros') => ({ valor, naipe });
export const VIRA = carta('7', 'paus');

// A dupla A vence as duas primeiras rodadas usando sempre o índice 0.
export const MAOS = [
  [carta('3', 'paus'), carta('2', 'paus'), carta('A', 'paus')],
  [carta('K', 'copas'), carta('J', 'copas'), carta('6', 'copas')],
  [carta('7', 'espadas'), carta('5', 'espadas'), carta('4', 'espadas')],
  [carta('7', 'ouros'), carta('6', 'ouros'), carta('4', 'ouros')],
];

export function baralhoCom(maos = MAOS, vira = VIRA, iniciador = 0) {
  const topo = [];
  for (let rodada = 0; rodada < 3; rodada += 1) {
    for (let i = 0; i < 4; i += 1) topo.push(maos[(iniciador + i) % 4][rodada]);
  }
  topo.push(vira);
  const id = c => `${c.valor}-${c.naipe}`;
  assert.equal(new Set(topo.map(id)).size, 13, 'A fixture precisa de 13 cartas distintas.');
  const usadas = new Set(topo.map(id));
  return [...topo, ...criarBaralho().filter(c => !usadas.has(id(c)))];
}

export function novaPartida(opcoes = {}, maos = MAOS, vira = VIRA) {
  const partida = new Partida(opcoes);
  partida.iniciarMao(baralhoCom(maos, vira, opcoes.primeiroJogador ?? 0));
  return partida;
}

export function jogarRodada(partida) {
  for (let i = 0; i < 4; i += 1) partida.jogarCarta(partida.estado.mao.vez, 0);
}

export function concluirMao(partida) {
  for (let i = 0; i < 12 && partida.estado.mao.fase === 'jogando'; i += 1) {
    partida.jogarCarta(partida.estado.mao.vez, 0);
  }
  assert.equal(partida.estado.mao.fase, 'encerrada');
}

export function rejeitaSemAlterar(partida, acao, mensagem) {
  const antes = partida.estado;
  assert.throws(acao, mensagem);
  assert.deepEqual(partida.estado, antes, 'Uma ação rejeitada não pode alterar a partida.');
}
