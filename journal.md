# Journal de développement

**20 fév 17h00 -> 21 fév 3h00 ~10h**
    Début du travail sur le backend avec Python.
    Tentative d'exécution de ScrapeGraphAI avec Ollama sur mon ordinateur. Même si j'ai mis mon ordinateur à niveau cette semaine et réappliqué la pâte thermique, il n'est toujours pas assez puissant pour l'exécuter en un temps raisonnable. Je ne peux pas changer mon processeur et je n'ai pas de PC fixe, donc ma meilleure option serait une carte graphique externe.

**21 fév 14h00 -> 22 fév 2h00 ~12h**
    Tentative d'utilisation de Groq. Je n'approuve pas cet homme ni rien de ce qu'il représente, mais c'était l'option la moins coûteuse compte tenu de mes ressources et de mes besoins.
        J'ai utilisé DuckDuckGo pour trouver des liens vers les sites, BeautifulSoup4 pour les explorer et Groq pour formater les résultats.
    J'ai identifié le meilleur site à scraper.
    J'ai constaté qu'il était bien plus efficace d'utiliser uniquement DuckDuckGo et BeautifulSoup, et de formater moi-même les résultats.
    J'ai abandonné Groq.
    J'ai ajouté d'autres sites pour plus d'options.
    Je vais devoir repenser la façon dont j'utiliserai l'IA dans ce projet.

**26 fév 11h30 -> 27 fév 2h30 ~3h**
    Écriture de scrapers pour les matériaux en utilisant la méthode choisie lors de la dernière session pour les scrapers de tissu.
    Certains sites utilisent Shopify ou PrestaShop, ce qui facilitait la récupération de leurs données.

**21 mars 9h00 -> 21 mars 13h00 ~4h**
    Début du frontend avec React.
    Création de la mise en page de base (page principale, barre latérale).
    Correction de nombreuses erreurs dues principalement au changement d'IDE.
    J'ai installé Neovim avec Lazyvim et il y avait plus de configurations à faire que je le pensais.

**22 mars 14h00 -> 22 mars 20h00 ~6h**
    Création de l'interface pour la création de projets.
    Création de l'interface pour scraper des sites de patrons.
    Création de l'interface pour scraper des sites de matériaux.
    Création de l'interface pour gérer les listes de tâches dans les projets.

**23 mars 10h00 -> 23 mars 13h00 ~3h**
    Amélioration de l'interface.
    Création de la page de recherche de magasins à proximité.
    Début du générateur de patrons.

**24 mars 9h00 -> 24 mars 16h00 ~7h**
    Tentative d'utilisation de Gemini, ChatGPT et groq pour les suggestions LLM — décision de passer à Claude, car je pense honnêtement qu'il est meilleur que les autres pour le moment. Il est aussi le plus simple à utiliser.
    Écriture de prompts pour n'obtenir que les réponses dont j'ai besoin selon mes projets, dans le format voulu.
    Finalisation du générateur de patrons.
    Uniformisation des modales pour les PDFs et les images.

**27 mars 16:30 -> 27 mars 17:00 ~30min**
    Réglage d'un bug avec CORS

**27 avr 2h00 -> 8h00 ~6h**
    Ça fait un moment que je n'ai pas touché au projet et j'ai changé de Windows à Mint, puis à Arch, et enfin à NixOS.
    J'ai aussi changé de VsCode à Neovim, puis à Nixvim avec tout l'écosystème NixOS, et j'ai donc ajouté un Nix Flake au projet.

**9 mai 17h00 -> 10 mai 3:00 ~10h**
    Déploiement sur tailscale avec Kubernetes, Docker et Git

**11 mai 4:00 -> 11 mai 13:00 ~7h**
    Uniformisation de toute l'application. Elle n'était pas consistente part out et il a aussi fallu accommoder les téléphones, vu que je vais l'utiliser dessus.

**11 mai 18:00 -> 12 mai 3:00 ~9h**
    Retravaillé le UX et le UI pour prendre les tailles
    Ajouté plus de détails dans les formulaires
    Ajouté de la fonctionalité pour filter les projets et modifier les données déja entrées
