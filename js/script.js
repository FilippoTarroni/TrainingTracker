// ========================================================
// SCRIPT.JS - Logica dell'Interfaccia Utente (DOM)
// ========================================================


document.addEventListener("DOMContentLoaded", () => {
    // ELEMENTI DOM
    const btnAggiungi = document.querySelector(".aggiungiAttivita, .aggiungiAllenamento");
    const listaAllenamentiPagina = document.getElementById("listaAllenamenti");
    const paginaAllenamenti = !listaAllenamentiPagina;
    let graficiAllenamenti = [];
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

    // DATI INIZIALI
    let attivitaSalvate = caricaAttivita();
    let idAttivitaInModifica = null;
    aggiornaInterfaccia();

    // GESTIONE SEZIONI FORM
    function nascondiTutteSezioni(){
        if(sezioneAllenamento) sezioneAllenamento.style.display="none";
        if(sezioneGara) sezioneGara.style.display="none";
        if(allenamentoSemplice) allenamentoSemplice.style.display="none";
        if(allenamentoRipetute) allenamentoRipetute.style.display="none";
    }

    if(tipoAttivita){
        tipoAttivita.addEventListener("change",(e)=>{
            nascondiTutteSezioni();
            if(e.target.value==="allenamento"){
                sezioneAllenamento.style.display="block";
                tipoAllenamento.dispatchEvent(new Event("change"));
            } else if(e.target.value==="gara"){
                sezioneGara.style.display="block";
            }
        });
    }

    if(tipoAllenamento){
        tipoAllenamento.addEventListener("change",(e)=>{
            allenamentoSemplice.style.display="none";
            allenamentoRipetute.style.display="none";
            if(e.target.value==="ripetute"){
                allenamentoRipetute.style.display="block";
            } else if(e.target.value!==""){
                allenamentoSemplice.style.display="block";
            }
        });
    }

    // APERTURA MODAL
    if(btnAggiungi){
        btnAggiungi.addEventListener("click",()=>{
            idAttivitaInModifica=null;
            form.reset();
            if(paginaAllenamenti && tipoAttivita){
                tipoAttivita.value = 'allenamento';
            }
            if(listaRipetute) listaRipetute.innerHTML="";
            if(ritmoCalcolato) ritmoCalcolato.textContent="-";
            if(tipoAttivita) tipoAttivita.dispatchEvent(new Event("change"));
            modal.classList.add("show");
            document.getElementById("dataAttivita").valueAsDate=new Date();
        });
    }

    // CHIUSURA MODAL
    if(btnAnnulla){
        btnAnnulla.addEventListener("click",()=>{
            modal.classList.remove("show");
            idAttivitaInModifica=null;
        });
    }

    // CALCOLO RITMO AUTOMATICO
    function aggiornaRitmo(){
        ritmoCalcolato.textContent = calcolaRitmo(
            parseFloat(kmInput.value),
            tempoTotaleInput.value
        );
    }

    kmInput?.addEventListener("input", aggiornaRitmo);
    tempoTotaleInput?.addEventListener("input", aggiornaRitmo);

    // ========================================================
    // MODIFICATO: GENERAZIONE INPUT COMPLESSI (es. 5x(600-300))
    // ========================================================
    descrizioneRipetute?.addEventListener("input",()=>{
        const testo = descrizioneRipetute.value.trim().replace(/\s+/g,"");
        listaRipetute.innerHTML="";
        if(!testo) return;

        const regex = /^(\d+)[xX](?:\((.+)\)|(\d+))$/;
        const match = testo.match(regex);
        if(!match) return;

        const serieTotali = parseInt(match[1], 10);
        const distanzaRaw = match[2] || match[3]; 
        
        // Se c'è un trattino (es. "600-300"), creiamo un array con le sub-distanze, altrimenti array singolo
        const subDistanze = distanzaRaw.includes("-") ? distanzaRaw.split("-") : [distanzaRaw];

        for(let i = 1; i <= serieTotali; i++){
            const div = document.createElement("div");
            div.className = "blocco-ripetuta";
            
            // Generiamo i singoli campi di testo per ogni ripetuta della serie attuale
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
                <div class="gruppo-input-tempi">
                    ${inputsHtml}
                </div>
            `;
            listaRipetute.appendChild(div);
        }
    });

    // SALVATAGGIO ATTIVITÀ
    form?.addEventListener("submit",(e)=>{
        e.preventDefault();
        const dataAttivitaE1 = document.getElementById("dataAttivita");

        if(!tipoAttivita || !tipoAttivita.value){
            alert("Seleziona il tipo di attività");
            return;
        }
        if(!dataAttivitaE1 || !dataAttivitaE1.value){
            alert("Seleziona la data");
            return;
        }

        const nuovaAttivita = {
            id: idAttivitaInModifica ? idAttivitaInModifica : Date.now(),
            tipo: tipoAttivita.value,
            data: dataAttivitaE1.value,
            sensazioni: document.getElementById("sensazioni").value
        };

        if(nuovaAttivita.tipo==="allenamento"){
            if(!tipoAllenamento || !tipoAllenamento.value){
                alert("Seleziona il tipo di allenamento");
                return;
            }

            nuovaAttivita.tipoAllenamento = tipoAllenamento.value;

            if(tipoAllenamento.value==="ripetute"){
                const descr = (descrizioneRipetute?.value || "").trim();
                const testo = descr.replace(/\s+/g,"");
                const match = testo.match(/^(\d+)[xX](?:\((.+)\)|(\d+))$/);

                if(!match){
                    alert("Inserisci le ripetute nel formato corretto (es. 5x600 o 5x(600-300))");
                    return;
                }

                const inputsTempi = Array.from(document.querySelectorAll(".input-tempo-giro"));
                if(inputsTempi.length == 0){
                    alert("Inserisci i tempi delle ripetute");
                    return;
                }

                const tuttiInseriti = inputsTempi.every(i=>i.value.trim() !== ""); 
                if(!tuttiInseriti){
                    alert("Inserisci il tempo di tutte le ripetute generate");
                    return;
                }
                
                nuovaAttivita.descrizione = testo;
                nuovaAttivita.ripetute = inputsTempi.map((input, index)=>({
                    numero: index+1,
                    serie: parseInt(input.dataset.serie, 10),
                    distanza: input.dataset.distanza,
                    tempo: input.value.trim()
                }));
            } else {
                const km=parseFloat(kmInput?.value);
                const tempo = (tempoTotaleInput?.value || "").trim();

                if(!Number.isFinite(km)||km<=0){
                    alert("Inserisci un chilometraggio valido");
                    return;
                }
                if(!tempo.includes(":")){
                    alert("Inserisci il tempo nel formato mm:ss o hh:mm:ss");
                    return;
                }
                const ritmo=calcolaRitmo(km, tempo);
                if(ritmo=="-"){
                    alert("Tempo non valido o km non validi");
                    return;
                }

                nuovaAttivita.km = km;
                nuovaAttivita.tempo = tempo;
                nuovaAttivita.ritmo = ritmo;
            }
        } else if(nuovaAttivita.tipo==="gara"){
            nuovaAttivita.tipoGara = document.getElementById("tipoGara").value;
            nuovaAttivita.luogo = document.getElementById("luogoGara").value;
            nuovaAttivita.tempo = document.getElementById("tempoGara").value;
        }

        if(idAttivitaInModifica){
            const index = attivitaSalvate.findIndex(a=>a.id===idAttivitaInModifica);
            if(index!==-1) attivitaSalvate[index]=nuovaAttivita;
        } else {
            attivitaSalvate.unshift(nuovaAttivita);
        }

        salvaAttivita(attivitaSalvate);
        aggiornaInterfaccia();
        modal.classList.remove("show");
    });

    // MENU CONTESTUALE CARD (MODIFICA / ELIMINA)
    document.addEventListener("click",(e)=>{
        const bottone = e.target.closest(".btn-menu-card");
        if(bottone){
            e.stopPropagation();
            const menu = bottone.nextElementSibling;
            document.querySelectorAll(".dropdown-menu-card").forEach(m=>{
                if(m!==menu) m.classList.remove("show");
            });
            menu.classList.toggle("show");
            return;
        }
        
        document.querySelectorAll(".dropdown-menu-card").forEach(m=>m.classList.remove("show"));

        if(e.target.matches(".elimina")){
            const id = Number(e.target.dataset.id);
            if(confirm("Eliminare definitivamente questa attività?")){
                attivitaSalvate = attivitaSalvate.filter(a=>a.id!==id);
                salvaAttivita(attivitaSalvate);
                aggiornaInterfaccia();
            }
        }

        if(e.target.matches(".modifica")){
            const id = Number(e.target.dataset.id);
            const att = attivitaSalvate.find(a=>a.id===id);
            if(!att) return;
            idAttivitaInModifica = att.id;

            tipoAttivita.value = att.tipo;
            document.getElementById("dataAttivita").value = att.data;
            document.getElementById("sensazioni").value = att.sensazioni || "";

            tipoAttivita.dispatchEvent(new Event("change"));

            if(att.tipo==="gara"){
                document.getElementById("tipoGara").value = att.tipoGara || "";
                document.getElementById("luogoGara").value = att.luogo || "";
                document.getElementById("tempoGara").value = att.tempo || "";
            } else {
                tipoAllenamento.value = att.tipoAllenamento;
                if(tipoAllenamento) tipoAllenamento.dispatchEvent(new Event("change"));
                
                if(att.tipoAllenamento === "ripetute") {
                    descrizioneRipetute.value = att.descrizione || "";
                    descrizioneRipetute.dispatchEvent(new Event("input"));
                    
                    // Ripopolamento automatico multi-input (funziona sia per singoli che per accoppiati!)
                    const inputs = document.querySelectorAll(".input-tempo-giro");
                    if(att.ripetute && inputs.length === att.ripetute.length) {
                        inputs.forEach((input, index) => {
                            input.value = att.ripetute[index].tempo || "";
                        });
                    }
                } else {
                    kmInput.value = att.km || "";
                    tempoTotaleInput.value = att.tempo || "";
                    ritmoCalcolato.textContent = att.ritmo || "-";
                }
            }
            modal.classList.add("show");
        }
    });

    // RENDER HOMEPAGE
    function generaHtmlMenu(id){
        return `
            <div class="menu-card-container">
                <button class="btn-menu-card">⋮</button>
                <div class="dropdown-menu-card">
                    <button class="dropdown-item-card modifica" data-id="${id}">Modifica attività</button>
                    <button class="dropdown-item-card elimina" data-id="${id}">Elimina attività</button>
                </div>
            </div>
        `;
    }

    function valoreGraficoAllenamento(att){
        if(att.tipoAllenamento=="ripetute"){
            const tempi= att.ripetute ? att.ripetute.map(r => r.tempo) : [];
            const media = mediaTempi(tempi);
            return tempoInSecondi(media);
        }
        if(att.ritmo && att.ritmo.includes(":")){
            return tempoInSecondi(att.ritmo);
        }
        return null;
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

                    <div class="grafico-allenamento">
                        <canvas id="${canvasId}"></canvas>
                    </div>
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
                            pointRadius: 5,
                            pointHoverRadius: 7
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                ticks: {
                                    callback: value => secondiInFormato(value)
                                }
                            }
                        }
                    }
                });

                graficiAllenamenti.push(grafico);
            }
        });
    }   

    function aggiornaInterfaccia(){
        renderPaginaAllenamenti();
        const storico = document.querySelector(".storicoHome .card-body");
        const ultimoAllenamento = document.querySelector("#ultimoAllenamentoHome .card-body");
        const headerAllenamento = document.querySelector("#ultimoAllenamentoHome .card-header span"); 
        const ultimaGara = document.querySelector("#ultimaGaraHome .card-body");
        const headerGara = document.querySelector("#ultimaGaraHome .card-header span");

        if(!storico) return;
        storico.innerHTML = "";

        if(attivitaSalvate.length === 0){
            storico.innerHTML = "<p>Non è stata aggiunta ancora nessuna attività</p>";
            if(ultimoAllenamento) ultimoAllenamento.innerHTML = "<p>Nessun dato</p>";
            if(ultimaGara) ultimaGara.innerHTML = "<p>Nessun dato</p>";
            return;
        }

        const allenamento = attivitaSalvate.find(a => a.tipo === "allenamento");
        const gara = attivitaSalvate.find(a => a.tipo === "gara");

        // RENDER ULTIMO ALLENAMENTO
        if(allenamento && ultimoAllenamento){
            if(headerAllenamento && tipoAllenamento!=""){
                headerAllenamento.textContent = `Ultimo Allenamento - ${allenamento.tipoAllenamento}`;
            }

            if(allenamento.tipoAllenamento === "ripetute"){
                const tempiValidi = allenamento.ripetute ? allenamento.ripetute.filter(r => r.tempo && r.tempo.trim() !== "" && r.tempo.includes(":")) : [];
                let tempoMedioStr = "-";
                
                if(tempiValidi.length > 0) {
                    try {
                        tempoMedioStr = mediaTempi(tempiValidi.map(r => r.tempo));
                    } catch (error) {
                        tempoMedioStr = "Errore formato";
                    }
                }
                if(allenamento.sensazioni!=""){
                   ultimoAllenamento.innerHTML = `
                    <div>
                        <strong>Descrizione:</strong> ${allenamento.descrizione || ""}<br>
                        <strong>Tempo medio totale:</strong> ${tempoMedioStr}<br>
                        <strong>Data:</strong> ${formattaData(allenamento.data)}<br>
                        <strong>Note:</strong> ${allenamento.sensazioni}<br>
                    
                        
                        ${generaHtmlMenu(allenamento.id)}
                    </div>
                    `; 
                }else{
                    ultimoAllenamento.innerHTML = `
                    <div>
                        <strong>Descrizione:</strong> ${allenamento.descrizione || ""}<br>
                        <strong>Tempo medio totale:</strong> ${tempoMedioStr}<br>
                        <strong>Data:</strong> ${formattaData(allenamento.data)}<br>
                    
                        
                        ${generaHtmlMenu(allenamento.id)}
                    </div>
                    `; 
                }
                
            } else {
                ultimoAllenamento.innerHTML = `
                    <div>
                        <strong>Distanza:</strong> ${allenamento.km || ""} km<br>
                        <strong>Tempo:</strong> ${allenamento.tempo || ""}<br>
                        <strong>Ritmo:</strong> ${allenamento.ritmo || ""} /km<br>
                        <strong>Data:</strong> ${formattaData(allenamento.data)}
                        ${generaHtmlMenu(allenamento.id)}
                    </div>
                `;
            }
        }

        // RENDER ULTIMA GARA
        if(gara && ultimaGara){
            if(headerGara){
                headerGara.textContent = `${gara.luogo || "Gara"} - ${gara.tipoGara || ""}`;
            }
            ultimaGara.innerHTML = `
                <div>
                    <strong>Distanza/Tipo:</strong> ${gara.tipoGara || ""}<br>
                    <strong>Tempo:</strong> ${gara.tempo || ""}<br>
                    <strong>Luogo:</strong> ${gara.luogo || ""}<br>
                    <strong>Data:</strong> ${formattaData(gara.data)}
                    ${generaHtmlMenu(gara.id)}
                </div>
            `;
        }

        // RENDER STORICO GENERALE
        attivitaSalvate.forEach(att => {
            const div = document.createElement("div");
            div.className = "storico-item";
            
            let infoSpecifiche = "";
            let titoloHeader = att.tipo;

            if(att.tipo === "allenamento"){
                titoloHeader = `Allenamento - ${att.tipoAllenamento}`;
                if(att.tipoAllenamento === "ripetute"){
                    const tempiValidi = att.ripetute ? att.ripetute.filter(r => r.tempo && r.tempo.trim() !== "" && r.tempo.includes(":")) : [];
                    let tMedio = "-";
                    if(tempiValidi.length > 0) {
                        try {
                            tMedio = mediaTempi(tempiValidi.map(r => r.tempo));
                        } catch (error) {
                            tMedio = "Formato errato";
                        }
                    }
                    infoSpecifiche = `Descrizione: ${att.descrizione || ""} | Media: ${tMedio}`;
                } else {
                    infoSpecifiche = `Distanza: ${att.km || ""} km | Ritmo: ${att.ritmo || "-"} /km | Tempo: ${att.tempo || ""}`;
                }
            } else if(att.tipo === "gara") {
                titoloHeader = `${att.luogo || "Gara"} - ${att.tipoGara || ""}`;
                infoSpecifiche = `Gara: ${att.tipoGara || ""} | Tempo: ${att.tempo || ""} | Luogo: ${att.luogo || ""}`;
            }

            div.innerHTML = `
                <p>
                    <strong>${titoloHeader}</strong> - ${formattaData(att.data)}<br>
                    <small>${infoSpecifiche}</small>
                </p>
                ${generaHtmlMenu(att.id)}
            `;
            storico.appendChild(div);
        });
    }
});