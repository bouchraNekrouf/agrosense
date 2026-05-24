# 🌱 Agrosence — Guide de Démarrage du Projet

> **Pour mon équipe :** Suivez ces étapes dans l'ordre pour lancer le projet correctement sur votre machine.

---

## 📋 Ce dont vous avez besoin (Prérequis)

Avant de commencer, téléchargez et installez les programmes suivants :

| Programme | Lien de téléchargement | Version recommandée |
|-----------|------------------------|---------------------|
| **Node.js** | https://nodejs.org/en/download | v18 ou plus |
| **Python** | https://www.python.org/downloads/ | v3.10 ou plus |
| **Visual Studio Code** *(optionnel)* | https://code.visualstudio.com/ | Dernière version |

> ✅ Pour vérifier si Node.js est déjà installé, ouvrez un terminal et tapez :
> ```
> node --version
> ```
> Si vous voyez un numéro de version, c'est bon !

---

## 📁 Étape 1 — Extraire le projet

1. Faites un clic droit sur le fichier `.zip` reçu
2. Choisissez **"Extraire tout"** (ou utilisez WinRAR / 7-Zip)
3. Choisissez un emplacement facile à trouver (exemple : `Bureau\agrosence`)

---

## ⚙️ Étape 2 — Installer les dépendances Node.js

1. Ouvrez le dossier extrait `templateRose`
2. Dans la barre d'adresse de l'explorateur Windows, écrivez `cmd` et appuyez sur **Entrée**
   - Ou ouvrez **PowerShell** / **Terminal** dans ce dossier
3. Tapez la commande suivante et attendez qu'elle se termine :

```bash
npm install
```

> ⏳ Cela peut prendre **1 à 2 minutes** selon votre connexion internet.

---

## 🐍 Étape 3 — Installer les dépendances Python (ML Backend)

1. Dans le même terminal, allez dans le dossier `ml_backend` :

```bash
cd ml_backend
```

2. Installez les bibliothèques Python nécessaires :

```bash
pip install flask flask-cors joblib pandas numpy scikit-learn
```

> ⚠️ Si `pip` n'est pas reconnu, essayez `pip3` à la place.

3. Revenez au dossier principal :

```bash
cd ..
```

---

## 🚀 Étape 4 — Lancer le projet

Vous devez lancer **deux serveurs en même temps**. Utilisez **deux fenêtres de terminal séparées**.

### 🖥️ Terminal 1 — Serveur principal (Node.js)

Dans le dossier `templateRose`, tapez :

```bash
npm start
```

Vous devriez voir :
```
🚀 Le serveur (Socket.io prêt) tourne sur : http://localhost:3000
☁️ Connecté à la base de données MongoDB Atlas (Stable) avec succès!
```

### 🐍 Terminal 2 — Serveur IA / ML (Python)

Ouvrez une **nouvelle** fenêtre de terminal dans `templateRose`, puis tapez :

```bash
cd ml_backend
python app.py
```

Vous devriez voir :
```
 * Running on http://127.0.0.1:5000
```

---

## 🌐 Étape 5 — Ouvrir l'application

Une fois les deux serveurs lancés, ouvrez votre navigateur et allez sur :

```
http://localhost:3000
```

✅ Vous devriez voir la page d'accueil du projet **Agrosence** !

---

## 👥 Comptes de test (déjà dans la base de données)

La base de données MongoDB est partagée (hébergée sur Atlas Cloud), vous avez donc accès aux comptes existants :

| Rôle | Nom d'utilisateur | Mot de passe |
|------|-------------------|--------------|
| **Expert** | Nekrouf Bouchra | *(le même que vous avez) * |
| **Agriculteur** | *(compte agriculteur)* | *(le même que vous avez)* |

> 📌 Ou créez simplement un nouveau compte depuis la page d'inscription.

---

## 🗂️ Structure du projet (Rappel)

```
templateRose/
├── server.js              ← Point d'entrée du serveur Node.js
├── package.json           ← Liste des dépendances Node
├── index.html             ← Page d'accueil
├── models/                ← Schémas MongoDB (User, Product, Order, Message)
├── controllers/           ← Logique métier (auth, user, order, product...)
├── routes/                ← Définition des routes API
├── config/db.js           ← Connexion MongoDB Atlas
├── middleware/            ← Authentification JWT
├── ml_backend/            ← Serveur Python Flask (IA agricole)
│   └── app.py             ← Lancer avec : python app.py
└── apres-inscription/     ← Pages HTML (expert, agriculteur...)
    ├── expertt/           ← Espace expert (boutique, stats, commandes...)
    └── agriculteur/       ← Espace agriculteur (boutique, commandes...)
```

---

## ❓ Problèmes fréquents

### ❌ `npm install` échoue
→ Assurez-vous que Node.js est bien installé. Tapez `node --version` pour vérifier.

### ❌ `Cannot connect to MongoDB`
→ Vérifiez votre connexion internet. Le projet utilise MongoDB Atlas (cloud), une connexion internet est **obligatoire**.

### ❌ `python app.py` ne fonctionne pas
→ Assurez-vous que Python est installé et que vous êtes bien dans le dossier `ml_backend`.
→ Essayez `python3 app.py` si `python` ne fonctionne pas.

### ❌ Port 3000 déjà utilisé
→ Redémarrez votre ordinateur ou fermez toute application utilisant le port 3000.

### ❌ `pip` n'est pas reconnu
→ Lors de l'installation de Python, assurez-vous d'avoir coché ✅ **"Add Python to PATH"**.

---

## 📞 Contact

En cas de problème, contactez l'équipe de développement.

---

*Document généré automatiquement — Projet Agrosence 🌱*
