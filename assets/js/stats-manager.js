// Statistics management for the quiz application

export class StatsManager {
    constructor() {
        this.stats = this.loadStats();
        this.initializeStats();
    }

    loadStats() {
        try {
            const stats = localStorage.getItem('quizStats');
            return stats ? JSON.parse(stats) : null;
        } catch (error) {
            console.error('Error loading stats from localStorage:', error);
            return null;
        }
    }

    initializeStats() {
        if (!this.stats) {
            this.stats = {
                correctAnswers: 0,
                totalAnswers: 0,
                accuracy: 0,
                questionsAnswered: 0,
                lastPlayed: null,
                totalPlayTime: 0,
                categories: {},
                difficulty: {
                    easy: { correct: 0, total: 0 },
                    medium: { correct: 0, total: 0 },
                    hard: { correct: 0, total: 0 }
                }
            };
            this.saveStats();
        }
    }

    saveStats() {
        try {
            localStorage.setItem('quizStats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Error saving stats to localStorage:', error);
        }
    }

    updateStats(isCorrect, questionData = null) {
        this.stats.totalAnswers++;
        if (isCorrect) {
            this.stats.correctAnswers++;
        }
        
        this.stats.accuracy = Math.round((this.stats.correctAnswers / this.stats.totalAnswers) * 100);
        this.stats.lastPlayed = new Date().toISOString();
        
        // Обновляем статистику по категориям если есть данные вопроса
        if (questionData && questionData.tags) {
            questionData.tags.forEach(tag => {
                if (!this.stats.categories[tag]) {
                    this.stats.categories[tag] = { correct: 0, total: 0 };
                }
                this.stats.categories[tag].total++;
                if (isCorrect) {
                    this.stats.categories[tag].correct++;
                }
            });
        }
        
        this.saveStats();
        this.updateStatsDisplay();
    }

    resetStats() {
        this.stats = {
            correctAnswers: 0,
            totalAnswers: 0,
            accuracy: 0,
            questionsAnswered: 0,
            lastPlayed: null,
            totalPlayTime: 0,
            categories: {},
            difficulty: {
                easy: { correct: 0, total: 0 },
                medium: { correct: 0, total: 0 },
                hard: { correct: 0, total: 0 }
            }
        };
        this.saveStats();
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        // Update main stats display
        const correctAnswers = document.getElementById('correct-answers');
        const totalAnswers = document.getElementById('total-answers');
        const accuracy = document.getElementById('accuracy');
        
        if (correctAnswers) correctAnswers.textContent = this.stats.correctAnswers;
        if (totalAnswers) totalAnswers.textContent = this.stats.totalAnswers;
        if (accuracy) accuracy.textContent = this.stats.accuracy + '%';

        // Update preview stats display
        const correctPreview = document.getElementById('correct-answers-preview');
        const totalPreview = document.getElementById('total-questions-preview');
        const accuracyPreview = document.getElementById('accuracy-preview');
        
        if (correctPreview) correctPreview.textContent = this.stats.correctAnswers;
        if (totalPreview) totalPreview.textContent = this.stats.totalAnswers;
        if (accuracyPreview) accuracyPreview.textContent = this.stats.accuracy + '%';

        // Update additional stats if they exist
    }

    getStats() {
        return { ...this.stats };
    }

    getCategoryStats(tag) {
        return this.stats.categories[tag] || { correct: 0, total: 0 };
    }

    getOverallProgress() {
        return {
            totalQuestions: this.stats.totalAnswers,
            correctAnswers: this.stats.correctAnswers,
            accuracy: this.stats.accuracy
        };
    }
}
