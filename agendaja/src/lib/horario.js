import { Temporal } from '@js-temporal/polyfill';

const fusoBrasilia = 'America/Sao_Paulo';
const formatoDataHora = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/;
const formatadorBrasilia = new Intl.DateTimeFormat('pt-BR', {
    timeZone: fusoBrasilia,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});

function horarioBrasiliaParaUTC(dataHora) {
    if (typeof dataHora !== 'string' || !formatoDataHora.test(dataHora)) {
        throw new Error('Informe uma data e hora válidas no horário de Brasília.');
    }

    try {
        return Temporal.PlainDateTime.from(dataHora)
            .toZonedDateTime(fusoBrasilia, { disambiguation: 'reject' })
            .toInstant()
            .toString();
    } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        throw new Error('Data ou horário inválido, inexistente ou ambíguo no horário de Brasília.', { cause: error });
    }
}

function formatarHorarioBrasilia(dataHora) {
    return formatadorBrasilia.format(new Date(dataHora));
}

function horarioUTCParaEntradaBrasilia(dataHora) {
    return Temporal.Instant.from(dataHora)
        .toZonedDateTimeISO(fusoBrasilia)
        .toPlainDateTime()
        .toString({ smallestUnit: 'second' });
}

function horarioMinimoBrasilia(comSegundos = false, agora = Temporal.Now.instant()) {
    const unidade = comSegundos ? 'second' : 'minute';
    return agora.round({ smallestUnit: unidade, roundingMode: 'ceil' })
        .toZonedDateTimeISO(fusoBrasilia)
        .toPlainDateTime()
        .toString({ smallestUnit: unidade });
}

function horarioFuturoBrasiliaParaUTC(dataHora, agora = Temporal.Now.instant()) {
    const utc = horarioBrasiliaParaUTC(dataHora);
    if (Temporal.Instant.compare(Temporal.Instant.from(utc), agora) < 0) {
        throw new Error('Escolha uma data e hora a partir do momento atual, no horário de Brasília.');
    }
    return utc;
}

function limitesDiaBrasilia(agora = Temporal.Now.instant()) {
    const local = agora.toZonedDateTimeISO(fusoBrasilia);
    return {
        inicio: local.startOfDay().toInstant().toString(),
        proximo: local.toPlainDate().add({ days: 1 }).toZonedDateTime(fusoBrasilia).toInstant().toString(),
    };
}

export {
    horarioBrasiliaParaUTC, formatarHorarioBrasilia, horarioUTCParaEntradaBrasilia,
    horarioMinimoBrasilia, horarioFuturoBrasiliaParaUTC, limitesDiaBrasilia,
};
