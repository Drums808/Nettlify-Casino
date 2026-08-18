const targetTables = [35, 17, 11, 8, 6, 5];
const tableNames = {
    35: "Plenas",
    17: "Medias",
    11: "Calles",
    8:  "Cuartas",
    6:  "L.Especiales",
    5:  "Lineas"
};
const maxMultiplier = 25;
const presetThemes = {
    casino: { name: 'Casino', bg: '#0a1117', panel: '#161b22', primary: '#f0b429', accent: '#64d2a6' },
    midnight: { name: 'Midnight', bg: '#090d18', panel: '#1a233a', primary: '#7aa2ff', accent: '#5eead4' },
    emerald: { name: 'Emerald', bg: '#071b17', panel: '#102d2b', primary: '#66d9a8', accent: '#d7ff5f' },
    sunset: { name: 'Sunset', bg: '#1d0d16', panel: '#2b1a2d', primary: '#ff9f43', accent: '#ff5ea8' },
    royal: { name: 'Royal', bg: '#0d1a2d', panel: '#1f2d4d', primary: '#c5a66b', accent: '#8ecae6' },
    neon: { name: 'Neon', bg: '#0b1020', panel: '#171f35', primary: '#00f5d4', accent: '#ff006e' },
    gold: { name: 'Gold', bg: '#15120d', panel: '#2a2117', primary: '#f6d365', accent: '#fda085' },
    ocean: { name: 'Ocean', bg: '#061b2a', panel: '#0e2f43', primary: '#4cc9f0', accent: '#90e0ef' },
    rose: { name: 'Rose', bg: '#180b17', panel: '#2a1528', primary: '#ff8fab', accent: '#ffd6a5' },
    violet: { name: 'Violet', bg: '#160f2c', panel: '#241945', primary: '#b794f4', accent: '#f6c0f7' },
    citrus: { name: 'Citrus', bg: '#1d200a', panel: '#2e3811', primary: '#c7f464', accent: '#f9d423' },
    arctic: { name: 'Arctic', bg: '#eaf7ff', panel: '#d8f3ff', primary: '#0081a7', accent: '#00afb9' },
    lava: { name: 'Lava', bg: '#1d0908', panel: '#351412', primary: '#ff6b35', accent: '#ff9f1c' },
    plum: { name: 'Plum', bg: '#120a18', panel: '#26162f', primary: '#d4a5ff', accent: '#b7e4c7' },
    forest: { name: 'Forest', bg: '#0d1a13', panel: '#1b3527', primary: '#7adf9c', accent: '#d9f99d' },
    sky: { name: 'Sky', bg: '#edf6ff', panel: '#dfeeff', primary: '#457b9d', accent: '#a8dadc' },
    champagne: { name: 'Champagne', bg: '#1a120c', panel: '#2b1f18', primary: '#f7d7a7', accent: '#d4a373' },
    shadow: { name: 'Shadow', bg: '#111111', panel: '#1d1d1d', primary: '#d4d4d4', accent: '#8b5cf6' }
};
const themeDefaults = presetThemes.casino;

function safeReadJSON(key, fallback) {
    try {
        const rawValue = localStorage.getItem(key);
        if (rawValue === null || rawValue === undefined || rawValue === '') {
            return fallback;
        }
        const parsedValue = JSON.parse(rawValue);
        return parsedValue === null ? fallback : parsedValue;
    } catch (error) {
        return fallback;
    }
}

function isValidTheme(theme) {
    return !!theme && typeof theme === 'object' &&
        typeof theme.bg === 'string' &&
        typeof theme.panel === 'string' &&
        typeof theme.primary === 'string' &&
        typeof theme.accent === 'string';
}

let activeMode = 'all';
let currentTable = 0;
let currentMultiplier = 0;
let mustRepeatQuestion = false;
let questionTimerId = null;
let questionTimerSeconds = 10;
let selectedTables = [...targetTables];
let mistakeRegistry = safeReadJSON('mathMistakes', []);
if (!Array.isArray(mistakeRegistry)) {
    mistakeRegistry = [];
}
let themePreviewTimer = null;
let themePreviewInterval = null;

const elQuestion = document.getElementById('questionDisplay');
const elInput = document.getElementById('answerInput');
const elBtnSubmit = document.getElementById('submitBtn');
const elFeedback = document.getElementById('feedback');
const elBtnNormal = document.getElementById('btnNormal');
const elBtnErrors = document.getElementById('btnErrors');
const elBtnTimer = document.getElementById('btnTimer');
const elQuestionTimer = document.getElementById('questionTimer');
const elErrorCount = document.getElementById('errorCount');
const elTablesGrid = document.getElementById('tablesGrid');
const elCustomizeButton = document.getElementById('customizeButton');
const elOverlay = document.getElementById('personalizerOverlay');
const elClosePersonalizer = document.getElementById('closePersonalizer');
const elThemePresets = document.getElementById('themePresets');
const elThemePreviewStatus = document.getElementById('themePreviewStatus');
const elThemePreviewBadge = document.getElementById('themePreviewBadge') || (() => {
    const badge = document.createElement('div');
    badge.id = 'themePreviewBadge';
    badge.className = 'theme-preview-badge hidden';
    badge.setAttribute('aria-live', 'polite');
    badge.textContent = '5s';
    document.body.appendChild(badge);
    return badge;
})();
const elBgColor = document.getElementById('bgColor');
const elPanelColor = document.getElementById('panelColor');
const elPrimaryColor = document.getElementById('primaryColor');
const elAccentColor = document.getElementById('accentColor');

elBtnNormal.addEventListener('click', () => switchMode('all'));
elBtnErrors.addEventListener('click', () => switchMode('errors'));
elBtnTimer.addEventListener('click', () => switchMode('timer'));
elBtnSubmit.addEventListener('click', validateAnswer);
elInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') validateAnswer(); });

elCustomizeButton.addEventListener('click', () => {
    elOverlay.classList.add('active');
    elOverlay.setAttribute('aria-hidden', 'false');
});

elClosePersonalizer.addEventListener('click', closePersonalizer);
elOverlay.addEventListener('click', (event) => {
    if (event.target === elOverlay) closePersonalizer();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elOverlay.classList.contains('active')) {
        closePersonalizer();
    }
});

function closePersonalizer() {
    elOverlay.classList.remove('active');
    elOverlay.setAttribute('aria-hidden', 'true');
}

const savedTheme = safeReadJSON('customTheme', null);
const activeTheme = isValidTheme(savedTheme) ? savedTheme : themeDefaults;

applyTheme(activeTheme);
renderPresetThemes();

function renderPresetThemes() {
    const themes = Object.entries(presetThemes).map(([key, value]) => ({ ...value, id: key }));

    elThemePresets.innerHTML = themes.map(theme => `
        <button class="theme-preset ${isThemeSelected(theme) ? 'selected' : ''}" data-theme-id="${theme.id}" type="button">
            <span class="theme-swatch" style="background: ${theme.primary};"></span>
            <span class="theme-preset-name">${theme.name}</span>
        </button>
    `).join('');

    elThemePresets.querySelectorAll('.theme-preset').forEach(button => {
        button.addEventListener('click', () => {
            const themeId = button.dataset.themeId;
            const selectedTheme = presetThemes[themeId];
            if (selectedTheme) {
                startThemePreview(selectedTheme);
            }
        });
    });
}

function startThemePreview(theme) {
    const themeName = theme.name || 'Tema';
    clearTimeout(themePreviewTimer);
    if (themePreviewInterval) {
        clearInterval(themePreviewInterval);
    }

    let remainingSeconds = 2;
    applyTheme(theme);
    renderPresetThemes();
    if (elOverlay) {
        elOverlay.classList.remove('active');
        elOverlay.setAttribute('aria-hidden', 'true');
    }
    if (elThemePreviewBadge) {
        elThemePreviewBadge.classList.remove('hidden');
        elThemePreviewBadge.textContent = `${remainingSeconds}s`;
    }
    elThemePreviewStatus.textContent = `Previsualizando: ${themeName} (${remainingSeconds}s)`;

    themePreviewInterval = setInterval(() => {
        remainingSeconds -= 1;
        if (remainingSeconds <= 0) {
            clearInterval(themePreviewInterval);
            themePreviewInterval = null;
            if (elThemePreviewBadge) {
                elThemePreviewBadge.textContent = '0s';
            }
            elThemePreviewStatus.textContent = `Tema activo: ${themeName}`;
            return;
        }
        if (elThemePreviewBadge) {
            elThemePreviewBadge.textContent = `${remainingSeconds}s`;
        }
        elThemePreviewStatus.textContent = `Previsualizando: ${themeName} (${remainingSeconds}s)`;
    }, 1000);

    themePreviewTimer = setTimeout(() => {
        saveTheme(theme);
        renderPresetThemes();
        clearInterval(themePreviewInterval);
        themePreviewInterval = null;
        if (elThemePreviewBadge) {
            elThemePreviewBadge.classList.add('hidden');
            elThemePreviewBadge.textContent = '2s';
        }
        elThemePreviewStatus.textContent = `Tema activo: ${themeName}`;
        if (elOverlay) {
            elOverlay.classList.add('active');
            elOverlay.setAttribute('aria-hidden', 'false');
        }
    }, 2000);
}

function isThemeSelected(theme) {
    const current = safeReadJSON('customTheme', null);
    if (!isValidTheme(current)) {
        return false;
    }
    return current.bg === theme.bg &&
        current.panel === theme.panel &&
        current.primary === theme.primary &&
        current.accent === theme.accent;
}

function hexToRgba(hex, alpha) {
    const cleanHex = hex.replace('#', '');
    const fullHex = cleanHex.length === 3
        ? cleanHex.split('').map(char => char + char).join('')
        : cleanHex;

    const value = parseInt(fullHex, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyTheme(theme) {
    if (!isValidTheme(theme)) {
        return;
    }
    const root = document.documentElement;
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--panel', theme.panel);
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-hover', theme.primary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--active-bg', hexToRgba(theme.primary, 0.18));
    root.style.setProperty('--active-border', hexToRgba(theme.primary, 0.72));
    root.style.setProperty('--active-text', theme.primary);
}

function saveTheme(theme) {
    if (!isValidTheme(theme)) {
        return;
    }
    try {
        localStorage.setItem('customTheme', JSON.stringify(theme));
    } catch (error) {
        console.warn('No se pudo guardar el tema:', error);
    }
}

function setThemePreviewState(message) {
    elThemePreviewStatus.textContent = message;
}

generateTableButtons();
updateMistakeCounter();
generateNextQuestion();

function generateTableButtons() {
    targetTables.forEach(table => {
        const btn = document.createElement('button');
        btn.className = 'btn-table';
        btn.textContent = tableNames[table];
        btn.dataset.table = table;
        btn.classList.toggle('active', selectedTables.includes(table));
        btn.addEventListener('click', () => {
            if (selectedTables.includes(table)) {
                selectedTables = selectedTables.filter(item => item !== table);
            } else {
                selectedTables.push(table);
            }
            btn.classList.toggle('active', selectedTables.includes(table));
            if (selectedTables.length === 0) {
                showFeedback('Selecciona al menos una tabla.', 'error');
            } else {
                hideFeedback();
            }
            if (activeMode !== 'errors' && activeMode !== 'timer') {
                generateNextQuestion();
            }
        });
        elTablesGrid.appendChild(btn);
    });
}

function updateMistakeCounter() { elErrorCount.textContent = mistakeRegistry.length; }

function saveToRegistry(table, multiplier) {
    if (!mistakeRegistry.some(item => item.t === table && item.m === multiplier)) {
        mistakeRegistry.push({ t: table, m: multiplier });
        try {
            localStorage.setItem('mathMistakes', JSON.stringify(mistakeRegistry));
        } catch (error) {
            console.warn('No se pudo guardar el registro de errores:', error);
        }
        updateMistakeCounter();
    }
}

function removeFromRegistry(table, multiplier) {
    mistakeRegistry = mistakeRegistry.filter(item => !(item.t === table && item.m === multiplier));
    try {
        localStorage.setItem('mathMistakes', JSON.stringify(mistakeRegistry));
    } catch (error) {
        console.warn('No se pudo actualizar el registro de errores:', error);
    }
    updateMistakeCounter();
}

function clearQuestionTimer() {
    if (questionTimerId) {
        clearInterval(questionTimerId);
        questionTimerId = null;
    }
    if (elQuestionTimer) {
        elQuestionTimer.classList.add('hidden');
        elQuestionTimer.textContent = '10s';
    }
}

function startQuestionTimer() {
    clearQuestionTimer();
    if (!elQuestionTimer || activeMode !== 'timer') {
        return;
    }

    questionTimerSeconds = 10;
    elQuestionTimer.textContent = `${questionTimerSeconds}s`;
    elQuestionTimer.classList.remove('hidden');

    questionTimerId = setInterval(() => {
        questionTimerSeconds -= 1;
        if (questionTimerSeconds <= 0) {
            clearInterval(questionTimerId);
            questionTimerId = null;
            elQuestionTimer.textContent = '0s';
            handleTimeExpired();
            return;
        }
        elQuestionTimer.textContent = `${questionTimerSeconds}s`;
    }, 1000);
}

function handleTimeExpired() {
    if (activeMode !== 'timer') {
        return;
    }
    showFeedback(`¡Se acabó el tiempo! La respuesta era ${currentTable * currentMultiplier}.`, 'error');
    saveToRegistry(currentTable, currentMultiplier);
    mustRepeatQuestion = true;
    setTimeout(() => {
        hideFeedback();
        generateNextQuestion();
    }, 1200);
}

function switchMode(newMode) {
    if (newMode === 'errors' && mistakeRegistry.length === 0) {
        showFeedback('¡No tienes errores pendientes!', 'correct');
        setTimeout(hideFeedback, 2500);
        return;
    }
    activeMode = newMode;
    elBtnNormal.classList.toggle('active', activeMode === 'all');
    elBtnErrors.classList.toggle('active', activeMode === 'errors');
    elBtnTimer.classList.toggle('active', activeMode === 'timer');
    document.querySelectorAll('.btn-table').forEach(btn => {
        const tableNumber = Number(btn.dataset.table);
        btn.classList.toggle('active', selectedTables.includes(tableNumber));
    });
    mustRepeatQuestion = false;
    hideFeedback();
    clearQuestionTimer();
    generateNextQuestion();
}

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getRandomSelectedTable() {
    const pool = selectedTables.length > 0 ? selectedTables : targetTables;
    return pool[getRandomInt(0, pool.length - 1)];
}

function generateNextQuestion() {
    if (mustRepeatQuestion) { elInput.value = ''; elInput.focus(); return; }

    if (activeMode === 'errors') {
        if (mistakeRegistry.length === 0) { switchMode('all'); return; }
        const randomIndex = getRandomInt(0, mistakeRegistry.length - 1);
        currentTable = mistakeRegistry[randomIndex].t;
        currentMultiplier = mistakeRegistry[randomIndex].m;
    } else if (activeMode === 'all' || activeMode === 'timer') {
        currentTable = getRandomSelectedTable();
        currentMultiplier = getRandomInt(1, maxMultiplier);
    } else {
        currentTable = Number(activeMode);
        currentMultiplier = getRandomInt(1, maxMultiplier);
    }

    elQuestion.textContent = `${currentMultiplier} ${tableNames[currentTable]}`;
    elInput.value = ''; elInput.focus(); hideFeedback();

    if (activeMode === 'timer') {
        startQuestionTimer();
    } else {
        clearQuestionTimer();
    }
}

function validateAnswer() {
    const userAnswer = parseInt(elInput.value, 10);
    if (isNaN(userAnswer)) return;

    if (activeMode === 'timer') {
        clearQuestionTimer();
    }

    const correctAnswer = currentTable * currentMultiplier;

    if (userAnswer === correctAnswer) {
        showFeedback('¡Correcto!', 'correct');
        if (!mustRepeatQuestion) removeFromRegistry(currentTable, currentMultiplier);
        mustRepeatQuestion = false;
        setTimeout(generateNextQuestion, 800);
    } else {
        showFeedback(`Incorrecto. ${currentMultiplier} ${tableNames[currentTable]} pagan ${correctAnswer}.`, 'error');
        saveToRegistry(currentTable, currentMultiplier);
        mustRepeatQuestion = true;
        elInput.value = '';
        elInput.focus();
        if (activeMode === 'timer') {
            setTimeout(generateNextQuestion, 1200);
        }
    }
}

function showFeedback(message, type) {
    elFeedback.textContent = message;
    elFeedback.className = `feedback show ${type}`;
}
function hideFeedback() { elFeedback.className = 'feedback'; }
