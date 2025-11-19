// === ÉLÉMENTS DU DOM ===
        const boutonsCouleur = document.querySelectorAll('.bouton-couleur');
        const boutonDemarrer = document.getElementById('bouton-demarrer');
        const boutonPause = document.getElementById('bouton-pause');
        const boutonReinitialiser = document.getElementById('bouton-reinitialiser');
        const scoreActuelEl = document.getElementById('score-actuel');
        const meilleurScoreEl = document.getElementById('meilleur-score');
        const niveauEl = document.getElementById('niveau');
        const messageEl = document.getElementById('message');

        // === VARIABLES DU JEU ===
        let sequence = [];
        let sequenceJoueur = [];
        let niveau = 1;
        let scoreActuel = 0;
        let meilleurScore = localStorage.getItem('simonMeilleurScore') || 0;
        let tourJoueur = false;
        let jeuDemarre = false;
        let jeuEnPause = false;

        // === CONTEXTE AUDIO POUR LES SONS ===
        const contexteAudio = new (window.AudioContext || window.webkitAudioContext)();

        // === INITIALISATION DU JEU ===
        function initialiserJeu() {
            meilleurScoreEl.textContent = meilleurScore;
            boutonReinitialiser.disabled = true;
            boutonPause.disabled = true;
            
            // Configuration des événements
            configurerEvenements();
        }

        // === CONFIGURATION DES ÉVÉNEMENTS ===
        function configurerEvenements() {
            // Événements pour les boutons de couleur
            boutonsCouleur.forEach(bouton => {
                bouton.addEventListener('click', gererClicCouleur);
            });
            
            // Événements pour les contrôles
            boutonDemarrer.addEventListener('click', demarrerJeu);
            boutonPause.addEventListener('click', basculerPause);
            boutonReinitialiser.addEventListener('click', reinitialiserJeu);
            
            // Raccourci clavier pour la pause (Espace)
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space' && jeuDemarre) {
                    basculerPause();
                }
            });
        }

        // === DÉMARRAGE DU JEU - LOGIQUE PRINCIPALE ===
        function demarrerJeu() {
            if (jeuDemarre) return;
            
            // Réinitialisation des variables de jeu
            sequence = [];
            sequenceJoueur = [];
            niveau = 1;
            scoreActuel = 0;
            
            // Mise à jour de l'interface
            mettreAJourInterface();
            boutonDemarrer.disabled = true;
            boutonReinitialiser.disabled = false;
            boutonPause.disabled = false;
            
            jeuDemarre = true;
            afficherMessage("Simon prépare la séquence...");
            
            // Lancement du premier niveau
            preparerNiveauSuivant();
        }

        // === PRÉPARATION D'UN NOUVEAU NIVEAU ===
        function preparerNiveauSuivant() {
            /**
             * À chaque niveau, on ajoute une nouvelle couleur à la séquence
             * La difficulté augmente progressivement :
             * - Niveaux 1-5 : 1 couleur ajoutée
             * - Niveaux 6-10 : 2 couleurs ajoutées
             * - Niveaux 11+ : 3 couleurs ajoutées
             */
            sequenceJoueur = [];
            tourJoueur = false;
            
            const couleurs = ['rouge', 'bleu', 'vert', 'jaune'];
            let nombreNouvellesCouleurs = 1;
            
            if (niveau >= 11) nombreNouvellesCouleurs = 3;
            else if (niveau >= 6) nombreNouvellesCouleurs = 2;
            
            for (let i = 0; i < nombreNouvellesCouleurs; i++) {
                const couleurAleatoire = couleurs[Math.floor(Math.random() * couleurs.length)];
                sequence.push(couleurAleatoire);
            }
            
            // Affichage de la séquence
            afficherSequence();
        }

        // === AFFICHAGE DE LA SÉQUENCE PAR SIMON ===
        function afficherSequence() {
            /**
             * Simon affiche la séquence couleur par couleur
             * La vitesse d'affichage diminue avec les niveaux pour augmenter la difficulté
             */
            let index = 0;
            const vitesseAffichage = Math.max(300, 800 - (niveau * 30)); // Vitesse adaptative
            
            const interval = setInterval(() => {
                if (index >= sequence.length || jeuEnPause) {
                    if (index >= sequence.length) {
                        clearInterval(interval);
                        tourJoueur = true;
                        afficherMessage("À votre tour !");
                    }
                    return;
                }
                
                const couleur = sequence[index];
                activerBoutonAvecEffets(couleur, index);
                index++;
            }, vitesseAffichage);
        }

        // === ACTIVATION D'UN BOUTON AVEC EFFETS ===
        function activerBoutonAvecEffets(couleur, indexSequence) {
            /**
             * Activation visuelle et sonore d'un bouton
             * Les effets évoluent avec le niveau :
             * - Sons plus complexes aux niveaux élevés
             * - Durée d'activation adaptative
             */
            const bouton = document.getElementById(couleur);
            
            // Effet visuel
            bouton.classList.add('active');
            
            // Son adaptatif selon le niveau
            jouerSonAdaptatif(couleur, indexSequence);
            
            // Désactivation après un délai
            setTimeout(() => {
                bouton.classList.remove('active');
            }, 400);
        }

        // === SYSTÈME AUDIO ADAPTATIF ===
        function jouerSonAdaptatif(couleur, indexSequence) {
            /**
             * Génération de sons avec Web Audio API
             * Les sons évoluent avec la progression :
             * - Fréquences différentes par couleur
             * - Types d'onde qui changent selon le niveau
             * - Durée adaptative
             */
            if (jeuEnPause) return;
            
            const oscillator = contexteAudio.createOscillator();
            const gainNode = contexteAudio.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(contexteAudio.destination);
            
            // Configuration de la fréquence selon la couleur
            const frequences = {
                rouge: 330 + (niveau * 5),
                bleu: 440 + (niveau * 5),
                vert: 550 + (niveau * 5),
                jaune: 660 + (niveau * 5)
            };
            
            oscillator.frequency.value = frequences[couleur];
            
            // Type d'onde qui évolue avec le niveau
            oscillator.type = niveau >= 10 ? 'sawtooth' : 'sine';
            
            // Enveloppe du son
            gainNode.gain.setValueAtTime(0.3, contexteAudio.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, contexteAudio.currentTime + 0.5);
            
            oscillator.start(contexteAudio.currentTime);
            oscillator.stop(contexteAudio.currentTime + 0.5);
        }

        // === GESTION DES INTERACTIONS DU JOUEUR ===
        function gererClicCouleur(e) {
            /**
             * Traitement de l'entrée utilisateur :
             * - Vérification que c'est le tour du joueur
             * - Ajout de la couleur à la séquence du joueur
             * - Feedback immédiat
             * - Vérification de la validité
             */
            if (!tourJoueur || !jeuDemarre || jeuEnPause) return;
            
            const couleur = e.target.id;
            sequenceJoueur.push(couleur);
            
            // Feedback immédiat
            activerBoutonAvecEffets(couleur, sequenceJoueur.length - 1);
            
            // Vérification de la séquence
            verifierSequenceJoueur();
        }

        // === VÉRIFICATION DE LA SÉQUENCE DU JOUEUR ===
        function verifierSequenceJoueur() {
            /**
             * Vérification pas à pas de la séquence :
             * - Comparaison avec la séquence originale
             * - Détection immédiate des erreurs
             * - Passage au niveau suivant si séquence complète
             */
            const indexActuel = sequenceJoueur.length - 1;
            
            // Détection d'erreur
            if (sequenceJoueur[indexActuel] !== sequence[indexActuel]) {
                jouerSonErreur();
                finPartie();
                return;
            }
            
            // Séquence complète et correcte
            if (sequenceJoueur.length === sequence.length) {
                jouerSonReussite();
                niveauReussi();
            }
        }

        // === TRAITEMENT D'UN NIVEAU RÉUSSI ===
        function niveauReussi() {
            /**
             * Calcul du score avec bonus progressifs :
             * - Points de base + bonus de niveau
             * - Animation de feedback positif
             * - Préparation du niveau suivant
             */
            const pointsBase = 10;
            const bonusNiveau = Math.floor(niveau / 3) * 5;
            scoreActuel += pointsBase + bonusNiveau;
            
            // Mise à jour de l'interface
            scoreActuelEl.textContent = scoreActuel;
            niveau++;
            niveauEl.textContent = `Niveau: ${niveau}`;
            
            // Feedback visuel
            afficherMessage(`Niveau ${niveau-1} réussi ! +${pointsBase + bonusNiveau} points`);
            messageEl.classList.add('pulse');
            
            // Préparation du niveau suivant
            setTimeout(() => {
                messageEl.classList.remove('pulse');
                preparerNiveauSuivant();
            }, 1500);
        }

        // === GESTION DE LA FIN DE PARTIE ===
        function finPartie() {
            /**
             * Traitement de la fin de partie :
             * - Sauvegarde du meilleur score
             * - Feedback d'échec
             * - Réinitialisation partielle
             */
            jeuDemarre = false;
            tourJoueur = false;
            
            // Animation d'échec
            afficherMessage("Erreur ! Séquence incorrecte.");
            messageEl.classList.add('shake');
            
            // Sauvegarde du meilleur score
            if (scoreActuel > meilleurScore) {
                meilleurScore = scoreActuel;
                localStorage.setItem('simonMeilleurScore', meilleurScore);
                meilleurScoreEl.textContent = meilleurScore;
                afficherMessage("Game Over ! Nouveau meilleur score !");
            }
            
            // Réinitialisation des contrôles
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
                afficherMessage("Jeu en pause");
                boutonPause.textContent = "REPRENDRE";
            } else {
                afficherMessage(tourJoueur ? "À votre tour !" : "Regardez la séquence...");
                boutonPause.textContent = "PAUSE";
            }
        }

        // === SONS DE FEEDBACK ===
        function jouerSonReussite() {
            const oscillator = contexteAudio.createOscillator();
            const gainNode = contexteAudio.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(contexteAudio.destination);
            
            // Séquence ascendante pour le succès
            oscillator.frequency.setValueAtTime(523.25, contexteAudio.currentTime);
            oscillator.frequency.setValueAtTime(659.25, contexteAudio.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, contexteAudio.currentTime + 0.2);
            
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, contexteAudio.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, contexteAudio.currentTime + 0.5);
            
            oscillator.start(contexteAudio.currentTime);
            oscillator.stop(contexteAudio.currentTime + 0.5);
        }

        function jouerSonErreur() {
            const oscillator = contexteAudio.createOscillator();
            const gainNode = contexteAudio.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(contexteAudio.destination);
            
            // Séquence descendante pour l'erreur
            oscillator.frequency.setValueAtTime(392, contexteAudio.currentTime);
            oscillator.frequency.setValueAtTime(349.23, contexteAudio.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(293.66, contexteAudio.currentTime + 0.2);
            
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.4, contexteAudio.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, contexteAudio.currentTime + 0.5);
            
            oscillator.start(contexteAudio.currentTime);
            oscillator.stop(contexteAudio.currentTime + 0.5);
        }

        // === FONCTIONS D'INTERFACE ===
        function afficherMessage(texte) {
            messageEl.textContent = texte;
        }

        function mettreAJourInterface() {
            scoreActuelEl.textContent = scoreActuel;
            niveauEl.textContent = `Niveau: ${niveau}`;
        }

        function reinitialiserJeu() {
            jeuDemarre = false;
            jeuEnPause = false;
            sequence = [];
            sequenceJoueur = [];
            niveau = 1;
            scoreActuel = 0;
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