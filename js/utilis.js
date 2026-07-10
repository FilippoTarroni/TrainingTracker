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

// ========================================================
// NUOVE UTILITY - Gare, Personal Best e analisi passaggi
// ========================================================

// Converte un tempo di gara/passaggio (che può avere i centesimi, es. "52.30"
// oppure "1:02.25") in secondi decimali. A differenza di tempoInSecondi(),
// gestisce anche i decimali e i valori senza ":" (solo secondi).
function tempoGaraInSecondi(t) {
    if (!t || typeof t !== "string") return 0;
    const pulito = t.trim().replace(",", ".");
    if (pulito === "") return 0;

    if (pulito.includes(":")) {
        const p = pulito.split(":");
        if (p.length === 3) {
            return parseInt(p[0], 10) * 3600 + parseInt(p[1], 10) * 60 + parseFloat(p[2]);
        } else if (p.length === 2) {
            return parseInt(p[0], 10) * 60 + parseFloat(p[1]);
        }
        return 0;
    }

    const val = parseFloat(pulito);
    return isNaN(val) ? 0 : val;
}

// Formatta dei secondi decimali in un tempo leggibile (es. 52.3 -> "52.30",
// 75.2 -> "1:15.20").
function formattaTempoGara(secondiTotali) {
    if (!secondiTotali || secondiTotali <= 0 || !isFinite(secondiTotali)) return "-";

    const minuti = Math.floor(secondiTotali / 60);
    const secondi = secondiTotali - minuti * 60;
    const secondiStr = secondi < 10 ? "0" + secondi.toFixed(2) : secondi.toFixed(2);

    return minuti > 0 ? `${minuti}:${secondiStr}` : secondi.toFixed(2);
}

// Estrae la "chiave" numerica di una distanza (es. "800m" -> "800") in modo
// da poter confrontare/raggruppare gare con etichette scritte in modo diverso.
function normalizzaDistanza(distanzaRaw) {
    if (!distanzaRaw) return "";
    const match = String(distanzaRaw).match(/\d+/);
    return match ? match[0] : String(distanzaRaw).trim().toLowerCase();
}

// ========================================================
// ICONE SVG INLINE (cartella /icons)
// Piccola funzione di comodo per generare in modo uniforme il markup delle
// icone al posto delle emoji: tutte prendono la classe base "icona-inline"
// (dimensione/allineamento) più una classe specifica per icona.
// ========================================================
function iconaSvg(nomeFile) {
    return `<img src="icons/${nomeFile}.svg" alt="" class="icona-inline icona-${nomeFile}">`;
}

// Calcola i km "coperti" da un allenamento, sia esso semplice (km diretti)
// sia a ripetute (somma delle distanze delle singole ripetute).
function calcolaKmAllenamento(att) {
    if (!att || att.tipo !== "allenamento") return 0;

    if (att.tipoAllenamento === "ripetute") {
        if (!Array.isArray(att.ripetute)) return 0;
        const metri = att.ripetute.reduce((tot, r) => {
            const d = parseFloat(r.distanza);
            return tot + (isNaN(d) ? 0 : d);
        }, 0);
        return metri / 1000;
    }

    const km = parseFloat(att.km);
    return isNaN(km) ? 0 : km;
}

// Calcola lo stato di forma attuale confrontando il carico (km) dell'ultima
// settimana con quello della settimana precedente, e il tempo dall'ultimo
// allenamento svolto.
function calcolaFormaAttuale(attivitaSalvate) {
    const oggi = new Date();
    const seteGiorniFa = new Date(oggi);
    seteGiorniFa.setDate(oggi.getDate() - 7);
    const quattordiciGiorniFa = new Date(oggi);
    quattordiciGiorniFa.setDate(oggi.getDate() - 14);

    const allenamenti = (attivitaSalvate || []).filter(a => a.tipo === "allenamento");

    const kmUltimaSettimana = allenamenti
        .filter(a => {
            const d = new Date(a.data);
            return d >= seteGiorniFa && d <= oggi;
        })
        .reduce((tot, a) => tot + calcolaKmAllenamento(a), 0);

    const kmSettimanaPrecedente = allenamenti
        .filter(a => {
            const d = new Date(a.data);
            return d >= quattordiciGiorniFa && d < seteGiorniFa;
        })
        .reduce((tot, a) => tot + calcolaKmAllenamento(a), 0);

    let stato;
    if (allenamenti.length === 0) {
        stato = "Nessun allenamento registrato";
    } else if (kmUltimaSettimana === 0) {
        stato = "Fermo questa settimana";
    } else if (kmSettimanaPrecedente === 0) {
        stato = "Ripresa dell'attività";
    } else {
        const rapporto = kmUltimaSettimana / kmSettimanaPrecedente;
        if (rapporto > 1.15) stato = `Carico in aumento ${iconaSvg("graficoAlto")}`;
        else if (rapporto < 0.85) stato = `Carico in calo ${iconaSvg("graficoBasso")}`;
        else stato = `Carico stabile ${iconaSvg("lineaDritta")}`;
    }

    let recupero = "-";
    if (allenamenti.length > 0) {
        const ordinati = allenamenti.slice().sort((a, b) => new Date(b.data) - new Date(a.data));
        const ultimo = new Date(ordinati[0].data);
        const giorni = Math.round((oggi - ultimo) / (1000 * 60 * 60 * 24));
        if (giorni <= 0) recupero = "Ultimo allenamento oggi";
        else if (giorni === 1) recupero = "Ultimo allenamento ieri";
        else recupero = `Ultimo allenamento ${giorni} giorni fa`;
    }

    return {
        stato,
        kmSettimana: kmUltimaSettimana.toFixed(1),
        recupero
    };
}

// Unisce i PB "iniziali" (dichiarati nel profilo) con quelli ricavati dalle
// gare registrate, tenendo per ogni distanza il tempo migliore.
function calcolaPB(attivitaSalvate, profilo) {
    const mappa = {};

    function registra(distanzaRaw, tempoStr, extra) {
        const secondi = tempoGaraInSecondi(tempoStr);
        if (!secondi || secondi <= 0) return;
        const chiave = normalizzaDistanza(distanzaRaw);
        if (!chiave) return;
        const esistente = mappa[chiave];
        if (!esistente || secondi < esistente.secondi) {
            mappa[chiave] = Object.assign({
                distanzaLabel: distanzaRaw,
                secondi,
                tempoStr
            }, extra);
        }
    }

    ((profilo && profilo.pbIniziali) || []).forEach(pb => {
        registra(pb.distanza, pb.tempo, {
            fonte: "iniziale",
            luogo: pb.luogo || "",
            data: pb.data || "",
            passaggi: pb.passaggi || []
        });
    });

    (attivitaSalvate || []).filter(a => a.tipo === "gara").forEach(g => {
        registra(g.tipoGara, g.tempo, {
            fonte: "gara",
            luogo: g.luogo || "",
            data: g.data || "",
            passaggi: g.passaggi || []
        });
    });

    return mappa;
}

// Confronta l'ultima gara registrata con il PB della stessa distanza per
// dare un'indicazione sintetica del trend di forma in gara.
function calcolaTrendGenerale(attivitaSalvate, pbMap) {
    const gare = (attivitaSalvate || [])
        .filter(a => a.tipo === "gara")
        .slice()
        .sort((a, b) => new Date(b.data) - new Date(a.data));

    if (gare.length === 0) return "-";

    const ultima = gare[0];
    const chiave = normalizzaDistanza(ultima.tipoGara);
    const pb = pbMap[chiave];
    if (!pb) return "-";

    const secUltima = tempoGaraInSecondi(ultima.tempo);
    if (secUltima <= pb.secondi + 0.001) return `Nuovo PB! ${iconaSvg("festa")}`;

    const scarto = (secUltima - pb.secondi) / pb.secondi;
    if (scarto <= 0.02) return `Vicino al PB! ${iconaSvg("lineaAlto")}`;
    if (scarto <= 0.05) return `Buona condizione! ${iconaSvg("lineaAlto")}`;
    return `In costruzione ${iconaSvg("costruzione")}`;
}

// Interpola linearmente tra due colori RGB in base a una frazione 0-1.
function mixColori(c1, c2, frazione) {
    return [
        Math.round(c1[0] + (c2[0] - c1[0]) * frazione),
        Math.round(c1[1] + (c2[1] - c1[1]) * frazione),
        Math.round(c1[2] + (c2[2] - c1[2]) * frazione)
    ];
}

// Dato uno scarto percentuale rispetto al passo medio ideale, restituisce un
// colore su un gradiente continuo: blu (troppo piano) -> verde (giusto) ->
// rosso (troppo veloce).
function coloreDaScarto(scarto) {
    const LIMITE = 0.08; // oltre l'8% di scarto il colore satura del tutto
    const t = Math.max(-1, Math.min(1, scarto / LIMITE));

    const verde = [28, 200, 138];  // passo giusto
    const blu   = [78, 115, 223];  // troppo piano
    const rosso = [231, 74, 59];   // troppo veloce

    const colore = t >= 0 ? mixColori(verde, blu, t) : mixColori(verde, rosso, -t);
    return `rgb(${colore[0]}, ${colore[1]}, ${colore[2]})`;
}

function etichettaScarto(scarto) {
    if (scarto > 0.02) return "troppo piano";
    if (scarto < -0.02) return "troppo veloce";
    return "passo giusto";
}

// Estrae la distanza di una gara in metri (es. "800m" -> 800). Ritorna null
// se non riesce a interpretarla.
function parseDistanzaMetri(distanzaRaw) {
    if (!distanzaRaw) return null;
    const match = String(distanzaRaw).match(/\d+/);
    if (!match) return null;
    const val = parseInt(match[0], 10);
    return val > 0 ? val : null;
}

// Curve di passo "tipiche" per alcune distanze: valori di riferimento
// generali (NON calcolati sui dati specifici dell'atleta) che tengono conto
// di pattern noti, es. negli 800m il primo giro è tipicamente un po' più
// veloce del secondo. Servono solo per non segnalare come "anomalia" un
// pattern che è normale per quella distanza. Facilmente estendibile: basta
// aggiungere una voce con un array di fattori (uno per ogni tratto da 200m,
// media 1.0) della stessa lunghezza del numero di tratti attesi.
const CURVA_PASSO_TIPICA = {
    "400": [0.99, 1.01],
    "800": [0.985, 1.005, 1.0, 1.01]
};

function curvaPassoAttesa(distanzaMetri, nTratti) {
    const curva = distanzaMetri && CURVA_PASSO_TIPICA[String(distanzaMetri)];
    return (curva && curva.length === nTratti) ? curva : null;
}

// Analizza i passaggi di una gara/PB. L'utente può inserirli in due modi
// diversi, e la funzione capisce da sola quale dei due sta usando:
//  - tempi CUMULATIVI al cronometro, es. per un 800m: "28.5,1:01.1,1:30.9"
//    (più il tempo finale, aggiunto automaticamente se manca);
//  - tempi già divisi per singolo tratto, es. "25.0,27.48" per un 400m
//    (che sommati devono dare circa il tempo totale della gara).
// Il modo per distinguerli: se la somma dei valori inseriti è già vicina
// al tempo totale della gara, sono tratti singoli; se invece la somma è
// molto più alta (perché ogni valore è una lettura cumulativa crescente),
// sono passaggi al cronometro e va calcolata la differenza tra l'uno e
// l'altro.
//
// In entrambi i casi, poi, non sappiamo a priori se ogni tratto ottenuto
// corrisponde a un 200m o a un 400m (nelle gare più lunghe spesso si
// registra solo il 400). Per capirlo da sola, la funzione calcola il passo
// medio "di riferimento" ogni 200m per QUESTA prestazione (tempo totale /
// distanza * 200) e confronta ogni tratto con questo riferimento: se è
// ~1 volta è un 200, se è ~2 volte è un 400 (diviso in due tratti da 200
// assumendo passo costante al suo interno), se è ~N volte è un tratto da
// N*200 (utile per gare lunghe con passaggi al km).
const MAX_TRATTI_PISTA = 40; // oltre non ha senso visualizzarli singolarmente
const TOLLERANZA_TRATTI_SINGOLI = 0.12; // 12% di margine per riconoscere i tratti già singoli

function analizzaPassaggi(passaggiArr, tempoTotaleStr, distanzaGaraRaw) {
    if (!Array.isArray(passaggiArr) || passaggiArr.length === 0) return [];

    const tempoTotaleSec = tempoGaraInSecondi(tempoTotaleStr);
    const distanzaMetri = parseDistanzaMetri(distanzaGaraRaw);
    if (!tempoTotaleSec || tempoTotaleSec <= 0) return [];

    // Passo di riferimento ogni 200m per QUESTA prestazione specifica: si
    // adatta da sola sia a gare veloci (es. 400m) sia a gare lunghe e lente
    // (es. 10000m), senza bisogno di soglie fisse.
    const passoRiferimento200 = distanzaMetri ? (tempoTotaleSec / distanzaMetri) * 200 : null;

    const valori = passaggiArr.map(tempoGaraInSecondi).filter(s => s > 0);
    if (valori.length === 0) return [];

    const somma = valori.reduce((a, b) => a + b, 0);
    const sonoTrattiSingoli = Math.abs(somma - tempoTotaleSec) / tempoTotaleSec < TOLLERANZA_TRATTI_SINGOLI;

    let intervalli;
    if (sonoTrattiSingoli) {
        // Sono già i tempi di ogni tratto, nell'ordine in cui sono stati
        // corsi: non vanno né ordinati né trasformati in differenze.
        intervalli = valori.slice();
        const differenzaFinale = tempoTotaleSec - somma;
        if (differenzaFinale > 0.5) intervalli.push(differenzaFinale);
    } else {
        // Sono letture cumulative al cronometro: vanno ordinate e trasformate
        // in differenze tra un passaggio e il successivo.
        const cumulativi = valori.slice().sort((a, b) => a - b);
        const ultimo = cumulativi[cumulativi.length - 1];
        if (Math.abs(ultimo - tempoTotaleSec) > 0.3) {
            cumulativi.push(tempoTotaleSec);
        }

        intervalli = [];
        let precedente = 0;
        cumulativi.forEach(c => {
            const diff = c - precedente;
            if (diff > 0) intervalli.push(diff);
            precedente = c;
        });
    }

    if (intervalli.length === 0) return [];

    // Per ogni intervallo capisce quanti "tratti da 200" rappresenta e li
    // suddivide in tratti singoli (assumendo passo costante all'interno
    // dell'intervallo, dato che non abbiamo un dato più preciso).
    const tratti = [];
    intervalli.forEach(diff => {
        let nTratti = 1;
        if (passoRiferimento200 && passoRiferimento200 > 0) {
            nTratti = Math.max(1, Math.round(diff / passoRiferimento200));
        }
        const tempoTratto = diff / nTratti;
        for (let i = 0; i < nTratti; i++) {
            tratti.push(tempoTratto);
        }
    });

    if (tratti.length > MAX_TRATTI_PISTA) return [];

    // Riferimento per lo scarto colore: se esiste una curva di passo tipica
    // per questa distanza/numero di tratti, ogni tratto viene confrontato
    // con il proprio ideale personalizzato; altrimenti si usa un passo medio
    // piatto per tutti i tratti.
    const idealeMedio = passoRiferimento200 || (tratti.reduce((a, b) => a + b, 0) / tratti.length);
    const curva = curvaPassoAttesa(distanzaMetri, tratti.length);

    return tratti.map((s, i) => {
        const ideale = curva ? idealeMedio * curva[i] : idealeMedio;
        const scarto = (s - ideale) / ideale;
        return {
            distanzaLabel: `~200m #${i + 1}`,
            tempoStr: formattaTempoGara(s),
            scarto,
            etichetta: etichettaScarto(scarto),
            colore: coloreDaScarto(scarto)
        };
    });
}

// Restituisce il valore più frequente (moda) di un array di stringhe/numeri,
// utile per capire il "tipo" prevalente di ripetuta (es. 400, 300, 600...).
function calcolaModa(valori) {
    const conteggi = {};
    let modaVal = null;
    let modaCount = 0;
    valori.forEach(v => {
        if (v === undefined || v === null || v === "") return;
        conteggi[v] = (conteggi[v] || 0) + 1;
        if (conteggi[v] > modaCount) {
            modaCount = conteggi[v];
            modaVal = v;
        }
    });
    return modaVal;
}

// Calcola le metriche di una sessione a ripetute, usate per il confronto
// multi-dimensionale (radar) e per il grafico di andamento tra sessioni simili.
function calcolaMetricheRipetute(att) {
    const ripetute = Array.isArray(att.ripetute) ? att.ripetute : [];

    const numRipetuteTotali = ripetute.length;
    const numSerie = ripetute.reduce((max, r) => Math.max(max, r.serie || 1), 0);

    const tempiValidi = ripetute.map(r => r.tempo).filter(t => t && t.includes(":"));
    const tempoMedioStr = mediaTempi(tempiValidi);
    const tempoMedioSec = tempoMedioStr !== "-" ? tempoInSecondi(tempoMedioStr) : 0;

    const metriTotali = ripetute.reduce((tot, r) => {
        const d = parseFloat(r.distanza);
        return tot + (isNaN(d) ? 0 : d);
    }, 0);
    const secondiLavoroTotali = ripetute.reduce((tot, r) => {
        return tot + (r.tempo && r.tempo.includes(":") ? tempoInSecondi(r.tempo) : 0);
    }, 0);

    const kmTotali = metriTotali / 1000;
    const ritmoAlKmSec = kmTotali > 0 ? secondiLavoroTotali / kmTotali : 0;

    const sensazioneValore = att.valutazione ? parseInt(att.valutazione, 10) : 3;

    const tipoRipetuta = calcolaModa(ripetute.map(r => r.distanza));
    const recuperoRipeteSec = tempoGaraInSecondi(att.recuperoRipetute);
    const recuperoSerieSec = tempoGaraInSecondi(att.recuperoSerie);

    return {
        numSerie,
        numRipetuteTotali,
        tempoMedioSec,
        ritmoAlKmSec,
        sensazioneValore,
        tipoRipetuta,
        recuperoRipeteSec,
        recuperoSerieSec
    };
}
// ========================================================
// FAMIGLIE DI RIPETUTE (per raggruppare solo allenamenti davvero simili)
// ========================================================
const FAMIGLIE_RIPETUTE = [
    { nome: "Velocità pura", distanze: [30, 40, 50, 60, 80, 100] },
    { nome: "Velocità resistente", distanze: [120, 150, 200, 250] },
    { nome: "Mezzofondo veloce", distanze: [300, 400, 500, 600] },
    { nome: "Mezzofondo prolungato", distanze: [800, 1000, 1200, 1500, 2000] }
];

function trovaFamigliaRipetuta(distanzaMetri) {
    if (!distanzaMetri || isNaN(distanzaMetri)) return "Altro";
    const famiglia = FAMIGLIE_RIPETUTE.find(f => f.distanze.includes(Math.round(distanzaMetri)));
    return famiglia ? famiglia.nome : "Altro";
}

// ========================================================
// INDICE DI FORMA (stima euristica, non una previsione scientifica)
// Combina passo di lavoro, recupero e volume di un gruppo di sessioni
// simili, normalizzando ciascuna metrica rispetto al range osservato nel
// gruppo stesso (min-max scaling), per dare un indice 0-100 relativo al
// periodo analizzato.
// ========================================================
function calcolaIndiceForma(metriche) {
    const ritmi = metriche.map(m => m.ritmoAlKmSec).filter(v => v > 0);
    const recuperi = metriche.map(m => m.recuperoRipeteSec).filter(v => v > 0);
    const volumi = metriche.map(m => m.numSerie * m.numRipetuteTotali);

    const minRitmo = ritmi.length ? Math.min(...ritmi) : null;
    const maxRitmo = ritmi.length ? Math.max(...ritmi) : null;
    const minRecupero = recuperi.length ? Math.min(...recuperi) : null;
    const maxRecupero = recuperi.length ? Math.max(...recuperi) : null;
    const minVolume = Math.min(...volumi);
    const maxVolume = Math.max(...volumi);

    return metriche.map(m => {
        const puntoPasso = (minRitmo !== null && maxRitmo > minRitmo && m.ritmoAlKmSec > 0)
            ? 100 - ((m.ritmoAlKmSec - minRitmo) / (maxRitmo - minRitmo)) * 100
            : 50;

        const puntoRecupero = (minRecupero !== null && maxRecupero > minRecupero && m.recuperoRipeteSec > 0)
            ? 100 - ((m.recuperoRipeteSec - minRecupero) / (maxRecupero - minRecupero)) * 100
            : 50;

        const volumeSessione = m.numSerie * m.numRipetuteTotali;
        const puntoVolume = (maxVolume > minVolume)
            ? ((volumeSessione - minVolume) / (maxVolume - minVolume)) * 100
            : 50;

        return Math.round(puntoPasso * 0.5 + puntoRecupero * 0.3 + puntoVolume * 0.2);
    });
}

// ========================================================
// ANALISI INCROCIATA ALLENAMENTI <-> GARE
// Usa gli allenamenti registrati nel periodo prima di una gara per dare un
// contesto alla prestazione: volume, sessioni di qualità pertinenti per
// quella distanza, confronto tra passo di lavoro e passo gara, ed
// eventuale scarico pre-gara. È un'analisi statistica descrittiva sui dati
// inseriti, non una previsione: più allenamenti vengono registrati, più
// diventa precisa (con poche sessioni segnala che i dati non bastano).
// ========================================================

// Per ogni distanza di gara, indica quali "famiglie" di ripetute sono più
// rilevanti da guardare negli allenamenti (facilmente estendibile).
const FAMIGLIA_RILEVANTE_PER_GARA = {
    60: ["Velocità pura"],
    100: ["Velocità pura"],
    150: ["Velocità pura", "Velocità resistente"],
    200: ["Velocità pura", "Velocità resistente"],
    300: ["Velocità resistente", "Mezzofondo veloce"],
    400: ["Velocità resistente", "Mezzofondo veloce"],
    600: ["Mezzofondo veloce"],
    800: ["Mezzofondo veloce", "Mezzofondo prolungato"],
    1000: ["Mezzofondo veloce", "Mezzofondo prolungato"],
    1500: ["Mezzofondo veloce", "Mezzofondo prolungato"],
    3000: ["Mezzofondo prolungato"],
    5000: ["Mezzofondo prolungato"],
    10000: ["Mezzofondo prolungato"]
};

function trovaFamiglieRilevantiGara(distanzaGaraMetri) {
    const chiavi = Object.keys(FAMIGLIA_RILEVANTE_PER_GARA).map(Number);
    if (!distanzaGaraMetri) return FAMIGLIA_RILEVANTE_PER_GARA[800];
    const piuVicina = chiavi.reduce((migliore, chiave) => {
        return Math.abs(chiave - distanzaGaraMetri) < Math.abs(migliore - distanzaGaraMetri) ? chiave : migliore;
    }, chiavi[0]);
    return FAMIGLIA_RILEVANTE_PER_GARA[piuVicina];
}

// Analizza il "contesto" di allenamento nei giorni precedenti una gara.
// garaDataStr: data della gara (es. "2026-05-01")
// garaTempoStr: tempo finale della gara (es. "2:02.25")
// distanzaGaraRaw: distanza della gara (es. "800m")
// attivitaSalvate: tutte le attività registrate (allenamenti + gare)
function analizzaContestoAllenamento(garaDataStr, garaTempoStr, distanzaGaraRaw, attivitaSalvate, finestraGiorni) {
    finestraGiorni = finestraGiorni || 21;

    const dataGara = new Date(garaDataStr);
    if (isNaN(dataGara.getTime())) return null;

    const distanzaGaraMetri = parseDistanzaMetri(distanzaGaraRaw);
    const tempoGaraSec = tempoGaraInSecondi(garaTempoStr);
    const passoGaraSecKm = (distanzaGaraMetri && tempoGaraSec)
        ? (tempoGaraSec / distanzaGaraMetri) * 1000
        : null;

    const inizioFinestra = new Date(dataGara);
    inizioFinestra.setDate(inizioFinestra.getDate() - finestraGiorni);

    const allenamentiFinestra = (attivitaSalvate || []).filter(a => {
        if (a.tipo !== "allenamento") return false;
        const d = new Date(a.data);
        return d >= inizioFinestra && d <= dataGara;
    });

    const kmTotali = allenamentiFinestra.reduce((tot, a) => tot + calcolaKmAllenamento(a), 0);

    const famiglieRilevanti = trovaFamiglieRilevantiGara(distanzaGaraMetri);

    const sessioniQualita = allenamentiFinestra.filter(a => {
        if (a.tipoAllenamento !== "ripetute") return false;
        const m = calcolaMetricheRipetute(a);
        return famiglieRilevanti.includes(trovaFamigliaRipetuta(parseFloat(m.tipoRipetuta)));
    });

    const metricheQualita = sessioniQualita.map(calcolaMetricheRipetute);
    const ritmiQualita = metricheQualita.map(m => m.ritmoAlKmSec).filter(v => v > 0);
    const recuperiQualita = metricheQualita.map(m => m.recuperoRipeteSec).filter(v => v > 0);

    const passoAllenamentoMedioSecKm = ritmiQualita.length
        ? ritmiQualita.reduce((a, b) => a + b, 0) / ritmiQualita.length
        : null;
    const recuperoMedioSec = recuperiQualita.length
        ? recuperiQualita.reduce((a, b) => a + b, 0) / recuperiQualita.length
        : null;

    // Rilevamento scarico: ultima settimana pre-gara vs settimana precedente.
    const inizioUltimaSettimana = new Date(dataGara);
    inizioUltimaSettimana.setDate(inizioUltimaSettimana.getDate() - 7);
    const inizioSettimanaPrecedente = new Date(dataGara);
    inizioSettimanaPrecedente.setDate(inizioSettimanaPrecedente.getDate() - 14);

    const kmUltimaSettimana = allenamentiFinestra
        .filter(a => new Date(a.data) >= inizioUltimaSettimana && new Date(a.data) <= dataGara)
        .reduce((tot, a) => tot + calcolaKmAllenamento(a), 0);
    const kmSettimanaPrecedente = allenamentiFinestra
        .filter(a => new Date(a.data) >= inizioSettimanaPrecedente && new Date(a.data) < inizioUltimaSettimana)
        .reduce((tot, a) => tot + calcolaKmAllenamento(a), 0);

    let scarico = "dati_insufficienti";
    if (kmSettimanaPrecedente > 0) {
        const rapporto = kmUltimaSettimana / kmSettimanaPrecedente;
        if (rapporto < 0.75) scarico = "scarico";
        else if (rapporto > 1.15) scarico = "carico_alto";
        else scarico = "stabile";
    }

    let confrontoPasso = null;
    if (passoGaraSecKm && passoAllenamentoMedioSecKm) {
        const scarto = (passoGaraSecKm - passoAllenamentoMedioSecKm) / passoAllenamentoMedioSecKm;
        confrontoPasso = {
            passoGaraSecKm,
            passoAllenamentoMedioSecKm,
            scarto,
            garaPiuVeloce: scarto < 0
        };
    }

    return {
        finestraGiorni,
        kmTotali,
        numSessioniQualita: sessioniQualita.length,
        famiglieRilevanti,
        passoAllenamentoMedioSecKm,
        recuperoMedioSec,
        scarico,
        kmUltimaSettimana,
        kmSettimanaPrecedente,
        confrontoPasso,
        datiSufficienti: sessioniQualita.length >= 2
    };
}