// Main Quiz Application
import { Utils } from './utils.js';
import { StatsManager } from './stats-manager.js';
import { TagsManager } from './tags-manager.js';

export class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestion = null;
        this.answered = false;
        this.statsManager = new StatsManager();
        this.tagsManager = new TagsManager();
        this.isSingleQuestionMode = window.location.pathname.includes('/quiz-single');
        this.isQuizPage = window.location.pathname.includes('/quiz');
        
        this.init();
    }
    
    init() {
        this.loadQuestions();
        this.bindEvents();
        this.statsManager.updateStatsDisplay();
        
        if (this.isSingleQuestionMode) {
            this.loadSingleQuestion();
        } else if (this.isQuizPage) {
            this.loadRandomQuestion();
            if (window.filterManager) {
                window.filterManager.updateCurrentFiltersDisplay();
                this.setupFilterChangeButton();
            }
        }
    }
    
    loadQuestions() {
        if (window.quizData && window.quizData.questions) {
            this.questions = window.quizData.questions;
        } else if (window.quizDataForStats && window.quizDataForStats.length > 0) {
            // На странице конкретной викторины используем данные для статистики
            this.questions = window.quizDataForStats;
        } else {
            console.error('Quiz data not found. Make sure the page includes quiz data from Jekyll collection.');
            Utils.showError('Данные викторины не найдены. Убедитесь, что страница загружает данные из коллекции Jekyll.');
        }
    }
    
    loadRandomQuestion() {
        let availableQuestions = [...this.questions];
        if (window.filterManager) {
            availableQuestions = window.filterManager.filterQuestions(availableQuestions);
        }
        
        if (availableQuestions.length === 0) {
            Utils.showError('Нет вопросов, соответствующих текущим фильтрам. Попробуйте изменить фильтры.');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        this.currentQuestion = availableQuestions[randomIndex];
        this.answered = false;
        this.displayQuestion();
    }
    
    loadSingleQuestion() {
        const urlParams = new URLSearchParams(window.location.search);
        const questionGuid = urlParams.get('question');
        
        if (questionGuid) {
            this.currentQuestion = this.questions.find(q => q.guid === questionGuid);
        }
        
        if (this.currentQuestion) {
            this.displayQuestion();
        } else {
            Utils.showError('Вопрос не найден');
        }
    }
    
    displayQuestion() {
        const container = document.getElementById('question-container');
        if (!container) return;
        
        const question = this.currentQuestion;
        const isMobile = window.innerWidth <= 768;
        let html = `
            <div class="question">
                <div class="question-header-with-share">
                    <div class="question-text">${Utils.markdownToHtml(question.question || question.title)}</div>
                    <a id="share-current-quiz" class="question-share-btn" title="Открыть в новой вкладке">
                        📎
                    </a>
                </div>
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
        question.options.forEach((option, index) => {
            const optionText = isMobile && option.length > 60 ? option.substring(0, 60) + '...' : option;
            html += `
                <div class="option" data-index="${index}" title="${option}">
                    ${optionText}
                </div>
            `;
        });
        html += '</div></div>';
        
        container.innerHTML = html;
        
        this.bindQuestionEvents(container);
        this.hideExplanation();
        this.showNextButton(false);
        
        // Setup share link for current question
        if (this.currentQuestion && this.currentQuestion.guid) {
            this.setupCurrentQuizShareLink(this.currentQuestion.guid);
        }
    }
    
    
    setupCurrentQuizShareLink(questionGuid) {
        const shareLink = document.getElementById('share-current-quiz');
        if (shareLink && questionGuid) {
            const baseUrl = window.baseUrl || '';
            const quizUrl = `${baseUrl}/quiz-single/?question=${questionGuid}`;
            shareLink.href = quizUrl;
            shareLink.target = '_blank';
            shareLink.rel = 'noopener noreferrer';
        }
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
        
        const images = container.querySelectorAll('.question-image');
        images.forEach(image => {
            image.addEventListener('click', (e) => {
                Utils.showImageModal(e.target.src, e.target.alt);
            });
        });
    }
    
    selectOption(selectedIndex) {
        if (this.answered) return;
        
        this.answered = true;
        const options = document.querySelectorAll('.option');
        const correctIndex = this.currentQuestion.correct;
        
        options.forEach(option => { 
            option.classList.add('disabled'); 
        });
        
        options[selectedIndex].classList.add('selected');
        if (selectedIndex !== correctIndex) {
            options[correctIndex].classList.add('correct');
        } else {
            options[selectedIndex].classList.add('correct');
        }
        
        const isCorrect = selectedIndex === correctIndex;
        this.statsManager.updateStats(isCorrect, this.currentQuestion);
        this.showNextButton(true);
        this.showExplanationButtonIfContent();
    }
    
    showNextButton(show) {
        const nextBtn = document.getElementById('next-question');
        if (nextBtn) nextBtn.style.display = show ? 'inline-flex' : 'none';
    }
    
    showExplanationButtonIfContent() {
        const explanationBtn = document.getElementById('show-explanation');
        const sourceLink = document.getElementById('source-link');
        
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
    
        if (!explanation || 
            explanation.length < 0) {
            return false;
        }
        
        return true;
    }
    
    hideExplanation() {
        const explanationContainer = document.getElementById('explanation-container');
        const explanationBtn = document.getElementById('show-explanation');
        const sourceLink = document.getElementById('source-link');
        if (explanationContainer) explanationContainer.style.display = 'none';
        if (explanationBtn) explanationBtn.style.display = 'none';
        if (sourceLink) sourceLink.style.display = 'none';
    }
    
    showExplanation() {
        if (!this.currentQuestion) return;
        
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            this.showModalExplanation();
        } else {
            this.showInlineExplanation();
        }
    }
    
    showModalExplanation() {
        const explanation = Utils.markdownToHtml(this.currentQuestion.explanation || '');
        Utils.showModal(explanation, 'Почему так?');
    }
    
    showInlineExplanation() {
        const explanationContainer = document.getElementById('explanation-container');
        const explanationContent = document.getElementById('explanation-content');
        const sourceLink = document.getElementById('source-link');
        
        if (explanationContainer && explanationContent) {
            const explanation = Utils.markdownToHtml(this.currentQuestion.explanation || '');
            explanationContent.innerHTML = explanation;
            
            
            explanationContainer.style.display = 'block';
            explanationContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    setupFilterChangeButton() {
        const changeBtn = document.getElementById('changeFilters');
        if (changeBtn) {
            changeBtn.onclick = () => {
                const params = window.filterManager ? window.filterManager.getFilterParams() : '';
                const baseUrl = window.baseUrl || '';
                const url = params ? `${baseUrl}/quizzes/?${params}` : `${baseUrl}/quizzes/`;
                window.location.href = url;
            };
        }
    }
    
    bindEvents() {
        // Кнопка "Следующий" только для режима случайных викторин
        const nextBtn = document.getElementById('next-question');
        if (nextBtn && !this.isSingleQuestionMode) {
            nextBtn.addEventListener('click', () => {
                this.loadRandomQuestion();
            });
        }
        
        const explanationBtn = document.getElementById('show-explanation');
        if (explanationBtn) {
            explanationBtn.addEventListener('click', () => {
                this.showExplanation();
            });
        }
        
        const resetBtn = document.getElementById('reset-stats');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.statsManager.resetStats();
            });
        }
    }
}
