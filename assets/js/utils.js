// Utility functions for the quiz application

export class Utils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static markdownToHtml(markdown) {
        if (!markdown) return '';
        
        // Заменяем пути к изображениям с учётом baseurl
        let processedMarkdown = markdown;
        if (window.baseUrl) {
            processedMarkdown = markdown.replace(/!\[([^\]]*)\]\(\/assets\//g, `![$1](${window.baseUrl}/assets/`);
        }
        
        return marked.parse(processedMarkdown);
    }

    static formatDate(date) {
        if (!date) return '';
        try {
            let dateStr = date.toString();
            
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                const d = new Date(dateStr + 'T00:00:00');
                return d.toLocaleDateString('ru-RU', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                });
            }
            
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                return dateStr;
            }
            
            return d.toLocaleDateString('ru-RU', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
        } catch (e) {
            return date.toString();
        }
    }

    static formatSource(source) {
        if (!source) return '';
        if (source.includes('t.me/')) {
            return `<a href="${source}" target="_blank" rel="noopener noreferrer" title="${source}">Telegram</a>`;
        }
        if (source.startsWith('http')) {
            return `<a href="${source}" target="_blank" rel="noopener noreferrer" title="${source}">Ссылка</a>`;
        }
        return source;
    }

    static getQuestionPreview(content) {
        if (!content) return '';
        const plainText = content.replace(/[#*`]/g, '').replace(/\n/g, ' ');
        return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
    }

    static showModal(content, title = 'Модальное окно') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { 
            if (e.target === modal) modal.remove(); 
        });
        return modal;
    }

    static showImageModal(src, alt) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content image-modal">
                <img src="${src}" alt="${alt}" class="full-size-image">
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { 
            if (e.target === modal) modal.remove(); 
        });
        return modal;
    }

    static showError(message, containerId = 'question-container') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    <h3>Ошибка</h3>
                    <p>${message}</p>
                    <a href="${window.baseUrl || ''}/quizzes" class="btn btn-primary">Вернуться к списку</a>
                </div>
            `;
        }
    }
}
