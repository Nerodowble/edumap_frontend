# EduMap — Redesign de UX/UI (Pivô para Prova Online)

> **Versão:** 1.0
> **Data:** 2026-05-26
> **Autor:** Design Sênior — Produtos Educacionais BR
> **Contexto:** Pivô do OCR para Prova Online com PIN ad-hoc
> **Status:** Especificação aprovada para implementação
> **Stack-alvo:** Next.js 14 (App Router) + Tailwind + componentes existentes
>   (Toast, Sidebar, AuthGuard, InfoBox, FlowBanner, BloomBadge, PctBadge)

---

## Sumário

- 1. Princípios norteadores
- 2. Jornada do professor
- 3. Jornada do aluno
- 4. Inventário de telas
- 5. Telas detalhadas (uma seção por tela)
- 6. Componentes novos a serem criados
- 7. Padrões transversais
- 8. Acessibilidade
- 9. Roadmap de implementação
- 10. Não-objetivos

---

## 1. Princípios norteadores

Esta seção define os 5 princípios que devem servir como filtro para qualquer
decisão de design tomada de agora em diante. Quando houver dúvida entre duas
opções, vence a que respeita o maior número de princípios — em ordem.

### 1.1 Mobile-first agressivo (aluno SEMPRE no celular)

**O quê:** Toda tela voltada para o aluno deve ser projetada primeiro para
viewport de 360px de largura (Android low-end) e só depois adaptada para
desktop. Para o professor, a regra inverte: desktop primeiro (porque ela cria
provas no notebook em casa), mas o monitor de aplicação precisa funcionar bem
no celular dela em sala.

**Por quê:** Lucas (persona 2) faz tudo no celular. Marília (persona 1) cria
prova de casa no notebook, mas em sala usa o celular para projetar o PIN e
acompanhar quem entrou. Não temos verba pra apostar em dois fluxos perfeitos —
priorizamos o aluno no celular acima de tudo.

**Regras concretas:**

- Toques mínimos de 44x44px em qualquer botão ou link interativo
- Inputs no celular devem disparar o teclado correto (numérico para R.A. e
  PIN, e-mail para login do professor)
- Modais ocupam tela cheia em mobile (não pop-up centrado)
- Tabelas viram listas verticais em viewports <768px
- Tipografia mínima de 16px no corpo (evita zoom automático do iOS Safari)
- Imagens otimizadas (WebP) e ilustrações em SVG inline para empty states

**Anti-padrão:** Layout em duas colunas no mobile. Nunca.

### 1.2 Baixa fricção do professor (criar prova ≤15min, distribuir em 1 PIN)

**O quê:** Reduzir o tempo entre "professor abre o app" e "alunos respondendo"
para menos de 15 minutos no primeiro uso e menos de 5 minutos nas reaplicações.

**Por quê:** Marília tem 47 anos, 32 turmas/ano e detesta menus complicados.
Se a primeira experiência custar mais de 15 minutos, ela vai voltar para o
PDF impresso. Se a segunda custar mais que o tempo de imprimir, idem.

**Decisões que esse princípio impõe:**

- Onboarding zero — login direto, sem tour obrigatório
- Wizard de criar prova em **3 passos visíveis**, com indicador de progresso
- Defaults inteligentes (peso da questão = 1, ordem alfabética em listas)
- Botão "salvar como rascunho" presente em todas as etapas
- Importar lista de alunos via colagem de texto (CSV/Excel não obrigatório)
- O PIN é o ÚNICO mecanismo de distribuição — nada de gerar links únicos por
  aluno, nada de e-mail, nada de QR pessoal

**Anti-padrão:** Tela de configurações avançadas exibida por padrão. Esconder
sob "+ opções avançadas" sempre.

### 1.3 Microcopy em pt-BR direta, sem jargão técnico

**O quê:** Todo texto da interface deve usar o vocabulário do dia-a-dia da
escola, não da TI. "Aplicar prova" e não "iniciar sessão". "Aluno enviou" e
não "submission received". "PIN da prova" e não "código de acesso ao token
temporário".

**Por quê:** A persona Cláudia (52, coordenadora) abandonou outras
plataformas porque "não entendia o que era pra clicar". Microcopy ruim é o
maior bug invisível em produto educacional brasileiro.

**Regras de tom:**

- Tratar usuário sempre por "você" (nunca "tu", nunca "vós", nunca infinitivos
  impessoais como "clicar aqui")
- Verbos no imperativo afirmativo nos botões principais ("Criar prova",
  "Publicar", "Entrar na prova")
- Mensagens de erro começam descrevendo o problema, depois a solução, sem
  culpar o usuário. Ex: "Esse R.A. não está na lista da turma. Confira com seu
  professor." — não "R.A. inválido"
- Tutoriais inline em InfoBox amarela com 1-2 frases máximo
- Datas em formato brasileiro: "23/05/2026 às 08:30" — nunca "2026-05-23T08:30"

**Anti-padrão:** "Erro 500: Internal Server Error" exposto ao aluno. Mostrar
"Algo deu errado do nosso lado. Tente de novo em 1 minuto."

### 1.4 Daltônico-friendly (cor + ícone + texto em status)

**O quê:** Nenhuma informação importante deve depender apenas de cor.
Toda vez que cor for usada para comunicar status, deve vir acompanhada de
ícone E de texto.

**Por quê:** 8% dos homens brasileiros são daltônicos (deuteranopia mais
comum). Em turma de 35 alunos, são 2-3 daltônicos. No corpo docente nacional,
algo entre 200 e 300 mil professores. Tela de relatório verde/vermelho sem
ícone os exclui completamente.

**Aplicação prática:**

- Bloom badges: cor + número + nome (ex: "2 Compreender" em badge verde com
  texto "Compreender" sempre presente)
- Status do aluno na aplicação: cor + ícone + label
  - Aguardando = cinza + 🕒 + "Aguardando"
  - Em andamento = azul + ▶ + "Respondendo"
  - Finalizado = verde + ✓ + "Enviou"
  - Bloqueado = vermelho + ⚠ + "Bloqueado"
- Gráficos de relatório: usar padronagem (linhas, pontos, hachuras) além de cor

**Anti-padrão:** "Resultado: ✅" verde sem palavra. "Erro: ❌" vermelho sem
palavra.

### 1.5 Suporte offline parcial (drafts no localStorage)

**O quê:** A conexão da ETEC oscila. O aluno não pode perder respostas se a
internet cair entre a questão 5 e a 6. O professor não pode perder a prova que
está digitando se o navegador travar.

**Por quê:** Wi-Fi da ETEC compartilhado entre 800 alunos. 4G na sala é
intermitente. Frustrar o aluno na hora da prova é o pior cenário possível —
quebra a confiança da escola na ferramenta.

**Decisões:**

- Auto-save em localStorage a cada mudança de resposta no fluxo do aluno
- Indicador visual discreto "Salvo às 09:13" no canto da tela do aluno
- Reentrada na prova restaura rascunho local (assumindo mesmo
  device-fingerprint)
- Professor digitando enunciado tem auto-save a cada 5 segundos em
  localStorage, com indicador "Rascunho salvo"
- Se o envio final falhar, ficar em retry exponencial silencioso (3 tentativas)
  e só então mostrar erro com "Tentar novamente"

**Anti-padrão:** "Conexão perdida. Suas respostas foram apagadas." — esse é
o cenário do **terror** que estamos blindando.

---

## 2. Jornada do professor

### 2.1 Mapa visual (texto)

```
┌───────────────┐    ┌────────────┐    ┌────────────┐    ┌──────────────┐    ┌────────────┐
│ Cadastrar     │ →  │ Criar      │ →  │ Publicar   │ →  │ Aplicar      │ →  │ Ver        │
│ turma+alunos  │    │ prova      │    │ + gerar PIN│    │ (monitorar)  │    │ relatórios │
└───────────────┘    └────────────┘    └────────────┘    └──────────────┘    └────────────┘
   uma vez por        ~15 min           ~30 segundos       ~tempo da prova      ~5 min
   semestre           1ª vez            por aplicação      (40-90 min)
```

### 2.2 Detalhamento por etapa

#### Etapa 1 — Cadastrar turma + alunos

- **Tempo estimado:** 10 min (1ª turma), 3 min (turmas seguintes via colar lista)
- **Atrito atual:** Não existe. Precisa ser construído do zero.
- **Melhoria proposta:**
  - Tela "Minhas turmas" como home alternativa
  - Botão "+ Nova turma" abre modal com: nome da turma (ex: "2º Logística B
    2026"), curso, módulo (opcionais), área (Logística/Adm/TI)
  - Após criar turma, abre direto a tela da turma com aba "Alunos" e CTA
    grande "Adicionar alunos"
  - Modal "Adicionar alunos" tem 3 abas: (a) **Um por um** — formulário simples;
    (b) **Colar lista** — textarea aceita "Nome, R.A." por linha;
    (c) **Importar planilha** — drag-and-drop CSV/XLSX (fase 2, não bloqueia)
  - Validação inline: R.A. duplicado, R.A. vazio
  - Confirmação: "12 alunos adicionados à turma '2º Logística B'"

#### Etapa 2 — Criar prova

- **Tempo estimado:** 15 min na 1ª prova, 5 min nas seguintes (copiar
  questão de outra prova)
- **Atrito atual:** Não existe — hoje a prova é PDF impresso.
- **Melhoria proposta:**
  - Wizard de 3 passos:
    1. **Identificação** — Título, disciplina, turma associada, data prevista
       (opcional)
    2. **Questões** — Adicionar uma por uma, escolher tipo (múltipla escolha
       agora; dissertativa fase 2), enunciado, alternativas, gabarito,
       taxonomia (BNCC + Bloom)
    3. **Revisão** — Pré-visualização do que o aluno vai ver, peso de cada
       questão, opção "publicar como rascunho" vs "publicar e gerar PIN agora"
  - Atalho "Salvar e continuar depois" presente em todos os passos
  - Atalho "Duplicar questão" para reaproveitar estrutura
  - Atalho (fase 2) "Gerar com IA" — placeholder visual já na fase 1, desabilitado

#### Etapa 3 — Publicar + gerar PIN

- **Tempo estimado:** 30 segundos
- **Atrito atual:** N/A
- **Melhoria proposta:**
  - Botão "Publicar" abre confirmação: "Esta prova ficará disponível para
    aplicação. Você pode aplicar quantas vezes quiser (uma por turma)."
  - Após publicada, na tela de detalhe da prova aparece CTA grande "Aplicar
    agora" — abre overlay com PIN de 6 dígitos, instrução para projetar e
    link curto `edumap.app/aluno`

#### Etapa 4 — Aplicar (monitorar)

- **Tempo estimado:** Tempo da prova (40-90 min)
- **Atrito atual:** N/A
- **Melhoria proposta:**
  - Tela "Monitor de aplicação" com:
    - PIN gigante no topo (clique para esconder/mostrar)
    - Contador "X de Y alunos entraram"
    - Lista da turma com status por aluno (aguardando, respondendo,
      finalizado, bloqueado)
    - Botão por aluno: "Liberar relogin" se status = bloqueado
    - Botão geral "Encerrar aplicação" (impede novos envios)
  - Auto-refresh a cada 10s (polling — WebSocket é fase 2)

#### Etapa 5 — Ver relatórios

- **Tempo estimado:** 5-15 min para ler com calma
- **Melhoria proposta:**
  - Dashboard da prova com 3 abas:
    1. **Visão geral** — média, mediana, taxa de acerto por questão
    2. **Por aluno** — lista com nota e tempo total
    3. **Por taxonomia** — agregação BNCC/Bloom (cores Bloom já existentes)

### 2.3 Anti-padrões a EVITAR

- **Não pedir login do professor em toda navegação interna** — AuthGuard
  envolve uma vez no layout
- **Não usar termos como "instância de avaliação", "sessão de prova",
  "submission"** — usar "aplicação", "prova aberta", "envio do aluno"
- **Não obrigar configuração de embaralhamento de alternativas no passo 1**
  — esconder em "+ opções avançadas"
- **Não obrigar peso da questão diferente de 1** — default = 1
- **Não exigir taxonomia Bloom** na 1ª prova — marcar como "opcional" e
  permitir preencher depois (relatório fica incompleto e a UI explica isso)
- **Não obrigar professor a marcar gabarito ANTES de digitar todas as
  questões** — permitir "marcar gabarito depois" no passo 2
- **Não fazer wizard linear sem voltar** — sempre voltar/avançar livre

---

## 3. Jornada do aluno

### 3.1 Mapa visual

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Receber PIN │   │ Abrir       │   │ Digitar     │   │ Responder   │   │ Finalizar   │
│ projetado   │ → │ /aluno no   │ → │ Nome + RA + │ → │ questão a   │ → │ + ver tela  │
│ pelo prof.  │   │ celular     │   │ PIN         │   │ questão     │   │ "enviado"   │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
   30 segundos     20 segundos       40 segundos        20-60 min          10 segundos
```

### 3.2 Tempo total ≤30 min para prova de 10 questões

- 1-2 min para entrar (tela inicial)
- 2-4 min por questão de múltipla escolha (média)
- 1 min para revisão e finalização
- Total: ~25 min em prova de 10 questões fáceis, ~50 min em prova de 10
  questões difíceis

### 3.3 Estados emocionais ao longo da prova

- **Curiosidade** (entrada) — "Será que esse troço funciona no meu celular?"
  → tela de boas-vindas precisa transmitir confiança e simplicidade
- **Foco** (questões 1 a metade) — atenção alta; UI precisa SUMIR e dar palco
  ao enunciado
- **Cansaço/ansiedade** (questões finais) — UI precisa mostrar progresso
  claro (faltam X questões) e oferecer atalho de revisão
- **Alívio** (envio) — tela final precisa devolver sensação de "concluído",
  não de "agora começa o próximo passo"

### 3.4 Salva-vidas

- **Rascunho automático**: cada mudança de alternativa grava em localStorage
  e via API (debounce 500ms)
- **"Ainda estou aqui?"**: após 5 min sem interação, modal sutil "Continua
  fazendo a prova? Toque aqui para continuar." (evita session lost por
  visibilidade da aba)
- **Confirmação de envio**: tela de revisão obrigatória antes do envio final,
  com aviso "Depois de enviar, você não consegue mais alterar."
- **Conexão caiu?**: badge discreta "Sem conexão — suas respostas estão
  salvas no celular. Vamos enviar quando voltar." (cor laranja + ícone +
  texto)

---

## 4. Inventário de telas

Lista completa antes de detalhar individualmente.

### 4.1 Telas do PROFESSOR

| # | Tela | Rota sugerida | Prioridade |
|---|------|---------------|------------|
| P1 | Login | `/login` | Alta |
| P2 | Dashboard / Home | `/` ou `/dashboard` | Alta |
| P3 | Lista de turmas | `/turmas` | Alta |
| P4 | Detalhe da turma (com aba de alunos) | `/turmas/[id]` | Alta |
| P5 | Adicionar alunos (modal) | overlay em P4 | Alta |
| P6 | Lista de provas | `/provas` | Alta |
| P7 | Criar prova — passo 1 (identificação) | `/provas/nova/identificacao` | Alta |
| P8 | Criar prova — passo 2 (questões) | `/provas/nova/questoes` | Alta |
| P9 | Criar prova — passo 3 (revisão e publicar) | `/provas/nova/revisao` | Alta |
| P10 | Detalhe da prova (publicada) | `/provas/[id]` | Alta |
| P11 | Aplicar prova — overlay com PIN | overlay em P10 | Crítica |
| P12 | Monitor de aplicação ao vivo | `/provas/[id]/aplicacao/[appId]` | Crítica |
| P13 | Relatórios da prova | `/provas/[id]/relatorios` | Alta |
| P14 | Relatório por aluno | `/provas/[id]/relatorios/aluno/[alunoId]` | Média |
| P15 | Configurações da conta | `/conta` | Baixa |

### 4.2 Telas do ALUNO

| # | Tela | Rota | Prioridade |
|---|------|------|------------|
| A1 | Login do aluno (Nome+RA+PIN) | `/aluno` | Crítica |
| A2 | Seleção de prova ativa | `/aluno/escolher` | Baixa |
| A3 | Tela de boas-vindas da prova | `/aluno/prova/[id]/comecar` | Alta |
| A4 | Responder questão | `/aluno/prova/[id]/q/[n]` | Crítica |
| A5 | Revisão antes do envio | `/aluno/prova/[id]/revisao` | Crítica |
| A6 | Prova enviada (confirmação) | `/aluno/prova/[id]/enviada` | Alta |
| A7 | Bloqueado (outro dispositivo) | `/aluno/bloqueado` | Alta |
| A8 | Erro / fora do ar | `/aluno/erro` | Média |

### 4.3 Telas de CONSULTA (fase 2)

| # | Tela | Rota | Fase |
|---|------|------|------|
| C1 | Histórico do aluno | `/aluno/historico` | 2 |
| C2 | Dashboard coordenação | `/coordenacao` | 3 |

**Total de telas detalhadas neste documento: 22** (15 professor + 7 aluno;
consulta entra em fase posterior).

---

## 5. Telas detalhadas

A partir daqui, uma seção por tela. Telas críticas têm mais detalhes
(wireframe + estados + microcopy completo). Telas secundárias são descritas
em forma mais compacta.

---

### 5.P1 — Login (Professor)

**Propósito:** Autenticar o professor (e-mail/senha) com mínima fricção.

**Layout:**

```
┌────────────────────────────────────────────────┐
│                                                │
│              📘 EduMap                          │
│         Diagnóstico que ensina                  │
│                                                │
│   ┌────────────────────────────────────────┐   │
│   │  Entrar como professor                 │   │
│   │                                        │   │
│   │  E-mail                                │   │
│   │  [_________________________________]   │   │
│   │                                        │   │
│   │  Senha                                 │   │
│   │  [_________________________________]   │   │
│   │                                        │   │
│   │  [   Entrar   ]                        │   │
│   │                                        │   │
│   │  Esqueci minha senha                   │   │
│   └────────────────────────────────────────┘   │
│                                                │
│   É aluno? Vá para /aluno                       │
└────────────────────────────────────────────────┘
```

**Componentes:** input texto, input senha, botão primário azul, link ghost
("Esqueci minha senha"), Toast (sucesso/erro).

**Estados:**
- **Carregando:** botão muda para "Entrando..." com spinner pequeno
- **Erro:** Toast vermelho "E-mail ou senha incorretos."
- **Sucesso:** redireciona para `/`

**Microcopy:**
- Header: "Entrar como professor"
- Botão: "Entrar"
- Link: "Esqueci minha senha"
- Erro 401: "E-mail ou senha incorretos."
- Erro de rede: "Não consegui conectar. Confira sua internet e tente de novo."
- Footer: "É aluno? Vá para [edumap.app/aluno]"

**Mobile vs desktop:** mobile usa card full-width, padding lateral 16px;
desktop usa card 420px centrado vertical e horizontalmente.

---

### 5.P2 — Dashboard / Home

**Propósito:** Mostrar de relance o que o professor precisa fazer hoje. Em
linguagem mais direta: "O que está aberto pra eu apertar?".

**Layout (desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Olá, Marília 👋                                    │
│            │                                                     │
│  Início    │  Hoje                                               │
│  Turmas    │  ┌─────────────────────────────────────────────┐   │
│  Provas    │  │ 🟢 1 aplicação em andamento                  │   │
│  Relatórios│  │ "Prova de Logística — 2º Log B"              │   │
│            │  │ 18/23 alunos enviaram • começou às 08:12     │   │
│  Conta     │  │              [ Abrir monitor → ]             │   │
│            │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│            │  Atalhos                                            │
│            │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│            │  │ + Nova prova │ │ + Nova turma │ │ Ver relatórios││
│            │  └──────────────┘ └──────────────┘ └──────────────┘│
│            │                                                     │
│            │  Provas recentes                                    │
│            │  • Prova de Logística (publicada) — abrir          │
│            │  • Diagnóstico inicial (rascunho) — editar         │
│            │  • Recuperação Adm (encerrada) — relatório         │
└─────────────────────────────────────────────────────────────────┘
```

**Layout (mobile):** Sidebar vira hamburger, atalhos viram coluna única,
cards de aplicação em andamento ocupam full-width.

**Componentes:** Sidebar (existente), Cards de atalho, FlowBanner para
"aplicação em andamento" (reusa existente), lista simples de provas
recentes.

**Estados:**
- **Vazio** (professor novo): cards substituídos por empty state
  "Você ainda não tem turmas. Comece criando uma." + ilustração + CTA
- **Carregando:** skeletons no lugar dos cards
- **Erro de fetch:** Toast "Não consegui carregar suas provas. Tente
  recarregar a página."

**Microcopy:**
- Saudação: "Olá, [Nome] 👋"
- Header de seção: "Hoje" / "Atalhos" / "Provas recentes"
- CTA empty state: "Criar minha primeira turma"
- Aplicação em andamento: "X/Y alunos enviaram • começou às HH:MM"

---

### 5.P3 — Lista de turmas

**Propósito:** Listar todas as turmas que o professor já criou, com acesso
rápido para criar nova ou abrir uma existente.

**Layout (desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Turmas                  [+ Nova turma]            │
│            │                                                     │
│            │  Filtros: [Todas v]  [Logística v]  [2026 v]        │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ 2º Logística B 2026                          │   │
│            │  │ 23 alunos • 3 provas aplicadas              │   │
│            │  │                          [Abrir turma →]    │   │
│            │  └─────────────────────────────────────────────┘   │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ 1º Adm A 2026                                │   │
│            │  │ 28 alunos • 1 prova aplicada                │   │
│            │  │                          [Abrir turma →]    │   │
│            │  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:** cards de turma, filtros dropdown (fase 2), botão primário
"+ Nova turma".

**Estados:**
- **Vazio:** EmptyState com ilustração + texto "Crie sua primeira turma para
  começar a aplicar provas." + CTA "+ Nova turma"
- **Carregando:** skeleton de 3 cards
- **Filtrado sem resultado:** "Nenhuma turma encontrada com esses filtros."

**Microcopy:**
- Título: "Turmas"
- CTA primário: "+ Nova turma"
- Card secundário: "X alunos • Y provas aplicadas"

**Eventos:**
- Clique em card → vai para `/turmas/[id]`
- Clique "+ Nova turma" → abre modal de criar turma (fluxo P3-modal)

---

### 5.P3-modal — Criar nova turma (modal)

**Propósito:** Permitir cadastrar uma turma em ≤30 segundos.

**Layout (mobile-first, modal full-screen):**

```
┌────────────────────────────────────────────────┐
│  [X]   Nova turma                              │
├────────────────────────────────────────────────┤
│                                                │
│   Nome da turma *                              │
│   [______________________________________]     │
│   ex.: 2º Logística B 2026                     │
│                                                │
│   Curso (opcional)                             │
│   [______________________________________]     │
│                                                │
│   Módulo / Ano (opcional)                      │
│   [______________________________________]     │
│                                                │
│   Área (opcional)                              │
│   ( ) Logística                                │
│   ( ) Administração                            │
│   ( ) TI                                       │
│   ( ) Outra                                    │
│                                                │
│   [ Cancelar ]              [ Criar turma ]    │
└────────────────────────────────────────────────┘
```

**Componentes:** input texto, radio buttons, botões primário/ghost.

**Microcopy:**
- Título: "Nova turma"
- Placeholder do nome: "ex.: 2º Logística B 2026"
- Botão primário: "Criar turma"
- Botão secundário: "Cancelar"
- Sucesso (Toast): "Turma '2º Logística B 2026' criada."

**Validação:**
- Nome obrigatório, mínimo 3 caracteres
- Mostrar erro inline "Dê um nome para a turma" se vazio ao submeter

---

### 5.P4 — Detalhe da turma (com aba de alunos)

**Propósito:** Visualizar uma turma, gerenciar alunos cadastrados, ver provas
aplicadas nela.

**Layout (desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  ← Turmas  /  2º Logística B 2026                  │
│            │                                                     │
│            │  2º Logística B 2026          [Editar] [⋯]          │
│            │  Logística • 23 alunos                              │
│            │                                                     │
│            │  [ Alunos ]  [ Provas ]  [ Configurações ]          │
│            │  ━━━━━━━━━                                          │
│            │                                                     │
│            │  Alunos cadastrados             [+ Adicionar alunos]│
│            │                                                     │
│            │  ┌────┬──────────────────────┬───────────┬───────┐  │
│            │  │  # │ Nome                  │ R.A.      │ Ações │  │
│            │  ├────┼──────────────────────┼───────────┼───────┤  │
│            │  │ 01 │ Ana Carolina Silva    │ 12345     │ ⋯     │  │
│            │  │ 02 │ Bruno Oliveira        │ 12346     │ ⋯     │  │
│            │  │ ...│ ...                   │ ...       │ ...   │  │
│            │  └────┴──────────────────────┴───────────┴───────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Layout (mobile):** tabs viram pílulas horizontais com scroll; tabela vira
lista de cards, cada um com nome e RA, ação `⋯` no canto direito.

**Componentes:** tabs, tabela responsiva, botão primário "Adicionar alunos",
menu de ações por aluno.

**Estados:**
- **Aba Alunos vazia:** "Nenhum aluno cadastrado. Adicione alunos para
  começar a aplicar provas." + CTA "+ Adicionar alunos"
- **Aba Provas vazia:** "Nenhuma prova aplicada nesta turma ainda."
- **Carregando:** skeleton de linhas

**Microcopy:**
- Header: "Alunos cadastrados" / "Provas aplicadas"
- Botão: "+ Adicionar alunos"
- Menu de ações por aluno: "Editar dados", "Remover da turma"

**Confirmação de remoção:** modal "Remover Ana Carolina Silva da turma?
Ela não terá mais acesso a provas desta turma." [Cancelar] [Remover].

---

### 5.P5 — Adicionar alunos (modal)

**Propósito:** Cadastrar 20-40 alunos em ≤5 minutos via colagem de lista.

**Layout (mobile-first, modal full-screen):**

```
┌────────────────────────────────────────────────┐
│  [X]   Adicionar alunos                        │
├────────────────────────────────────────────────┤
│                                                │
│   [ Um por um ]  [ Colar lista ]  [ Planilha ] │
│                  ━━━━━━━━━━━━━                 │
│                                                │
│   Cole aqui um aluno por linha no formato:     │
│   Nome Completo, R.A.                          │
│                                                │
│   ┌──────────────────────────────────────┐    │
│   │ Ana Carolina Silva, 12345             │    │
│   │ Bruno Oliveira, 12346                 │    │
│   │ Carla Mendes, 12347                   │    │
│   │ ...                                   │    │
│   └──────────────────────────────────────┘    │
│                                                │
│   ⚠️ 3 linhas com erro de formato (clique para │
│      ver)                                       │
│                                                │
│   Pré-visualização:                            │
│   • Ana Carolina Silva — RA 12345 ✓           │
│   • Bruno Oliveira — RA 12346 ✓               │
│   • Carla Mendes — RA 12347 ✓                 │
│                                                │
│   [ Cancelar ]   [ Adicionar 20 alunos ]       │
└────────────────────────────────────────────────┘
```

**Componentes:** tabs ("Um por um" / "Colar lista" / "Planilha"), textarea
grande, validador inline com feedback visual.

**Aba "Um por um":**

```
   Nome completo *
   [______________________________________]

   R.A. *
   [_________________]

   CPF (opcional)
   [_________________]

   Data de nascimento (opcional)
   [__/__/____]

   [+ Adicionar mais um] (não fecha modal, limpa form)
   [✓ Salvar e fechar]
```

**Aba "Planilha":** placeholder de drag-and-drop CSV/XLSX (fase 2 — UI
desabilitada com tooltip "Em breve").

**Estados:**
- **Sem texto colado:** botão primário desabilitado, texto "Cole pelo menos
  1 aluno"
- **Texto válido:** badge verde "X alunos prontos para adicionar"
- **Texto com erros:** badge laranja "X linhas com erro — clique para ver",
  expandindo lista de erros com linha + motivo
- **R.A. duplicado dentro da turma:** erro inline "R.A. 12345 já existe na
  turma (Ana Carolina Silva)"
- **Sucesso:** Toast "20 alunos adicionados à turma"

**Microcopy:**
- Título: "Adicionar alunos"
- Botão primário (texto dinâmico): "Adicionar X alunos"
- Erro: "Linha 5: faltando R.A."
- Erro duplicado: "R.A. 12345 já está cadastrado nesta turma."

---

### 5.P6 — Lista de provas

**Propósito:** Listar todas as provas do professor, separadas por status
(rascunho, publicada, encerrada).

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Provas                       [+ Nova prova]       │
│            │                                                     │
│            │  [ Todas ]  [ Rascunhos ]  [ Publicadas ]  [ Encerradas ]│
│            │  ━━━━━━━                                            │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ 📝 Prova de Logística — Capítulo 3           │   │
│            │  │ 2º Logística B • 10 questões                 │   │
│            │  │ ✅ Publicada • 1 aplicação encerrada         │   │
│            │  │           [ Aplicar de novo ] [ Ver detalhes]│   │
│            │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ ✏️ Diagnóstico inicial 2026                  │   │
│            │  │ 1º Adm A • 8 questões                        │   │
│            │  │ 🔸 Rascunho                                  │   │
│            │  │                       [ Continuar editando ] │   │
│            │  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:** tabs por status, cards de prova com badge de status.

**Status (com cor + ícone + texto — princípio 1.4):**
- 🔸 Rascunho (cinza)
- ✅ Publicada (azul)
- 🟢 Em aplicação (verde)
- ⚪ Encerrada (cinza neutro)

**Microcopy:**
- Tabs: "Todas", "Rascunhos", "Publicadas", "Encerradas"
- CTA primário do card: "Aplicar de novo" / "Continuar editando" / "Ver
  relatórios"

---

### 5.P7 — Criar prova — Passo 1 (Identificação) — **CRÍTICA**

**Propósito:** Capturar informações básicas da prova (título, turma alvo,
data prevista) com mínima fricção.

**Layout (desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  ← Provas  /  Nova prova                            │
│            │                                                     │
│            │  ●━━━━━━━○━━━━━━━○                                 │
│            │  Identificação  Questões  Revisão                   │
│            │                                                     │
│            │  Identificação                                      │
│            │                                                     │
│            │  Título da prova *                                  │
│            │  [_____________________________________________]    │
│            │  ex.: Prova de Logística — Capítulo 3              │
│            │                                                     │
│            │  Disciplina                                         │
│            │  [_____________________________________________]    │
│            │                                                     │
│            │  Turma *                                            │
│            │  [ Selecione uma turma          v ]                 │
│            │                                                     │
│            │  Data prevista (opcional)                           │
│            │  [__/__/____]   às  [__:__]                         │
│            │                                                     │
│            │  + Opções avançadas (clicar para expandir)          │
│            │                                                     │
│            │  [ Salvar e sair ]              [ Próximo: Questões → ]│
└─────────────────────────────────────────────────────────────────┘
```

**Opções avançadas (colapsadas por padrão):**
- Embaralhar ordem das questões? (sim/não, default não)
- Embaralhar ordem das alternativas? (sim/não, default não)
- Tempo máximo de prova (em minutos)? (default em branco = sem limite)
- Permitir voltar para questões anteriores? (default sim)

**Componentes:** indicador de progresso 3 passos, inputs, select,
date+time, accordion "+ Opções avançadas", botão ghost "Salvar e sair",
botão primário "Próximo".

**Estados:**
- **Auto-save:** badge discreta "Rascunho salvo às HH:MM"
- **Erro de validação:** mostrar inline em campo obrigatório vazio ao tentar
  avançar — "Dê um título para a prova"
- **Carregando:** botão "Próximo" vira "Salvando..."

**Microcopy:**
- Header da etapa: "Identificação"
- Indicador: passo "Identificação", "Questões", "Revisão"
- Botão primário: "Próximo: Questões →"
- Botão ghost: "Salvar e sair"
- Tooltip "+ Opções avançadas": "Configurações para casos específicos.
  Deixe como está se for sua primeira prova."

**Por que esse design:**
- Wizard de 3 passos (não acordeon-único na mesma tela) porque permite ao
  cérebro "fechar" um passo antes de abrir o próximo — reduz carga cognitiva
  de Marília no 1º uso
- "+ Opções avançadas" colapsada evita 6 campos pouco usados ofuscando os 3
  realmente obrigatórios

---

### 5.P8 — Criar prova — Passo 2 (Questões) — **CRÍTICA**

**Propósito:** Permitir adicionar/editar/reordenar/remover questões da prova,
com taxonomia opcional. É a tela mais complexa do app.

**Layout (desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  ← Voltar  /  Nova prova                            │
│            │                                                     │
│            │  ●━━━━━━━●━━━━━━━○                                 │
│            │  Identif.       Questões   Revisão                  │
│            │                                                     │
│            │  Questões (3)                  [+ Nova questão]     │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ ☰  Q1 · Múltipla escolha · Peso 1            │   │
│            │  │                                              │   │
│            │  │ Enunciado:                                   │   │
│            │  │ [Qual é a função principal do estoque...]    │   │
│            │  │                                              │   │
│            │  │ Alternativas:                                │   │
│            │  │ ( ) A) Armazenar produtos por tempo indef.  │   │
│            │  │ (●) B) Garantir disponibilidade de produtos │   │
│            │  │ ( ) C) Reduzir custos sempre                 │   │
│            │  │ ( ) D) Aumentar a venda                      │   │
│            │  │                                              │   │
│            │  │ Taxonomia (opcional)                         │   │
│            │  │ Bloom:  [ 2 Compreender v ]                  │   │
│            │  │ BNCC:   [ EM13LGG304    v ]                  │   │
│            │  │                                              │   │
│            │  │ Peso: [ 1 ]                                  │   │
│            │  │                                              │   │
│            │  │ [ Duplicar ]  [ Remover ]      [Salvar ✓]   │   │
│            │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ ☰  Q2 · Múltipla escolha · Peso 1   [editar]│   │
│            │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ ☰  Q3 · Múltipla escolha · Peso 1   [editar]│   │
│            │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│            │  [+ Nova questão]                                   │
│            │                                                     │
│            │  [ ← Anterior ]     [ Salvar rascunho ]   [Próximo →]│
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- Card de questão com modo "expandido" (editando) e "colapsado" (lista)
- Drag handle (☰) para reordenar
- Botão "+ Nova questão" sempre no fim da lista
- Select Bloom com opções 1-6 coloridas (reusa BloomBadge)
- Botões de ação no card: Duplicar, Remover, Salvar

**Estados:**
- **Lista vazia:** EmptyState "Sua prova ainda não tem questões. Adicione a
  primeira." + CTA grande "+ Adicionar primeira questão"
- **Validação:** se questão expandida e enunciado vazio, "Salvar" mostra
  erro inline "Digite o enunciado da questão"
- **Sem alternativa marcada como gabarito:** badge laranja "Gabarito não
  marcado" no header do card (não bloqueia, mas alerta)
- **Auto-save:** badge "Rascunho salvo às HH:MM"
- **Confirmação de remoção:** modal "Remover Q2? Esta ação não pode ser
  desfeita." [Cancelar] [Remover]
- **Drag em curso:** card translúcido, espaço-fantasma onde ele vai cair

**Microcopy:**
- Header: "Questões (X)"
- Botão: "+ Nova questão"
- Botão dentro do card: "Duplicar", "Remover", "Salvar"
- Aviso gabarito ausente: "Marque a alternativa correta para que a prova
  possa ser corrigida automaticamente."
- Aviso taxonomia ausente: "Sem taxonomia, esta questão não vai aparecer no
  relatório por Bloom/BNCC. Você pode preencher depois."
- Botão primário rodapé: "Próximo: Revisão →"

**Comportamento mobile:** card colapsado em estado padrão; expansão ocupa
full-width; drag handle ainda visível (long-press para arrastar).

**Por que esse design:**
- Cards expansíveis (em vez de lista de links que abrem nova tela) mantêm a
  Marília no "modo flow" sem perder contexto da prova inteira
- Taxonomia opcional e abaixo da linha d'água do card evita travar a
  professora no 1º uso quando ela ainda não conhece BNCC/Bloom
- Drag-and-drop para reordenar é convenção universal já conhecida

---

### 5.P9 — Criar prova — Passo 3 (Revisão + Publicar) — **CRÍTICA**

**Propósito:** Permitir conferência final e publicar a prova com clareza sobre
o que acontece em seguida.

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  ← Voltar  /  Nova prova                            │
│            │                                                     │
│            │  ●━━━━━━━●━━━━━━━●                                 │
│            │  Identif.       Questões      Revisão               │
│            │                                                     │
│            │  Revisão e publicação                               │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ Resumo                                       │   │
│            │  │ Título: Prova de Logística — Capítulo 3      │   │
│            │  │ Turma:  2º Logística B 2026                  │   │
│            │  │ Questões: 10                                 │   │
│            │  │ Peso total: 10 pontos                        │   │
│            │  │ Taxonomia preenchida: 7/10 questões          │   │
│            │  │   ⚠ 3 questões sem Bloom/BNCC                │   │
│            │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ Pré-visualização (como o aluno vai ver)      │   │
│            │  │                                              │   │
│            │  │  📱 [Frame de celular com Q1 renderizada]   │   │
│            │  │                                              │   │
│            │  │  [Q1] [Q2] [Q3] ... [Q10]                   │   │
│            │  │  ← navegar pelas questões                    │   │
│            │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ O que acontece ao publicar?                  │   │
│            │  │ • A prova passa para o status "Publicada"    │   │
│            │  │ • Você poderá aplicar gerando um PIN         │   │
│            │  │ • Os alunos da turma "2º Logística B" vão    │   │
│            │  │   poder responder ao informar Nome+RA+PIN    │   │
│            │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│            │  [ ← Anterior ]                                     │
│            │  [ Salvar como rascunho ]   [ Publicar prova ]      │
└─────────────────────────────────────────────────────────────────┘
```

**Pré-visualização do aluno:** frame visual de celular mostrando a Q1
renderizada como o aluno verá; navegação ←/→ entre todas as questões.

**Componentes:** card-resumo, frame de pré-visualização, InfoBox explicando
o efeito de publicar, botões primário/secundário/ghost.

**Estados:**
- **Validação OK:** botão "Publicar prova" habilitado
- **Bloqueio:** se 0 questões → botão desabilitado, tooltip "Adicione pelo
  menos 1 questão para publicar"
- **Aviso não-bloqueante:** ⚠ 3 questões sem gabarito → "Você pode publicar,
  mas essas questões não serão corrigidas automaticamente."
- **Confirmação de publicação:** modal "Publicar 'Prova de Logística'? Você
  poderá aplicar logo em seguida com um PIN." [Cancelar] [Publicar]
- **Sucesso:** redireciona para P10 com Toast verde "Prova publicada. Pronta
  para aplicar."

**Microcopy:**
- Header: "Revisão e publicação"
- Botão primário: "Publicar prova"
- Botão secundário: "Salvar como rascunho"
- Confirmação: "Publicar 'Prova de Logística — Capítulo 3'?"

---

### 5.P10 — Detalhe da prova (publicada)

**Propósito:** Visualizar a prova publicada, suas aplicações anteriores e
iniciar nova aplicação.

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  ← Provas  /  Prova de Logística — Capítulo 3      │
│            │                                                     │
│            │  Prova de Logística — Capítulo 3   [Editar][⋯]      │
│            │  ✅ Publicada • Turma 2º Log B • 10 questões         │
│            │                                                     │
│            │  [   Aplicar agora   ]  ← grande, azul, full-width   │
│            │                                                     │
│            │  Aplicações anteriores                              │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ 23/05/2026 às 08:12 • 23/23 alunos enviaram  │   │
│            │  │ Encerrada                  [ Ver relatórios ]│   │
│            │  └─────────────────────────────────────────────┘   │
│            │                                                     │
│            │  Pré-visualização das questões                      │
│            │  [Q1] [Q2] [Q3] [Q4] [Q5] [Q6] [Q7] [Q8] [Q9] [Q10] │
└─────────────────────────────────────────────────────────────────┘
```

**Menu [⋯]:**
- Duplicar prova
- Despublicar (volta para rascunho — só se não houver aplicações ativas)
- Excluir (confirmação reforçada)

**Estados:**
- **Sem aplicações ainda:** "Esta prova nunca foi aplicada. Clique em
  'Aplicar agora' para gerar um PIN."
- **Aplicação em andamento:** card destacado verde no topo "🟢 Aplicação em
  andamento — abrir monitor"

---

### 5.P11 — Aplicar prova (overlay com PIN) — **CRÍTICA**

**Propósito:** Gerar o PIN ad-hoc, mostrar instruções claras para
projetar/dizer aos alunos, e levar o professor ao monitor de aplicação.

**Layout (overlay full-screen):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [X]                                                              │
│                                                                  │
│         Aplicar: Prova de Logística — Capítulo 3                 │
│         Turma: 2º Logística B 2026                               │
│                                                                  │
│   ┌──────────────────────────────────────────────────────┐      │
│   │                                                       │      │
│   │   PIN da prova                                        │      │
│   │                                                       │      │
│   │         ┌─────────────────────────┐                   │      │
│   │         │     4 8 3 9 2 7         │  [📋 Copiar]      │      │
│   │         └─────────────────────────┘                   │      │
│   │                                                       │      │
│   │   Como projetar para a turma:                         │      │
│   │   1. Abra esta tela no projetor                       │      │
│   │   2. Os alunos abrem edumap.app/aluno no celular     │      │
│   │   3. Eles digitam Nome + R.A. + este PIN              │      │
│   │                                                       │      │
│   │   [ 🔳 Mostrar QR code ]                              │      │
│   │   (clique para mostrar QR para o /aluno)              │      │
│   │                                                       │      │
│   │   ⚠️ Validade do PIN: até você encerrar a aplicação    │      │
│   │   ou até 6 horas após a geração.                       │      │
│   │                                                       │      │
│   │   [ Cancelar aplicação ]     [ Abrir monitor → ]      │      │
│   └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

**Modo "Apresentar":** clicar no PIN amplia para tela cheia preta com PIN
gigante branco — modo projetor. ESC sai.

**Modo "QR code":** o QR aponta para `/aluno?pin=483927` (pré-preenche o PIN
no formulário do aluno, ele ainda precisa digitar Nome+RA).

**Componentes:**
- `PinDisplay` (novo) — bloco grande com dígitos espaçados, botão copiar, ícone
- `QRCodeModal` (novo, fase 2 ok como placeholder funcional)
- Botões primário/ghost

**Estados:**
- **PIN gerado:** estado padrão, mostrado acima
- **Copiado:** Toast verde "PIN copiado"
- **Erro ao gerar PIN:** modal "Não consegui gerar o PIN. Tente novamente."
  [Tentar de novo]
- **PIN expirado:** se professor voltar depois de 6h, "Este PIN expirou.
  Gere um novo." [Gerar novo PIN]

**Microcopy:**
- Header: "Aplicar: [Nome da prova]"
- Label: "PIN da prova"
- Instrução: "Como projetar para a turma:" + 3 passos numerados
- Botão primário: "Abrir monitor →"
- Botão secundário: "Cancelar aplicação"
- Tooltip do copiar: "Copiar PIN para área de transferência"

**Por que esse design:**
- PIN gigante no centro permite usar a própria tela como projeção
- 3 passos numerados resolvem a dúvida principal de Marília no 1º uso ("o
  que eu falo pros alunos?")
- QR code é "cherry on top" — não obrigatório, mas tira metade da digitação
  do aluno se a escola tiver projetor

---

### 5.P12 — Monitor de aplicação ao vivo — **CRÍTICA**

**Propósito:** Mostrar em tempo real (polling 10s) quem entrou, quem está
respondendo, quem terminou e quem está bloqueado.

**Layout (desktop):**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Monitor de aplicação                               │
│            │  Prova de Logística — Capítulo 3 • 2º Log B          │
│            │                                                     │
│            │  ┌───────────────────────────────────────┐          │
│            │  │ PIN: 483927 [👁 esconder] [📋 copiar]│          │
│            │  └───────────────────────────────────────┘          │
│            │                                                     │
│            │  Progresso geral                                    │
│            │  ████████████░░░░░░░░░  18 / 23 alunos enviaram     │
│            │  Iniciada às 08:12 • há 47 min                      │
│            │                                                     │
│            │  Alunos                                             │
│            │  Filtros: [Todos v]  [Buscar nome/RA...]            │
│            │                                                     │
│            │  ┌──────────────────────┬────────────┬─────────────┐│
│            │  │ Nome                  │ Status     │ Tempo       ││
│            │  ├──────────────────────┼────────────┼─────────────┤│
│            │  │ Ana Carolina Silva    │ ✓ Enviou   │ 38 min      ││
│            │  │ Bruno Oliveira        │ ▶ Respond. │ 22 min      ││
│            │  │   Q5 de 10                                       ││
│            │  │ Carla Mendes          │ ⚠ Bloqueada│ —           ││
│            │  │   [ Liberar relogin ]                            ││
│            │  │ Diego Santos          │ 🕒 Aguard. │ —           ││
│            │  │ ...                                              ││
│            │  └──────────────────────┴────────────┴─────────────┘│
│            │                                                     │
│            │  [ Encerrar aplicação ]                              │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:**
- `PinDisplay` reduzido (pode esconder)
- Barra de progresso geral (ProgressBarTopBar variante horizontal grande)
- `LiveMonitorTable` (novo) — tabela com auto-refresh
- Botão por aluno bloqueado "Liberar relogin"
- Botão destrutivo "Encerrar aplicação"

**Status possíveis (cor + ícone + texto):**
- 🕒 cinza — "Aguardando" (ainda não entrou)
- ▶ azul — "Respondendo" (com subtexto "Q5 de 10")
- ✓ verde — "Enviou" (com tempo total)
- ⚠ vermelho — "Bloqueada" (com botão "Liberar relogin")
- ⏸ amarelo — "Inativa há X min" (entrou mas parou de responder)

**Estados:**
- **Aplicação recém-iniciada (0 entraram):** "Aguardando alunos entrarem...
  Compartilhe o PIN com a turma."
- **Todos enviaram:** banner verde no topo "Todos os 23 alunos enviaram a
  prova! 🎉" + CTA "Encerrar e ver relatórios"
- **Conexão perdida:** banner laranja "Não consegui atualizar há X min.
  Vamos tentar de novo." (retry automático)
- **Aplicação encerrada:** badge cinza no topo "Aplicação encerrada às
  HH:MM" + CTA "Ver relatórios"

**Microcopy:**
- Botão por aluno: "Liberar relogin"
- Confirmação relogin: "Liberar relogin para Carla Mendes? Ela poderá entrar
  em outro celular." [Cancelar] [Liberar]
- Confirmação encerrar: "Encerrar aplicação? Os alunos que ainda não enviaram
  não poderão mais responder." [Cancelar] [Encerrar mesmo assim]

**Eventos:**
- Polling a cada 10s
- Clique em aluno → drawer lateral com detalhes (questões respondidas, tempo
  por questão, fingerprint do device)
- Clique "Liberar relogin" → confirma → libera bloqueio
- Clique "Encerrar aplicação" → confirma → redireciona para relatórios

**Por que esse design:**
- A tabela de status é a tela mais consultada durante a aplicação. Ela
  precisa caber numa olhada do canto da sala de aula (Marília vai dar uma
  espiada a cada 5 minutos)
- "Liberar relogin" precisa ser 1 clique + 1 confirmação — não mais
- Encerrar é destrutivo, mas escondê-lo seria pior. Vai ficar visível mas
  com confirmação clara

---

### 5.P13 — Relatórios da prova

**Propósito:** Mostrar os resultados consolidados de uma aplicação.

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  ← Prova / Relatórios                               │
│            │                                                     │
│            │  Prova de Logística — Capítulo 3                    │
│            │  Aplicada em 23/05/2026 • 23 alunos                 │
│            │                                                     │
│            │  [ Visão geral ] [ Por aluno ] [ Por taxonomia ]    │
│            │  ━━━━━━━━━━━━━                                      │
│            │                                                     │
│            │  Média da turma: 7.2  • Mediana: 7.5                │
│            │  Maior nota: 9.0  •  Menor nota: 4.5                │
│            │                                                     │
│            │  Taxa de acerto por questão                         │
│            │  Q1  ████████████████░░  82%                        │
│            │  Q2  █████████░░░░░░░░  45%   ← questão crítica     │
│            │  Q3  ███████████████░░░  76%                        │
│            │  ...                                                │
│            │                                                     │
│            │  Distribuição de notas                              │
│            │  [Gráfico de barras horizontal com faixas 0-2,      │
│            │   2-4, 4-6, 6-8, 8-10]                              │
│            │                                                     │
│            │  [ 📥 Exportar PDF ]  [ 📊 Exportar CSV ]            │
└─────────────────────────────────────────────────────────────────┘
```

**Aba "Por aluno":** tabela com Nome, RA, nota, tempo total, link "Ver detalhes".

**Aba "Por taxonomia":**
- Bloom: barras coloridas por nível (reusa cores Bloom)
- BNCC: lista de competências com % de acerto
- Cada barra/linha em padronagem além de cor (princípio 1.4)

**Componentes:** tabs, gráficos de barra horizontal, PctBadge (existente),
BloomBadge (existente), botões de exportação.

**Estados:**
- **Carregando:** skeletons de gráfico
- **Sem dados (0 envios):** "Nenhum aluno enviou ainda. Aguarde a aplicação."
- **Erro de fetch:** "Não consegui carregar os relatórios. Tente recarregar."

**Microcopy:**
- Header: "Relatórios"
- Aba: "Visão geral" / "Por aluno" / "Por taxonomia"
- Alerta de questão crítica: "Questão crítica — menos de 50% acertaram"

---

### 5.P14 — Relatório por aluno

**Propósito:** Ver desempenho individual com detalhes de cada questão.

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  ← Relatórios / Ana Carolina Silva                  │
│            │                                                     │
│            │  Ana Carolina Silva                                 │
│            │  RA 12345 • 2º Log B                                │
│            │                                                     │
│            │  Nota final: 7.5 / 10                               │
│            │  Tempo total: 38 min                                │
│            │                                                     │
│            │  Desempenho por questão                             │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ Q1 · Compreender (2) · BNCC EM13...         │   │
│            │  │ Respondeu: B  • Gabarito: B  • ✓ Acertou    │   │
│            │  │ Tempo: 2 min 14 s                            │   │
│            │  └─────────────────────────────────────────────┘   │
│            │  ┌─────────────────────────────────────────────┐   │
│            │  │ Q2 · Aplicar (3) · BNCC EM13...             │   │
│            │  │ Respondeu: A  • Gabarito: C  • ✗ Errou      │   │
│            │  │ Tempo: 4 min 02 s                            │   │
│            │  └─────────────────────────────────────────────┘   │
│            │  ...                                                │
│            │                                                     │
│            │  Desempenho por Bloom                               │
│            │  [Gráfico simples por nível]                        │
└─────────────────────────────────────────────────────────────────┘
```

**Componentes:** cards de questão com badge de acerto/erro (cor + ícone +
texto), BloomBadge, gráfico simples.

**Microcopy:**
- "Respondeu: X • Gabarito: Y • ✓ Acertou" ou "✗ Errou"
- Tempo: formato "X min Y s"

---

### 5.P15 — Configurações da conta

**Propósito:** Editar nome, e-mail, senha. Mínimo viável.

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Conta                                              │
│            │                                                     │
│            │  Dados                                              │
│            │  Nome [_____________________]                       │
│            │  E-mail [___________________]                       │
│            │  [ Salvar alterações ]                              │
│            │                                                     │
│            │  Senha                                              │
│            │  Senha atual [__________]                           │
│            │  Nova senha  [__________]                           │
│            │  [ Trocar senha ]                                   │
│            │                                                     │
│            │  Sair                                               │
│            │  [ Sair desta conta ]                               │
└─────────────────────────────────────────────────────────────────┘
```

**Microcopy básico, sem floreios. Toast verde "Dados salvos" / "Senha alterada".**

---

### 5.A1 — `/aluno` — Login do aluno (Nome+RA+PIN) — **CRÍTICA**

**Propósito:** Ser a tela mais simples e tranquilizadora possível para Lucas
entrar na prova em 30 segundos.

**Layout mobile:**

```
┌─────────────────────────────────────────────┐
│   📘 EduMap                                  │
├─────────────────────────────────────────────┤
│                                             │
│         Olá! Vamos começar sua prova        │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ Nome completo                       │   │
│   │ [______________________________]    │   │
│   │                                     │   │
│   │ R.A. (registro acadêmico)           │   │
│   │ [_________________]                 │   │
│   │                                     │   │
│   │ PIN da prova (mostrado pelo prof.)  │   │
│   │ [ _ _ _ _ _ _ ]  (6 dígitos)         │   │
│   │                                     │   │
│   │       [   Entrar na prova   ]       │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ⚠️ Tem problemas? Avise seu professor.    │
└─────────────────────────────────────────────┘
```

**Layout desktop:** mesma estrutura, card 420px centrado.

**Componentes:**
- `StudentLoginCard` (novo) — engloba os 3 inputs com validação visual em
  tempo real
- Input PIN: 6 caixinhas separadas, foco auto-avança ao digitar (padrão de
  OTP, conhecido por todos via apps de banco)
- Botão primário full-width

**Estados:**
- **Vazio (estado inicial):** botão desabilitado
- **Preenchimento parcial:** botão segue desabilitado, sem erros
- **Tudo preenchido:** botão habilitado azul
- **Submetendo:** botão "Entrando..." + spinner
- **Erro: aluno não existe naquela turma:** "Esse Nome ou R.A. não está na
  lista da turma. Confira com seu professor."
- **Erro: PIN inválido:** "PIN errado. Confira no projetor ou peça pro
  professor de novo."
- **Erro: bloqueado por outro dispositivo:** redireciona para A7
- **Erro: já enviou:** "Você já enviou essa prova. Peça pro seu professor
  liberar nova tentativa se precisar." (não permite re-entrada)
- **Sucesso:** redireciona para A3

**Microcopy:**
- Saudação: "Olá! Vamos começar sua prova"
- Label Nome: "Nome completo"
- Label RA: "R.A. (registro acadêmico)"
- Label PIN: "PIN da prova (mostrado pelo prof.)"
- Helper PIN: "(6 dígitos)"
- Botão: "Entrar na prova"
- Footer: "⚠️ Tem problemas? Avise seu professor."

**Comportamento mobile:**
- Input Nome: teclado padrão, autocapitalize=words
- Input RA: inputmode=numeric (teclado numérico)
- Input PIN: inputmode=numeric, 6 caixas com auto-foco
- Submit em "Enter" do teclado virtual avança o foco se vazio, submete se
  preenchido

**Por que esse design:**
- Tela limpa, sem header pesado nem menu — minimiza distração
- 3 inputs porque MENOS reduz risco de erro do Lucas
- PIN em 6 caixinhas separadas é convenção de banco/OTP e dá feedback
  visual imediato sobre quantos dígitos faltam
- Microcopy "mostrado pelo prof." mata a dúvida principal ("onde acho esse
  PIN?")
- Mensagens de erro nunca culpam o aluno — "Confira com seu professor" passa
  o problema pra autoridade da sala

**Variações A/B (sugestão para teste):**
- Botão "Entrar na prova" vs "Começar prova"
- Saudação "Olá! Vamos começar sua prova" vs "Bem-vindo! Faça login para
  responder"
- Recomendação inicial: usar a versão direta e amigável ("Olá! Vamos
  começar sua prova" + "Entrar na prova")

---

### 5.A2 — Seleção de prova ativa

**Propósito:** Caso (raro) em que o PIN digitado corresponde a mais de uma
prova ativa — mostrar lista para o aluno escolher. Em prática, isso quase
nunca acontece porque o PIN é único por aplicação, mas tela é necessária
para o caso de degradação.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  📘 EduMap                                   │
├─────────────────────────────────────────────┤
│                                             │
│   Encontrei mais de uma prova ativa.        │
│   Qual você quer responder?                 │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ Prova de Logística — Cap. 3          │   │
│   │ 2º Logística B • Profa. Marília     │   │
│   │                       [ Escolher → ] │   │
│   └─────────────────────────────────────┘   │
│   ┌─────────────────────────────────────┐   │
│   │ Diagnóstico inicial 2026             │   │
│   │ 2º Logística B • Profa. Marília     │   │
│   │                       [ Escolher → ] │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Estados:** raramente acionada. Default invisível ao aluno.

---

### 5.A3 — Tela de boas-vindas da prova

**Propósito:** Confirmar pro aluno que ele entrou na prova certa e explicar
as regras antes de começar o timer.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  📘 EduMap                                   │
├─────────────────────────────────────────────┤
│                                             │
│   Olá, Lucas! 👋                             │
│                                             │
│   Você vai responder:                       │
│   ┌─────────────────────────────────────┐   │
│   │ Prova de Logística — Capítulo 3      │   │
│   │ Profa. Marília • 2º Logística B     │   │
│   │ 10 questões                          │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   Como funciona:                            │
│   • Responda uma questão por vez            │
│   • Suas respostas ficam salvas no celular  │
│   • Você pode voltar para revisar           │
│   • Depois de enviar, não dá pra alterar    │
│                                             │
│         [   Começar prova   ]                │
│                                             │
│   Não sou eu →   (botão pequeno ghost)      │
└─────────────────────────────────────────────┘
```

**Componentes:** cards informativos, botão primário grande, link ghost
"Não sou eu" (volta para A1 limpando o storage).

**Estados:**
- **Padrão:** mostrado acima
- **Recuperando rascunho local:** banner azul "Você já tinha começado essa
  prova. Vamos continuar de onde parou?" [Continuar] [Recomeçar do zero]

**Microcopy:**
- Saudação: "Olá, [primeiro nome]! 👋"
- Lista de regras (4 bullets curtas)
- Botão primário: "Começar prova"
- Link ghost: "Não sou eu"
- Aviso retomar: "Você já tinha começado essa prova. Vamos continuar de
  onde parou?"

---

### 5.A4 — Responder questão — **CRÍTICA**

**Propósito:** Apresentar uma questão por vez de forma confortável para o
celular, com navegação, timer e auto-save invisíveis.

**Layout mobile:**

```
┌─────────────────────────────────────────────┐
│ Q3 de 10              ⏱ 02:14 nesta questão │
│ ▓▓▓░░░░░░░  30%                              │
├─────────────────────────────────────────────┤
│                                             │
│ Questão 3                                   │
│                                             │
│ Qual é a função principal do estoque        │
│ regulador em uma cadeia de suprimentos?     │
│                                             │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ( )  A) Armazenar produtos por tempo    │ │
│ │       indeterminado.                     │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ (●)  B) Garantir disponibilidade de     │ │
│ │       produtos quando há variação.       │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ( )  C) Reduzir custos sempre.          │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ( )  D) Aumentar a venda.               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ✓ Salvo às 09:13                            │
├─────────────────────────────────────────────┤
│  [ ← Anterior ]  [ Próxima →  ]              │
│  [ Ir para revisão ]                         │
└─────────────────────────────────────────────┘
```

**Componentes:**
- `ProgressBarTopBar` (novo) — barra fixa no topo com contador "Q3 de 10",
  timer interno da questão e barra de progresso geral
- `QuestionCard` (novo) — enunciado + alternativas em cards toques grandes
- Auto-save indicator discreto ("✓ Salvo às HH:MM")
- Botões fixos no rodapé: ← Anterior / Próxima → / Ir para revisão

**Bloom badge oculto pro aluno:** Importante — Lucas NÃO vê BloomBadge nem
BNCC. Isso é diagnóstico interno do professor.

**Estados:**
- **Sem alternativa marcada:** botão "Próxima" funciona mesmo assim (não
  bloqueia para evitar travar Lucas em questão que ele quer pular)
- **Alternativa marcada:** alternativa selecionada destacada azul + ícone
  ✓ pequeno
- **Salvando:** badge "Salvando..." cinza
- **Salvo:** "✓ Salvo às HH:MM" verde discreto
- **Salvo offline:** "📵 Sem conexão — salvo no celular" laranja
- **Última questão:** botão "Próxima →" vira "Ir para revisão →"
- **"Ainda estou aqui?" (5 min sem interação):** modal sutil "Continua aí?
  Toque para continuar." [Sim, continuar]
- **Aviso 10 min restantes (se houver limite de tempo):** banner laranja no
  topo "Faltam 10 minutos para acabar o tempo da prova."

**Microcopy:**
- Header: "Q3 de 10"
- Timer: "⏱ MM:SS nesta questão"
- Botões: "← Anterior", "Próxima →", "Ir para revisão"
- Salvo: "✓ Salvo às HH:MM"
- Sem conexão: "📵 Sem conexão — salvo no celular"
- Modal idle: "Continua aí? Toque para continuar."

**Comportamento mobile:**
- Toques nas alternativas funcionam no card inteiro (não só no radio)
- Swipe horizontal NÃO troca de questão (evita acidente) — só botões trocam
- Botões fixos no rodapé sempre visíveis (mesmo com teclado aberto, eles
  flutuam acima)

**Por que esse design:**
- Uma questão por tela elimina dispersão e reduz scroll
- Timer por questão é útil pro relatório mas precisa ser discreto pra não
  estressar Lucas (mostrado em texto pequeno, não como contagem regressiva
  ameaçadora)
- Auto-save sempre visível constrói confiança ("não vou perder se cair a
  internet")
- Botões grandes no rodapé garantem que Lucas com mão grande consiga
  apertar sem mira fina

**Variações A/B sugeridas:**
- Mostrar ou não o timer por questão visível para o aluno (A: mostra;
  B: esconde)
- "Próxima →" vs "Próxima questão →" (recomendação: versão curta)

---

### 5.A5 — Revisão antes do envio — **CRÍTICA**

**Propósito:** Última chance de Lucas conferir se respondeu tudo e mudar
de ideia antes do envio irreversível.

**Layout:**

```
┌─────────────────────────────────────────────┐
│ Revisão              ⏱ Tempo total: 28:42   │
├─────────────────────────────────────────────┤
│                                             │
│   Confira suas respostas antes de enviar    │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ Q1  ✓ Respondida (B)    [Voltar →]  │   │
│   │ Q2  ✓ Respondida (A)    [Voltar →]  │   │
│   │ Q3  ✓ Respondida (B)    [Voltar →]  │   │
│   │ Q4  ⚠ Em branco          [Voltar →]  │   │
│   │ Q5  ✓ Respondida (D)    [Voltar →]  │   │
│   │ ...                                  │   │
│   │ Q10 ⚠ Em branco          [Voltar →]  │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ⚠️ Você deixou 2 questões em branco.       │
│   Quer voltar para responder? Você ainda     │
│   pode mudar até apertar "Enviar".          │
│                                             │
│   [ ← Voltar para a prova ]                  │
│   [ Enviar minhas respostas ]                │
└─────────────────────────────────────────────┘
```

**Componentes:** lista resumo de respostas, botão primário grande no rodapé,
ícones de status por questão (✓ respondida / ⚠ em branco — cor + ícone + texto).

**Estados:**
- **Tudo respondido:** badge verde no topo "Tudo respondido! ✓"
- **Faltam respostas:** banner amarelo + lista com itens em branco destacados
- **Enviando:** botão "Enviando..." spinner + bloqueio do toque
- **Erro de envio:** modal "Não consegui enviar suas respostas. Vamos tentar
  de novo." [Tentar de novo] (com retry automático em 3s primeiro)
- **Envio offline:** "Sem conexão. Suas respostas estão salvas no celular —
  vamos enviar assim que a internet voltar." (background sync)

**Microcopy:**
- Header: "Confira suas respostas antes de enviar"
- Cada linha: "QX  ✓ Respondida (B)" ou "QX  ⚠ Em branco"
- Aviso branco: "⚠️ Você deixou X questões em branco."
- Botão primário: "Enviar minhas respostas"
- Botão secundário: "← Voltar para a prova"

**Confirmação final (modal):**
```
┌─────────────────────────────────────────┐
│   Enviar prova?                          │
│                                         │
│   Depois de enviar, você NÃO consegue    │
│   mais alterar suas respostas.           │
│                                         │
│   [ Cancelar ]  [ Sim, enviar ]          │
└─────────────────────────────────────────┘
```

**Por que esse design:**
- Lista resumo permite ver tudo num scroll só sem precisar voltar pra cada
  questão
- "Em branco" destaca o que falta sem ser punitivo
- Modal de confirmação obrigatório porque o envio é irreversível —
  irreversibilidade clara protege Lucas e o produto

**Variação A/B do CTA:**
- "Enviar minhas respostas" (recomendado: explícito, pessoal, indica
  irreversibilidade)
- "Finalizar prova" (alternativo)
- Recomendação: usar "Enviar minhas respostas" para deixar claro que é uma
  ação dele, não um simples "next"

---

### 5.A6 — Prova enviada (confirmação)

**Propósito:** Encerrar a experiência do aluno com sensação de alívio e
clareza sobre o que esperar.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  📘 EduMap                                   │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│                  ✓                           │
│                                             │
│         Prova enviada!                       │
│                                             │
│   Boa, Lucas! Suas respostas foram          │
│   enviadas para a Profa. Marília.            │
│                                             │
│   • Você respondeu 10 de 10 questões        │
│   • Tempo total: 28 min                     │
│   • Enviada às 09:42                        │
│                                             │
│   A correção vai aparecer aqui assim que    │
│   sua professora liberar.                   │
│                                             │
│         [   Sair   ]                         │
└─────────────────────────────────────────────┘
```

**Componentes:** ícone gigante de sucesso (✓ em círculo verde), texto
caloroso, resumo numérico, botão ghost "Sair".

**Estados:**
- **Padrão:** mostrado acima
- **Algumas em branco:** texto adaptado "Você respondeu X de Y questões"
- **Correção liberada (fase 2):** card extra "Sua nota: X / 10 — ver
  detalhes →"

**Microcopy:**
- Header: "Prova enviada!"
- Subtítulo: "Boa, [Nome]! Suas respostas foram enviadas para a Prof[a].
  [Nome do professor]."
- Botão: "Sair"

**Por que esse design:**
- Ícone grande + texto curto traz alívio imediato (princípio: estado
  emocional alívio)
- Saudação personalizada (Lucas + Marília) humaniza
- Resumo numérico fecha o ciclo (Lucas sabe o que fez)
- Frase sobre correção evita pergunta "e agora?"

---

### 5.A7 — Bloqueado (outro dispositivo)

**Propósito:** Explicar pro aluno por que ele não pode entrar e o que fazer.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  📘 EduMap                                   │
├─────────────────────────────────────────────┤
│                                             │
│                  ⚠                           │
│                                             │
│      Você já está fazendo essa prova        │
│            em outro celular                  │
│                                             │
│   Por segurança, a prova só pode ser feita  │
│   em um celular por vez.                     │
│                                             │
│   • Se foi você em outro celular, volta lá. │
│   • Se o seu celular travou ou você precisa │
│     de outro, peça à professora para liberar│
│     no botão "Liberar relogin".              │
│                                             │
│         [ Voltar para o início ]             │
└─────────────────────────────────────────────┘
```

**Componentes:** ícone ⚠ amarelo, texto explicativo, botão ghost.

**Microcopy:** texto acima literalmente.

**Por que esse design:**
- Tom calmo, sem culpar o aluno
- Explica a regra E o "remédio" (peça à professora)
- Não dá impressão de fraude/erro — é mecanismo de segurança normal

---

### 5.A8 — Erro / fora do ar

**Propósito:** Tela amigável quando algo grave dá errado (erro 500, manutenção).

**Layout:**

```
┌─────────────────────────────────────────────┐
│  📘 EduMap                                   │
├─────────────────────────────────────────────┤
│                                             │
│                  🔧                           │
│                                             │
│         Algo deu errado do nosso lado.       │
│                                             │
│   Tente de novo em 1 minuto.                 │
│   Suas respostas estão salvas no celular.    │
│                                             │
│         [ Tentar de novo ]                   │
│                                             │
│   Se continuar, avise sua professora.        │
└─────────────────────────────────────────────┘
```

**Microcopy:** texto acima, sem códigos técnicos.

---

## 6. Componentes novos a serem criados

Resumo dos componentes novos que precisam entrar na biblioteca, para o time
de front entender o que reusar.

### 6.1 `StudentLoginCard`

- **Onde usa:** A1 (login do aluno)
- **Props sugeridas:** `onSubmit({ nome, ra, pin })`, `isSubmitting`, `error`
- **Comportamento:** 3 inputs com validação visual em tempo real; PIN em
  6 caixinhas com auto-foco; botão habilitado só quando os 3 campos têm
  comprimento mínimo válido (Nome ≥3, RA ≥1, PIN =6)

### 6.2 `QuestionCard`

- **Onde usa:** A4 (responder questão)
- **Props sugeridas:** `questao`, `respostaAtual`, `onChange`, `tempoNaQuestao`
- **Comportamento:** renderiza enunciado + alternativas como cards-radio
  touch-friendly (44x44 mínimo)

### 6.3 `LiveMonitorTable`

- **Onde usa:** P12 (monitor de aplicação)
- **Props sugeridas:** `alunos[]`, `onLiberarRelogin(alunoId)`, `onSelect(alunoId)`
- **Comportamento:** auto-refresh interno (ou prop `refreshInterval`); status
  com cor + ícone + label; filtro e busca client-side

### 6.4 `PinDisplay`

- **Onde usa:** P11 (gerar PIN), P12 (cabeçalho do monitor)
- **Props sugeridas:** `pin`, `size: 'large' | 'medium' | 'compact'`, `onCopy`,
  `onShowQR`, `hidden`, `onToggleHidden`
- **Comportamento:** dígitos grandes espaçados; ícone copiar; modo "amplão"
  para projetor

### 6.5 `ExamWizardStep`

- **Onde usa:** P7, P8, P9 (wizard criar prova)
- **Props sugeridas:** `stepAtual: 1|2|3`, `passos: [{label}]`, `onStepClick`
- **Comportamento:** indicador visual de progresso; permite voltar via clique
  em passo anterior; passos futuros só viram clicáveis quando atingidos

### 6.6 `ProgressBarTopBar`

- **Onde usa:** A4 (responder questão)
- **Props sugeridas:** `questaoAtual`, `totalQuestoes`, `tempoNaQuestao`,
  `temposLimiteRestante?`
- **Comportamento:** barra fixa top; contador "Qx de y"; timer compacto;
  barra de progresso geral

### 6.7 `EmptyState`

- **Onde usa:** P3, P4, P6, P12, A2
- **Props sugeridas:** `ilustracao?`, `titulo`, `descricao`, `ctaLabel?`,
  `onCta?`
- **Comportamento:** layout consistente com ilustração SVG opcional + texto
  + CTA opcional

### 6.8 Reusos de componentes existentes (NÃO recriar)

- **Toast** — usar para feedback de ações (Toast verde sucesso, vermelho erro)
- **Sidebar** — manter como navegação principal do professor
- **AuthGuard** — envolver layout de rotas protegidas
- **InfoBox** — usar para tutoriais inline e avisos contextuais
- **FlowBanner** — usar para destacar aplicação em andamento no dashboard
- **BloomBadge** — usar em P8 (taxonomia), P13/P14 (relatórios)
- **PctBadge** — usar em P13 (taxa de acerto por questão)

---

## 7. Padrões transversais

### 7.1 Hierarquia visual (tipografia)

| Token | Tag | Tamanho mobile / desktop | Peso | Uso |
|-------|-----|--------------------------|------|-----|
| display | h1 | 28px / 32px | 700 | Saudação do aluno, hero |
| h1 | h1 | 24px / 28px | 700 | Título de página |
| h2 | h2 | 20px / 22px | 600 | Seção dentro de página |
| h3 | h3 | 18px / 18px | 600 | Header de card |
| body | p | 16px / 16px | 400 | Texto comum |
| small | span | 14px / 14px | 400 | Helper, metadados |
| micro | span | 12px / 12px | 500 | Badge, indicador discreto |

Fonte: Inter (já no projeto).

### 7.2 Espaçamento

Sistema de espaçamento em múltiplos de 4: **4 / 8 / 12 / 16 / 24 / 32 / 48 /
64**.

- Padding interno padrão de cards: 16 (mobile) / 24 (desktop)
- Gap entre seções: 24 (mobile) / 32 (desktop)
- Padding lateral do container: 16 (mobile) / 32 (desktop)

### 7.3 Botões

| Tipo | Cor | Quando usar |
|------|-----|-------------|
| Primário | `#1D4ED8` (azul cheio, texto branco) | Ação principal por tela |
| Secundário | outline azul, texto azul | Ação alternativa de mesma importância |
| Destrutivo | vermelho `#DC2626` cheio | Excluir, encerrar, irreversível |
| Ghost | sem fundo, texto cinza-escuro | Ações secundárias, "Cancelar" |
| Texto link | azul sublinhado no hover | Navegação inline |

- Altura padrão: 48px em mobile, 40px em desktop (ainda ≥44px de área de toque)
- Border-radius: 8px
- Loading state: spinner pequeno + label muda para gerúndio ("Salvando...")
- Disabled state: opacidade 50%, cursor not-allowed, sem hover

### 7.4 Toques mínimos 44x44px

Em mobile, todo elemento interativo (botão, link, radio, checkbox, item de
lista) precisa ter área de toque ≥44x44px. Padding interno conta — o pixel
visível pode ser menor.

### 7.5 Feedback de loading

- Preferir **skeletons** (placeholders animados) sobre spinners
- Spinner pequeno só em botões durante submit
- Skeletons preservam o layout, evitam reflow e dão sensação de
  velocidade
- Nunca usar overlay opaco bloqueando a tela inteira por mais de 1 segundo

### 7.6 Tom de voz

- Tratamento: "você", nunca "tu", nunca infinitivos impessoais
- Verbos no imperativo nos CTAs ("Criar prova", "Entrar na prova")
- Mensagens de erro: descreve problema + soluciona + não culpa
- Confirmações destrutivas: explicam o efeito antes do botão
- Sucessos: curtos, com nome do objeto ("Prova publicada", "Turma criada")
- Avisos não-bloqueantes: começam com ⚠ e dizem o que dá pra fazer

---

## 8. Acessibilidade

### 8.1 Foco visível

- Toda navegação por teclado deve mostrar foco visível com `outline` ou
  `ring` azul (não remover `outline:none` sem substituir)
- Ordem de tabulação lógica: cabeçalho → conteúdo → rodapé
- Skip link "Pular para o conteúdo" no topo das páginas longas

### 8.2 Daltônico-friendly

- Cor sempre acompanhada de ícone E texto (princípio 1.4)
- Em gráficos, usar padronagem (hachuras, pontos) além de cor
- Testar com simuladores de deuteranopia, protanopia, tritanopia
- Bloom badges: cor + número (1-6) + nome do nível

### 8.3 Tamanho de fonte

- Mínimo 16px em mobile (evita zoom involuntário do iOS)
- Mínimo 14px em desktop em texto secundário
- Usuário pode aumentar fonte do sistema sem quebrar layout (testar em 200%)

### 8.4 `aria-label` e semântica

- Botões com ícone apenas (sem texto visível) precisam de `aria-label`
- Inputs sempre acompanhados de `<label>` visível, não só placeholder
- Tabela do monitor de aplicação usa `<table>` com `<th scope="col">`
- Status do aluno usa `<span role="status" aria-live="polite">` para anunciar
  mudanças

### 8.5 Tempo de prova e TDAH

- Quando houver limite de tempo, mostrar aviso aos 10 minutos restantes
  (banner laranja não-bloqueante)
- Considerar (fase 2) flag "tempo extra" por aluno marcada pela professora
- Modal "Ainda estou aqui?" após 5 min sem interação evita session loss
  acidental sem culpar o aluno

### 8.6 Leitor de tela

- Tela de prova do aluno (A4) deve ter:
  - Cabeçalho da questão lido como "Questão 3 de 10"
  - Alternativas em `<fieldset>` com `<legend>`
  - Radios com `<label>` envolvendo
- Mudanças de status (salvo, sem conexão) em região `aria-live`

---

## 9. Roadmap de implementação

Sugestão de ordem para implementar o pivô em fases enxutas, cada uma
entregando valor utilizável.

### Fase 1 — MVP do pivô (4-6 semanas)

**Objetivo:** Marília consegue cadastrar uma turma, criar uma prova de
múltipla escolha, gerar PIN e Lucas consegue responder no celular.

**Entregas:**
- Telas P1, P2, P3, P3-modal, P4, P5 (cadastro de turma e alunos)
- Telas P6, P7, P8 (só múltipla escolha), P9, P10 (criação de prova)
- Telas P11, P12 (aplicar + monitor básico com polling 10s)
- Telas A1, A3, A4, A5, A6 (fluxo completo do aluno)
- Componentes: StudentLoginCard, QuestionCard, PinDisplay, ProgressBarTopBar,
  EmptyState básico, ExamWizardStep
- Lock de dispositivo (1 device por aluno+prova)
- Botão "Liberar relogin" no monitor

**Não entra na fase 1:**
- Relatórios (P13, P14)
- Taxonomia obrigatória — fica opcional
- Importar planilha CSV
- QR code (apenas placeholder visual)
- Edição/duplicação de prova após publicada

### Fase 2 — Relatórios + qualidade (2-4 semanas)

- Telas P13, P14 (relatórios da prova e por aluno)
- Aba "Por taxonomia" com agregação Bloom/BNCC
- Exportação PDF/CSV
- QR code funcional na tela P11
- LiveMonitorTable: WebSocket em vez de polling
- Tela A7 (bloqueado) refinada
- Tela A8 (erro) com retry automático
- EmptyStates ilustrados

### Fase 3 — Crescimento (4-6 semanas)

- Importar alunos de planilha CSV/XLSX
- Tipos de questão: dissertativa (com correção manual)
- Geração de prova com IA (placeholder vira funcional)
- Duplicar prova
- Banco de questões reutilizáveis
- Tela C1 (histórico do aluno, opcional)

### Fase 4 — Escala (open-ended)

- Dashboard de coordenação (C2)
- Integrações (Google Classroom?)
- Multi-escola / multi-tenant
- Análise comparativa entre turmas
- Recomendações pedagógicas automáticas

---

## 10. Não-objetivos (o que NÃO fazer agora)

Lista explícita de coisas que parecem ser boa ideia mas que NÃO vamos fazer
nas fases 1-2. Cada item tem um motivo curto pra evitar discussão futura.

- **Modo escuro.** Motivo: não é dor real no contexto escolar, custa
  manutenção, atrasa MVP. Possível na fase 4 se houver demanda.
- **Animações elaboradas.** Motivo: aumentam complexidade de teste e podem
  atrapalhar foco do aluno. Manter micro-transições sutis (fade in/out 150ms)
  e nada mais.
- **Chat aluno-professor.** Motivo: chat exige moderação, mais responsabilidade
  jurídica, complica suporte. WhatsApp e voz na sala já resolvem.
- **Integração com Google Classroom.** Motivo: dependência externa,
  ETEC ainda usa fluxos próprios, ROI baixo agora. Reavaliar em fase 4.
- **Multi-idioma.** Motivo: foco em pt-BR. Internacionalização fica para
  quando houver tração fora do Brasil.
- **App nativo (iOS/Android).** Motivo: o aluno usa web no celular Android e
  isso basta. App nativo dobra custo de desenvolvimento.
- **OCR de prova em papel.** Motivo: foi o que estamos saindo. Manter código
  como módulo legado/desativado, mas não investir.
- **Login do aluno com Google/conta criada.** Motivo: pivô já decidiu que
  aluno não cria conta. Não voltar atrás.
- **Re-submissão automática.** Motivo: professor controla via "liberar nova
  tentativa". Automatizar exigiria regras de fraude mais complexas.
- **Notificações push.** Motivo: aluno está em sala com PIN na lousa, não
  precisa de push. Professor pode usar WhatsApp/voz.
- **Modo "prova em equipe".** Motivo: diagnóstico individual é o
  diferencial pedagógico. Modo em equipe descaracterizaria.
- **Plugin de Bloom automático por IA.** Motivo: requer treino de modelo,
  acurácia ruim hoje. Fica fora do MVP, possível na fase 3.
- **Sistema de pagamento / planos.** Motivo: piloto na ETEC é gratuito.
  Monetização entra depois da validação pedagógica.

---

## Apêndice A — Checklist de QA por tela crítica

Cada tela crítica precisa passar nestes checks antes de subir pra produção:

- [ ] Funciona em viewport 360px sem scroll horizontal
- [ ] Funciona em viewport 1280px sem espaço morto excessivo
- [ ] Todos os botões têm ≥44x44px em mobile
- [ ] Todo status colorido tem ícone E texto
- [ ] Fonte mínima 16px em mobile
- [ ] Inputs disparam o teclado correto (numérico para RA e PIN)
- [ ] Loading state visível (skeleton ou spinner em botão)
- [ ] Estado vazio tratado com mensagem amigável + CTA
- [ ] Estado de erro tratado sem termos técnicos
- [ ] Texto em pt-BR sem jargão
- [ ] Foco visível navegando por Tab
- [ ] Mensagens de erro inline em vermelho com ícone ⚠
- [ ] Toast de sucesso some em 3-5s
- [ ] Toast de erro persiste até clique
- [ ] localStorage usado onde aplicável (drafts do professor, respostas do aluno)
- [ ] Volta do "back" do navegador não quebra estado
- [ ] Recarregar a página recupera estado salvo
- [ ] aria-labels nos botões de ícone-only
- [ ] Testado em Chrome Android, Safari iOS, Chrome desktop, Firefox desktop

---

## Apêndice B — Glossário de microcopy padrão

Termos consolidados para uso consistente em toda a UI.

| Conceito interno | Termo na UI | Não usar |
|------------------|-------------|----------|
| Application / session | Aplicação da prova | "Sessão", "Submission" |
| Submit | Enviar / Enviar minhas respostas | "Submeter", "Submit" |
| Exam | Prova | "Avaliação" (mais formal, usar só em relatório) |
| Question | Questão | "Item", "Pergunta" |
| Answer | Resposta | "Opção marcada" |
| Correct answer | Gabarito | "Resposta-chave" |
| Class (group of students) | Turma | "Classe" |
| Student | Aluno | "Estudante", "Aprendiz" |
| Teacher | Professor / Profª | "Docente", "Educador" |
| Draft | Rascunho | "Esboço" |
| Published | Publicada | "Disponibilizada", "Liberada" |
| Closed application | Aplicação encerrada | "Finalizada" |
| Live monitoring | Monitor de aplicação | "Sala virtual" |
| Lock device | Bloqueio de dispositivo | "Bloqueio de sessão" |
| Unlock | Liberar relogin | "Desbloquear" |
| PIN | PIN da prova | "Código", "Token" |
| Empty state | (sem nome visível, é layout) | — |
| Skeleton | (sem nome visível) | — |
| Sign in | Entrar | "Login", "Acessar" |
| Sign out | Sair | "Logout", "Sair da conta" |
| Confirm | Sim, [verbo da ação] | "Confirmar" genérico |
| Cancel | Cancelar | "Voltar" (usar "Voltar" só pra navegação) |

---

## Apêndice C — Estratégia de testes de usabilidade

Para validar este redesign com usuários reais antes da fase 1 escalar:

### Teste 1 — Marília criando a 1ª prova

- **Tarefa:** "Crie uma turma com 5 alunos fictícios e uma prova de 3
  questões de múltipla escolha para essa turma. Pretende-se aplicar amanhã."
- **Métricas:**
  - Tempo total ≤15 min (sucesso)
  - Conseguiu sem perguntar nada (sucesso)
  - Pontos de fricção verbalizados (qualitativo)
- **Recrutamento:** 3 professores ETEC, 1 escola pública estadual, 1
  particular

### Teste 2 — Lucas respondendo a prova

- **Tarefa:** "Você é Lucas. A professora projetou o PIN 483927. Entre na
  prova e responda as 5 questões. Você pode chutar."
- **Métricas:**
  - Tempo até primeira questão respondida ≤90s
  - Conseguiu encontrar o botão de finalizar (sucesso)
  - Entendeu que o envio é irreversível (sucesso)
- **Recrutamento:** 5 alunos de 15-22 anos, idealmente da ETEC

### Teste 3 — Aplicação real em sala

- **Tarefa:** Marília aplica prova real com a turma toda
- **Métricas:**
  - Quantos alunos conseguiram entrar sem suporte (sucesso ≥90%)
  - Quantos pediram "liberar relogin" (acompanhar)
  - Tempo total da aplicação ≤45min para 10 questões

### Teste 4 — Stress de conectividade

- **Tarefa:** Lucas responde com Wi-Fi instável (simulado via DevTools)
- **Métricas:**
  - Não perdeu nenhuma resposta (sucesso)
  - Conseguiu enviar ao final (sucesso)
  - Indicador "sem conexão" foi compreendido (qualitativo)

---

## Apêndice D — Decisões de design questionáveis (anotadas)

Pontos que tomei decisão consciente mas com baixa convicção. Reabrir para
debate antes da fase 1:

1. **Wizard de 3 passos vs tela única acordeon.**
   - Decidi por wizard porque reduz carga cognitiva no 1º uso.
   - Risco: professores experientes vão achar lento. Mitigar com atalhos
     "Salvar e sair" em qualquer passo.
   - Revisitar após teste com 3 usuárias reais.

2. **PIN de 6 dígitos vs 4.**
   - 6 dígitos: 1 milhão de combinações, baixa colisão entre escolas.
   - 4 dígitos: mais fácil de memorizar, mas só 10 mil combinações — colisão
     viável.
   - Decisão: 6 dígitos. Pode rever para 5 se aluno reclamar.

3. **Timer por questão visível ao aluno vs oculto.**
   - Visível ajuda Lucas a controlar ritmo, mas pode estressar.
   - Oculto evita estresse mas perde sensação de tempo.
   - Decisão: visível, em texto pequeno e neutro ("⏱ 02:14 nesta questão"),
     não como contagem regressiva ameaçadora.
   - Sugiro A/B test na fase 2.

4. **"Não sou eu" no welcome do aluno.**
   - Tem o risco de Lucas apertar por curiosidade e perder o rascunho.
   - Mitigar com confirmação modal "Tem certeza? Vamos limpar suas respostas
     deste celular."

5. **Encerrar aplicação automaticamente após X horas.**
   - Decidi por 6h de validade do PIN.
   - Risco: prova longa em horário estendido pode estourar.
   - Mitigar com "estender PIN por +6h" no menu da aplicação.

---

## Apêndice E — Variações A/B sugeridas

Pequenas variações textuais ou visuais que vale testar com usuários reais
para validar a escolha do designer.

### E.1 — Botão final do aluno

- A: "Enviar minhas respostas" (recomendado)
- B: "Finalizar prova"
- C: "Enviar e finalizar"

### E.2 — Saudação no /aluno

- A: "Olá! Vamos começar sua prova" (recomendado)
- B: "Bem-vindo. Faça login para responder"
- C: "Entre na prova"

### E.3 — Aviso de "tempo restante" para limite cronometrado

- A: "Faltam 10 minutos" (neutro)
- B: "⏰ Atenção: faltam 10 min" (alarmado)
- C: "10 minutos restantes" (frio)

### E.4 — Modal de confirmação de envio do aluno

- A: "Depois de enviar, você NÃO consegue mais alterar suas respostas."
  (caps no NÃO — recomendado)
- B: "Você não vai poder mudar nada depois."
- C: "Esta ação é definitiva."

### E.5 — Status do aluno bloqueado na lista do monitor

- A: "Bloqueada" (estado, neutro — recomendado)
- B: "Outro celular detectado"
- C: "Acesso negado"

### E.6 — Botão liberar relogin

- A: "Liberar relogin" (recomendado, fala diretamente)
- B: "Liberar acesso"
- C: "Desbloquear aluno"

### E.7 — Empty state da lista de turmas

- A: "Crie sua primeira turma para começar a aplicar provas." (recomendado)
- B: "Você ainda não tem turmas."
- C: "Comece adicionando alunos a uma turma."

---

## Apêndice F — Diretrizes para ilustrações dos EmptyStates

Quando o time de design produzir ilustrações para os EmptyStates:

- Estilo flat, traços leves, sem realismo
- Paleta restrita: azul primário, cinza-claro de fundo, 1-2 cores de acento
- Não usar pessoas com gênero/etnia muito definidos (inclusão)
- Foco em objetos do contexto escolar: lousa, mochila, livro, lápis, cadeira
- Tamanho fixo de 200x160px no mobile, 240x200px no desktop
- Formato SVG inline, otimizado <5KB

EmptyStates previstos:
- Sem turmas (lousa em branco + giz)
- Sem alunos na turma (cadeiras vazias)
- Sem provas (caderno fechado)
- Sem alunos entraram ainda no monitor (relógio com seta)
- Aluno após enviar (mochila no chão = "tarefa cumprida")

---

## Apêndice G — Comportamento de teclado e atalhos (desktop)

Para acelerar o uso do professor experiente. Não documentar na UI, mas
implementar.

| Atalho | Onde funciona | Ação |
|--------|---------------|------|
| `Ctrl+S` | P7, P8, P9 (criar prova) | Salvar rascunho |
| `Ctrl+Enter` | P8 expandida em questão | Salvar questão + ir para próxima |
| `?` | qualquer tela | Abrir overlay de ajuda |
| `Esc` | qualquer modal | Fechar modal |
| `g h` | qualquer tela | Ir para Home |
| `g t` | qualquer tela | Ir para Turmas |
| `g p` | qualquer tela | Ir para Provas |
| `/` | qualquer tela com busca | Focar campo de busca |

---

## Apêndice H — Considerações de privacidade e LGPD

Coisas que o design precisa respeitar (e o time legal vai cobrar).

- **R.A. é dado pessoal.** Listas no monitor só visíveis para o professor
  daquela turma.
- **CPF e data de nascimento são opcionais** porque não são necessários
  para o fluxo principal. Sempre marcar "(opcional)" no label.
- **Não mostrar nome completo de outros alunos no fluxo do aluno.** Lucas
  nunca vê quem mais entrou na prova.
- **Dados ficam armazenados pelo tempo do semestre + 1 ano** (defaults do
  produto). Não mostrar essa política na UI a não ser que perguntado.
- **Logout do professor limpa cookies de sessão.** Tokens curtos (24h).
- **Aluno não tem "sessão persistente" — ao fechar o navegador, o
  fingerprint ainda lembra dele para o bloqueio, mas ele precisa redigitar
  Nome+RA+PIN se voltar.**

---

## Apêndice I — Notas para o handoff dev

Pequenas anotações pro time de implementação que não cabem nas seções de
design.

- Usar `next/font` para Inter (já no projeto)
- Tailwind: configurar `colors.bloom.*` para reusar nas badges (1-6) já
  conforme paleta existente
- Configurar `inputmode` correto nos inputs (já mencionado, mas reforçando)
- Em A4 (responder questão), debounce do auto-save em **500ms** para evitar
  spam de PATCH
- Polling do P12 (monitor) com `setInterval` simples por enquanto; refatorar
  para WebSocket na fase 2 (não bloqueia)
- Lock de dispositivo: gerar fingerprint client-side com FingerprintJS open
  source ou hash de `userAgent + screen.width + timezone + canvas hash`. NÃO
  usar IP (compartilhado na rede da ETEC).
- localStorage com namespace `edumap:` para evitar colisão com outros apps
- Em mobile, NÃO usar `position: sticky` no rodapé do A4 — usar `fixed` com
  cuidado por causa do teclado virtual; testar no iOS Safari (problemático
  historicamente)

---

## Fim do documento

Este documento é o "norte" do redesign. Quando dúvidas surgirem na
implementação, voltar aqui antes de improvisar. Atualizar este documento
quando uma decisão for revisada — não deixar virar arqueologia.

> **Próximo passo recomendado:** validar mentalmente cada tela com a
> Marília (persona 1) lendo em voz alta o que ela faria em cada passo. Se
> ela trava, ajustar microcopy ou layout antes do dev começar.
