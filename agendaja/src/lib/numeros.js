const FORMATO_BRASILEIRO = /^(?:[0-9]+|[0-9]{1,3}(?:\.[0-9]{3})+)(?:,[0-9]{1,2})?$/;
const FORMATO_DECIMAL_COM_PONTO = /^[0-9]+\.[0-9]{1,2}$/;

export function normalizarDuracao(valor) {
    const texto = valor.trim();
    if (!/^(?:[0-9]+|[0-9]{1,3}(?:\.[0-9]{3})+)$/.test(texto)) return null;
    return texto.replace(/\./g, '');
}

export function formatarDuracao(valor) {
    return formatarNumeroBrasileiro(valor).replace(/,0+$/, '');
}

export function normalizarNumeroBrasileiro(valor) {
    const texto = valor.trim();
    if (FORMATO_BRASILEIRO.test(texto)) {
        return texto.replace(/\./g, '').replace(',', '.');
    }
    if (FORMATO_DECIMAL_COM_PONTO.test(texto)) return texto;
    return null;
}

export function formatarNumeroBrasileiro(valor) {
    const texto = String(valor);
    const partes = /^(-?)([0-9]+)(?:\.([0-9]+))?$/.exec(texto);
    if (!partes) return texto;
    const [, sinal, inteiro, decimal = ''] = partes;
    const parteInteira = inteiro.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${sinal}${parteInteira},${decimal.padEnd(2, '0')}`;
}
