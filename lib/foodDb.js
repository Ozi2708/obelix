/* Obélix — base de connaissances alimentaire (portée depuis food-db.js du handoff)
   Table locale : aliment → composés suivis (FODMAP, gluten, histamine, caféine)
   Niveaux : h = élevé, m = modéré, l = faible.  window = délai d'apparition moyen (h).
   Étendable : ajouter une ligne dans RAW suffit. */

const COMPOUNDS = {
  gluten: { label: 'Gluten', desc: 'Blé, seigle, orge, avoine contaminée', window: 5, fodmap: false },
  fructanes: { label: 'Fructanes', desc: 'Blé, oignon, ail, certains légumes', window: 6, fodmap: true },
  galactanes: { label: 'Galactanes (GOS)', desc: 'Légumineuses, noix de cajou', window: 8, fodmap: true },
  lactose: { label: 'Lactose', desc: 'Produits laitiers', window: 2, fodmap: true },
  fructose: { label: 'Fructose (excès)', desc: 'Pomme, poire, miel, sirops', window: 4, fodmap: true },
  polyols: { label: 'Polyols', desc: 'Sorbitol/mannitol : fruits à noyau, champignons, édulcorants', window: 6, fodmap: true },
  histamine: { label: 'Histamine', desc: 'Fermentés, affinés, restes, conserves', window: 3, fodmap: false },
  caffeine: { label: 'Caféine', desc: 'Café, thé, cola, cacao', window: 2, fodmap: false },
};

// [ nom, catégorie, "composé:niveau …", aka? ]
const RAW = [
  // ══════════ Céréales & féculents ══════════
  ['Pain', 'Céréales & féculents', 'gluten:h fructanes:m', 'pain blanc,tartine'],
  ['Pain complet', 'Céréales & féculents', 'gluten:h fructanes:h'],
  ['Pain de seigle', 'Céréales & féculents', 'gluten:m fructanes:h'],
  ['Pain au levain', 'Céréales & féculents', 'gluten:m fructanes:l'],
  ['Pain sans gluten', 'Céréales & féculents', ''],
  ['Baguette', 'Céréales & féculents', 'gluten:h fructanes:m'],
  ['Pâtes', 'Céréales & féculents', 'gluten:h fructanes:m', 'spaghetti,macaroni,penne,tagliatelles'],
  ['Nouilles udon', 'Céréales & féculents', 'gluten:h'],
  ['Nouilles soba', 'Céréales & féculents', 'gluten:m'],
  ['Vermicelles de riz', 'Céréales & féculents', ''],
  ['Semoule', 'Céréales & féculents', 'gluten:h fructanes:m', 'couscous'],
  ['Boulgour', 'Céréales & féculents', 'gluten:h fructanes:m'],
  ['Épeautre', 'Céréales & féculents', 'gluten:h fructanes:h'],
  ['Petit épeautre', 'Céréales & féculents', 'gluten:h fructanes:h', 'kamut'],
  ['Orge', 'Céréales & féculents', 'gluten:m fructanes:h'],
  ['Seigle', 'Céréales & féculents', 'gluten:m fructanes:h'],
  ['Avoine', 'Céréales & féculents', 'fructanes:m', 'flocons avoine,porridge'],
  ['Riz', 'Céréales & féculents', '', 'riz blanc,riz basmati,riz complet,riz rond'],
  ['Farine de blé', 'Céréales & féculents', 'gluten:h fructanes:m'],
  ['Farine de riz', 'Céréales & féculents', ''],
  ['Farine de sarrasin', 'Céréales & féculents', ''],
  ['Farine de pois chiche', 'Céréales & féculents', 'galactanes:m'],
  ['Quinoa', 'Céréales & féculents', ''],
  ['Sarrasin', 'Céréales & féculents', ''],
  ['Millet', 'Céréales & féculents', ''],
  ['Amarante', 'Céréales & féculents', ''],
  ['Teff', 'Céréales & féculents', ''],
  ['Maïs', 'Céréales & féculents', 'fructanes:l', 'polenta'],
  ['Pomme de terre', 'Céréales & féculents', '', 'patate'],
  ['Patate douce', 'Céréales & féculents', 'polyols:m'],
  ['Igname', 'Céréales & féculents', ''],
  ['Manioc', 'Céréales & féculents', ''],
  ['Taro', 'Céréales & féculents', ''],
  ['Gnocchi', 'Céréales & féculents', 'gluten:h'],
  ['Chapelure', 'Céréales & féculents', 'gluten:h'],
  ['Granola', 'Céréales & féculents', 'fructanes:m fructose:m'],
  ['Céréales petit-déj', 'Céréales & féculents', 'gluten:m fructanes:m'],
  ['Cracottes', 'Céréales & féculents', 'gluten:h'],
  ['Biscottes', 'Céréales & féculents', 'gluten:h'],
  ['Crêpe (froment)', 'Céréales & féculents', 'gluten:h lactose:m'],
  ['Galette de riz', 'Céréales & féculents', ''],

  // ══════════ Légumes ══════════
  ['Oignon', 'Légumes', 'fructanes:h', 'oignon jaune,oignon rouge'],
  ['Échalote', 'Légumes', 'fructanes:h'],
  ['Ail', 'Légumes', 'fructanes:h', 'gousse ail'],
  ['Poireau', 'Légumes', 'fructanes:h'],
  ['Chou-fleur', 'Légumes', 'polyols:h'],
  ['Champignon', 'Légumes', 'polyols:h', 'champignons de paris'],
  ['Brocoli', 'Légumes', 'fructanes:m'],
  ['Chou', 'Légumes', 'fructanes:m', 'chou vert'],
  ['Chou rouge', 'Légumes', 'fructanes:m'],
  ['Chou romanesco', 'Légumes', 'fructanes:m'],
  ['Chou kale', 'Légumes', 'fructanes:l'],
  ['Choux de Bruxelles', 'Légumes', 'fructanes:m'],
  ['Asperge', 'Légumes', 'fructose:h fructanes:m'],
  ['Artichaut', 'Légumes', 'fructanes:h'],
  ['Betterave', 'Légumes', 'fructanes:m'],
  ['Petits pois', 'Légumes', 'galactanes:m fructose:m'],
  ['Haricot beurre', 'Légumes', ''],
  ['Maïs doux', 'Légumes', 'polyols:m'],
  ['Céleri', 'Légumes', 'polyols:m'],
  ['Poivron', 'Légumes', '', 'poivron rouge,poivron vert'],
  ['Piment', 'Légumes', ''],
  ['Courgette', 'Légumes', ''],
  ['Aubergine', 'Légumes', 'histamine:m'],
  ['Épinards', 'Légumes', 'histamine:m', 'epinard'],
  ['Blette', 'Légumes', ''],
  ['Cresson', 'Légumes', ''],
  ['Endive', 'Légumes', ''],
  ['Oseille', 'Légumes', ''],
  ['Tomate', 'Légumes', 'histamine:m', 'tomates,tomate cerise'],
  ['Concombre', 'Légumes', ''],
  ['Carotte', 'Légumes', ''],
  ['Radis', 'Légumes', ''],
  ['Navet', 'Légumes', ''],
  ['Panais', 'Légumes', ''],
  ['Topinambour', 'Légumes', 'fructanes:h'],
  ['Rutabaga', 'Légumes', 'fructanes:m'],
  ['Salsifis', 'Légumes', 'fructanes:m'],
  ['Salade', 'Légumes', '', 'laitue,salade verte,roquette,mâche'],
  ['Haricot vert', 'Légumes', ''],
  ['Courge', 'Légumes', 'polyols:m', 'potiron,butternut,patisson'],
  ['Chayote', 'Légumes', ''],
  ['Avocat', 'Légumes', 'polyols:m histamine:m'],
  ['Fenouil', 'Légumes', 'fructanes:m'],
  ['Gombo', 'Légumes', '', 'okra'],
  ['Cœur de palmier', 'Légumes', ''],
  ['Olive verte', 'Légumes', 'histamine:m'],
  ['Olive noire', 'Légumes', 'histamine:m'],
  ['Câpres', 'Légumes', 'histamine:m'],

  // ══════════ Légumineuses ══════════
  ['Lentilles', 'Légumineuses', 'galactanes:m', 'lentilles vertes,lentilles blondes'],
  ['Lentilles corail', 'Légumineuses', 'galactanes:m'],
  ['Pois cassés', 'Légumineuses', 'galactanes:m'],
  ['Pois chiches', 'Légumineuses', 'galactanes:h', 'pois chiche'],
  ['Falafel', 'Légumineuses', 'galactanes:h fructanes:m'],
  ['Haricots rouges', 'Légumineuses', 'galactanes:h'],
  ['Haricots blancs', 'Légumineuses', 'galactanes:h'],
  ['Haricots noirs', 'Légumineuses', 'galactanes:h'],
  ['Haricots pinto', 'Légumineuses', 'galactanes:h'],
  ['Flageolets', 'Légumineuses', 'galactanes:h'],
  ['Fèves', 'Légumineuses', 'galactanes:h'],
  ['Fèves de soja', 'Légumineuses', 'galactanes:m', 'edamame'],
  ['Tofu ferme', 'Légumineuses', '', 'tofu'],
  ['Tofu soyeux', 'Légumineuses', ''],
  ['Tempeh', 'Légumineuses', ''],
  ['Protéines de soja texturées', 'Légumineuses', 'galactanes:m'],
  ['Houmous', 'Légumineuses', 'galactanes:m fructanes:m'],

  // ══════════ Fruits ══════════
  ['Pomme', 'Fruits', 'fructose:h polyols:m'],
  ['Poire', 'Fruits', 'fructose:h polyols:h'],
  ['Coing', 'Fruits', 'fructose:m'],
  ['Mangue', 'Fruits', 'fructose:h'],
  ['Cerise', 'Fruits', 'fructose:m polyols:h'],
  ['Pêche', 'Fruits', 'polyols:h'],
  ['Abricot', 'Fruits', 'polyols:h'],
  ['Prune', 'Fruits', 'polyols:h'],
  ['Nectarine', 'Fruits', 'polyols:h'],
  ['Pastèque', 'Fruits', 'fructose:h fructanes:m polyols:m'],
  ['Raisin', 'Fruits', ''],
  ['Banane', 'Fruits', 'fructose:m'],
  ['Orange', 'Fruits', ''],
  ['Mandarine', 'Fruits', '', 'clémentine'],
  ['Pomelo', 'Fruits', ''],
  ['Citron', 'Fruits', ''],
  ['Citron vert', 'Fruits', ''],
  ['Fraise', 'Fruits', ''],
  ['Framboise', 'Fruits', ''],
  ['Mûre', 'Fruits', ''],
  ['Myrtille', 'Fruits', 'fructose:l'],
  ['Groseille', 'Fruits', ''],
  ['Cassis', 'Fruits', ''],
  ['Kiwi', 'Fruits', ''],
  ['Ananas', 'Fruits', ''],
  ['Melon', 'Fruits', ''],
  ['Figue', 'Fruits', 'fructose:h'],
  ['Datte', 'Fruits', 'fructose:h'],
  ['Raisins secs', 'Fruits', 'fructose:h fructanes:m'],
  ['Pruneaux', 'Fruits', 'polyols:h'],
  ['Grenade', 'Fruits', ''],
  ['Litchi', 'Fruits', 'polyols:m'],
  ['Fruit de la passion', 'Fruits', ''],
  ['Papaye', 'Fruits', ''],
  ['Goyave', 'Fruits', ''],
  ['Kaki', 'Fruits', 'fructose:m'],
  ['Nèfle', 'Fruits', ''],
  ['Physalis', 'Fruits', ''],
  ['Carambole', 'Fruits', ''],
  ['Rhubarbe', 'Fruits', 'fructose:m'],
  ['Noix de coco fraîche', 'Fruits', ''],
  ['Fruit à pain', 'Fruits', ''],

  // ══════════ Produits laitiers ══════════
  ['Lait', 'Produits laitiers', 'lactose:h', 'lait de vache,lait demi-écrémé'],
  ['Lait concentré', 'Produits laitiers', 'lactose:h'],
  ['Babeurre', 'Produits laitiers', 'lactose:h'],
  ['Yaourt', 'Produits laitiers', 'lactose:h'],
  ['Yaourt grec', 'Produits laitiers', 'lactose:m'],
  ['Yaourt au soja', 'Produits laitiers', ''],
  ['Yaourt à la coco', 'Produits laitiers', ''],
  ['Petit-suisse', 'Produits laitiers', 'lactose:h'],
  ['Faisselle', 'Produits laitiers', 'lactose:h'],
  ['Skyr', 'Produits laitiers', 'lactose:m'],
  ['Fromage blanc', 'Produits laitiers', 'lactose:h'],
  ['Fromage frais', 'Produits laitiers', 'lactose:h'],
  ['Crème fraîche', 'Produits laitiers', 'lactose:m', 'creme'],
  ['Crème épaisse', 'Produits laitiers', 'lactose:m'],
  ['Beurre', 'Produits laitiers', 'lactose:l'],
  ['Beurre demi-sel', 'Produits laitiers', 'lactose:l'],
  ['Glace', 'Produits laitiers', 'lactose:h', 'crème glacée'],
  ['Sorbet', 'Produits laitiers', ''],
  ['Ricotta', 'Produits laitiers', 'lactose:h'],
  ['Mascarpone', 'Produits laitiers', 'lactose:m'],
  ['Mozzarella', 'Produits laitiers', 'lactose:m'],
  ['Camembert', 'Produits laitiers', 'lactose:l histamine:m', 'brie'],
  ['Parmesan', 'Produits laitiers', 'lactose:l histamine:h'],
  ['Cheddar', 'Produits laitiers', 'lactose:l histamine:m'],
  ['Emmental', 'Produits laitiers', 'lactose:l'],
  ['Comté', 'Produits laitiers', 'lactose:l histamine:m'],
  ['Roquefort', 'Produits laitiers', 'lactose:l histamine:h', 'bleu'],
  ['Feta', 'Produits laitiers', 'lactose:m'],
  ['Fromage de chèvre', 'Produits laitiers', 'lactose:l'],
  ['Fromage sans lactose', 'Produits laitiers', ''],
  ['Lait sans lactose', 'Produits laitiers', ''],
  ['Lait de soja', 'Produits laitiers', 'galactanes:m'],
  ["Lait d'amande", 'Produits laitiers', ''],
  ["Lait d'avoine", 'Produits laitiers', 'fructanes:m'],
  ['Lait de coco', 'Produits laitiers', 'polyols:m'],
  ['Lait de riz', 'Produits laitiers', ''],
  ['Lait de cajou', 'Produits laitiers', 'galactanes:l'],
  ['Kéfir', 'Produits laitiers', 'lactose:m histamine:h'],

  // ══════════ Viandes & poissons ══════════
  ['Poulet', 'Viandes & poissons', ''],
  ['Bœuf', 'Viandes & poissons', '', 'steak,steak haché'],
  ['Porc', 'Viandes & poissons', ''],
  ['Veau', 'Viandes & poissons', ''],
  ['Agneau', 'Viandes & poissons', ''],
  ['Dinde', 'Viandes & poissons', ''],
  ['Canard', 'Viandes & poissons', ''],
  ['Lapin', 'Viandes & poissons', ''],
  ['Gibier', 'Viandes & poissons', ''],
  ['Foie', 'Viandes & poissons', 'histamine:m'],
  ['Jambon blanc', 'Viandes & poissons', 'histamine:m', 'jambon'],
  ['Saucisson', 'Viandes & poissons', 'histamine:h', 'charcuterie'],
  ['Lardons', 'Viandes & poissons', 'histamine:m', 'bacon'],
  ['Saucisse', 'Viandes & poissons', 'histamine:m gluten:m'],
  ['Chorizo', 'Viandes & poissons', 'histamine:h'],
  ['Mortadelle', 'Viandes & poissons', 'histamine:h'],
  ['Merguez', 'Viandes & poissons', 'histamine:m'],
  ['Andouillette', 'Viandes & poissons', 'histamine:h'],
  ['Boudin noir', 'Viandes & poissons', 'histamine:h'],
  ['Rillettes', 'Viandes & poissons', 'histamine:m'],
  ['Pâté', 'Viandes & poissons', 'histamine:m'],
  ['Terrine', 'Viandes & poissons', 'histamine:m'],
  ['Nuggets de poulet', 'Viandes & poissons', 'gluten:m'],
  ['Poisson blanc', 'Viandes & poissons', '', 'cabillaud,colin,lieu noir,merlan'],
  ['Saumon', 'Viandes & poissons', ''],
  ['Truite', 'Viandes & poissons', ''],
  ['Bar', 'Viandes & poissons', '', 'loup'],
  ['Dorade', 'Viandes & poissons', ''],
  ['Sole', 'Viandes & poissons', ''],
  ['Thon', 'Viandes & poissons', 'histamine:h', 'thon en conserve'],
  ['Maquereau', 'Viandes & poissons', 'histamine:h', 'sardine'],
  ['Anchois', 'Viandes & poissons', 'histamine:h'],
  ['Hareng', 'Viandes & poissons', 'histamine:h', 'rollmops'],
  ['Poisson fumé', 'Viandes & poissons', 'histamine:h', 'saumon fumé'],
  ['Surimi', 'Viandes & poissons', ''],
  ['Tarama', 'Viandes & poissons', 'histamine:m'],
  ['Crevettes', 'Viandes & poissons', 'histamine:m', 'fruits de mer'],
  ['Moules', 'Viandes & poissons', 'histamine:m'],
  ['Huîtres', 'Viandes & poissons', 'histamine:m'],
  ['Palourdes', 'Viandes & poissons', 'histamine:m'],
  ['Calamar', 'Viandes & poissons', ''],
  ['Poulpe', 'Viandes & poissons', ''],
  ['Escargot', 'Viandes & poissons', ''],
  ['Œuf', 'Viandes & poissons', '', 'oeuf,oeufs'],

  // ══════════ Oléagineux ══════════
  ['Amande', 'Oléagineux', 'galactanes:m'],
  ["Purée d'amande", 'Oléagineux', 'galactanes:m'],
  ['Noix de cajou', 'Oléagineux', 'galactanes:h fructanes:h'],
  ['Purée de cajou', 'Oléagineux', 'galactanes:h fructanes:h'],
  ['Pistache', 'Oléagineux', 'galactanes:h fructanes:h'],
  ['Noisette', 'Oléagineux', 'galactanes:l'],
  ['Noix', 'Oléagineux', ''],
  ['Noix du Brésil', 'Oléagineux', ''],
  ['Noix de macadamia', 'Oléagineux', ''],
  ['Cacahuète', 'Oléagineux', '', 'arachide'],
  ['Beurre de cacahuète', 'Oléagineux', ''],
  ['Graines de courge', 'Oléagineux', '', 'graines tournesol'],
  ['Graines de sésame', 'Oléagineux', ''],
  ['Tahini', 'Oléagineux', ''],
  ['Graines de chia', 'Oléagineux', ''],
  ['Graines de lin', 'Oléagineux', ''],

  // ══════════ Condiments & épices ══════════
  ['Sel', 'Condiments & épices', ''],
  ['Poivre', 'Condiments & épices', ''],
  ['Miel', 'Condiments & épices', 'fructose:h'],
  ["Sirop d'agave", 'Condiments & épices', 'fructose:h'],
  ["Sirop d'érable", 'Condiments & épices', ''],
  ['Sirop de maïs', 'Condiments & épices', 'fructose:h'],
  ['Sucre', 'Condiments & épices', '', 'sucre blanc'],
  ['Caramel', 'Condiments & épices', 'fructose:m'],
  ['Chocolat noir', 'Condiments & épices', 'caffeine:m'],
  ['Chocolat au lait', 'Condiments & épices', 'lactose:m caffeine:l'],
  ['Cacao', 'Condiments & épices', 'caffeine:m'],
  ['Pâte à tartiner', 'Condiments & épices', 'lactose:l fructose:m'],
  ['Confiture', 'Condiments & épices', 'fructose:m'],
  ['Ketchup', 'Condiments & épices', 'fructose:m histamine:m'],
  ['Moutarde', 'Condiments & épices', ''],
  ['Mayonnaise', 'Condiments & épices', ''],
  ['Aïoli', 'Condiments & épices', 'fructanes:m'],
  ['Vinaigre', 'Condiments & épices', 'histamine:h', 'vinaigre balsamique'],
  ['Sauce soja', 'Condiments & épices', 'gluten:m histamine:h'],
  ['Sauce nuoc-mâm', 'Condiments & épices', 'histamine:m'],
  ['Sauce tomate', 'Condiments & épices', 'histamine:h fructose:m', 'tomates concassées,coulis'],
  ['Sauce barbecue', 'Condiments & épices', 'fructose:m histamine:m'],
  ['Sauce hollandaise', 'Condiments & épices', 'lactose:m'],
  ['Béchamel', 'Condiments & épices', 'gluten:m lactose:m'],
  ['Tapenade', 'Condiments & épices', 'histamine:m'],
  ['Chutney', 'Condiments & épices', 'fructose:h'],
  ['Bouillon cube', 'Condiments & épices', 'fructanes:m gluten:l'],
  ['Curry', 'Condiments & épices', 'fructanes:m', 'pâte de curry'],
  ['Harissa', 'Condiments & épices', ''],
  ['Wasabi', 'Condiments & épices', ''],
  ['Raifort', 'Condiments & épices', ''],
  ['Pesto', 'Condiments & épices', 'fructanes:m'],
  ['Levure', 'Condiments & épices', 'histamine:m'],
  ['Levure chimique', 'Condiments & épices', ''],
  ['Bicarbonate', 'Condiments & épices', ''],
  ['Gélatine', 'Condiments & épices', ''],
  ['Agar-agar', 'Condiments & épices', ''],
  ['Fécule de maïs', 'Condiments & épices', ''],
  ['Cornichon', 'Condiments & épices', 'histamine:h'],
  ['Gingembre', 'Condiments & épices', ''],
  ['Cumin', 'Condiments & épices', '', 'curcuma,paprika,coriandre en poudre'],
  ['Origan', 'Condiments & épices', '', 'basilic,thym,romarin,persil,ciboulette,menthe,laurier'],
  ['Vanille', 'Condiments & épices', ''],
  ['Cannelle', 'Condiments & épices', ''],
  ['Muscade', 'Condiments & épices', ''],
  ['Piment de Cayenne', 'Condiments & épices', ''],
  ["Huile d'olive", 'Condiments & épices', ''],

  // ══════════ Boissons ══════════
  ['Café', 'Boissons', 'caffeine:h'],
  ['Café décaféiné', 'Boissons', 'caffeine:l'],
  ['Thé noir', 'Boissons', 'caffeine:m'],
  ['Thé vert', 'Boissons', 'caffeine:m'],
  ['Tisane', 'Boissons', ''],
  ['Infusion gingembre-citron', 'Boissons', ''],
  ['Cola', 'Boissons', 'caffeine:m fructose:m'],
  ['Boisson énergisante', 'Boissons', 'caffeine:h fructose:m'],
  ['Eau gazeuse', 'Boissons', ''],
  ['Eau aromatisée', 'Boissons', ''],
  ['Jus de pomme', 'Boissons', 'fructose:h'],
  ["Jus d'orange", 'Boissons', 'fructose:m'],
  ['Jus de raisin', 'Boissons', 'fructose:h'],
  ['Jus de citron', 'Boissons', ''],
  ['Jus de tomate', 'Boissons', 'histamine:m'],
  ['Jus de canneberge', 'Boissons', 'fructose:m'],
  ['Smoothie fruits rouges', 'Boissons', 'fructose:m'],
  ['Chocolat chaud', 'Boissons', 'lactose:m caffeine:l'],
  ['Lait fermenté', 'Boissons', 'lactose:l histamine:m'],
  ['Sirop de menthe', 'Boissons', '', 'sirop de grenadine'],
  ['Limonade', 'Boissons', 'fructose:m'],
  ['Bière', 'Boissons', 'gluten:m fructanes:m histamine:h'],
  ['Cidre', 'Boissons', 'histamine:m'],
  ['Vin rouge', 'Boissons', 'histamine:h'],
  ['Vin blanc', 'Boissons', 'histamine:m'],
  ['Champagne', 'Boissons', 'histamine:m'],
  ['Whisky', 'Boissons', ''],
  ['Rhum', 'Boissons', ''],
  ['Vodka', 'Boissons', ''],
  ['Sangria', 'Boissons', 'histamine:h fructose:m'],
  ['Kombucha', 'Boissons', 'histamine:h'],

  // ══════════ Sucré & pâtisserie ══════════
  ['Gâteau', 'Sucré & pâtisserie', 'gluten:h lactose:m fructose:m'],
  ['Biscuit', 'Sucré & pâtisserie', 'gluten:h fructose:m'],
  ['Croissant', 'Sucré & pâtisserie', 'gluten:h lactose:m fructanes:m', 'viennoiserie,pain au chocolat'],
  ['Tarte aux pommes', 'Sucré & pâtisserie', 'gluten:h fructose:h'],
  ['Muffin', 'Sucré & pâtisserie', 'gluten:h lactose:m fructose:m'],
  ['Cookie', 'Sucré & pâtisserie', 'gluten:h lactose:m fructose:m'],
  ['Brownie', 'Sucré & pâtisserie', 'gluten:h lactose:m'],
  ['Beignet', 'Sucré & pâtisserie', 'gluten:h fructose:m'],
  ['Crêpe sucrée', 'Sucré & pâtisserie', 'gluten:h lactose:m'],
  ['Gaufre', 'Sucré & pâtisserie', 'gluten:h lactose:m'],
  ['Madeleine', 'Sucré & pâtisserie', 'gluten:h lactose:m'],
  ['Financier', 'Sucré & pâtisserie', 'gluten:h lactose:m galactanes:m'],
  ['Cannelé', 'Sucré & pâtisserie', 'gluten:h lactose:m'],
  ['Tiramisu', 'Sucré & pâtisserie', 'gluten:m lactose:h caffeine:l'],
  ['Panna cotta', 'Sucré & pâtisserie', 'lactose:h'],
  ['Flan', 'Sucré & pâtisserie', 'lactose:h gluten:l'],
  ['Crème brûlée', 'Sucré & pâtisserie', 'lactose:h'],
  ['Mousse au chocolat', 'Sucré & pâtisserie', 'lactose:m'],
  ['Nougat', 'Sucré & pâtisserie', 'fructose:m galactanes:m'],
  ['Caramel mou', 'Sucré & pâtisserie', 'lactose:m fructose:m'],
  ['Bonbon gélifié', 'Sucré & pâtisserie', 'fructose:m'],
  ['Chewing-gum sans sucre', 'Sucré & pâtisserie', 'polyols:h', 'bonbon sans sucre'],
  ['Barre chocolatée', 'Sucré & pâtisserie', 'gluten:m lactose:m fructose:m'],
  ['Céréales chocolatées', 'Sucré & pâtisserie', 'gluten:m fructose:m'],
  ["Pain d'épices", 'Sucré & pâtisserie', 'gluten:h fructose:m'],
  ['Spéculoos', 'Sucré & pâtisserie', 'gluten:h fructose:m'],
  ['Macaron', 'Sucré & pâtisserie', 'galactanes:m fructose:m'],

  // ══════════ Plats préparés & fast-food ══════════
  ['Pizza', 'Plats préparés & fast-food', 'gluten:h lactose:m histamine:m'],
  ['Pâte à pizza', 'Plats préparés & fast-food', 'gluten:h fructanes:m'],
  ['Burger', 'Plats préparés & fast-food', 'gluten:h lactose:m histamine:m'],
  ['Frites', 'Plats préparés & fast-food', ''],
  ['Hot-dog', 'Plats préparés & fast-food', 'gluten:h histamine:m'],
  ['Kebab', 'Plats préparés & fast-food', 'gluten:h fructanes:m'],
  ['Nems', 'Plats préparés & fast-food', 'gluten:m'],
  ['Ravioles', 'Plats préparés & fast-food', 'gluten:h lactose:m'],
  ['Lasagnes', 'Plats préparés & fast-food', 'gluten:h lactose:h histamine:m'],
  ['Quiche', 'Plats préparés & fast-food', 'gluten:h lactose:m'],
  ['Sushi', 'Plats préparés & fast-food', ''],
  ['Maki', 'Plats préparés & fast-food', ''],
  ['Poke bowl', 'Plats préparés & fast-food', ''],
  ['Wrap', 'Plats préparés & fast-food', 'gluten:h fructanes:m'],
  ['Burrito', 'Plats préparés & fast-food', 'gluten:h galactanes:m'],
  ['Tacos', 'Plats préparés & fast-food', 'gluten:m'],
  ['Paella', 'Plats préparés & fast-food', 'histamine:m'],
  ['Risotto', 'Plats préparés & fast-food', 'fructanes:m lactose:m'],
  ['Tajine', 'Plats préparés & fast-food', 'fructanes:m'],
  ['Curry de légumes', 'Plats préparés & fast-food', 'fructanes:m'],
  ['Soupe miso', 'Plats préparés & fast-food', 'galactanes:m histamine:m'],
  ['Bouillon de poule', 'Plats préparés & fast-food', 'fructanes:l'],
  ['Velouté de légumes', 'Plats préparés & fast-food', 'fructanes:m lactose:m'],
  ['Gratin dauphinois', 'Plats préparés & fast-food', 'lactose:h'],
  ['Purée de pomme de terre', 'Plats préparés & fast-food', 'lactose:m'],
  ['Salade César', 'Plats préparés & fast-food', 'gluten:m lactose:m histamine:m'],
  ['Sandwich club', 'Plats préparés & fast-food', 'gluten:h lactose:m histamine:m'],
  ['Naan', 'Plats préparés & fast-food', 'gluten:h lactose:m'],
  ['Pita', 'Plats préparés & fast-food', 'gluten:h fructanes:m'],
  ['Chapati', 'Plats préparés & fast-food', 'gluten:h'],
  ['Tortilla de maïs', 'Plats préparés & fast-food', ''],
  ['Tortilla de blé', 'Plats préparés & fast-food', 'gluten:h fructanes:m'],

  // ══════════ Substituts & alternatives ══════════
  ['Seitan', 'Substituts & alternatives', 'gluten:h'],
  ['Steak végétal', 'Substituts & alternatives', 'gluten:m galactanes:m'],
  ['Simili-viande', 'Substituts & alternatives', 'gluten:m galactanes:m'],
  ['Beurre végétal', 'Substituts & alternatives', ''],
  ['Œuf végétal', 'Substituts & alternatives', 'galactanes:m'],
  ['Protéine de pois', 'Substituts & alternatives', ''],

  // ══════════ Additifs & compléments ══════════
  ['Édulcorant (aspartame)', 'Additifs & compléments', ''],
  ['Sorbitol (E420)', 'Additifs & compléments', 'polyols:h'],
  ['Xylitol', 'Additifs & compléments', 'polyols:h'],
  ['Mannitol (E421)', 'Additifs & compléments', 'polyols:h'],
  ['Glutamate (E621)', 'Additifs & compléments', 'histamine:l'],
  ['Psyllium', 'Additifs & compléments', ''],
  ["Son d'avoine", 'Additifs & compléments', 'fructanes:l'],
  ['Graines de lin moulues', 'Additifs & compléments', ''],
  ['Spiruline', 'Additifs & compléments', ''],
  ['Protéine en poudre (whey)', 'Additifs & compléments', 'lactose:m'],
  ['Protéine en poudre (végétale)', 'Additifs & compléments', 'galactanes:m'],
];

function strip(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function sing(w) {
  return w.length > 4 && /s$/.test(w) ? w.slice(0, -1) : w;
}
function words(s) {
  return strip(s).split(' ').filter(Boolean).map(sing);
}

const FOODS = RAW.map(function (r) {
  const comps = (r[2] || '')
    .split(' ')
    .filter(Boolean)
    .map(function (t) {
      const p = t.split(':');
      return { id: p[0], level: p[1] || 'm' };
    })
    .filter(function (c) {
      return COMPOUNDS[c.id];
    });
  return {
    name: r[0],
    category: r[1],
    compounds: comps,
    aka: (r[3] || '')
      .split(',')
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean),
    _keys: [words(r[0])].concat((r[3] || '').split(',').filter(Boolean).map(words)),
  };
});

const EXACT = {};
FOODS.forEach(function (f) {
  EXACT[strip(f.name)] = f;
  f.aka.forEach(function (a) {
    EXACT[strip(a)] = f;
  });
});

function lookup(query) {
  const q = strip(query);
  if (!q) return null;
  if (EXACT[q]) return EXACT[q];
  const qw = words(query);
  let best = null,
    bestLen = 0;
  FOODS.forEach(function (f) {
    f._keys.forEach(function (kw) {
      if (
        kw.length &&
        kw.every(function (w) {
          return qw.indexOf(w) >= 0;
        }) &&
        kw.length > bestLen
      ) {
        best = f;
        bestLen = kw.length;
      }
    });
  });
  return best;
}

function counts() {
  const byCat = {};
  FOODS.forEach(function (f) {
    byCat[f.category] = (byCat[f.category] || 0) + 1;
  });
  return byCat;
}

// Extract every food mentioned in a free-text sentence (used for speech-to-text).
// A food matches when one of its key phrases (name or alias, singularised) is
// fully contained in the sentence's words. Longer phrases win over their parts.
function extract(text) {
  const qw = words(text);
  if (!qw.length) return [];
  const hits = [];
  const seen = {};
  FOODS.forEach(function (f) {
    let best = 0;
    f._keys.forEach(function (kw) {
      if (
        kw.length &&
        kw.every(function (w) {
          return qw.indexOf(w) >= 0;
        }) &&
        kw.length > best
      ) {
        best = kw.length;
      }
    });
    if (best && !seen[f.name]) {
      seen[f.name] = 1;
      hits.push({ food: f, score: best });
    }
  });
  return hits.sort(function (a, b) { return b.score - a.score; }).map(function (h) { return h.food; });
}

const OBELIX_FOODS = {
  version: '2.0-seed',
  compounds: COMPOUNDS,
  foods: FOODS,
  categories: Object.keys(counts()),
  count: FOODS.length,
  lookup: lookup,
  extract: extract,
  tags: function (name) {
    const f = lookup(name);
    return f ? f.compounds.slice() : [];
  },
};

export default OBELIX_FOODS;
