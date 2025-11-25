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

// ========================
let timeoutInactivite;
const delaiInactivite = 10000; // 10 secondes

function demarrerTimeoutInactivite() {
    /**
     * Si le joueur reste inactif trop longtemps, il perd le niveau
     */
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
// =======================================


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

function preparerNiveauSuivant() {
    sequenceJoueur = [];
    tourJoueur = false;
    arreterTimeoutInactivite(); //  Arrêt du timeout

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

function afficherSequence() {
    let index = 0;
    const vitesseAffichage = Math.max(300, 800 - (niveau * 30));

    const interval = setInterval(() => {
        if (index >= sequence.length || jeuEnPause) {
            if (index >= sequence.length) {
                clearInterval(interval);
                tourJoueur = true;
                afficherMessage("À votre tour !");
                demarrerTimeoutInactivite(); //  Démarre timeout
            }
            return;
        }

        const couleur = sequence[index];
        activerBoutonAvecEffets(couleur);
        index++;
    }, vitesseAffichage);
}

function activerBoutonAvecEffets(couleur) {
    const bouton = document.getElementById(couleur);
    if (!bouton) return;

    bouton.classList.add('active');

    setTimeout(() => {
        bouton.classList.remove('active');
    }, 400);
}

function gererClicCouleur(e) {
    if (!tourJoueur || !jeuDemarre || jeuEnPause) return;

    const couleur = e.target.id;
    if (!couleur) return;

    sequenceJoueur.push(couleur);
    
    demarrerTimeoutInactivite(); //  Reset à chaque action
    
    activerBoutonAvecEffets(couleur);
    verifierSequenceJoueur();
}

function verifierSequenceJoueur() {
    const indexActuel = sequenceJoueur.length - 1;

    if (sequenceJoueur[indexActuel] !== sequence[indexActuel]) {
        finPartie();
        return;
    }

    if (sequenceJoueur.length === sequence.length) {
        niveauReussi();
    }
}

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

function finPartie() {
    jeuDemarre = false;
    tourJoueur = false;
    arreterTimeoutInactivite(); // Arrêt timeout

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

function basculerPause() {
    if (!jeuDemarre) return;

    jeuEnPause = !jeuEnPause;

    if (jeuEnPause) {
        arreterTimeoutInactivite(); //  Arrêt en pause
        afficherMessage("Jeu en pause");
        boutonPause.textContent = "REPRENDRE";    
 } else {
        afficherMessage(tourJoueur ? "À votre tour !" : "Regardez la séquence...");
        boutonPause.textContent = "PAUSE";  
        if (tourJoueur) {
            demarrerTimeoutInactivite(); // Redémarrage
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

function reinitialiserJeu() {
    jeuDemarre = false;
    jeuEnPause = false;
    sequence = [];
    sequenceJoueur = [];
    niveau = 1;
    scoreActuel = 0;
    arreterTimeoutInactivite(); //  Arrêt timeout
    
    mettreAJourInterface();
    afficherMessage("Prêt à jouer ? Appuyez sur DÉMARRER");
    boutonDemarrer.disabled = false;
    boutonDemarrer.textContent = "DÉMARRER";
    boutonReinitialiser.disabled = true;
    boutonPause.disabled = true;
     boutonPause.textContent = "PAUSE";
}

// === INITIALISATION ===
window.addEventListener('load', initialiserJeu);