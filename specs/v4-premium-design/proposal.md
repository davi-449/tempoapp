# Vibe Proposal: V4 Ultra Premium & Customização

## 1. Contexto

O usuário solicitou uma elevação drástica no nível de design do TempoApp, visando um visual "Ultra Premium" comparável a aplicativos modernos de iOS e UI Kits de altíssimo nível (como detalhado nas imagens de referência). Além disso, foram solicitadas novas funcionalidades de customização de categorias e melhorias no perfil (foto de perfil e menu suspenso).

## 2. Objetivos

- **Redesign Visual (Ultra Premium):** Abandonar o visual "dashboard genérico" em favor de um design "App native", com bordas extremamente arredondadas (estilo pill/capsule), sombras difusas e tipografia de forte contraste.
- **Customização de Categorias:** Permitir que o usuário crie, edite e remova suas próprias categorias (atualmente hardcoded).
- **Header & Perfil:** Adicionar suporte a upload de foto de perfil (avatar) e um dropdown menu direto no header da Home.

## 3. Escopo de Funcionalidades

1. **Avatar/Foto de Perfil:**
   - Upload de imagem para o Supabase Storage.
   - Integração com a tabela `profiles` ou `users`.
2. **Menu Suspenso (Dropdown):**
   - Acessível ao clicar no avatar no Header.
   - Opções: Editar Perfil, Gerenciar Categorias, Sair.
3. **CRUD de Categorias:**
   - Tela/Modal para adicionar nome, cor e emoji de uma nova categoria.
   - Relacionamento no banco de dados atrelando categorias a `user_id`.
4. **Redesign de Componentes Core:**
   - **Task Cards:** Visual fluido, sem bordas duras, arredondamento acentuado.
   - **KPI Cards:** Formato mais quadrado/arredondado, focado no número.
   - **Header:** Remover bordas inferiores, integrar com o background para um visual mais clean.

## 4. Supabase Schema (Mudanças Necessárias)

- **Tabela `categories` [NEW]:** `id`, `user_id`, `name`, `color`, `emoji`, `created_at`.
- **Tabela `profiles` [UPDATE]:** Adicionar coluna `avatar_url`.
- **Storage Bucket [NEW]:** Criar bucket `avatars` para armazenar as fotos de perfil.
