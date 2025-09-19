---
layout: default
title: Все викторины
description: Список всех викторин по 1С с возможностью поиска и фильтрации
permalink: /quizzes/
---

{% include quizzes-content.html %}
{% include quiz-data.html %}

<!-- Quiz Modal -->
<div class="quiz-modal" id="quizModal">
    <div class="quiz-modal-content">
        <div class="quiz-modal-header">
            <h2 class="quiz-modal-title" id="quizModalTitle">Викторина</h2>
            <div class="quiz-modal-buttons">
                <a id="open-in-new-tab" class="quiz-modal-btn" title="Открыть в новой вкладке" target="_blank" style="display: none;">
                    📎
                </a>
                <button class="quiz-modal-close" id="quizModalClose" aria-label="Закрыть викторину">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
        <div class="quiz-modal-body">
            {% include quiz-single-container.html %}
        </div>
    </div>
</div>

