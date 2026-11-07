-- PASSO 1 — executar isoladamente e deixar o comando terminar/confirmar.
-- Acrescenta os dois novos cargos sem remover nem alterar utilizadores existentes.
alter type public.nxv_role add value if not exists 'sub_owner';
alter type public.nxv_role add value if not exists 'recruiter';
