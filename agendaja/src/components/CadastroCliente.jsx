import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function formatarTelefone(digitos) {
    if (!digitos) return '';
    let resultado = `(${digitos.slice(0, 2)}`;
    if (digitos.length >= 2) resultado += ')';
    if (digitos.length > 2) resultado += ` ${digitos.slice(2, 7)}`;
    if (digitos.length > 7) resultado += `-${digitos.slice(7, 11)}`;
    return resultado;
}

function CadastroCliente({ negocioId, aoSalvar }) {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [clienteEditando, setClienteEditando] = useState(null);
    const [buscaAberta, setBuscaAberta] = useState(false);
    const [busca, setBusca] = useState('');
    const [ultimaBusca, setUltimaBusca] = useState('');
    const [resultados, setResultados] = useState(null);
    const [erroBusca, setErroBusca] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [erro, setErro] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [salvando, setSalvando] = useState(false);

    async function buscarClientes(termo) {
        setErroBusca('');
        setBuscando(true);
        try {
            const { data, error } = await supabase.from('clientes')
                .select('id, nome, telefone, email')
                .eq('negocio_id', negocioId)
                .ilike('nome', `%${termo.replace(/[\\%_]/g, '\\$&')}%`)
                .order('nome')
                .limit(50);
            if (error) throw error;
            setResultados(data);
            setUltimaBusca(termo);
        } catch (error) {
            setResultados(null);
            setErroBusca(`Erro ao buscar clientes: ${error.message}`);
        } finally {
            setBuscando(false);
        }
    }

    function handleBusca(evento) {
        evento.preventDefault();
        const termo = busca.trim();
        if (!termo) {
            setResultados(null);
            setErroBusca('Informe o nome do cliente para buscar.');
            return;
        }
        buscarClientes(termo);
    }

    function limparFormulario() {
        setClienteEditando(null);
        setNome('');
        setTelefone('');
        setEmail('');
    }

    function editarCliente(cliente) {
        setClienteEditando(cliente);
        setNome(cliente.nome);
        setTelefone(cliente.telefone ?? '');
        setEmail(cliente.email ?? '');
        setErro('');
        setMensagem('');
    }

    async function excluirCliente(cliente) {
        if (!window.confirm(`Excluir ${cliente.nome} e todos os seus agendamentos? Esta ação não pode ser desfeita.`)) return;
        setErroBusca('');
        setMensagem('');
        setSalvando(true);
        try {
            const { data, error } = await supabase.rpc('excluir_cliente_e_agendamentos', {
                p_cliente_id: cliente.id,
                p_negocio_id: negocioId,
            });
            if (error) throw error;
            if (!Number.isInteger(data)) throw new Error('O banco não confirmou a exclusão.');
            if (clienteEditando?.id === cliente.id) limparFormulario();
            setMensagem(`Cliente excluído. Agendamentos excluídos: ${data}.`);
            aoSalvar();
            if (ultimaBusca) await buscarClientes(ultimaBusca);
        } catch (error) {
            setErroBusca(`Erro ao excluir cliente: ${error.message}`);
        } finally {
            setSalvando(false);
        }
    }

    function handleTelefone(evento) {
        const campo = evento.target;
        const posicao = campo.selectionStart ?? campo.value.length;
        let digitos = campo.value.replace(/\D/g, '').slice(0, 11);
        let digitosAntesDoCursor = Math.min(
            campo.value.slice(0, posicao).replace(/\D/g, '').length,
            digitos.length,
        );

        if (digitos === telefone.replace(/\D/g, '') && campo.value !== telefone) {
            if (evento.nativeEvent.inputType === 'deleteContentBackward' && digitosAntesDoCursor > 0) {
                digitos = digitos.slice(0, digitosAntesDoCursor - 1) + digitos.slice(digitosAntesDoCursor);
                digitosAntesDoCursor -= 1;
            } else if (evento.nativeEvent.inputType === 'deleteContentForward') {
                digitos = digitos.slice(0, digitosAntesDoCursor) + digitos.slice(digitosAntesDoCursor + 1);
            }
        }

        const formatado = formatarTelefone(digitos);
        let cursor = 0;
        let contagem = 0;
        while (cursor < formatado.length && contagem < digitosAntesDoCursor) {
            if (/\d/.test(formatado[cursor])) contagem += 1;
            cursor += 1;
        }
        while (cursor < formatado.length && !/\d/.test(formatado[cursor])) cursor += 1;

        campo.value = formatado;
        campo.setSelectionRange(cursor, cursor);
        setTelefone(formatado);
    }

    async function handleSubmit(evento) {
        evento.preventDefault();
        setErro('');
        setMensagem('');

        const nomeCliente = nome.trim();
        if (!nomeCliente) {
            setErro('Informe o nome do cliente.');
            return;
        }

        setSalvando(true);
        try {
            const dados = {
                nome: nomeCliente,
                telefone: telefone.trim() || null,
                email: email.trim() || null,
            };
            if (clienteEditando) {
                const { data, error } = await supabase.from('clientes')
                    .update(dados)
                    .eq('id', clienteEditando.id)
                    .eq('negocio_id', negocioId)
                    .select('id')
                    .maybeSingle();
                if (error) throw error;
                if (!data) throw new Error('Cliente não encontrado ou sem permissão para alterá-lo.');
            } else {
                const { error } = await supabase.from('clientes').insert({
                    negocio_id: negocioId,
                    ...dados,
                });
                if (error) throw error;
            }

            setMensagem(clienteEditando ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.');
            limparFormulario();
            aoSalvar();
            if (ultimaBusca) await buscarClientes(ultimaBusca);
        } catch (error) {
            setErro(`Erro ao ${clienteEditando ? 'atualizar' : 'cadastrar'} cliente: ${error.message}`);
        } finally {
            setSalvando(false);
        }
    }

    return (
        <>
        <div className="busca-clientes">
            <button type="button" className="botao-secundario" aria-expanded={buscaAberta} aria-controls="busca-clientes" onClick={() => setBuscaAberta(!buscaAberta)}>
                {buscaAberta ? 'Fechar busca de clientes' : 'Localizar clientes'}
            </button>
            {buscaAberta && (
                <div id="busca-clientes">
                    <form onSubmit={handleBusca} className="formulario">
                        <label className="campo-formulario">
                            Buscar cliente pelo nome
                            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} />
                        </label>
                        <button type="submit" className="botao-secundario" disabled={buscando || salvando}>
                            {buscando ? 'Buscando...' : 'Buscar'}
                        </button>
                    </form>
                    {erroBusca && <p role="alert">{erroBusca}</p>}
                    {resultados && resultados.length === 0 && <p>Nenhum cliente encontrado.</p>}
                    {resultados && resultados.length > 0 && (
                        <ul className="resultados-clientes">
                            {resultados.map((cliente) => (
                                <li key={cliente.id}>
                                    <div>
                                        <strong>{cliente.nome}</strong>
                                        {cliente.telefone && <p>{cliente.telefone}</p>}
                                        {cliente.email && <p>{cliente.email}</p>}
                                    </div>
                                    <div className="acoes-cliente">
                                        <button type="button" className="botao-secundario" disabled={salvando || buscando} onClick={() => editarCliente(cliente)}>Editar</button>
                                        <button type="button" className="botao-secundario" disabled={salvando || buscando} onClick={() => excluirCliente(cliente)}>Excluir</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {resultados?.length === 50 && <p>Mostrando até 50 clientes. Refine a busca para ver outros resultados.</p>}
                </div>
            )}
        </div>
        <form onSubmit={handleSubmit} className="formulario">
            {clienteEditando && <h3>Editando cliente</h3>}
            <label className="campo-formulario">
                Nome do cliente
                <input
                    type="text"
                    maxLength={40}
                    placeholder="Máximo de 40 caracteres"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                />
                {nome.length === 40 && (
                    <small className="aviso-limite-caracteres" role="status">
                        Limite de 40 caracteres atingido.
                    </small>
                )}
            </label>
            <label className="campo-formulario">
                Telefone (opcional)
                <input
                    type="tel"
                    inputMode="numeric"
                    value={telefone}
                    onChange={handleTelefone}
                    pattern="\([0-9]{2}\) [0-9]{5}-[0-9]{4}"
                    placeholder="(XX) XXXXX-XXXX"
                    title="Informe o DDD e os nove dígitos do telefone."
                />
            </label>
            <label className="campo-formulario">
                E-mail (opcional)
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    pattern="[^\s@]+@[^\s@.]+(\.[^\s@.]+)+"
                    title="Informe um e-mail válido, como nome@exemplo.com."
                    autoComplete="email"
                />
            </label>
            {erro && <p role="alert">{erro}</p>}
            {mensagem && <p role="status">{mensagem}</p>}
            <button
                type="submit"
                className="botao-primario"
                disabled={salvando}
            >
                {salvando ? 'Salvando...' : clienteEditando ? 'Salvar alterações' : 'Cadastrar cliente'}
            </button>
            {clienteEditando && (
                <button type="button" className="botao-secundario" disabled={salvando} onClick={() => { limparFormulario(); setErro(''); setMensagem(''); }}>
                    Cancelar edição
                </button>
            )}
        </form>
        </>
    );
}

export default CadastroCliente;
