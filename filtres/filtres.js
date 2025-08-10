class Filtres {
    /**
     * Crée une nouvelle instance de Filtres et l'attache au conteneur spécifié
     * @param {string|HTMLElement} container - ID du conteneur ou élément HTML
     * @returns {Filtres} L'instance de Filtres créée
     */
    static add_filtres(container) {
        const instance = new Filtres();
        instance.container = container; // Utilisation directe du setter
        if (!instance.container) {
            throw new Error('Invalid container. Please provide a valid element ID, selector or HTMLElement');
        }
        Filtres.instances = Filtres.instances || [];
        Filtres.instances.push(instance);
        return instance;
    }

    constructor() {
        this._container = null;
        this._containerWidth = 'auto';  // Valeur par défaut
        this._containerHeight = 'auto'; // Valeur par défaut
        this.data = [];
        this.filters = {};
        this.selectedValues = {};
        this.filterFields = [];
        this.filterLabels = {};
        this._filterChangeCallbacks = [];
    }

    // Get the container element
    get container() {
        return this._container || null;
    }
    
    // Get/set container width
    get containerWidth() {
        return this._containerWidth;
    }
    
    set containerWidth(width) {
        this._containerWidth = width;
        this._updateContainerStyle();
    }
    
    // Get/set container height
    get containerHeight() {
        return this._containerHeight;
    }
    
    set containerHeight(height) {
        this._containerHeight = height;
        this._updateContainerStyle();
    }
    
    // Set the container where filters will be rendered
    set container(containerId) {
        if (typeof containerId === 'string') {
            // Support both ID with and without # prefix
            const selector = containerId.startsWith('#') ? containerId : `#${containerId}`;
            this._container = document.querySelector(selector);
            if (!this._container) {
                console.error(`Container with selector '${selector}' not found`);
            } else {
                this._updateContainerStyle();
            }
        } else if (containerId instanceof HTMLElement) {
            this._container = containerId;
            this._updateContainerStyle();
        } else {
            console.error('Invalid container. Please provide a valid element ID or HTMLElement');
        }
    }

    /**
     * Analyse les données pour détecter automatiquement les champs à utiliser comme filtres
     * @private
     */
    _detectFilterFields() {
        if (!this.data.length) return;
        
        // Analyser le premier élément pour déterminer les champs
        const sampleItem = this.data[0];
        const fields = Object.keys(sampleItem);
        
        // Déterminer les champs à utiliser comme filtres
        this.filterFields = fields.filter(field => {
            // Ne garder que les chaînes, nombres ou booléens
            const value = sampleItem[field];
            const type = typeof value;
            return type === 'string' || type === 'number' || type === 'boolean';
        });
        
        // Créer des libellés plus lisibles
        this.filterLabels = this.filterFields.reduce((acc, field) => {
            // Convertir 'nom_du_champ' en 'Nom du champ'
            const label = field
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            acc[field] = label;
            return acc;
        }, {});
    }

    /**
     * Ajoute des données à filtrer
     * @param {Array} data - Tableau d'objets à filtrer
     */
    add_data(data) {
        if (!Array.isArray(data)) {
            console.error('Data must be an array of objects');
            return;
        }
        this.data = [...data];
        
        // Détecter les champs disponibles pour les filtres
        this._detectFilterFields();
        
        // Ne pas ajouter automatiquement les filtres
        // Les filtres doivent être ajoutés manuellement avec add_filtre()
    }
    
    /**
     * Ajoute automatiquement les filtres détectés dans les données
     */
    add_detected_filters() {
        if (!this.filterFields.length) {
            console.warn('No filter fields detected. Call add_data() first.');
            return;
        }
        
        this.filterFields.forEach(field => {
            this.add_filtre({
                field: field,
                label: this.filterLabels[field] || field
            });
        });
    }

    /**
     * Ajoute un filtre pour un champ spécifique
     * @param {string} fieldName - Le nom du champ à filtrer
     * @param {Object} [options] - Options supplémentaires pour le filtre
     * @param {string} [options.label] - Libellé personnalisé pour le filtre
     * @param {Function} [options.format] - Fonction de formatage pour l'affichage des valeurs
     * @returns {Filtres} L'instance courante pour le chaînage
     */
    add_filtre(fieldName, options = {}) {
        // Vérifier si le champ existe dans les données
        if (this.data.length > 0 && !(fieldName in this.data[0])) {
            console.warn(`Le champ '${fieldName}' n'existe pas dans les données.`);
            return this;
        }

        // Vérifier si le filtre existe déjà
        if (this.filters[fieldName]) {
            console.warn(`Un filtre pour le champ '${fieldName}' existe déjà.`);
            return this;
        }

        // Ajouter le champ à la liste des champs de filtre s'il n'y est pas déjà
        if (!this.filterFields.includes(fieldName)) {
            this.filterFields.push(fieldName);
            
            // Créer un libellé par défaut si non fourni
            if (!this.filterLabels[fieldName]) {
                this.filterLabels[fieldName] = fieldName
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
            }
        }

        // Créer le filtre
        this.filters[fieldName] = {
            field: fieldName,
            label: options.label || this.filterLabels[fieldName] || fieldName,
            format: options.format || this._defaultFormatter,
            ...options
        };

        // Initialiser les valeurs sélectionnées pour ce filtre
        if (!this.selectedValues[fieldName]) {
            this.selectedValues[fieldName] = [];
        }

        // Rendu du filtre si le conteneur est défini
        if (this.container) {
            this.renderFilter(fieldName);
        }

        // Déclencher l'événement de changement de filtre
        this._triggerFilterChange();

        return this;
    }

    /**
     * Formateur par défaut pour les valeurs de filtre
     * @private
     */
    _defaultFormatter(value) {
        if (value === null || value === undefined) return 'Non défini';
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        return String(value);
    }

    /**
     * Ajoute un nouveau filtre pour un champ spécifique
     * @param {Object} options - Options du filtre
     * @param {string} options.field - Nom du champ à filtrer
     * @param {string} [options.label] - Libellé à afficher pour ce filtre
     * @param {Function} [options.formatValue] - Fonction pour formater les valeurs du filtre
     * @param {Function} [options.filterFn] - Fonction de filtrage personnalisée
     */
    add_filtre({ field, label = field, formatValue, filterFn,width }) {
        if (!this.data.length) {
            console.error('Please add data before adding filters');
            return;
        }

        // Vérifier que le champ existe dans les données
        if (!this.data[0].hasOwnProperty(field)) {
            console.warn(`Field '${field}' not found in data. Available fields:`, Object.keys(this.data[0]));
            return;
        }

        // Obtenir les valeurs uniques pour ce champ
        const uniqueValues = [...new Set(this.data.map(item => item[field]))]
            .sort((a, b) => {
                // Trier les valeurs de manière logique
                if (typeof a === 'string' && typeof b === 'string') {
                    return a.localeCompare(b);
                }
                return a - b;
            });
        
        // Stocker la configuration du filtre
        this.filters[field] = {
            label,
            values: uniqueValues,
            formatValue: formatValue || this._defaultFormatValue,
            filterFn: filterFn || this._defaultFilterFn,
            width: width || '300px',  // Ajoutez la largeur
        };
        
        // Initialiser les valeurs sélectionnées pour ce filtre
        if (!this.selectedValues[field]) {
            this.selectedValues[field] = [];
        }
        
        // Rendre le filtre si le conteneur est défini
        if (this.container) {
            this.renderFilter(field);
        }
    }
    
    /**
     * Fonction par défaut pour formater les valeurs des filtres
     * @private
     */
    _defaultFormatValue(value) {
        if (value === null || value === undefined) return 'Non défini';
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        return value.toString();
    }
    
    /**
     * Fonction de filtrage par défaut
     * @private
     */
    _defaultFilterFn(item, field, selectedValues) {
        if (!selectedValues.length) return true;
        return selectedValues.includes(item[field]);
    }

    /**
     * Affiche un filtre dans le conteneur
     * @param {string} field - Nom du champ à afficher
     */
    renderFilter(field) {
        if (!this.container) return;

        const filter = this.filters[field];
        if (!filter) {
            console.warn(`Filter '${field}' not found`);
            return;
        }
        
        // Vérifier si le filtre existe déjà
        const existingFilter = this.container.querySelector(`[data-field="${field}"]`);
        if (existingFilter) {
            existingFilter.remove();
        }
        
        // Créer le conteneur du filtre
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        filterContainer.dataset.field = field;
        
        // Appliquer la largeur au conteneur principal
        if (filter.width) {
            filterContainer.style.width = filter.width;
            filterContainer.style.minWidth = filter.width;
            filterContainer.style.maxWidth = filter.width;
        }
        
        // Créer l'en-tête du filtre
        const header = document.createElement('div');
        header.className = 'filter-header';
        
        // Titre du filtre
        const title = document.createElement('h3');
        title.className = 'filter-title';
        title.textContent = filter.label;
        
        // Bouton de réinitialisation
        const resetButton = document.createElement('button');
        resetButton.className = 'filter-reset-btn';
        resetButton.title = 'Réinitialiser ce filtre';
        resetButton.innerHTML = '×';
        resetButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.resetFilter(field);
        });
        
        // Ajouter le titre et le bouton à l'en-tête
        header.appendChild(title);
        header.appendChild(resetButton);
        filterContainer.appendChild(header);
        
        // Créer le conteneur des valeurs
        const valuesContainer = document.createElement('div');
        valuesContainer.className = 'filter-values';
        valuesContainer.style.width = '100%';
        valuesContainer.style.overflowX = 'hidden';
        
        // Ajouter le champ de recherche pour les listes longues
        if (filter.values.length > 3) {
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = `Rechercher dans ${filter.label.toLowerCase()}...`;
            searchInput.className = 'filter-search';
            searchInput.style.width = '100%';
            searchInput.style.boxSizing = 'border-box';
            searchInput.style.padding = '6px 8px';
            searchInput.style.marginBottom = '5px';
            searchInput.style.border = '1px solid #ddd';
            searchInput.style.borderRadius = '4px';
            
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const valueElements = valuesContainer.querySelectorAll('.filter-value');
                valueElements.forEach(el => {
                    const text = el.textContent.toLowerCase();
                    el.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            });
            
            filterContainer.appendChild(searchInput);
        }

        // Ajouter chaque valeur comme un segment sélectionnable
        filter.values.forEach(value => {
            if (value === undefined || value === null) return;
            
            const formattedValue = filter.formatValue ? filter.formatValue(value) : this._defaultFormatValue(value);
            
            const valueElement = document.createElement('button');
            valueElement.className = 'filter-value';
            valueElement.textContent = formattedValue;
            valueElement.dataset.value = value;
            valueElement.title = formattedValue !== value.toString() ? value.toString() : '';
            
            // Marquer comme sélectionné si nécessaire
            if (this.selectedValues[field] && this.selectedValues[field].includes(value)) {
                valueElement.classList.add('selected');
            }
            
            valueElement.addEventListener('click', () => {
                this.toggleFilterValue(field, value);
            });
            
            valuesContainer.appendChild(valueElement);
        });
        
        // Ajouter le conteneur des valeurs d'abord
        filterContainer.appendChild(valuesContainer);
        
        // Ajouter un champ de recherche pour les listes longues
        if (filter.values.length > 5) {
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = `Rechercher dans ${filter.label.toLowerCase()}...`;
            searchInput.className = 'filter-search';
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const valueElements = valuesContainer.querySelectorAll('.filter-value');
                valueElements.forEach(el => {
                    const text = el.textContent.toLowerCase();
                    el.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            });
            // Insérer le champ de recherche avant le conteneur des valeurs
            filterContainer.insertBefore(searchInput, valuesContainer);
        }
        
        // Ajouter le conteneur de filtre au DOM
        if (this.container) {
            this.container.appendChild(filterContainer);
        } else {
            console.error('Cannot render filter: container is not defined');
        }
    }

    // Toggle a filter value selection
    toggleFilterValue(field, value) {
        console.log('toggleFilterValue called with field:', field, 'value:', value);
        
        // S'assurer que le champ existe dans selectedValues
        if (!this.selectedValues[field]) {
            this.selectedValues[field] = [];
        }
        
        const index = this.selectedValues[field].indexOf(value);
        
        if (index === -1) {
            // Add to selection
            this.selectedValues[field].push(value);
            const element = this.container && this.container.querySelector(`[data-field="${field}"] [data-value="${value}"]`);
            if (element) element.classList.add('selected');
        } else {
            // Remove from selection
            this.selectedValues[field].splice(index, 1);
            const element = this.container && this.container.querySelector(`[data-field="${field}"] [data-value="${value}"]`);
            if (element) element.classList.remove('selected');
        }
        
        console.log('Selected values after toggle:', JSON.stringify(this.selectedValues));
        
        // Trigger filtered data update and events
        const filteredData = this.getFilteredData();
        console.log('Filtered data count:', filteredData.length);
        
        // Déclencher manuellement l'événement de changement
        this._triggerFilterChange();
        
        return filteredData;
    }

    /**
     * Obtient les données filtrées en fonction des sélections actuelles
     * @returns {Array} Les données filtrées
     */
    getFilteredData() {
        if (!this.data.length) return [];
        if (!Object.keys(this.filters).length) return this.data;

        return this.data.filter(item => {
            return Object.entries(this.filters).every(([field, filter]) => {
                const selected = this.selectedValues[field] || [];
                
                // Si aucune valeur n'est sélectionnée pour ce filtre, inclure tous les éléments
                if (!selected.length) return true;
                
                // Utiliser la fonction de filtrage personnalisée ou la fonction par défaut
                return filter.filterFn 
                    ? filter.filterFn(item, field, selected, this.selectedValues)
                    : this._defaultFilterFn(item, field, selected);
            });
        });
    }
    
    /**
     * Déclenche un événement personnalisé lorsque les filtres changent
     * @private
     */
    /**
     * Déclenche les événements de changement de filtre
     * @private
     */
    _triggerFilterChange() {
        console.log('_triggerFilterChange called');
        const filteredData = this.getFilteredData();
        
        // Événement personnalisé sur le conteneur
        if (this.container) {
            const event = new CustomEvent('filtres:change', {
                detail: { filteredData, selectedValues: { ...this.selectedValues } }
            });
            console.log('Dispatching filtre:change event on container');
            this.container.dispatchEvent(event);
        } else {
            console.warn('Cannot dispatch filtre:change - container is not defined');
        }
        
        // Événement global sur le document
        const globalEvent = new CustomEvent('filtre_apply', {
            detail: { 
                filteredData,
                selectedValues: { ...this.selectedValues },
                instance: this
            }
        });
        
        console.log('Dispatching filtre_apply event on document');
        document.dispatchEvent(globalEvent);
        
        // Appeler les callbacks enregistrés
        console.log('Calling', this._filterChangeCallbacks.length, 'registered callbacks');
        this._filterChangeCallbacks.forEach((callback, index) => {
            try {
                console.log('Executing callback #' + index);
                callback(filteredData, { ...this.selectedValues }, this);
            } catch (error) {
                console.error('Error in filter change callback #' + index + ':', error);
            }
        });
    }
    
    /**
     * Enregistre un callback à appeler lorsque les filtres changent
     * @param {Function} callback - Fonction à appeler avec (filteredData, selectedValues, instance)
     * @returns {Function} Fonction pour supprimer le listener
     */
    onFilterChange(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        this._filterChangeCallbacks.push(callback);
        
        // Retourne une fonction pour supprimer le callback
        return () => {
            const index = this._filterChangeCallbacks.indexOf(callback);
            if (index !== -1) {
                this._filterChangeCallbacks.splice(index, 1);
            }
        };
    }
    
    /**
     * Réinitialise un filtre spécifique
     * @param {string} field - Le champ du filtre à réinitialiser
     * @returns {Array} Les données filtrées après réinitialisation
     */
    resetFilter(field) {
        if (!field || !this.selectedValues[field]) return this.getFilteredData();
        
        // Réinitialiser les valeurs sélectionnées pour ce filtre
        this.selectedValues[field] = [];
        
        // Mettre à jour l'interface utilisateur
        const filterContainer = this.container.querySelector(`[data-field="${field}"]`);
        if (filterContainer) {
            const valueElements = filterContainer.querySelectorAll('.filter-value');
            valueElements.forEach(el => el.classList.remove('selected'));
            
            // Réinitialiser le champ de recherche s'il existe
            const searchInput = filterContainer.querySelector('.filter-search');
            if (searchInput) {
                searchInput.value = '';
                valueElements.forEach(el => el.style.display = '');
            }
        }
        
        // Déclencher la mise à jour
        this._triggerFilterChange();
        
        // Retourner les données filtrées mises à jour
        return this.getFilteredData();
    }
    
    /**
     * Réinitialise tous les filtres
     * @returns {Array} Les données non filtrées
     */
    resetFilters() {
        Object.keys(this.selectedValues).forEach(field => {
            this.selectedValues[field] = [];
            const filterContainer = this.container.querySelector(`[data-field="${field}"]`);
            if (filterContainer) {
                const valueElements = filterContainer.querySelectorAll('.filter-value');
                valueElements.forEach(el => el.classList.remove('selected'));
                
                // Réinitialiser les champs de recherche
                const searchInput = filterContainer.querySelector('.filter-search');
                if (searchInput) {
                    searchInput.value = '';
                    valueElements.forEach(el => el.style.display = '');
                }
            }
        });
        
        // Déclencher la mise à jour
        this._triggerFilterChange();
        
        return this.getFilteredData();
    }
    
    /**
     * Met à jour le style du conteneur principal
     * @private
     */
    _updateContainerStyle() {
        if (!this.container) return;
        
        // Appliquer la largeur et la hauteur
        if (this.containerWidth !== 'auto') {
            this.container.style.width = typeof this.containerWidth === 'number' 
                ? `${this.containerWidth}px` 
                : this.containerWidth;
        } else {
            this.container.style.width = ''; // Réinitialiser si 'auto'
        }
        
        if (this.containerHeight !== 'auto') {
            this.container.style.height = typeof this.containerHeight === 'number' 
                ? `${this.containerHeight}px` 
                : this.containerHeight;
        } else {
            this.container.style.height = ''; // Réinitialiser si 'auto'
        }
        
        // S'assurer que le conteneur a un display: flex
        this.container.style.display = 'flex';
        this.container.style.flexWrap = 'nowrap';
        this.container.style.overflowX = 'auto';
        this.container.style.gap = '15px';
        this.container.style.alignItems = 'flex-start';
    }
}

// Export for use in browser
typeof module !== 'undefined' && (module.exports = Filtres);