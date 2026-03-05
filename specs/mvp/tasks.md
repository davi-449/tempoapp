# Plano de Tarefas - TempoApp MVP

## Fase 1: Setup da Infraestrutura e Banco

- [x] 1.1 Criar projeto Supabase.
- [x] 1.2 Definir Schema SQL (`users`, `tasks`, `routines`, `projects`).
- [x] 1.3 Aplicar RLS Policies e sincronizar tipagem TypeScript.

## Fase 2: Integrações e Backend (Edge Functions)

- [ ] 2.1 Criar Edge Function de "Motor de Conflito" (cálculo de datas básicas).
- [ ] 2.2 Integrar Google Maps API Routes / Distance Matrix na Edge Function.
- [ ] 2.3 Implementar IA generativa básica (via Google Gemini) em Edge Function para sugerir durações a partir do título da tarefa de forma invisível.
- [ ] 2.4 Setup de OAuth Google Calendar (Read).

## Fase 3: UI Foundation (Stitch MCP)

- [ ] 3.1 Instalar shadcn/ui e configurar paleta de cores (Tailwind).
- [ ] 3.2 Gerar Componente 'Timeline Inteligente' (Dashboard Principal).
- [ ] 3.3 Gerar Componente 'Smart Add' (Bottom Sheet Modal).
- [ ] 3.4 Gerar Componente 'Project Accordion' e 'Routine Flip Card'.

## Fase 4: Integração Front-Bank (Antigravity)

- [ ] 4.1 Conectar Timeline com a tabela `tasks` via Supabase Client.
- [ ] 4.2 Ligar submissão do Smart Add à checagem do Motor de Conflitos antes de salvar (mostrar toast de aviso se houver choque).
- [ ] 4.3 Fazer o cálculo de "Burn-down" de projetos funcionar no front.
- [ ] 4.4 Exibir blocos de trânsito baseados na resposta do Google Maps.
