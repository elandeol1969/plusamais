import { useState } from 'react';
import NovoAgendamento from './NovoAgendamento';
import { apagarAgendamento } from '../lib/agendamentos';

function CartaoAgendamento({ agendamento, negocioId, cliente, horario, servico, atualizacaoClientes, atualizacaoServicos, aoAtualizar }) {
    const [editando, setEditando] = useState(false);
    const [excluindo, setExcluindo] = useState(false);
    const [erro, setErro] = useState('');
    const painelEdicaoId = `edicao-agendamento-${agendamento.id}`;

    async function handleExcluir() {
        if (!window.confirm(`Excluir o agendamento de ${cliente} em ${horario}? Esta ação não pode ser desfeita.`)) return;
        setErro('');
        setExcluindo(true);
        try {
            await apagarAgendamento(agendamento.id, negocioId);
            aoAtualizar();
        } catch (error) {
            setErro(`Erro ao excluir agendamento: ${error.message}`);
        } finally {
            setExcluindo(false);
        }
    }

    return (
        <div className="cartao-agendamento">
            <div className="agendamento-resumo">
                <div>
                    <h3>{cliente}</h3>
                    <p className="agendamento-servico">{servico}</p>
                </div>
                <div className="agendamento-acoes">
                    <span className="agendamento-horario">{horario}</span>
                    <button
                        type="button"
                        className="botao-icone"
                        aria-label={`Editar agendamento de ${cliente} em ${horario}`}
                        title="Editar agendamento"
                        aria-expanded={editando}
                        aria-controls={painelEdicaoId}
                        disabled={excluindo || editando}
                        onClick={() => { setErro(''); setEditando(!editando); }}
                    >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className="botao-icone"
                        aria-label={`Excluir agendamento de ${cliente} em ${horario}`}
                        title="Excluir agendamento"
                        disabled={excluindo || editando}
                        onClick={handleExcluir}
                    >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 10v6m4-6v6" />
                        </svg>
                    </button>
                </div>
            </div>
            {erro && <p role="alert">{erro}</p>}
            <div id={painelEdicaoId} hidden={!editando} className="edicao-agendamento">
                {editando && (
                    <>
                        <h4>Editar agendamento</h4>
                        <NovoAgendamento
                            negocioId={negocioId}
                            agendamento={agendamento}
                            atualizacaoClientes={atualizacaoClientes}
                            atualizacaoServicos={atualizacaoServicos}
                            aoCancelar={() => setEditando(false)}
                            aoSalvar={() => { setEditando(false); aoAtualizar(); }}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default CartaoAgendamento;