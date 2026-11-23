import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function CadastroServico({ negocioId, aoSalvar }) {
    const [nome, setNome] = useState('');
    const [duracao, setDuracao] = useState('');
    const [preco, setPreco] = useState('');
    const [servicoEditando, setServicoEditando] = useState(null);
    const [buscaAberta, setBuscaAberta] = useState(false);
    const [servicoSelecionadoId, setServicoSelecionadoId] = useState('');
    const [resultados, setResultados] = useState(null);
    const [erroBusca, setErroBusca] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [erro, setErro] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [salvando, setSalvando] = useState(false);

    const servicoSelecionado = resultados?.find((servico) => servico.id === servicoSelecionadoId);

    async function buscarServicos() {
        setErroBusca('');
        setBuscando(true);
        try {
            const servicos = [];
            let total;
            do {
                const { data, error, count } = await supabase.from('servicos')
                    .select('id, nome, duracao_minutos, preco', { count: 'exact' })
                    .eq('negocio_id', negocioId)
                    .order('nome')
                    .order('id')
                    .range(servicos.length, servicos.length + 499);
                if (error) throw error;
                if (!Number.isInteger(count) || !Array.isArray(data) || (!data.length && servicos.length < count)) {
                    throw new Error('Não foi possível carregar todos os serviços.');
                }
                servicos.push(...data);
                total = count;
            } while (servicos.length < total);
            servicos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
            setResultados(servicos);
            setServicoSelecionadoId((id) => servicos.some((servico) => servico.id === id) ? id : '');
        } catch (error) {
            setResultados(null);
            setServicoSelecionadoId('');
            setErroBusca(`Erro ao buscar serviços: ${error.message}`);
        } finally {
            setBuscando(false);
        }
    }

    function alternarBusca() {
        if (!buscaAberta) {
            buscarServicos();
        }
        setBuscaAberta(!buscaAberta);
    }

    function limparFormulario() {
        setServicoEditando(null);
        setNome('');
        setDuracao('');
        setPreco('');
    }

    function editarServico(servico) {
        setServicoEditando(servico);
        setNome(servico.nome);
        setDuracao(String(servico.duracao_minutos));
        setPreco(String(servico.preco).replace('.', ','));
        setErro('');
        setMensagem('');
    }

    async function excluirServico(servico) {
        if (!window.confirm(`Excluir ${servico.nome} e todos os seus agendamentos? Esta ação não pode ser desfeita.`)) return;
        setErroBusca('');
        setMensagem('');
        setSalvando(true);
        try {
            const { data, error } = await supabase.rpc('excluir_servico_e_agendamentos', {
                p_servico_id: servico.id,
                p_negocio_id: negocioId,
            });
            if (error) throw error;
            if (!Number.isInteger(data)) throw new Error('O banco não confirmou a exclusão.');
            if (servicoEditando?.id === servico.id) limparFormulario();
            setServicoSelecionadoId('');
            setMensagem(`Serviço excluído. Agendamentos excluídos: ${data}.`);
            aoSalvar();
            if (buscaAberta) await buscarServicos();
        } catch (error) {
            setErroBusca(`Erro ao excluir serviço: ${error.message}`);
        } finally {
            setSalvando(false);
        }
    }

    async function handleSubmit(evento) {
        evento.preventDefault();
        setErro('');
        setMensagem('');

        const nomeServico = nome.trim();
        if (!nomeServico) {
            setErro('Informe o nome do serviço.');
            return;
        }

        setSalvando(true);
        try {
            const dados = {
                nome: nomeServico,
                duracao_minutos: Number(duracao),
                preco: preco.replace(',', '.'),
            };
            if (servicoEditando) {
                const { data, error } = await supabase.from('servicos')
                    .update(dados)
                    .eq('id', servicoEditando.id)
                    .eq('negocio_id', negocioId)
                    .select('id')
                    .maybeSingle();
                if (error) throw error;
                if (!data) throw new Error('Serviço não encontrado ou sem permissão para alterá-lo.');
            } else {
                const { error } = await supabase.from('servicos').insert({
                    negocio_id: negocioId,
                    ...dados,
                });
                if (error) throw error;
            }

            setMensagem(servicoEditando ? 'Serviço atualizado com sucesso.' : 'Serviço cadastrado com sucesso.');
            limparFormulario();
            aoSalvar();
            if (buscaAberta) await buscarServicos();
        } catch (error) {
            setErro(`Erro ao ${servicoEditando ? 'atualizar' : 'cadastrar'} serviço: ${error.message}`);
        } finally {
            setSalvando(false);
        }
    }

    return (
        <>
        <div className="busca-servicos">
            <button type="button" className="botao-secundario" aria-expanded={buscaAberta} aria-controls="busca-servicos" disabled={buscando || salvando} onClick={alternarBusca}>
                {buscaAberta ? 'Fechar busca de serviços' : 'Localizar serviços'}
            </button>
            {buscaAberta && (
                <div id="busca-servicos">
                    <label className="campo-formulario">
                        Buscar serviço pelo nome
                        <select
                            value={servicoSelecionadoId}
                            onChange={(e) => setServicoSelecionadoId(e.target.value)}
                            disabled={buscando || salvando || !resultados?.length}
                        >
                            <option value="">{buscando ? 'Carregando serviços...' : 'Selecione um serviço'}</option>
                            {resultados?.map((servico) => (
                                <option key={servico.id} value={servico.id}>{servico.nome}</option>
                            ))}
                        </select>
                    </label>
                    {erroBusca && <p role="alert">{erroBusca}</p>}
                    {erroBusca && <button type="button" className="botao-secundario" disabled={buscando || salvando} onClick={buscarServicos}>Tentar novamente</button>}
                    {resultados && resultados.length === 0 && <p>Nenhum serviço encontrado.</p>}
                    {servicoSelecionado && (
                        <ul className="resultados-servicos">
                            <li>
                                <div>
                                    <strong>{servicoSelecionado.nome}</strong>
                                    <p>{servicoSelecionado.duracao_minutos} minutos — R$ {servicoSelecionado.preco}</p>
                                </div>
                                <div className="acoes-servico">
                                    <button type="button" className="botao-secundario" disabled={salvando || buscando} onClick={() => editarServico(servicoSelecionado)}>Editar</button>
                                    <button type="button" className="botao-secundario" disabled={salvando || buscando} onClick={() => excluirServico(servicoSelecionado)}>Excluir</button>
                                </div>
                            </li>
                        </ul>
                    )}
                </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="formulario">
            {servicoEditando && <h3>Editando serviço: {servicoEditando.nome}</h3>}
            <label className="campo-formulario">
                Nome do serviço
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </label>
            <label className="campo-formulario">
                Duração (minutos)
                <input
                    type="number"
                    min="1"
                    max="2147483647"
                    step="1"
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                    required
                />
            </label>
            <label className="campo-formulario">
                Preço (R$)
                <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]+([.,][0-9]{1,2})?"
                    title="Informe um preço não negativo com até duas casas decimais."
                    placeholder="Ex.: 35,50"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    required
                />
            </label>
            {erro && <p role="alert">{erro}</p>}
            {mensagem && <p role="status">{mensagem}</p>}
            <button
                type="submit"
                className="botao-primario"
                disabled={salvando}
            >
                {salvando ? 'Salvando...' : servicoEditando ? 'Salvar alterações' : 'Cadastrar serviço'}
            </button>
            {servicoEditando && (
                <button type="button" className="botao-secundario" disabled={salvando} onClick={() => { limparFormulario(); setErro(''); setMensagem(''); }}>
                    Cancelar edição
                </button>
            )}
        </form>
        </>
    );
}

export default CadastroServico;
