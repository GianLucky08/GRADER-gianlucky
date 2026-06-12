// Grader PWA - Main Application Logic

// State Management
const state = {
    gradeScale: {
        min: 1,
        max: 20,
        passing: 10
    },
    subjects: [],
    currentSubjectId: null
};

// DOM Elements
const elements = {
    setupScreen: document.getElementById('setup-screen'),
    dashboard: document.getElementById('dashboard'),
    subjectDetail: document.getElementById('subject-detail'),
    modalOverlay: document.getElementById('modal-overlay'),
    addSubjectModal: document.getElementById('add-subject-modal'),
    addEvaluationModal: document.getElementById('add-evaluation-modal'),
    settingsModal: document.getElementById('settings-modal'),
    subjectsList: document.getElementById('subjects-list'),
    evaluationsList: document.getElementById('evaluations-list'),
    calculationPanel: document.getElementById('calculation-panel'),
    subjectTitle: document.getElementById('subject-title')
};

// Initialize App
function init() {
    loadFromStorage();
    setupEventListeners();
    registerServiceWorker();
    
    if (!state.gradeScale) {
        showSetupScreen();
    } else {
        showDashboard();
    }
}

// Local Storage Functions
function loadFromStorage() {
    const savedGradeScale = localStorage.getItem('grader_gradeScale');
    const savedSubjects = localStorage.getItem('grader_subjects');
    
    if (savedGradeScale) {
        state.gradeScale = JSON.parse(savedGradeScale);
    }
    
    if (savedSubjects) {
        state.subjects = JSON.parse(savedSubjects);
    }
}

function saveToStorage() {
    localStorage.setItem('grader_gradeScale', JSON.stringify(state.gradeScale));
    localStorage.setItem('grader_subjects', JSON.stringify(state.subjects));
}

// Navigation Functions
function showSetupScreen() {
    elements.setupScreen.classList.remove('hidden');
    elements.dashboard.classList.add('hidden');
    elements.subjectDetail.classList.add('hidden');
}

function showDashboard() {
    elements.setupScreen.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');
    elements.subjectDetail.classList.add('hidden');
    renderSubjects();
}

function showSubjectDetail(subjectId) {
    state.currentSubjectId = subjectId;
    const subject = state.subjects.find(s => s.id === subjectId);
    
    if (subject) {
        elements.subjectTitle.textContent = subject.name;
        elements.dashboard.classList.add('hidden');
        elements.subjectDetail.classList.remove('hidden');
        renderEvaluations();
        renderCalculationPanel();
    }
}

function goBack() {
    state.currentSubjectId = null;
    elements.subjectDetail.classList.add('hidden');
    elements.dashboard.classList.remove('hidden');
    renderSubjects();
}

// Modal Functions
function showModal(modal) {
    elements.modalOverlay.classList.remove('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('modal-slide-up');
}

function hideModal() {
    elements.modalOverlay.classList.add('hidden');
    elements.addSubjectModal.classList.add('hidden');
    elements.addEvaluationModal.classList.add('hidden');
    elements.settingsModal.classList.add('hidden');
    
    // Clear inputs
    document.getElementById('subject-name-input').value = '';
    document.getElementById('eval-name-input').value = '';
    document.getElementById('eval-grade-input').value = '';
    document.getElementById('eval-percentage-input').value = '';
}

// Render Functions
function renderSubjects() {
    elements.subjectsList.innerHTML = '';
    
    if (state.subjects.length === 0) {
        elements.subjectsList.innerHTML = `
            <div class="text-center py-12">
                <div class="w-20 h-20 bg-ios-cardLight rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-book text-3xl text-ios-textSecondary"></i>
                </div>
                <p class="text-ios-textSecondary">No tienes materias aún</p>
                <p class="text-ios-textSecondary text-sm mt-1">Toca el botón + para agregar una</p>
            </div>
        `;
        return;
    }
    
    state.subjects.forEach((subject, index) => {
        const stats = calculateSubjectStats(subject);
        const statusColor = getStatusColor(stats.status);
        
        const card = document.createElement('div');
        card.className = `bg-ios-card backdrop-blur-xl rounded-2xl p-4 border border-ios-separator card-hover fade-in stagger-${(index % 5) + 1}`;
        card.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold text-lg flex-1 truncate">${subject.name}</h3>
                <div class="w-3 h-3 rounded-full ${statusColor}"></div>
            </div>
            <div class="flex items-center justify-between mb-2">
                <span class="text-ios-textSecondary text-sm">Puntos</span>
                <span class="font-bold text-xl">${stats.accumulatedPoints.toFixed(1)} / ${state.gradeScale.max}</span>
            </div>
            <div class="w-full bg-ios-cardLight rounded-full h-2 mb-2">
                <div class="bg-ios-accent h-2 rounded-full progress-animated" style="width: ${stats.evaluatedPercentage}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-ios-textSecondary">
                <span>${stats.evaluatedPercentage}% evaluado</span>
                <span>${stats.remainingPercentage}% restante</span>
            </div>
        `;
        
        card.addEventListener('click', () => showSubjectDetail(subject.id));
        elements.subjectsList.appendChild(card);
    });
}

function renderEvaluations() {
    elements.evaluationsList.innerHTML = '';
    
    const subject = state.subjects.find(s => s.id === state.currentSubjectId);
    
    if (!subject || subject.evaluations.length === 0) {
        elements.evaluationsList.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-ios-cardLight rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-clipboard-list text-2xl text-ios-textSecondary"></i>
                </div>
                <p class="text-ios-textSecondary">No hay evaluaciones</p>
                <p class="text-ios-textSecondary text-sm mt-1">Toca el botón + para agregar una</p>
            </div>
        `;
        return;
    }
    
    subject.evaluations.forEach((evaluation, index) => {
        const card = document.createElement('div');
        card.className = `bg-ios-card backdrop-blur-xl rounded-2xl p-4 border border-ios-separator card-hover fade-in stagger-${(index % 5) + 1}`;
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <h4 class="font-semibold">${evaluation.name}</h4>
                    <p class="text-ios-textSecondary text-sm">${evaluation.percentage}% del total</p>
                </div>
                <div class="text-right">
                    <span class="font-bold text-xl">${evaluation.grade}</span>
                    <button class="delete-eval-btn ml-3 text-ios-danger opacity-50 hover:opacity-100 transition-opacity" data-id="${evaluation.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add delete functionality
        const deleteBtn = card.querySelector('.delete-eval-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEvaluation(evaluation.id);
        });
        
        elements.evaluationsList.appendChild(card);
    });
}

function renderCalculationPanel() {
    const subject = state.subjects.find(s => s.id === state.currentSubjectId);
    
    if (!subject) return;
    
    const stats = calculateSubjectStats(subject);
    const statusColor = getStatusColor(stats.status);
    const statusGlow = getStatusGlow(stats.status);
    
    let message = '';
    let detailMessage = '';
    
    switch (stats.status) {
        case 'passed':
            message = '¡Ya aprobaste!';
            detailMessage = 'Tus puntos acumulados ya superan la nota mínima';
            break;
        case 'can-pass':
            message = `Necesitas ${stats.neededGrade.toFixed(1)}`;
            detailMessage = `en el ${stats.remainingPercentage}% restante para aprobar`;
            break;
        case 'impossible':
            message = 'Imposible aprobar';
            detailMessage = `Necesitarías ${stats.neededGrade.toFixed(1)} pero el máximo es ${state.gradeScale.max}`;
            break;
    }
    
    elements.calculationPanel.innerHTML = `
        <div class="bg-ios-card backdrop-blur-xl rounded-3xl p-6 border border-ios-separator ${statusGlow}">
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-ios-cardLight rounded-2xl p-4 text-center">
                    <p class="text-ios-textSecondary text-xs mb-1">Evaluado</p>
                    <p class="font-bold text-2xl">${stats.evaluatedPercentage}%</p>
                </div>
                <div class="bg-ios-cardLight rounded-2xl p-4 text-center">
                    <p class="text-ios-textSecondary text-xs mb-1">Restante</p>
                    <p class="font-bold text-2xl">${stats.remainingPercentage}%</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="bg-ios-cardLight rounded-2xl p-4 text-center">
                    <p class="text-ios-textSecondary text-xs mb-1">Puntos Acumulados</p>
                    <p class="font-bold text-2xl">${stats.accumulatedPoints.toFixed(1)} / ${state.gradeScale.max}</p>
                </div>
                <div class="bg-ios-cardLight rounded-2xl p-4 text-center">
                    <p class="text-ios-textSecondary text-xs mb-1">Promedio Actual</p>
                    <p class="font-bold text-2xl">${stats.currentAverage.toFixed(1)} / ${state.gradeScale.max}</p>
                </div>
            </div>
            
            <div class="bg-ios-cardLight rounded-2xl p-4 text-center border-2 ${statusColor.replace('bg-', 'border-')}">
                <p class="text-ios-textSecondary text-xs mb-1">Estado</p>
                <p class="font-bold text-xl ${statusColor.replace('bg-', 'text-')}">${message}</p>
                <p class="text-ios-textSecondary text-sm mt-1">${detailMessage}</p>
            </div>
        </div>
    `;
}

// Calculation Functions
function calculateSubjectStats(subject) {
    const totalPercentage = subject.evaluations.reduce((sum, evaluation) => sum + evaluation.percentage, 0);
    const evaluatedPercentage = Math.min(totalPercentage, 100);
    const remainingPercentage = Math.max(100 - totalPercentage, 0);
    
    // Puntos Acumulados: ∑(nota × peso/100)
    let accumulatedPoints = 0;
    subject.evaluations.forEach(evaluation => {
        accumulatedPoints += (evaluation.grade * evaluation.percentage) / 100;
    });
    
    // Promedio Actual
    let currentAverage = 0;
    if (evaluatedPercentage > 0) {
        currentAverage = (accumulatedPoints * 100) / evaluatedPercentage;
    }
    
    // Calculate needed grade to pass
    let neededGrade = 0;
    let status = 'can-pass';
    
    if (remainingPercentage === 0) {
        // All evaluated
        if (accumulatedPoints >= state.gradeScale.passing) {
            status = 'passed';
        } else {
            status = 'impossible';
        }
    } else {
        // Calculate what grade is needed in remaining percentage
        // (Nota Mínima para Aprobar - Puntos Acumulados) / (Porcentaje Restante / 100)
        const pointsNeeded = state.gradeScale.passing - accumulatedPoints;
        neededGrade = pointsNeeded / (remainingPercentage / 100);
        
        // Check if it's possible
        if (neededGrade > state.gradeScale.max) {
            status = 'impossible';
            neededGrade = state.gradeScale.max;
        } else if (neededGrade <= state.gradeScale.min) {
            status = 'passed';
            neededGrade = state.gradeScale.min;
        } else {
            status = 'can-pass';
        }
    }
    
    return {
        evaluatedPercentage,
        remainingPercentage,
        accumulatedPoints,
        currentAverage,
        neededGrade,
        status
    };
}

function getStatusColor(status) {
    switch (status) {
        case 'passed':
            return 'bg-ios-success';
        case 'can-pass':
            return 'bg-ios-warning';
        case 'impossible':
            return 'bg-ios-danger';
        default:
            return 'bg-ios-textSecondary';
    }
}

function getStatusGlow(status) {
    switch (status) {
        case 'passed':
            return 'glow-green';
        case 'can-pass':
            return 'glow-yellow';
        case 'impossible':
            return 'glow-red';
        default:
            return '';
    }
}

// CRUD Functions
function addSubject(name) {
    const subject = {
        id: Date.now().toString(),
        name: name,
        evaluations: []
    };
    
    state.subjects.push(subject);
    saveToStorage();
    renderSubjects();
}

function deleteSubject(subjectId) {
    state.subjects = state.subjects.filter(s => s.id !== subjectId);
    saveToStorage();
    renderSubjects();
}

function addEvaluation(name, grade, percentage) {
    const subject = state.subjects.find(s => s.id === state.currentSubjectId);
    
    if (!subject) return;
    
    // Check if total percentage would exceed 100
    const currentTotal = subject.evaluations.reduce((sum, evaluation) => sum + evaluation.percentage, 0);
    if (currentTotal + percentage > 100) {
        alert('El porcentaje total no puede exceder el 100%');
        return;
    }
    
    // Validate grade is within scale
    if (grade < state.gradeScale.min || grade > state.gradeScale.max) {
        alert(`La nota debe estar entre ${state.gradeScale.min} y ${state.gradeScale.max}`);
        return;
    }
    
    const evaluation = {
        id: Date.now().toString(),
        name: name,
        grade: parseFloat(grade),
        percentage: parseFloat(percentage)
    };
    
    subject.evaluations.push(evaluation);
    saveToStorage();
    renderEvaluations();
    renderCalculationPanel();
}

function deleteEvaluation(evaluationId) {
    const subject = state.subjects.find(s => s.id === state.currentSubjectId);
    
    if (!subject) return;
    
    subject.evaluations = subject.evaluations.filter(item => item.id !== evaluationId);
    saveToStorage();
    renderEvaluations();
    renderCalculationPanel();
}

function updateGradeScale(min, max, passing) {
    state.gradeScale = {
        min: parseFloat(min),
        max: parseFloat(max),
        passing: parseFloat(passing)
    };
    saveToStorage();
}

// Event Listeners
function setupEventListeners() {
    // Setup screen
    document.getElementById('save-setup').addEventListener('click', () => {
        const min = document.getElementById('min-grade').value;
        const max = document.getElementById('max-grade').value;
        const passing = document.getElementById('passing-grade').value;
        
        if (min && max && passing) {
            updateGradeScale(min, max, passing);
            showDashboard();
        }
    });
    
    // Navigation
    document.getElementById('back-btn').addEventListener('click', goBack);
    
    // Add subject
    document.getElementById('add-subject-btn').addEventListener('click', () => {
        showModal(elements.addSubjectModal);
    });
    
    document.getElementById('cancel-subject-btn').addEventListener('click', hideModal);
    
    document.getElementById('confirm-subject-btn').addEventListener('click', () => {
        const name = document.getElementById('subject-name-input').value.trim();
        if (name) {
            addSubject(name);
            hideModal();
        }
    });
    
    // Add evaluation
    document.getElementById('add-evaluation-btn').addEventListener('click', () => {
        showModal(elements.addEvaluationModal);
    });
    
    document.getElementById('cancel-eval-btn').addEventListener('click', hideModal);
    
    document.getElementById('confirm-eval-btn').addEventListener('click', () => {
        const name = document.getElementById('eval-name-input').value.trim();
        const grade = parseFloat(document.getElementById('eval-grade-input').value);
        const percentage = parseFloat(document.getElementById('eval-percentage-input').value);
        
        if (name && grade && percentage) {
            addEvaluation(name, grade, percentage);
            hideModal();
        }
    });
    
    // Settings
    document.getElementById('settings-btn').addEventListener('click', () => {
        document.getElementById('settings-min-grade').value = state.gradeScale.min;
        document.getElementById('settings-max-grade').value = state.gradeScale.max;
        document.getElementById('settings-passing-grade').value = state.gradeScale.passing;
        showModal(elements.settingsModal);
    });
    
    document.getElementById('cancel-settings-btn').addEventListener('click', hideModal);
    
    document.getElementById('confirm-settings-btn').addEventListener('click', () => {
        const min = document.getElementById('settings-min-grade').value;
        const max = document.getElementById('settings-max-grade').value;
        const passing = document.getElementById('settings-passing-grade').value;
        
        if (min && max && passing) {
            updateGradeScale(min, max, passing);
            hideModal();
            renderSubjects();
            if (state.currentSubjectId) {
                renderCalculationPanel();
            }
        }
    });
    
    // Edit subject (delete for now)
    document.getElementById('edit-subject-btn').addEventListener('click', () => {
        if (confirm('¿Eliminar esta materia?')) {
            deleteSubject(state.currentSubjectId);
            goBack();
        }
    });
    
    // Close modal on overlay click
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            hideModal();
        }
    });
}

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/GRADER-gianlucky/sw.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
