function formattaData(dataString) {
    if(!dataString) {
        return "";
    }
    const parti = dataString.split("-");
    if(parti.length !== 3) {
        return dataString;
    }
    return `${parti[2]}/${parti[1]}/${parti[0]}`;
}

function calcolaRitmo(km, tempoStr) {
    if(!km || !tempoStr || !tempoStr.includes(":")) {
        return "-";
    }

    const parti = tempoStr.split(":");
    let secondiTotali = 0;

    if(parti.length === 3) {
        secondiTotali =
        parseInt(parti[0]) * 3600 +
        parseInt(parti[1]) * 60 +
        parseInt(parti[2]);
    }

    else if(parti.length === 2) {
        secondiTotali =
        parseInt(parti[0]) * 60 +
        parseInt(parti[1]);
    }

    if(isNaN(secondiTotali) || secondiTotali === 0) {

        return "-";

    }

    const secondiKm = Math.round(
        secondiTotali / km
    );

    const minuti = Math.floor(
        secondiKm / 60
    );

    let secondi = secondiKm % 60;

    if(secondi < 10) {

        secondi = "0" + secondi;

    }

    return `${minuti}:${secondi}`;

}