import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const supabaseConfigurado = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
const root = createRoot(document.getElementById('root'))

if (supabaseConfigurado) {
  root.render(<p>Carregando...</p>)
  import('./App.jsx')
    .then(({ default: App }) => {
      root.render(<StrictMode><App /></StrictMode>)
    })
    .catch((erro) => {
      console.error('Erro ao carregar o aplicativo:', erro)
      root.render(<p>Não foi possível carregar o aplicativo. Consulte o console para mais detalhes.</p>)
    })
} else {
  root.render(<p>Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.local e reinicie o servidor.</p>)
}
