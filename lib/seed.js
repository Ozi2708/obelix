// Historique de départ (≈10 jours de Manon) sur lequel le moteur d'analyse
// calcule réellement. Ce que l'utilisateur logue ensuite s'y ajoute — rien
// n'est codé en dur dans l'écran d'analyse.
//
// Chaque repas porte ses `compounds` (composés suivis) et ses `foods` (aliments)
// pour permettre les corrélations composé-par-composé et aliment-par-aliment.

function meal(name, desc, icon, time, timeLabel, compounds, foods) {
  return { name, desc, icon, time, timeLabel, compounds, foods };
}
function gene(time, timeLabel, intensity, compounds) {
  return { time, timeLabel, intensity: intensity || 'moyen', compounds: compounds || [] };
}

// day(label, date, phase, water, meals, genes, ok)
function day(dayLabel, dateLabel, phase, waterLevel, meals, genes, ok) {
  return { dayLabel, dateLabel, phase, waterLevel, meals, genes, ok: !!ok };
}

const B = 'ph-coffee', L = 'ph-bowl-food', D = 'ph-cooking-pot';

// Ordre : du plus ancien au plus récent. Les deux derniers = mardi 2 / mercredi 3.
export const SEED_HISTORY = [
  day('lun. 24', 'lundi 24 juin', 'follic', 'ok',
    [
      meal('Petit-déjeuner', 'Tartines beurre, café', B, 7.8, '07:50', ['gluten', 'fructanes', 'caffeine'], ['Pain', 'Beurre', 'Café']),
      meal('Déjeuner', 'Pâtes bolognaise', L, 12.8, '12:50', ['gluten', 'fructanes'], ['Pâtes', 'Oignon', 'Tomate']),
      meal('Dîner', 'Riz, poulet, courgette', D, 19.6, '19:35', [], ['Riz', 'Poulet', 'Courgette']),
    ],
    [gene(16.0, '16:00', 'moyen', ['gluten'])], false),

  day('mar. 25', 'mardi 25 juin', 'follic', 'good',
    [
      meal('Petit-déjeuner', 'Yaourt, fruits', B, 8.1, '08:05', ['lactose'], ['Yaourt', 'Fraise']),
      meal('Déjeuner', 'Salade riz thon', L, 12.5, '12:30', [], ['Riz', 'Thon', 'Salade']),
      meal('Dîner', 'Omelette, haricots verts', D, 19.8, '19:50', [], ['Œuf', 'Haricot vert']),
    ],
    [], true),

  day('jeu. 27', 'jeudi 27 juin', 'ovul', 'low',
    [
      meal('Petit-déjeuner', 'Pain complet, confiture', B, 7.9, '07:55', ['gluten', 'fructanes', 'fructose'], ['Pain complet', 'Confiture']),
      meal('Déjeuner', 'Sandwich jambon', L, 13.0, '13:00', ['gluten', 'histamine'], ['Pain', 'Jambon blanc']),
      meal('Dîner', 'Pizza', D, 20.1, '20:05', ['gluten', 'lactose'], ['Pizza', 'Tomate', 'Mozzarella']),
    ],
    [gene(17.5, '17:30', 'fort', ['gluten'])], false),

  day('ven. 28', 'vendredi 28 juin', 'ovul', 'ok',
    [
      meal('Petit-déjeuner', 'Flocons avoine, banane', B, 8.0, '08:00', ['fructanes', 'fructose'], ['Avoine', 'Banane']),
      meal('Déjeuner', 'Poke bowl saumon', L, 12.6, '12:35', [], ['Riz', 'Saumon', 'Avocat']),
      meal('Dîner', 'Soupe, tartine fromage', D, 19.9, '19:55', ['gluten', 'lactose'], ['Pain', 'Comté']),
    ],
    [gene(22.5, '22:30', 'leger', ['lactose'])], false),

  day('sam. 29', 'samedi 29 juin', 'lutea', 'good',
    [
      meal('Petit-déjeuner', 'Œufs brouillés', B, 9.0, '09:00', [], ['Œuf', 'Beurre']),
      meal('Déjeuner', 'Salade César', L, 12.9, '12:55', ['gluten', 'lactose', 'histamine'], ['Salade', 'Poulet', 'Parmesan']),
      meal('Dîner', 'Curry légumes, riz', D, 20.0, '20:00', ['fructanes'], ['Riz', 'Oignon', 'Ail']),
    ],
    [], true),

  day('dim. 30', 'dimanche 30 juin', 'lutea', 'ok',
    [
      meal('Petit-déjeuner', 'Yaourt, granola, miel', B, 8.3, '08:20', ['lactose', 'fructanes', 'fructose'], ['Yaourt', 'Granola', 'Miel']),
      meal('Déjeuner', 'Pâtes pesto', L, 13.1, '13:05', ['gluten', 'fructanes'], ['Pâtes', 'Pesto', 'Parmesan']),
      meal('Dîner', 'Poisson, pommes de terre', D, 19.7, '19:40', [], ['Poisson blanc', 'Pomme de terre']),
    ],
    [gene(16.5, '16:30', 'moyen', ['gluten'])], false),

  day('lun. 1', 'lundi 1 juillet', 'regles', 'low',
    [
      meal('Petit-déjeuner', 'Croissant, café', B, 7.7, '07:45', ['gluten', 'lactose', 'fructanes', 'caffeine'], ['Croissant', 'Café']),
      meal('Déjeuner', 'Burger frites', L, 12.7, '12:45', ['gluten', 'lactose', 'histamine'], ['Burger', 'Frites']),
      meal('Dîner', 'Salade verte, riz', D, 19.5, '19:30', [], ['Salade', 'Riz']),
    ],
    [gene(15.5, '15:30', 'fort', ['gluten'])], false),

  day('mar. 2', 'mardi 2 juillet', 'regles', 'ok',
    [
      meal('Petit-déjeuner', 'Smoothie banane, avoine', B, 8.5, '08:30', ['fructanes', 'fructose'], ['Banane', 'Avoine']),
      meal('Déjeuner', 'Salade riz thon', L, 12.5, '12:30', [], ['Riz', 'Thon', 'Tomate']),
      meal('Dîner', 'Omelette, salade', D, 19.75, '19:45', [], ['Œuf', 'Salade']),
    ],
    [], true),

  day('mer. 3', 'mercredi 3 juillet', 'regles', 'low',
    [
      meal('Petit-déjeuner', 'Tartines beurre, café', B, 7.83, '07:50', ['gluten', 'fructanes', 'caffeine'], ['Pain', 'Beurre', 'Café']),
      meal('Déjeuner', 'Pâtes carbonara', L, 13.08, '13:05', ['gluten', 'lactose'], ['Pâtes', 'Lardons', 'Parmesan', 'Œuf']),
      meal('Dîner', 'Soupe, pain complet', D, 20.16, '20:10', ['gluten', 'fructanes'], ['Pain complet', 'Oignon']),
    ],
    [gene(16.75, '16:45', 'fort', ['gluten'])], false),
];

// Vues "jour passé" pour le Journal (offset -1 = mercredi 3, -2 = mardi 2).
export function pastDayView(history, offset) {
  const idx = history.length + offset; // -1 → dernier
  const d = history[idx];
  if (!d) return null;
  return {
    meals: d.meals,
    gene: d.genes && d.genes.length ? { time: d.genes[0].timeLabel, text: geneText(d) } : null,
    ok: d.ok,
  };
}

function geneText(d) {
  const g = d.genes[0];
  const c = (g.compounds && g.compounds[0]) || null;
  // retrouve le repas responsable
  let culprit = null;
  d.meals.forEach((m) => {
    if (c && (m.compounds || []).indexOf(c) >= 0 && g.time >= m.time) culprit = m;
  });
  const label = g.intensity === 'fort' ? 'gêne forte' : g.intensity === 'leger' ? 'gêne légère' : 'gêne modérée';
  if (c && culprit) return label + ' · reliée au ' + c + ' (' + culprit.name + ' ' + culprit.timeLabel + ')';
  return label + ' · notée comme isolée';
}
