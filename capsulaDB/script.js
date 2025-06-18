// Navegación y progreso
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    updateProgress();
    if (sectionId !== 'formulario') document.getElementById('floatingMenu').style.display = 'block';
    else document.getElementById('floatingMenu').style.display = 'none';
}

function updateProgress() {
    const sections = document.querySelectorAll('.section');
    const activeIndex = Array.from(sections).findIndex(section => section.classList.contains('active'));
    const progress = ((activeIndex + 1) / sections.length) * 100;
    document.getElementById('progress').style.width = progress + '%';
    document.getElementById('progress').setAttribute('aria-valuenow', progress);
}

// Formulario de ingreso
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    let isValid = true;

    if (!nombre) {
        document.getElementById('nombre-error').textContent = 'El nombre es obligatorio.';
        document.getElementById('nombre-error').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('nombre-error').style.display = 'none';
    }

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        document.getElementById('correo-error').textContent = 'Ingrese un correo válido.';
        document.getElementById('correo-error').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('correo-error').style.display = 'none';
    }

    if (isValid) {
        localStorage.setItem('userName', nombre);
        localStorage.setItem('userEmail', correo);
        showSection('portada');
    }
});

// Borrar datos
function clearLocalStorage() {
    localStorage.clear();
    location.reload();
}

// Chatbot
function openChatbot() {
    window.open('https://chatgpt.com/share/6851af98-8edc-8009-b480-dfbbf507bea7', '_blank');
}

// Video-Quiz
let videoPlayer;
let quizResponses = {};

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('userName')) showSection('portada');
    else showSection('formulario');

    if (document.getElementById('videoPlayer')) {
        videoPlayer = document.getElementById('videoPlayer');
        // Asegurarse que la API de YouTube esté lista si es un video de YouTube
        // Esto es más relevante si se carga dinámicamente o se usa la API de JS de YouTube
        // Para un iframe simple con enablejsapi=1, addEventListener debería funcionar una vez cargado el DOM.
        videoPlayer.addEventListener('timeupdate', checkVideoTime);
    } else {
        console.log("Video player element not found.");
    }


    quizResponses = JSON.parse(localStorage.getItem('quizResponses')) || {};
    updateSavedResponses(); // Muestra respuestas de reflexión guardadas

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
                updateSavedResponses(); // Actualiza la visualización de respuestas guardadas
            }
        });
    }
});

function checkVideoTime() {
    if (!videoPlayer || typeof videoPlayer.currentTime === 'undefined') {
      // console.log("Video player no listo o currentTime no disponible.");
      return;
    }
    const time = Math.floor(videoPlayer.currentTime);

    // Pregunta 1: Minuto 3:00 (180 segundos)
    if (time === 180 && !quizResponses['q1']) {
        videoPlayer.pause();
        showQuizOverlay('Según el video, ¿cuál es el foco principal del Diseño Conceptual en su etapa inicial?', [
            { value: 'a', text: 'Definir tipos de datos y optimizar consultas SQL.' },
            { value: 'b', text: 'Crear tablas detalladas y aplicar normalización.' },
            { value: 'c', text: 'Identificar entidades importantes y las relaciones de alto nivel entre ellas.', correct: true },
            { value: 'd', text: 'Especificar claves primarias y foráneas para todas las entidades.' }
        ], 'q1', 'mcq');
    }
    // Pregunta 2: Minuto 11:00 (660 segundos)
    else if (time === 660 && !quizResponses['q2']) {
        videoPlayer.pause();
        showQuizOverlay('En el Diseño Lógico, ¿qué técnica es vital, según el video, para organizar los datos y reducir redundancias antes de pasar al SGBD? Arrastra el término correcto a la zona.', [
            { value: 'a', text: 'Normalización', correct: true }, // Opción correcta
            { value: 'b', text: 'Desnormalización' },
            { value: 'c', text: 'Creación de Índices' }
        ], 'q2', 'drag');
    }
    // Pregunta 3: Minuto 19:00 (1140 segundos)
    else if (time === 1140 && !quizResponses['q3']) {
        videoPlayer.pause();
        showQuizOverlay('En el Diseño Físico, relaciona cada concepto del modelo de datos con su representación típica en un SGBD, según lo explicado:', [
            { value: 'entity', text: 'Entidad (del modelo lógico)', correct_match_target: 'table' },
            { value: 'attribute', text: 'Atributo de una entidad', correct_match_target: 'column' },
            { value: 'relationship', text: 'Relación entre entidades', correct_match_target: 'foreign_key' }
        ], 'q3', 'match', [
            { value: 'table', text: 'Tabla en la base de datos' },
            { value: 'column', text: 'Columna de una tabla' },
            { value: 'foreign_key', text: 'Clave Foránea' },
            { value: 'index', text: 'Índice para optimización' } // Distractor
        ]);
    }
}


function showQuizOverlay(question, options, qId, type = 'mcq', targets = []) {
    const overlay = document.getElementById('quizOverlay');
    const questionDiv = document.getElementById('quizQuestion'); // Este es el div dentro de .quiz-content
    
    // Limpiar contenido anterior de quizQuestion
    questionDiv.innerHTML = ''; 

    // El h3 ya está en el HTML, solo actualizamos el texto de la pregunta y las opciones.
    // document.getElementById('quizOverlayTitle').textContent = "Pregunta del Video"; // O podría ser dinámico

    let questionContent = `<p>${question}</p>`; // El texto de la pregunta en sí.

    if (type === 'mcq') {
        questionContent += options.map(opt => `<label class="quiz-option-label"><input type="radio" name="${qId}" value="${opt.value}" aria-label="${opt.text}"> ${opt.text}</label>`).join('');
    } else if (type === 'drag') {
        questionContent += '<p class="instructions">Arrastra el término correcto a la zona designada:</p>';
        questionContent += '<div class="drag-drop-container" style="display: flex; justify-content: space-around; align-items: flex-start; margin-top: 15px;">';
        questionContent += '<div class="draggable-items" style="display: flex; flex-direction: column; gap: 10px;">';
        options.forEach(opt => {
            questionContent += `<div class="draggable" data-value="${opt.value}" draggable="true" aria-grabbed="false">${opt.text}</div>`;
        });
        questionContent += '</div>';
        questionContent += '<div class="dropzone" aria-dropeffect="move">Soltar aquí</div>';
        questionContent += '</div>';
    } else if (type === 'match') {
        questionContent += '<p class="instructions">Arrastra los conceptos de la izquierda a sus correspondencias de la derecha:</p>';
        questionContent += '<div class="match-columns-container" style="display: flex; justify-content: space-between; margin-top: 15px;">';
        questionContent += '<div class="column left-column" style="width: 45%; display: flex; flex-direction: column; gap: 10px;">';
        options.forEach(opt => { // Estos son los items arrastrables
            questionContent += `<div class="match-item draggable" data-match-item-value="${opt.value}" draggable="true" aria-grabbed="false">${opt.text}</div>`;
        });
        questionContent += '</div>';
        questionContent += '<div class="column right-column" style="width: 45%; display: flex; flex-direction: column; gap: 10px;">';
        targets.forEach(t => { // Estas son las zonas de drop
            questionContent += `<div class="match-target dropzone" data-match-target-value="${t.value}" aria-dropeffect="move">${t.text} (Asociar aquí)</div>`;
        });
        questionContent += '</div></div>';
        questionContent += '<button id="submitMatchAnswers" class="btn" style="margin-top: 20px;">Revisar Emparejamientos</button>';
    }

    questionDiv.innerHTML = questionContent; // Insertar el contenido de la pregunta y opciones
    overlay.style.display = 'flex'; // Mostrar el overlay

    // Event Listeners y jQuery UI (si está disponible)
    if (typeof $ !== 'undefined' && $.ui) {
        if (type === 'mcq') {
            $('input[name="' + qId + '"]').off('change').on('change', function() {
                $(this).closest('.quiz-content').find('label.quiz-option-label').css('background-color', 'rgba(0, 102, 87, 0.7)'); // Reset others
                $(this).closest('label.quiz-option-label').css('background-color', '#BC955C'); // Highlight selected

                const selected = $(this).val();
                const correctOption = options.find(opt => opt.correct);
                const isCorrect = correctOption ? selected === correctOption.value : false;
                quizResponses[qId] = { answer: selected, correct: isCorrect };
                localStorage.setItem('quizResponses', JSON.stringify(quizResponses));
                setTimeout(() => submitQuizAnswer(qId), 500);
            });
        } else if (type === 'drag') {
            $('.draggable').draggable({
                revert: 'invalid',
                containment: 'document',
                helper: 'clone',
                start: function() { $(this).css('opacity', 0.5).attr('aria-grabbed', 'true'); },
                stop: function() { $(this).css('opacity', 1).attr('aria-grabbed', 'false'); }
            });
            $('.dropzone').droppable({
                accept: '.draggable',
                hoverClass: "ui-state-hover", // jQuery UI class for hover
                drop: function(event, ui) {
                    const droppedItemText = ui.draggable.text();
                    const droppedItemValue = ui.draggable.data('value'); // Get value from data attribute
                    $(this).css('background-color', '#006657').text('Recibido: ' + droppedItemText).addClass('item-dropped');
                    ui.draggable.hide();

                    const correctOption = options.find(opt => opt.correct);
                    const isCorrect = correctOption ? droppedItemValue === correctOption.value : false;
                    
                    quizResponses[qId] = { answer: droppedItemText, correct: isCorrect };
                    localStorage.setItem('quizResponses', JSON.stringify(quizResponses));
                    setTimeout(() => submitQuizAnswer(qId), 500);
                }
            });
        } else if (type === 'match') {
            let userMatches = {}; // item_value -> target_value
            $('.match-item.draggable').draggable({
                revert: 'invalid',
                containment: '.match-columns-container',
                helper: 'clone',
                start: function() { $(this).css('opacity', 0.5).attr('aria-grabbed', 'true'); },
                stop: function() { $(this).css('opacity', 1).attr('aria-grabbed', 'false'); }
            });
            $('.match-target.dropzone').each(function() {
                $(this).droppable({
                    accept: '.match-item.draggable',
                    hoverClass: "ui-state-hover",
                    drop: function(event, ui) {
                        const droppedItemOriginal = ui.draggable; // El elemento original
                        const droppedItemText = droppedItemOriginal.text();
                        const droppedItemValue = droppedItemOriginal.data('match-item-value');
                        const targetValue = $(this).data('match-target-value');
                        
                        // Limpiar target si ya tiene algo y mostrar el original
                        if ($(this).data('dropped-item-value')) {
                            const prevItemValue = $(this).data('dropped-item-value');
                            $(`.match-item.draggable[data-match-item-value="${prevItemValue}"]`).show();
                        }
                        
                        $(this).find('.dropped-item-display').remove(); // Remover display anterior
                        $(this).append(`<div class="dropped-item-display">${droppedItemText}</div>`).addClass('item-dropped');
                        $(this).data('dropped-item-value', droppedItemValue); // Guardar qué item se dropeó aquí

                        droppedItemOriginal.hide(); // Ocultar el original de la lista izquierda
                        userMatches[droppedItemValue] = targetValue;
                    }
                });
            });

            $('#submitMatchAnswers').off('click').on('click', function() {
                let correctCount = 0;
                options.forEach(opt => { // options son los items arrastrables
                    if (userMatches[opt.value] === opt.correct_match_target) {
                        correctCount++;
                    }
                });
                const allCorrect = correctCount === options.length;
                quizResponses[qId] = {
                    answer: JSON.stringify(userMatches),
                    correct: allCorrect,
                    details: `${correctCount} de ${options.length} correctas`
                };
                localStorage.setItem('quizResponses', JSON.stringify(quizResponses));
                submitQuizAnswer(qId);
            });
        }
    } else {
        console.error("jQuery or jQuery UI not loaded. Interactive questions might not work as intended.");
        // Fallback para MCQ si jQuery no está
        if (type === 'mcq') {
            document.querySelectorAll(`input[name="${qId}"]`).forEach(radio => {
                radio.onchange = function() {
                    const selected = this.value;
                    const correctOption = options.find(opt => opt.correct);
                    const isCorrect = correctOption ? selected === correctOption.value : false;
                    quizResponses[qId] = { answer: selected, correct: isCorrect };
                    localStorage.setItem('quizResponses', JSON.stringify(quizResponses));
                    setTimeout(() => submitQuizAnswer(qId), 500);
                };
            });
        }
    }
}


function submitQuizAnswer(qId) {
    if (!qId || !quizResponses[qId]) {
        if (videoPlayer) videoPlayer.play();
        document.getElementById('quizOverlay').style.display = 'none';
        return;
    }

    const response = quizResponses[qId];
    const questionContainer = document.getElementById('quizQuestion');
    
    // Remover feedback anterior si existe
    const existingFeedback = questionContainer.querySelector('.feedback-message');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    const feedbackDiv = document.createElement('p');
    feedbackDiv.className = 'feedback-message'; // Para poder removerlo después
    feedbackDiv.style.marginTop = '15px';
    feedbackDiv.style.fontWeight = 'bold';

    if (response.correct) {
        feedbackDiv.textContent = '¡Correcto!';
        feedbackDiv.style.color = '#32CD32'; // Green
    } else {
        feedbackDiv.textContent = 'Incorrecto.';
        feedbackDiv.style.color = '#FF4500'; // Orange-Red
        if (response.details) { // Para preguntas tipo match
            feedbackDiv.textContent += ` (${response.details})`;
        }
    }
    questionContainer.appendChild(feedbackDiv);

    setTimeout(() => {
        document.getElementById('quizOverlay').style.display = 'none';
        // No limpiar questionContainer aquí, se limpia al inicio de showQuizOverlay
        if (videoPlayer) videoPlayer.play();
        // updateSavedResponses(); // Si fuera necesario actualizar algo más en la UI
    }, response.correct ? 1500 : 3000); // Más tiempo para leer el feedback si es incorrecto
}


function updateSavedResponses() {
    const reflections = JSON.parse(localStorage.getItem('reflections')) || {};
    const savedDiv = document.getElementById('savedResponses');
    if (savedDiv) {
        if (Object.keys(reflections).length > 0) {
            savedDiv.innerHTML = '<h4>Reflexiones Guardadas:</h4>' +
                '<p><strong>1. ¿Qué aprendiste?</strong><br> ' + (reflections.r1 || '<em>No respondido</em>') + '</p>' +
                '<p><strong>2. ¿Cómo lo aplicarías?</strong><br> ' + (reflections.r2 || '<em>No respondido</em>') + '</p>' +
                '<p><strong>3. ¿Qué desafíos tuviste?</strong><br> ' + (reflections.r3 || '<em>No respondido</em>') + '</p>';
            savedDiv.style.display = 'block';
        } else {
            savedDiv.style.display = 'none';
        }
    }
}

// Evaluación Final
function submitFinalQuiz() {
    const mcqCorrect = checkMCQ();
    const trueFalseCorrect = checkTrueFalse();
    const totalCorrect = mcqCorrect + trueFalseCorrect;
    const score = (totalCorrect / 10) * 100; // 10 preguntas en total
    let feedback = `<p>Tu calificación: ${score.toFixed(0)}% (${totalCorrect} de 10 correctas)</p>`;

    if (score >= 70) {
        feedback += '<p style="color: #32CD32; font-weight: bold;">¡Felicidades! Has aprobado.</p>';
    } else {
        feedback += '<p style="color: #FF6347; font-weight: bold;">No alcanzaste la calificación mínima (70%). Puedes intentarlo de nuevo reiniciando la sección o borrando tus datos.</p>';
    }
    document.getElementById('quizFeedback').innerHTML = feedback;
    localStorage.setItem('finalScore', score);

    provideDetailedFeedback(); // Muestra feedback por pregunta
}

function provideDetailedFeedback() {
    const mcqAnswers = { q1: 'b', q2: 'c', q3: 'c', q4: 'c', q5: 'b' };
    ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(q => {
        const selected = document.querySelector(`input[name="${q}"]:checked`);
        const questionGroup = document.querySelector(`input[name="${q}"]`).closest('.question');
        let feedbackSpan = questionGroup.querySelector('.feedback-text');
        if (!feedbackSpan) {
            feedbackSpan = document.createElement('span');
            feedbackSpan.className = 'feedback-text';
            questionGroup.querySelector('p').appendChild(feedbackSpan);
        }
        if (selected && selected.value === mcqAnswers[q]) {
            feedbackSpan.textContent = ' (Correcto)';
            feedbackSpan.style.color = 'lightgreen';
        } else {
            feedbackSpan.textContent = ` (Incorrecto. Correcta: ${mcqAnswers[q]})`;
            feedbackSpan.style.color = 'salmon';
        }
    });

    const tfAnswers = { q6: 'true', q7: 'false', q8: 'true', q9: 'true', q10: 'false' };
    ['q6', 'q7', 'q8', 'q9', 'q10'].forEach(q => {
        const selected = document.querySelector(`input[name="${q}"]:checked`);
        const questionGroup = document.querySelector(`input[name="${q}"]`).closest('.question');
        let feedbackSpan = questionGroup.querySelector('.feedback-text');
        if (!feedbackSpan) {
            feedbackSpan = document.createElement('span');
            feedbackSpan.className = 'feedback-text';
            questionGroup.querySelector('p').appendChild(feedbackSpan);
        }
        if (selected && selected.value === tfAnswers[q]) {
            feedbackSpan.textContent = ' (Correcto)';
            feedbackSpan.style.color = 'lightgreen';
        } else {
            feedbackSpan.textContent = ` (Incorrecto. Correcta: ${tfAnswers[q]})`;
            feedbackSpan.style.color = 'salmon';
        }
    });
}


function checkMCQ() {
    const answers = { q1: 'b', q2: 'c', q3: 'c', q4: 'c', q5: 'b' };
    let correctCount = 0;
    for (const qId in answers) {
        const selectedOption = document.querySelector(`input[name="${qId}"]:checked`);
        if (selectedOption && selectedOption.value === answers[qId]) {
            correctCount++;
        }
    }
    return correctCount;
}

function checkTrueFalse() {
    const answers = { q6: 'true', q7: 'false', q8: 'true', q9: 'true', q10: 'false' };
    let correctCount = 0;
    for (const qId in answers) {
        const selectedOption = document.querySelector(`input[name="${qId}"]:checked`);
        if (selectedOption && selectedOption.value === answers[qId]) {
            correctCount++;
        }
    }
    return correctCount;
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
            <p class="password-info">Contraseña de acceso para el profesor: 1234</p>
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

// Certificado
function downloadCertificate() {
    console.log("Iniciando downloadCertificate con QRious...");

    if (typeof html2pdf === 'undefined') {
        console.error("html2pdf.js no está cargado.");
        alert("Error: La librería para generar PDF no está disponible.");
        return;
    }
    // Verificar QRious (la librería expone 'QRious' como constructor o función)
    if (typeof QRious === 'undefined') { 
        console.warn("QRious (qrious.min.js) no está cargado. El QR no se mostrará.");
        // alert("Advertencia: La librería para generar códigos QR no se ha cargado.");
    }

    const nombre = localStorage.getItem('userName') || 'Participante Anónimo';
    const correo = localStorage.getItem('userEmail') || 'No proporcionado';
    const score = parseFloat(localStorage.getItem('finalScore')) || 0;
    const certTextEl = document.getElementById('cert-text');
    const qrCodeEl = document.getElementById('qr-code'); // Este es el DIV contenedor

    if (!certTextEl) {
        console.error("Elemento del DOM #cert-text no encontrado.");
        alert("Error: No se puede encontrar el elemento para el texto del certificado.");
        return;
    }
    if (!qrCodeEl) {
        console.error("Elemento del DOM #qr-code no encontrado.");
        // Considerar si el certificado puede continuar sin QR
    } else {
        qrCodeEl.innerHTML = ''; // Limpiar contenido anterior del div QR
        console.log("Elemento #qr-code encontrado y limpiado para QRious.");
    }

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
            <p style="font-size: 0.7em; color: #ffff; margin-top: 15px;">Fecha de emisión: ${formattedDate}</p>
        </div>
    `;

    // Generar QRCode con QRious
    if (typeof QRious === 'function' && qrCodeEl) { // QRious debería ser una función (constructor)
        console.log("Intentando generar QRCode con QRious...");
        try {
            const canvasElement = document.createElement('canvas'); 
            // QRious necesita un elemento canvas existente o crea uno si no se especifica 'element'
            // pero para controlar dónde se añade, es mejor crear y pasar el elemento.

            new QRious({
                element: canvasElement, // El canvas donde QRious dibujará
                value: 'https://github.com/VMDiazL',
                size: 85,       // Tamaño en píxeles del QR
                level: 'H',     // Nivel de corrección: L, M, Q, H
                background: '#ffffff', // Fondo blanco
                foreground: '#000000', // Código QR negro
                padding: 0 // QRious por defecto no tiene padding, ajusta si es necesario
            });
            
            // Una vez que QRious ha dibujado en el canvas, añadir el canvas al div qrCodeEl
            qrCodeEl.appendChild(canvasElement);
            console.log("QRious generó QR en canvas y se añadió a #qr-code.");

        } catch (e) {
            console.error("Error DETALLADO al generar QRCode con QRious:", e);
            if (qrCodeEl) {
                qrCodeEl.innerHTML = "<p style='font-size:0.6em; color:red;'>Error al crear QR (qrious)</p>";
            }
        }
    } else if (qrCodeEl) {
        // qrCodeEl existe pero QRious no es una función (o no está definido)
        qrCodeEl.innerHTML = "<p style='font-size:0.6em; color:orange;'>Librería QRious no cargada o no es función</p>";
        console.log("QRious no es una función o no está definido, pero qrCodeEl existe. No se generará QR.");
    } else {
        // Ni QRious es función ni qrCodeEl existe
        console.log("QRious no es función o elemento qrCodeEl no encontrado. No se generará QR.");
    }
    
    const certificateElement = document.getElementById('certificate');
    if (!certificateElement) {
        console.error("Elemento #certificate no encontrado para convertir a PDF.");
        alert("Error: No se puede encontrar el contenedor del certificado para generar el PDF.");
        return;
    }

    const opt = {
      margin:       [0.35, 0.35, 0.35, 0.35],
      filename:     `certificado_${nombre.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.95 }, 
      html2canvas:  { 
                      scale: 1.5, 
                      useCORS: true, 
                      logging: false, 
                      dpi: 150,
                      letterRendering: true,
                      scrollX: 0,
                      scrollY: -window.scrollY
                    },
      jsPDF:        { 
                      unit: 'in', 
                      format: 'letter', 
                      orientation: 'landscape' 
                    },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    console.log("Iniciando generación de PDF...");
    
    // El delay ayuda a asegurar que el QR (canvas) esté completamente renderizado en el DOM
    // antes de que html2canvas intente capturarlo.
    setTimeout(() => {
        html2pdf().from(certificateElement).set(opt).save()
            .then(() => {
                console.log("PDF generado y descarga iniciada.");
            })
            .catch((err) => {
                console.error("Error durante la generación del PDF:", err);
                alert("Hubo un error al generar el certificado PDF.");
            });
    }, 300); 
}