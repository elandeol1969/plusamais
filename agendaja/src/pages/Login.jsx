import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Marca from '../components/Marca';

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const navigate = useNavigate();

    async function handleLogin(evento) {
        evento.preventDefault();
        setErro('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: senha,
        });

        if (error) {
            setErro(error.message);
            return;
        }
        navigate('/painel');
    }

    return (
        <main className="tela-acesso">
        <form onSubmit={handleLogin} className="cartao-acesso">
            <Marca />
            <h1>Entrar na sua conta</h1>
            <p className="acesso-descricao">Gestão simples e rápida para seus atendimentos.</p>
            <div className="campos-formulario">
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
                        autoComplete="current-password"
                        required
                    />
                </label>
            </div>
            {erro && <p role="alert">{erro}</p>}
            <button className="botao-primario" type="submit">Entrar</button>
            <Link className="link-acesso" to="/cadastro">Criar conta</Link>
        </form>
        </main>
    );
}

export default Login;