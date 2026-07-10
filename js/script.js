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
                nuovaAttivita.recuperoRipetute = (document.getElementById("recuperoRipetute")?.value || "").trim();
                nuovaAttivita.recuperoSerie = (document.getElementById("recuperoSerie")?.value || "").trim();
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

            const passaggiInput = document.getElementById("passaggiGara");
            nuovaAttivita.passaggi = passaggiInput && passaggiInput.value.trim()
                ? passaggiInput.value.split(",").map(s => s.trim()).filter(Boolean)
                : [];
        }

        const valutazioneInput = document.getElementById("valutazione");
        nuovaAttivita.valutazione = valutazioneInput ? valutazioneInput.value : "3";

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
            const valutazioneEl = document.getElementById("valutazione");
            if(valutazioneEl) valutazioneEl.value = att.valutazione || "3";

            tipoAttivita.dispatchEvent(new Event("change"));

            if(att.tipo==="gara"){
                document.getElementById("tipoGara").value = att.tipoGara || "";
                document.getElementById("luogoGara").value = att.luogo || "";
                document.getElementById("tempoGara").value = att.tempo || "";
                const passaggiEl = document.getElementById("passaggiGara");
                if(passaggiEl) passaggiEl.value = (att.passaggi || []).join(",");
            } else {
                tipoAllenamento.value = att.tipoAllenamento;
                if(tipoAllenamento) tipoAllenamento.dispatchEvent(new Event("change"));
                
                if(att.tipoAllenamento === "ripetute") {
                    descrizioneRipetute.value = att.descrizione || "";
                    descrizioneRipetute.dispatchEvent(new Event("input"));

                    const recuperoRipeteEl = document.getElementById("recuperoRipetute");
                    const recuperoSerieEl = document.getElementById("recuperoSerie");
                    if(recuperoRipeteEl) recuperoRipeteEl.value = att.recuperoRipetute || "";
                    if(recuperoSerieEl) recuperoSerieEl.value = att.recuperoSerie || "";
                    
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

    // ========================================================
    // DASHBOARD ALLENAMENTI (Forma, PB, Focus)
    // ========================================================
    function aggiornaDashboard(){
        const formaStatoEl = document.getElementById("formaStato");
        if(!formaStatoEl) return; // non siamo nella pagina Allenamenti

        const forma = calcolaFormaAttuale(attivitaSalvate);
        // IMPORTANTE: innerHTML (non textContent) perché forma.stato può
        // contenere il markup <img> di un'icona SVG.
        formaStatoEl.innerHTML = forma.stato;
        document.getElementById("kmSettimana").textContent = forma.kmSettimana;
        document.getElementById("recupero").textContent = forma.recupero;

        const profilo = caricaProfilo();
        const pbMap = calcolaPB(attivitaSalvate, profilo);

        const pb400 = pbMap["400"];
        const pb800 = pbMap["800"];
        document.getElementById("pb400").textContent = pb400 ? formattaTempoGara(pb400.secondi) : "-";
        document.getElementById("pb800").textContent = pb800 ? formattaTempoGara(pb800.secondi) : "-";

        let trendTesto = calcolaTrendGenerale(attivitaSalvate, pbMap);
        const ultimaGara = attivitaSalvate
            .filter(a => a.tipo === "gara")
            .slice()
            .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
        if(ultimaGara){
            const contesto = analizzaContestoAllenamento(ultimaGara.data, ultimaGara.tempo, ultimaGara.tipoGara, attivitaSalvate);
            if(contesto && contesto.scarico === "scarico") trendTesto += ` · scarico pre-gara rilevato ${iconaSvg("graficoBasso")}`;
        }
        // IMPORTANTE: innerHTML (non textContent), trendTesto contiene icone SVG.
        document.getElementById("trend").innerHTML = trendTesto;

        renderFocus();
    }

    function renderFocus(){
        const focusTestoEl = document.getElementById("focusTesto");
        if(!focusTestoEl) return;

        const focus = caricaFocus();
        if(focus && focus.focus){
            focusTestoEl.innerHTML = `<strong>Focus:</strong> ${focus.focus}`;
            document.getElementById("obiettivo").textContent = focus.obiettivo || "-";
        } else {
            focusTestoEl.innerHTML = `<strong>Focus:</strong> Da impostare`;
            document.getElementById("obiettivo").textContent = "-";
        }
    }

    // Unica card modificabile manualmente: mostra un piccolo form con un
    // menu a tendina per scegliere il tipo di focus e un campo per l'obiettivo.
    window.modificaFocus = function(){
        if(document.getElementById("selectFocus")) return; // già in modifica

        const focusTestoEl = document.getElementById("focusTesto");
        if(!focusTestoEl) return;
        const cardBody = focusTestoEl.closest(".card-body");
        const focus = caricaFocus() || {};

        cardBody.innerHTML = `
            <div class="form-group">
                <label>Focus</label>
                <select id="selectFocus">
                    <option value="">Seleziona</option>
                    <option value="Velocità">Velocità</option>
                    <option value="Resistenza">Resistenza</option>
                    <option value="Forza">Forza</option>
                    <option value="Tecnica di corsa">Tecnica di corsa</option>
                    <option value="Recupero attivo">Recupero attivo</option>
                    <option value="Preparazione gara">Preparazione gara</option>
                </select>
            </div>
            <div class="form-group">
                <label>Obiettivo</label>
                <input type="text" id="inputObiettivo" placeholder="es. Migliorare il passo negli ultimi 200m">
            </div>
            <div class="modal-buttons">
                <button type="button" id="annullaFocus" style="background-color:#ffffff;border:1px solid #4e73df;color:#5a5c69;">Annulla</button>
                <button type="button" id="salvaFocusBtn">Salva</button>
            </div>
        `;

        document.getElementById("selectFocus").value = focus.focus || "";
        document.getElementById("inputObiettivo").value = focus.obiettivo || "";

        function ripristinaVista(){
            cardBody.innerHTML = `<p id="focusTesto"></p><p><strong>Obiettivo:</strong> <span id="obiettivo"></span></p>`;
            renderFocus();
        }

        document.getElementById("annullaFocus").addEventListener("click", ripristinaVista);

        document.getElementById("salvaFocusBtn").addEventListener("click", ()=>{
            salvaFocus({
                focus: document.getElementById("selectFocus").value,
                obiettivo: document.getElementById("inputObiettivo").value.trim(),
                data: new Date().toISOString()
            });
            ripristinaVista();
        });
    };

    // ========================================================
    // PAGINA PROFILO
    // ========================================================
    function paginaProfiloAttiva(){
        return !!document.getElementById("profiloForm");
    }

    function renderProfilo(){
        if(!paginaProfiloAttiva()) return;

        const p = caricaProfilo();
        document.getElementById("outNome").textContent = p.nome || "-";
        document.getElementById("outCognome").textContent = p.cognome || "-";
        document.getElementById("outEta").textContent = p.eta ? `${p.eta} anni` : "-";
        document.getElementById("outSpecialita").textContent = p.specialita || "-";
        document.getElementById("outLuogo").textContent = p.luogo || "-";

        const kmTotali = attivitaSalvate.reduce((tot,a)=>tot+calcolaKmAllenamento(a),0);
        document.getElementById("outKm").textContent = kmTotali.toFixed(1);

        renderPersonalBest();
    }

    function renderPersonalBest(){
        const contenitore = document.getElementById("listaPersonalBest");
        if(!contenitore) return;

        const p = caricaProfilo();
        const pbMap = calcolaPB(attivitaSalvate, p);
        const chiavi = Object.keys(pbMap).sort((a,b)=>parseInt(a)-parseInt(b));

        if(chiavi.length === 0){
            contenitore.innerHTML = "<p>Nessun personal best registrato. Aggiungine uno o registra una gara.</p>";
            return;
        }

        contenitore.innerHTML = chiavi.map(k=>{
            const pb = pbMap[k];
            const fonte = pb.fonte === "gara"
                ? `${pb.luogo || "Gara"}${pb.data ? " - " + formattaData(pb.data) : ""}`
                : "PB iniziale";
            const pista = pb.passaggi && pb.passaggi.length > 0
                ? generaHtmlPista(analizzaPassaggi(pb.passaggi, pb.tempoStr, pb.distanzaLabel))
                : "";
            const contesto = (pb.fonte === "gara" && pb.data)
                ? generaHtmlContestoAllenamento(analizzaContestoAllenamento(pb.data, pb.tempoStr, pb.distanzaLabel, attivitaSalvate))
                : "";

            return `
                <div class="pb-item">
                    <p>${iconaSvg("trofeo")}<strong>${pb.distanzaLabel}:</strong> ${formattaTempoGara(pb.secondi)} <small>(${fonte})</small></p>
                    ${pista}
                    ${contesto}
                </div>
            `;
        }).join("");
    }

    // ========================================================
    // CONTESTO ALLENAMENTO (analisi incrociata allenamenti <-> gare)
    // Mostra, per i PB registrati come gara, cosa raccontano gli
    // allenamenti dei giorni precedenti: è un'analisi statistica sui dati
    // che l'utente ha inserito, non una previsione. Con poche sessioni di
    // qualità nella finestra considerata lo segnala esplicitamente.
    // ========================================================
    function generaHtmlContestoAllenamento(contesto){
        if(!contesto) return "";

        if(!contesto.datiSufficienti){
            return `
                <div class="contesto-allenamento contesto-scarso">
                    <p><strong>Contesto allenamento:</strong> nei ${contesto.finestraGiorni} giorni prima di questa gara non ho trovato almeno 2 sessioni di ripetute di ${contesto.famiglieRilevanti.join(" o ")}. Registra più allenamenti per un'analisi più precisa.</p>
                </div>
            `;
        }

        const righeExtra = [];
        if(contesto.confrontoPasso){
            const cp = contesto.confrontoPasso;
            const direzione = cp.garaPiuVeloce ? "più veloce" : "più lento";
            righeExtra.push(`Il passo gara (${secondiInFormato(cp.passoGaraSecKm)}/km) è del ${Math.abs(cp.scarto*100).toFixed(1)}% ${direzione} rispetto al passo medio di lavoro delle tue ripetute di ${contesto.famiglieRilevanti.join("/")} in quel periodo (${secondiInFormato(cp.passoAllenamentoMedioSecKm)}/km).`);
        }
        if(contesto.recuperoMedioSec){
            righeExtra.push(`Recupero medio tra ripetute in quel periodo: ${secondiInFormato(contesto.recuperoMedioSec)}.`);
        }

        const messaggiScarico = {
            scarico: `Scarico rilevato nell'ultima settimana pre-gara rispetto alla precedente. ${iconaSvg("graficoBasso")}`,
            carico_alto: `Il carico è rimasto alto anche nell'ultima settimana pre-gara (nessun evidente scarico). ${iconaSvg("graficoAlto")}`,
            stabile: `Carico stabile tra le due settimane precedenti la gara. ${iconaSvg("lineaDritta")}`,
            dati_insufficienti: ""
        };

        return `
            <div class="contesto-allenamento">
                <p><strong>Contesto allenamento (ultimi ${contesto.finestraGiorni} giorni):</strong></p>
                <p>Volume totale: ${contesto.kmTotali.toFixed(1)} km · Sessioni di ${contesto.famiglieRilevanti.join("/")}: ${contesto.numSessioniQualita}</p>
                ${righeExtra.map(r=>`<p>${r}</p>`).join("")}
                ${messaggiScarico[contesto.scarico] ? `<p>${messaggiScarico[contesto.scarico]}</p>` : ""}
            </div>
        `;
    }

    // ========================================================
    // PISTA - Analisi dei passaggi nei PB
    // Linea colorata divisa per tratti (verde=passo giusto, blu=troppo
    // piano, rosso=troppo veloce, con le sfumature).
    // ========================================================
    function generaHtmlPista(analisi){
        if(!analisi || analisi.length === 0) return "";

        const segmenti = analisi.map(seg => `
            <div class="segmento-pista" style="background:${seg.colore}" title="${seg.distanzaLabel}: ${seg.tempoStr}s (${seg.etichetta})">
                <span>${seg.tempoStr}</span>
            </div>
        `).join("");

        return `
            <div class="pista-atletica">${segmenti}</div>
            <div class="pista-legenda">
                <span><i class="legenda-colore" style="background:rgb(78,115,223)"></i>Troppo piano</span>
                <span><i class="legenda-colore" style="background:rgb(28,200,138)"></i>Passo giusto</span>
                <span><i class="legenda-colore" style="background:rgb(231,74,59)"></i>Troppo veloce</span>
            </div>
        `;
    }

    window.modificaProfilo = function(){
        const p = caricaProfilo();
        const nomeEl = document.getElementById("inputNome");
        if(!nomeEl) return;
        nomeEl.value = p.nome || "";
        document.getElementById("inputCognome").value = p.cognome || "";
        document.getElementById("inputEta").value = p.eta || "";
        document.getElementById("inputSpecialita").value = p.specialita || "";
        document.getElementById("inputLuogo").value = p.luogo || "";

        document.getElementById("profiloVista").style.display = "none";
        document.getElementById("profiloForm").style.display = "block";
    };

    function chiudiFormProfilo(){
        const form = document.getElementById("profiloForm");
        const vista = document.getElementById("profiloVista");
        if(form) form.style.display = "none";
        if(vista) vista.style.display = "block";
    }

    document.getElementById("annullaProfilo")?.addEventListener("click", chiudiFormProfilo);

    document.getElementById("salvaProfiloBtn")?.addEventListener("click", ()=>{
        const esistente = caricaProfilo();
        salvaProfilo({
            ...esistente,
            nome: document.getElementById("inputNome").value.trim(),
            cognome: document.getElementById("inputCognome").value.trim(),
            eta: document.getElementById("inputEta").value,
            specialita: document.getElementById("inputSpecialita").value,
            luogo: document.getElementById("inputLuogo").value.trim()
        });
        chiudiFormProfilo();
        renderProfilo();
    });

    // --- PB iniziali (dichiarati all'iscrizione, prima di usare il sito) ---
    function aggiungiRigaPb(pb = {}){
        const contenitore = document.getElementById("righePbIniziali");
        if(!contenitore) return;
        const riga = document.createElement("div");
        riga.className = "riga-pb-iniziale";
        riga.innerHTML = `
            <input type="text" class="pb-distanza" placeholder="es. 400m" value="${pb.distanza || ""}">
            <input type="text" class="pb-tempo" placeholder="es. 52.30" value="${pb.tempo || ""}">
            <input type="text" class="pb-passaggi" placeholder="passaggi cumulativi o per tratto, es. 25.0,27.48 (opz.)" value="${(pb.passaggi || []).join(",")}">
            <input type="text" class="pb-luogo" placeholder="luogo (opz.)" value="${pb.luogo || ""}">
            <button type="button" class="btn-mini rimuovi-riga-pb">✕</button>
        `;
        contenitore.appendChild(riga);
    }

    window.modificaPbIniziali = function(){
        const listaEl = document.getElementById("listaPersonalBest");
        const formEl = document.getElementById("formPbIniziali");
        if(!listaEl || !formEl) return;

        const p = caricaProfilo();
        const contenitore = document.getElementById("righePbIniziali");
        contenitore.innerHTML = "";
        const elenco = (p.pbIniziali && p.pbIniziali.length > 0) ? p.pbIniziali : [{}];
        elenco.forEach(pb => aggiungiRigaPb(pb));

        listaEl.style.display = "none";
        formEl.style.display = "block";
    };

    function chiudiFormPb(){
        const listaEl = document.getElementById("listaPersonalBest");
        const formEl = document.getElementById("formPbIniziali");
        if(formEl) formEl.style.display = "none";
        if(listaEl) listaEl.style.display = "block";
    }

    document.getElementById("aggiungiRigaPb")?.addEventListener("click", ()=> aggiungiRigaPb());
    document.getElementById("annullaPb")?.addEventListener("click", chiudiFormPb);

    document.getElementById("righePbIniziali")?.addEventListener("click",(e)=>{
        if(e.target.matches(".rimuovi-riga-pb")){
            e.target.closest(".riga-pb-iniziale").remove();
        }
    });

    document.getElementById("salvaPbIniziali")?.addEventListener("click", ()=>{
        const righe = Array.from(document.querySelectorAll(".riga-pb-iniziale"));
        const pbIniziali = righe.map(r=>({
            distanza: r.querySelector(".pb-distanza").value.trim(),
            tempo: r.querySelector(".pb-tempo").value.trim(),
            passaggi: r.querySelector(".pb-passaggi").value.split(",").map(s=>s.trim()).filter(Boolean),
            luogo: r.querySelector(".pb-luogo").value.trim(),
            data: ""
        })).filter(pb => pb.distanza && pb.tempo);

        salvaProfilo({...caricaProfilo(), pbIniziali});
        chiudiFormPb();
        renderPersonalBest();
    });

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
            let famigliaCorrente = null;

            if (att.tipoAllenamento === "ripetute") {
                const tempiValidi = att.ripetute ? att.ripetute.map(r => r.tempo) : [];
                const metricheCorrente = calcolaMetricheRipetute(att);
                famigliaCorrente = trovaFamigliaRipetuta(parseFloat(metricheCorrente.tipoRipetuta));
                dettagli = `
                    <strong>Descrizione:</strong> ${att.descrizione || ""} <small style="color:#8a8ca0;">(${famigliaCorrente})</small><br>
                    <strong>Tempo medio:</strong> ${mediaTempi(tempiValidi)}<br>
                    ${att.recuperoRipetute ? `<strong>Recupero tra ripetute:</strong> ${att.recuperoRipetute}<br>` : ""}
                    ${att.recuperoSerie ? `<strong>Recupero tra serie:</strong> ${att.recuperoSerie}<br>` : ""}
                `;
            } else {
                dettagli = `
                    <strong>Distanza:</strong> ${att.km || ""} km<br>
                    <strong>Tempo:</strong> ${att.tempo || ""}<br>
                    <strong>Ritmo:</strong> ${att.ritmo || ""} /km<br>
                `;
            }

            const canvasId = `graficoAllenamento-${att.id}`;
            const canvasFormaId = `graficoForma-${att.id}`;

            const blocchiGrafico = att.tipoAllenamento === "ripetute"
                ? `
                    <div class="grafici-ripetute-wrap">
                        <div class="grafico-ripetute-item">
                            <p class="titolo-grafico-mini">Confronto multi-metrica (${famigliaCorrente})</p>
                            <div class="grafico-allenamento"><canvas id="${canvasId}"></canvas></div>
                        </div>
                        <div class="grafico-ripetute-item">
                            <p class="titolo-grafico-mini">Andamento forma stimato</p>
                            <div class="grafico-allenamento"><canvas id="${canvasFormaId}"></canvas></div>
                        </div>
                    </div>
                `
                : `<div class="grafico-allenamento"><canvas id="${canvasId}"></canvas></div>`;

            card.innerHTML = `
                <div class="card-header">
                    <span>Allenamento - ${att.tipoAllenamento}</span>
                    ${generaHtmlMenu(att.id)}
                </div>

                <div class="card-body">
                    ${dettagli}
                    <strong>Data:</strong> ${formattaData(att.data)}<br>
                    ${att.sensazioni ? `<strong>Sensazioni:</strong> ${att.sensazioni}<br>` : ""}

                    ${blocchiGrafico}
                </div>
            `;

            listaAllenamentiPagina.appendChild(card);

            const simili = allenamenti
                .filter(a => a.tipoAllenamento === att.tipoAllenamento)
                .slice()
                .sort((a, b) => new Date(a.data) - new Date(b.data));

            const ctx = document.getElementById(canvasId);
            if (!ctx || typeof Chart === "undefined") return;

            if (att.tipoAllenamento === "ripetute") {
                // Confronta solo allenamenti della stessa "famiglia" (es. non
                // mescola ripetute di velocità pura con quelle di mezzofondo).
                const similiStessaFamiglia = simili.filter(a => {
                    const m = calcolaMetricheRipetute(a);
                    return trovaFamigliaRipetuta(parseFloat(m.tipoRipetuta)) === famigliaCorrente;
                });

                // Finestra mobile sugli ultimi 5: se ce ne sono di più, viene
                // scartato il più vecchio (mai quello appena inserito).
                const recenti = similiStessaFamiglia.slice(-5);

                creaGraficoRadarRipetute(ctx, recenti, att);

                const ctxForma = document.getElementById(canvasFormaId);
                if (ctxForma) creaGraficoFormaRipetute(ctxForma, recenti);
                return;
            }

            const labels = simili.map(a => formattaData(a.data));
            const valori = simili.map(a => valoreGraficoAllenamento(a));

            const grafico = new Chart(ctx, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Ritmo al km",
                        data: valori,
                        borderColor: "#4e73df",
                        backgroundColor: "#4e73df33",
                        fill: true,
                        tension: 0.3,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: "#4e73df"
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
                            },
                            title: { display: true, text: "Ritmo (min/km)" }
                        }
                    }
                }
            });

            graficiAllenamenti.push(grafico);
        });
    }

    // ========================================================
    // GRAFICO RADAR PER LE RIPETUTE
    // Confronta più sessioni della stessa famiglia (es. solo mezzofondo
    // veloce, o solo velocità pura) non solo sul tempo medio, ma anche su
    // numero di serie, numero di ripetute totali, passo di lavoro e
    // sensazioni riportate. Finestra mobile: mostra sempre le ultime 5
    // sessioni della famiglia, scartando la più vecchia quando ce ne sono
    // di più (mai quella appena inserita).
    // ========================================================
    function creaGraficoRadarRipetute(ctx, recenti, attCorrente) {
        const metriche = recenti.map(a => calcolaMetricheRipetute(a));

        const maxSerie = Math.max(1, ...metriche.map(m => m.numSerie));
        const maxRipetute = Math.max(1, ...metriche.map(m => m.numRipetuteTotali));
        const tempiMediValidi = metriche.map(m => m.tempoMedioSec).filter(v => v > 0);
        const ritmiValidi = metriche.map(m => m.ritmoAlKmSec).filter(v => v > 0);
        const minTempoMedio = tempiMediValidi.length ? Math.min(...tempiMediValidi) : 0;
        const minRitmo = ritmiValidi.length ? Math.min(...ritmiValidi) : 0;

        const palette = ["#4e73df", "#1cc88a", "#e74a3b", "#f6c23e", "#36b9cc"];

        const datasets = metriche.map((m, i) => {
            const colore = palette[i % palette.length];
            const eSessioneCorrente = recenti[i].id === attCorrente.id;
            return {
                label: `${formattaData(recenti[i].data)}${eSessioneCorrente ? " (questa)" : ""}`,
                data: [
                    (m.numSerie / maxSerie) * 100,
                    (m.numRipetuteTotali / maxRipetute) * 100,
                    m.tempoMedioSec > 0 && minTempoMedio > 0 ? (minTempoMedio / m.tempoMedioSec) * 100 : 0,
                    m.ritmoAlKmSec > 0 && minRitmo > 0 ? (minRitmo / m.ritmoAlKmSec) * 100 : 0,
                    (m.sensazioneValore / 5) * 100
                ],
                borderColor: colore,
                backgroundColor: colore + "33",
                pointBackgroundColor: colore,
                borderWidth: eSessioneCorrente ? 3 : 1.5,
                _metriche: m
            };
        });

        const grafico = new Chart(ctx, {
            type: "radar",
            data: {
                labels: ["Serie", "Ripetute totali", "Tempo medio", "Passo di lavoro", "Sensazioni"],
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: { display: false },
                        pointLabels: { font: { size: 11 } }
                    }
                },
                plugins: {
                    legend: { display: true, position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            // Mostra il valore reale (non normalizzato) invece
                            // del punteggio 0-100, molto più leggibile.
                            label: (item) => {
                                const m = item.dataset._metriche;
                                const chiave = item.label;
                                if (chiave === "Serie") return `Serie: ${m.numSerie}`;
                                if (chiave === "Ripetute totali") return `Ripetute: ${m.numRipetuteTotali}`;
                                if (chiave === "Tempo medio") return `Tempo medio: ${secondiInFormato(m.tempoMedioSec)}`;
                                if (chiave === "Passo di lavoro") return `Passo: ${secondiInFormato(m.ritmoAlKmSec)}/km`;
                                if (chiave === "Sensazioni") return `Sensazioni: ${m.sensazioneValore}/5`;
                                return "";
                            }
                        }
                    }
                }
            }
        });

        graficiAllenamenti.push(grafico);
    }

    // ========================================================
    // GRAFICO ANDAMENTO FORMA (stima euristica)
    // Grafico a punti e linee sull'"indice di forma" calcolato incrociando
    // passo di lavoro, recupero e volume delle sessioni simili. È una stima,
    // non una previsione: serve a leggere il trend nel tempo.
    // ========================================================
    function creaGraficoFormaRipetute(ctx, recenti) {
        if (recenti.length === 0) return;

        const metriche = recenti.map(a => calcolaMetricheRipetute(a));
        const indici = calcolaIndiceForma(metriche);
        const labels = recenti.map(a => formattaData(a.data));

        const grafico = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Indice di forma (stima)",
                    data: indici,
                    borderColor: "#1cc88a",
                    backgroundColor: "#1cc88a33",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: "#1cc88a"
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        title: { display: true, text: "Indice 0-100 (relativo al periodo)" }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            afterBody: (items) => {
                                const i = items[0].dataIndex;
                                const m = metriche[i];
                                const righe = [`Serie × Ripetute: ${m.numSerie} × ${m.numRipetuteTotali}`];
                                if (m.ritmoAlKmSec > 0) righe.push(`Passo lavoro: ${secondiInFormato(m.ritmoAlKmSec)}/km`);
                                if (m.recuperoRipeteSec > 0) righe.push(`Recupero: ${secondiInFormato(m.recuperoRipeteSec)}`);
                                return righe;
                            }
                        }
                    }
                }
            }
        });

        graficiAllenamenti.push(grafico);
    }

    function aggiornaInterfaccia(){
        aggiornaDashboard();
        renderProfilo();
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