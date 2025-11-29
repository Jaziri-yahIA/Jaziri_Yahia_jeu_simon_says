// === ÉLÉMENTS DU DOM ===
const boutonsCouleur = document.querySelectorAll('.bouton-couleur');
const boutonDemarrer = document.getElementById('bouton-demarrer');
const boutonPause = document.getElementById('bouton-pause');
const boutonReinitialiser = document.getElementById('bouton-reinitialiser');
const scoreActuelEl = document.getElementById('score-actuel');
const meilleurScoreEl = document.getElementById('meilleur-score');
const niveauEl = document.getElementById('niveau');
const badgeNiveau = document.getElementById('badge-niveau');
const messageEl = document.getElementById('message');

// === VARIABLES DU JEU ===
let sequence = [];
let sequenceJoueur = [];
let niveau = 1;
let scoreActuel = 0;
let meilleurScore = Number(localStorage.getItem('simonMeilleurScore')) || 0;
let tourJoueur = false;
let jeuDemarre = false;
let jeuEnPause = false;

// === TIMEOUT D'INACTIVITÉ ===
let timeoutInactivite;
const delaiInactivite = 10000; // 10 secondes

// === FONCTION SLEEP POUR ASYNC/AWAIT ===
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// === GESTION DU TIMEOUT ===
function demarrerTimeoutInactivite() {
    arreterTimeoutInactivite();
    timeoutInactivite = setTimeout(() => {
        if (tourJoueur && jeuDemarre && !jeuEnPause) {
            afficherMessage("⏰ Temps écoulé ! Trop lent...");
            finPartie();
        }
    }, delaiInactivite);
}

function arreterTimeoutInactivite() {
    if (timeoutInactivite) {
        clearTimeout(timeoutInactivite);
    }
}

// === INITIALISATION ===
function initialiserJeu() {
    meilleurScoreEl.textContent = meilleurScore;
    boutonReinitialiser.disabled = true;
    boutonPause.disabled = true;

    configurerEvenements();
    mettreAJourBadgeNiveau();
}

function configurerEvenements() {
    boutonsCouleur.forEach(bouton => {
        bouton.addEventListener('click', gererClicCouleur);
    });

    boutonDemarrer.addEventListener('click', demarrerJeu);
    boutonPause.addEventListener('click', basculerPause);
    boutonReinitialiser.addEventListener('click', reinitialiserJeu);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && jeuDemarre) {
            basculerPause();
        }
    });
}

// === DÉMARRAGE DU JEU ===
function demarrerJeu() {
    if (jeuDemarre) return;

    sequence = [];
    sequenceJoueur = [];
    niveau = 1;
    scoreActuel = 0;

    mettreAJourInterface();
    boutonDemarrer.disabled = true;
    boutonReinitialiser.disabled = false;
    boutonPause.disabled = false;

    jeuDemarre = true;
    afficherMessage("Simon prépare la séquence...");

    preparerNiveauSuivant();
}

// === PRÉPARATION D'UN NOUVEAU NIVEAU ===
function preparerNiveauSuivant() {
    sequenceJoueur = [];
    tourJoueur = false;
    arreterTimeoutInactivite();

    const couleurs = ['rouge', 'bleu', 'vert', 'jaune'];
    let nombreNouvellesCouleurs = 1;

    if (niveau >= 11) nombreNouvellesCouleurs = 3;
    else if (niveau >= 6) nombreNouvellesCouleurs = 2;

    for (let i = 0; i < nombreNouvellesCouleurs; i++) {
        const couleurAleatoire = couleurs[Math.floor(Math.random() * couleurs.length)];
        sequence.push(couleurAleatoire);
    }

    mettreAJourBadgeNiveau();
    afficherSequence();
}

// === AFFICHAGE DE LA SÉQUENCE AVEC ASYNC/AWAIT ===
async function afficherSequence() {
    /**
     * Nouvelle version utilisant async/await au lieu de setInterval
     * Plus lisible et plus facile à contrôler
     */
    const vitesseAffichage = Math.max(300, 800 - (niveau * 30));

    for (let i = 0; i < sequence.length; i++) {
        // Gestion de la pause
        while (jeuEnPause) {
            await sleep(100); // Attend 100ms et vérifie à nouveau
        }

        const couleur = sequence[i];
        activerBoutonAvecEffets(couleur);
        
        // Attend la durée définie avant de passer à la couleur suivante
        await sleep(vitesseAffichage);
    }

    // Après avoir affiché toute la séquence
    tourJoueur = true;
    afficherMessage("À votre tour !");
    demarrerTimeoutInactivite();
}

function activerBoutonAvecEffets(couleur) {
    const bouton = document.getElementById(couleur);
    if (!bouton) return;

    bouton.classList.add('active');

    setTimeout(() => {
        bouton.classList.remove('active');
    }, 400);
}

// === GESTION DES INTERACTIONS ===
function gererClicCouleur(e) {
    if (!tourJoueur || !jeuDemarre || jeuEnPause) return;

    const couleur = e.target.id;
    if (!couleur) return;

    sequenceJoueur.push(couleur);
    demarrerTimeoutInactivite();
    activerBoutonAvecEffets(couleur);
    verifierSequenceJoueur();
}

function verifierSequenceJoueur() {
    const indexActuel = sequenceJoueur.length - 1;

    // Vérifie si la couleur cliquée correspond à la séquence
    if (sequenceJoueur[indexActuel] !== sequence[indexActuel]) {
        finPartie();
        return;
    }

    // Vérifie si le joueur a reproduit toute la séquence
    if (sequenceJoueur.length === sequence.length) {
        niveauReussi();
    }
}

// === GESTION DE LA RÉUSSITE ===
function niveauReussi() {
    const pointsBase = 10;
    const bonusNiveau = Math.floor(niveau / 3) * 5;
    scoreActuel += pointsBase + bonusNiveau;

    scoreActuelEl.textContent = scoreActuel;
    niveau++;

    afficherMessage(`Niveau ${niveau - 1} réussi ! +${pointsBase + bonusNiveau} points`);
    messageEl.classList.add('pulse');

    setTimeout(() => {
        messageEl.classList.remove('pulse');
        mettreAJourInterface();
        preparerNiveauSuivant();
    }, 1500);
}

// === GESTION DE L'ÉCHEC ===
function finPartie() {
    jeuDemarre = false;
    tourJoueur = false;
    arreterTimeoutInactivite();

    afficherMessage("Erreur ! Séquence incorrecte.");
    messageEl.classList.add('shake');

    if (scoreActuel > meilleurScore) {
        meilleurScore = scoreActuel;
        localStorage.setItem('simonMeilleurScore', meilleurScore);
        afficherMessage("Game Over ! Nouveau meilleur score !");
        meilleurScoreEl.textContent = meilleurScore;
    }

    setTimeout(() => {
        messageEl.classList.remove('shake');
        boutonDemarrer.disabled = false;
        boutonDemarrer.textContent = "REJOUER";
        boutonPause.disabled = true;
    }, 1000);
}

// === SYSTÈME DE PAUSE ===
function basculerPause() {
    if (!jeuDemarre) return;

    jeuEnPause = !jeuEnPause;

    if (jeuEnPause) {
        arreterTimeoutInactivite();
        afficherMessage("Jeu en pause");
        boutonPause.textContent = "REPRENDRE";
    } else {
        afficherMessage(tourJoueur ? "À votre tour !" : "Regardez la séquence...");
        boutonPause.textContent = "PAUSE";
        if (tourJoueur) {
            demarrerTimeoutInactivite();
        }
    }
}

// === FONCTIONS D'INTERFACE ===
function afficherMessage(texte) {
    messageEl.textContent = texte;
}

function mettreAJourInterface() {
    scoreActuelEl.textContent = scoreActuel;
    niveauEl.textContent = niveau;
    badgeNiveau.textContent = niveau;
    mettreAJourBadgeNiveau();
}

function mettreAJourBadgeNiveau() {
    const couleursNiveaux = {
        1: '#e74c3c',
        5: '#3498db',
        10: '#2ecc71',
        15: '#f39c12'
    };

    let couleur = '#e74c3c';
    for (const lvl in couleursNiveaux) {
        if (niveau >= Number(lvl)) {
            couleur = couleursNiveaux[lvl];
        }
    }

    badgeNiveau.style.background = couleur;
}

// === RÉINITIALISATION ===
function reinitialiserJeu() {
    jeuDemarre = false;
    jeuEnPause = false;
    sequence = [];
    sequenceJoueur = [];
    niveau = 1;
    scoreActuel = 0;
    arreterTimeoutInactivite();
    
    mettreAJourInterface();
    afficherMessage("Prêt à jouer ? Appuyez sur DÉMARRER");
    boutonDemarrer.disabled = false;
    boutonDemarrer.textContent = "DÉMARRER";
    boutonReinitialiser.disabled = true;
    boutonPause.disabled = true;
    boutonPause.textContent = "PAUSE";
}

// === DÉMARRAGE ===
window.addEventListener('load', initialiserJeu);