import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { atualizarAgendamento, criarAgendamento } from '../lib/agendamentos';
import { horarioMinimoBrasilia, horarioUTCParaEntradaBrasilia } from '../lib/horario';

function ordenarPorNome(itens) {
    return [...itens].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

function NovoAgendamento({ negocioId, aoSalvar, atualizacaoClientes, atualizacaoServicos, agendamento, aoCancelar }) {
    const [horarioInicial] = useState(() => agendamento ? horarioUTCParaEntradaBrasilia(agendamento.data_hora) : '');
    const [horarioMinimo, setHorarioMinimo] = useState(() => horarioMinimoBrasilia(!!agendamento));
    const [alterandoHorarioAntigo, setAlterandoHorarioAntigo] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [clienteId, setClienteId] = useState(agendamento?.cliente_id ?? '');
    const [servicoId, setServicoId] = useState(agendamento?.servico_id ?? '');
    const [dataHora, setDataHora] = useState(horarioInicial);
    const [erro, setErro] = useState('');
    const [erroClientes, setErroClientes] = useState('');
    const [erroServicos, setErroServicos] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [atualizacaoOpcoes, setAtualizacaoOpcoes] = useState(0);
    const horarioAntigo = agendamento && horarioInicial < horarioMinimo;
    const manterHorarioAntigo = horarioAntigo && !alterandoHorarioAntigo && dataHora === horarioInicial;

    useEffect(() => {
        const intervalo = setInterval(() => setHorarioMinimo(horarioMinimoBrasilia(!!agendamento)), 1000);
        return () => clearInterval(intervalo);
    }, [agendamento]);

    useEffect(() => {
        let ativo = true;

        async function carregarClientes() {
            try {
                const { data, error } = await supabase.from('clientes').select().eq('negocio_id', negocioId);
                if (error) throw error;
                if (ativo) {
                    setClientes(ordenarPorNome(data));
                    setErroClientes('');
                }
            } catch (error) {
                if (ativo) {
                    setClientes([]);
                    setErroClientes(`Erro ao carregar clientes: ${error.message}`);
                }
            }
        }

        async function carregarServicos() {
            try {
                const { data, error } = await supabase.from('servicos').select().eq('negocio_id', negocioId);
                if (error) throw error;
                if (ativo) {
                    setServicos(ordenarPorNome(data));
                    setErroServicos('');
                }
            } catch (error) {
                if (ativo) {
                    setServicos([]);
                    setErroServicos(`Erro ao carregar serviços: ${error.message}`);
                }
            }
        }

        Promise.all([carregarClientes(), carregarServicos()]).then(() => {
            if (ativo) setCarregando(false);
        });
        return () => { ativo = false; };
    }, [negocioId, atualizacaoClientes, atualizacaoServicos, atualizacaoOpcoes]);

    async function handleSubmit(evento) {
        evento.preventDefault();
        setErro('');
        setSalvando(true);
        try {
            if (agendamento) {
                await atualizarAgendamento({
                    agendamentoId: agendamento.id,
                    negocioId,
                    clienteId,
                    servicoId,
                    dataHora: dataHora === horarioInicial ? undefined : dataHora,
                });
            } else {
                await criarAgendamento({ clienteId, servicoId, dataHora, negocioId });
            }
            setClienteId('');
            setServicoId('');
            setDataHora('');
            aoSalvar();
        } catch (error) {
            setErro(`Erro ao salvar agendamento: ${error.message}`);
        } finally {
            setSalvando(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="formulario">
            {erro && <p role="alert">{erro}</p>}
            {erroClientes && <p role="alert">{erroClientes}</p>}
            {erroServicos && <p role="alert">{erroServicos}</p>}
            {carregando && <p>Carregando opções...</p>}
            <label className="campo-formulario">
                Cliente
                <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    required
                >
                    <option value="">Selecione o cliente</option>
                    {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                </select>
            </label>
            <label className="campo-formulario">
                Serviço
                <select value={servicoId} onChange={(e) => setServicoId(e.target.value)} required>
                    <option value="">Selecione o serviço</option>
                    {servicos.map((s) => (
                        <option key={s.id} value={s.id}>{s.nome} — R$ {s.preco}</option>
                    ))}
                </select>
            </label>
            {!carregando && !erroServicos && servicos.length === 0 && (
                <p>Nenhum serviço disponível para este negócio. Cadastre um serviço na aba Cadastro de Serviços e verifique as permissões de leitura.</p>
            )}
            {!carregando && (erroClientes || erroServicos || servicos.length === 0) && (
                <button
                    type="button"
                    className="botao-secundario"
                    onClick={() => {
                        setCarregando(true);
                        setAtualizacaoOpcoes((valor) => valor + 1);
                    }}
                >
                    Atualizar opções
                </button>
            )}

            <label className="campo-formulario">
                Data e hora (horário de Brasília)
                <input
                    type="datetime-local"
                    step={agendamento ? '1' : undefined}
                    min={horarioMinimo}
                    value={dataHora}
                    readOnly={manterHorarioAntigo}
                    onFocus={() => setHorarioMinimo(horarioMinimoBrasilia(!!agendamento))}
                    onChange={(e) => setDataHora(e.target.value)}
                    required
                />
            </label>
            {manterHorarioAntigo && (
                <>
                    <p>O horário original já passou e será mantido se não for alterado.</p>
                    <button type="button" className="botao-secundario" disabled={salvando} onClick={() => { setAlterandoHorarioAntigo(true); setDataHora(''); }}>
                        Alterar data e hora
                    </button>
                </>
            )}
            {horarioAntigo && alterandoHorarioAntigo && (
                <button type="button" className="botao-secundario" disabled={salvando} onClick={() => { setAlterandoHorarioAntigo(false); setDataHora(horarioInicial); }}>
                    Manter horário original
                </button>
            )}

            <button
                type="submit"
                className="botao-primario"
                disabled={carregando || salvando || !!erroClientes || !!erroServicos || servicos.length === 0}
            >
                {salvando ? 'Salvando...' : agendamento ? 'Salvar alterações' : 'Agendar'}
            </button>
            {agendamento && (
                <button type="button" className="botao-secundario" disabled={salvando} onClick={aoCancelar}>
                    Cancelar edição
                </button>
            )}
        </form>
    );
}

export default NovoAgendamento;