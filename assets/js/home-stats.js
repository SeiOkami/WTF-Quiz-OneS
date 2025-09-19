// Home page statistics initialization
import { StatsManager } from './stats-manager.js';

export class HomeStats {
    constructor() {
        this.statsManager = new StatsManager();
        this.init();
    }

    init() {
        // Инициализируем статистику при загрузке страницы
        this.statsManager.updateStatsDisplay();
        
        // Привязываем событие сброса статистики
        this.bindResetEvent();
        
        // Обновляем статистику каждые 5 секунд (на случай, если пользователь вернется с другой страницы)
        this.startAutoUpdate();
    }

    bindResetEvent() {
        const resetBtn = document.getElementById('reset-stats');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить.')) {
                    this.statsManager.resetStats();
                }
            });
        }
    }

    startAutoUpdate() {
        // Обновляем статистику каждые 5 секунд
        setInterval(() => {
            this.statsManager.updateStatsDisplay();
        }, 5000);
    }
}
