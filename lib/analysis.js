// Obélix — moteur d'analyse. Tout est calculé à partir des journées réellement
// enregistrées (repas + gênes + contexte), aucune valeur codée en dur.
//
// Une "journée" : { meals:[{ time, compounds:[id], foods:[nom] }],
//                   genes:[{ time, compounds:[id] }], ok:bool,
//                   phase:'regles'|…, waterLevel:'low'|'ok'|'good'|null }

export const COMPOUND_IDS = ['gluten', 'fructanes', 'galactanes', 'lactose', 'fructose', 'polyols', 'histamine', 'caffeine'];

const cap = (c) => c.charAt(0).toUpperCase() + c.slice(1);

// Est-ce qu'un composé d'un repas tombe dans sa fenêtre avant une gêne ?
function mealHitsGene(meal, gene, compound, windows) {
  if ((meal.compounds || []).indexOf(compound) < 0) return false;
  const w = (windows && windows[compound]) || 6;
  return gene.time >= meal.time && gene.time <= meal.time + w;
}

// Corrélation jour-avec / jour-sans pour un composé donné.
function compoundCorrelation(days, compound) {
  let ate = 0, ateGene = 0, notAte = 0, notGene = 0;
  days.forEach((d) => {
    const has = (d.meals || []).some((m) => (m.compounds || []).indexOf(compound) >= 0);
    const gene = (d.genes || []).length > 0;
    if (has) { ate++; if (gene) ateGene++; }
    else { notAte++; if (gene) notGene++; }
  });
  const avec = ate ? Math.round((ateGene / ate) * 100) : 0;
  const sans = notAte ? Math.round((notGene / notAte) * 100) : 0;
  return { ate, avec, sans, delta: avec - sans, geneDaysAte: ateGene };
}

// Corrélation par aliment (nom exact tel que loggé).
function foodCorrelation(days, name) {
  let ate = 0, ateGene = 0, notAte = 0, notGene = 0;
  days.forEach((d) => {
    const has = (d.meals || []).some((m) => (m.foods || []).indexOf(name) >= 0);
    const gene = (d.genes || []).length > 0;
    if (has) { ate++; if (gene) ateGene++; }
    else { notAte++; if (gene) notGene++; }
  });
  const avec = ate ? Math.round((ateGene / ate) * 100) : 0;
  const sans = notAte ? Math.round((notGene / notAte) * 100) : 0;
  return { name, ate, avec, sans, delta: avec - sans };
}

function levelFromCorr(c) {
  if (c.ate < 3) return 'données insuffisantes';
  if (c.avec >= 55 && c.delta >= 25) return 'élevé';
  if (c.avec >= 38 && c.delta >= 10) return 'à surveiller';
  if (c.delta <= 4) return 'écarté';
  return 'faible';
}

export function analyze(days, windows) {
  let totalMeals = 0, totalGenes = 0, geneDays = 0, okDays = 0, reglesGenes = 0, waterLowGenes = 0, waterDaysLogged = 0, waterLowDays = 0;
  days.forEach((d) => {
    totalMeals += (d.meals || []).length;
    const genes = d.genes || [];
    totalGenes += genes.length;
    if (genes.length) geneDays++;
    else if (d.ok) okDays++;
    if (d.waterLevel) { waterDaysLogged++; if (d.waterLevel === 'low') waterLowDays++; }
    if (genes.length && d.phase === 'regles') reglesGenes += genes.length;
    if (genes.length && d.waterLevel === 'low') waterLowGenes += genes.length;
  });

  const comp = {};
  COMPOUND_IDS.forEach((c) => { comp[c] = compoundCorrelation(days, c); });

  // Suspect principal : composé avec assez de données et le meilleur écart.
  const ranked = COMPOUND_IDS.filter((c) => comp[c].ate >= 3 && comp[c].delta > 5)
    .sort((a, b) => comp[b].delta - comp[a].delta);
  const topSuspect = ranked[0] || null;

  // Aliments suivis : ceux vus assez souvent, triés par écart.
  const foodNames = {};
  days.forEach((d) => (d.meals || []).forEach((m) => (m.foods || []).forEach((n) => { foodNames[n] = (foodNames[n] || 0) + 1; })));
  const foodStats = Object.keys(foodNames)
    .map((n) => foodCorrelation(days, n))
    .filter((f) => f.ate >= 2)
    .sort((a, b) => b.delta - a.delta || b.ate - a.ate);

  const confidence = totalMeals >= 20 ? 'modérée' : totalMeals >= 12 ? 'faible' : 'très faible';

  return {
    totalMeals, totalGenes, geneDays, okDays, reglesGenes, waterLowGenes, waterDaysLogged, waterLowDays,
    comp, topSuspect, foodStats, confidence,
    levelFromCorr,
    cap,
  };
}

// Estimation de digestibilité d'un repas à partir de ses composés.
export function digest(meal) {
  const comps = meal ? meal.compounds || [] : [];
  const heavy = comps.filter((c) => ['gluten', 'lactose', 'galactanes'].indexOf(c) >= 0).length;
  const irritants = comps.length;
  const hours = Math.min(9, 4 + heavy + Math.max(0, irritants - heavy) * 0.5);
  const easy = irritants <= 1 && heavy === 0;
  const note = easy
    ? "Peu de composés irritants — l'estomac devrait se vider assez vite."
    : heavy >= 2
    ? 'Repas dense (gluten/lactose) — digestion plutôt lente.'
    : 'Digestion moyenne — quelques composés à surveiller.';
  return { hours: Math.round(hours), easy, note };
}

// Prévision des fenêtres à risque pour un repas.
export function predict(meal, windows, comp) {
  const comps = meal ? meal.compounds || [] : [];
  const d = digest(meal);
  // suspect principal de CE repas = composé présent avec le plus fort écart connu
  let main = null, mainDelta = -1;
  comps.forEach((c) => {
    const delta = comp && comp[c] ? comp[c].delta : 0;
    if (delta > mainDelta) { mainDelta = delta; main = c; }
  });
  return {
    hasRisk: comps.length > 0,
    compounds: comps,
    digestHours: d.hours,
    easy: d.easy,
    digestNote: d.note,
    mainSuspect: main,
    mainWindow: main ? (windows && windows[main]) || 6 : null,
  };
}

export { cap };
