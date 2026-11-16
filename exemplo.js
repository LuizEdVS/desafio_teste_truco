import { criarBaralho, Partida } from './src/truco.js';

const carta = (valor, naipe) => ({ valor, naipe });
const maos = [
  [carta('3', 'paus'), carta('2', 'paus'), carta('A', 'paus')],
  [carta('K', 'copas'), carta('J', 'copas'), carta('6', 'copas')],
  [carta('7', 'espadas'), carta('5', 'espadas'), carta('4', 'espadas')],
  [carta('7', 'ouros'), carta('6', 'ouros'), carta('4', 'ouros')],
];

// Monta uma distribuição conhecida para tornar a demonstração repetível.
const topo = [0, 1, 2].flatMap(i => maos.map(mao => mao[i]));
topo.push(carta('7', 'paus'));
const id = carta => `${carta.valor}-${carta.naipe}`;
const usadas = new Set(topo.map(id));
const baralho = [...topo, ...criarBaralho().filter(carta => !usadas.has(id(carta)))];

const partida = new Partida({ jogadores: ['Ana', 'Bia', 'Caio', 'Davi'] });
partida.iniciarMao(baralho);
console.log('Dupla A: Ana e Caio. Dupla B: Bia e Davi.');
console.log('Vira: 7 de paus. Manilhas: damas (Q).');
partida.pedirAumento(0, 3);
partida.responderAumento(1, 'aceitar');
console.log('Ana pediu truco; Bia aceitou. A mão vale 3 pontos.');

while (partida.estado.mao.fase === 'jogando') {
  const jogador = partida.estado.mao.vez;
  const nome = partida.estado.jogadores[jogador];
  const escolhida = partida.visaoDoJogador(jogador).cartas[0];
  partida.jogarCarta(jogador, 0);
  console.log(`${nome} jogou ${escolhida.valor} de ${escolhida.naipe}.`);
}

const estado = partida.estado;
console.log(`Mão encerrada após ${estado.mao.rodadas.length} rodadas.`);
console.log(`Vencedora da mão: dupla ${estado.mao.vencedora === 0 ? 'A' : 'B'}.`);
console.log(`Placar: A ${estado.placar[0]} × ${estado.placar[1]} B.`);
