import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Painel from './pages/Painel';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/painel" element={<Painel />} />
      </Routes>
      <footer className="rodape">
        <p>© 2026 <a href="https://www.rede-sol.com/" target="_blank" rel="noopener noreferrer" aria-label="RED-E Soluções e Serviços Ltda. (abre em nova aba)"><strong>RED-E Soluções e Serviços Ltda.</strong></a></p>
        <p>CNPJ: 56.945.569/0001-84</p>
      </footer>
    </BrowserRouter>
  );
}
export default App;
