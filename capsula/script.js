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

    videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.addEventListener('timeupdate', checkVideoTime);

    quizResponses = JSON.parse(localStorage.getItem('quizResponses')) || {};
    updateSavedResponses();

    document.getElementById('reflectionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const reflections = {};
        let isValid = true;
        ['r1', 'r2', 'r3'].forEach(id => {
            const value = document.getElementById(id).value.trim();
            if (!value) {
                document.getElementById(`${id}-error`).textContent = 'Este campo es obligatorio.';
                document.getElementById(`${id}-error`).style.display = 'block';
                isValid = false;
            } else {
                document.getElementById(`${id}-error`).style.display = 'none';
                reflections[id] = value;
            }
        });
        if (isValid) {
            localStorage.setItem('reflections', JSON.stringify(reflections));
            const messageDiv = document.getElementById('saveMessage');
            messageDiv.textContent = 'Respuestas guardadas con éxito.';
            messageDiv.style.display = 'block';
            setTimeout(() => messageDiv.style.display = 'none', 3000);
            updateSavedResponses();
        }
    });
});

function checkVideoTime() {
    const time = Math.floor(videoPlayer.currentTime);
    if (time === 180 && !quizResponses['q1']) {
        videoPlayer.pause();
        showQuizOverlay('¿Qué es el diseño conceptual según el video?', [
            { value: 'a', text: 'Un esquema físico' },
            { value: 'b', text: 'Un modelo de entidades', correct: true },
            { value: 'c', text: 'Un lenguaje SQL' },
            { value: 'd', text: 'Un índice' }
        ], 'q1');
    } else if (time === 660 && !quizResponses['q2']) {
        videoPlayer.pause();
        showQuizOverlay('Arrastra el término correcto al diseño lógico:', [
            { value: 'a', text: 'Normalización', correct: true },
            { value: 'b', text: 'Índices' }
        ], 'q2', 'drag');
    } else if (time === 1140 && !quizResponses['q3']) {
        videoPlayer.pause();
        showQuizOverlay('Relaciona los términos:', [
            { value: 'a', text: 'Diseño Físico', correct: 'A' },
            { value: 'b', text: 'Diseño Lógico', correct: 'B' }
        ], 'q3', 'match', [
            { value: 'A', text: 'Optimización SQL' },
            { value: 'B', text: 'Normalización' }
        ]);
    }
}

function showQuizOverlay(question, options, qId, type = 'mcq', targets = []) {
    const overlay = document.getElementById('quizOverlay');
    const questionDiv = document.getElementById('quizQuestion');
    let content = `<p>${question}</p>`;

    if (type === 'mcq') {
        content += options.map(opt => `<label><input type="radio" name="${qId}" value="${opt.value}"> ${opt.text}</label>`).join('<br>');
    } else if (type === 'drag') {
        content += '<div class="drag-drop"><div class="draggable" draggable="true">' + options.map(opt => opt.text).join('</div><div class="draggable" draggable="true">') + '</div><div class="dropzone"></div></div>';
    } else if (type === 'match') {
        content += '<div class="match-columns"><div class="column left">' + options.map(opt => `<div class="match-item" data-match="${opt.value}">${opt.text}</div>`).join('') + '</div><div class="column right">' + targets.map(t => `<div class="match-target" data-match="${t.value}">${t.text}</div>`).join('') + '</div></div>';
    }

    questionDiv.innerHTML = content;
    overlay.style.display = 'block';

    if (type === 'mcq') {
        $('input[name="' + qId + '"]').on('change', function() {
            const selected = $(this).val();
            const correct = options.find(opt => opt.correct)?.value;
            quizResponses[qId] = { answer: selected, correct: selected === correct };
            localStorage.setItem('quizResponses', JSON.stringify(quizResponses));
            submitQuizAnswer();
        });
    } else if (type === 'drag') {
        $('.draggable').draggable({ revert: 'invalid', containment: 'document' });
        $('.dropzone').droppable({
            accept: '.draggable',
            drop: function(event, ui) {
                const dropped = ui.draggable.text();
                const correct = options.find(opt => opt.correct)?.text;
                quizResponses[qId] = { answer: dropped, correct: dropped === correct };
                localStorage.setItem('quizResponses', JSON.stringify(quizResponses));
                submitQuizAnswer();
            }
        });
    } else if (type === 'match') {
        $('.match-item').draggable({ revert: 'invalid', containment: 'document' });
        $('.match-target').droppable({
            accept: '.match-item',
            drop: function(event, ui) {
                const dropped = ui.draggable.data('match');
                const target = $(this).data('match');
                const correct = options.find(opt => opt.correct === target)?.value;
                quizResponses[qId] = { answer: dropped, correct: dropped === correct };
                localStorage.setItem('quizResponses', JSON.stringify(quizResponses));
                submitQuizAnswer();
            }
        });
    }
}

function submitQuizAnswer() {
    const qId = Object.keys(quizResponses).pop();
    if (!qId) return;

    const response = quizResponses[qId];
    document.getElementById('quizQuestion').innerHTML += `<p>${response.correct ? '¡Correcto!' : 'Incorrecto, intenta de nuevo.'}</p>`;
    videoPlayer.play();
    document.getElementById('quizOverlay').style.display = 'none';
}

function updateSavedResponses() {
    const reflections = JSON.parse(localStorage.getItem('reflections')) || {};
    const savedDiv = document.getElementById('savedResponses');
    if (Object.keys(reflections).length > 0) {
        savedDiv.innerHTML = '<h4>Respuestas Guardadas:</h4>' +
            '<p>1. ¿Qué aprendiste? ' + (reflections.r1 || '') + '</p>' +
            '<p>2. ¿Cómo lo aplicarías? ' + (reflections.r2 || '') + '</p>' +
            '<p>3. ¿Qué desafíos tuviste? ' + (reflections.r3 || '') + '</p>';
        savedDiv.style.display = 'block';
    } else {
        savedDiv.style.display = 'none';
    }
}

// Evaluación Final
function submitFinalQuiz() {
    const mcqCorrect = checkMCQ();
    const trueFalseCorrect = checkTrueFalse();
    const score = ((mcqCorrect + trueFalseCorrect) / 10) * 100;
    let feedback = `<p>Tu calificación: ${score}%</p>`;

    if (score >= 70) {
        feedback += '<p>¡Felicidades! Has aprobado.</p>';
    } else {
        feedback += '<p>No alcanzaste la calificación mínima (70%). Puedes intentarlo de nuevo.</p>';
    }
    document.getElementById('quizFeedback').innerHTML = feedback;
    localStorage.setItem('finalScore', score);
}

function checkMCQ() {
    const answers = { q1: 'b', q2: 'b', q3: 'b', q4: 'b', q5: 'b' };
    return ['q1', 'q2', 'q3', 'q4', 'q5'].reduce((acc, q) => acc + (document.querySelector(`input[name="${q}"][value="${answers[q]}"]`)?.checked ? 1 : 0), 0);
}

function checkTrueFalse() {
    const answers = { q6: 'false', q7: 'false', q8: 'false', q9: 'true', q10: 'false' };
    return ['q6', 'q7', 'q8', 'q9', 'q10'].reduce((acc, q) => acc + (document.querySelector(`input[name="${q}"][value="${answers[q]}"]`)?.checked ? 1 : 0), 0);
}

// Reportes
function downloadQuizReport() {
    const nombre = localStorage.getItem('userName') || 'Participante';
    const responses = JSON.parse(localStorage.getItem('quizResponses')) || {};
    const content = `
        <!DOCTYPE html>
        <html>
        <head><title>Reporte Video-Quiz</title><style>body {font-family: Arial;}</style></head>
        <body>
            <h1>Reporte Video-Quiz - ${nombre}</h1>
            <h2>Respuestas:</h2>
            <p>Q1: ${responses.q1?.answer || 'No respondida'} - ${responses.q1?.correct ? 'Correcta' : 'Incorrecta'}</p>
            <p>Q2: ${responses.q2?.answer || 'No respondida'} - ${responses.q2?.correct ? 'Correcta' : 'Incorrecta'}</p>
            <p>Q3: ${responses.q3?.answer || 'No respondida'} - ${responses.q3?.correct ? 'Correcta' : 'Incorrecta'}</p>
            <p>Contraseña para el profesor: 1234</p>
        </body>
        </html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_videoquiz_' + nombre + '.html';
    a.click();
}

function downloadFinalReport() {
    const nombre = localStorage.getItem('userName');
    const correo = localStorage.getItem('userEmail');
    const reflections = JSON.parse(localStorage.getItem('reflections')) || {};
    const score = localStorage.getItem('finalScore') || 0;
    const content = `
        <!DOCTYPE html>
        <html>
        <head><title>Reporte Final</title><style>body {font-family: Arial;}</style></head>
        <body>
            <h1>Reporte Final - Diseño de Bases de Datos</h1>
            <p>Nombre: ${nombre}</p>
            <p>Correo: ${correo}</p>
            <p>Calificación: ${score}%</p>
            <h2>Reflexiones</h2>
            <p>1. ¿Qué aprendiste? ${reflections.r1 || ''}</p>
            <p>2. ¿Cómo lo aplicarías? ${reflections.r2 || ''}</p>
            <p>3. ¿Qué desafíos tuviste? ${reflections.r3 || ''}</p>
            <p>Contraseña para el profesor: 1234</p>
        </body>
        </html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_final_' + nombre + '.html';
    a.click();
}

// Certificado
function downloadCertificate() {
    const nombre = localStorage.getItem('userName') || 'Participante';
    const correo = localStorage.getItem('userEmail') || 'No proporcionado';
    const score = localStorage.getItem('finalScore') || 0;
    const certText = document.getElementById('cert-text');
    const qrCode = document.getElementById('qr-code');

    if (score >= 70) {
        certText.innerHTML = `Certificado de Aprobación<br>Se otorga a ${nombre} (Correo: ${correo}) por completar con éxito la Cápsula Educativa de Diseño de Bases de Datos.<br>Fecha: 18 de junio de 2025`;
    } else {
        certText.innerHTML = `Certificado de Participación<br>Se otorga a ${nombre} (Correo: ${correo}) por participar en la Cápsula Educativa de Diseño de Bases de Datos.<br>Fecha: 18 de junio de 2025`;
    }

    new QRCode(qrCode, {
        text: 'https://github.com/VMDiazL',
        width: 100,
        height: 100,
        colorDark: '#BC955C',
        colorLight: 'rgba(0, 102, 87, 0.5)'
    });

    html2pdf().from(document.getElementById('certificate')).save(`certificado_${nombre}.pdf`);
}