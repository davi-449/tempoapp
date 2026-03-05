# Design System - TempoApp

Referência Principal: **Airbnb** (Limpo, organizado, animações sutis, tátil, 100% intuitivo).

## 1. Paleta de Cores & Tipografia

- **Tipografia:** Inter ou Roboto (Sem-serifa, legibilidade alta).
- **Background principal:** `#F7F7F9` (Off-white para contraste suave).
- **Cards e Modais:** `#FFFFFF` com sombras difusas grandes (ex: `shadow-xl` / Drop Shadow `0 10px 30px rgba(0,0,0,0.05)`).
- **Tags e Categorias (Cores de Destaque Suaves):**
  - Trabalho: Azul Ágata (`#3B82F6`)
  - Faculdade: Roxo Lavanda (`#8B5CF6`)
  - Pessoal: Verde Menta (`#10B981`)
  - Treino: Laranja Coral (`#F97316`)
- **Avisos (Conflitos):** Amarelo Queimado / Âmbar para alertas não intrusivos.

## 2. Componentes Visuais Principais

- **Timeline Inteligente (Home):** Scroll vertical limpo. Tarefas são cards arredondados (`border-radius: 16px`). Espaços vazios mostram blocos translúcidos de "Deslocamento / Trânsito".
- **Smart Add (Criador de Tarefas):** Bottom Sheet (gaveta que sobe da base). Foco total em digitação rápida com autocompletar e processamento em background.
- **Project Accordions:** Projetos aparecem fechados com uma barra de progresso (Burn-down). Ao clicar, expandem suavemente revelando as sub-tarefas.
- **Rotines Flip Card:** Cards de rotinas (aulas/treinos) que viram (animação 3D sutil) para mostrar os notes da sessão anterior.

## 3. Interações & Animações

- **Toasts de Conflito:** Aparecem no topo deslizando suavemente. Se houver conflito, o app não "trava" o usuário, ele sugere horários alternativos de forma orgânica.
- **Micro-interações:** Hover states, clicks dando "bounce" (escala 0.98), e loaders em esqueleto.
