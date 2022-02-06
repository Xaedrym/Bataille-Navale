const GRID_SIZE = 10;

// Old message sera le dernier <p> insérer dans le aside ennemi pour que l'on puisse l'insérer tout en haut de la "liste"
let old_mess;

document.addEventListener("DOMContentLoaded", function() {
    /** 
     * Function that build a game grild
     * 
     * @table => param, the table where you want to build the grild
     * @str => String that say if it's last child or first child
     * */ 
    function create_grid(table,aside,draw,tableau){
        let tbody = document.createElement("tbody");
        table.insertBefore(tbody, null);
        for(let i = 0; i <= GRID_SIZE; i++){
            let last_tr = document.createElement("tr");
            tbody.insertBefore(last_tr, null);
            if(i == 0){
                last_tr.innerHTML = "<td></td>";
                for(let j = 1; j <= GRID_SIZE; j++){
                    last_tr.innerHTML += "<td>" + j + "</td>";
                }
            }else{
                last_tr.innerHTML = "<td>" + String.fromCharCode(64+i) + "</td>";
                for(let j = 1; j <= GRID_SIZE; j++){
                    let last_td = document.createElement("td");
                    last_tr.insertBefore(last_td, null);
                    if(draw){
                        if(tableau[i-1][j-1] != 0){
                            last_td.classList.add(tableau[i-1][j-1]);
                        }
                        last_td.addEventListener('click', function(e) {
                            let classname = get_boat(aside);
                            let length_boat = get_length_of_boat(classname);
                            let number_case_boat = get_number_of_case_of_boat(classname, tableau);
                            // Pour effacer la case du bateau
                            if(e.target.classList.contains(classname)){
                                let direction = get_directionBoat(classname);
                                if(number_case_boat > 2){
                                    if(can_erase(classname, i-1, j-1, direction)){
                                        e.target.classList.remove(classname);
                                        tableau[i-1][j-1] = 0;
                                        localStorage.setItem("tableau", JSON.stringify(tableau));
                                    }else{
                                        alert("Vous ne pouvez pas supprimer l'une des cases centrales du bateau ! \nSupprimez les bords du bateau au fur et à mesure !")
                                    }
                                }else{
                                    e.target.classList.remove(classname);
                                    tableau[i-1][j-1] = 0;
                                    localStorage.setItem("tableau", JSON.stringify(tableau));
                                }
                            }
                            // Pour ajouter une case du bateau
                            else{
                                if(length_boat > number_case_boat){
                                    // Placer la première case du bateau
                                    if(number_case_boat == 0){
                                        e.target.classList.add(classname);
                                        tableau[i-1][j-1] = classname;
                                        localStorage.setItem("tableau", JSON.stringify(tableau));
                                    }
                                    // Placer la deuxième case du bateau, elle doit être adjacente a la première
                                    else if(number_case_boat == 1){
                                        if(is_adjacentBoat(classname, i-1, j-1)){
                                            e.target.classList.add(classname);
                                            tableau[i-1][j-1] = classname;
                                            localStorage.setItem("tableau", JSON.stringify(tableau));  
                                        }else{
                                            alert("Vous devez choisir une case adjacente à celle de départ de votre "+classname);
                                        }
                                    }
                                    // Placer les autres cases du bateau, elles doivent être adjacentes à l'une d'entre elles, et dans la direction du bateau
                                    else if(number_case_boat > 1){
                                        let direction = get_directionBoat(classname);
                                        if(is_adjacentBoat(classname, i-1, j-1) && ((i-1 != 9 && tableau[i-1+direction.x][j-1+direction.y] === classname)  || tableau[i-1-direction.x][j-1-direction.y] === classname)){
                                            if(!is_occuped(classname, i-1, j-1)){
                                                e.target.classList.add(classname);
                                                tableau[i-1][j-1] = classname;
                                                localStorage.setItem("tableau", JSON.stringify(tableau));
                                            }else{
                                                alert("La case que vous avez séléctionner est déja occupée par un autre bateau.");
                                            } 
                                        }else{
                                            alert("Vous devez choisir une case adjacente et qui suit la direction de votre "+classname);
                                        }
                                    }
                                }else{
                                    alert("Le "+classname+" à déjà toutes ses cases placées ("+length_boat+") !");
                                }
                            }
                        });                 
                    }
                }
            }
        }
    }

    // Faire un tableau pour stocker les valeurs de la grille (stocker les emplacements des bateaux)
    // Faire une double boucle for ou une fonction pour affeter un eventlister sur chaque case

    /**
     * Function that returns the selected boat from the Aside Part
     * @param {*} aside the aside (From your side)
     * @returns return a String that define the boat
     */
    function get_boat(aside){
        for(let boat of aside.children){
            if(boat.firstChild.checked){
                return boat.className;
            }
        }
    }

    /**
     * Function that returns the length of the boat that we want
     * @param {*} boat the String that defines the boat
     * @returns return the length of the boat, or 0 if the function can't find the boat
     */
    function get_length_of_boat(boat){
        switch (boat) {
            case 'lancetorpilles':
                return 2;
            case 'contretorpilleur':
                return 3;
            case 'sousmarin':
                return 3;
            case 'cuirasse':
                return 4;
            case 'porteavions':
                return 5;
            default:
                return 0;
        }
    } 

    /**
     * Function that returns the number of case that are already placed of the selected boat
     * @param {*} boat the String that defines the boat
     * @param {*} tableau the array where the datas are in
     * @returns return the number og case that are already placed
     */
    function get_number_of_case_of_boat(boat,tableau){
        let number = 0;
        for(let i = 0; i < GRID_SIZE; i++){
            for(let j = 0; j < GRID_SIZE; j++){
                if(tableau[i][j] === boat){
                    number++;
                }
            }
        }
        return number;
    }

    /**
     * Function that returns if the actual case is adjacent of others case of the selected boat
     * @param {*} boat the String that defines the boat
     * @param {*} t_i the first part of the actual position(x: i, y: j);
     * @param {*} t_j the second part of the actual position(x: i, y: j);
     * @returns return true if the selected case is adjacent of one of others, else returns false
     */
    function is_adjacentBoat(boat,t_i, t_j){
        for(let i = 0; i < GRID_SIZE; i++){
            for(let j = 0; j < GRID_SIZE; j++){
                if(tableau_me[i][j] === boat){
                    if(t_i == i && (t_j == j + 1 || t_j == j - 1)){
                        return true;
                    }
                    if(t_j == j && (t_i == i + 1 || t_i == i - 1)){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Returns the direction of the boat in parameter
     * @param {*} boat the String that defines the boat
     * @returns returns a object{x,y} that define the vector of the direction of the boat
     */
    function get_directionBoat(boat){
        let first = {x:-1 , y:-1};
        let second = {x:-1 , y:-1};
        for(let i = 0; i < GRID_SIZE; i++){
            for(let j = 0; j < GRID_SIZE; j++){
                if(tableau_me[i][j] === boat){
                    if(first.x == -1 && first.y == -1){
                        first = {x:i, y:j};
                    }else if (second.x == -1 && second.y == -1){
                        second = {x: i, y:j};
                        break;
                    }
                }
            }
        }
        return {x: Math.abs(first.x-second.x), y: Math.abs(first.y-second.y)};
    }

    /**
     * Function that says if the actual case is occuped or not
     * @param {*} boat the String that defines the boat
     * @param {*} i the first part of the actual position(x: i, y: j);
     * @param {*} j the second part of the actual position(x: i, y: j);
     * @returns returns True if the actual case is occuped and not occuped by the boat in parameter, else returns false
     */
    function is_occuped(boat, i, j){
        if(tableau_me[i][j] == 0 || tableau_me[i][j] == boat){
            return false;
        }else{
            return true;
        }
    }

    /**
     * Function that says if the current case can be delete or not
     * @param {*} boat the String that defines the boat
     * @param {*} i the first part of the actual position(x: i, y: j);
     * @param {*} j the second part of the actual position(x: i, y: j);
     * @param {*} dir the direction of the boat
     * @returns returns True if the current case can be delete, else returns false
     */
    function can_erase(boat, i, j, dir){
        let nombre_case_boat = 0;
        if(dir.x == 0 && dir.y != 0){
            if(j < GRID_SIZE && tableau_me[i][j+dir.y] == boat){
                nombre_case_boat++;
            }
            if(j > 0 && tableau_me[i][j-dir.y] == boat){
                nombre_case_boat++;
            }
        }
        if(dir.x != 0 && dir.y == 0){
            if(i < GRID_SIZE - 1 && tableau_me[i+dir.x][j] == boat){
                nombre_case_boat++;
            }
            if(i > 0 && tableau_me[i-dir.x][j] == boat){
                nombre_case_boat++;
            }
        }
        if(nombre_case_boat < 2){
            return true;
        }
        return false;
    }


    /**
     * Function that says if we can begin the game or not yet
     * @param {*} tableau the array of positions of your boats
     * @returns returns False if the grid isn't fully completed, true if all boat are completely placed
     */
    function can_begin(tableau){
        if(get_number_of_case_of_boat("lancetorpilles",tableau) != get_length_of_boat("lancetorpilles")){
            return false;
        }
        if(get_number_of_case_of_boat("contretorpilleur",tableau) != get_length_of_boat("contretorpilleur")){
            return false;
        }
        if(get_number_of_case_of_boat("sousmarin",tableau) != get_length_of_boat("sousmarin")){
            return false;
        }
        if(get_number_of_case_of_boat("cuirasse",tableau) != get_length_of_boat("cuirasse")){
            return false;
        }
        if(get_number_of_case_of_boat("porteavions",tableau) != get_length_of_boat("porteavions")){
            return false;
        }
        return true;
    }

    /**
     * Function that changes the data into an object that permit to land the game
     * @param {*} tableau The array of all datas, that contains boats
     * @returns returns an Object with the position of all boats
     */
    function array_to_object(tableau){
        let object = {lancetorpilles:[], contretorpilleur:[], sousmarin:[], cuirasse:[], porteavions:[]};
        for(let i = 1; i <= GRID_SIZE; i++){
            for(let j = 1; j <= GRID_SIZE; j++){
                switch(tableau[i-1][j-1]){
                    case "lancetorpilles":
                        object.lancetorpilles.push(String.fromCharCode(64+i)+j);
                        continue;
                    case "contretorpilleur":
                        object.contretorpilleur.push(String.fromCharCode(64+i)+j);
                        continue;
                    case "sousmarin":
                        object.sousmarin.push(String.fromCharCode(64+i)+j);
                        continue;
                    case "cuirasse":
                        object.cuirasse.push(String.fromCharCode(64+i)+j);
                        continue;
                    case "porteavions":
                        object.porteavions.push(String.fromCharCode(64+i)+j);
                        continue;
                    default:
                        continue;
                }
            }
        }
        return object;
    }

    /**
     * Function that checks if i<10 then it will add "0", else doing nothing
     * @param {*} i the number to check
     * @returns returns i if i>10 else returns "0"+i 
     */
    function check_time(i) {
        return (i < 10) ? "0" + i : i;
    }

    /**
     * Function that write in the enemy-y-y-y aside all the messages and returns the last message written
     * @param {*} par_qui String, who is sending the message(serveur/adversaire/moi)
     * @param {*} entre_crochet String, what should be between square brackets
     * @param {*} msg String, the message to send
     * @param {*} old_message An element <p>, where the new message will be placed before
     * @returns the last <p> where the last message was written
     */
    function afficher_message(par_qui, entre_crochet, msg, old_message){
        var now = new Date();
        let mess = document.createElement("p");
        if(old_message == null || old_message == undefined){
            aside_adversaire.insertBefore(mess, null);
        }else{
            aside_adversaire.insertBefore(mess, old_message);
        }
        mess.classList.add(par_qui);
        mess.innerHTML = check_time(now.getHours()) + ":" + check_time(now.getMinutes()) + ":" + check_time(now.getSeconds()) + " ~ ["+entre_crochet+"] : " + msg;
        old_mess = mess;
        return old_mess;
    }

    /**
     * Function that adds event listener if it's enemy grid, deletes them if it's your grid
     * @param {*} table The grid that will be changed
     * @param {*} enemy true if it's for enemy grid, else false
     */
    function reformate_grid(table,enemy){
        let cells = table.getElementsByTagName("td");
        // Sur la grille ennemie on ajoute des eventslistener pour pouvoir effectuer les tirs
        if(enemy == true){
            for(let i = 0;i < cells.length; i++){
                if(i%11 != 0 && i > 11){
                    cells[i].addEventListener('click', function(e){
                        sock.emit("tir",String.fromCharCode(64+i/11) + i%11);
                        // sock.on("resultat", function({ statut: r, emetteur: true or false, coords: coords }))
                        // r = 0 -> dans l'eau / r = 1 -> touché / r = 2 -> touché et coulé / r = 3 -> Win
                        sock.on("resultat",function(obj){
                            if((String.fromCharCode(64+i/11) + i%11) == obj.coords && obj.emetteur == true){
                                cells[i].classList.add("tir");
                                let msg = "";
                                let debut_msg = "Tir en " + obj.coords + " : ";
                                let fin_msg = "<br>En attente du tir de l'adversaire";
                                switch(obj.statut){
                                    case 0:
                                        msg = debut_msg + "<br>&#x2753 &#x1F427 &#x2753<br>Dans l'eau &#x1F974 !" + fin_msg;
                                        old_mess = afficher_message("serveur", "MOI", msg, old_mess);
                                        break;
                                    case 1:
                                        msg = debut_msg + "<br>&#x1F4A5 BOOM &#x1F4A5 ! <br>Touché !" + fin_msg;
                                        old_mess = afficher_message("serveur", "MOI", msg, old_mess);
                                        cells[i].classList.add("touche");
                                        break;
                                    case 2:
                                        msg = debut_msg + "<br>&#x1F30A &#x26F5 &#x1F30A Coulé !" + fin_msg;
                                        old_mess = afficher_message("serveur", "MOI", msg, old_mess);
                                        cells[i].classList.add("touche");
                                        break;
                                    case 3:
                                        msg = debut_msg + "Coulé le dernier bateau ! <br> &#x1F44D VICTOIRE ! &#x1F44D";
                                        old_mess = afficher_message("serveur", "MOI", msg, old_mess);
                                        cells[i].classList.add("touche");
                                        let resetPartie = document.createElement("button");
                                        let textBouton = document.createTextNode("Nouvelle Partie");
                                        resetPartie.appendChild(textBouton);
                                        aside_adversaire.insertBefore(resetPartie, old_mess);
                                        resetPartie.addEventListener('click', function(){
                                            location.reload();
                                        });
                                        break;
                                }                                
                            }
                        });
                    });
                }
            }
        }
        // Sur notre grille on "supprime" tous les eventslisteners pour pas faire de bêtise
        else{
            for(let i = 0;i < cells.length; i++){
                if(i%11 != 0 && i > 11){
                    cells[i].outerHTML = cells[i].outerHTML;
                    sock.on("resultat",function(obj){
                        if((String.fromCharCode(64+i/11) + i%11) == obj.coords && obj.emetteur == false){                   
                            cells[i].classList.add("tir");
                            let msg = "";
                            let debut_msg = "Tir en " + obj.coords + " : ";
                            let fin_msg = "<br> &#x27A1 A vous de jouer ! &#x2B05";
                            switch(obj.statut){
                                case 0:
                                    msg = debut_msg + "<br>&#x2753 &#x1F427 &#x2753<br>Dans l'eau &#x1F974 !" + fin_msg;
                                    old_mess = afficher_message("serveur", "ADVERSAIRE", msg, old_mess);
                                    break;
                                case 1:
                                    msg = debut_msg + "<br>&#x1F4A5 BOOM &#x1F4A5 ! <br>Touché !" + fin_msg;
                                    old_mess = afficher_message("serveur", "ADVERSAIRE", msg, old_mess);
                                    break;
                                case 2:
                                    msg = debut_msg + "<br>&#x1F30A &#x26F5 &#x1F30A Coulé !" + fin_msg;
                                    old_mess = afficher_message("serveur", "ADVERSAIRE", msg, old_mess);
                                    break;
                                case 3:                     
                                    msg = debut_msg + "Coulé le dernier bateau ! <br> &#x1F44E DEFAITE ! &#x1F44E";
                                    old_mess = afficher_message("serveur", "ADVERSAIRE", msg, old_mess);
                                    let resetPartie = document.createElement("button");
                                    let textBouton = document.createTextNode("Nouvelle Partie");
                                    resetPartie.appendChild(textBouton);
                                    aside_adversaire.insertBefore(resetPartie, old_mess);
                                    resetPartie.addEventListener('click', function(){
                                        location.reload();
                                    });
                                    break;
                            }
                        }
                    });
                }
            }
        }
    }

    // socket ouverte vers le serveur
    let sock = io.connect();

    // Adversaire
    let section_adversaire = document.querySelector("main section:first-child");
    let aside_adversaire = document.querySelector("main section:first-child aside");
    let table_adversaire = document.createElement("table");
    section_adversaire.insertBefore(table_adversaire, aside_adversaire);
    create_grid(table_adversaire,aside_adversaire,false);

    // Nous
    let section_me = document.querySelector("main section:last-child");
    let aside_me = document.querySelector("main section:last-child aside");
    let table_me = document.createElement("table");
    section_me.insertBefore(table_me, aside_me);

    var tableau_me = localStorage.getItem("tableau");
    tableau_me = (!tableau_me) ? [] : JSON.parse(tableau_me);
    if(tableau_me.length === 0){
        for (let i = 0; i < GRID_SIZE; i++) {
            tableau_me[i] = [];
            for (let j = 0; j < GRID_SIZE; j++){
                tableau_me[i][j] = 0;
            }
        }
    }
    localStorage.setItem("tableau", JSON.stringify(tableau_me));

    create_grid(table_me, aside_me, true, tableau_me);

    // Pour démarrer la partie sur le bouton "Lancer la partie"
    let btnGO = document.getElementById("btnDemarrer");
    btnGO.addEventListener('click',function(e){
        if(can_begin(tableau_me)){
            let grille_bon_format = array_to_object(tableau_me);
            // On démarre la partie, on affecte partieEnCours pour enlever les bateaux sur le aside et mettre un envoie de message possible

            // On démare la partie
            sock.emit("demarrer", grille_bon_format);
            document.body.classList.add("partieEnCours");

            // On attend un autre joueur
            sock.on("en_attente", function(msg){
                old_mess = afficher_message("serveur", "EN ATTENTE", msg, null);
            });

            // Debut de la partie > premier tir > A nous de jouer !
            sock.on("a_toi", function(msg){
                old_mess = afficher_message("serveur", "PREMIER TIR", "&#x1F3AF &#x1F52B <br>"+msg, old_mess);
            });

            // Debut de la partie > premier tir > A l'adversaire de jouer :(
            sock.on("a_l_autre", function(msg){
                old_mess = afficher_message("serveur", "PREMIER TIR", "&#x1F3AF &#x1F52B <br>"+msg, old_mess);
            });

            // On recois une erreur de la pars du serveur
            sock.on("erreur", function(msg){
                old_mess = afficher_message("serveur", "MESSAGE D'ERREUR", msg, old_mess);
                if(msg === "Ce n'est pas à votre tour de jouer."){
                    alert("Ce n'est pas à votre tour de jouer !");
                }
            });

            // L'adversaire s'est deconnecté
            sock.on("deconnexion", function(msg) {
                old_mess = afficher_message("serveur", "VICTOIRE PAR ABANDON", msg, old_mess);
                let resetPartie = document.createElement("button");
                let textBouton = document.createTextNode("Nouvelle Partie");
                resetPartie.appendChild(textBouton);
                aside_adversaire.insertBefore(resetPartie, old_mess);
                resetPartie.addEventListener('click', function(){
                    location.reload();
                });
            });

            // On recois un message de la pars de l'adversaire
            sock.on("message", function(msg){
                old_mess = afficher_message("adversaire", "ADVERSAIRE", msg, old_mess);
            });
            
            // On envoie un message a l'adversaire
            let envoyer = document.getElementById("btnEnvoyer");
            envoyer.addEventListener('click', function(e){
                let message = document.getElementById("txtMsg").value;
                sock.emit("message",message);
                old_mess = afficher_message("moi", "MOI", message, old_mess);
            });

            reformate_grid(table_adversaire,true);
            reformate_grid(table_me,false);

            // Une fois la partie terminée faudra ajouter un bouton qui permet de revenir au placage des bateaux si appuyer dessus

        }else{
            alert("La grille n'est pas entièrement remplie ! \nVeuillez placer correctement TOUS vos bateaux.")
        }
    });
    
});