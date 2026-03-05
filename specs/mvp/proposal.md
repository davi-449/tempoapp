# Vibe Proposal: TempoApp MVP

## 1. Visão Geral

O TempoApp unifica tarefas de trabalho, faculdade, pessoais e de treino em um único ecossistema. Ele age como um Motor de Produtividade Logística e Preditiva, cruzando tempo, espaço (localização via Google Maps API) e viabilidade de execução, com uso de IA "invisível" para otimizar a experiência sem sobrecarregar o usuário.

## 2. Pilares de Funcionalidade

- **Gestão Unificada:** 4 categorias principais (Trabalho, Faculdade, Pessoal, Treino).
- **Motor de Conflitos:** Cruze temporal e logístico. Avalia se há tempo de deslocamento entre tarefas usando a API do Google Maps.
- **Inteligência Preditiva (IA Silenciosa):** Sugere durações, avisa sobre burnout e reorganiza prioridades sem criar uma interface de "chat".
- **Rotinas e Histórico:** Herança de notas entre rotinas repetitivas (ex: última matéria da aula X).
- **Projetos e Capacidade:** Cálculo de viabilidade de entrega de grandes projetos com base na carga atual de tarefas.
- **Sincronização:** Habilidade de puxar calendário externo (Google/Apple) e manter calendário próprio isolado se desejado.

## 3. Fluxos de Dados e Modelagem (Supabase)

Tabelas Essenciais:

- `users`: Perfil, integrações (Tokens Google Calendar), configs de transporte (carro, pé).
- `tasks`: Tarefas isoladas. Colunas chave: `start_time`, `end_time`, `location`, `estimated_duration`, `category`.
- `routines`: Moldes para tarefas repetitivas.
- `projects`: Agrupadores de tarefas com prazo final (`deadline`).

## 4. Requisitos de Integração

- **Google Maps API**: Para cálculo de matriz de distância e tempo em roteirização.
- **Google/Apple Calendar APIs**: Sincronização bidirecional ou unidirecional (Read-only).
- **Edge Functions (Supabase)**: Para rodar a lógica pesada de checagem de conflitos, IA de sugestão e rotinas.
