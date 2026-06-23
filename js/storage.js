const STORAGE_KEY = "attivita_running";


function caricaAttivita() {

    try {

        const dati = localStorage.getItem(STORAGE_KEY);

        return dati ? JSON.parse(dati) : [];

    } catch (e) {

        console.error("Errore caricamento attività:", e);

        return [];
    }
}



function salvaAttivita(attivita) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(attivita)
        );

    } catch(e) {

        console.error("Errore salvataggio attività:", e);

    }

}