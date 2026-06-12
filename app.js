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
    subjectTitle: document.getElementById('subject-title'),
    globalStats: document.getElementById('global-stats')
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
    renderGlobalStats();
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
        const avgTextColor = getAverageColorClass(stats.currentAverage, state.gradeScale.passing);
        const radius = 24;
        const circumference = 2 * Math.PI * radius;
        const percentage = (stats.currentAverage / state.gradeScale.max) * 100;
        const offset = circumference - (percentage / 100) * circumference;
        
        const card = document.createElement('div');
        card.className = `bg-ios-card backdrop-blur-xl rounded-2xl p-4 border border-ios-separator card-hover fade-in stagger-${(index % 5) + 1}`;
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <h3 class="font-semibold text-lg truncate">${subject.name}</h3>
                    </div>
                    <div class="flex items-center text-xs text-ios-textSecondary">
                        <span>${stats.evaluatedPercentage}% evaluado</span>
                        <span class="mx-2">•</span>
                        <span>${stats.remainingPercentage}% restante</span>
                    </div>
                </div>
                <div class="relative w-14 h-14 -rotate-90">
                    <svg class="w-14 h-14" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="${radius}" fill="none" stroke="rgba(44, 44, 46, 0.8)" stroke-width="4"/>
                        <circle cx="28" cy="28" r="${radius}" fill="transparent" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" class="${avgTextColor} transition-all duration-500"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center rotate-90">
                        <span class="font-bold text-sm">${stats.currentAverage.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => showSubjectDetail(subject.id));
        elements.subjectsList.appendChild(card);
    });
    renderGlobalStats();
}

function renderGlobalStats() {
    const evaluatedSubjects = state.subjects.filter(subject => {
        const stats = calculateSubjectStats(subject);
        return stats.evaluatedPercentage > 0;
    });

    if (evaluatedSubjects.length === 0) {
        elements.globalStats.innerHTML = '';
        return;
    }

    const averages = evaluatedSubjects.map(subject => {
        const stats = calculateSubjectStats(subject);
        return stats.currentAverage;
    });

    const generalAverage = averages.reduce((sum, avg) => sum + avg, 0) / averages.length;

    const chartWidth = 200;
    const chartHeight = 80;
    const padding = 10;
    const maxGrade = state.gradeScale.max;
    const minGrade = state.gradeScale.min;

    const points = averages.map((avg, index) => {
        const x = padding + (index / (averages.length - 1 || 1)) * (chartWidth - 2 * padding);
        const normalizedY = (avg - minGrade) / (maxGrade - minGrade);
        const y = chartHeight - padding - normalizedY * (chartHeight - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    const gradientPoints = averages.map((avg, index) => {
        const x = padding + (index / (averages.length - 1 || 1)) * (chartWidth - 2 * padding);
        const normalizedY = (avg - minGrade) / (maxGrade - minGrade);
        const y = chartHeight - padding - normalizedY * (chartHeight - 2 * padding);
        return `${x},${y}`;
    });

    const areaPath = `${gradientPoints.join(' ')} ${chartWidth - padding},${chartHeight} ${padding},${chartHeight}`;

    elements.globalStats.innerHTML = `
        <div class="bg-ios-card backdrop-blur-xl rounded-3xl p-6 border border-ios-separator relative overflow-hidden">
            <div class="relative z-10 flex items-center justify-between">
                <div class="flex-1">
                    <p class="text-ios-textSecondary text-sm mb-1">Promedio General</p>
                    <p class="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">${generalAverage.toFixed(1)}</p>
                    <p class="text-ios-textSecondary text-xs mt-1">${evaluatedSubjects.length} materia${evaluatedSubjects.length > 1 ? 's' : ''} evaluada${evaluatedSubjects.length > 1 ? 's' : ''}</p>
                </div>
                <div class="w-48 h-20">
                    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-full h-full">
                        <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#0A84FF;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#30D158;stop-opacity:1" />
                            </linearGradient>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:#0A84FF;stop-opacity:0.3" />
                                <stop offset="100%" style="stop-color:#30D158;stop-opacity:0.05" />
                            </linearGradient>
                        </defs>
                        <polygon points="${areaPath}" fill="url(#areaGradient)" />
                        <polyline points="${points}" fill="none" stroke="url(#lineGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        ${averages.map((avg, index) => {
                            const x = padding + (index / (averages.length - 1 || 1)) * (chartWidth - 2 * padding);
                            const normalizedY = (avg - minGrade) / (maxGrade - minGrade);
                            const y = chartHeight - padding - normalizedY * (chartHeight - 2 * padding);
                            return `<circle cx="${x}" cy="${y}" r="3" fill="#0A84FF" />`;
                        }).join('')}
                    </svg>
                </div>
            </div>
        </div>
    `;
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

function getStatusTextColor(status) {
    switch (status) {
        case 'passed':
            return 'text-ios-success';
        case 'can-pass':
            return 'text-ios-warning';
        case 'impossible':
            return 'text-ios-danger';
        default:
            return 'text-ios-textSecondary';
    }
}

function getAverageColorClass(average, passingGrade) {
    if (average >= 15) return 'text-ios-success';
    if (average >= passingGrade) return 'text-ios-accent';
    return 'text-ios-danger';
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
                console.log('SW registered');
                console.log('New service worker file downloaded and ready');
            })
            .catch(error => {
                console.log('SW failed', error);
            });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                window.location.reload();
                refreshing = true;
            }
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
