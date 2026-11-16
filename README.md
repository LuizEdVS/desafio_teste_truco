# Desafio — Truco Paulista em JavaScript

Projeto de testes automatizados para **Truco Paulista com duas duplas**, com uma implementação de referência em JavaScript e **142 casos de teste** executáveis.

## 1. Concepção do desafio

O desafio consiste em transformar regras de um jogo em comportamentos verificáveis por código. A implementação deve controlar quatro jogadores, agrupados em duas duplas, comparar cartas, resolver rodadas e mãos, negociar aumentos e determinar a dupla vencedora da partida.

O objetivo de aprendizagem é escrever **testes em JavaScript que validem código JavaScript**, com entradas conhecidas e resultados esperados explícitos. O projeto inclui a solução de referência para que todos os testes possam ser executados desde o primeiro uso.

| Requisito | Onde está atendido |
| --- | --- |
| Explicar a concepção do desafio no leia-me | Seção 1 deste README |
| Explicar o funcionamento dos casos de teste | Seções 4 e 5 deste README |
| Truco Paulista com duas duplas | Motor em `src/truco.js` e grupos CT04 a CT10 |
| Testes em JavaScript para testar JavaScript | Arquivos `test/*.test.js`, usando `node:test` e `node:assert/strict` |

O escopo entregue é o motor de regras, uma demonstração no terminal e a suíte de testes. Interface gráfica, partidas pela rede, inteligência artificial, embaralhamento aleatório e descarte de carta encoberta ficam como possíveis extensões.

## 2. Regras adotadas

### Base do jogo

- Quatro jogadores: **A = posições 0 e 2**, **B = posições 1 e 3**.
- Baralho de 40 cartas, com três cartas para cada jogador e uma vira.
- Ordem crescente das cartas comuns: `4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3`.
- A manilha é o valor seguinte ao da vira; depois do `3`, volta para o `4`.
- Qualquer manilha supera uma carta comum. Entre manilhas: `ouros < espadas < copas < paus`. Entre cartas comuns iguais, o naipe não desempata.
- Uma mão tem até três rodadas. Cada rodada recebe uma carta de cada jogador.
- A mão começa valendo 1; os aumentos seguem `3 → 6 → 9 → 12`.
- Ganha a partida a primeira dupla que alcançar **12 ou mais pontos**.

Referência para a base, força das cartas e aumentos: [regras do MegaJogos](https://www.megajogos.com.br/truco-online/regras).

### Empates e aumentos

| Situação | Resultado esperado |
| --- | --- |
| Uma dupla vence as duas primeiras rodadas | Vence a mão; não existe terceira rodada |
| Primeira rodada empata | Quem vencer a segunda ganha a mão |
| Segunda rodada empata | Ganha quem venceu a primeira |
| Primeira e segunda empatam | A terceira decide |
| Cada dupla vence uma e a terceira empata | Ganha quem venceu a primeira |
| As três empatam | A mão termina sem pontos |
| Cartas máximas iguais pertencem à mesma dupla | Essa dupla vence a rodada |
| Cartas máximas iguais pertencem a duplas adversárias | A rodada empata |

Os padrões de empate seguem o [guia do Jogatina](https://ajuda.jogatina.com/hc/pt-br/articles/360001578651-Truco-Paulista).

Um aumento só pode ser pedido na vez do jogador, antes da carta. Qualquer integrante da dupla adversária pode aceitar, correr ou propor o próximo aumento. Retrucar aceita implicitamente o pedido anterior. Depois da aceitação, somente a dupla que recebeu o último pedido pode propor o próximo aumento, na sua vez.

| Pedido recusado | Pontos para a dupla que pediu |
| --- | ---: |
| Truco: 3 | 1 |
| Seis: 6 | 3 |
| Nove: 9 | 6 |
| Doze: 12 | 9 |

A negociação usa a sequência descrita nas [regras de aumentos do MegaJogos](https://www.megajogos.com.br/truco-online/regras).

### Mão de onze, mão de ferro e escolhas deste desafio

Na mão de onze, os parceiros da dupla com 11 podem consultar as cartas um do outro e decidir: jogar valendo 3 ou correr e entregar 1 ponto. Em 11 a 11, há mão de ferro, com cartas ocultas para seus donos e jogadas por índice. A modalidade às cegas aparece no [guia do Jogatina](https://ajuda.jogatina.com/hc/pt-br/articles/360001578651-Truco-Paulista).

Existem diferenças entre mesas e plataformas. Para que a avaliação seja objetiva, este projeto fixa estas escolhas:

| Escolha da variante didática | Comportamento implementado |
| --- | --- |
| Truco na mão de onze ou de ferro | Comando bloqueado com erro, sem mudar pontos. A opção de bloquear pedidos também aparece no [guia da Cardems](https://www.cardems.com/pt-br/games/truco). |
| Três empates em qualquer tipo de mão | Ninguém pontua; o próximo início continua com o placar anterior. |
| Valor da mão de ferro | 3 pontos; quem vencer encerra a partida. |
| Ordem dos assentos | Ciclo `0 → 1 → 2 → 3 → 0`. |
| Próxima rodada após empate | Começa quem primeiro jogou uma das cartas de maior força. |
| Próxima mão | O iniciador avança uma posição, inclusive após empate ou corrida. |
| Placar final | Preserva a soma real: `11 + 3 = 14`; a vitória é verificada com `>= 12`. |

Essas escolhas integram o contrato dos testes. Para usar outro regulamento, ajuste a regra correspondente e os resultados esperados dos testes afetados.

## 3. Como executar

Requisito: **Node.js 22 ou superior**.

Abra o terminal dentro da pasta `truco-paulista` e execute:

```sh
node --test
```

O projeto usa apenas recursos nativos do Node.js; a instalação de pacotes é dispensada.

Se o npm estiver disponível, o atalho equivalente é:

```sh
npm test
```

Resultado esperado:

```text
tests 142
suites 10
pass 142
fail 0
skipped 0
todo 0
```

Outros comandos:

```sh
# Demonstração de uma mão com duas duplas
node exemplo.js

# Reexecutar testes ao salvar alterações
node --test --watch

# Executar apenas o grupo de manilhas
node --test --test-name-pattern="CT02"

# Relatório de cobertura, com a opção experimental do Node.js
node --test --experimental-test-coverage
```

Os atalhos npm correspondentes são `npm run demo`, `npm run test:watch` e `npm run test:coverage`. O funcionamento do executor está documentado em [Node.js — Test runner](https://nodejs.org/api/test.html).

## 4. Como os testes funcionam

Cada `describe` reúne um grupo de regras; cada `it` executa um caso. Alguns casos são gerados a partir de tabelas, por exemplo as dez possibilidades de vira. O total de 142 corresponde aos testes executados, incluindo essas combinações.

Os testes seguem três etapas:

1. **Preparar:** definir jogadores, cartas, vira e placar inicial.
2. **Agir:** chamar a função ou executar uma sequência de jogadas.
3. **Verificar:** comparar o resultado real com o resultado esperado usando `assert`.

Exemplo real de comparação de manilhas:

```js
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { compararCartas } from './src/truco.js';

it('manilha de paus vence manilha de copas', () => {
  const vira = { valor: '7', naipe: 'ouros' };
  const paus = { valor: 'Q', naipe: 'paus' };
  const copas = { valor: 'Q', naipe: 'copas' };

  assert.equal(compararCartas(paus, copas, vira), 1);
});
```

Esse exemplo é uma explicação; o caso já está incluído em `test/cartas.test.js`.

### Isolamento e repetibilidade

- Cada teste de partida cria uma instância nova, sem compartilhar placares.
- `support/fixtures.js` monta baralhos conhecidos e fisicamente válidos, com 40 cartas distintas.
- A distribuição percorre o baralho na ordem recebida, sem sorteio, datas ou serviços externos.
- Testes de erro usam `assert.throws` e também verificam que o estado permanece igual.
- Os testes de integração executam cartas reais pelos quatro jogadores, até o encerramento da mão ou da partida.
- A suíte verifica as duas duplas, para evitar regras que funcionem apenas para a dupla A.

Um erro em uma asserção faz o comando terminar com código de saída diferente de zero. Isso também faz a verificação do GitHub Actions falhar.

## 5. Catálogo dos casos de teste

| Grupo | Casos | O que verifica | Arquivo |
| --- | ---: | --- | --- |
| CT01 | 7 | Baralho, distribuição, integridade e repetição de cartas | [cartas.test.js](test/cartas.test.js) |
| CT02 | 10 | Manilhas para todas as dez viras, incluindo a volta de 3 para 4 | [cartas.test.js](test/cartas.test.js) |
| CT03 | 20 | Hierarquia completa, naipes, domínio das manilhas e entradas inválidas | [cartas.test.js](test/cartas.test.js) |
| CT04 | 11 | Vitória da rodada, parceiros, adversários e empates | [rodadas.test.js](test/rodadas.test.js) |
| CT05 | 25 | Mãos decididas, mãos pendentes e padrões de empate | [rodadas.test.js](test/rodadas.test.js) |
| CT06 | 12 | Quatro jogadores, duas duplas, nomes, placar e proteção do estado | [partida.test.js](test/partida.test.js) |
| CT07 | 18 | Turnos, consumo de cartas, encerramento e reinício das mãos | [partida.test.js](test/partida.test.js) |
| CT08 | 19 | Aceitar, correr, retrucar, alternar pedidos e limitar aumentos | [partida.test.js](test/partida.test.js) |
| CT09 | 11 | Decisão, consulta do parceiro e pontuação da mão de onze | [partida.test.js](test/partida.test.js) |
| CT10 | 9 | Mão de ferro, vitória a partir de 12 e partida completa | [partida.test.js](test/partida.test.js) |
| **Total** | **142** | **10 grupos de testes** | |

### Exemplos de entrada e saída esperada

| Entrada ou ação | Saída esperada |
| --- | --- |
| Vira = 7 | Manilhas = Q |
| Vira = 3 | Manilhas = 4 |
| Q de paus contra Q de copas, com vira 7 | Primeira carta vence: `1` |
| 3 de paus contra 3 de ouros, com vira 7 | Empate: `0` |
| Rodadas `[0, 1, null]` | Mão encerrada, vencedora `0` |
| Rodadas `[null, null, null]` | Mão encerrada, vencedora `null` |
| Mão valendo 3; adversário corre do pedido de 6 | Solicitante recebe 3 pontos |
| Jogador atua fora da vez | Erro; estado permanece igual |
| Placar 11 a 5; dupla A corre antes da mão | Placar 11 a 6 |
| Placar 11 a 11 | Mão de ferro; cartas ocultas nas quatro visões |

## 6. Organização do projeto

```text
truco-paulista/
├── .github/
│   └── workflows/
│       └── testes.yml          # Executa os testes no GitHub
├── .gitignore
├── README.md
├── VALIDACAO.md                # Resultado da verificação local
├── exemplo.js                 # Demonstração no terminal
├── package.json
├── src/
│   └── truco.js                # Implementação das regras
├── support/
│   └── fixtures.js             # Baralhos e auxiliares dos testes
└── test/
    ├── cartas.test.js
    ├── rodadas.test.js
    └── partida.test.js
```

## 7. Contrato da implementação

Uma carta é um objeto como `{ valor: 'A', naipe: 'paus' }`. Os valores usam strings e os naipes são `ouros`, `espadas`, `copas` e `paus`. A dupla A é `0`, a B é `1` e `null` representa ausência de vencedora.

| Exportação de `src/truco.js` | Retorno ou finalidade |
| --- | --- |
| `VALORES`, `NAIPES` | Sequências imutáveis em ordem crescente de força |
| `criarBaralho()` | Novo baralho de 40 cartas, em ordem fixa |
| `duplaDoJogador(jogador)` | `0` ou `1` para os jogadores de 0 a 3 |
| `distribuirCartas(baralho, primeiroJogador = 0)` | `{ cartas, vira, monte }`, sem alterar a entrada |
| `obterManilha(vira)` | Valor da manilha, como `'Q'` |
| `compararCartas(primeira, segunda, vira)` | `1`, `-1` ou `0` |
| `apurarRodada(jogadas, vira)` | `{ duplaVencedora, proximoJogador }` |
| `apurarMao(resultados)` | `{ encerrada, vencedora }` |
| `new Partida(opcoes)` | Nova partida; opções: `jogadores`, `placar` e `primeiroJogador` |

Métodos de `Partida`:

| Método | Uso |
| --- | --- |
| `iniciarMao(baralho)` | Recebe exatamente 40 cartas únicas, já ordenadas |
| `jogarCarta(jogador, indiceCarta)` | Consome uma carta da mão atual do jogador |
| `pedirAumento(jogador, valor)` | Propõe o próximo valor permitido |
| `responderAumento(jogador, resposta)` | Respostas: `'aceitar'`, `'correr'` ou `'aumentar'` |
| `decidirMaoOnze(jogador, decisao)` | Decisões: `'jogar'` ou `'correr'` |
| `visaoDoJogador(jogador)` | Cartas próprias; parceiro disponível durante sua decisão de onze; cartas próprias ocultas na mão de ferro |
| `estado` | Cópia do estado público, com placar, rodadas e contagens de cartas |

O índice da carta começa em zero e é relativo à mão atual: depois da remoção, os índices restantes mudam. Na mão de ferro, o jogador escolhe um índice sem conhecer a carta; ela é revelada na mesa ao ser jogada.

Os métodos que alteram a partida retornam uma cópia do estado público atualizado. Entradas inválidas geram `Error`. O motor controla uma partida por instância; crie outra instância para jogar novamente após a vitória.

Para testar uma implementação própria, preserve esse contrato em `src/truco.js` ou adapte os imports e chamadas dos testes. Mantenha os resultados esperados de acordo com o regulamento escolhido.

## 8. Repositório e integração contínua

Repositório: [LuizEdVS/desafio_teste_truco](https://github.com/LuizEdVS/desafio_teste_truco).

Para baixar o código e executar os testes:

```sh
git clone https://github.com/LuizEdVS/desafio_teste_truco.git
cd desafio_teste_truco
node --test
```

O workflow `.github/workflows/testes.yml` executa a suíte e a demonstração em Node.js 22 e 24 a cada push e pull request. Os resultados ficam disponíveis na aba [Actions](https://github.com/LuizEdVS/desafio_teste_truco/actions).
