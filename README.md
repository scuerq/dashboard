Cr# Système de Filtres Interactifs

Une bibliothèque JavaScript légère pour ajouter des filtres interactifs à vos tableaux de bord et applications web.

## 📚 Installation

1. **Télécharger les fichiers**
   - `filtres.js` - La bibliothèque principale
   - `filtres.css` - Les styles de base

2. **Inclure dans votre page HTML**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <link rel="stylesheet" href="chemin/vers/filtres.css">
   </head>
   <body>
       <div id="mes-filtres"></div>
       
       <script src="chemin/vers/filtres.js"></script>
       <script>
           // Initialisation des filtres
           const filtres = new Filtres();
           filtres.add_filtres(document.getElementById('mes-filtres'));
       </script>
   </body>
   </html>
   ```

## 🎯 Fonctionnalités

- Interface utilisateur intuitive inspirée des segments Excel
- Filtrage en temps réel
- Support de la sélection multiple
- Mise en surbrillance des valeurs disponibles
- Recherche intégrée dans les filtres
- Événements personnalisables

## 🛠️ API

### Initialisation
```javascript
const filtres = new Filtres();
filtres.add_filtres(container);
```

### Méthodes

#### `add_data(data)`
Ajoute les données à filtrer.

**Paramètres :**
- `data` (Array|Object) - Données à filtrer

#### `add_filtre(nom_du_champ, nom_du_filtre, options)`
Ajoute un nouveau filtre.

**Paramètres :**
- `nom_du_champ` (String) - Chemin vers la propriété dans les données (ex: `data.identif[0].id`)
- `nom_du_filtre` (String) - Nom affiché pour le filtre
- `options` (Object) - Options de configuration
  - `largeur` (String) - Largeur du filtre (`'auto'` ou valeur en px/em/rem)
  - `recherche` (Boolean) - Active la recherche dans le filtre (défaut: `false`)
  - `multiple` (Boolean) - Permet la sélection multiple (défaut: `true`)

#### `getSelected()`
Retourne les valeurs sélectionnées pour chaque filtre.

**Retourne :**
- `Object` - Un objet avec les filtres et leurs valeurs sélectionnées

### Événements

#### `on_filtre`
Déclenché lorsque les filtres sont modifiés.

**Exemple :**
```javascript
filtres.on_filtre = function(filtres_actifs) {
    console.log('Filtres actifs :', filtres_actifs);
};
```

## 🎨 Personnalisation

Vous pouvez personnaliser l'apparence en surchargeant les classes CSS dans `filtres.css`.

## 📦 Dépendances

Aucune dépendance externe requise.

## 🌟 Fonctionnalités Avancées

- Mise à jour dynamique des filtres disponibles en fonction des sélections
- Support des thèmes sombre/clair
- Interface accessible (ARIA)
- Performances optimisées pour les grands jeux de données

## 📝 Licence

MIT © CDC Habitat

---

<div align="center">
  <p>Développé avec ❤️ par l'équipe CDC Habitat</p>
</div>