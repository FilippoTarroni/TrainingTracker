// ========================================================
// UTILS.JS - Funzioni di calcolo e formattazione
// ========================================================

function formattaData(dataString) {
    if (!dataString) return "";
    const parti = dataString.split("-");
    if (parti.length !== 3) return dataString;
    return `${parti[2]}/${parti[1]}/${parti[0]}`;
}

function calcolaRitmo(km, tempoStr) {
    if (!km || !tempoStr || !tempoStr.includes(":")) return "-";

    const parti = tempoStr.split(":");
    let secondiTotali = 0;

    if (parti.length === 3) {
        secondiTotali = parseInt(parti[0], 10) * 3600 + parseInt(parti[1], 10) * 60 + parseInt(parti[2], 10);
    } else if (parti.length === 2) {
        secondiTotali = parseInt(parti[0], 10) * 60 + parseInt(parti[1], 10);
    }

    if (isNaN(secondiTotali) || secondiTotali === 0) return "-";

    const secondiKm = Math.round(secondiTotali / km);
    const minuti = Math.floor(secondiKm / 60);
    let secondi = secondiKm % 60;

    if (secondi < 10) {
        secondi = "0" + secondi;
    }

    return `${minuti}:${secondi}`;
}

function mediaTempi(ripetute) {
    if (!Array.isArray(ripetute) || ripetute.length === 0) return "-";

    let secondiTotali = 0;
    let conteggioValido = 0;

    ripetute.forEach(r => {
        // Gestione ibrida: accetta sia array di stringhe ["1:30", "1:20"] sia oggetti [{tempo: "1:30"}]
        const tempoStr = (typeof r === "object" && r !== null) ? r.tempo : r;
        
        if (tempoStr && typeof tempoStr === "string" && tempoStr.includes(":")) {
            secondiTotali += tempoInSecondi(tempoStr);
            conteggioValido++;
        }
    });

    if (conteggioValido === 0) return "-";
    const media = Math.round(secondiTotali / conteggioValido);

    return secondiInFormato(media);
}

function tempoInSecondi(t) {
    if (!t || typeof t !== "string" || !t.includes(":")) return 0;
    
    const p = t.split(":");
    if (p.length === 3) {
        return parseInt(p[0], 10) * 3600 + parseInt(p[1], 10) * 60 + parseInt(p[2], 10);
    } else if (p.length === 2) {
        return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
    }
    return 0;
}

function secondiInFormato(secondiTotali) {
    if (isNaN(secondiTotali) || secondiTotali <= 0) return "-";
    
    const ore = Math.floor(secondiTotali / 3600);
    const minuti = Math.floor((secondiTotali % 3600) / 60);
    const secondi = secondiTotali % 60;

    const secStr = secondi < 10 ? "0" + secondi : secondi;

    if (ore > 0) {
        const minStr = minuti < 10 ? "0" + minuti : minuti;
        return `${ore}:${minStr}:${secStr}`;
    }
    return `${minuti}:${secStr}`;
}