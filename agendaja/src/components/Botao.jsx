function Botao({ children, variante = 'primario', ...props }) {
    const estilos = {
        primario: 'bg-emerald-700 text-white hover:bg-emerald-800',
        secundario: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    };

    return (
        <button
            className={`rounded-md py-2 px-4 text-sm font-medium ${estilos[variante]}`}         {...props}
        >
            {children}
        </button>
    );
}