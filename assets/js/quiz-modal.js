// Quiz Modal Manager
import { Utils } from './utils.js';
import { StatsManager } from './stats-manager.js';
import { TagsManager } from './tags-manager.js';

export class QuizModal {
    constructor() {
        this.modal = document.getElementById('quizModal');
        this.modalTitle = document.getElementById('quizModalTitle');
        this.closeBtn = document.getElementById('quizModalClose');
        this.currentQuestion = null;
        this.answered = false;
        this.statsManager = new StatsManager();
        this.tagsManager = new TagsManager();
        
        this.init();
    }
    
    init() {
        if (!this.modal) return;
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
        
        // Answer options (event delegation)
        this.modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('option')) {
                this.selectOption(parseInt(e.target.dataset.index));
            }
        });
        
        
        // Reset stats button
        this.modal.addEventListener('click', (e) => {
            if (e.target.id === 'reset-stats') {
                this.resetStats();
            }
        });
        
        // Show explanation button
        this.modal.addEventListener('click', (e) => {
            if (e.target.id === 'show-explanation') {
                this.showExplanation();
            }
        });
    }
    
    open(questionGuid) {
        const question = this.findQuestion(questionGuid);
        if (!question) {
            console.error('Question not found:', questionGuid);
            return;
        }
        
        this.currentQuestion = question;
        this.answered = false;
        
        // Update modal title
        if (this.modalTitle) {
            this.modalTitle.textContent = question.title.length > 60 
                ? question.title.substring(0, 60) + '...' 
                : question.title;
        }
        
        // Set up link to open in new tab
        this.setupNewTabLink(questionGuid);
        
        // Show modal
        this.modal.classList.add('active');
        document.body.classList.add('modal-open');
        
        // Load question content
        this.displayQuestion();
        
        // Update stats
        this.statsManager.updateStatsDisplay();
    }
    
    close() {
        this.modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        this.currentQuestion = null;
        this.answered = false;
        
        // Clear question content
        const container = this.modal.querySelector('#question-container');
        if (container) {
            container.innerHTML = '';
        }
        
        // Hide new tab link
        const newTabLink = this.modal.querySelector('#open-in-new-tab');
        if (newTabLink) {
            newTabLink.style.display = 'none';
            newTabLink.href = '#';
        }
    }
    
    isOpen() {
        return this.modal.classList.contains('active');
    }
    
    findQuestion(questionGuid) {
        if (window.quizData && window.quizData.questions) {
            return window.quizData.questions.find(q => q.guid === questionGuid);
        }
        return null;
    }
    
    displayQuestion() {
        if (!this.currentQuestion) return;
        
        const container = this.modal.querySelector('#question-container');
        if (!container) return;
        
        const question = this.currentQuestion;
        
        // Update current filters display
        this.updateCurrentFilters();
        
        // Use the same structure as the original quiz-app.js
        let html = `
            <div class="question">
                <div class="question-text">${Utils.markdownToHtml(question.question || question.title)}</div>
        `;
        
        if (question.tags && Array.isArray(question.tags) && question.tags.length > 0) {
            html += '<div class="question-tags">';
            question.tags.forEach(tag => {
                html += `<span class="question-tag ${tag}">${this.tagsManager.getTagName(tag)}</span>`;
            });
            html += '</div>';
        }
        
        if (question.images && Array.isArray(question.images) && question.images.length > 0) {
            html += '<div class="question-images">';
            question.images.forEach((image, index) => {
                html += `<img src="${image}" alt="Question image ${index + 1}" class="question-image" loading="lazy">`;
            });
            html += '</div>';
        }
        
        html += '<div class="options">';
        if (question.options && Array.isArray(question.options)) {
            question.options.forEach((option, index) => {
                html += `
                    <div class="option" data-index="${index}">
                        ${option}
                    </div>
                `;
            });
        }
        html += '</div></div>';
        
        container.innerHTML = html;
        
        // Bind events for the new question
        this.bindQuestionEvents(container);
        
        // Hide explanation and source buttons initially
        this.hideExplanation();
    }
    
    bindQuestionEvents(container) {
        const options = container.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                if (!this.answered) {
                    this.selectOption(parseInt(e.currentTarget.dataset.index));
                }
            });
        });
    }
    
    updateCurrentFilters() {
        const currentFiltersElement = this.modal.querySelector('.current-filters-content');
        if (currentFiltersElement && this.currentQuestion) {
            const question = this.currentQuestion;
            currentFiltersElement.innerHTML = `
                <div class="filter-item">
                    <span class="filter-label">Текущий вопрос:</span>
                    <span class="filter-value">${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}</span>
                </div>
            `;
        }
    }
    
    selectOption(selectedIndex) {
        if (this.answered) return;
        
        this.answered = true;
        const options = this.modal.querySelectorAll('.option');
        const correctIndex = this.currentQuestion.correct;
        
        // Disable all options
        options.forEach(option => { 
            option.classList.add('disabled'); 
        });
        
        // Mark selected option
        options[selectedIndex].classList.add('selected');
        
        // Show correct answer
        if (selectedIndex !== correctIndex) {
            options[correctIndex].classList.add('correct');
        } else {
            options[selectedIndex].classList.add('correct');
        }
        
        // Update stats
        const isCorrect = selectedIndex === correctIndex;
        this.statsManager.updateStats(isCorrect, this.currentQuestion);
        this.statsManager.updateStatsDisplay();
        
        // Show explanation and source buttons if available
        this.showExplanationButtonIfContent();
    }
    
    showExplanationButtonIfContent() {
        const explanationBtn = this.modal.querySelector('#show-explanation');
        const sourceLink = this.modal.querySelector('#source-link');
        
        const hasContent = this.hasExplanationContent();
        const hasSource = this.currentQuestion && this.currentQuestion.source;
        
        if (explanationBtn) {
            explanationBtn.style.display = hasContent ? 'inline-flex' : 'none';
        }
        
        if (sourceLink) {
            if (hasSource) {
                sourceLink.href = this.currentQuestion.source;
                sourceLink.style.display = 'inline-flex';
            } else {
                sourceLink.style.display = 'none';
            }
        }
    }
    
    hasExplanationContent() {
        if (!this.currentQuestion) return false;
        
        const explanation = this.currentQuestion.explanation || '';
        
        if (!explanation || explanation.length < 0) {
            return false;
        }
        
        return true;
    }
    
    setupNewTabLink(questionGuid) {
        const newTabLink = this.modal.querySelector('#open-in-new-tab');
        if (newTabLink && questionGuid) {
            newTabLink.href = `/quiz-single/?question=${questionGuid}`;
            newTabLink.style.display = 'flex';
        }
    }
    
    showExplanation() {
        if (!this.currentQuestion) return;
        
        const explanationContainer = this.modal.querySelector('#explanation-container');
        const explanationContent = this.modal.querySelector('#explanation-content');
        
        if (explanationContainer && explanationContent) {
            const explanation = Utils.markdownToHtml(this.currentQuestion.explanation || '');
            explanationContent.innerHTML = explanation;
            
            explanationContainer.style.display = 'block';
            explanationContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    hideExplanation() {
        const explanationContainer = this.modal.querySelector('#explanation-container');
        const explanationBtn = this.modal.querySelector('#show-explanation');
        const sourceLink = this.modal.querySelector('#source-link');
        
        if (explanationContainer) explanationContainer.style.display = 'none';
        if (explanationBtn) explanationBtn.style.display = 'none';
        if (sourceLink) sourceLink.style.display = 'none';
    }

    resetStats() {
        if (confirm('Вы уверены, что хотите сбросить всю статистику?')) {
            this.statsManager.resetStats();
            this.statsManager.updateStatsDisplay();
        }
    }
}

// Initialize modal immediately when module is loaded
if (document.getElementById('quizModal')) {
    window.quizModal = new QuizModal();
}
