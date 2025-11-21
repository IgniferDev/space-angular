import { shuffle } from './utils.js';

// Variable para guardar las preguntas en memoria RAM una vez descargadas
let allQuestions = [];

// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================
// Cuando tengas tu URL de Google Apps Script, pégala aquí abajo entre las comillas.
// Mientras esté vacía o falle, usará el archivo local 'questions.json'.
const GOOGLE_API_URL = 'https://script.google.com/macros/s/AKfycbwEzJMjlQp5hsqmPD8WhnSDifCpNHXwkAytYd3bTDWfPvoZPZzLbwmvzzHZtR0FuSBj/exec'; 

// ==========================================
// LÓGICA DEL MANAGER
// ==========================================

/**
 * 1. CARGAR EL BANCO DE PREGUNTAS
 * Se llama al inicio del juego (desde main.js).
 * Intenta cargar de Google Sheets, si falla, carga el local.
 */
export async function loadQuestionsBank() {
    // Intentamos cargar desde la API (Nube)
    if (GOOGLE_API_URL) {
        try {
            console.log('📡 Conectando con la API de preguntas...');
            const response = await fetch(GOOGLE_API_URL);
            if (!response.ok) throw new Error('Error de red en API');
            
            allQuestions = await response.json();
            console.log(`✅ Cargadas ${allQuestions.length} preguntas desde la Nube.`);
            return true;
        } catch (error) {
            console.warn('⚠️ Falló la API, intentando carga local...', error);
        }
    }

    // Plan B: Carga Local (JSON)
    try {
        const localResp = await fetch('data/questions.json'); // Ruta relativa a index-embed.html
        if (!localResp.ok) throw new Error('No se encontró questions.json local');
        
        allQuestions = await localResp.json();
        console.log(`📂 Cargadas ${allQuestions.length} preguntas locales.`);
        return true;
    } catch (e) {
        console.error('❌ ERROR CRÍTICO: No se pudieron cargar preguntas ni de API ni locales.', e);
        // Fallback de emergencia por si todo falla para que el juego no crashee
        allQuestions = [
            { category: 'math', difficulty: 1, q: '2+2', a: '4' },
            { category: 'math', difficulty: 1, q: 'Error Carga', a: '...' }
        ];
        return false;
    }
}

/**
 * 2. OBTENER PREGUNTAS POR NIVEL
 * Se llama cada vez que necesitas llenar el banco de enemigos (GameInstance).
 * Filtra por categoría y dificultad basada en la ronda.
 */
export function getQuestionsForLevel(category, round) {
    // A. Definir dificultad según la ronda
    // Ronda 1-2: Dificultad 1 (Fácil)
    // Ronda 3-5: Dificultad 2 (Media)
    // Ronda 6+:  Dificultad 3 (Difícil)
    let targetDifficulty = 1;
    if (round >= 3) targetDifficulty = 2;
    if (round >= 6) targetDifficulty = 3;

    // B. Filtrar el banco global
    // Nos aseguramos de que coincida la categoría y la dificultad
    let pool = allQuestions.filter(item => {
        // Convertimos a string y minúsculas para evitar errores tipo "Math" vs "math"
        const itemCat = String(item.category).toLowerCase();
        const reqCat = String(category).toLowerCase();
        // Comparamos dificultad (asegurando que sean números)
        return itemCat === reqCat && Number(item.difficulty) === targetDifficulty;
    });

    // C. Fallback de seguridad
    // Si no hay preguntas de esa dificultad (ej. no escribiste preguntas difíciles de historia),
    // devolvemos CUALQUIER pregunta de esa categoría para no bloquear el juego.
    if (pool.length < 3) {
        console.warn(`⚠️ Pocas preguntas de dificultad ${targetDifficulty} para ${category}. Usando mix.`);
        pool = allQuestions.filter(item => String(item.category).toLowerCase() === String(category).toLowerCase());
    }

    // D. Barajar y devolver
    return shuffle(pool);
}