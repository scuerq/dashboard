# Cahier des charges – Bibliothèque JavaScript de Dashboard

## 1. Contexte général

### Finalité
Développer une **bibliothèque JavaScript/CSS** réutilisable de type `vendors/dashboard`, intégrable dans une page HTML via :
```html
<script src="/vendors/dashboard/dashboard.js"></script>
<link rel="stylesheet" href="/vendors/dashboard/dashboard.css">
```
L'objectif est de générer dynamiquement un tableau de bord interactif à partir d’un fichier JSON structuré comme une base de données.

### Public cible
Développeurs ou intégrateurs web cherchant à intégrer facilement des composants de type dashboard dans une application HTML statique.

### Problématique adressée
Fournir une solution simple, modulaire et autonome pour manipuler des données (type `bdd.json`) et générer :
- Filtres et recherches dynamiques
- Tableaux croisés dynamiques
- Graphiques configurables
- Champs calculés et agrégats

---

## 2. Fonctionnalités principales

### 2.1. `add_filtres()` / `add_recherche()`
- Filtres sur champs du JSON ou formules personnalisées.
- Recherche textuelle avec autocomplétion.
- Composants liés dynamiquement aux tableaux et graphiques.

### 2.2. `add_tableaux()`
- Support des listings simples et tableaux croisés dynamiques.
- Mesures disponibles : `sum`, `count`, `count distinct`, `avg`, `sum distinct`, `min`, `max`, `median`, `écart type`.
- Champs calculés (formules entre colonnes, conditionnelles, etc.).
- Totaux intelligents (ex : `Prix = sum(Total) / sum(Surface)`).
- Tri, export Excel, sous-totaux.

### 2.3. `add_graphique()`
- Types supportés : barres, lignes, camemberts, nuages de points, multi-séries.
- Champs `x`, `y`, agrégations et groupBy visuels.
- Pas d’interaction directe, mais mise à jour automatique via les filtres.
- Légendes et titres configurables.

---

## 3. Sources de données

- Un seul fichier JSON structuré : `identif`, `synthese`, `prp`, `loyer`, `financements`.
- Les blocs sont liés par des clés (`id`, `clef`) comme dans QlikView / PowerPivot.
- Fusion des blocs pour permettre des champs calculés croisés.
- Détection automatique des champs et types.
- Mise à jour à chaud non prioritaire pour la V1.

---

## 4. Interfaces attendues

- Instanciation via :
```js
const dash = new Dashboard('#dashboard', options);
```
- Création automatique de la structure :
```html
<div class="dashboard">
  <div class="dashboard-filtres"></div>
  <div class="dashboard-tableaux"></div>
  <div class="dashboard-graphiques"></div>
</div>
```
- CSS : `dashboard.css` pour la mise en forme par défaut.
- Intégration Bootstrap 5+.

---

## 5. Accès & sécurité

Sans objet.

---

## 6. Contraintes techniques

### Langages
- JavaScript pur (ES6+), CSS.
- Intégration HTML directe via `<script>`.

### Bibliothèques externes (liste ouverte)
- `Tabulator.js` / `DataTables.js` (tableaux)
- `Chart.js` / `Plotly.js` (graphiques)
- `Lodash.js` (calculs)
- `Bootstrap 5+` (UI)
- Toutes les dépendances doivent être listées dans `README.md`.

---

## 7. Livrables attendus

- `dashboard.js`
- `dashboard.css`
- `README.md` : installation, API publique, dépendances
- `index.html` : exemple d’intégration
- `data.json` : échantillon de données basé sur `bdd.json`
- Code commenté, structuré (ex : `/src`, `/dist`)