// Filter Manager - управление фильтрами тегов
import { Utils } from './utils.js';
import { TagsManager } from './tags-manager.js';

export class FilterManager {
    constructor() {
        this.includeTags = new Set();
        this.excludeTags = new Set();
        this.tagsManager = new TagsManager();
        this.onFiltersChanged = null;
        this.allQuestionsForCounts = [];
        
        // По умолчанию исключаем тег "Устаревшее"
        this.excludeTags.add('outdated');
        
        this.init();
    }
    
    init() {
        console.log('🔧 FilterManager init started');
        this.bindEvents();
        this.renderTagsCompact();
        this.initFiltersPanel();
        this.bindDelegatedEvents();
        this.updateFilterSummary();
        this.updateCurrentFiltersDisplay();
        console.log('✅ FilterManager init completed');
    }
    
    togglePanel() {
        console.log('🔄 togglePanel called');
        const currentFilters = document.getElementById('currentFilters');
        const content = document.getElementById('currentFiltersContent');
        
        console.log('📋 Elements:', {
            currentFilters: !!currentFilters,
            content: !!content,
            collapsed: currentFilters?.classList.contains('collapsed')
        });
        
        if (content) {
            console.log('📐 Content current styles:', {
                display: getComputedStyle(content).display,
                height: getComputedStyle(content).height,
                opacity: getComputedStyle(content).opacity,
                visibility: getComputedStyle(content).visibility
            });
        }
        
        if (currentFilters && content) {
            const isCollapsed = currentFilters.classList.contains('collapsed');
            
            if (isCollapsed) {
                // Разворачиваем
                console.log('📖 Expanding panel');
                currentFilters.classList.remove('collapsed');
                content.style.setProperty('display', 'block', 'important');
                content.style.setProperty('max-height', '1000px', 'important');
                content.style.setProperty('opacity', '1', 'important');
                content.style.setProperty('height', 'auto', 'important');
                content.style.setProperty('visibility', 'visible', 'important');
                console.log('✅ Panel expanded - display:', content.style.display);
            } else {
                // Сворачиваем
                console.log('📕 Collapsing panel');
                currentFilters.classList.add('collapsed');
                content.style.setProperty('display', 'none', 'important');
                content.style.setProperty('max-height', '0', 'important');
                content.style.setProperty('opacity', '0', 'important');
                console.log('✅ Panel collapsed - display:', content.style.display);
            }
        } else {
            console.log('❌ Elements not found!');
        }
    }
    
    toggleMainFiltersContainer() {
        console.log('🔄 toggleMainFiltersContainer called');
        const filterManager = document.getElementById('filterManager');
        
        if (filterManager) {
            const isCollapsed = filterManager.classList.contains('collapsed');
            
            if (isCollapsed) {
                // Разворачиваем
                console.log('📖 Expanding main filters container');
                filterManager.classList.remove('collapsed');
                localStorage.setItem('filtersCollapsed', 'false');
                console.log('✅ Main filters container expanded');
            } else {
                // Сворачиваем
                console.log('📕 Collapsing main filters container');
                filterManager.classList.add('collapsed');
                localStorage.setItem('filtersCollapsed', 'true');
                console.log('✅ Main filters container collapsed');
            }
        } else {
            console.log('❌ Filter manager element not found!');
        }
    }
    
    bindEvents() {
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllFilters();
                this.triggerApply();
            });
        }
        
        const changeBtn = document.getElementById('changeFilters');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                const params = this.getFilterParams();
                const url = params ? `/quizzes/?${params}` : '/quizzes/';
                window.location.href = url;
            });
        }
        
        // Убираем прямой обработчик, используем только делегирование
    }
    
    bindDelegatedEvents() {
        console.log('🎯 Setting up click listener');
        // Toggle filters panel
        document.addEventListener('click', (e) => {
            console.log('👆 Document click:', e.target.tagName, e.target.id, e.target.className);
            const toggleButton = e.target.closest('#toggleFiltersPanel');
            if (toggleButton) {
                console.log('🎯 Toggle button clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.togglePanel();
            }
            
            // Toggle main filters container
            const toggleMainButton = e.target.closest('#toggleFiltersContainer');
            if (toggleMainButton) {
                console.log('🎯 Toggle main filters container clicked!');
                e.preventDefault();
                e.stopPropagation();
                this.toggleMainFiltersContainer();
            }
        });
    }
    
    triggerApply() {
        if (this.onFiltersChanged) {
            this.onFiltersChanged(this.getFilters());
        }
    }
    
    getTagState(tag) {
        if (this.includeTags.has(tag)) return 'include';
        if (this.excludeTags.has(tag)) return 'exclude';
        return 'none';
    }
    
    setTagState(tag, state) {
        this.includeTags.delete(tag);
        this.excludeTags.delete(tag);
        if (state === 'include') this.includeTags.add(tag);
        if (state === 'exclude') this.excludeTags.add(tag);
    }
    
    cycleTagState(tag) {
        const state = this.getTagState(tag);
        if (state === 'none') this.setTagState(tag, 'include');
        else if (state === 'include') this.setTagState(tag, 'exclude');
        else this.setTagState(tag, 'none');
        this.refreshAllChips();
        this.triggerApply();
    }
    
    renderTagsCompact() {
        const container = document.getElementById('tagsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.entries(this.tagsManager.tagsData).forEach(([tagKey, tagInfo]) => {
            const button = this.createTagChip(tagKey, tagInfo);
            container.appendChild(button);
        });
    }
    
    getTagCount(tagKey) {
        if (!Array.isArray(this.allQuestionsForCounts) || this.allQuestionsForCounts.length === 0) return 0;
        return this.allQuestionsForCounts.filter(q => Array.isArray(q.tags) && q.tags.includes(tagKey)).length;
    }
    
    createTagChip(tagKey, tagInfo) {
        const button = document.createElement('div');
        button.className = 'tag-chip';
        button.dataset.tag = tagKey;
        button.style.setProperty('--chip-color', tagInfo.color);
        
        const state = this.getTagState(tagKey);
        button.classList.toggle('state-include', state === 'include');
        button.classList.toggle('state-exclude', state === 'exclude');
        
        const count = this.getTagCount(tagKey);
        
        button.innerHTML = `
            <span class="tag-dot" style="background-color: ${tagInfo.color}"></span>
            <span class="tag-name">${tagInfo.name}</span>
            <span class="tag-count">${count}</span>
        `;
        
        // Клик по чипу — цикл состояний
        button.addEventListener('click', (e) => {
            if ((e.target).classList && (e.target).classList.contains('tag-action')) return;
            this.cycleTagState(tagKey);
        });
        
        // Долгое нажатие на мобилке — контекстное меню
        let pressTimer;
        button.addEventListener('touchstart', () => {
            pressTimer = setTimeout(() => this.showChipMenu(tagKey, tagInfo.name, button), 400);
        });
        
        ['touchend','touchmove','touchcancel'].forEach(evt => {
            button.addEventListener(evt, () => clearTimeout(pressTimer));
        });
        
        return button;
    }
    
    refreshAllChips() {
        this.renderTagsCompact();
        this.renderModalTagsCompact();
        // updateCounts() вызывается только если есть данные
        if (this.allQuestionsForCounts.length > 0) {
            this.updateCounts();
        }
        this.updateFilterSummary();
        this.updateCurrentFiltersDisplay();
    }
    
    updateCounts() {
        document.querySelectorAll('.tag-chip').forEach(chip => {
            const tagKey = chip.dataset.tag;
            const countEl = chip.querySelector('.tag-count');
            if (countEl) countEl.textContent = this.getTagCount(tagKey);
        });
    }
    
    // Публичный метод для обновления счетчиков после загрузки данных
    refreshCounts() {
        if (this.allQuestionsForCounts.length > 0) {
            this.updateCounts();
        }
    }
    
    showChipMenu(tagKey, tagName, anchorEl) {
        const existing = document.querySelector('.chip-menu');
        if (existing) existing.remove();
        
        const menu = document.createElement('div');
        menu.className = 'chip-menu';
        menu.innerHTML = `
            <button class="btn btn-sm" data-action="clear">Сбросить</button>
        `;
        
        document.body.appendChild(menu);
        const rect = anchorEl.getBoundingClientRect();
        menu.style.left = `${rect.left + window.scrollX}px`;
        menu.style.top = `${rect.bottom + window.scrollY + 6}px`;
        
        const onClick = (e) => {
            const action = e.target.getAttribute('data-action');
            if (action === 'include') this.setTagState(tagKey, 'include');
            if (action === 'exclude') this.setTagState(tagKey, 'exclude');
            if (action === 'clear') this.setTagState(tagKey, 'none');
            this.refreshAllChips();
            this.triggerApply();
            cleanup();
        };
        
        menu.addEventListener('click', onClick);
        
        const cleanup = () => {
            menu.removeEventListener('click', onClick);
            menu.remove();
            document.removeEventListener('click', outside);
        };
        
        const outside = (e) => { 
            if (!menu.contains(e.target)) cleanup(); 
        };
        
        setTimeout(() => document.addEventListener('click', outside));
    }
    
    clearAllFilters() {
        this.includeTags.clear();
        this.excludeTags.clear();
        this.excludeTags.add('outdated');
        this.refreshAllChips();
    }
    
    getFilters() {
        return { 
            include: Array.from(this.includeTags), 
            exclude: Array.from(this.excludeTags) 
        };
    }
    
    setFilters(filters) {
        this.includeTags = new Set(filters.include || []);
        this.excludeTags = new Set(filters.exclude || []);
        this.refreshAllChips();
    }
    
    updateFilterSummary() {
        const summary = document.getElementById('filterSummary');
        const activeFilters = document.getElementById('activeFilters');
        if (!summary || !activeFilters) return;
        
        const hasFilters = this.includeTags.size > 0 || this.excludeTags.size > 0;
        
        if (hasFilters) {
            let html = '';
            
            if (this.includeTags.size > 0) {
                html += '<div class="filter-group">';
                html += '<span class="filter-label">Включить:</span><div class="filter-tags">';
                this.includeTags.forEach(tag => {
                    const info = this.tagsManager.tagsData[tag];
                    html += `<span class="filter-tag include" style="background-color: ${info?.color || '#6b7280'}">${info?.name || tag}</span>`;
                });
                html += '</div></div>';
            }
            
            if (this.excludeTags.size > 0) {
                html += '<div class="filter-group">';
                html += '<span class="filter-label">Исключить:</span><div class="filter-tags">';
                this.excludeTags.forEach(tag => {
                    const info = this.tagsManager.tagsData[tag];
                    html += `<span class="filter-tag exclude" style="background-color: ${info?.color || '#6b7280'}">${info?.name || tag}</span>`;
                });
                html += '</div></div>';
            }
            
            activeFilters.innerHTML = html;
            summary.style.display = 'block';
        } else {
            summary.style.display = 'none';
        }
        
        // Обновляем значок количества фильтров
        this.updateFilterBadge();
    }
    
    updateFilterBadge() {
        const badge = document.getElementById('filterBadge');
        if (!badge) return;
        
        const totalFilters = this.includeTags.size + this.excludeTags.size;
        
        if (totalFilters > 0) {
            badge.textContent = totalFilters;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
    
    updateCurrentFiltersDisplay() {
        const currentFilters = document.getElementById('currentFilters');
        const currentFiltersContent = document.getElementById('currentFiltersContent');
        const currentFiltersHeader = currentFilters ? currentFilters.querySelector('h4') : null;
        
        if (!currentFilters || !currentFiltersContent) return;
        
        const hasFilters = this.includeTags.size > 0 || this.excludeTags.size > 0;
        
        if (hasFilters) {
            // Обновляем заголовок с фильтрами
            let headerText = '🔍︎ Активные фильтры: ';
            let filterTexts = [];
            
            this.includeTags.forEach(tag => {
                const info = this.tagsManager.tagsData[tag];
                filterTexts.push(`+${info?.name || tag}`);
            });
            
            this.excludeTags.forEach(tag => {
                const info = this.tagsManager.tagsData[tag];
                filterTexts.push(`-${info?.name || tag}`);
            });
            
            if (filterTexts.length > 0) {
                headerText += filterTexts.join(', ');
            }
            
            if (currentFiltersHeader) {
                currentFiltersHeader.textContent = headerText;
            }
            
            // Содержимое панели
            let html = '';
            
            if (this.includeTags.size > 0) {
                html += '<div class="current-filter-group">';
                html += '<span class="current-filter-label">Включить:</span><div class="current-filter-tags">';
                this.includeTags.forEach(tag => {
                    const info = this.tagsManager.tagsData[tag];
                    html += `<span class="current-filter-tag include" style="background-color: ${info?.color || '#6b7280'}">+${info?.name || tag}</span>`;
                });
                html += '</div></div>';
            }
            
            if (this.excludeTags.size > 0) {
                html += '<div class="current-filter-group">';
                html += '<span class="current-filter-label">Исключить:</span><div class="current-filter-tags">';
                this.excludeTags.forEach(tag => {
                    const info = this.tagsManager.tagsData[tag];
                    html += `<span class="current-filter-tag exclude" style="background-color: ${info?.color || '#6b7280'}">-${info?.name || tag}</span>`;
                });
                html += '</div></div>';
            }
            
            currentFiltersContent.innerHTML = html;
            currentFilters.style.display = 'block';
            // Убираем inline стили для display, чтобы CSS мог работать
            currentFilters.style.removeProperty('display');
        } else {
            if (currentFiltersHeader) {
                currentFiltersHeader.textContent = '🎯 Активные фильтры';
            }
            currentFilters.style.display = 'none';
        }
        
        // Обновляем значок количества фильтров
        this.updateFilterBadge();
    }
    
    showFilterModal() {
        const modal = Utils.showModal(`
            <div class="filter-section">
                <div class="tags-container compact" id="modalTagsList"></div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Закрыть</button>
            </div>
        `, 'Изменить фильтры');
        
        this.renderModalTagsCompact();
    }
    
    renderModalTagsCompact() {
        const container = document.getElementById('modalTagsList');
        if (!container) return;
        
        container.innerHTML = '';
        Object.entries(this.tagsManager.tagsData).forEach(([tagKey, tagInfo]) => {
            const chip = this.createTagChip(tagKey, tagInfo);
            container.appendChild(chip);
        });
    }
    
    filterQuestions(questions) {
        return questions.filter(q => {
            const t = q.tags || [];
            if (this.includeTags.size > 0 && !t.some(x => this.includeTags.has(x))) return false;
            if (this.excludeTags.size > 0 && t.some(x => this.excludeTags.has(x))) return false;
            return true;
        });
    }
    
    getFilterParams() {
        const params = new URLSearchParams();
        if (this.includeTags.size > 0) params.set('include', Array.from(this.includeTags).join(','));
        if (this.excludeTags.size > 0) params.set('exclude', Array.from(this.excludeTags).join(','));
        return params.toString();
    }
    
    loadFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const includeParam = urlParams.get('include');
        const excludeParam = urlParams.get('exclude');
        
        if (includeParam) this.includeTags = new Set(includeParam.split(',').filter(Boolean));
        if (excludeParam) this.excludeTags = new Set(excludeParam.split(',').filter(Boolean));
        
        this.refreshAllChips();
        this.updateCurrentFiltersDisplay();
    }
    

    
    // Инициализация панели фильтров
    initFiltersPanel() {
        const currentFilters = document.getElementById('currentFilters');
        if (currentFilters) {
            // Панель по умолчанию свернута
            currentFilters.classList.add('collapsed');
        }
        
        // Инициализация основной панели фильтров
        const filterManager = document.getElementById('filterManager');
        if (filterManager) {
            // Проверяем сохраненное состояние или устанавливаем свернутое по умолчанию
            const isCollapsed = localStorage.getItem('filtersCollapsed') !== 'false'; // по умолчанию свернуто
            if (isCollapsed) {
                filterManager.classList.add('collapsed');
            }
        }
    }
}

// FilterManager initialization moved to main.js to prevent duplicates
