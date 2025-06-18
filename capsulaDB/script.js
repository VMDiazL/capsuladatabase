// --- Variables Globales ---
let ytPlayer; // Para la instancia del reproductor de YouTube
let quizResponses = {};
let youtubeApiReady = false;
let playerApiLoaded = false; // Para controlar la carga del script de la API de YT
let timeCheckInterval;

// --- Navegación y Progreso ---
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    const currentSection = document.getElementById(sectionId);
    if (currentSection) {
        currentSection.classList.add('active');
    } else {
        console.error("showSection: No se encontró la sección con ID:", sectionId);
        return; // Salir si la sección no existe
    }
    
    updateProgress();

    const floatingMenu = document.getElementById('floatingMenu');
    if (floatingMenu) {
        if (sectionId !== 'formulario') {
            floatingMenu.style.display = 'block';
        } else {
            floatingMenu.style.display = 'none';
        }
    }

    // Lógica para crear/destruir el reproductor de YouTube al entrar/salir de la sección de desarrollo
    if (sectionId === 'desarrollo') {
        console.log("LOG: showSection - Navegado a 'desarrollo'. Estado de API YT:", youtubeApiReady, "Player existe:", !!ytPlayer);
        if (youtubeApiReady && !ytPlayer) {
            console.log("LOG: showSection - API lista y player no existe, creando player ahora.");
            createPlayer();
        } else if (!youtubeApiReady && document.getElementById('videoPlayer') && !playerApiLoaded) {
            console.log("LOG: showSection - API no lista, pero div existe. Intentando cargar script API.");
            loadYouTubeAPI(); // Función para cargar la API
        }
    } else {
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
            console.log("LOG: showSection - Saliendo de 'desarrollo', pausando video.");
            ytPlayer.pauseVideo();
            // Considerar destruir el player si se desea liberar más recursos:
            // if (typeof ytPlayer.destroy === 'function') {
            //    ytPlayer.destroy();
            //    ytPlayer = null;
            //    if(timeCheckInterval) clearInterval(timeCheckInterval);
            //    console.log("LOG: showSection - Reproductor de YT destruido.");
            // }
        }
    }
}

function updateProgress() {
    const progressBar = document.getElementById('progress');
    if (!progressBar) return;

    const sections = document.querySelectorAll('.section');
    const activeSection = document.querySelector('.section.active');
    if (!activeSection) return;

    const activeIndex = Array.from(sections).findIndex(section => section.id === activeSection.id);
    const progress = ((activeIndex + 1) / sections.length) * 100;
    
    progressBar.style.width = progress + '%';
    progressBar.setAttribute('aria-valuenow', progress);
}

// --- Formulario de Ingreso ---
if (document.getElementById('userForm')) {
    document.getElementById('userForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = document.getElementById('nombre').value.trim();
        const correo = document.getElementById('correo').value.trim();
        let isValid = true;

        const nombreError = document.getElementById('nombre-error');
        if (!nombre) {
            nombreError.textContent = 'El nombre es obligatorio.';
            nombreError.style.display = 'block';
            isValid = false;
        } else {
            nombreError.style.display = 'none';
        }

        const correoError = document.getElementById('correo-error');
        if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            correoError.textContent = 'Ingrese un correo válido.';
            correoError.style.display = 'block';
            isValid = false;
        } else {
            correoError.style.display = 'none';
        }

        if (isValid) {
            localStorage.setItem('userName', nombre);
            localStorage.setItem('userEmail', correo);
            showSection('portada');
        }
    });
}

// --- Funciones Utilitarias ---
function clearLocalStorage() {
    localStorage.clear();
    // Resetear quizResponses y el estado del video si es necesario
    quizResponses = {};
    if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        ytPlayer.destroy();
        ytPlayer = null;
    }
    if (timeCheckInterval) clearInterval(timeCheckInterval);
    location.reload(); // Recargar para ir al formulario de inicio
}

function openChatbot() {
    window.open('https://chatgpt.com/share/6851af98-8edc-8009-b480-dfbbf507bea7', '_blank');
}

// --- Lógica para Video-Quiz con API de YouTube ---
// Esta función DEBE ser global para que la API de YouTube la llame.
function onYouTubeIframeAPIReady() {
    console.log("LOG: (Global) onYouTubeIframeAPIReady fue llamado por la API de YouTube.");
    youtubeApiReady = true;
    const activeSection = document.querySelector('.section.active');
    if (activeSection && activeSection.id === 'desarrollo') {
        console.log("LOG: onYouTubeIframeAPIReady - Ya en 'desarrollo', intentando crear player.");
        createPlayer();
    }
}

function loadYouTubeAPI() {
    if (document.getElementById('videoPlayer') && !playerApiLoaded) {
        console.log("LOG: loadYouTubeAPI - Cargando script de la API de YouTube IFrame.");
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
        playerApiLoaded = true;
    } else if (playerApiLoaded) {
        console.log("LOG: loadYouTubeAPI - Script de API ya marcado como cargado/en proceso.");
    } else {
        console.log("LOG: loadYouTubeAPI - No se encontró #videoPlayer, no se carga API de YouTube.");
    }
}

function createPlayer() {
    console.log("LOG: createPlayer - Intentando crear reproductor...");
    if (!youtubeApiReady) {
        console.warn("LOG: createPlayer - API de YT no lista aún. Abortando.");
        return;
    }
    if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        console.log("LOG: createPlayer - Destruyendo reproductor existente.");
        ytPlayer.destroy();
        ytPlayer = null;
    }
    
    const playerDiv = document.getElementById('videoPlayer');
    if (!playerDiv) {
        console.error("LOG: createPlayer - Elemento 'videoPlayer' (div) NO encontrado.");
        return;
    }
    playerDiv.innerHTML = ''; 
    console.log("LOG: createPlayer - Elemento 'videoPlayer' (div) encontrado y limpiado.");

    try {
        console.log("LOG: createPlayer - Instanciando YT.Player...");
        ytPlayer = new YT.Player('videoPlayer', {
            videoId: 'AOWZiqKb7LU',
            playerVars: { 'playsinline': 1, 'origin': window.location.origin, 'controls': 1 },
            events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange, 'onError': onPlayerError }
        });
    } catch (e) {
        console.error("LOG: createPlayer - Error CATASTRÓFICO al instanciar YT.Player:", e);
    }
}

function onPlayerReady(event) {
    console.log("LOG: onPlayerReady - Reproductor de YT está listo. Video ID:", event.target.getVideoData().video_id);
    // No autoplay; el usuario debe iniciar. El monitoreo de tiempo comenzará en onStateChange.
}

function onPlayerStateChange(event) {
    console.log("LOG: onPlayerStateChange - Nuevo estado:", event.data, "(PLAYING=1, PAUSED=2, ENDED=0)");
    if (event.data === YT.PlayerState.PLAYING) {
        console.log("LOG: onPlayerStateChange - Video REPRODUCIÉNDOSE. Iniciando monitoreo.");
        if (timeCheckInterval) clearInterval(timeCheckInterval);
        timeCheckInterval = setInterval(checkVideoTime, 1000);
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        console.log("LOG: onPlayerStateChange - Video PAUSADO o FINALIZADO. Deteniendo monitoreo.");
        if (timeCheckInterval) clearInterval(timeCheckInterval);
    }
}

function onPlayerError(event) {
    console.error("LOG: onPlayerError - Error del reproductor de YT:", event.data);
}

function checkVideoTime() {
    if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function' && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
        const currentTime = Math.floor(ytPlayer.getCurrentTime());
        // console.log("LOG: checkVideoTime - Tiempo actual:", currentTime); // Descomentar para depuración

        const quizTriggers = [
            { time: 360, id: 'q1', attempted: quizResponses['q1'] && quizResponses['q1'].attempted, question: 'Según el video, ¿cuál es el foco principal del Diseño Conceptual en su etapa inicial?', options: [ { value: 'a', text: 'Definir tipos de datos y optimizar consultas SQL.' }, { value: 'b', text: 'Crear tablas detalladas y aplicar normalización.' }, { value: 'c', text: 'Identificar entidades importantes y las relaciones de alto nivel entre ellas.', correct: true }, { value: 'd', text: 'Especificar claves primarias y foráneas para todas las entidades.' }], type: 'mcq' },
            { time: 600, id: 'q2', attempted: quizResponses['q2'] && quizResponses['q2'].attempted, question: 'En el Diseño Lógico, ¿qué técnica es vital, según el video, para organizar los datos y reducir redundancias antes de pasar al SGBD? Arrastra el término correcto a la zona.', options: [ { value: 'a', text: 'Normalización', correct: true }, { value: 'b', text: 'Desnormalización' }, { value: 'c', text: 'Creación de Índices' }], type: 'drag'},
            { time: 1200, id: 'q3', attempted: quizResponses['q3'] && quizResponses['q3'].attempted, question: 'En el Diseño Físico, relaciona cada concepto del modelo de datos con su representación típica en un SGBD, según lo explicado:', options: [ { value: 'entity', text: 'Entidad (del modelo lógico)', correct_match_target: 'table' }, { value: 'attribute', text: 'Atributo de una entidad', correct_match_target: 'column' }, { value: 'relationship', text: 'Relación entre entidades', correct_match_target: 'foreign_key' }], type: 'match', targets: [ { value: 'table', text: 'Tabla en la base de datos' }, { value: 'column', text: 'Columna de una tabla' }, { value: 'foreign_key', text: 'Clave Foránea' }, { value: 'index', text: 'Índice para optimización' }]}
        ];

        for (const trigger of quizTriggers) {
            // Usar un pequeño rango para capturar el tiempo, ya que el intervalo es de 1s
            if (currentTime >= trigger.time && currentTime < (trigger.time + 2) && !trigger.attempted) {
                ytPlayer.pauseVideo();
                console.log(`LOG: checkVideoTime - PAUSADO en ~${trigger.time}s para ${trigger.id}`);
                quizResponses[trigger.id] = { ...quizResponses[trigger.id], attempted: true }; // Marcar como intentada
                showQuizOverlay(trigger.question, trigger.options, trigger.id, trigger.type, trigger.targets || []);
                break; // Salir del bucle una vez que se activa un quiz
            }
        }
    }
}

function showQuizOverlay(question, options, qId, type = 'mcq', targets = []) {
    const overlay = document.getElementById('quizOverlay');
    const questionDiv = document.getElementById('quizQuestion');
    if (!overlay || !questionDiv) {
        console.error("showQuizOverlay: Elementos del overlay no encontrados.");
        return;
    }
    
    questionDiv.innerHTML = ''; 
    let questionContent = `<p class="quiz-text-question">${question}</p>`; 

    if (type === 'mcq') {
        questionContent += options.map(opt => `<label class="quiz-option-label"><input type="radio" name="${qId}" value="${opt.value}" aria-label="${opt.text.replace(/"/g, '"')}"> ${opt.text}</label>`).join('');
    } else if (type === 'drag') {
        questionContent += '<p class="instructions">Arrastra el término correcto a la zona designada:</p>';
        questionContent += '<div class="drag-drop-container">';
        questionContent += '<div class="draggable-items">';
        options.forEach(opt => {
            questionContent += `<div class="draggable" data-value="${opt.value}" draggable="true" aria-grabbed="false" tabindex="0">${opt.text}</div>`;
        });
        questionContent += '</div>';
        questionContent += '<div class="dropzone" aria-dropeffect="move" tabindex="0">Soltar aquí</div>';
        questionContent += '</div>';
    } else if (type === 'match') {
        questionContent += '<p class="instructions">Arrastra los conceptos de la izquierda a sus correspondencias de la derecha:</p>';
        questionContent += '<div class="match-columns-container">';
        questionContent += '<div class="column left-column">';
        options.forEach(opt => { 
            questionContent += `<div class="match-item draggable" data-match-item-value="${opt.value}" draggable="true" aria-grabbed="false" tabindex="0">${opt.text}</div>`;
        });
        questionContent += '</div>';
        questionContent += '<div class="column right-column">';
        targets.forEach(t => { 
            questionContent += `<div class="match-target dropzone" data-match-target-value="${t.value}" aria-dropeffect="move" tabindex="0">${t.text} (Asociar aquí)</div>`;
        });
        questionContent += '</div></div>';
        questionContent += '<button id="submitMatchAnswers" type="button" class="btn" style="margin-top: 20px;">Revisar Emparejamientos</button>';
    }

    questionDiv.innerHTML = questionContent;
    overlay.style.display = 'flex';

    // Inicializar jQuery UI si está disponible
    if (typeof $ !== 'undefined' && $.ui) {
        if (type === 'mcq') {
            $(`input[name="${qId}"]`).off('change').on('change', function() {
                $(this).closest('.quiz-content').find('label.quiz-option-label').removeClass('selected-option');
                $(this).closest('label.quiz-option-label').addClass('selected-option');
                const selected = $(this).val();
                const correctOption = options.find(opt => opt.correct);
                const isCorrect = correctOption ? selected === correctOption.value : false;
                quizResponses[qId] = { ...quizResponses[qId], answer: selected, correct: isCorrect };
                localStorage.setItem('quizResponses', JSON.stringify(quizResponses));
                setTimeout(() => submitQuizAnswer(qId), 300);
            });
        } else if (type === 'drag') {
            $('.draggable').draggable({ revert: 'invalid', containment: '.quiz-content', helper: 'clone', opacity: 0.7 });
            $('.dropzone').droppable({
                accept: '.draggable',
                hoverClass: "ui-state-hover-dropzone",
                drop: function(event, ui) {
                    const droppedItemText = ui.draggable.text();
                    const droppedItemValue = ui.draggable.data('value');
                    $(this).addClass('item-dropped').html('Recibido: <br>' + droppedItemText);
                    ui.draggable.hide();
                    const correctOption = options.find(opt => opt.correct);
                    const isCorrect = correctOption ? droppedItemValue === correctOption.value : false;
                    quizResponses[qId] = { ...quizResponses[qId], answer: droppedItemText, correct: isCorrect };
                    localStorage.setItem('quizResponses', JSON.stringify(quizResponses));
                    setTimeout(() => submitQuizAnswer(qId), 300);
                }
            });
        } else if (type === 'match') {
            let userMatches = {}; 
            $('.match-item.draggable').draggable({ revert: 'invalid', containment: '.match-columns-container', helper: 'clone', opacity: 0.7 });
            $('.match-target.dropzone').each(function() {
                $(this).droppable({
                    accept: '.match-item.draggable',
                    hoverClass: "ui-state-hover-dropzone",
                    drop: function(event, ui) {
                        const droppedItemOriginal = ui.draggable;
                        const droppedItemText = droppedItemOriginal.text();
                        const droppedItemValue = droppedItemOriginal.data('match-item-value');
                        const targetValue = $(this).data('match-target-value');
                        
                        const existingItemInTarget = $(this).find('.dropped-item-display');
                        if (existingItemInTarget.length > 0) {
                            const prevItemValue = existingItemInTarget.data('original-item-value');
                            $(`.match-item.draggable[data-match-item-value="${prevItemValue}"]`).show(); // Mostrar el anterior
                            existingItemInTarget.remove();
                        }
                        $(this).append(`<div class="dropped-item-display" data-original-item-value="${droppedItemValue}">${droppedItemText}</div>`);
                        $(this).addClass('item-dropped');
                        droppedItemOriginal.hide();
                        userMatches[droppedItemValue] = targetValue;
                    }
                });
            });
            $('#submitMatchAnswers').off('click').on('click', function() {
                let correctCount = 0;
                options.forEach(opt => {
                    if (userMatches[opt.value] === opt.correct_match_target) correctCount++;
                });
                const allCorrect = correctCount === options.length;
                quizResponses[qId] = { ...quizResponses[qId], answer: JSON.stringify(userMatches), correct: allCorrect, details: `${correctCount} de ${options.length} correctas` };
                localStorage.setItem('quizResponses', JSON.stringify(quizResponses));
                submitQuizAnswer(qId);
            });
        }
    } else {
        console.error("jQuery o jQuery UI no cargados. El quiz interactivo puede no funcionar completamente.");
         if (type === 'mcq') { /* ... (fallback MCQ si es necesario) ... */ }
    }
}

function submitQuizAnswer(qId) {
    if (!qId || !quizResponses[qId]) {
        if (ytPlayer && typeof ytPlayer.playVideo === 'function') ytPlayer.playVideo();
        document.getElementById('quizOverlay').style.display = 'none';
        return;
    }
    const response = quizResponses[qId];
    const questionContainer = document.getElementById('quizQuestion');
    const existingFeedback = questionContainer.querySelector('.feedback-message');
    if (existingFeedback) existingFeedback.remove();

    const feedbackDiv = document.createElement('p');
    feedbackDiv.className = 'feedback-message';
    feedbackDiv.style.marginTop = '15px';
    feedbackDiv.style.fontWeight = 'bold';
    if (response.correct) {
        feedbackDiv.textContent = '¡Correcto!';
        feedbackDiv.style.color = '#32CD32';
    } else {
        feedbackDiv.textContent = 'Incorrecto.';
        feedbackDiv.style.color = '#FF4500';
        if (response.details) feedbackDiv.textContent += ` (${response.details})`;
    }
    if(questionContainer) questionContainer.appendChild(feedbackDiv);

    setTimeout(() => {
        document.getElementById('quizOverlay').style.display = 'none';
        if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
            console.log("LOG: submitQuizAnswer - Reanudando video después del quiz...");
            ytPlayer.playVideo();
        }
    }, (response.correct ? 1500 : 3000));
}

// --- Resto de Funciones (updateSavedResponses, Evaluación, Reportes, Certificado) ---

function updateSavedResponses() {
    const reflections = JSON.parse(localStorage.getItem('reflections')) || {};
    const savedDiv = document.getElementById('savedResponses');
    if (savedDiv) {
        if (Object.keys(reflections).length > 0) {
            savedDiv.innerHTML = '<h4>Reflexiones Guardadas:</h4>' +
                ['r1', 'r2', 'r3'].map((rKey, index) => {
                    const labels = ["1. ¿Qué aprendiste?", "2. ¿Cómo lo aplicarías?", "3. ¿Qué desafíos tuviste?"];
                    return `<p><strong>${labels[index]}</strong><br> ${reflections[rKey] || '<em>No respondido</em>'}</p>`;
                }).join('');
            savedDiv.style.display = 'block';
        } else {
            savedDiv.style.display = 'none';
        }
    }
}

function submitFinalQuiz() {
    const mcqCorrect = checkMCQ();
    const trueFalseCorrect = checkTrueFalse();
    const totalCorrect = mcqCorrect + trueFalseCorrect;
    const score = (totalCorrect / 10) * 100;
    let feedback = `<p>Tu calificación: ${score.toFixed(0)}% (${totalCorrect} de 10 correctas)</p>`;
    if (score >= 70) {
        feedback += '<p style="color: #32CD32; font-weight: bold;">¡Felicidades! Has aprobado.</p>';
    } else {
        feedback += '<p style="color: #FF6347; font-weight: bold;">No alcanzaste la calificación mínima (70%).</p>';
    }
    document.getElementById('quizFeedback').innerHTML = feedback;
    localStorage.setItem('finalScore', score);
    provideDetailedFeedback();
}

function provideDetailedFeedback() {
    const mcqAnswers = { q1: 'b', q2: 'c', q3: 'c', q4: 'c', q5: 'b' };
    ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(q => {
        const selected = document.querySelector(`input[name="${q}"]:checked`);
        const questionP = document.querySelector(`input[name="${q}"]`).closest('.question').querySelector('p');
        let feedbackSpan = questionP.querySelector('.feedback-text');
        if (!feedbackSpan) {
            feedbackSpan = document.createElement('span');
            feedbackSpan.className = 'feedback-text';
            questionP.appendChild(feedbackSpan);
        }
        if (selected && selected.value === mcqAnswers[q]) {
            feedbackSpan.textContent = ' (Correcto)'; feedbackSpan.style.color = 'lightgreen';
        } else {
            feedbackSpan.textContent = ` (Incorrecto. Correcta: ${mcqAnswers[q]})`; feedbackSpan.style.color = 'salmon';
        }
    });
    const tfAnswers = { q6: 'true', q7: 'false', q8: 'true', q9: 'true', q10: 'false' };
    ['q6', 'q7', 'q8', 'q9', 'q10'].forEach(q => {
        const selected = document.querySelector(`input[name="${q}"]:checked`);
        const questionP = document.querySelector(`input[name="${q}"]`).closest('.question').querySelector('p');
        let feedbackSpan = questionP.querySelector('.feedback-text');
        if (!feedbackSpan) {
            feedbackSpan = document.createElement('span');
            feedbackSpan.className = 'feedback-text';
            questionP.appendChild(feedbackSpan);
        }
        if (selected && selected.value === tfAnswers[q]) {
            feedbackSpan.textContent = ' (Correcto)'; feedbackSpan.style.color = 'lightgreen';
        } else {
            feedbackSpan.textContent = ` (Incorrecto. Correcta: ${tfAnswers[q]})`; feedbackSpan.style.color = 'salmon';
        }
    });
}

function checkMCQ() {
    const answers = { q1: 'b', q2: 'c', q3: 'c', q4: 'c', q5: 'b' };
    return Object.keys(answers).reduce((count, qId) => {
        const selected = document.querySelector(`input[name="${qId}"]:checked`);
        return count + (selected && selected.value === answers[qId] ? 1 : 0);
    }, 0);
}

function checkTrueFalse() {
    const answers = { q6: 'true', q7: 'false', q8: 'true', q9: 'true', q10: 'false' };
    return Object.keys(answers).reduce((count, qId) => {
        const selected = document.querySelector(`input[name="${qId}"]:checked`);
        return count + (selected && selected.value === answers[qId] ? 1 : 0);
    }, 0);
}

// Reportes
function downloadQuizReport() {
    const nombre = localStorage.getItem('userName') || 'Participante';
    const responses = JSON.parse(localStorage.getItem('quizResponses')) || {};
    let reportContent = `<h1>Reporte Video-Quiz - ${nombre}</h1><h2>Respuestas:</h2>`;

    const questionsDesc = {
        q1: "Foco principal del Diseño Conceptual",
        q2: "Técnica vital en Diseño Lógico (Arrastrar)",
        q3: "Relacionar conceptos en Diseño Físico"
    };

    for (let i = 1; i <= 3; i++) {
        const qKey = 'q' + i;
        const response = responses[qKey];
        const questionTitle = questionsDesc[qKey] || `Pregunta ${i}`;
        reportContent += `<h3>${questionTitle}:</h3>`;
        if (response) {
            let answerText = response.answer;
            if (qKey === 'q3' && response.answer) {
                try {
                    const matches = JSON.parse(response.answer);
                    answerText = Object.entries(matches).map(([item, target]) => {
                        const itemText = $(`div[data-match-item-value="${item}"]`).text() || item;
                        const targetText = $(`div[data-match-target-value="${target}"]`).text().replace("(Asociar aquí)","").trim() || target;
                        return `<li>'${itemText}' con '${targetText}'</li>`;
                    }).join('');
                    answerText = `<ul>${answerText}</ul>`;
                } catch (e) { /* Mantener original si no es JSON o hay error */ }
            }
            reportContent += `<p>Respuesta: ${answerText || 'No respondida'}<br>Resultado: ${response.correct ? 'Correcta' : 'Incorrecta'}${response.details ? ' (' + response.details + ')' : ''}</p>`;
        } else {
            reportContent += `<p>Respuesta: No respondida<br>Resultado: N/A</p>`;
        }
    }
    reportContent += `<p style="margin-top:20px; font-style:italic; color: #555;">Contraseña para el profesor: 1234</p>`;

    const fullHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Reporte Video-Quiz - ${nombre}</title><style>body{font-family:Arial,sans-serif;margin:20px;background-color:#f0f2f5;color:#333;line-height:1.6;} .container{background-color:#fff;padding:25px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.1);} h1{color:#006657;border-bottom:2px solid #BC955C;padding-bottom:10px;margin-bottom:20px;} h2{color:#691C32;margin-top:25px;} h3{color:#005649;margin-top:20px;margin-bottom:5px;} p{background-color:#f9f9f9;padding:12px;border-radius:5px;border-left:4px solid #BC955C;margin-bottom:10px;} ul{list-style-type:disc;margin-left:20px;} li{margin-bottom:5px;}</style></head><body><div class="container">${reportContent}</div></body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_videoquiz_${nombre.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadFinalReport() {
    const nombre = localStorage.getItem('userName') || 'Participante Anónimo';
    const correo = localStorage.getItem('userEmail') || 'No proporcionado';
    const reflections = JSON.parse(localStorage.getItem('reflections')) || {};
    const score = localStorage.getItem('finalScore') || 0;

    let finalQuizAnswersHTML = '<h2>Resultados del Test Final</h2><ul>';
    const mcqAnswers = { q1: 'b', q2: 'c', q3: 'c', q4: 'c', q5: 'b' };
    const mcqQuestionsText = {
        q1: "¿Qué representa un diagrama ER en el diseño conceptual?",
        q2: "¿En qué etapa del modelamiento es CRUCIAL aplicar la normalización?",
        q3: "¿Qué elemento establece relación entre tablas referenciando clave primaria?",
        q4: "¿Cuál NO es una tarea principal del Diseño Físico mencionada?",
        q5: "¿Qué describe la cardinalidad en diseño lógico?"
    };

    for(let i = 1; i <= 5; i++) {
        const qId = 'q' + i;
        const questionText = mcqQuestionsText[qId];
        const selected = document.querySelector(`input[name="${qId}"]:checked`);
        const userAnswerValue = selected ? selected.value : "N/A";
        // Obtener el texto de la opción seleccionada
        const userAnswerText = selected ? selected.closest('label').textContent.replace(/^.\) /, '').trim() : "No respondida";
        const isCorrect = selected ? userAnswerValue === mcqAnswers[qId] : false;
        finalQuizAnswersHTML += `<li><strong>${questionText}</strong><br>Respuesta: '${userAnswerText}' - ${isCorrect ? '<span style="color:green;">Correcta</span>' : '<span style="color:red;">Incorrecta</span> (Correcta: ' + mcqAnswers[qId] + ')'}</li>`;
    }

    const tfAnswers = { q6: 'true', q7: 'false', q8: 'true', q9: 'true', q10: 'false' };
    const tfQuestionsText = {
        q6: "Un diagrama ER (Diseño Conceptual) es independiente del SGBD.",
        q7: "En Diseño Conceptual inicial, es fundamental definir atributos detallados y claves primarias.",
        q8: "El Diseño Lógico describe datos detalladamente sin considerar implementación física en SGBD.",
        q9: "La desnormalización puede ocurrir en Diseño Físico.",
        q10: "Relaciones 'uno a uno', 'uno a muchos', 'muchos a muchos' son tipos de entidades."
    };
     for(let i = 6; i <= 10; i++) {
        const qId = 'q' + i;
        const questionText = tfQuestionsText[qId];
        const selected = document.querySelector(`input[name="${qId}"]:checked`);
        const userAnswerValue = selected ? selected.value : "N/A";
        const userAnswerText = selected ? (selected.value === 'true' ? 'Verdadero' : 'Falso') : "No respondida";
        const isCorrect = selected ? userAnswerValue === tfAnswers[qId] : false;
        finalQuizAnswersHTML += `<li><strong>${questionText}</strong><br>Respuesta: '${userAnswerText}' - ${isCorrect ? '<span style="color:green;">Correcta</span>' : '<span style="color:red;">Incorrecta</span> (Correcta: ' + (tfAnswers[qId] === 'true' ? 'Verdadero':'Falso') + ')'}</li>`;
    }
    finalQuizAnswersHTML += '</ul>';

    const content = `
        <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Reporte Final - Diseño de BD</title>
        <style>
            body{font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:0; background-color:#eef1f5; color:#333;}
            .page-container{width:80%; max-width:900px; margin:30px auto; background-color:#fff; padding:30px; border-radius:10px; box-shadow:0 6px 15px rgba(0,0,0,0.1);}
            h1{color:#006657; text-align:center; border-bottom:3px solid #BC955C; padding-bottom:15px; margin-bottom:25px; font-size:2em;}
            h2{color:#691C32; margin-top:35px; margin-bottom:15px; font-size:1.6em; border-bottom:1px solid #eee; padding-bottom:8px;}
            p, li{line-height:1.7; font-size:1.05em;}
            .user-info p, .score-info p{margin:8px 0; font-size:1.1em;}
            .user-info strong, .score-info strong {color:#005649;}
            .reflections div{margin-left:20px; margin-bottom:15px; padding-left:15px; border-left:3px solid #BC955C;}
            .reflections strong{color:#602030;}
            ul{list-style:none; padding-left:0;}
            li{background-color:#f9f9f9; padding:12px; border-radius:6px; margin-bottom:10px; border:1px solid #e0e0e0;}
            li strong{display:block; margin-bottom:5px; color:#005649;}
            .password-info{margin-top:40px; text-align:center; font-style:italic; color:#777; font-size:0.95em;}
        </style></head><body><div class="page-container">
            <h1>Reporte Final: Diseño de Bases de Datos</h1>
            <div class="user-info">
                <p><strong>Nombre:</strong> ${nombre}</p>
                <p><strong>Correo:</strong> ${correo}</p>
            </div>
            <div class="score-info">
                <p><strong>Calificación Final Obtenida:</strong> ${parseFloat(score).toFixed(0)}%</p>
            </div>
            ${finalQuizAnswersHTML}
            <div class="reflections">
                <h2>Reflexiones Personales</h2>
                <div><strong>1. ¿Qué aprendiste?</strong><br>${reflections.r1 || '<em>No respondido</em>'}</div>
                <div><strong>2. ¿Cómo lo aplicarías?</strong><br>${reflections.r2 || '<em>No respondido</em>'}</div>
                <div><strong>3. ¿Qué desafíos tuviste?</strong><br>${reflections.r3 || '<em>No respondido</em>'}</div>
            </div>
            // <p class="password-info">Contraseña de acceso para el profesor: 1234</p>
        </div></body></html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_final_${nombre.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadCertificate() {
    console.log("Iniciando downloadCertificate con QRious...");
    if (typeof html2pdf === 'undefined') { /* ... */ return; }
    if (typeof QRious === 'undefined') { console.warn("QRious no está cargado."); }

    const nombre = localStorage.getItem('userName') || 'Participante Anónimo';
    const correo = localStorage.getItem('userEmail') || 'No proporcionado';
    const score = parseFloat(localStorage.getItem('finalScore')) || 0;
    const certTextEl = document.getElementById('cert-text');
    const qrCodeEl = document.getElementById('qr-code');

    if (!certTextEl) { /* ... */ return; }
    if (!qrCodeEl) { console.error("Elemento #qr-code no encontrado."); } 
    else { qrCodeEl.innerHTML = ''; }

    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()} de ${currentDate.toLocaleString('es-ES', { month: 'long' })} de ${currentDate.getFullYear()}`;
    const asesorName = "Ing. Victor Diaz";
    let certificateTitle = "Certificado de Participación";
    let certificateReason = `Por su participación en la Cápsula Educativa de Diseño de Bases de Datos.`;
    if (score >= 70) {
        certificateTitle = "Certificado de Aprobación";
        certificateReason = `Por haber completado con éxito la Cápsula Educativa de Diseño de Bases de Datos, obteniendo una calificación de <strong>${score.toFixed(0)}%</strong>.`;
    } else if (score > 0) {
        certificateReason = `Por su participación en la Cápsula Educativa de Diseño de Bases de Datos, con una calificación de <strong>${score.toFixed(0)}%</strong>.`;
    }
    certTextEl.innerHTML = `
        <div style="text-align: center; padding: 5px; position: relative;">
            <h4 style="font-size: 1.2em; color: #BC955C; margin-top: 0; margin-bottom: 10px;">${certificateTitle}</h4>
            <p style="font-size: 0.8em; margin-bottom: 5px;">Otorgado a:</p>
            <p style="font-size: 1.4em; font-weight: bold; color: #691C32; margin-bottom: 3px;">${nombre}</p>
            <p style="font-size: 0.75em; margin-bottom: 15px;">(Correo: ${correo})</p>
            <p style="font-size: 0.9em; margin: 10px 3%; line-height: 1.4;">${certificateReason}</p>
            <div style="margin-top: 20px; margin-bottom:15px; display: flex; justify-content: space-around; align-items: center;">
                 <div style="text-align: center;">
                    <p style="font-size: 0.75em; margin-bottom: 0px;">_________________________</p>
                    <p style="font-size: 0.75em; margin-top: 2px;">Asesor del Curso</p>
                    <p style="font-size: 1em; font-weight: bold; color: #691C32;">${asesorName}</p>
                </div>
            </div>
            <p style="font-size: 0.7em; color: #fffff; margin-top: 15px;">Fecha de emisión: ${formattedDate}</p>
        </div>`;

    if (typeof QRious === 'function' && qrCodeEl) {
        try {
            const canvasElement = document.createElement('canvas');
            new QRious({ element: canvasElement, value: 'https://github.com/VMDiazL', size: 85, level: 'H', background: '#ffffff', foreground: '#000000', padding: 2 });
            qrCodeEl.appendChild(canvasElement);
            console.log("QRious generó QR.");
        } catch (e) { console.error("Error con QRious:", e); if(qrCodeEl) qrCodeEl.innerHTML="<p style='font-size:0.6em; color:red;'>Error QR</p>"; }
    } else if (qrCodeEl) { qrCodeEl.innerHTML="<p style='font-size:0.6em; color:orange;'>QR Lib Error</p>"; }
    
    const certificateElement = document.getElementById('certificate');
    if (!certificateElement) { /* ... */ return; }
    const opt = {
      margin: [0.35, 0.35, 0.35, 0.35],
      filename: `certificado_${nombre.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.95 }, 
      html2canvas:  { scale: 1.5, useCORS: true, logging: false, dpi: 150, letterRendering: true, scrollX: 0, scrollY: -window.scrollY },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    setTimeout(() => { html2pdf().from(certificateElement).set(opt).save().then(()=>{console.log("PDF descargado");}).catch(err=>{console.error("Error PDF:", err);}); }, 300);
}

// DOMContentLoaded Listener (ya está al final del script anterior, asegurando que las funciones globales como onYouTubeIframeAPIReady estén definidas antes de que se cargue la API)
document.addEventListener('DOMContentLoaded', () => {
    console.log("LOG: DOMContentLoaded - DOM completamente cargado y parseado.");
    if (localStorage.getItem('userName')) {
        showSection('portada');
    } else {
        showSection('formulario');
    }
    quizResponses = JSON.parse(localStorage.getItem('quizResponses')) || {}; // Inicializar o cargar quizResponses
    updateSavedResponses();

    const reflectionForm = document.getElementById('reflectionForm');
    if (reflectionForm) {
        reflectionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const reflections = {};
            let isValid = true;
            ['r1', 'r2', 'r3'].forEach(id => {
                const inputElement = document.getElementById(id);
                const value = inputElement.value.trim();
                const errorElement = document.getElementById(`${id}-error`);
                if (!value) {
                    errorElement.textContent = 'Este campo es obligatorio.';
                    errorElement.style.display = 'block';
                    isValid = false;
                } else {
                    errorElement.style.display = 'none';
                    reflections[id] = value;
                }
            });
            if (isValid) {
                localStorage.setItem('reflections', JSON.stringify(reflections));
                const messageDiv = document.getElementById('saveMessage');
                messageDiv.textContent = 'Reflexiones guardadas con éxito.';
                messageDiv.style.display = 'block';
                setTimeout(() => messageDiv.style.display = 'none', 3000);
                updateSavedResponses();
            }
        });
    }

    loadYouTubeAPI(); // Llamar para iniciar la carga de la API de YT si es necesario
});