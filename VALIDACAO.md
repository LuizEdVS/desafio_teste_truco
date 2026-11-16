# Validação local

Verificação realizada em 16/11/2026, no Windows, usando Node.js `v24.22.1`.

Comando executado na raiz do projeto:

```sh
node --test
```

Resultado:

```text
tests 142
suites 10
pass 142
fail 0
cancelled 0
skipped 0
todo 0
```

Todos os casos foram executados com sucesso, incluindo uma partida completa desde o placar zero, mãos de onze e de ferro, negociação de aumentos e rejeição de ações inválidas sem alteração do estado.

Também foi executado `node exemplo.js`: a demonstração terminou após duas rodadas, com vitória da dupla A e placar de 3 a 0.

O workflow do GitHub Actions executa os testes em Node.js 22 e 24. A execução local acima foi feita no Node.js 24. Os resultados da integração contínua ficam na aba [Actions do repositório](https://github.com/LuizEdVS/desafio_teste_truco/actions).
