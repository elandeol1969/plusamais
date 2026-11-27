import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Marca from '../components/Marca';

const TAMANHO_MINIMO_SENHA = 6;

function linkRecuperacaoInvalido() {
    const parametros = new URLSearchParams(window.location.hash.slice(1));
    return parametros.has('error') || parametros.has('error_code');
}

function RedefinirSenha() {
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
    const [erro, setErro] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [concluido, setConcluido] = useState(false);
    const [sessaoRecuperacao, setSessaoRecuperacao] = useState(false);
    const [verificando, setVerificando] = useState(() => !linkRecuperacaoInvalido());
    const navigate = useNavigate();

    useEffect(() => {
        let ativo = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, sessao) => {
            if (!ativo) return;
            if (evento === 'PASSWORD_RECOVERY' || (evento === 'SIGNED_IN' && sessao)) {
                setSessaoRecuperacao(true);
                setVerificando(false);
            }
        });

        if (!linkRecuperacaoInvalido()) {
            supabase.auth.getSession().then(({ data }) => {
                if (!ativo) return;
                if (data.session) setSessaoRecuperacao(true);
                setVerificando(false);
            });
        }

        return () => {
            ativo = false;
            subscription.unsubscribe();
        };
    }, []);

    async function handleSubmit(evento) {
        evento.preventDefault();
        setErro('');

        if (novaSenha.length < TAMANHO_MINIMO_SENHA) {
            setErro(`A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
            return;
        }
        if (novaSenha !== confirmacaoSenha) {
            setErro('As senhas não coincidem. Confira e tente novamente.');
            return;
        }

        setSalvando(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: novaSenha });
            if (error) throw error;
            await supabase.auth.signOut();
            setConcluido(true);
        } catch (error) {
            setErro(`Erro ao redefinir a senha: ${error.message}`);
        } finally {
            setSalvando(false);
        }
    }

    if (verificando) {
        return (
            <main className="tela-acesso">
                <div className="cartao-acesso">
                    <Marca />
                    <p role="status">Verificando o link de recuperação...</p>
                </div>
            </main>
        );
    }

    if (concluido) {
        return (
            <main className="tela-acesso">
                <div className="cartao-acesso">
                    <Marca />
                    <h1>Senha redefinida</h1>
                    <p role="status">Sua senha foi alterada com sucesso. Entre com a nova senha.</p>
                    <button type="button" className="botao-primario" onClick={() => navigate('/login')}>Ir para login</button>
                </div>
            </main>
        );
    }

    if (!sessaoRecuperacao) {
        return (
            <main className="tela-acesso">
                <div className="cartao-acesso">
                    <Marca />
                    <h1>Link inválido ou expirado</h1>
                    <p>O link de recuperação não é válido ou já expirou. Solicite um novo link na tela de login.</p>
                    <Link className="link-acesso" to="/login">Voltar para login</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="tela-acesso">
            <form onSubmit={handleSubmit} className="cartao-acesso">
                <Marca />
                <h1>Redefinir senha</h1>
                <p className="acesso-descricao">Informe e confirme a sua nova senha.</p>
                <div className="campos-formulario">
                    <label className="campo-formulario">
                        Nova senha
                        <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            placeholder="Nova senha"
                            autoComplete="new-password"
                            minLength={TAMANHO_MINIMO_SENHA}
                            required
                        />
                    </label>
                    <label className="campo-formulario">
                        Confirmar nova senha
                        <input
                            type="password"
                            value={confirmacaoSenha}
                            onChange={(e) => setConfirmacaoSenha(e.target.value)}
                            placeholder="Confirme a nova senha"
                            autoComplete="new-password"
                            required
                        />
                    </label>
                </div>
                {erro && <p role="alert">{erro}</p>}
                <button className="botao-primario" type="submit" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Redefinir senha'}
                </button>
                <Link className="link-acesso" to="/login">Cancelar</Link>
            </form>
        </main>
    );
}

export default RedefinirSenha;
