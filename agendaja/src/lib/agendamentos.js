import { supabase } from './supabaseClient';
import { horarioFuturoBrasiliaParaUTC } from './horario';

async function criarAgendamento({ clienteId, servicoId, dataHora, negocioId }) {
    const { error } = await supabase.from('agendamentos').insert({
        negocio_id: negocioId,
        cliente_id: clienteId,
        servico_id: servicoId,
        data_hora: horarioFuturoBrasiliaParaUTC(dataHora),
    });
    
    if (error) throw error;
}

async function cancelarAgendamento(agendamentoId) {
    const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', agendamentoId);

    if (error) throw error;
}

async function atualizarAgendamento({ agendamentoId, negocioId, clienteId, servicoId, dataHora }) {
    const dados = { cliente_id: clienteId, servico_id: servicoId };
    if (dataHora !== undefined) dados.data_hora = horarioFuturoBrasiliaParaUTC(dataHora);

    const { data, error } = await supabase
        .from('agendamentos')
        .update(dados)
        .eq('id', agendamentoId)
        .eq('negocio_id', negocioId)
        .select('id')
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Agendamento não encontrado ou sem permissão para alterá-lo.');
}

async function apagarAgendamento(agendamentoId, negocioId) {
    const { data, error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', agendamentoId)
        .eq('negocio_id', negocioId)
        .select('id')
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Agendamento não encontrado ou sem permissão para excluí-lo.');
}

export { criarAgendamento, atualizarAgendamento, cancelarAgendamento, apagarAgendamento };