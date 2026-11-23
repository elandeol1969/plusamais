import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function usarUsuarioLogado() {
    const [usuario, setUsuario] = useState(undefined); // undefined = ainda carregando

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUsuario(data.session?.user ?? null);
        });

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_evento, session) => {
                setUsuario(session?.user ?? null);
            }
        );

        return () => listener.subscription.unsubscribe();
    }, []);

    return usuario;
}

export default usarUsuarioLogado;