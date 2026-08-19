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
let viewerFiles = [
    { id: 'figuras-1', file: { name: 'Figuras 1.jpg', size: 0, type: 'image/jpeg' }, url: 'doc/Figuras%201.jpg' },
    { id: 'figuras-2', file: { name: 'Figuras 2.jpg', size: 0, type: 'image/jpeg' }, url: 'doc/Figuras%202.jpg' },
    { id: 'figuras-3', file: { name: 'Figuras 3.jpg', size: 0, type: 'image/jpeg' }, url: 'doc/Figuras%203.jpg' },
    { id: 'tablas-conversion', file: { name: 'Tablas de Conversion.jpg', size: 0, type: 'image/jpeg' }, url: 'doc/Tablas%20de%20Conversion.jpg' }
];
let viewerCurrentFile = null;
let viewerPdfDocument = null;
let viewerPdfPage = 1;
let viewerPdfTotalPages = 0;
let viewerEpubRendition = null;
const paymentTables = [35, 17, 8, 11, 6, 5];
const paymentLabels = {
    5: { singular: 'Línea', plural: 'Líneas' },
    6: { singular: 'L.Especial', plural: 'L.Especiales' },
    8: { singular: 'Cuarta', plural: 'Cuartas' },
    11: { singular: 'Calle', plural: 'Calles' },
    17: { singular: 'Media', plural: 'Medias' },
    35: { singular: 'Plena', plural: 'Plenas' }
};
const paymentMaxMultipliers = paymentTables.reduce((limits, table) => {
    limits[table] = 20;
    return limits;
}, {});
let paymentTerms = [];
let paymentCorrectAnswer = 0;
let paymentMustRepeat = false;

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
const elSoonOverlay = document.getElementById('soonOverlay');
const elCloseSoon = document.getElementById('closeSoon');
const elComingSoonOverlay = document.getElementById('comingSoonOverlay');
const elCloseComingSoon = document.getElementById('closeComingSoon');
const elPaymentQuestion = document.getElementById('paymentQuestion');
const elPaymentAnswer = document.getElementById('paymentAnswer');
const elPaymentSubmit = document.getElementById('paymentSubmit');
const elPaymentFeedback = document.getElementById('paymentFeedback');
const elPaymentCheckboxes = document.getElementById('paymentCheckboxes');
const elFileViewerButton = document.getElementById('fileViewerButton');
const elFileViewerOverlay = document.getElementById('fileViewerOverlay');
const elFileViewerBody = document.querySelector('.file-viewer-body');
const elCloseFileViewer = document.getElementById('closeFileViewer');
const elDocumentFullscreenOverlay = document.getElementById('documentFullscreenOverlay');
const elCloseDocumentFullscreen = document.getElementById('closeDocumentFullscreen');
const elFullscreenDocumentImage = document.getElementById('fullscreenDocumentImage');
const elFullscreenDocumentFallback = document.getElementById('fullscreenDocumentFallback');
const elFileInput = document.getElementById('fileInput');
const elFileSearch = document.getElementById('fileSearch');
const elFileList = document.getElementById('fileList');
const elFileEmpty = document.getElementById('fileEmpty');
const elFileCounter = document.getElementById('fileCounter');
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
    closePayments();
    closeComingSoon();
    closeFileViewer();
});

elClosePersonalizer.addEventListener('click', closePersonalizer);
elOverlay.addEventListener('click', (event) => {
    if (event.target === elOverlay) closePersonalizer();
});

elCloseSoon.addEventListener('click', closePayments);
elSoonOverlay.addEventListener('click', (event) => {
    if (event.target === elSoonOverlay) closePayments();
});
elCloseComingSoon.addEventListener('click', closeComingSoon);
elComingSoonOverlay.addEventListener('click', (event) => {
    if (event.target === elComingSoonOverlay) closeComingSoon();
});
elPaymentSubmit.addEventListener('click', validatePaymentAnswer);
elPaymentAnswer.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') validatePaymentAnswer();
});

elFileViewerButton.addEventListener('click', openFileViewer);
elCloseFileViewer.addEventListener('click', closeFileViewer);
elFileViewerOverlay.addEventListener('click', (event) => {
    if (event.target === elFileViewerOverlay) closeFileViewer();
});
elFileViewerOverlay.addEventListener('dragover', (event) => event.preventDefault());
elFileViewerOverlay.addEventListener('drop', (event) => {
    event.preventDefault();
    addViewerFiles(event.dataTransfer.files);
});
elFileInput.addEventListener('change', () => addViewerFiles(elFileInput.files));
elFileSearch.addEventListener('input', renderViewerFileList);
elCloseDocumentFullscreen.addEventListener('click', closeDocumentFullscreen);
elDocumentFullscreenOverlay.addEventListener('click', (event) => {
    if (event.target === elDocumentFullscreenOverlay) closeDocumentFullscreen();
});

const navButtons = document.querySelectorAll('.nav-item[data-nav]');
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const target = button.dataset.nav;
        navButtons.forEach(item => item.classList.toggle('active', item === button));

        if (target === 'home') {
            closePersonalizer();
            closePayments();
            closeComingSoon();
            closeFileViewer();
            return;
        }

        closePersonalizer();
        closeFileViewer();
        if (target === 'payments') openPayments();
        if (target === 'coming-soon') openComingSoon();
    });
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (elOverlay.classList.contains('active')) {
            closePersonalizer();
        }
        if (elSoonOverlay.classList.contains('active')) {
            closePayments();
        }
        if (elComingSoonOverlay.classList.contains('active')) {
            closeComingSoon();
        }
        if (elFileViewerOverlay.classList.contains('active')) {
            closeFileViewer();
        }
        if (elDocumentFullscreenOverlay.classList.contains('active')) {
            closeDocumentFullscreen();
        }
    }
});

function closePersonalizer() {
    elOverlay.classList.remove('active');
    elOverlay.setAttribute('aria-hidden', 'true');
}

function openPayments() {
    generatePaymentCheckboxes();
    elSoonOverlay.classList.add('active');
    elSoonOverlay.setAttribute('aria-hidden', 'false');
    generatePaymentQuestion();
}

function closePayments() {
    elSoonOverlay.classList.remove('active');
    elSoonOverlay.setAttribute('aria-hidden', 'true');
}

function openComingSoon() {
    elComingSoonOverlay.classList.add('active');
    elComingSoonOverlay.setAttribute('aria-hidden', 'false');
}

function closeComingSoon() {
    elComingSoonOverlay.classList.remove('active');
    elComingSoonOverlay.setAttribute('aria-hidden', 'true');
}

function generatePaymentCheckboxes() {
    elPaymentCheckboxes.innerHTML = '';
    paymentTables.forEach(table => {
        const wrapper = document.createElement('div');
        wrapper.className = 'payment-option';
        wrapper.innerHTML = `
            <input type="checkbox" id="payment-table-${table}" value="${table}" checked>
            <label for="payment-table-${table}">
                <span>${paymentLabels[table].plural}</span>
                <span class="payment-option-multiplier">(x${table})</span>
            </label>
            <div class="payment-limit">
                <span>Fichas máx:</span>
                <input type="number" min="1" max="20" value="${paymentMaxMultipliers[table]}" data-table="${table}">
            </div>
        `;
        const checkbox = wrapper.querySelector('input[type="checkbox"]');
        const multiplier = wrapper.querySelector('input[type="number"]');
        checkbox.addEventListener('change', generatePaymentQuestion);
        multiplier.addEventListener('click', event => event.stopPropagation());
        multiplier.addEventListener('change', () => {
            let value = parseInt(multiplier.value, 10);
            if (Number.isNaN(value) || value < 1) value = 1;
            multiplier.value = Math.min(value, 20);
            paymentMaxMultipliers[table] = parseInt(multiplier.value, 10);
            paymentMustRepeat = false;
            generatePaymentQuestion();
        });
        elPaymentCheckboxes.appendChild(wrapper);
    });
}

function generatePaymentQuestion() {
    if (paymentMustRepeat) {
        elPaymentAnswer.value = '';
        elPaymentAnswer.focus();
        return;
    }

    const selectedTables = Array.from(elPaymentCheckboxes.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => parseInt(checkbox.value, 10));
    if (selectedTables.length === 0) {
        elPaymentQuestion.textContent = 'Selecciona fichas abajo';
        elPaymentAnswer.disabled = true;
        elPaymentSubmit.disabled = true;
        return;
    }

    elPaymentAnswer.disabled = false;
    elPaymentSubmit.disabled = false;
    paymentTerms = selectedTables.map(table => {
        const multiplier = Math.floor(Math.random() * paymentMaxMultipliers[table]) + 1;
        return { table, multiplier, result: table * multiplier };
    });
    paymentCorrectAnswer = paymentTerms.reduce((total, term) => total + term.result, 0);
    elPaymentQuestion.textContent = paymentTerms.map(term => {
        const label = term.multiplier === 1 ? paymentLabels[term.table].singular : paymentLabels[term.table].plural;
        return `${term.multiplier} ${label}`;
    }).join(' + ');
    elPaymentQuestion.classList.toggle('compact', elPaymentQuestion.textContent.length > 50);
    elPaymentAnswer.value = '';
    elPaymentAnswer.focus();
    elPaymentFeedback.textContent = '';
    elPaymentFeedback.className = 'payment-feedback';
}

function validatePaymentAnswer() {
    if (elPaymentAnswer.disabled) return;
    const answer = parseInt(elPaymentAnswer.value, 10);
    if (Number.isNaN(answer)) return;

    if (answer === paymentCorrectAnswer) {
        elPaymentFeedback.textContent = '¡Cálculo correcto! Excelente trabajo.';
        elPaymentFeedback.className = 'payment-feedback correct';
        paymentMustRepeat = false;
        setTimeout(generatePaymentQuestion, 900);
        return;
    }

    const breakdown = paymentTerms.map(term => term.result).join(' + ');
    elPaymentFeedback.textContent = `Incorrecto. Valores: ${breakdown} = ${paymentCorrectAnswer}`;
    elPaymentFeedback.className = 'payment-feedback error';
    paymentMustRepeat = true;
    elPaymentAnswer.value = '';
    elPaymentAnswer.classList.remove('payment-shake');
    void elPaymentAnswer.offsetWidth;
    elPaymentAnswer.classList.add('payment-shake');
    elPaymentAnswer.focus();
}

function openFileViewer() {
    closePersonalizer();
    closePayments();
    closeComingSoon();
    clearViewerSelection();
    elFileViewerButton.classList.add('active');
    elFileViewerOverlay.classList.add('active');
    elFileViewerOverlay.setAttribute('aria-hidden', 'false');
    renderViewerFileList();
}

function closeFileViewer() {
    exitFileFocusMode();
    clearViewerSelection();
    elFileViewerButton.classList.remove('active');
    elFileViewerOverlay.classList.remove('active');
    elFileViewerOverlay.setAttribute('aria-hidden', 'true');
}

function openDocumentFullscreen(item) {
    const extension = item.file.name.split('.').pop().toLowerCase();
    const isImage = item.file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);

    elFileViewerOverlay.classList.remove('active');
    elDocumentFullscreenOverlay.classList.add('active');
    elDocumentFullscreenOverlay.setAttribute('aria-hidden', 'false');
    elDocumentFullscreenOverlay.scrollTop = 0;
    elFullscreenDocumentFallback.classList.toggle('hidden', isImage);
    elFullscreenDocumentImage.classList.toggle('hidden', !isImage);
    if (isImage) {
        elFullscreenDocumentImage.src = item.url;
        elFullscreenDocumentImage.alt = item.file.name;
        elFullscreenDocumentImage.onload = () => {
            elDocumentFullscreenOverlay.scrollTop = 0;
        };
    }
}

function closeDocumentFullscreen() {
    elDocumentFullscreenOverlay.classList.remove('active');
    elDocumentFullscreenOverlay.setAttribute('aria-hidden', 'true');
    elFullscreenDocumentImage.removeAttribute('src');
    elFileViewerOverlay.classList.add('active');
    elFileViewerOverlay.setAttribute('aria-hidden', 'false');
}

function addViewerFiles(fileList) {
    Array.from(fileList || []).forEach(file => {
        viewerFiles.push({
            id: `viewer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            url: URL.createObjectURL(file)
        });
    });
    elFileInput.value = '';
    renderViewerFileList();
}

function renderViewerFileList() {
    const filter = elFileSearch.value.trim().toLowerCase();
    const visibleFiles = viewerFiles.filter(item => item.file.name.toLowerCase().includes(filter));
    elFileCounter.textContent = viewerFiles.length;
    elFileEmpty.classList.toggle('hidden', visibleFiles.length > 0);
    elFileEmpty.textContent = viewerFiles.length === 0 ? 'No hay archivos cargados' : 'No hay coincidencias';
    elFileList.querySelectorAll('.file-list-item').forEach(item => item.remove());

    visibleFiles.forEach(item => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `file-list-item${viewerCurrentFile && viewerCurrentFile.id === item.id ? ' active' : ''}`;
        const extension = item.file.name.split('.').pop().toLowerCase();
        const isImage = item.file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
        button.innerHTML = `${isImage
            ? `<img class="file-thumbnail" src="${item.url}" alt="">`
            : `<span class="file-thumbnail-placeholder">${escapeHtml(extension.toUpperCase())}</span>`
        }<span class="file-list-name">${escapeHtml(item.file.name)}</span>`;
        button.addEventListener('click', () => openDocumentFullscreen(item));
        elFileList.appendChild(button);
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function selectViewerFile(id, focusMode = true) {
    viewerCurrentFile = viewerFiles.find(item => item.id === id) || null;
    renderViewerFileList();
    if (viewerCurrentFile) {
        setupViewerFile(viewerCurrentFile);
        if (focusMode) {
            enterFileFocusMode();
        }
    }
}

function enterFileFocusMode() {
    document.querySelector('.file-viewer-panel').classList.add('focus-mode');
}

function exitFileFocusMode() {
    document.querySelector('.file-viewer-panel').classList.remove('focus-mode');
}

function resetViewerRenderers() {
    [elFileImage, elFilePdf, elFileEpub, elFileText, elFileFallback].forEach(element => {
        element.classList.add('hidden');
    });
    elFilePdfControls.classList.add('hidden');
    elFileEpub.innerHTML = '';
    viewerEpubRendition = null;
}

function clearViewerSelection() {
    viewerCurrentFile = null;
    elFileViewerBody.classList.add('documents-only');
}

function setupViewerFile(item) {
    const file = item.file;
    const extension = file.name.split('.').pop().toLowerCase();
    const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
    const isPdf = extension === 'pdf' || file.type === 'application/pdf';
    const isEpub = extension === 'epub' || file.type === 'application/epub+zip';
    const isText = file.type.startsWith('text/') || ['txt', 'md', 'json', 'js', 'html', 'css', 'csv'].includes(extension);

    elFileViewerBody.classList.remove('documents-only');
    elFilePreview.classList.remove('hidden');
    elFilePreviewToolbar.classList.remove('hidden');
    elFileName.textContent = file.name;
    elFileMeta.textContent = `${formatViewerBytes(file.size)} • ${file.type || 'Archivo'}`;
    resetViewerRenderers();

    if (isImage) {
        elFileImage.src = item.url;
        elFileImage.classList.remove('hidden');
    } else if (isPdf) {
        loadViewerPdf(item.url);
    } else if (isEpub && typeof window.ePub === 'function') {
        loadViewerEpub(file);
    } else if (isText) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            elFileText.textContent = reader.result;
            elFileText.classList.remove('hidden');
        });
        reader.readAsText(file);
    } else {
        elFileFallback.classList.remove('hidden');
    }
}

function formatViewerBytes(bytes) {
    if (!bytes) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${parseFloat((bytes / Math.pow(1024, unitIndex)).toFixed(2))} ${units[unitIndex]}`;
}

async function loadViewerPdf(url) {
    if (!window.pdfjsLib) {
        elFileFallback.textContent = 'No se pudo cargar el visor PDF. Descarga el archivo para abrirlo.';
        elFileFallback.classList.remove('hidden');
        return;
    }
    try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        viewerPdfDocument = await window.pdfjsLib.getDocument(url).promise;
        viewerPdfTotalPages = viewerPdfDocument.numPages;
        await renderViewerPdfPage(1);
    } catch (error) {
        elFileFallback.textContent = 'No se pudo visualizar este PDF, pero puedes descargarlo.';
        elFileFallback.classList.remove('hidden');
    }
}

async function renderViewerPdfPage(pageNumber) {
    if (!viewerPdfDocument || pageNumber < 1 || pageNumber > viewerPdfTotalPages) return;
    viewerPdfPage = pageNumber;
    const page = await viewerPdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.25 });
    elFilePdf.width = viewport.width;
    elFilePdf.height = viewport.height;
    await page.render({ canvasContext: elFilePdf.getContext('2d'), viewport }).promise;
    elFilePdf.classList.remove('hidden');
    elFilePdfControls.classList.remove('hidden');
    elPdfPageNumber.textContent = `${pageNumber} / ${viewerPdfTotalPages}`;
}

function loadViewerEpub(file) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        const book = window.ePub(reader.result);
        viewerEpubRendition = book.renderTo(elFileEpub, { width: '100%', height: '100%' });
        viewerEpubRendition.display();
        elFileEpub.classList.remove('hidden');
    });
    reader.readAsArrayBuffer(file);
}

function downloadViewerFile() {
    if (!viewerCurrentFile) return;
    const link = document.createElement('a');
    link.href = viewerCurrentFile.url;
    link.download = viewerCurrentFile.file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
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
    root.style.setProperty('--viewer-bg', hexToRgba(theme.bg, 0.96));
    root.style.setProperty('--viewer-surface', hexToRgba(theme.panel, 0.98));
    root.style.setProperty('--viewer-soft', hexToRgba(theme.primary, 0.08));
    root.style.setProperty('--viewer-border', hexToRgba(theme.primary, 0.28));
    root.style.setProperty('--viewer-accent', theme.primary);
    root.style.setProperty('--viewer-accent-soft', hexToRgba(theme.primary, 0.18));
    root.style.setProperty('--viewer-text-muted', hexToRgba(theme.accent, 0.82));
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
