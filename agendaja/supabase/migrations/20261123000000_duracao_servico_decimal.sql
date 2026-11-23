-- Preserve os valores existentes e permita frações de minuto.
alter table public.servicos
    alter column duracao_minutos type numeric using duracao_minutos::numeric;
