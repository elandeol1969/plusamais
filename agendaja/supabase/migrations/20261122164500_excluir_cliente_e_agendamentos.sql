create or replace function public.excluir_cliente_e_agendamentos(
    p_cliente_id uuid,
    p_negocio_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    quantidade integer;
    clientes_excluidos integer;
begin
    if auth.uid() is null then
        raise exception 'É necessário estar autenticado.';
    end if;

    perform 1
    from public.clientes c
    join public.negocios n on n.id = c.negocio_id
    where c.id = p_cliente_id
      and c.negocio_id = p_negocio_id
      and n.dono_id = auth.uid()
    for update of c, n;

    if not found then
        raise exception 'Cliente não encontrado ou sem permissão para excluí-lo.';
    end if;

    if exists (
        select 1
        from public.agendamentos a
        where a.cliente_id = p_cliente_id
          and a.negocio_id is distinct from p_negocio_id
    ) then
        raise exception 'O cliente possui agendamentos vinculados a outro negócio.';
    end if;

    delete from public.agendamentos
    where cliente_id = p_cliente_id and negocio_id = p_negocio_id;
    get diagnostics quantidade = row_count;

    if exists (select 1 from public.agendamentos where cliente_id = p_cliente_id) then
        raise exception 'Não foi possível excluir todos os agendamentos do cliente.';
    end if;

    delete from public.clientes
    where id = p_cliente_id and negocio_id = p_negocio_id;
    get diagnostics clientes_excluidos = row_count;
    if clientes_excluidos <> 1 then
        raise exception 'Não foi possível excluir o cliente.';
    end if;

    return quantidade;
end;
$$;

revoke all on function public.excluir_cliente_e_agendamentos(uuid, uuid) from public, anon;
grant execute on function public.excluir_cliente_e_agendamentos(uuid, uuid) to authenticated;
