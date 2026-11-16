// Valores em ordem crescente. A manilha é o próximo valor depois da vira.
export const VALORES = Object.freeze(['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3']);
export const NAIPES = Object.freeze(['ouros', 'espadas', 'copas', 'paus']);
const APOSTAS = Object.freeze([1, 3, 6, 9, 12]);

function exigir(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

function validarCarta(carta) {
  exigir(carta !== null && typeof carta === 'object'
    && VALORES.includes(carta.valor) && NAIPES.includes(carta.naipe), 'Carta inválida.');
}

function chave(carta) {
  return `${carta.valor}-${carta.naipe}`;
}

export function duplaDoJogador(jogador) {
  exigir(Number.isInteger(jogador) && jogador >= 0 && jogador < 4, 'Jogador inválido: use 0, 1, 2 ou 3.');
  return jogador % 2;
}

export function criarBaralho() {
  return VALORES.flatMap(valor => NAIPES.map(naipe => ({ valor, naipe })));
}

export function obterManilha(vira) {
  validarCarta(vira);
  return VALORES[(VALORES.indexOf(vira.valor) + 1) % VALORES.length];
}

function forca(carta, manilha) {
  validarCarta(carta);
  return carta.valor === manilha
    ? VALORES.length + NAIPES.indexOf(carta.naipe)
    : VALORES.indexOf(carta.valor);
}

// 1: a primeira vence; -1: a segunda vence; 0: empate.
export function compararCartas(primeira, segunda, vira) {
  const manilha = obterManilha(vira);
  return Math.sign(forca(primeira, manilha) - forca(segunda, manilha));
}

// Recebe um baralho já ordenado. A ausência de sorteio torna os testes repetíveis.
export function distribuirCartas(baralho, primeiroJogador = 0) {
  duplaDoJogador(primeiroJogador);
  exigir(Array.isArray(baralho) && baralho.length === 40, 'O baralho deve conter 40 cartas.');
  for (const carta of baralho) validarCarta(carta);
  exigir(new Set(baralho.map(chave)).size === 40, 'O baralho contém cartas repetidas.');
  const copia = baralho.map(carta => ({ valor: carta.valor, naipe: carta.naipe }));
  const cartas = [[], [], [], []];
  for (let i = 0; i < 12; i += 1) cartas[(primeiroJogador + i) % 4].push(copia[i]);
  return { cartas, vira: copia[12], monte: copia.slice(13) };
}

export function apurarRodada(jogadas, vira) {
  exigir(Array.isArray(jogadas) && jogadas.length === 4, 'Uma rodada exige 4 jogadas.');
  const manilha = obterManilha(vira);
  for (const jogada of jogadas) {
    exigir(jogada !== null && typeof jogada === 'object', 'Jogada inválida.');
    duplaDoJogador(jogada.jogador);
    validarCarta(jogada.carta);
  }
  exigir(new Set(jogadas.map(j => j.jogador)).size === 4, 'Cada jogador deve jogar uma vez.');
  const chaves = jogadas.map(j => chave(j.carta));
  exigir(new Set(chaves).size === 4 && !chaves.includes(chave(vira)), 'Carta repetida ou igual à vira.');
  const maiorForca = Math.max(...jogadas.map(j => forca(j.carta, manilha)));
  const maiores = jogadas.filter(j => forca(j.carta, manilha) === maiorForca);
  const duplas = new Set(maiores.map(j => duplaDoJogador(j.jogador)));
  return {
    duplaVencedora: duplas.size === 1 ? duplaDoJogador(maiores[0].jogador) : null,
    // Em empate, começa quem primeiro apresentou uma das cartas mais fortes.
    proximoJogador: maiores[0].jogador,
  };
}

function resultadoParcial(resultados) {
  if (resultados.length < 2) return { encerrada: false, vencedora: null };
  const [primeira, segunda, terceira] = resultados;
  if (primeira === null && segunda !== null) return { encerrada: true, vencedora: segunda };
  if (primeira !== null && (segunda === null || primeira === segunda)) {
    return { encerrada: true, vencedora: primeira };
  }
  if (resultados.length === 2) return { encerrada: false, vencedora: null };
  return { encerrada: true, vencedora: terceira === null ? primeira : terceira };
}

// Cada resultado é 0 (dupla A), 1 (dupla B) ou null (empate).
export function apurarMao(resultados) {
  exigir(Array.isArray(resultados) && resultados.length <= 3, 'Uma mão possui no máximo 3 rodadas.');
  exigir(resultados.every(r => r === 0 || r === 1 || r === null), 'Resultado de rodada inválido.');
  if (resultados.length === 3) {
    exigir(!resultadoParcial(resultados.slice(0, 2)).encerrada, 'A mão já terminou na segunda rodada.');
  }
  return resultadoParcial(resultados);
}

export class Partida {
  #jogadores;
  #placar;
  #proximoIniciador;
  #mao = null;
  #vencedora = null;

  constructor({
    jogadores = ['Jogador 1', 'Jogador 2', 'Jogador 3', 'Jogador 4'],
    placar = [0, 0],
    primeiroJogador = 0,
  } = {}) {
    exigir(Array.isArray(jogadores) && jogadores.length === 4, 'São necessários 4 jogadores.');
    exigir(jogadores.every(j => typeof j === 'string' && j.trim().length > 0), 'Nome de jogador inválido.');
    const nomes = jogadores.map(j => j.trim());
    exigir(new Set(nomes).size === 4, 'Os jogadores devem ter nomes diferentes.');
    exigir(Array.isArray(placar) && placar.length === 2
      && placar.every(p => Number.isInteger(p) && p >= 0 && p <= 11), 'Placar inicial inválido: use 0 a 11.');
    duplaDoJogador(primeiroJogador);
    this.#jogadores = nomes;
    this.#placar = [...placar];
    this.#proximoIniciador = primeiroJogador;
  }

  get estado() {
    let mao = null;
    if (this.#mao) {
      const { cartas, ...publico } = this.#mao;
      mao = { ...publico, cartasRestantes: cartas.map(c => c.length) };
    }
    return structuredClone({
      jogadores: this.#jogadores,
      duplas: [[0, 2], [1, 3]],
      placar: this.#placar,
      vencedora: this.#vencedora,
      proximoIniciador: this.#proximoIniciador,
      mao,
    });
  }

  visaoDoJogador(jogador) {
    const dupla = duplaDoJogador(jogador);
    exigir(this.#mao !== null, 'Inicie uma mão primeiro.');
    const h = this.#mao;
    const podeVerParceiro = h.fase === 'decisao-onze' && h.duplaOnze === dupla;
    return structuredClone({
      estado: this.estado,
      cartas: h.tipo === 'ferro' ? h.cartas[jogador].map(() => null) : h.cartas[jogador],
      cartasParceiro: podeVerParceiro ? h.cartas[(jogador + 2) % 4] : null,
    });
  }

  iniciarMao(baralho) {
    exigir(this.#vencedora === null, 'A partida já terminou.');
    exigir(this.#mao === null || this.#mao.fase === 'encerrada', 'A mão atual ainda está em andamento.');
    const iniciador = this.#proximoIniciador;
    const { cartas, vira } = distribuirCartas(baralho, iniciador);
    const duasComOnze = this.#placar.every(p => p === 11);
    const duplaOnze = this.#placar.findIndex(p => p === 11);
    const tipo = duasComOnze ? 'ferro' : duplaOnze >= 0 ? 'onze' : 'normal';
    this.#mao = {
      tipo, fase: tipo === 'onze' ? 'decisao-onze' : 'jogando',
      duplaOnze: tipo === 'onze' ? duplaOnze : null,
      cartas, vira, manilha: obterManilha(vira),
      valor: tipo === 'normal' ? 1 : 3,
      iniciador, vez: iniciador, mesa: [], rodadas: [],
      pedido: null, ultimaDuplaAumentou: null, vencedora: null,
    };
    this.#proximoIniciador = (iniciador + 1) % 4;
    return this.estado;
  }

  #maoAtiva() {
    exigir(this.#vencedora === null, 'A partida já terminou.');
    exigir(this.#mao !== null, 'Inicie uma mão primeiro.');
    exigir(this.#mao.fase !== 'encerrada', 'A mão já terminou.');
    return this.#mao;
  }

  #encerrarMao(vencedora, pontos = this.#mao.valor) {
    this.#mao.fase = 'encerrada';
    this.#mao.vencedora = vencedora;
    this.#mao.pedido = null;
    if (vencedora !== null) {
      this.#placar[vencedora] += pontos;
      if (this.#placar[vencedora] >= 12) this.#vencedora = vencedora;
    }
  }

  decidirMaoOnze(jogador, decisao) {
    const dupla = duplaDoJogador(jogador);
    const h = this.#maoAtiva();
    exigir(h.fase === 'decisao-onze', 'Não há decisão de mão de onze pendente.');
    exigir(dupla === h.duplaOnze, 'Somente a dupla com onze pode decidir.');
    exigir(decisao === 'jogar' || decisao === 'correr', 'Decisão inválida: use jogar ou correr.');
    if (decisao === 'correr') this.#encerrarMao(1 - dupla, 1);
    else h.fase = 'jogando';
    return this.estado;
  }

  jogarCarta(jogador, indiceCarta) {
    duplaDoJogador(jogador);
    const h = this.#maoAtiva();
    exigir(h.fase === 'jogando', 'Aguarde a decisão da mão de onze.');
    exigir(h.pedido === null, 'Responda ao pedido de aumento antes de jogar.');
    exigir(jogador === h.vez, 'Não é a vez deste jogador.');
    exigir(Number.isInteger(indiceCarta) && indiceCarta >= 0
      && indiceCarta < h.cartas[jogador].length, 'Índice de carta inválido.');
    const [carta] = h.cartas[jogador].splice(indiceCarta, 1);
    h.mesa.push({ jogador, carta });
    h.vez = (jogador + 1) % 4;
    if (h.mesa.length === 4) {
      const resultado = apurarRodada(h.mesa, h.vira);
      h.rodadas.push({ jogadas: h.mesa, ...resultado });
      h.mesa = [];
      h.vez = resultado.proximoJogador;
      const mao = apurarMao(h.rodadas.map(r => r.duplaVencedora));
      if (mao.encerrada) this.#encerrarMao(mao.vencedora);
    }
    return this.estado;
  }

  pedirAumento(jogador, valor) {
    const dupla = duplaDoJogador(jogador);
    const h = this.#maoAtiva();
    exigir(h.tipo === 'normal', 'Aumentos são bloqueados na mão de onze e na mão de ferro.');
    exigir(h.pedido === null, 'Já existe um pedido pendente; use responderAumento.');
    exigir(jogador === h.vez, 'Só pode pedir aumento na sua vez, antes de jogar.');
    const proximoValor = APOSTAS[APOSTAS.indexOf(h.valor) + 1];
    exigir(proximoValor !== undefined && valor === proximoValor, 'Aumento inválido: siga 1, 3, 6, 9, 12.');
    exigir(h.ultimaDuplaAumentou !== dupla, 'A mesma dupla não pode aumentar duas vezes seguidas.');
    h.pedido = { duplaSolicitante: dupla, valor };
    h.ultimaDuplaAumentou = dupla;
    return this.estado;
  }

  responderAumento(jogador, resposta) {
    const dupla = duplaDoJogador(jogador);
    const h = this.#maoAtiva();
    exigir(h.pedido !== null, 'Não há pedido de aumento pendente.');
    exigir(dupla !== h.pedido.duplaSolicitante, 'Somente a dupla adversária pode responder.');
    exigir(['aceitar', 'correr', 'aumentar'].includes(resposta), 'Resposta inválida.');
    if (resposta === 'correr') {
      this.#encerrarMao(h.pedido.duplaSolicitante, h.valor);
    } else if (resposta === 'aceitar') {
      h.valor = h.pedido.valor;
      h.pedido = null;
    } else {
      const proximoValor = APOSTAS[APOSTAS.indexOf(h.pedido.valor) + 1];
      exigir(proximoValor !== undefined, 'Doze é o aumento máximo.');
      // Retrucar aceita o valor anterior; correr do novo pedido paga esse valor.
      h.valor = h.pedido.valor;
      h.pedido = { duplaSolicitante: dupla, valor: proximoValor };
      h.ultimaDuplaAumentou = dupla;
    }
    return this.estado;
  }
}
