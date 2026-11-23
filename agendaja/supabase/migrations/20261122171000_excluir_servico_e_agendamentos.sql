create or replace function public.excluir_servico_e_agendamentos(
    p_servico_id uuid,
    p_negocio_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    quantidade integer;
    servicos_excluidos integer;
begin
    if auth.uid() is null then
        raise exception 'É necessário estar autenticado.';
    end if;

    perform 1
    from public.servicos s
    join public.negocios n on n.id = s.negocio_id
    where s.id = p_servico_id
      and s.negocio_id = p_negocio_id
      and n.dono_id = auth.uid()
    for update of s, n;

    if not found then
        raise exception 'Serviço não encontrado ou sem permissão para excluí-lo.';
    end if;

    if exists (
        select 1
        from public.agendamentos a
        where a.servico_id = p_servico_id
          and a.negocio_id is distinct from p_negocio_id
    ) then
        raise exception 'O serviço possui agendamentos vinculados a outro negócio.';
    end if;

    delete from public.agendamentos
    where servico_id = p_servico_id and negocio_id = p_negocio_id;
    get diagnostics quantidade = row_count;

    if exists (select 1 from public.agendamentos where servico_id = p_servico_id) then
        raise exception 'Não foi possível excluir todos os agendamentos do serviço.';
    end if;

    delete from public.servicos
    where id = p_servico_id and negocio_id = p_negocio_id;
    get diagnostics servicos_excluidos = row_count;
    if servicos_excluidos <> 1 then
        raise exception 'Não foi possível excluir o serviço.';
    end if;

    return quantidade;
end;
$$;

revoke all on function public.excluir_servico_e_agendamentos(uuid, uuid) from public, anon;
grant execute on function public.excluir_servico_e_agendamentos(uuid, uuid) to authenticated;
