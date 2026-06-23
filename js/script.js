document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // ELEMENTI DOM
    // =========================
    const btnAggiungi = document.querySelector(".aggiungiAttivita") || document.getElementById("aggiungiAttivita");
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

    // =========================
    // DATI
    // =========================
    let attivitaSalvate = caricaAttivita();
    let idAttivitaInModifica = null;
    aggiornaInterfaccia();

    // =========================
    // SEZIONI FORM
    // =========================
    function nascondiTutteSezioni(){
        if(sezioneAllenamento)
            sezioneAllenamento.style.display="none";
        if(sezioneGara)
            sezioneGara.style.display="none";
        if(allenamentoSemplice)
            allenamentoSemplice.style.display="none";
        if(allenamentoRipetute)
            allenamentoRipetute.style.display="none";

    }

    if(tipoAttivita){
        tipoAttivita.addEventListener("change",(e)=>{
            nascondiTutteSezioni();
            if(e.target.value==="allenamento"){
                sezioneAllenamento.style.display="block";
                tipoAllenamento.dispatchEvent(
                    new Event("change")
                );
            }
            else if(e.target.value==="gara"){
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
            }
            else if(e.target.value!==""){
                allenamentoSemplice.style.display="block";
            }
        });
    }

    // =========================
    // APERTURA MODAL
    // =========================
    if(btnAggiungi){
        btnAggiungi.addEventListener("click",()=>{
            idAttivitaInModifica=null;
            form.reset();
            listaRipetute.innerHTML="";
            ritmoCalcolato.textContent="-";
            tipoAttivita.dispatchEvent(
                new Event("change")
            );
            modal.style.display="block";
            document.getElementById("dataAttivita")
            .valueAsDate=new Date();
        });
    }

    // =========================
    // CHIUSURA MODAL
    // =========================
    if(btnAnnulla){
        btnAnnulla.addEventListener("click",()=>{
            modal.style.display="none";
            idAttivitaInModifica=null;
        });
    }

    // =========================
    // CALCOLO RITMO
    // =========================
    function aggiornaRitmo(){
        ritmoCalcolato.textContent =
            calcolaRitmo(
                parseFloat(kmInput.value),
                tempoTotaleInput.value
            );
    }

    kmInput?.addEventListener(
        "input",
        aggiornaRitmo
    );

    tempoTotaleInput?.addEventListener(
        "input",
        aggiornaRitmo
    );

    // =========================
    // GENERAZIONE RIPETUTE
    // =========================
    descrizioneRipetute?.addEventListener(
    "input",()=>{


        const testo =
        descrizioneRipetute.value
        .trim()
        .replace(/\s+/g,"");

        listaRipetute.innerHTML="";

        if(!testo)return;

        const regex =
        /^(\d+)[xX](\d+)$/;

        const match =
        testo.match(regex);

        if(!match)return;

        const serie =
        parseInt(match[1]);

        const distanza =
        match[2];

        for(let i=1;i<=serie;i++){
            const div =
            document.createElement("div");
            div.className="blocco-ripetuta";
            div.innerHTML=`
            <label>
            Ripetuta #${i}
            </label>
            <div class="gruppo-input-tempi">
            <input 
            type="text"
            class="input-tempo-giro"
            data-distanza="${distanza}"
            placeholder="Tempo ${distanza}m">
            </div>
            `;
            listaRipetute.appendChild(div);
        }
    });
    // =========================
    // SALVATAGGIO ATTIVITÀ
    // =========================


    form?.addEventListener("submit",(e)=>{


        e.preventDefault();



        const nuovaAttivita = {


            id:
            idAttivitaInModifica
            ? idAttivitaInModifica
            : Date.now(),



            tipo:
            tipoAttivita.value,



            data:
            document.getElementById("dataAttivita").value,



            sensazioni:
            document.getElementById("sensazioni").value

        };






        if(nuovaAttivita.tipo==="allenamento"){



            nuovaAttivita.tipoAllenamento =
            tipoAllenamento.value;





            if(tipoAllenamento.value==="ripetute"){



                nuovaAttivita.descrizione =
                descrizioneRipetute.value;



                nuovaAttivita.singoleRipetute=[];



                document
                .querySelectorAll(".blocco-ripetuta")
                .forEach((blocco,index)=>{


                    const giri=[];



                    blocco
                    .querySelectorAll(".input-tempo-giro")
                    .forEach(input=>{


                        giri.push({

                            distanza:
                            input.dataset.distanza,


                            tempo:
                            input.value || "-"

                        });


                    });




                    nuovaAttivita.singoleRipetute.push({

                        numero:index+1,

                        giri:giri

                    });



                });



            }



            else {


                nuovaAttivita.km =
                parseFloat(kmInput.value);



                nuovaAttivita.tempo =
                tempoTotaleInput.value;



                nuovaAttivita.ritmo =
                ritmoCalcolato.textContent;



            }




        }





        else if(nuovaAttivita.tipo==="gara"){



            nuovaAttivita.tipoGara =
            document.getElementById("tipoGara").value;



            nuovaAttivita.luogo =
            document.getElementById("luogoGara").value;



            nuovaAttivita.tempo =
            document.getElementById("tempoGara").value;


        }







        if(idAttivitaInModifica){



            const index =
            attivitaSalvate.findIndex(
                a=>a.id===idAttivitaInModifica
            );



            if(index!==-1)
            attivitaSalvate[index]=nuovaAttivita;



        }



        else {


            attivitaSalvate.unshift(
                nuovaAttivita
            );


        }




        salvaAttivita(attivitaSalvate);



        aggiornaInterfaccia();



        modal.style.display="none";



    });









    // =========================
    // MENU CARD
    // =========================


    document.addEventListener("click",(e)=>{



        const bottone =
        e.target.closest(".btn-menu-card");



        if(bottone){


            e.stopPropagation();



            const menu =
            bottone.nextElementSibling;



            document
            .querySelectorAll(".dropdown-menu-card")
            .forEach(m=>{


                if(m!==menu)
                m.classList.remove("show");


            });



            menu.classList.toggle("show");

            return;

        }






        document
        .querySelectorAll(".dropdown-menu-card")
        .forEach(m=>
            m.classList.remove("show")
        );






        if(e.target.matches(".elimina")){



            const id =
            Number(e.target.dataset.id);



            if(confirm(
            "Eliminare definitivamente?"
            )){


                attivitaSalvate =
                attivitaSalvate.filter(
                    a=>a.id!==id
                );



                salvaAttivita(attivitaSalvate);



                aggiornaInterfaccia();

            }


        }








        if(e.target.matches(".modifica")){



            const id =
            Number(e.target.dataset.id);



            const att =
            attivitaSalvate.find(
                a=>a.id===id
            );



            if(!att)return;



            idAttivitaInModifica =
            att.id;



            tipoAttivita.value =
            att.tipo;



            document.getElementById("dataAttivita").value =
            att.data;



            document.getElementById("sensazioni").value =
            att.sensazioni || "";



            tipoAttivita.dispatchEvent(
                new Event("change")
            );



            if(att.tipo==="gara"){



                document.getElementById("tipoGara").value =
                att.tipoGara || "";


                document.getElementById("luogoGara").value =
                att.luogo || "";


                document.getElementById("tempoGara").value =
                att.tempo || "";


            }

            else {
                tipoAllenamento.value =
                att.tipoAllenamento;
                tipoAllenamento.dispatchEvent(
                    new Event("change")
                );
                kmInput.value =
                att.km || "";
                tempoTotaleInput.value =
                att.tempo || "";
                ritmoCalcolato.textContent =
                att.ritmo || "-";
            }
            modal.style.display="block";
        }
    });
    // =========================
    // RENDER HOMEPAGE
    // =========================
    function generaHtmlMenu(id){
        return `
        <div class="menu-card-container">
        <button 
        class="btn-menu-card">
        ⋮
        </button>
        <div class="dropdown-menu-card">
        <button 
        class="dropdown-item-card modifica"
        data-id="${id}">
        Modifica attività
        </button>
        <button 
        class="dropdown-item-card elimina"
        data-id="${id}">
        Elimina attività
        </button>
        </div>
        </div>
        `;
    }

    function aggiornaInterfaccia(){

        const storico =
        document.querySelector(".storicoHome");

        const ultimoAllenamento =
        document.querySelector(
        "#ultimoAllenamentoHome .card-body"
        );

        const ultimaGara =
        document.querySelector(
        "#ultimaGaraHome .card-body"
        );

        if(!storico)return;

        storico.innerHTML="";

        if(attivitaSalvate.length===0){
            storico.innerHTML =
            "<p>non è stata aggiunta ancora nessuna attività</p>";
            return;
        }

        const allenamento =
        attivitaSalvate.find(
        a=>a.tipo==="allenamento"
        );

        const gara =
        attivitaSalvate.find(
        a=>a.tipo==="gara"
        );

        if(allenamento){
            ultimoAllenamento.innerHTML = `
            <p>
            <strong>
            ${allenamento.tipoAllenamento}
            </strong>
            <br>
            ${allenamento.km || ""}
            km
            ${generaHtmlMenu(allenamento.id)}
            </p>
            `;
        }
        if(gara){
            ultimaGara.innerHTML=`
            <p>
            <strong>
            ${gara.tipoGara}
            </strong>
            <br>
            ${gara.tempo}
            ${generaHtmlMenu(gara.id)}
            </p>
            `;
        }
        attivitaSalvate.forEach(att=>{
            const div =
            document.createElement("div");
            div.className="storico-item";
            div.innerHTML = `
            <p>
            <strong>
            ${att.tipo}
            </strong>
            -
            ${formattaData(att.data)}
            <br>
            ${att.tempo || ""}
            </p>
            ${generaHtmlMenu(att.id)}
            `;
            storico.appendChild(div);
        });
    }
});