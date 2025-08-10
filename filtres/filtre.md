# Filtres.js

Une classe JavaScript pour gérer des filtres interactifs dans une interface utilisateur.

## Propriétés

- **container** (HTMLElement) : Conteneur HTML où les filtres seront affichés
- **containerWidth** (string) : Largeur du conteneur (défaut: 'auto')
- **containerHeight** (string) : Hauteur du conteneur (défaut: 'auto')
- **data** (Array) : Données à filtrer
- **filters** (Object) : Configuration des filtres
- **selectedValues** (Object) : Valeurs actuellement sélectionnées pour chaque filtre
- **filterFields** (Array) : Liste des champs disponibles pour le filtrage
- **filterLabels** (Object) : Libellés des champs de filtrage

## Méthodes principales

### Gestion des données
- **add_data(data)** : Ajoute des données à filtrer
- **add_filtre(options)** : Ajoute un nouveau filtre
- **add_detected_filters()** : Ajoute automatiquement les filtres détectés dans les données

### Interaction avec les filtres
- **toggleFilterValue(field, value)** : Bascule la sélection d'une valeur de filtre
- **resetFilter(field)** : Réinitialise un filtre spécifique
- **resetAllFilters()** : Réinitialise tous les filtres
- **getSelectedValues()** : Retourne les valeurs sélectionnées
- **setSelectedValues(values)** : Définit les valeurs sélectionnées

### Rendu
- **renderFilter(field)** : Affiche un filtre dans le conteneur
- **renderAllFilters()** : Affiche tous les filtres
- **updateContainerStyle()** : Met à jour le style du conteneur

### Événements
- **onFilterChange(callback)** : Ajoute un callback appelé quand les filtres changent

## Méthodes utilitaires (privées)
- **_detectFilterFields()** : Détecte automatiquement les champs filtrables
- **_defaultFormatter(value)** : Formate les valeurs pour l'affichage
- **_defaultFormatValue(value)** : Formate les valeurs par défaut
- **_defaultFilterFn(item, field, selectedValues)** : Fonction de filtrage par défaut
- **_triggerFilterChange()** : Déclenche les callbacks de changement de filtre

## Utilisation

```javascript
// Initialisation
const filtres = Filtres.add_filtres('#filters-container');

// Ajout de données
filtres.add_data(monTableauDeDonnees);

// Ajout manuel d'un filtre
filtres.add_filtre({
    field: 'categorie',
    label: 'Catégorie',
    formatValue: value => value.toUpperCase()
});

// Écoute des changements
filtres.onFilterChange((selectedValues) => {
    console.log('Filtres mis à jour:', selectedValues);
});