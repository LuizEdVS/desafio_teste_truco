import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Partida, duplaDoJogador, criarBaralho } from '../src/truco.js';
import {
  carta as c, MAOS, VIRA, baralhoCom, novaPartida,
  jogarRodada, concluirMao, rejeitaSemAlterar,
} from '../support/fixtures.js';

const MAOS_B = [MAOS[1], MAOS[0], MAOS[3], MAOS[2]];
const MAOS_EMPATE = ['paus', 'copas', 'espadas', 'ouros']
  .map(naipe => ['3', '2', 'A'].map(valor => c(valor, naipe)));

// Contra-aumentos alternam as duplas e aceitam implicitamente o valor anterior.
function comPedido(valor) {
  const partida = novaPartida();
  partida.pedirAumento(0, 3);
  while (partida.estado.mao.pedido.valor < valor) {
    const adversario = 1 - partida.estado.mao.pedido.duplaSolicitante;
    partida.responderAumento(adversario, 'aumentar');
  }
  return partida;
}

describe('CT06 — Configuração das duas duplas', () => {
  it('forma A com jogadores 0 e 2, e B com jogadores 1 e 3', () => {
    const partida = new Partida({ jogadores: ['Ana', 'Bia', 'Caio', 'Davi'] });
    assert.deepEqual(partida.estado.duplas, [[0, 2], [1, 3]]);
    assert.deepEqual([0, 1, 2, 3].map(duplaDoJogador), [0, 1, 0, 1]);
    assert.deepEqual(partida.estado.placar, [0, 0]);
    assert.equal(partida.estado.mao, null);
    assert.equal(partida.estado.vencedora, null);
  });

  for (const quantidade of [2, 3, 5, 6]) {
    it(`rejeita ${quantidade} jogadores`, () => {
      assert.throws(() => new Partida({ jogadores: Array.from({ length: quantidade }, (_, i) => `J${i}`) }), /4 jogadores/);
    });
  }

  it('rejeita nomes repetidos, vazios ou inválidos', () => {
    for (const jogadores of [['A', ' A ', 'C', 'D'], ['A', '', 'C', 'D'], ['A', 1, 'C', 'D']]) {
      assert.throws(() => new Partida({ jogadores }), /nomes diferentes|Nome de jogador inválido/);
    }
  });

  for (const jogador of [-1, 4, 1.5, '0']) {
    it(`rejeita identificador de jogador ${JSON.stringify(jogador)}`, () => {
      assert.throws(() => duplaDoJogador(jogador), /Jogador inválido/);
      assert.throws(() => new Partida({ primeiroJogador: jogador }), /Jogador inválido/);
    });
  }

  it('rejeita placares negativos, fracionários, já encerrados ou sem duas posições', () => {
    for (const placar of [[-1, 0], [0.5, 0], [12, 0], [0], ['1', 0]]) {
      assert.throws(() => new Partida({ placar }), /Placar inicial inválido/);
    }
  });

  it('não permite alterar o estado interno pelas opções ou pelo estado retornado', () => {
    const jogadores = ['Ana', 'Bia', 'Caio', 'Davi'];
    const placar = [0, 0];
    const partida = new Partida({ jogadores, placar });
    jogadores[0] = 'Alterado';
    placar[0] = 99;
    const estado = partida.estado;
    estado.jogadores[0] = 'Alterado';
    estado.placar[0] = 99;
    estado.duplas[0].push(3);
    assert.equal(partida.estado.jogadores[0], 'Ana');
    assert.deepEqual(partida.estado.placar, [0, 0]);
    assert.deepEqual(partida.estado.duplas, [[0, 2], [1, 3]]);
  });
});

describe('CT07 — Fluxo real de cartas e mãos', () => {
  it('exige iniciar a mão antes de qualquer ação', () => {
    const partida = new Partida();
    for (const acao of [
      () => partida.jogarCarta(0, 0), () => partida.pedirAumento(0, 3),
      () => partida.responderAumento(1, 'aceitar'), () => partida.decidirMaoOnze(0, 'jogar'),
      () => partida.visaoDoJogador(0),
    ]) rejeitaSemAlterar(partida, acao, /Inicie uma mão/);
  });

  it('uma distribuição inválida não cria uma mão nem avança o iniciador', () => {
    const partida = new Partida();
    rejeitaSemAlterar(partida, () => partida.iniciarMao([]), /40 cartas/);
  });

  it('inicia mão normal com três cartas por jogador, vira e valor um', () => {
    const partida = novaPartida();
    assert.equal(partida.estado.mao.tipo, 'normal');
    assert.equal(partida.estado.mao.fase, 'jogando');
    assert.equal(partida.estado.mao.valor, 1);
    assert.deepEqual(partida.estado.mao.cartasRestantes, [3, 3, 3, 3]);
    assert.deepEqual(partida.estado.mao.vira, VIRA);
    assert.equal(partida.estado.mao.manilha, 'Q');
  });

  it('consome apenas a carta escolhida e passa a vez para o próximo jogador', () => {
    const partida = novaPartida();
    partida.jogarCarta(0, 1);
    assert.deepEqual(partida.estado.mao.mesa, [{ jogador: 0, carta: c('2', 'paus') }]);
    assert.deepEqual(partida.visaoDoJogador(0).cartas, [c('3', 'paus'), c('A', 'paus')]);
    assert.deepEqual(partida.estado.mao.cartasRestantes, [2, 3, 3, 3]);
    assert.equal(partida.estado.mao.vez, 1);
  });

  it('rejeita jogada fora da vez sem consumir cartas', () => {
    const partida = novaPartida();
    rejeitaSemAlterar(partida, () => partida.jogarCarta(1, 0), /Não é a vez/);
  });

  for (const indice of [-1, 3, 0.5, '0']) {
    it(`rejeita índice de carta ${JSON.stringify(indice)} sem alterar o estado`, () => {
      const partida = novaPartida();
      rejeitaSemAlterar(partida, () => partida.jogarCarta(0, indice), /Índice de carta inválido/);
    });
  }

  it('índices são atualizados depois da remoção de uma carta', () => {
    const partida = novaPartida();
    jogarRodada(partida);
    rejeitaSemAlterar(partida, () => partida.jogarCarta(0, 2), /Índice de carta inválido/);
  });

  it('quem vence a rodada começa a seguinte, inclusive o parceiro 2', () => {
    const partida = novaPartida({}, [MAOS[2], MAOS[1], MAOS[0], MAOS[3]]);
    jogarRodada(partida);
    assert.equal(partida.estado.mao.rodadas[0].duplaVencedora, 0);
    assert.equal(partida.estado.mao.vez, 2);
  });

  it('encerra em duas rodadas e atribui um ponto à dupla A', () => {
    const partida = novaPartida();
    concluirMao(partida);
    assert.equal(partida.estado.mao.rodadas.length, 2);
    assert.equal(partida.estado.mao.vencedora, 0);
    assert.deepEqual(partida.estado.placar, [1, 0]);
  });

  it('a dupla B também pode vencer e pontuar', () => {
    const partida = novaPartida({}, MAOS_B);
    concluirMao(partida);
    assert.equal(partida.estado.mao.vencedora, 1);
    assert.deepEqual(partida.estado.placar, [0, 1]);
  });

  it('três rodadas empatadas encerram a mão sem alterar o placar', () => {
    const partida = novaPartida({ placar: [5, 7] }, MAOS_EMPATE);
    concluirMao(partida);
    assert.equal(partida.estado.mao.rodadas.length, 3);
    assert.equal(partida.estado.mao.vencedora, null);
    assert.deepEqual(partida.estado.placar, [5, 7]);
  });

  it('não permite iniciar outra mão durante a atual', () => {
    const partida = novaPartida();
    rejeitaSemAlterar(partida, () => partida.iniciarMao(criarBaralho()), /em andamento/);
  });

  it('não permite jogar, aumentar ou pontuar de novo depois do fim da mão', () => {
    const partida = novaPartida();
    concluirMao(partida);
    rejeitaSemAlterar(partida, () => partida.jogarCarta(0, 0), /A mão já terminou/);
    rejeitaSemAlterar(partida, () => partida.pedirAumento(0, 3), /A mão já terminou/);
    rejeitaSemAlterar(partida, () => partida.responderAumento(1, 'correr'), /A mão já terminou/);
  });

  it('uma nova mão preserva o placar e reinicia cartas, rodadas, aposta e pedidos', () => {
    const partida = novaPartida();
    partida.pedirAumento(0, 3);
    partida.responderAumento(1, 'aceitar');
    concluirMao(partida);
    partida.iniciarMao(baralhoCom(MAOS, VIRA, 1));
    assert.deepEqual(partida.estado.placar, [3, 0]);
    assert.equal(partida.estado.mao.vez, 1);
    assert.equal(partida.estado.mao.valor, 1);
    assert.equal(partida.estado.mao.pedido, null);
    assert.equal(partida.estado.mao.ultimaDuplaAumentou, null);
    assert.deepEqual(partida.estado.mao.rodadas, []);
    assert.deepEqual(partida.estado.mao.cartasRestantes, [3, 3, 3, 3]);
  });

  it('cartas e visões retornadas não permitem modificar as cartas internas', () => {
    const partida = new Partida();
    const baralho = baralhoCom();
    partida.iniciarMao(baralho);
    baralho[0].valor = '4';
    const visao = partida.visaoDoJogador(0);
    visao.cartas[0].valor = '4';
    assert.deepEqual(partida.visaoDoJogador(0).cartas[0], c('3', 'paus'));
    assert.equal(partida.visaoDoJogador(1).cartasParceiro, null);
    assert.equal('cartas' in partida.estado.mao, false);
  });
});

describe('CT08 — Truco, seis, nove e doze', () => {
  for (const [pedido, pontosAoCorrer] of [[3, 1], [6, 3], [9, 6], [12, 9]]) {
    it(`aceitar ${pedido} faz a mão valer ${pedido}`, () => {
      const partida = comPedido(pedido);
      const respondente = 1 - partida.estado.mao.pedido.duplaSolicitante;
      partida.responderAumento(respondente, 'aceitar');
      assert.equal(partida.estado.mao.valor, pedido);
      assert.equal(partida.estado.mao.pedido, null);
      assert.equal(partida.estado.mao.vez, 0);
      concluirMao(partida);
      assert.deepEqual(partida.estado.placar, [pedido, 0]);
    });

    it(`correr do pedido de ${pedido} entrega ${pontosAoCorrer} pontos a quem pediu`, () => {
      const partida = comPedido(pedido);
      const solicitante = partida.estado.mao.pedido.duplaSolicitante;
      partida.responderAumento(1 - solicitante, 'correr');
      const placar = [0, 0];
      placar[solicitante] = pontosAoCorrer;
      assert.deepEqual(partida.estado.placar, placar);
      assert.equal(partida.estado.mao.fase, 'encerrada');
      assert.equal(partida.estado.mao.vencedora, solicitante);
    });
  }

  it('retrucar aceita o pedido anterior antes de propor o próximo', () => {
    const partida = novaPartida();
    partida.pedirAumento(0, 3);
    assert.equal(partida.estado.mao.valor, 1);
    partida.responderAumento(3, 'aumentar');
    assert.equal(partida.estado.mao.valor, 3);
    assert.deepEqual(partida.estado.mao.pedido, { duplaSolicitante: 1, valor: 6 });
  });

  it('permite ao parceiro do adversário responder pela dupla', () => {
    const partida = novaPartida();
    partida.pedirAumento(0, 3);
    partida.responderAumento(3, 'aceitar');
    assert.equal(partida.estado.mao.valor, 3);
  });

  it('bloqueia jogadas enquanto o pedido não for respondido', () => {
    const partida = comPedido(3);
    rejeitaSemAlterar(partida, () => partida.jogarCarta(0, 0), /Responda ao pedido/);
  });

  it('bloqueia resposta da própria dupla que pediu', () => {
    const partida = comPedido(3);
    rejeitaSemAlterar(partida, () => partida.responderAumento(2, 'aceitar'), /dupla adversária/);
  });

  it('bloqueia resposta sem pedido pendente e resposta desconhecida', () => {
    const partida = novaPartida();
    rejeitaSemAlterar(partida, () => partida.responderAumento(1, 'aceitar'), /Não há pedido/);
    partida.pedirAumento(0, 3);
    rejeitaSemAlterar(partida, () => partida.responderAumento(1, 'talvez'), /Resposta inválida/);
  });

  it('bloqueia aumento fora da vez e salto de níveis', () => {
    const partida = novaPartida();
    rejeitaSemAlterar(partida, () => partida.pedirAumento(1, 3), /sua vez/);
    rejeitaSemAlterar(partida, () => partida.pedirAumento(0, 6), /Aumento inválido/);
    rejeitaSemAlterar(partida, () => partida.pedirAumento(0, 2), /Aumento inválido/);
  });

  it('bloqueia um novo pedido enquanto outro aguarda resposta', () => {
    const partida = comPedido(3);
    rejeitaSemAlterar(partida, () => partida.pedirAumento(0, 6), /pedido pendente/);
  });

  it('a dupla que acabou de pedir não pode pedir o próximo aumento, inclusive pelo parceiro', () => {
    const partida = comPedido(3);
    partida.responderAumento(1, 'aceitar');
    rejeitaSemAlterar(partida, () => partida.pedirAumento(0, 6), /mesma dupla/);
    partida.jogarCarta(0, 0);
    partida.jogarCarta(1, 0);
    rejeitaSemAlterar(partida, () => partida.pedirAumento(2, 6), /mesma dupla/);
  });

  it('a dupla que aceitou pode pedir o próximo aumento na sua vez', () => {
    const partida = comPedido(3);
    partida.responderAumento(1, 'aceitar');
    partida.jogarCarta(0, 0);
    partida.pedirAumento(1, 6);
    partida.responderAumento(2, 'aceitar');
    assert.equal(partida.estado.mao.valor, 6);
    assert.equal(partida.estado.mao.vez, 1);
    assert.equal(partida.estado.mao.mesa.length, 1);
  });

  it('bloqueia contra-aumento acima de doze sem aceitar o pedido por acidente', () => {
    const partida = comPedido(12);
    const respondente = 1 - partida.estado.mao.pedido.duplaSolicitante;
    rejeitaSemAlterar(partida, () => partida.responderAumento(respondente, 'aumentar'), /aumento máximo/);
  });

  it('bloqueia novo aumento depois que doze foi aceito', () => {
    const partida = comPedido(12);
    partida.responderAumento(0, 'aceitar');
    rejeitaSemAlterar(partida, () => partida.pedirAumento(0, 15), /Aumento inválido/);
  });
});

describe('CT09 — Mão de onze', () => {
  for (const [placar, dupla] of [[[11, 4], 0], [[4, 11], 1]]) {
    it(`aguarda decisão da dupla ${dupla} no placar ${placar}`, () => {
      const partida = novaPartida({ placar });
      assert.equal(partida.estado.mao.tipo, 'onze');
      assert.equal(partida.estado.mao.fase, 'decisao-onze');
      assert.equal(partida.estado.mao.duplaOnze, dupla);
      assert.equal(partida.estado.mao.valor, 3);
      rejeitaSemAlterar(partida, () => partida.jogarCarta(0, 0), /Aguarde a decisão/);
      rejeitaSemAlterar(partida, () => partida.decidirMaoOnze(1 - dupla, 'jogar'), /dupla com onze/);
      partida.decidirMaoOnze(dupla, 'jogar');
      assert.equal(partida.estado.mao.fase, 'jogando');
    });
  }

  it('correr antes da mão entrega somente um ponto à dupla adversária', () => {
    const partida = novaPartida({ placar: [11, 5] });
    partida.decidirMaoOnze(2, 'correr');
    assert.deepEqual(partida.estado.placar, [11, 6]);
    assert.equal(partida.estado.mao.fase, 'encerrada');
    assert.equal(partida.estado.vencedora, null);
  });

  it('a dupla que aceitou pode perder três pontos para a adversária', () => {
    const partida = novaPartida({ placar: [11, 5] }, MAOS_B);
    partida.decidirMaoOnze(0, 'jogar');
    concluirMao(partida);
    assert.deepEqual(partida.estado.placar, [11, 8]);
    assert.equal(partida.estado.vencedora, null);
  });

  it('vencer a mão de onze encerra a partida mesmo ultrapassando doze', () => {
    const partida = novaPartida({ placar: [11, 5] });
    partida.decidirMaoOnze(0, 'jogar');
    concluirMao(partida);
    assert.deepEqual(partida.estado.placar, [14, 5]);
    assert.equal(partida.estado.vencedora, 0);
  });

  it('permite ver as cartas do parceiro somente à dupla com onze durante a decisão', () => {
    const partida = novaPartida({ placar: [11, 5] });
    assert.deepEqual(partida.visaoDoJogador(0).cartasParceiro, MAOS[2]);
    assert.deepEqual(partida.visaoDoJogador(2).cartasParceiro, MAOS[0]);
    assert.equal(partida.visaoDoJogador(1).cartasParceiro, null);
    assert.equal(partida.visaoDoJogador(3).cartasParceiro, null);
    partida.decidirMaoOnze(0, 'jogar');
    assert.equal(partida.visaoDoJogador(0).cartasParceiro, null);
  });

  it('bloqueia pedidos de truco antes e depois da decisão, sem penalizar o placar', () => {
    const partida = novaPartida({ placar: [11, 5] });
    rejeitaSemAlterar(partida, () => partida.pedirAumento(0, 3), /bloqueados/);
    partida.decidirMaoOnze(0, 'jogar');
    rejeitaSemAlterar(partida, () => partida.pedirAumento(0, 6), /bloqueados/);
  });

  it('rejeita decisão desconhecida e decisão repetida', () => {
    const partida = novaPartida({ placar: [11, 5] });
    rejeitaSemAlterar(partida, () => partida.decidirMaoOnze(0, 'talvez'), /Decisão inválida/);
    partida.decidirMaoOnze(0, 'jogar');
    rejeitaSemAlterar(partida, () => partida.decidirMaoOnze(0, 'correr'), /Não há decisão/);
  });

  it('uma mão normal não aceita decisão de mão de onze', () => {
    const partida = novaPartida();
    rejeitaSemAlterar(partida, () => partida.decidirMaoOnze(0, 'jogar'), /Não há decisão/);
  });

  it('três empates na mão de onze não pontuam na variante deste desafio', () => {
    const partida = novaPartida({ placar: [11, 5] }, MAOS_EMPATE);
    partida.decidirMaoOnze(0, 'jogar');
    concluirMao(partida);
    assert.deepEqual(partida.estado.placar, [11, 5]);
    assert.equal(partida.estado.vencedora, null);
  });

  it('atingir onze numa mão normal ativa a decisão apenas na mão seguinte', () => {
    const partida = novaPartida({ placar: [10, 5] });
    concluirMao(partida);
    assert.deepEqual(partida.estado.placar, [11, 5]);
    assert.equal(partida.estado.vencedora, null);
    partida.iniciarMao(baralhoCom(MAOS, VIRA, 1));
    assert.equal(partida.estado.mao.fase, 'decisao-onze');
  });
});

describe('CT10 — Mão de ferro e fim da partida', () => {
  it('no onze a onze começa diretamente, vale três e esconde as cartas dos quatro jogadores', () => {
    const partida = novaPartida({ placar: [11, 11] });
    assert.equal(partida.estado.mao.tipo, 'ferro');
    assert.equal(partida.estado.mao.fase, 'jogando');
    assert.equal(partida.estado.mao.valor, 3);
    for (let jogador = 0; jogador < 4; jogador += 1) {
      assert.deepEqual(partida.visaoDoJogador(jogador).cartas, [null, null, null]);
      assert.equal(partida.visaoDoJogador(jogador).cartasParceiro, null);
    }
    partida.jogarCarta(0, 0);
    assert.deepEqual(partida.visaoDoJogador(0).cartas, [null, null]);
    assert.deepEqual(partida.estado.mao.mesa[0].carta, MAOS[0][0]);
  });

  it('bloqueia truco e decisão de correr na mão de ferro', () => {
    const partida = novaPartida({ placar: [11, 11] });
    rejeitaSemAlterar(partida, () => partida.pedirAumento(0, 3), /bloqueados/);
    rejeitaSemAlterar(partida, () => partida.decidirMaoOnze(0, 'correr'), /Não há decisão/);
  });

  for (const [maos, vencedora] of [[MAOS, 0], [MAOS_B, 1]]) {
    it(`a dupla ${vencedora} pode vencer a mão de ferro e a partida`, () => {
      const partida = novaPartida({ placar: [11, 11] }, maos);
      concluirMao(partida);
      assert.equal(partida.estado.vencedora, vencedora);
      assert.equal(partida.estado.placar[vencedora], 14);
    });
  }

  it('empatar as três rodadas da mão de ferro mantém onze a onze', () => {
    const partida = novaPartida({ placar: [11, 11] }, MAOS_EMPATE);
    concluirMao(partida);
    assert.deepEqual(partida.estado.placar, [11, 11]);
    assert.equal(partida.estado.vencedora, null);
    partida.iniciarMao(baralhoCom(MAOS, VIRA, 1));
    assert.equal(partida.estado.mao.tipo, 'ferro');
  });

  for (const pontos of [9, 10]) {
    it(`partindo de ${pontos}, ganhar três encerra ao alcançar ou ultrapassar doze`, () => {
      const partida = novaPartida({ placar: [pontos, 0] });
      partida.pedirAumento(0, 3);
      partida.responderAumento(1, 'aceitar');
      concluirMao(partida);
      assert.equal(partida.estado.placar[0], pontos + 3);
      assert.equal(partida.estado.vencedora, 0);
      rejeitaSemAlterar(partida, () => partida.iniciarMao(criarBaralho()), /A partida já terminou/);
      rejeitaSemAlterar(partida, () => partida.jogarCarta(0, 0), /A partida já terminou/);
      rejeitaSemAlterar(partida, () => partida.pedirAumento(0, 3), /A partida já terminou/);
    });
  }

  it('correr de um pedido também pode encerrar a partida', () => {
    const partida = novaPartida({ placar: [9, 0] });
    partida.pedirAumento(0, 3);
    partida.responderAumento(1, 'aumentar');
    partida.responderAumento(0, 'aumentar');
    partida.responderAumento(1, 'correr');
    assert.deepEqual(partida.estado.placar, [15, 0]);
    assert.equal(partida.estado.vencedora, 0);
  });

  it('executa uma partida desde zero com quatro mãos, alternando o iniciador', () => {
    const partida = new Partida();
    for (let iniciador = 0; iniciador < 4; iniciador += 1) {
      partida.iniciarMao(baralhoCom(MAOS, VIRA, iniciador));
      assert.equal(partida.estado.mao.iniciador, iniciador);
      partida.pedirAumento(iniciador, 3);
      partida.responderAumento((iniciador + 1) % 4, 'aceitar');
      concluirMao(partida);
      assert.deepEqual(partida.estado.placar, [(iniciador + 1) * 3, 0]);
    }
    assert.equal(partida.estado.vencedora, 0);
  });
});
