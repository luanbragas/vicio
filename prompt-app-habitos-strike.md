# Prompt: App de Hábitos "Strike" — Competição entre Amigos

Use este prompt para gerar o projeto (Claude Code, v0, Bolt, Lovable, Cursor, etc.)

---

## 1. Visão Geral

Crie um **web app mobile-first** chamado **"Strike"** (nome provisório) — um app de hábitos onde amigos competem entre si para manter consistência em uma atividade (ex: estudar, treinar, ler, acordar cedo). Cada check-in é validado com **foto + horário de início/fim**, e a **prova é aprovada ou reprovada pelo adversário**, tornando o compromisso social e competitivo.

**Stack obrigatória:**
- Frontend: React (Vite ou Next.js)
- Backend: Firebase
  - Firebase Auth (login)
  - Firestore (banco de dados)
  - Firebase Storage (fotos)
  - Cloud Functions (agendada) para apagar fotos com mais de 7 dias
- Design: mobile-first, moderno, dark mode como padrão, micro-interações e animações sutis (framer-motion), tipografia forte, cards com gradientes/glow, feel de app de fitness/gamificado (referência: Duolingo + Strava + BeReal)

---

## 2. Direção de Design

- Paleta escura com um **accent vibrante** (ex: laranja/vermelho "fogo" para remeter a streak, ou verde neon) — usar gradiente em elementos-chave (botão de check-in, contador de streak)
- Tipografia bold para números (streak count, dias) — números devem ser o "herói visual" da tela
- Cards arredondados (radius grande), sombras suaves, glassmorphism leve nos modais
- Ícone de "chama" ou "raio" para representar o streak ativo; chama apagada/cinza quando o streak quebra
- Bottom navigation fixa (mobile): Início / Meus Desafios / Ranking / Perfil
- Feed no estilo "cartão por desafio", com foto do check-in, status (pendente/aprovado/reprovado), e progresso visual (barra ou anel)
- Tela de aprovação da prova: foto grande, horário declarado, botões grandes "Aprovar ✅" / "Reprovar ❌" com campo obrigatório de motivo na reprovação

---

## 3. Estrutura de Dados (Firestore)

```
users/{userId}
  - nome
  - foto_perfil
  - amigos: [userId]
  - streak_atual (calculado ou cache)
  - criado_em

desafios/{desafioId}
  - titulo (ex: "Estudar inglês")
  - participantes: [userId_A, userId_B]
  - criado_por
  - meta_diaria_minutos (opcional)
  - status: ativo | pausado | encerrado
  - streak_atual_por_usuario: { userId_A: n, userId_B: n }
  - criado_em

desafios/{desafioId}/checkins/{checkinId}
  - userId (quem fez)
  - foto_url (Storage path)
  - horario_inicio
  - horario_fim
  - duracao_minutos
  - status: pendente | aprovado | reprovado
  - avaliado_por (userId do amigo)
  - motivo_reprovacao (se reprovado)
  - criado_em
```

**Firebase Storage:**
```
checkins/{desafioId}/{checkinId}.jpg
```

**Cloud Function agendada (ex: `scheduledCleanup`, roda 1x por dia via Cloud Scheduler):**
- Busca checkins com `criado_em` > 7 dias
- Deleta o arquivo correspondente no Storage
- Mantém o documento no Firestore (apenas remove `foto_url` ou marca `foto_removida: true`), preservando o histórico de streak sem gastar armazenamento

---

## 4. Fluxos Principais

### 4.1 Onboarding / Login
- Login via Firebase Auth (Google Sign-In + e-mail/senha)
- Após login, tela de boas-vindas pedindo para adicionar um amigo (busca por e-mail ou compartilhando link/código de convite)

### 4.2 Criar Desafio
1. Usuário escolhe o hábito (texto livre ou lista sugerida: Estudar, Treinar, Ler, Meditar, Dormir cedo, etc.)
2. Convida o amigo (já existente na lista de amigos ou por convite)
3. Define regras: meta diária (opcional), duração do desafio (ex: 30 dias) ou "sem fim"
4. Ambos precisam aceitar para o desafio começar

### 4.3 Check-in
1. Usuário abre o desafio ativo
2. Toca em "Registrar check-in"
3. Tira a foto (câmera obrigatória, não pode escolher da galeria — para evitar fraude)
4. Marca horário de início e fim (pode ser manual ou timer em tempo real dentro do próprio app, o que é mais confiável)
5. Envia → status vira "pendente"

### 4.4 Aprovação
1. O amigo recebe notificação (push, se implementar FCM)
2. Abre a tela de revisão: vê a foto, horário e duração
3. Aprova ou reprova (reprovação exige motivo em texto curto)
4. Se aprovado → conta para o streak; se reprovado → não conta e o streak é resetado (ou apenas aquele dia falha, dependendo da regra escolhida)

### 4.5 Ranking / Progresso
- Tela mostrando streak atual dos dois participantes lado a lado, tipo "cabo de guerra"
- Histórico de dias com selo (aprovado/reprovado/faltou)

---

## 5. Ideias para Deixar Mais Competitivo (gamificação)

1. **Aposta simbólica ("Stake")** — cada participante define uma "prenda" no início (ex: quem perder o streak paga o café). O app só registra o texto da aposta, não dinheiro real.
2. **Streak Freeze / Coringa** — cada usuário ganha 1 "congelamento" por semana para não perder o streak em um dia de imprevisto (como Duolingo). Cria estratégia sobre quando usar.
3. **Multiplicador de fogo** — a cada 7 dias consecutivos aprovados, o ícone de chama evolui visualmente (fogo pequeno → grande → azul → dourado), dando status visual de prestígio.
4. **Duelo semanal** — toda semana o app resume quem teve mais check-ins aprovados e declara um "vencedor da semana", com um placar acumulado de vitórias semanais (tipo temporada).
5. **Reprovação com "recurso"** — se alguém for reprovado, pode contestar 1x por semana, abrindo a decisão para um terceiro amigo do grupo (árbitro) decidir.
6. **Selo de honestidade** — taxa de aprovação histórica do usuário fica visível no perfil (ex: 92% de check-ins aprovados), criando reputação dentro do grupo de amigos.
7. **Modo "grupo" além de 1x1** — desafios com 3+ pessoas, ranking tipo liga, com pontos por check-in aprovado e tabela de classificação.
8. **Notificação de provocação** — permitir mandar um "cutucão"/mensagem rápida pré-definida pro amigo quando ele está perto de perder o streak do dia (ex: "Faltam 2h, não vacila!").
9. **Replay do streak** — ao final de um desafio, gerar uma tela de resumo compartilhável (estilo "Spotify Wrapped") com total de dias, taxa de aprovação, foto de maior orgulho etc, pra compartilhar no story.
10. **Penalidade social** — se reprovado, o motivo da reprovação fica visível publicamente no histórico do desafio (transparência total = mais pressão pra caprichar na prova).

---

## 6. Requisitos Técnicos Adicionais para o Prompt de Geração

- Usar `react-router-dom` para navegação
- Usar Context API ou Zustand para estado global (usuário logado, desafios ativos)
- Componente de câmera: usar `getUserMedia`/`<input capture="environment">` para forçar captura direta (mobile web)
- Timer de início/fim: usar um cronômetro em tela (start/stop) em vez de digitação manual, para reduzir fraude
- Estrutura de pastas sugerida: `/components`, `/pages`, `/hooks`, `/firebase` (config, auth, firestore, storage helpers), `/utils`
- Configurar regras do Firestore e Storage Rules para que só os participantes do desafio possam ler/escrever nos dados daquele desafio
- PWA (manifest + service worker) para permitir "instalar" no celular como app
