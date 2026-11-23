import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Temporal } from '@js-temporal/polyfill';
import {
    horarioBrasiliaParaUTC, formatarHorarioBrasilia, horarioUTCParaEntradaBrasilia,
    horarioMinimoBrasilia, horarioFuturoBrasiliaParaUTC, limitesDiaBrasilia,
} from '../src/lib/horario.js';

test('converte a hora de Brasília para UTC e exibe o mesmo horário', () => {
    const utc = horarioBrasiliaParaUTC('2026-11-22T09:00');
    assert.equal(utc, '2026-11-22T12:00:00Z');
    assert.equal(formatarHorarioBrasilia(utc), '22/11/2026, 09:00:00');
    assert.equal(formatarHorarioBrasilia('2026-11-22T12:00:00+00:00'), '22/11/2026, 09:00:00');
});

test('considera o horário de verão histórico de Brasília', () => {
    assert.equal(horarioBrasiliaParaUTC('2018-01-15T09:00'), '2018-01-15T11:00:00Z');
});

test('preenche o campo de edição no fuso de Brasília, preservando segundos', () => {
    assert.equal(horarioUTCParaEntradaBrasilia('2026-11-22T12:15:43.123456Z'), '2026-11-22T09:15:43');
    assert.equal(horarioUTCParaEntradaBrasilia('2018-01-15T11:00:00Z'), '2018-01-15T09:00:00');
});

test('rejeita data inválida e horários inexistentes ou ambíguos', () => {
    for (const dataHora of ['2026-02-30T09:00', '2018-11-04T00:30', '2019-02-16T23:30', '2026-01-01T09:00Z']) {
        assert.throws(() => horarioBrasiliaParaUTC(dataHora));
    }
});

test('define o mínimo em Brasília, arredondando para o próximo minuto ou segundo', () => {
    const agora = Temporal.Instant.from('2026-11-23T02:59:59.500Z');
    assert.equal(horarioMinimoBrasilia(false, agora), '2026-11-23T00:00');
    assert.equal(horarioMinimoBrasilia(true, agora), '2026-11-23T00:00:00');
    assert.equal(horarioMinimoBrasilia(false, Temporal.Instant.from('2026-11-23T12:30:00Z')), '2026-11-23T09:30');
});

test('impede horários passados e permite o momento atual ou posterior', () => {
    const agora = Temporal.Instant.from('2026-11-23T12:30:00Z');
    for (const dataHora of ['2026-11-22T23:59', '2026-11-23T09:29:59']) {
        assert.throws(() => horarioFuturoBrasiliaParaUTC(dataHora, agora), /a partir do momento atual/);
    }
    assert.equal(horarioFuturoBrasiliaParaUTC('2026-11-23T09:30', agora), '2026-11-23T12:30:00Z');
    assert.equal(horarioFuturoBrasiliaParaUTC('2026-11-23T10:00', agora), '2026-11-23T13:00:00Z');
});

test('obtém os limites do dia de Brasília, inclusive na virada UTC', () => {
    assert.deepEqual(limitesDiaBrasilia(Temporal.Instant.from('2026-11-23T02:59:59Z')), {
        inicio: '2026-11-22T03:00:00Z',
        proximo: '2026-11-23T03:00:00Z',
    });
    assert.deepEqual(limitesDiaBrasilia(Temporal.Instant.from('2026-11-23T03:00:00Z')), {
        inicio: '2026-11-23T03:00:00Z',
        proximo: '2026-11-24T03:00:00Z',
    });
});

test('considera o início de dia inexistente no horário de verão histórico', () => {
    assert.deepEqual(limitesDiaBrasilia(Temporal.Instant.from('2018-11-04T12:00:00Z')), {
        inicio: '2018-11-04T03:00:00Z',
        proximo: '2018-11-05T02:00:00Z',
    });
});
