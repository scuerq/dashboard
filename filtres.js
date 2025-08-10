/**
 * Système de Filtres Interactifs
 * Une bibliothèque légère pour ajouter des filtres interactifs à vos applications web
 * 
 * @version 1.0.0
 * @license MIT
 */

class Filtres {
    constructor() {
        this.container = null;
        this.filtres = [];
        this.data = [];
        this.filtresActifs = {};
        this.on_filtre = null;
    }

    /**
     * Initialise le conteneur des filtres
     * @param {HTMLElement} container - L'élément DOM qui contiendra les filtres
     */
    add_filtres(container) {
        if (!container || !(container instanceof HTMLElement)) {
            console.error('Un conteneur valide est requis');
            return;
        }

        this.container = container;
        this.container.classList.add('filtres-container');
    }

    /**
     * Ajoute des données à filtrer
     * @param {Array|Object} data - Les données à filtrer (peut être un tableau d'opérations ou un objet avec une propriété operations)
     */
    add_data(data) {
        if (!data) {
            console.error('Aucune donnée fournie');
            return;
        }

        // Si c'est un objet avec une propriété operations (comme bdd.operations)
        if (data.operations && Array.isArray(data.operations)) {
            this.data = data.operations.map(op => ({
                ...op.identif?.[0] || {},
                ...op.synthese?.[0] || {}
            }));
        } 
        // Si c'est un tableau d'opérations
        else if (Array.isArray(data)) {
            this.data = data.map(op => ({
                ...op.identif?.[0] || {},
                ...op.synthese?.[0] || {},
                ...op // Conserver les autres propriétés au cas où
            }));
        } 
        // Si c'est un objet simple
        else if (typeof data === 'object') {
            this.data = [{
                ...data.identif?.[0] || {},
                ...data.synthese?.[0] || {},
                ...data // Conserver les autres propriétés
            }];
        } else {
            console.error('Format de données non supporté');
            return;
        }

        this.mettreAJourFiltres();
    }

    /**
     * Trouve récursivement toutes les valeurs d'un champ dans un objet
     * @param {Object} obj - L'objet dans lequel chercher
     * @param {string} champRecherche - Le nom du champ à rechercher (peut être partiel)
     * @param {Set} valeurs - Ensemble pour stocker les valeurs uniques trouvées
     * @param {string} [cheminActuel=''] - Chemin d'accès actuel (pour la récursion)
     */
    trouverValeursChamp(obj, champRecherche, valeurs = new Set(), cheminActuel = '') {
        if (!obj || typeof obj !== 'object') return;
        
        // Vérifier si l'objet courant a le champ recherché
        for (const [cle, valeur] of Object.entries(obj)) {
            const cheminComplet = cheminActuel ? `${cheminActuel}.${cle}` : cle;
            
            // Si le nom du champ correspond (en minuscules pour la recherche insensible à la casse)
            if (cle.toLowerCase().includes(champRecherche.toLowerCase())) {
                if (valeur !== undefined && valeur !== null && valeur !== '') {
                    valeurs.add(String(valeur));
                }
            }
            
            // Si la valeur est un objet ou un tableau, on continue la recherche récursive
            if (valeur && typeof valeur === 'object') {
                this.trouverValeursChamp(valeur, champRecherche, valeurs, cheminComplet);
            }
        }
        
        return valeurs;
    }

    /**
     * Ajoute un nouveau filtre qui recherche récursivement les champs correspondants
     * @param {string} motifChamp - Le motif à rechercher dans les noms de champs
     * @param {string} nomDuFiltre - Le nom affiché pour le filtre
     * @param {Object} options - Options de configuration
     * @param {string} [options.largeur='auto'] - Largeur du filtre ('auto' ou valeur en px/em/rem)
     * @param {boolean} [options.recherche=false] - Active la recherche dans le filtre
     * @param {boolean} [options.multiple=true] - Permet la sélection multiple
     */
    add_filtre(motifChamp, nomDuFiltre, options = {}) {
        if (!motifChamp || !nomDuFiltre) {
            console.error('Le motif de champ et le nom du filtre sont obligatoires');
            return;
        }

        const config = {
            id: this.genererIdUnique(),
            champ: motifChamp, // On stocke le motif de recherche
            nom: nomDuFiltre,
            largeur: options.largeur || '250px', 
            recherche: options.recherche !== false, // true par défaut
            multiple: options.multiple !== false, // true par défaut
            valeursUniques: new Set()
        };

        this.filtres.push(config);
        this.filtresActifs[config.id] = new Set();

        this.creerFiltreUI(config);
        this.mettreAJourValeursUniques();
    }

    /**
     * Retourne les valeurs sélectionnées pour chaque filtre
     * @returns {Object} Un objet avec les filtres et leurs valeurs sélectionnées
     */
    getSelected() {
        const resultat = {};
        
        this.filtres.forEach(filtre => {
            const valeurs = Array.from(this.filtresActifs[filtre.id] || []);
            resultat[filtre.champ] = filtre.multiple ? valeurs : valeurs[0] || null;
        });
        
        return resultat;
    }

    // Méthodes internes

    genererIdUnique() {
        return 'filtre_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Vérifie si un objet correspond aux critères de filtrage
     * @param {Object} item - L'élément à vérifier
     * @param {string} motifChamp - Le motif à rechercher dans les noms de champs
     * @param {Set} valeursCibles - Les valeurs à rechercher
     * @returns {boolean} - True si l'objet correspond aux critères
     */
    correspondAuFiltre(item, motifChamp, valeursCibles) {
        const valeursTrouvees = this.trouverValeursChamp(item, motifChamp);
        if (!valeursTrouvees || valeursTrouvees.size === 0) return false;
        
        // Vérifier si au moins une des valeurs trouvées est dans les valeurs cibles
        return Array.from(valeursTrouvees).some(v => valeursCibles.has(v));
    }

    mettreAJourValeursUniques() {
        if (this.data.length === 0) return;

        this.filtres.forEach(filtre => {
            const valeurs = new Set();
            
            // Pour chaque élément de données, on recherche récursivement les champs correspondants
            this.data.forEach(item => {
                const valeursTrouvees = this.trouverValeursChamp(item, filtre.champ);
                if (valeursTrouvees) {
                    valeursTrouvees.forEach(v => valeurs.add(v));
                }
            });
            
            // Mettre à jour les valeurs uniques du filtre
            filtre.valeursUniques = new Set([...valeurs].sort());
            this.mettreAJourFiltreUI(filtre);
        });
    }

    mettreAJourFiltres() {
        if (this.data.length === 0) return;
        this.mettreAJourValeursUniques();
    }

    creerFiltreUI(filtre) {
        if (!this.container) return;

        const filtreElement = document.createElement('div');
        filtreElement.className = 'filtre';
        filtreElement.style.width = filtre.largeur === 'auto' ? 'auto' : `${filtre.largeur}px`;
        filtreElement.dataset.filtreId = filtre.id;

        // En-tête du filtre
        const header = document.createElement('div');
        header.className = 'filtre-header';
        
        const titre = document.createElement('h3');
        titre.className = 'filtre-titre';
        titre.textContent = filtre.nom;
        
        const badge = document.createElement('span');
        badge.className = 'filtre-badge';
        badge.textContent = '0';
        
        header.appendChild(titre);
        header.appendChild(badge);
        
        // Contenu du filtre
        const contenu = document.createElement('div');
        contenu.className = 'filtre-contenu';
        
        // Zone de recherche si activée
        if (filtre.recherche) {
            const recherche = document.createElement('input');
            recherche.type = 'text';
            recherche.className = 'filtre-recherche';
            recherche.placeholder = 'Rechercher...';
            recherche.addEventListener('input', (e) => {
                this.filtrerValeurs(filtre, e.target.value.toLowerCase());
            });
            contenu.appendChild(recherche);
        }
        
        // Liste des valeurs
        const liste = document.createElement('ul');
        liste.className = 'filtre-liste';
        contenu.appendChild(liste);
        
        // Actions du filtre
        const actions = document.createElement('div');
        actions.className = 'filtre-actions';
        
        const btnEffacer = document.createElement('button');
        btnEffacer.className = 'filtre-btn';
        btnEffacer.textContent = 'Effacer';
        btnEffacer.addEventListener('click', () => this.effacerFiltre(filtre));
        
        const btnFermer = document.createElement('button');
        btnFermer.className = 'filtre-btn';
        btnFermer.textContent = 'Fermer';
        btnFermer.addEventListener('click', () => this.basculerFiltre(filtreElement));
        
        actions.appendChild(btnEffacer);
        actions.appendChild(btnFermer);
        
        // Assemblage des éléments
        filtreElement.appendChild(header);
        filtreElement.appendChild(contenu);
        filtreElement.appendChild(actions);
        
        // Gestionnaire d'événements pour l'en-tête
        header.addEventListener('click', () => this.basculerFiltre(filtreElement));
        
        // Ajout au DOM
        this.container.appendChild(filtreElement);
        
        // Mise à jour initiale
        this.mettreAJourFiltreUI(filtre);
    }

    mettreAJourFiltreUI(filtre) {
        const filtreElement = this.container.querySelector(`[data-filtre-id="${filtre.id}"]`);
        if (!filtreElement) return;
        
        const liste = filtreElement.querySelector('.filtre-liste');
        if (!liste) return;
        
        // Vider la liste actuelle
        liste.innerHTML = '';
        
        // Ajouter les valeurs uniques
        const valeursTriees = Array.from(filtre.valeursUniques).sort();
        
        valeursTriees.forEach(valeur => {
            const item = document.createElement('li');
            item.className = 'filtre-item';
            item.textContent = valeur;
            
            if (this.filtresActifs[filtre.id] && this.filtresActifs[filtre.id].has(valeur)) {
                item.classList.add('filtre-item-selectionne');
            }
            
            item.addEventListener('click', () => this.basculerSelection(filtre, valeur, item));
            liste.appendChild(item);
        });
        
        // Mettre à jour le badge
        const badge = filtreElement.querySelector('.filtre-badge');
        if (badge) {
            const nbSelectionnes = this.filtresActifs[filtre.id] ? this.filtresActifs[filtre.id].size : 0;
            badge.textContent = nbSelectionnes;
            
            // Mettre à jour l'état actif du filtre
            if (nbSelectionnes > 0) {
                filtreElement.classList.add('filtre-actif');
            } else {
                filtreElement.classList.remove('filtre-actif');
            }
        }
    }

    basculerFiltre(element) {
        element.classList.toggle('filtre-ouvert');
    }

    basculerSelection(filtre, valeur, element) {
        if (!this.filtresActifs[filtre.id]) {
            this.filtresActifs[filtre.id] = new Set();
        }
        
        if (this.filtresActifs[filtre.id].has(valeur)) {
            this.filtresActifs[filtre.id].delete(valeur);
            element.classList.remove('filtre-item-selectionne');
        } else {
            if (!filtre.multiple) {
                this.filtresActifs[filtre.id].clear();
                const items = element.parentElement.querySelectorAll('.filtre-item-selectionne');
                items.forEach(item => item.classList.remove('filtre-item-selectionne'));
            }
            this.filtresActifs[filtre.id].add(valeur);
            element.classList.add('filtre-item-selectionne');
        }
        
        // Mettre à jour l'UI
        this.mettreAJourFiltreUI(filtre);
        
        // Déclencher l'événement de filtrage
        if (typeof this.on_filtre === 'function') {
            this.on_filtre(this.getSelected());
        }
    }

    effacerFiltre(filtre) {
        if (this.filtresActifs[filtre.id]) {
            this.filtresActifs[filtre.id].clear();
            this.mettreAJourFiltreUI(filtre);
            
            // Déclencher l'événement de filtrage
            if (typeof this.on_filtre === 'function') {
                this.on_filtre(this.getSelected());
            }
        }
    }

    filtrerValeurs(filtre, terme) {
        const filtreElement = this.container.querySelector(`[data-filtre-id="${filtre.id}"]`);
        if (!filtreElement) return;
        
        const items = filtreElement.querySelectorAll('.filtre-item');
        items.forEach(item => {
            const texte = item.textContent.toLowerCase();
            item.style.display = texte.includes(terme) ? '' : 'none';
        });
    }
    
    /**
     * Filtre les données en fonction des sélections actuelles
     * @returns {Array} - Les données filtrées
     */
    filtrerDonnees() {
        if (this.data.length === 0) return [];
        
        // Si aucun filtre actif, retourner toutes les données
        const filtresActifs = Object.entries(this.filtresActifs)
            .filter(([_, valeurs]) => valeurs && valeurs.size > 0);
            
        if (filtresActifs.length === 0) return [...this.data];
        
        // Filtrer les données en fonction des sélections
        return this.data.filter(item => {
            return filtresActifs.every(([filtreId, valeurs]) => {
                const filtre = this.filtres.find(f => f.id === filtreId);
                if (!filtre) return true;
                
                // Vérifier si l'item correspond au filtre
                return this.correspondAuFiltre(item, filtre.champ, valeurs);
            });
        });
    }
}

// Exporter pour les environnements qui le supportent (Node.js, modules ES6)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Filtres;
}

// Exposer au scope global pour une utilisation directe dans le navigateur
if (typeof window !== 'undefined') {
    window.Filtres = Filtres;
}
