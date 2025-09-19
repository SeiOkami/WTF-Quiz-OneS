// Quizzes List Application
import { Utils } from './utils.js';
import { TagsManager } from './tags-manager.js';

export class QuizzesApp {
    constructor() {
        this.allQuestions = [];
        this.filteredQuestions = [];
        this.currentSort = { field: 'date', direction: 'desc' };
        this.tagsManager = new TagsManager();
        
        this.init();
    }
    
    init() {
        this.loadQuestions();
        this.bindEvents();
        this.initializeSearch();
        this.initializeSorting();
        this.updateSortIcons();
        
        if (window.filterManager) {
            window.filterManager.onFiltersChanged = () => this.applyFilters();
        }
        
        this.applyFilters();
    }
    
    loadQuestions() {
        if (window.quizData && window.quizData.questions) {
            this.allQuestions = window.quizData.questions;
        } else {
            console.error('Quiz data not found');
            return;
        }
        
        this.filteredQuestions = [...this.allQuestions];
        this.updateStats();
        this.renderTable();
    }
    
    bindEvents() {
        const startRandomBtn = document.getElementById('startRandomQuiz');
        if (startRandomBtn) {
            startRandomBtn.addEventListener('click', () => this.startRandomQuiz());
        }
    }
    
    initializeSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        const debouncedSearch = Utils.debounce(() => this.applyFilters(), 200);
        searchInput.addEventListener('input', debouncedSearch);
    }
    
    initializeSorting() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                if (this.currentSort.field === field) {
                    this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.currentSort.field = field;
                    this.currentSort.direction = 'asc';
                }
                this.updateSortIcons();
                this.sortQuestions();
                this.renderTable();
            });
        });
    }
    
    updateSortIcons() {
        document.querySelectorAll('.sortable').forEach(header => {
            const icon = header.querySelector('.sort-icon');
            const field = header.dataset.sort;
            
            if (this.currentSort.field === field) {
                icon.style.transform = this.currentSort.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)';
                icon.style.opacity = '1';
            } else {
                icon.style.transform = 'rotate(0deg)';
                icon.style.opacity = '0.3';
            }
        });
    }
    
    sortQuestions() {
        this.filteredQuestions.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.currentSort.field) {
                case 'id':
                    aValue = a.id || 0;
                    bValue = b.id || 0;
                    break;
                case 'date':
                    aValue = new Date(a.date || 0);
                    bValue = new Date(b.date || 0);
                    break;
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'tags':
                    aValue = a.tags.join(', ').toLowerCase();
                    bValue = b.tags.join(', ').toLowerCase();
                    break;
                case 'source':
                    aValue = (a.source || '').toLowerCase();
                    bValue = (b.source || '').toLowerCase();
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    applyFilters() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        let filtered = this.allQuestions;
        
        if (window.filterManager) {
            filtered = window.filterManager.filterQuestions(filtered);
        }
        
        this.filteredQuestions = filtered.filter(q => 
            !searchTerm || 
            q.title.toLowerCase().includes(searchTerm) || 
            (q.content && q.content.toLowerCase().includes(searchTerm))
        );
        
        this.sortQuestions();
        this.updateStats();
        this.renderTable();
    }
    
    updateStats() {
        const totalQuestions = document.getElementById('totalQuestions');
        const filteredQuestions = document.getElementById('filteredQuestions');
        
        if (totalQuestions) totalQuestions.textContent = this.allQuestions.length;
        if (filteredQuestions) filteredQuestions.textContent = this.filteredQuestions.length;
    }
    
    renderTable() {
        const tbody = document.getElementById('quizzesTableBody');
        const noResults = document.getElementById('noResults');
        
        if (!tbody || !noResults) return;
        
        if (this.filteredQuestions.length === 0) {
            tbody.innerHTML = '';
            noResults.style.display = 'flex';
            return;
        }
        
        noResults.style.display = 'none';
        tbody.innerHTML = this.filteredQuestions.map(question => `
            <tr class="quiz-row" data-guid="${question.guid}" onclick="window.quizzesApp.startQuiz('${question.guid}')" style="cursor: pointer;">
                <td class="date-cell">${Utils.formatDate(question.date)}</td>
                <td class="question-cell">
                    <div class="question-content">
                        <h4 class="question-title">${question.title}</h4>
                    </div>
                </td>
                <td class="tags-cell">
                    <div class="tags-container">
                        ${question.tags.map(tag => `
                            <span class="tag" style="background-color: ${this.tagsManager.getTagColor(tag)}">
                                ${this.tagsManager.getTagName(tag)}
                            </span>
                        `).join('')}
                    </div>
                </td>
                <td class="source-cell">${Utils.formatSource(question.source)}</td>
            </tr>
        `).join('');
    }
    
    startQuiz(questionGuid) {
        if (window.quizModal && typeof window.quizModal.open === 'function') {
            window.quizModal.open(questionGuid);
        } else {
            // Wait a bit for modal to load, then try again
            setTimeout(() => {
                if (window.quizModal && typeof window.quizModal.open === 'function') {
                    window.quizModal.open(questionGuid);
                } else {
                    // Fallback to page navigation if modal still not available
                    window.location.href = `/quiz-single/?question=${questionGuid}`;
                }
            }, 200);
        }
    }
    
    startRandomQuiz() {
        let params = window.filterManager ? window.filterManager.getFilterParams() : '';
        const url = params ? `/quiz/?${params}` : '/quiz/';
        window.location.href = url;
    }
}
