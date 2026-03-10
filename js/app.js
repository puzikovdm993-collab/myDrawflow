// Инициализация Drawflow
let editor = null;

// Данные для хранения состояния
let workflowData = {};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initDrawflow();
    setupEventListeners();
});

/**
 * Инициализация редактора Drawflow
 */
function initDrawflow() {
    const drawflowContainer = document.getElementById('drawflow');
    
    editor = new Drawflow(drawflowContainer);
    
    // Настройки редактора
    editor.reroute = true;
    editor.reroute_fix_curvature = true;
    editor.force_first_input = false;
    editor.draggable_inputs = true;
    editor.useuuid = true;
    
    // Кастомизация узлов
    editor.node_selected = 'selected';
    editor.editor_mode = 'edit';
    
    // События редактора
    editor.on('nodeCreated', (nodeId) => {
        console.log('Узел создан:', nodeId);
        // Даем время на полную инициализацию узла в коллекции
        setTimeout(() => {
            if (editor.nodes[nodeId]) {
                updatePropertiesPanel(nodeId);
            }
        }, 10);
    });
    
    editor.on('nodeSelected', (nodeId) => {
        console.log('Узел выбран:', nodeId);
        updatePropertiesPanel(nodeId);
    });
    
    editor.on('nodeUnselected', (nodeId) => {
        console.log('Узел снят с выделения:', nodeId);
        clearPropertiesPanel();
    });
    
    editor.on('nodeRemoved', (nodeId) => {
        console.log('Узел удален:', nodeId);
        clearPropertiesPanel();
    });
    
    editor.on('connectionCreated', (connection) => {
        console.log('Соединение создано:', connection);
    });
    
    editor.on('connectionRemoved', (connection) => {
        console.log('Соединение удалено:', connection);
    });
    
    editor.on('mouseMove', (event) => {
        // Обработка перемещения мыши
    });
    
    // Запуск редактора
    editor.start();
    
    console.log('Drawflow инициализирован');
}

/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    // Кнопка добавления узла
    document.getElementById('btn-add-node').addEventListener('click', openNodeModal);
    
    // Кнопка сохранения
    document.getElementById('btn-save').addEventListener('click', saveWorkflow);
    
    // Кнопка загрузки
    document.getElementById('btn-load').addEventListener('click', loadWorkflow);
    
    // Кнопка очистки
    document.getElementById('btn-clear').addEventListener('click', clearWorkflow);
    
    // Модальное окно
    document.getElementById('close-modal').addEventListener('click', closeNodeModal);
    document.getElementById('node-form').addEventListener('submit', handleNodeSubmit);
    
    // Drag & Drop для типов узлов
    setupDragAndDrop();
    
    // Горячие клавиши
    setupKeyboardShortcuts();
}

/**
 * Настройка Drag & Drop для панели узлов
 */
function setupDragAndDrop() {
    const nodeTypes = document.querySelectorAll('.node-type');
    
    nodeTypes.forEach(nodeType => {
        nodeType.addEventListener('dragstart', (e) => {
            const type = nodeType.dataset.type;
            const label = nodeType.querySelector('.node-label').textContent;
            e.dataTransfer.setData('type', type);
            e.dataTransfer.setData('label', label);
            e.dataTransfer.effectAllowed = 'copy';
        });
        
        // Клик для быстрого добавления
        nodeType.addEventListener('click', () => {
            const type = nodeType.dataset.type;
            const label = nodeType.querySelector('.node-label').textContent;
            quickAddNode(type, label);
        });
    });
    
    const drawflowContainer = document.getElementById('drawflow');
    
    drawflowContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    drawflowContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        const label = e.dataTransfer.getData('label');
        
        if (type && label) {
            const rect = drawflowContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            addNodeToCanvas(type, label, x, y);
        }
    });
}

/**
 * Быстрое добавление узла кликом
 */
function quickAddNode(type, label) {
    const title = prompt('Введите название узла:', label);
    if (title) {
        // Добавляем узел в центр видимой области
        const centerOffset = 100;
        addNodeToCanvas(type, title, centerOffset + Math.random() * 50, centerOffset + Math.random() * 50);
    }
}

/**
 * Добавление узла на холст
 */
function addNodeToCanvas(type, title, x, y) {
    const html = createNodeHTML(type, title);
    const inputs = type === 'start' ? 0 : 1;
    const outputs = type === 'end' ? 0 : (type === 'decision' ? 2 : 1);
    
    editor.addNode(
        type,
        inputs,
        outputs,
        x,
        y,
        type,
        {},
        html
    );
}

/**
 * Создание HTML для узла
 */
function createNodeHTML(type, title) {
    const icons = {
        start: '🚀',
        process: '⚙️',
        decision: '❓',
        end: '🏁'
    };
    
    const colors = {
        start: '#4CAF50',
        process: '#2196F3',
        decision: '#FF9800',
        end: '#f44336'
    };
    
    return `
        <div style="width: 100%;">
            <div class="node-header" style="background-color: ${colors[type]}; color: white;">
                ${icons[type]} ${title}
            </div>
            <div class="node-content">
                <p style="font-size: 0.85rem; color: #666;">Тип: ${getTypeName(type)}</p>
            </div>
        </div>
    `;
}

/**
 * Получение названия типа узла
 */
function getTypeName(type) {
    const names = {
        start: 'Старт',
        process: 'Процесс',
        decision: 'Решение',
        end: 'Финиш'
    };
    return names[type] || type;
}

/**
 * Открытие модального окна
 */
function openNodeModal() {
    document.getElementById('node-modal').classList.add('active');
    document.getElementById('node-title').focus();
}

/**
 * Закрытие модального окна
 */
function closeNodeModal() {
    document.getElementById('node-modal').classList.remove('active');
    document.getElementById('node-form').reset();
}

/**
 * Обработка отправки формы создания узла
 */
function handleNodeSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('node-title').value;
    const type = document.getElementById('node-type').value;
    
    if (title && type) {
        addNodeToCanvas(type, title, 150, 150);
        closeNodeModal();
    }
}

/**
 * Обновление панели свойств
 */
function updatePropertiesPanel(nodeId) {
    const node = editor.nodes[nodeId];
    if (!node) {
        clearPropertiesPanel();
        return;
    }
    
    const propertiesContent = document.getElementById('properties-content');
    const nodeType = node.class;
    
    propertiesContent.innerHTML = `
        <div class="property-field">
            <label>ID узла:</label>
            <input type="text" value="${nodeId}" readonly>
        </div>
        <div class="property-field">
            <label>Название:</label>
            <input type="text" id="prop-title" value="${extractTitleFromHTML(node.html)}" 
                   onchange="updateNodeTitle('${nodeId}', this.value)">
        </div>
        <div class="property-field">
            <label>Тип:</label>
            <input type="text" value="${getTypeName(nodeType)}" readonly>
        </div>
        <div class="property-field">
            <label>Описание:</label>
            <textarea id="prop-description" rows="3" placeholder="Добавьте описание узла..."
                      onchange="updateNodeDescription('${nodeId}', this.value)"></textarea>
        </div>
        <div class="property-field">
            <label>Действия:</label>
            <button class="btn btn-danger" onclick="deleteSelectedNode()" style="width: 100%;">
                🗑️ Удалить узел
            </button>
        </div>
    `;
}

/**
 * Извлечение заголовка из HTML узла
 */
function extractTitleFromHTML(html) {
    const match = html.match(/>([^<]+)$/);
    return match ? match[1].trim() : 'Без названия';
}

/**
 * Обновление заголовка узла
 */
function updateNodeTitle(nodeId, newTitle) {
    const node = editor.nodes[nodeId];
    if (node) {
        const type = node.class;
        const newHtml = createNodeHTML(type, newTitle);
        editor.updateNodeDataFromId(nodeId, { html: newHtml });
    }
}

/**
 * Обновление описания узла (в будущем можно добавить хранение мета-данных)
 */
function updateNodeDescription(nodeId, description) {
    console.log(`Описание узла ${nodeId}:`, description);
    // Здесь можно добавить сохранение мета-данных узла
}

/**
 * Очистка панели свойств
 */
function clearPropertiesPanel() {
    document.getElementById('properties-content').innerHTML = `
        <p class="hint">Выберите узел для редактирования свойств</p>
    `;
}

/**
 * Удаление выбранного узла
 */
function deleteSelectedNode() {
    const selectedNode = editor.node_selected;
    if (selectedNode) {
        editor.removeNodeId(selectedNode);
        clearPropertiesPanel();
    } else {
        alert('Сначала выберите узел для удаления');
    }
}

/**
 * Сохранение workflow
 */
function saveWorkflow() {
    const data = editor.export();
    workflowData = data;
    
    // Сохранение в localStorage
    localStorage.setItem('workflowData', JSON.stringify(data));
    
    // Скачивание файла
    downloadJSON(data, 'workflow.json');
    
    console.log('Workflow сохранен:', data);
    alert('✅ Workflow успешно сохранен!');
}

/**
 * Загрузка workflow
 */
function loadWorkflow() {
    // Попытка загрузить из localStorage
    const savedData = localStorage.getItem('workflowData');
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            importWorkflow(data);
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
        }
    } else {
        // Если нет данных в localStorage, предложить загрузить файл
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        importWorkflow(data);
                    } catch (error) {
                        alert('❌ Ошибка при чтении файла: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }
}

/**
 * Импорт workflow в редактор
 */
function importWorkflow(data) {
    editor.clear();
    editor.import(data);
    workflowData = data;
    console.log('Workflow загружен');
    alert('✅ Workflow успешно загружен!');
}

/**
 * Очистка workflow
 */
function clearWorkflow() {
    if (confirm('Вы уверены, что хотите очистить весь workflow?')) {
        editor.clear();
        workflowData = {};
        localStorage.removeItem('workflowData');
        clearPropertiesPanel();
        console.log('Workflow очищен');
    }
}

/**
 * Скачивание JSON файла
 */
function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Настройка горячих клавиш
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Delete или Backspace для удаления узла
        if ((e.key === 'Delete' || e.key === 'Backspace') && editor.node_selected) {
            // Не удалять если фокус в input
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                deleteSelectedNode();
            }
        }
        
        // Ctrl+S для сохранения
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveWorkflow();
        }
        
        // Ctrl+L для загрузки
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            loadWorkflow();
        }
        
        // Escape для закрытия модального окна
        if (e.key === 'Escape') {
            closeNodeModal();
        }
    });
}

// Экспорт функций для использования в HTML
window.deleteSelectedNode = deleteSelectedNode;
window.updateNodeTitle = updateNodeTitle;
window.updateNodeDescription = updateNodeDescription;
