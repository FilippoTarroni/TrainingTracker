// ========================================================
// STORAGE.JS - Gestione persistenza LocalStorage
// ========================================================
const STORAGE_KEY = "attivita_running";

function caricaAttivita() {
    try {
        const dati = localStorage.getItem(STORAGE_KEY);
        return dati ? JSON.parse(dati) : [];
    } catch (e) {
        console.error("Errore caricamento attività dal LocalStorage:", e);
        return [];
    }
}

function salvaAttivita(attivita) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(attivita));
    } catch (e) {
        console.error("Errore salvataggio attività nel LocalStorage:", e);
    }
}

// ========================================================
// Profilo utente (dati anagrafici + PB dichiarati all'iscrizione)
// In futuro questi dati verranno spostati su un vero database con
// login/logout; per ora restano in LocalStorage.
// ========================================================
const PROFILO_KEY = "profilo_utente";

function caricaProfilo() {
    try {
        const dati = localStorage.getItem(PROFILO_KEY);
        return dati ? JSON.parse(dati) : { pbIniziali: [] };
    } catch (e) {
        console.error("Errore caricamento profilo dal LocalStorage:", e);
        return { pbIniziali: [] };
    }
}

function salvaProfilo(profilo) {
    try {
        localStorage.setItem(PROFILO_KEY, JSON.stringify(profilo));
    } catch (e) {
        console.error("Errore salvataggio profilo nel LocalStorage:", e);
    }
}

// ========================================================
// Focus dell'allenamento (unica card modificabile manualmente
// nella dashboard di Allenamenti)
// ========================================================
const FOCUS_KEY = "focus_allenamento";

function caricaFocus() {
    try {
        const dati = localStorage.getItem(FOCUS_KEY);
        return dati ? JSON.parse(dati) : null;
    } catch (e) {
        console.error("Errore caricamento focus dal LocalStorage:", e);
        return null;
    }
}

function salvaFocus(focus) {
    try {
        localStorage.setItem(FOCUS_KEY, JSON.stringify(focus));
    } catch (e) {
        console.error("Errore salvataggio focus nel LocalStorage:", e);
    }
}