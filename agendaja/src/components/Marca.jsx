function Marca() {
    return (
        <div className="marca">
            <span className="marca-icone" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M7 3v4m10-4v4M3 10h18m-12 5 2 2 4-4" />
                </svg>
            </span>
            <span className="marca-texto">PLUS<span className="marca-destaque">aMais</span></span>
        </div>
    );
}

export default Marca;
