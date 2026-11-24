# PLUSaMais

Aplicação web responsiva para organizar clientes, serviços e agendamentos de um
negócio. A interface funciona em desktop e dispositivos móveis e utiliza o
Supabase para autenticação e armazenamento.

## Usando a aplicação

1. Na tela de acesso, selecione **Criar conta** e informe o nome do negócio,
   e-mail e senha. Repita a senha no campo de confirmação. Se a confirmação de
   e-mail estiver habilitada, confirme o endereço pela mensagem recebida e
   depois faça login.
2. No painel, selecione o negócio, caso sua conta tenha mais de um.
3. Em **Cadastro de Clientes**, informe o nome e, opcionalmente, telefone e
   e-mail. O telefone deve seguir o formato `(XX) XXXXX-XXXX`. Use **Localizar
   clientes** para pesquisar, editar ou excluir um cadastro.
4. Em **Cadastro de Serviços**, informe nome, duração em minutos inteiros e
   preço. Os campos aceitam separador de milhar; o preço aceita até duas casas
   decimais, por exemplo `1.440` minutos e `1.500,00` reais. Use **Localizar
   serviços** e selecione um item da lista para editá-lo ou excluí-lo.
5. Em **Novo Agendamento**, selecione um cliente e um serviço cadastrados,
   escolha data e hora e clique em **Agendar**. Na lista, use os ícones de lápis
   e lixeira para editar ou excluir um compromisso.
6. Para encerrar a sessão neste dispositivo, clique em **Sair**. No celular, use
   o botão de menu para navegar entre as opções.

**Atenção:** excluir um cliente ou serviço também exclui todos os agendamentos
vinculados a ele. A aplicação solicita confirmação; a exclusão é irreversível.
Essas funções dependem das migrações descritas abaixo.

### Datas e horários

- Os horários são informados e exibidos no fuso de Brasília
  (`America/Sao_Paulo`) e armazenados como instantes UTC.
- Novos agendamentos e alterações de horário devem ser para o momento atual ou
  posterior. Horários inexistentes ou ambíguos em mudanças de fuso são rejeitados.
- A lista exibe compromissos desde o início do dia atual em Brasília, inclusive
  os horários de hoje que já passaram. Compromissos de dias anteriores continuam
  no banco de dados, mas não aparecem na lista.
- Registros antigos não são convertidos automaticamente. Confira os dados
  históricos antes de corrigi-los.

## Preparação do ambiente

### Requisitos

- Node.js 22.12 ou superior e npm.
- Um projeto Supabase configurado com autenticação, tabelas, relacionamentos e
  políticas de acesso descritos a seguir.

### Instalação e execução

No terminal, a partir da pasta que contém este README:

```powershell
npm ci
```

Crie um arquivo `.env.local` nessa pasta com os dados do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

Use somente a chave publicável do projeto. Variáveis `VITE_` são incluídas no
código enviado ao navegador: **não coloque nelas chaves secretas ou
`service_role`**. Não compartilhe o arquivo `.env.local`.

Inicie o servidor de desenvolvimento:

```powershell
npm run dev
```

Abra no navegador o endereço informado pelo Vite. Reinicie o servidor depois de
alterar `.env.local`.

Outros comandos disponíveis:

```powershell
npm run build
npm run preview
npm run lint
node --test tests\horario.test.js
```

`build` gera a versão de produção em `dist`; `preview` permite visualizá-la
localmente após a compilação. O teste indicado verifica conversões e regras de
horário. Na Vercel, configure `agendaja` como diretório raiz do projeto e faça
um novo deploy: o arquivo `vercel.json` encaminha `/login`, `/cadastro` e
`/painel` para `index.html`, permitindo atualizar ou acessar essas páginas
diretamente. Em outras hospedagens, configure o mesmo encaminhamento sem
interferir na entrega dos arquivos estáticos. Ao adicionar novas rotas, inclua-as
também nessa configuração.

## Configuração do Supabase

### Estrutura e acesso

A aplicação espera as seguintes tabelas e campos:

| Tabela | Campos utilizados |
| --- | --- |
| `negocios` | `id`, `dono_id`, `nome` |
| `clientes` | `id`, `negocio_id`, `nome`, `telefone`, `email` |
| `servicos` | `id`, `negocio_id`, `nome`, `duracao_minutos`, `preco` |
| `agendamentos` | `id`, `negocio_id`, `cliente_id`, `servico_id`, `data_hora` |

Os IDs dos registros inseridos devem ser gerados pelo banco. Os relacionamentos
entre agendamentos, clientes e serviços devem estar configurados para as
consultas da aplicação; `data_hora` deve armazenar um instante com fuso
(`timestamptz`).

Configure o Row Level Security (RLS) para que cada usuário acesse somente os
dados dos negócios que possui. As operações utilizadas incluem leitura de
negócios; leitura, inserção e atualização de clientes e serviços; e leitura,
inserção, atualização e exclusão de agendamentos. Verifique as políticas e
permissões no projeto Supabase antes de disponibilizar a aplicação.

### Criação automática do negócio

O cadastro envia o nome informado no metadado de autenticação
`nome_do_negocio`. O banco precisa ter uma função e os triggers apropriados em
`auth.users` para criar o negócio vinculado ao usuário confirmado, tanto após
confirmação por e-mail quanto em cadastros com confirmação desativada.

**Esses triggers de criação não estão nas migrações deste projeto** e devem ser
configurados no Supabase. Cadastros antigos sem negócio não são corrigidos
automaticamente. Se o painel informar que não encontrou um negócio, verifique
os triggers, os dados e as políticas RLS.

### Migrações disponíveis

Depois de preparar as tabelas e conferir as políticas, execute no SQL Editor do
projeto Supabase os arquivos abaixo, na ordem:

1. [Exclusão de cliente e agendamentos](./supabase/migrations/20261122164500_excluir_cliente_e_agendamentos.sql).
2. [Exclusão de serviço e agendamentos](./supabase/migrations/20261122171000_excluir_servico_e_agendamentos.sql).
3. [Validação de horários dos agendamentos](./supabase/migrations/20261122205100_validar_horario_agendamento.sql).

As duas funções de exclusão verificam a posse do negócio e removem os registros
vinculados em uma transação. A terceira migração impede no banco novos horários
passados, inclusive em chamadas que não passem pela interface; alterações que
mantêm o horário original de um registro antigo continuam permitidas.

A migração anterior de [duração decimal](./supabase/migrations/20261123000000_duracao_servico_decimal.sql)
não é necessária para o formulário atual. Se já aplicada, não é preciso revertê-la:
o formulário aceita somente minutos inteiros. Durações decimais já armazenadas
continuam no banco e precisam ser ajustadas para um inteiro ao editar o serviço.

As migrações não criam as tabelas, as políticas RLS ou os triggers de criação do
negócio. Confirme sua aplicação no ambiente Supabase utilizado.

## Tecnologias e organização

- React, Vite e React Router para a interface e navegação.
- Supabase Auth e banco de dados para autenticação e persistência.
- Tailwind CSS e estilos em `src/index.css`.
- `@js-temporal/polyfill` para cálculos de datas e fuso horário.

Os componentes ficam em `src/components`, as páginas em `src/pages`, as funções
compartilhadas em `src/lib`, as migrações em `supabase/migrations` e os testes
em `tests`.
