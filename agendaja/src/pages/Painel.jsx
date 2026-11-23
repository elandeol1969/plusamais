import { useEffect, useRef, useState } from 'react';
import usarUsuarioLogado from '../hooks/usarUsuarioLogado';
import { Navigate } from 'react-router-dom';
import CartaoAgendamento from '../components/CartaoAgendamento';
import CadastroCliente from '../components/CadastroCliente';
import CadastroServico from '../components/CadastroServico';
import NovoAgendamento from '../components/NovoAgendamento';
import Marca from '../components/Marca';
import { supabase } from '../lib/supabaseClient';
import { formatarHorarioBrasilia, limitesDiaBrasilia } from '../lib/horario';

function Agenda({ usuario, aba }) {
    const [negocios, setNegocios] = useState(null);
    const [negocioSelecionado, setNegocioSelecionado] = useState('');
    const [agendamentos, setAgendamentos] = useState(null);
    const [erroNegocios, setErroNegocios] = useState('');
    const [erroAgendamentos, setErroAgendamentos] = useState(null);
    const [atualizacao, setAtualizacao] = useState(0);
    const [atualizacaoClientes, setAtualizacaoClientes] = useState(0);
    const [atualizacaoServicos, setAtualizacaoServicos] = useState(0);
    const [inicioDia, setInicioDia] = useState(() => limitesDiaBrasilia().inicio);
    const negocioId = negocioSelecionado || negocios?.[0]?.id;
    const listaAtual = agendamentos?.negocioId === negocioId && agendamentos?.inicioDia === inicioDia;
    const erroLista = erroAgendamentos?.negocioId === negocioId && erroAgendamentos?.inicioDia === inicioDia
        ? erroAgendamentos.mensagem : '';

    useEffect(() => {
        let temporizador;
        function atualizarDia() {
            const { inicio, proximo } = limitesDiaBrasilia();
            setInicioDia(inicio);
            clearTimeout(temporizador);
            const espera = Math.min(Math.max(Date.parse(proximo) - Date.now() + 1, 1), 60000);
            temporizador = setTimeout(atualizarDia, espera);
        }
        function aoVoltar() {
            if (document.visibilityState === 'visible') atualizarDia();
        }
        temporizador = setTimeout(atualizarDia, 0);
        window.addEventListener('focus', atualizarDia);
        document.addEventListener('visibilitychange', aoVoltar);
        return () => {
            clearTimeout(temporizador);
            window.removeEventListener('focus', atualizarDia);
            document.removeEventListener('visibilitychange', aoVoltar);
        };
    }, []);

    useEffect(() => {
        let ativo = true;

        async function carregarNegocios() {
            try {
                const { data, error } = await supabase
                    .from('negocios')
                    .select('id, nome')
                    .eq('dono_id', usuario.id);
                if (error) throw error;
                if (ativo) setNegocios(data);
            } catch (error) {
                if (ativo) setErroNegocios(error.message);
            }
        }

        carregarNegocios();
        return () => { ativo = false; };
    }, [usuario.id]);

    useEffect(() => {
        if (!negocioId) return;
        let ativo = true;

        async function carregarAgendamentos() {
            try {
                const { data, error } = await supabase
                    .from('agendamentos')
                    .select('id, cliente_id, servico_id, data_hora, clientes(nome), servicos(nome)')
                    .eq('negocio_id', negocioId)
                    .gte('data_hora', inicioDia)
                    .order('data_hora');
                if (error) throw error;
                if (ativo) {
                    setAgendamentos({ negocioId, inicioDia, dados: data });
                    setErroAgendamentos(null);
                }
            } catch (error) {
                if (ativo) setErroAgendamentos({ negocioId, inicioDia, mensagem: error.message });
            }
        }

        carregarAgendamentos();
        return () => { ativo = false; };
    }, [negocioId, atualizacao, inicioDia]);

    if (erroNegocios) return <main className="conteudo-painel"><p role="alert">Erro ao carregar negócios: {erroNegocios}</p></main>;
    if (!negocios) return <main className="conteudo-painel"><p>Carregando negócios...</p></main>;
    if (negocios.length === 0) return <main className="conteudo-painel"><p>Nenhum negócio encontrado para esta conta.</p></main>;

    return (
        <main className="conteudo-painel">
            {negocios.length > 1 && (
                <label className="campo-formulario seletor-negocio">
                    Negócio
                    <select value={negocioId} onChange={(e) => setNegocioSelecionado(e.target.value)}>
                        {negocios.map((negocio) => (
                            <option key={negocio.id} value={negocio.id}>{negocio.nome}</option>
                        ))}
                    </select>
                </label>
            )}
            <div className="grade-painel">
            <div className="coluna-formularios">
            <section id="painel-agendamento" className="painel-cartao" aria-labelledby="titulo-agendamento" hidden={aba !== 'agendamento'}>
                <div className="painel-titulo"><span className="titulo-icone" aria-hidden="true">▦</span><h2 id="titulo-agendamento">Novo agendamento</h2></div>
                <div className="painel-corpo">
                <NovoAgendamento
                    key={negocioId}
                    negocioId={negocioId}
                    atualizacaoClientes={atualizacaoClientes}
                    atualizacaoServicos={atualizacaoServicos}
                    aoSalvar={() => setAtualizacao((valor) => valor + 1)}
                />
                </div>
            </section>
            <section id="painel-servico" className="painel-cartao" aria-labelledby="titulo-servico" hidden={aba !== 'servico'}>
                <div className="painel-titulo"><span className="titulo-icone" aria-hidden="true">✂</span><h2 id="titulo-servico">Cadastro de serviços</h2></div>
                <div className="painel-corpo">
                <CadastroServico
                    key={negocioId}
                    negocioId={negocioId}
                    aoSalvar={() => {
                        setAtualizacaoServicos((valor) => valor + 1);
                        setAtualizacao((valor) => valor + 1);
                    }}
                />
                </div>
            </section>
            <section id="painel-cliente" className="painel-cartao" aria-labelledby="titulo-cliente" hidden={aba !== 'cliente'}>
                <div className="painel-titulo"><span className="titulo-icone" aria-hidden="true">♙</span><h2 id="titulo-cliente">Cadastro de clientes</h2></div>
                <div className="painel-corpo">
                <CadastroCliente
                    key={negocioId}
                    negocioId={negocioId}
                    aoSalvar={() => {
                        setAtualizacaoClientes((valor) => valor + 1);
                        setAtualizacao((valor) => valor + 1);
                    }}
                />
                </div>
            </section>
            </div>
            <section className="painel-cartao" aria-labelledby="titulo-lista-agendamentos">
            <div className="painel-titulo">
                <span className="titulo-icone" aria-hidden="true">☰</span>
                <h2 id="titulo-lista-agendamentos">Agendamentos</h2>
                {!erroLista && listaAtual && (
                    <span className="contagem-agendamentos">{agendamentos.dados.length} {agendamentos.dados.length === 1 ? 'horário' : 'horários'}</span>
                )}
            </div>
            <div className="lista-agendamentos">
            {erroLista ? (
                <p role="alert">Erro ao carregar agendamentos: {erroLista}</p>
            ) : !listaAtual ? (
                <p>Carregando agendamentos...</p>
            ) : agendamentos.dados.length === 0 ? (
                <p>Nenhum agendamento encontrado.</p>
            ) : (
                agendamentos.dados.map((agendamento) => (
                    <CartaoAgendamento
                        key={agendamento.id}
                        agendamento={agendamento}
                        negocioId={negocioId}
                        cliente={agendamento.clientes?.nome ?? 'Cliente indisponível'}
                        servico={agendamento.servicos?.nome ?? 'Serviço indisponível'}
                        horario={formatarHorarioBrasilia(agendamento.data_hora)}
                        atualizacaoClientes={atualizacaoClientes}
                        atualizacaoServicos={atualizacaoServicos}
                        aoAtualizar={() => setAtualizacao((valor) => valor + 1)}
                    />
                ))
            )}
            </div>
            </section>
            </div>
        </main>
    );
}

function Painel() {
    const usuario = usarUsuarioLogado();
    const [saindo, setSaindo] = useState(false);
    const [erroSaida, setErroSaida] = useState('');
    const [aba, setAba] = useState('agendamento');
    const [menuAberto, setMenuAberto] = useState(false);
    const menuRef = useRef(null);
    const botaoMenuRef = useRef(null);
    const abasRefs = useRef({});
    const abas = [
        { id: 'agendamento', nome: 'Novo Agendamento' },
        { id: 'cliente', nome: 'Cadastro de Clientes' },
        { id: 'servico', nome: 'Cadastro de Serviços' },
    ];

    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 901px)');
        function fecharAoAmpliar(evento) {
            if (evento.matches && menuRef.current?.open) menuRef.current.close();
        }
        desktop.addEventListener('change', fecharAoAmpliar);
        return () => desktop.removeEventListener('change', fecharAoAmpliar);
    }, []);

    function selecionarAba(id) {
        setAba(id);
        window.scrollTo({ top: 0 });
    }

    function navegarAbas(evento) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(evento.key)) return;
        evento.preventDefault();
        const indiceAtual = abas.findIndex((item) => item.id === aba);
        const indice = evento.key === 'Home' ? 0
            : evento.key === 'End' ? abas.length - 1
                : (indiceAtual + (evento.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length;
        selecionarAba(abas[indice].id);
        abasRefs.current[abas[indice].id]?.focus();
    }

    function fecharMenu() {
        setMenuAberto(false);
        if (window.matchMedia('(min-width: 901px)').matches) {
            abasRefs.current[aba]?.focus();
        } else {
            botaoMenuRef.current?.focus();
        }
    }

    async function sair() {
        setErroSaida('');
        setSaindo(true);
        try {
            const { error } = await supabase.auth.signOut({ scope: 'local' });
            if (error) throw error;
        } catch (error) {
            setErroSaida(`Erro ao sair: ${error.message}`);
        } finally {
            setSaindo(false);
        }
    }

    if (usuario === undefined) return <p>Carregando...</p>;
    if (usuario === null) return <Navigate to="/login" replace />;
    
    return (
        <>
            <header className="cabecalho-painel">
                <div className="cabecalho-conteudo">
                <button
                    ref={botaoMenuRef}
                    type="button"
                    className="botao-menu"
                    aria-label="Abrir menu de navegação"
                    aria-expanded={menuAberto}
                    aria-controls="menu-mobile"
                    onClick={() => { menuRef.current.showModal(); setMenuAberto(true); }}
                >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
                </button>
                <Marca />
                <nav className="abas-painel" aria-label="Navegação do painel" onKeyDown={navegarAbas}>
                    {abas.map((item) => (
                        <button key={item.id} ref={(elemento) => { abasRefs.current[item.id] = elemento; }} type="button"
                            aria-current={aba === item.id ? 'page' : undefined}
                            aria-controls={`painel-${item.id}`} onClick={() => selecionarAba(item.id)}>
                            {item.nome}
                        </button>
                    ))}
                </nav>
                <span className="conta-conectada" title={usuario.email}>{usuario.email}</span>
                <button
                    type="button"
                    className="botao-secundario botao-sair"
                    aria-label="Sair do sistema"
                    title="Sair do sistema"
                    disabled={saindo}
                    onClick={sair}
                >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M10 17v3H4V4h6v3M14 8l4 4-4 4M8 12h10" />
                    </svg>
                    {saindo ? 'Saindo...' : 'Sair'}
                </button>
                </div>
            </header>
            <dialog id="menu-mobile" ref={menuRef} className="menu-mobile" aria-labelledby="titulo-menu" onClose={fecharMenu}
                onKeyDown={(evento) => { if (evento.key === 'Escape') { evento.preventDefault(); menuRef.current.close(); } }}
                onClick={(evento) => { if (evento.target === evento.currentTarget) menuRef.current.close(); }}>
                <div className="menu-topo">
                    <div id="titulo-menu"><Marca /></div>
                    <button type="button" className="fechar-menu" aria-label="Fechar menu de navegação" onClick={() => menuRef.current.close()}>×</button>
                </div>
                <div className="menu-conta"><span>Conta conectada</span><p>{usuario.email}</p></div>
                <nav className="menu-opcoes" aria-label="Navegação móvel">
                    {abas.map((item) => (
                        <button key={item.id} type="button" aria-current={aba === item.id ? 'page' : undefined}
                            aria-controls={`painel-${item.id}`} onClick={() => { selecionarAba(item.id); menuRef.current.close(); }}>
                            {item.nome}
                        </button>
                    ))}
                </nav>
            </dialog>
            {erroSaida && <p role="alert">{erroSaida}</p>}
            <Agenda key={usuario.id} usuario={usuario} aba={aba} />
        </>
    );
}

export default Painel;  