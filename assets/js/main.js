// Main application entry point
import { QuizApp } from './quiz-app.js';
import { QuizzesApp } from './quizzes-app.js';
import { FilterManager } from './filter-manager.js';
import { HomeStats } from './home-stats.js';
import { Utils } from './utils.js';

// Initialize applications based on current page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize home stats on main page
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        // Инициализируем статистику после загрузки данных вопросов
        if (window.quizData && Array.isArray(window.quizData.questions)) {
            window.homeStats = new HomeStats();
        }
    }
    
    // Initialize filter manager only on pages that need it
    if (!window.location.pathname.includes('/quiz-single')) {
        window.filterManager = new FilterManager();
        
        // Load questions data for counts and update counters
        if (window.quizData && Array.isArray(window.quizData.questions)) {
            window.filterManager.allQuestionsForCounts = window.quizData.questions;
            // Обновляем счетчики тегов после загрузки данных
            window.filterManager.refreshCounts();
        }
        
        // Load filters from URL if present
        if (window.location.search) {
            window.filterManager.loadFromUrl();
        }
    }
    
    // Initialize specific app based on page
    if (window.location.pathname.includes('/quizzes')) {
        window.quizzesApp = new QuizzesApp();
        
        // Initialize quiz modal
        import('./quiz-modal.js').then(module => {
            // Modal will auto-initialize
        });
    } else if (window.location.pathname.includes('/quiz') || window.location.pathname.includes('/quiz-single')) {
        // На странице конкретной викторины тоже нужны данные для статистики
        if (window.quizData && Array.isArray(window.quizData.questions)) {
            // Сохраняем данные для статистики
            window.quizDataForStats = window.quizData.questions;
        }
        window.quizApp = new QuizApp();
    }
});

// Backward compatibility - expose Utils globally
window.debounce = Utils.debounce;

