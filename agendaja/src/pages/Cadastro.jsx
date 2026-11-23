import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Marca from '../components/Marca';

function Cadastro() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
    const [nomeDoNegocio, setNomeDoNegocio] = useState('');
    const [erro, setErro] = useState('');
    const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
    const [cadastrando, setCadastrando] = useState(false);
    const navigate = useNavigate();

    async function handleCadastro(evento) {
        evento.preventDefault();
        setErro('');

        const nome = nomeDoNegocio.trim();
        if (!nome) {
            setErro('Informe o nome do negócio.');
            return;
        }
        if (senha !== confirmacaoSenha) {
            setErro('As senhas não coincidem. Confira e tente novamente.');
            return;
        }

        setCadastrando(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password: senha,
                options: { data: { nome_do_negocio: nome } },
            });

            if (error) throw error;
            if (!data.user) {
                setErro('Não foi possível concluir o cadastro. Tente novamente.');
                return;
            }
            if (data.session) {
                navigate('/painel');
            } else {
                setSenha('');
                setConfirmacaoSenha('');
                setAguardandoConfirmacao(true);
            }
        } catch (error) {
            setErro(`Erro ao criar conta: ${error.message}`);
        } finally {
            setCadastrando(false);
        }
    }

    if (aguardandoConfirmacao) {
        return (
            <main className="tela-acesso">
                <div className="cartao-acesso">
                <Marca />
                <h1>Confirme seu e-mail</h1>
                <p>Se o cadastro puder ser concluído, você receberá um e-mail de confirmação. Verifique também a pasta de spam.</p>
                <p>Depois de confirmar, entre na sua conta. Se já tiver uma conta, faça login.</p>
                <Link className="link-acesso" to="/login">Ir para login</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="tela-acesso">
        <form onSubmit={handleCadastro} className="cartao-acesso">
            <Marca />
            <h1>Criar sua conta</h1>
            <p className="acesso-descricao">Comece a organizar seus atendimentos.</p>
            <div className="campos-formulario">
                <label className="campo-formulario">
                    Nome do negócio
                    <input
                        type="text"
                        value={nomeDoNegocio}
                        onChange={(e) => setNomeDoNegocio(e.target.value)}
                        placeholder="Nome do negócio"
                        required
                    />
                </label>
                <label className="campo-formulario">
                    E-mail
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        autoComplete="email"
                        required
                    />
                </label>
                <label className="campo-formulario">
                    Senha
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Senha"
                        autoComplete="new-password"
                        required
                    />
                </label>
                <label className="campo-formulario">
                    Confirmar senha
                    <input
                        type="password"
                        value={confirmacaoSenha}
                        onChange={(e) => setConfirmacaoSenha(e.target.value)}
                        placeholder="Confirme sua senha"
                        autoComplete="new-password"
                        required
                    />
                </label>
            </div>
            {erro && <p role="alert">{erro}</p>}
            <button className="botao-primario" type="submit" disabled={cadastrando}>
                {cadastrando ? 'Criando conta...' : 'Criar conta'}
            </button>
            <Link className="link-acesso" to="/login">Já tenho uma conta</Link>
        </form>
        </main>
    );
}

export default Cadastro;
