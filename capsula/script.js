// Gestión de almacenamiento local
function saveUserData() {
    const form = document.getElementById('userForm');
    if (!form) {
        console.error('Formulario con ID userForm no encontrado');
        return;
    }
    // Asegurarse de que no se agreguen múltiples manejadores de eventos
    form.removeEventListener('submit', handleFormSubmit); // Eliminar manejador previo si existe
    form.addEventListener('submit', handleFormSubmit);

    function handleFormSubmit(e) {
        e.preventDefault();
        console.log('Formulario enviado'); // Depuración
        const nameInput = document.getElementById('nombre');
        const emailInput = document.getElementById('correo');
        
        if (!nameInput || !emailInput) {
            console.error('Campos nombre o correo no encontrados');
            return;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        
        // Limpiar estados previos de error
        nameInput.removeAttribute('aria-invalid');
        emailInput.removeAttribute('aria-invalid');
        
        // Validar que ambos campos estén completos
        if (!name || !email) {
            console.log('Validación fallida: campos vacíos'); // Depuración
            alert('Por favor, completa todos los campos');
            if (!name) {
                nameInput.setAttribute('aria-invalid', 'true');
            }
            if (!email) {
                emailInput.setAttribute('aria-invalid', 'true');
            }
            return;
        }
        
        // Almacenar datos en localStorage
        console.log('Guardando datos:', { name, email }); // Depuración
        localStorage.setItem('userData', JSON.stringify({ name, email }));
        showSection('portada');
        document.getElementById('floatingMenu').style.display = 'block';
    }
}

// Borrar datos de localStorage
function clearLocalStorage() {
    console.log('Limpiando localStorage'); // Depuración
    localStorage.clear();
    alert('Datos borrados');
    showSection('formulario');
    window.location.reload(); // Recargar para asegurar estado inicial
}

// Mostrar secciones
function showSection(sectionId) {
    console.log('Mostrando sección:', sectionId); // Depuración
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        updateProgress();
    } else {
        console.error(`Sección con ID ${sectionId} no encontrada`);
    }
}

// Actualizar barra de progreso
function updateProgress() {
    const sections = document.querySelectorAll('.section');
    const currentSection = document.querySelector('.section[style*="block"]');
    if (!currentSection) return;
    const index = Array.from(sections).indexOf(currentSection);
    const progress = ((index + 1) / sections.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
}

// Video Quiz
const quizTimes = [
    { time: 180, type: 'multiple', question: '¿Qué es el modelamiento conceptual?', options: ['Definir tablas', 'Identificar entidades y relaciones', 'Optimizar consultas'], correct: 1 },
    { time: 660, type: 'dragdrop', question: 'Ordena los pasos del diseño lógico', items: ['Normalización', 'Definir claves', 'Crear esquema'], correct: [0, 1, 2] },
    { time: 1140, type: 'match', question: 'Relaciona los conceptos', pairs: [['Entidad', 'Tabla'], ['Atributo', 'Columna']], correct: [[0, 0], [1, 1]] }
];

let currentQuiz = null;

function initializeVideoQuiz() {
    const player = new YT.Player('videoPlayer', {
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        const player = event.target;
        const currentTime = player.getCurrentTime();
        const quiz = quizTimes.find(q => Math.abs(currentTime - q.time) < 2 && !localStorage.getItem(`quiz_${q.time}`));
        if (quiz) {
            player.pauseVideo();
            currentQuiz = quiz;
            showQuizPopup(quiz);
        }
    }
}

function showQuizPopup(quiz) {
    const overlay = document.getElementById('quizOverlay');
    const content = document.getElementById('quizQuestion');
    content.innerHTML = `<p>${quiz.question}</p>`;
    if (quiz.type === 'multiple') {
        quiz.options.forEach((opt, index) => {
            content.innerHTML += `<label><input type="radio" name="quiz" value="${index}">${opt}</label><br>`;
        });
    } else if (quiz.type === 'dragdrop') {
        content.innerHTML += `
            <div class="dragdrop-container" id="quiz-dragdrop">
                <div class="drag-items">
                    ${quiz.items.map(item => `<div class="draggable" draggable="true" data-value="${item}">${item}</div>`).join('')}
                </div>
                <div class="drop-zones">
                    ${quiz.items.map((_, i) => `<div class="droppable" data-index="${i}"></div>`).join('')}
                </div>
            </div>`;
        initializeDragDrop('quiz-dragdrop');
    } else if (quiz.type === 'match') {
        const leftItems = quiz.pairs.map(pair => pair[0]).sort(() => Math.random() - 0.5);
        const rightItems = quiz.pairs.map(pair => pair[1]).sort(() => Math.random() - 0.5);
        content.innerHTML += `
            <div class="match-container" id="quiz-match">
                <div class="match-left">
                    ${leftItems.map(item => `<div class="match-item" data-value="${item}">${item}</div>`).join('')}
                </div>
                <div class="match-right">
                    ${rightItems.map(item => `<div class="match-target" data-value="${item}">${item}</div>`).join('')}
                </div>
            </div>`;
        initializeMatch('quiz-match');
    }
    overlay.style.display = 'flex';
}

function submitQuizAnswer() {
    localStorage.setItem(`quiz_${currentQuiz.time}`, JSON.stringify(currentQuiz));
    document.getElementById('quizOverlay').style.display = 'none';
    document.getElementById('videoPlayer').contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
}

// Evaluación Final
const finalQuestions = [
    { type: 'multiple', question: '¿Qué elimina la normalización?', options: ['Redundancia', 'Consultas', 'Índices'], correct: 0 },
    { type: 'multiple', question: '¿Qué define una clave primaria?', options: ['Relación', 'Índice único', 'Atributo opcional'], correct: 1 },
    { type: 'multiple', question: '¿Qué optimiza el diseño físico?', options: ['Rendimiento', 'Entidades', 'Relaciones'], correct: 0 },
    { type: 'truefalse', question: 'El modelo lógico depende del SGBD.', correct: false },
    { type: 'truefalse', question: 'El modelo conceptual usa diagramas ER.', correct: true },
    { type: 'dragdrop', question: 'Ordena los niveles de diseño', items: ['Conceptual', 'Lógico', 'Físico'], correct: [0, 1, 2], id: 'dragdrop1' },
    { type: 'dragdrop', question: 'Ordena los pasos de normalización', items: ['1NF', '2NF', '3NF'], correct: [0, 1, 2], id: 'dragdrop2' },
    { type: 'match', question: 'Relaciona conceptos', pairs: [['Clave primaria', 'Identificador único'], ['Clave foránea', 'Relación entre tablas']], correct: [[0, 0], [1, 1]], id: 'match1' },
    { type: 'match', question: 'Relaciona términos', pairs: [['Entidad', 'Objeto del mundo real'], ['Atributo', 'Propiedad de entidad']], correct: [[0, 0], [1, 1]], id: 'match2' }
];

let userAnswers = {};

function initializeFinalQuiz() {
    const quizContainer = document.getElementById('finalQuiz');
    if (!quizContainer) return;
    quizContainer.innerHTML = '';
    finalQuestions.forEach((q, index) => {
        quizContainer.innerHTML += `<div class="quiz-item"><h3>Pregunta ${index + 1}</h3><p>${q.question}</p>`;
        
        if (q.type === 'multiple') {
            q.options.forEach((opt, i) => {
                quizContainer.innerHTML += `<label><input type="radio" name="q${index}" value="${i}">${opt}</label><br>`;
            });
        } else if (q.type === 'truefalse') {
            quizContainer.innerHTML += `
                <label><input type="radio" name="q${index}" value="true">Verdadero</label><br>
                <label><input type="radio" name="q${index}" value="false">Falso</label><br>`;
        } else if (q.type === 'dragdrop') {
            quizContainer.innerHTML += `
                <div class="dragdrop-container" id="${q.id}">
                    <div class="drag-items">
                        ${q.items.map(item => `<div class="draggable" draggable="true" data-value="${item}">${item}</div>`).join('')}
                    </div>
                    <div class="drop-zones">
                        ${q.items.map((_, i) => `<div class="droppable" data-index="${i}"></div>`).join('')}
                    </div>
                </div>`;
        } else if (q.type === 'match') {
            const leftItems = q.pairs.map(pair => pair[0]).sort(() => Math.random() - 0.5);
            const rightItems = q.pairs.map(pair => pair[1]).sort(() => Math.random() - 0.5);
            quizContainer.innerHTML += `
                <div class="match-container" id="${q.id}">
                    <div class="match-left">
                        ${leftItems.map(item => `<div class="match-item" data-value="${item}">${item}</div>`).join('')}
                    </div>
                    <div class="match-right">
                        ${rightItems.map(item => `<div class="match-target" data-value="${item}">${item}</div>`).join('')}
                    </div>
                </div>`;
        }
        
        quizContainer.innerHTML += '</div>';
    });

    initializeDragDrop();
    initializeMatch();
}

function initializeDragDrop(containerId = null) {
    const containers = containerId ? [document.getElementById(containerId)] : document.querySelectorAll('.dragdrop-container');
    containers.forEach(container => {
        const draggables = container.querySelectorAll('.draggable');
        const droppables = container.querySelectorAll('.droppable');

        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', e.target.dataset.value);
                e.target.classList.add('dragging');
            });
            draggable.addEventListener('dragend', e => {
                e.target.classList.remove('dragging');
            });
        });

        droppables.forEach(droppable => {
            droppable.addEventListener('dragover', e => {
                e.preventDefault();
            });
            droppable.addEventListener('drop', e => {
                e.preventDefault();
                const value = e.dataTransfer.getData('text/plain');
                const draggable = document.querySelector(`.draggable[data-value="${value}"]`);
                if (e.target.classList.contains('droppable') && !e.target.hasChildNodes()) {
                    e.target.appendChild(draggable);
                    updateDragDropAnswers(container.id);
                }
            });
        });
    });
}

function updateDragDropAnswers(containerId) {
    const container = document.getElementById(containerId);
    const droppables = container.querySelectorAll('.droppable');
    const answers = Array.from(droppables).map(d => d.firstChild ? d.firstChild.dataset.value : null);
    userAnswers[containerId] = answers;
}

function initializeMatch(containerId = null) {
    const containers = containerId ? [document.getElementById(containerId)] : document.querySelectorAll('.match-container');
    containers.forEach(container => {
        const leftItems = container.querySelectorAll('.match-item');
        let selectedItem = null;

        leftItems.forEach(item => {
            item.addEventListener('click', () => {
                if (selectedItem) {
                    selectedItem.classList.remove('selected');
                }
                selectedItem = item;
                selectedItem.classList.add('selected');
            });
        });

        container.querySelectorAll('.match-target').forEach(target => {
            target.addEventListener('click', () => {
                if (selectedItem) {
                    const pair = [selectedItem.dataset.value, target.dataset.value];
                    userAnswers[container.id] = userAnswers[container.id] || [];
                    userAnswers[container.id].push(pair);
                    selectedItem.style.opacity = '0.5';
                    target.style.opacity = '0.5';
                    selectedItem.classList.remove('selected');
                    selectedItem = null;
                    updateMatchAnswers(container.id);
                }
            });
        });
    });
}

function updateMatchAnswers(containerId) {
    // Actualizar respuestas para relacionar columnas
}

function submitFinalQuiz() {
    let score = 0;
    const feedback = document.getElementById('quizFeedback');
    feedback.innerHTML = '';

    finalQuestions.forEach((q, index) => {
        let correct = false;
        if (q.type === 'multiple' || q.type === 'truefalse') {
            const selected = document.querySelector(`input[name="q${index}"]:checked`);
            if (selected) {
                const value = q.type === 'multiple' ? parseInt(selected.value) : selected.value === 'true';
                if (value === q.correct) {
                    score++;
                    correct = true;
                }
            }
        } else if (q.type === 'dragdrop') {
            const answers = userAnswers[q.id] || [];
            if (answers.length === q.items.length && answers.every((ans, i) => ans === q.items[q.correct[i]])) {
                score++;
                correct = true;
            }
        } else if (q.type === 'match') {
            const answers = userAnswers[q.id] || [];
            if (answers.length === q.pairs.length && answers.every(([left, right], i) => {
                const correctPair = q.pairs[q.correct[i][0]];
                return left === correctPair[0] && right === correctPair[1];
            })) {
                score++;
                correct = true;
            }
        }
        feedback.innerHTML += `<p>Pregunta ${index + 1}: ${correct ? 'Correcta' : 'Incorrecta'}</p>`;
    });

    const percentage = (score / finalQuestions.length) * 100;
    feedback.innerHTML += `<p>Tu calificación: ${percentage}%</p>`;
    localStorage.setItem('quizScore', percentage);
    if (percentage < 70) {
        feedback.innerHTML += '<p>No alcanzaste el mínimo. Intenta nuevamente.</p><button onclick="initializeFinalQuiz()">Reintentar</button>';
    }
}

// Generar Certificado
function generateCertificate() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const score = parseFloat(localStorage.getItem('quizScore') || 0);
    const certificateType = document.getElementById('certificateType');
    const certificateName = document.getElementById('certificateName');
    if (certificateName && certificateType) {
        certificateName.textContent = userData.name || 'Participante';
        certificateType.textContent = score >= 70 ? 'Aprobación' : 'Participación';
    }
}

function downloadCertificate() {
    const certificate = document.getElementById('certificate');
    if (certificate) {
        html2pdf(certificate).save('Certificado_Diseño_de_Bases_de_Datos.pdf');
    }
}

// Reporte
function downloadReport() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const quizScore = localStorage.getItem('quizScore') || '0';
    const reflectionAnswers = Array.from(document.querySelectorAll('#reflectionForm textarea')).map(ta => ta.value || 'No respondida');
    
    let quizResponses = '';
    finalQuestions.forEach((q, index) => {
        quizResponses += `<h3>Pregunta ${index + 1}: ${q.question}</h3>`;
        if (q.type === 'multiple') {
            const selected = document.querySelector(`input[name="q${index}"]:checked`);
            quizResponses += `<p>Respuesta: ${selected ? q.options[parseInt(selected.value)] : 'No respondida'}</p>`;
        } else if (q.type === 'truefalse') {
            const selected = document.querySelector(`input[name="q${index}"]:checked`);
            quizResponses += `<p>Respuesta: ${selected ? selected.value : 'No respondida'}</p>`;
        } else if (q.type === 'dragdrop') {
            const answers = userAnswers[q.id] || [];
            quizResponses += `<p>Respuesta: ${answers.length > 0 ? answers.join(', ') : 'No respondida'}</p>`;
        } else if (q.type === 'match') {
            const answers = userAnswers[q.id] || [];
            quizResponses += `<p>Respuesta: ${answers.length > 0 ? answers.map(([left, right]) => `${left} -> ${right}`).join(', ') : 'No respondida'}</p>`;
        }
    });

    const reportContent = `
        <html>
            <head>
                <title>Reporte de Evaluación</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #006657; }
                    h3 { color: #691C32; }
                    p, li { font-size: 16px; line-height: 1.6; }
                    ul { margin-left: 20px; }
                </style>
                <script>
                    let attempts = 3;
                    function checkPassword() {
                        const pass = prompt('Ingrese contraseña:');
                        if (pass === '1234') {
                            document.getElementById('content').style.display = 'block';
                        } else {
                            attempts--;
                            alert('Contraseña incorrecta. Intentos restantes: ' + attempts);
                            if (attempts === 0) window.close();
                        }
                    }
                </script>
            </head>
            <body onload="checkPassword()">
                <div id="content" style="display:none;">
                    <h1>Reporte de Evaluación</h1>
                    <p><strong>Nombre:</strong> ${userData.name || 'No proporcionado'}</p>
                    <p><strong>Email:</strong> ${userData.email || 'No proporcionado'}</p>
                    <p><strong>Calificación:</strong> ${quizScore}%</p>
                    <h2>Respuestas del Cuestionario</h2>
                    ${quizResponses}
                    <h2>Respuestas de Reflexión</h2>
                    <ul>
                        ${reflectionAnswers.map((ans, i) => `<li>Pregunta ${i + 1}: ${ans}</li>`).join('')}
                    </ul>
                </div>
            </body>
        </html>`;
    
    try {
        const blob = new Blob([reportContent], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'reporte_evaluacion.html';
        link.click();
    } catch (error) {
        console.error('Error al generar el reporte:', error);
        alert('Error al generar el reporte. Por favor, intenta nuevamente.');
    }
}

// Chatbot
function openChatbot() {
    window.open('https://chatgpt.com/share/6851af98-8edc-8009-b480-dfbbf507bea7', '_blank', 'width=600,height=400');
}

// Inicialización
function initializePage() {
    console.log('Inicializando página'); // Depuración
    const userDataRaw = localStorage.getItem('userData');
    let userData = null;
    try {
        userData = userDataRaw ? JSON.parse(userDataRaw) : null;
        console.log('userData encontrado:', userData); // Depuración
    } catch (e) {
        console.error('Error al parsear userData:', e);
        localStorage.removeItem('userData'); // Limpiar datos corruptos
    }

    if (userData && userData.name && userData.email) {
        console.log('Datos válidos, mostrando portada'); // Depuración
        showSection('portada');
        document.getElementById('floatingMenu').style.display = 'block';
    } else {
        console.log('Sin datos válidos, mostrando formulario'); // Depuración
        showSection('formulario');
        document.getElementById('floatingMenu').style.display = 'none';
    }
    saveUserData();
    initializeFinalQuiz();
    generateCertificate();
}

document.addEventListener('DOMContentLoaded', initializePage);