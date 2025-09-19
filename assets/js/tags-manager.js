// Tags management for the quiz application

export class TagsManager {
    constructor() {
        this.tagsData = this.loadTagsData();
    }

    loadTagsData() {
        if (window.tagsData) {
            return window.tagsData;
        }
        
        // Fallback data if tagsData is not available
        return {
            "outdated": { name: "Устаревшее", color: "#ef4444" },
            "standarts": { name: "Стандарты", color: "#06b6d4" },
            "syntax": { name: "Синтаксис", color: "#10b981" },
            "basics": { name: "Основы", color: "#3b82f6" },
            "queries": { name: "Запросы", color: "#f59e0b" },
            "objects": { name: "Объекты", color: "#8b5cf6" },
            "errors": { name: "Ошибки", color: "#ef4444" },
            "performance": { name: "Производительность", color: "#06b6d4" },
            "security": { name: "Безопасность", color: "#84cc16" },
            "ui": { name: "Интерфейс", color: "#ec4899" },
            "data": { name: "Данные", color: "#f97316" },
            "advanced": { name: "Продвинутое", color: "#dc2626" },
            "non": { name: "Общие", color: "#6b7280" }
        };
    }

    getTagName(tag) {
        return this.tagsData[tag]?.name || tag;
    }

    getTagColor(tag) {
        return this.tagsData[tag]?.color || '#6b7280';
    }

    getTagCount(tagKey, questions) {
        if (!Array.isArray(questions) || questions.length === 0) return 0;
        return questions.filter(q => Array.isArray(q.tags) && q.tags.includes(tagKey)).length;
    }

    renderTags(tags, container, options = {}) {
        if (!Array.isArray(tags) || tags.length === 0) return '';
        
        const { 
            showCount = false, 
            questions = [], 
            clickable = false, 
            className = 'tag' 
        } = options;

        return tags.map(tag => {
            const count = showCount ? this.getTagCount(tag, questions) : '';
            const countHtml = count ? `<span class="tag-count">${count}</span>` : '';
            const clickAttr = clickable ? `onclick="window.tagsManager.handleTagClick('${tag}')"` : '';
            
            return `
                <span class="${className} ${tag}" 
                      style="background-color: ${this.getTagColor(tag)}"
                      ${clickAttr}>
                    ${this.getTagName(tag)}
                    ${countHtml}
                </span>
            `;
        }).join('');
    }

    handleTagClick(tag) {
        // This can be overridden by specific implementations
        console.log('Tag clicked:', tag);
    }
}
