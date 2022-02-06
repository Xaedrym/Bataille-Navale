"use strict";

// Chargement des modules 
var express = require('express');
var app = express();

// cf. https://www.npmjs.com/package/socket.io#in-conjunction-with-express
const server = require('http').createServer(app);
const io = require('socket.io')(server);

server.listen(8080, function() {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to 
app.get('/', function(req, res) {  
    res.sendFile(__dirname + '/public/bataille.html');
});


/***************************************************************
 *           Gestion des clients et des connexions
 ***************************************************************/

// Parties en cours 
let parties = {};
// Compteur de parties 
let compteur = 0;

// Constante indiquant la composition de la grille de chaque joueur. 
const GRILLE = {
    "porteavions": 5,
    "cuirasse": 4,
    "sousmarin": 3,
    "contretorpilleur": 3,
    "lancetorpilles": 2
};

/**
 *  Vérification de la grille passée en paramètre.
 *  @param  Object bateaux  le placement des bateaux sur la grille au format { idbateau => cases[], ...}
 */
function verifieGrille(bateaux) {
    return Object.keys(GRILLE).every(e => 
        // le type de bateau existe
        bateaux[e] && 
        // le nombre de cases pour le bateau correspond à sa taille théorique
        bateaux[e].length == GRILLE[e] && 
        // chaque case est de la forme "XY" où X est une lettre en A et J et Y est un nombre entre 1 et 10
        bateaux[e].every(c => c.substr(0,1) >= "A" && 
                              c.substr(0,1) <= "J" && 
                              1*c.substr(1) >= 1 && 
                              1*c.substr(1) <= 10)
    );
}

/** 
 *  Transforme une map { id_bateau => cases[] } 
 *  en une map { id_bateau => { case => bool (false) } } 
 *  indiquant le degré de dégâts de chaque bateau
 */
function reformaterGrille(bateaux) {
    var res = {};
    for (var e in GRILLE) {
        res[e] = {};
        for (var i in bateaux[e]) {
            res[e][bateaux[e][i]] = false;   
        }
    }
    return res;
}


/**
 *  Applique le tir sur la grille du joueur ciblé. 
 *  @param  partie  number  l'identifiant de la partie considérée
 *  @param  cible   number  le numéro du joueur ciblé (0 ou 1)
 *  @param  tir     String  la case ciblée (lettre A-J + nombre 1-10, ex. "D9")
 *  @return         number  0 : dans l'eau, 1 : touché, mais pas coulé, 2 : coulé mais pas fini, 3 : fini
 */
function jouerCoup(partie, cible, tir) { 
    // passe en revue les bateaux de la cible : 
    for (var b in parties[partie].joueurs[cible].grille) {
        var bat = parties[partie].joueurs[cible].grille[b];
        if (bat[tir] !== undefined) {
            // indique la case touchée
            bat[tir] = true;    
            // détermine si le bateau est coulé
            for (var c in bat) {
                if (bat[c] === false) {
                    return 1;    // --> touché
                }
            }
            // détermine s'il reste un bateau non coulé :
            for (var b1 in parties[partie].joueurs[cible].grille) {
                for (var c in parties[partie].joueurs[cible].grille[b1]) {
                    if (parties[partie].joueurs[cible].grille[b1][c] == false) {
                        return 2;   // --> coulé mais pas le dernier bateau 
                    }
                }
            }
            return 3;   // --> coulé le dernier bateau
        }
    }
    return 0;   // --> dans l'eau    
}

/**
 *  Suppression de la partie (réinit joueurs);
 *  @param partie
 */
function supprimerPartie(partie) {
    console.log("Suppression de la partie " + partie);
    delete parties[partie];
}


/**********************************************************************
 ***                      Gestion des websockets                    ***
 **********************************************************************/

// réception d'une connexion
io.on('connection', function (socket) {
    
    // message de debug
    console.log("Un client s'est connecté");
    
    let index = -1;     // -1 : en attente de partie, 0 ou 1 position dans le tableau de joueurs. 
    let partie = null;    // numéro de partie à laquelle participe le joueur
    
    /**
     *  Demande le démarrage d'une partie.
     *  @param  bateaux  les bateaux sous la forme d'un objet { type_bateau: [ case1, case2, etc. ] }
     *  où type_bateau = porteavions, cuirasse, sousmarin, contretorpilleur, lancetorpilles
     */
    socket.on("demarrer", function(bateaux) {
        
        // si le joueur est déjà en train de jouer à une partie
        if (index != -1) {
            socket.emit("erreur", "Joueur déjà connecté.");
            return;
        }
        
        // message de debug
        console.log("Grille reçue : ", bateaux);
        
        // vérification de la grille
        if (!verifieGrille(bateaux)) {
            console.log("  -> erreur dans le format dans la grille");
            socket.emit("erreur", "La grille envoyée n'est pas dans le bon format.");   
            return;
        }

        // assignation d'une place au joueur
        if (parties[compteur] && parties[compteur].joueurs.length < 2) {
            partie = compteur;
            index = parties[partie].joueurs.length;
        }
        else {
            // creation d'une nouvelle partie 
            compteur++;
            partie = compteur;
            parties[partie] = { joueurs: [], courant: -1 };
            index = 0;
        }
        parties[partie].joueurs[index] = { socket: socket, grille: reformaterGrille(bateaux) };
        console.log("  -> joueur ajouté à la partie " + partie + ", à l'indice " + index);
        if (parties[partie].joueurs.length == 2) { 
            // les deux joueurs sont prêts
            console.log("Début de la partie " + partie);
            parties[partie].courant = (Math.random() * 2) | 0;
            parties[partie].joueurs[parties[partie].courant].socket.emit("a_toi", "Démarrage de la partie, vous commencez.");
            parties[partie].joueurs[1-parties[partie].courant].socket.emit("a_l_autre", "Démarrage de la partie. En attente du tir de l'adversaire.");
        }
        else {
            // seul le joueur présent est là
            socket.emit("en_attente", "Grille validée. En attente d'un autre joueur.");
        }        
    });
    
    
    /**
     *  Réception d'un tir. 
     *  @param  coords  string  Les coordonnées sous la forme ligne ("A"-"J") + colonne (1-10) ex. "D7"  
     */
    socket.on("tir", function(coords) {

        // message de debug
        console.log("[Partie " + partie + "] Tir reçu aux coordonnées " + coords);
        
        // erreur : joueur non connecté, partie non commencée (pas assez de joueurs)
        if (index == -1 || !parties[partie] || parties[partie].joueurs.length < 2) {
            socket.emit("erreur", "Pas de partie en cours.");
            return;
        }
        // erreur : pas de le joueur attendu
        if (index != parties[partie].courant) {
            socket.emit("erreur", "Ce n'est pas à votre tour de jouer.");   
            return;
        }
        
        // détermine la cible
        let courant = parties[partie].courant;
        let cible = 1 - parties[partie].courant;
        
        // calcul du résultat
        let r = jouerCoup(partie, cible, coords);
        console.log(" -> " + ["dans l'eau", "touché", "coulé", "coulé & game over"][r]);
        
        // envoi aux joueurs
        parties[partie].joueurs[courant].socket.emit("resultat", { statut: r, emetteur: true, coords: coords });
        parties[partie].joueurs[cible].socket.emit("resultat", { statut: r, emetteur: false, coords: coords });
        
        // si la partie n'est pas terminée : 
        if (r < 3) {
            // inversion des rôles
            parties[partie].courant = cible;
        }
        else {
            // sinon fin de la partie
            console.log("Fin de la partie (normale)");
            supprimerPartie(partie);
            index = -1;
            partie = null;
        }
    });
    
        
    /**
     * Message envoyé à l'adversaire --> relai vers celui-ci s'il existe
     */
    socket.on("message", function(msg) {
        if (partie == null || ! parties[partie]){
            socket.emit("erreur", "Pas de partie en cours.");
            return;
        }
        if (index >= 0 && parties[partie].joueurs[1 - index]) {
            parties[partie].joueurs[1 - index].socket.emit("message", msg);
        }
    });

    /** 
     *  Gestion des déconnexions
     */
    socket.on("disconnect", function() { 
        console.log("Déconnexion d'un client");
        if (index >= 0 && parties[partie]) {
            console.log("Fin de la partie (abandon)");
            if (parties[partie].joueurs[1-index]) {
                parties[partie].joueurs[1 - index].socket.emit("deconnexion", "Victoire par abandon. L'adversaire s'est déconnecté.");
            }
            supprimerPartie(partie);
        }
    });
        
});
