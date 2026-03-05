# Design System: Ultra Premium (V4)

## Referências Visuais

As imagens enviadas ditam as seguintes regras rígidas de design:

## 1. Formas e Arredondamentos

- **Pill Shapes (Cápsulas):** Botões e badges devem ter `border-radius: 9999px` (totalmente arredondados).
- **Cards (Super Rounded):** Cards de tarefas, KPIs e modais devem usar `border-radius: 24px` ou `32px` (`rounded-3xl` ou customizado). Cantos quadrados ou levemente arredondados (`16px`) estão banidos.

## 2. Cores e Contraste

- **Background Principal:** Muito claro, quase um cinza/gelo ultra suave (ex: `#F2F2F7` - padrão iOS background).
- **Cards:** Branco puro (`#FFFFFF`) para criar contraste natural sem precisar de bordas.
- **Textos:**
  - Títulos: Preto sólido ou um cinza quase escuro (`#111111`), fontWeight 600 ou 700.
  - Subtítulos/Muted: Cinza médio claro (`#8E8E93`), fontWeight 400 ou 500.

## 3. Sombras e Bordas

- **Bordas:** Remover todas as bordas (`border-border`) dos cards de tarefas e KPIs. A separação deve ocorrer apenas pela sombra e contraste do fundo branco com o cinza do app.
- **Sombras:** Extremamente difusas e amplas (drop shadow suave). Exemplo: `box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05)`.

## 4. UI Elements (O que muda)

- **Header:** Remover linha de divisão inferior. Deve parecer flutuar ou se fundir com o fundo orginalmente.
- **Task Cards (Timeline):** Layout focado na tipografia e espaçamento. Remover as linhas laterais coloridas (que parecem dashboard de Trello) e usar pequenos "dots" coloridos ou pílulas discretas para a categoria. Aumentar o padding interno (`p-5` ou `p-6`).
- **SmartAdd Bottom Sheet:** Deve parecer flutuar sobre a tela (margin nas laterais), com um fundo de overlay bem escuro (`bg-black/40` com blur pesado).

## 5. Animações

- Focus em interações fluidas, expansão de cards suave.
