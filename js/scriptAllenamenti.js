// ========================================================
// SCRIPTALLENAMENTI.JS - Logica della Pagina Allenamenti e Form
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    // ELEMENTI DOM
    const btnAggiungi = document.querySelector(".aggiungiAttivita, .aggiungiAllenamento");
    const listaAllenamentiPagina = document.getElementById("listaAllenamenti");
    const modal = document.getElementById("modalAttivita");
    const btnAnnulla = document.getElementById("annullaModal");
    const form = document.getElementById("formAttivita");

    const tipoAttivita = document.getElementById("tipoAttivita");
    const sezioneAllenamento = document.querySelector(".sezioneAllenamento");
    const sezioneGara = document.getElementById("sezioneGara");

    const tipoAllenamento = document.getElementById("tipoAllenamento");
    const allenamentoSemplice = document.getElementById("allenamentoSemplice");
    const allenamentoRipetute = document.getElementById("allenamentoRipetute");

    const kmInput = document.getElementById("km");
    const tempoTotaleInput = document.getElementById("tempoTotale");
    const ritmoCalcolato = document.getElementById("ritmoCalcolato");

    const descrizioneRipetute = document.getElementById("descrizioneRipetute");
    const listaRipetute = document.getElementById("listaRipetute");

    let attivitaSalvate = caricaAttivita();
    let idAttivitaInModifica = null;
    let graficiAllenamenti = [];

    function nascondiTutteSezioni() {
        if (sezioneAllenamento) sezioneAllenamento.style.display = "none";
        if (sezioneGara) sezioneGara.style.display = "none";
        if (allenamentoSemplice) allenamentoSemplice.style.display = "none";
        if (allenamentoRipetute) allenamentoRipetute.style.display = "none";
    }

    if (tipoAttivita) {
        tipoAttivita.addEventListener("change", (e) => {
            nascondiTutteSezioni();
            if (e.target.value === "allenamento") {
                if (sezioneAllenamento) sezioneAllenamento.style.display = "block";
                if (tipoAllenamento) tipoAllenamento.dispatchEvent(new Event("change"));
            } else if (e.target.value === "gara" && sezioneGara) {
                sezioneGara.style.display = "block";
            }
        });
    }

    if (tipoAllenamento) {
        tipoAllenamento.addEventListener("change", (e) => {
            if (allenamentoSemplice) allenamentoSemplice.style.display = "none";
            if (allenamentoRipetute) allenamentoRipetute.style.display = "none";
            
            if (e.target.value === "ripetute") {
                if (allenamentoRipetute) allenamentoRipetute.style.display = "block";
            } else if (e.target.value !== "") {
                if (allenamentoSemplice) allenamentoSemplice.style.display = "block";
            }
        });
    }

    function apriModal(id = null) {
        form.reset();
        idAttivitaInModifica = id;
        if (listaRipetute) listaRipetute.innerHTML = "";
        if (ritmoCalcolato) ritmoCalcolato.textContent = "-";

        if (id === null) {
            if (tipoAttivita) {
                tipoAttivita.value = 'allenamento';
                tipoAttivita.dispatchEvent(new Event("change"));
            }
            const dataInput = document.getElementById("dataAttivita");
            if (dataInput) dataInput.valueAsDate = new Date();
        }
        modal.classList.add("show");
    }

    if (btnAggiungi) btnAggiungi.addEventListener("click", () => apriModal());
    if (btnAnnulla) {
        btnAnnulla.addEventListener("click", () => {
            modal.classList.remove("show");
            idAttivitaInModifica = null;
        });
    }

    function aggiornaRitmo() {
        if (ritmoCalcolato && kmInput && tempoTotaleInput) {
            ritmoCalcolato.textContent = calcolaRitmo(parseFloat(kmInput.value), tempoTotaleInput.value);
        }
    }
    kmInput?.addEventListener("input", aggiornaRitmo);
    tempoTotaleInput?.addEventListener("input", aggiornaRitmo);

    // UX FIX: Usiamo "blur" (quando l'utente esce dal campo) per evitare di cancellare i dati scritti a metà digitazione
    descrizioneRipetute?.addEventListener("blur", generazioneCampiRipetuteCampi);

    function generazioneCampiRipetuteCampi() {
        const testo = descrizioneRipetute.value.trim().replace(/\s+/g, "");
        listaRipetute.innerHTML = "";
        if (!testo) return;

        const regex = /^(\d+)[xX](?:\((.+)\)|(\d+))$/;
        const match = testo.match(regex);
        if (!match) return;

        const serieTotali = parseInt(match[1], 10);
        const distanzaRaw = match[2] || match[3]; 
        const subDistanze = distanzaRaw.includes("-") ? distanzaRaw.split("-") : [distanzaRaw];

        for (let i = 1; i <= serieTotali; i++) {
            const div = document.createElement("div");
            div.className = "blocco-ripetuta";
            
            let inputsHtml = "";
            subDistanze.forEach(dist => {
                inputsHtml += `
                    <input 
                        type="text" 
                        class="input-tempo-giro" 
                        data-serie="${i}" 
                        data-distanza="${dist}" 
                        placeholder="${dist}m (mm:ss)">
                `;
            });

            div.innerHTML = `
                <label>Serie #${i}</label>
                <div class="gruppo-input-tempi">${inputsHtml}</div>
            `;
            listaRipetute.appendChild(div);
        }
    }

    // SALVATAGGIO FORM
    form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const dataAttivitaEl = document.getElementById("dataAttivita");

        if (!tipoAttivita?.value) return alert("Seleziona il tipo di attività");
        if (!dataAttivitaEl?.value) return alert("Seleziona la data");

        const nuovaAttivita = {
            id: idAttivitaInModifica ? idAttivitaInModifica : Date.now(),
            tipo: tipoAttivita.value,
            data: dataAttivitaEl.value,
            sensazioni: document.getElementById("sensazioni").value
        };

        if (nuovaAttivita.tipo === "allenamento") {
            if (!tipoAllenamento?.value) return alert("Seleziona il tipo di allenamento");
            nuovaAttivita.tipoAllenamento = tipoAllenamento.value;

            if (tipoAllenamento.value === "ripetute") {
                const testo = (descrizioneRipetute?.value || "").trim().replace(/\s+/g, "");
                if (!testo.match(/^(\d+)[xX](?:\((.+)\)|(\d+))$/)) {
                    return alert("Formato ripetute errato (es. 5x600 o 5x(600-300))");
                }

                const inputsTempi = Array.from(document.querySelectorAll(".input-tempo-giro"));
                if (inputsTempi.length === 0) return alert("Inserisci i tempi delle ripetute");
                if (!inputsTempi.every(i => i.value.trim() !== "")) return alert("Inserisci tutti i tempi generati");

                nuovaAttivita.descrizione = testo;
                nuovaAttivita.ripetute = inputsTempi.map((input, index) => ({
                    numero: index + 1,
                    serie: parseInt(input.dataset.serie, 10),
                    distanza: input.dataset.distanza,
                    tempo: input.value.trim()
                }));
            } else {
                const km = parseFloat(kmInput?.value);
                const tempo = (tempoTotaleInput?.value || "").trim();

                if (!Number.isFinite(km) || km <= 0) return alert("Inserisci un chilometraggio valido");
                if (!tempo.includes(":")) return alert("Inserisci il tempo in formato mm:ss o hh:mm:ss");

                const ritmo = calcolaRitmo(km, tempo);
                if (ritmo === "-") return alert("Tempo o chilometri non validi");

                nuovaAttivita.km = km;
                nuovaAttivita.tempo = tempo;
                nuovaAttivita.ritmo = ritmo;
            }
        } else if (nuovaAttivita.tipo === "gara") {
            nuovaAttivita.tipoGara = document.getElementById("tipoGara").value;
            nuovaAttivita.luogo = document.getElementById("luogoGara").value;
            nuovaAttivita.tempo = document.getElementById("tempoGara").value;
        }

        if (idAttivitaInModifica) {
            const index = attivitaSalvate.findIndex(a => a.id === idAttivitaInModifica);
            if (index !== -1) attivitaSalvate[index] = nuovaAttivita;
        } else {
            attivitaSalvate.unshift(nuovaAttivita);
        }

        salvaAttivita(attivitaSalvate);
        modal.classList.remove("show");
        idAttivitaInModifica = null;
        renderPaginaAllenamenti();
    });

    function valoreGraficoAllenamento(att) {
        if (att.tipoAllenamento === "ripetute") {
            const tempi = att.ripetute ? att.ripetute.map(r => r.tempo) : [];
            return tempoInSecondi(mediaTempi(tempi));
        }
        return (att.ritmo && att.ritmo.includes(":")) ? tempoInSecondi(att.ritmo) : null;
    }

    function renderPaginaAllenamenti() {
        if (!listaAllenamentiPagina) return;

        graficiAllenamenti.forEach(g => g.destroy());
        graficiAllenamenti = [];

        const allenamenti = attivitaSalvate.filter(a => a.tipo === "allenamento");
        listaAllenamentiPagina.innerHTML = "";

        if (allenamenti.length === 0) {
            listaAllenamentiPagina.innerHTML = "<p>Non è stato aggiunto ancora nessun allenamento</p>";
            return;
        }

        allenamenti.forEach(att => {
            const card = document.createElement("div");
            card.className = "card allenamento-card";
            let dettagli = "";

            if (att.tipoAllenamento === "ripetute") {
                const tempiValidi = att.ripetute ? att.ripetute.map(r => r.tempo) : [];
                dettagli = `
                    <strong>Descrizione:</strong> ${att.descrizione || ""}<br>
                    <strong>Tempo medio:</strong> ${mediaTempi(tempiValidi)}<br>
                `;
            } else {
                dettagli = `
                    <strong>Distanza:</strong> ${att.km || ""} km<br>
                    <strong>Tempo:</strong> ${att.tempo || ""}<br>
                    <strong>Ritmo:</strong> ${att.ritmo || ""} /km<br>
                `;
            }

            const canvasId = `graficoAllenamento-${att.id}`;
            card.innerHTML = `
                <div class="card-header">
                    <span>Allenamento - ${att.tipoAllenamento}</span>
                    ${generaHtmlMenu(att.id)}
                </div>
                <div class="card-body">
                    ${dettagli}
                    <strong>Data:</strong> ${formattaData(att.data)}<br>
                    ${att.sensazioni ? `<strong>Sensazioni:</strong> ${att.sensazioni}<br>` : ""}
                    <div class="grafico-allenamento"><canvas id="${canvasId}"></canvas></div>
                </div>
            `;
            listaAllenamentiPagina.appendChild(card);

            const simili = allenamenti
                .filter(a => a.tipoAllenamento === att.tipoAllenamento)
                .slice()
                .sort((a, b) => new Date(a.data) - new Date(b.data));

            const labels = simili.map(a => formattaData(a.data));
            const valori = simili.map(a => valoreGraficoAllenamento(a));
            const ctx = document.getElementById(canvasId);

            if (ctx && typeof Chart !== "undefined") {
                const grafico = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: labels,
                        datasets: [{
                            label: att.tipoAllenamento === "ripetute" ? "Tempo medio" : "Ritmo al km",
                            data: valori,
                            borderColor: "#4e73df",
                            backgroundColor: "#4e73df",
                            tension: 0.35,
                            pointRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { ticks: { callback: value => secondiInFormato(value) } } }
                    }
                });
                graficiAllenamenti.push(grafico);
            }
        });
    }

    function avviaModificaAttivita(id) {
        const att = attivitaSalvate.find(a => a.id === id);
        if (!att) return;
        apriModal(att.id);

        tipoAttivita.value = att.tipo;
        document.getElementById("dataAttivita").value = att.data;
        document.getElementById("sensazioni").value = att.sensazioni || "";
        tipoAttivita.dispatchEvent(new Event("change"));

        if (att.tipo === "gara") {
            document.getElementById("tipoGara").value = att.tipoGara || "";
            document.getElementById("luogoGara").value = att.luogo || "";
            document.getElementById("tempoGara").value = att.tempo || "";
        } else {
            tipoAllenamento.value = att.tipoAllenamento;
            tipoAllenamento.dispatchEvent(new Event("change"));
            
            if (att.tipoAllenamento === "ripetute") {
                descrizioneRipetute.value = att.descrizione || "";
                generazioneCampiRipetuteCampi();
                const inputs = document.querySelectorAll(".input-tempo-giro");
                if (att.ripetute && inputs.length === att.ripetute.length) {
                    inputs.forEach((input, idx) => input.value = att.ripetute[idx].tempo || "");
                }
            } else {
                kmInput.value = att.km || "";
                tempoTotaleInput.value = att.tempo || "";
                ritmoCalcolato.textContent = att.ritmo || "-";
            }
        }
    }

    // Gestione click menu card interni alla pagina allenamenti
    document.addEventListener("click", (e) => {
        gestisciClickMenuCard(e, 
            (idDaEliminare) => {
                attivitaSalvate = attivitaSalvate.filter(a => a.id !== idDaEliminare);
                salvaAttivita(attivitaSalvate);
                renderPaginaAllenamenti();
            },
            (idDaModificare) => {
                avviaModificaAttivita(idDaModificare);
            }
        );
    });

    // Controllo se arriviamo dalla Home richiedendo una modifica immediata via Query String (es. ?modifica=123)
    const urlParams = new URLSearchParams(window.location.search);
    const idDaModificareEsterno = urlParams.get('modifica');
    
    renderPaginaAllenamenti();

    if (idDaModificareEsterno) {
        avviaModificaAttivita(Number(idDaModificareEsterno));
    }
});