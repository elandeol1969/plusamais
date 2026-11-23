create or replace function public.validar_horario_agendamento()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'UPDATE' and new.data_hora is not distinct from old.data_hora then
        return new;
    end if;

    if new.data_hora is null or new.data_hora < statement_timestamp() then
        raise exception 'Escolha uma data e hora a partir do momento atual, no horário de Brasília.';
    end if;

    return new;
end;
$$;

drop trigger if exists validar_horario_agendamento on public.agendamentos;
create trigger validar_horario_agendamento
before insert or update of data_hora on public.agendamentos
for each row execute function public.validar_horario_agendamento();
