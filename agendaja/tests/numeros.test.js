import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatarDuracao, formatarNumeroBrasileiro, normalizarDuracao, normalizarNumeroBrasileiro } from '../src/lib/numeros.js';

test('aceita somente minutos inteiros com ou sem separadores de milhar', () => {
    assert.equal(normalizarDuracao('1.440'), '1440');
    assert.equal(normalizarDuracao('1440'), '1440');
    assert.equal(normalizarDuracao('2.147.483.647'), '2147483647');
    for (const valor of ['', '1,00', '1.5', '12.34', '-1']) {
        assert.equal(normalizarDuracao(valor), null, valor);
    }
});

test('formata minutos inteiros sem arredondar valores decimais já armazenados', () => {
    assert.equal(formatarDuracao('1440.00'), '1.440');
    assert.equal(formatarDuracao(1440), '1.440');
    assert.equal(formatarDuracao(1440.5), '1.440,50');
});

test('interpreta números brasileiros e o formato decimal anteriormente aceito', () => {
    assert.equal(normalizarNumeroBrasileiro('1.500,00'), '1500.00');
    assert.equal(normalizarNumeroBrasileiro('1.234.567,89'), '1234567.89');
    assert.equal(normalizarNumeroBrasileiro('1440'), '1440');
    assert.equal(normalizarNumeroBrasileiro('35.50'), '35.50');
    assert.equal(normalizarNumeroBrasileiro('1.500'), '1500');
});

test('rejeita formatos ambíguos ou inválidos', () => {
    for (const valor of ['', '-1', '1.50,00', '1,234', '1.234.56', '1,', 'R$ 10,00']) {
        assert.equal(normalizarNumeroBrasileiro(valor), null, valor);
    }
});

test('exibe valores armazenados com separadores e duas casas decimais', () => {
    assert.equal(formatarNumeroBrasileiro('1500.00'), '1.500,00');
    assert.equal(formatarNumeroBrasileiro(1440.5), '1.440,50');
    assert.equal(formatarNumeroBrasileiro(0), '0,00');
    assert.equal(formatarNumeroBrasileiro('12.345'), '12,345');
});
