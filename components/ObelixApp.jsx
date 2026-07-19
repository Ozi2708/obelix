'use client';

import { useEffect, useRef, useState } from 'react';
import ImageSlot from './ImageSlot';
import PhoneFrame from './PhoneFrame';
import CameraScanner from './CameraScanner';
import VoiceCapture from './VoiceCapture';
import OBELIX_FOODS from '../lib/foodDb';

/* Convert a CSS declaration string ("prop:val;prop:val") into a React style
   object, so the design-handoff inline styles can be ported verbatim. */
function css(str) {
  if (!str) return undefined;
  const obj = {};
  String(str)
    .split(';')
    .forEach((decl) => {
      const i = decl.indexOf(':');
      if (i < 0) return;
      const prop = decl.slice(0, i).trim();
      const val = decl.slice(i + 1).trim();
      if (!prop) return;
      const key = prop.startsWith('--')
        ? prop
        : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      obj[key] = val;
    });
  return obj;
}

const INITIAL = {
  screen: 'onboarding',
  obStep: 0,
  obSymptoms: [
    { name: 'Ballonnements', on: true }, { name: 'Crampes', on: true }, { name: 'Reflux', on: false },
    { name: 'Migraines', on: false }, { name: 'Fatigue', on: false }, { name: 'Nausées', on: false }, { name: 'Peau', on: false },
  ],
  obSuspects: [
    { name: 'Gluten', on: true }, { name: 'Lactose', on: true }, { name: 'Oignon / ail', on: false },
    { name: 'Café', on: false }, { name: 'Alcool', on: false }, { name: 'Aucune idée', on: false },
  ],
  obCycleOn: true,
  windows: { gluten: 5, lactose: 2, fructanes: 6, galactanes: 8, polyols: 6, histamine: 3, fructose: 4, caffeine: 2 },
  pendingMeal: { name: 'Déjeuner', desc: 'Sandwich poulet, salade', icon: 'ph-hamburger', src: 'voice' },
  photoStage: 'pick',
  captureTab: 'voice',
  barcodeInput: '', barcodeStage: 'scan', barcodeProduct: null, barcodeSource: null,
  toast: null, confirmWipe: false, addedCount: 0,
  periodDuration: 5,
  push: null,
  notifs: [
    { id: 'n1', icon: 'ph-timer', color: 'watch', title: 'Fenêtre à risque · gluten', text: 'Pâtes du midi — surveillance jusque ~17:40.', time: '13:40', read: false, action: 'now' },
    { id: 'n2', icon: 'ph-bell-ringing', color: 'good', title: 'Bilan du soir · 21:00', text: 'Aucune gêne aujourd\'hui ? Confirme en 1 tap — et un mot sur ton hydratation.', time: 'hier', read: false, action: 'journal' },
    { id: 'n3', icon: 'ph-drop', color: 'info', title: 'Règles bientôt', text: 'Prévues dans 2 jours — tes gênes peuvent augmenter.', time: 'hier', read: true, action: 'cycle' },
    { id: 'n4', icon: 'ph-chart-line-up', color: 'coral', title: 'Analyse mise à jour', text: 'Le gluten reste ton suspect n°1 (confiance modérée).', time: 'lun.', read: true, action: 'analyse' },
  ],
  meals: [
    { name: 'Petit-déjeuner', desc: 'Yaourt, granola, miel', time: 8.2, timeLabel: '08:12', icon: 'ph-coffee', compounds: ['lactose', 'fructanes'] },
  ],
  mealLogged: false,
  dayOffset: 0,
  pastDays: {
    '-1': { meals: [
      { name: 'Petit-déjeuner', desc: 'Tartines beurre, café', timeLabel: '07:50', icon: 'ph-coffee', compounds: ['gluten', 'fructanes'] },
      { name: 'Déjeuner', desc: 'Pâtes carbonara', timeLabel: '13:05', icon: 'ph-bowl-food', compounds: ['gluten', 'lactose'] },
      { name: 'Dîner', desc: 'Soupe, pain complet', timeLabel: '20:10', icon: 'ph-cooking-pot', compounds: ['gluten', 'fructanes'] },
    ], gene: { time: '16:45', text: 'ballonnement fort · relié au gluten (Déjeuner 13:05)' }, ok: false },
    '-2': { meals: [
      { name: 'Petit-déjeuner', desc: 'Smoothie banane, avoine', timeLabel: '08:30', icon: 'ph-coffee', compounds: ['fructanes'] },
      { name: 'Déjeuner', desc: 'Salade riz thon', timeLabel: '12:30', icon: 'ph-bowl-food', compounds: [] },
      { name: 'Dîner', desc: 'Omelette, salade', timeLabel: '19:45', icon: 'ph-cooking-pot', compounds: [] },
    ], gene: null, ok: true },
  },
  recents: [
    { name: 'Petit-déj habituel', desc: 'Yaourt, granola, miel', icon: 'ph-coffee', count: 6 },
    { name: 'Sandwich poulet', desc: 'Pain, poulet, mayonnaise, salade', icon: 'ph-hamburger', count: 5 },
    { name: 'Pâtes pesto', desc: 'Pâtes, pesto, parmesan', icon: 'ph-bowl-food', count: 5 },
    { name: 'Salade riz thon', desc: 'Riz, thon, tomate, huile d\'olive', icon: 'ph-bowl-food', count: 4 },
    { name: 'Wrap poulet avocat', desc: 'Wrap, poulet, avocat, salade', icon: 'ph-hamburger', count: 3 },
    { name: 'Soupe miso saumon', desc: 'Soupe miso, saumon, riz', icon: 'ph-bowl-food', count: 2 },
    { name: 'Yaourt fruits rouges', desc: 'Yaourt, fraise, framboise, miel', icon: 'ph-coffee', count: 2 },
  ],
  recentToast: null,
  voice: null,
  stats: { repas: 24, genes: 6, glutenAvec: 82, reglesGenes: 9, okDays: 4, waterLowGenes: 4, waterLowDays: 5, waterDaysLogged: 8 },
  dayCheck: 'open',
  notifPermission: 'unsupported',
  demoDay1: false,
  alertsOn: true, cycleTrackOn: true, exportDone: false,
  lastGene: null,
  ings: [
    { name: 'Pain', tags: [{ l: 'gluten' }, { l: 'fructanes' }], checked: true },
    { name: 'Poulet', tags: [], checked: true },
    { name: 'Mayonnaise', tags: [{ l: 'œuf' }], checked: true },
    { name: 'Salade verte', tags: [], checked: true },
  ],
  portion: 'normale',
  intensity: 'moyen',
  pains: [
    { name: 'Ballonnement', on: true }, { name: 'Crampe', on: true },
    { name: 'Migraine', on: false }, { name: 'Nausée', on: false }, { name: 'Fatigue', on: false },
  ],
  locs: [
    { name: 'Estomac', on: false }, { name: 'Intestins', on: true },
    { name: 'Bas-ventre', on: false }, { name: 'Reflux', on: false },
    { name: 'Tête', on: false }, { name: 'Diffus', on: false },
  ],
  cyclePhase: 'regles',
  cycleEditOpen: false,
  periodToday: true,
  timing: 'now',
  alert: true,
  elimination: false,
  feedbackAnswered: false,
  feedbackYesAnswer: true,
  cycleLength: 28,
  currentDay: 3,
  flow: 'moyen',
  cycleSaved: false,
  cycleSymptoms: [
    { name: 'Crampes', on: true }, { name: 'Ballonnement', on: true }, { name: 'Fatigue', on: false },
    { name: 'Migraine', on: false }, { name: 'Sensibilité', on: false }, { name: 'Fringales', on: false },
  ],
};

export default function ObelixApp({ ergo = 'bandeau', pushNotifs = true }) {
  const [state, setStateRaw] = useState(INITIAL);
  const stateRef = useRef(state);
  stateRef.current = state;
  const ctrlRef = useRef(null);

  if (!ctrlRef.current) {
    const self = {};
    self.props = { ergo, pushNotifs };
    Object.defineProperty(self, 'state', { get: () => stateRef.current });
    self.setState = (updater) =>
      setStateRaw((prev) => {
        const patch = typeof updater === 'function' ? updater(prev) : updater;
        return { ...prev, ...patch };
      });

    self._h = function (h) { const H = Math.floor(h), M = Math.round((h - H) * 60); return (H < 10 ? '0' : '') + H + ':' + (M < 10 ? '0' : '') + M; };
    self._attrib = function (st) {
      const evH = st.timing === 'now' ? 14.33 : st.timing === '1h' ? 13.5 : 11.5;
      const found = {};
      st.meals.forEach((m) => m.compounds.forEach((c) => {
        const w = st.windows[c] || 6;
        if (evH >= m.time && evH <= m.time + w && (!found[c] || m.time > found[c].time)) found[c] = m;
      }));
      const byMeal = {};
      Object.keys(found).forEach((c) => { const k = found[c].name; (byMeal[k] = byMeal[k] || { m: found[c], cs: [] }).cs.push(c); });
      const parts = Object.keys(byMeal).map((k) => byMeal[k].cs.join(' & ') + ' (' + k + ' ' + byMeal[k].m.timeLabel + ')');
      return {
        hasGluten: !!found.gluten, timeLabel: self._h(evH),
        text: parts.length ? 'reliée à ' + parts.join(' ; ') : 'aucun repas dans la fenêtre — notée comme gêne isolée (contexte cycle pris en compte)',
      };
    };

    self.go = function (s) { return function () { self.setState(s === 'capture' ? { screen: s, captureTab: 'voice' } : { screen: s }); }; };
    self.goValidateBack = function () {
      return function () {
        const src = self.state.pendingMeal && self.state.pendingMeal.src;
        if (src === 'photo') { self.setState({ screen: 'photo', photoStage: 'done' }); }
        else if (src === 'barcode') { self.setState({ screen: 'barcode', barcodeStage: 'result' }); }
        else if (src === 'recent') { self.setState({ screen: 'capture', captureTab: 'recents' }); }
        else { self.setState({ screen: 'capture', captureTab: 'voice' }); }
      };
    };
    self.setWater = function (level) {
      return function () {
        self.setState(function (st) {
          const was = st.waterLevel;
          const next = was === level ? null : level;
          const stats = Object.assign({}, st.stats);
          if (was == null && next != null) stats.waterDaysLogged += 1;
          if (was == null && next === 'low') stats.waterLowDays += 1;
          if (was === 'low' && next !== 'low') stats.waterLowDays = Math.max(0, stats.waterLowDays - 1);
          if (was !== 'low' && was != null && next === 'low') stats.waterLowDays += 1;
          if (was != null && next == null) stats.waterDaysLogged = Math.max(0, stats.waterDaysLogged - 1);
          return { waterLevel: next, stats };
        });
      };
    };
    self._ensureNotifPermission = function (cb) {
      if (typeof Notification === 'undefined') { cb(); return; }
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(function (perm) { self.setState({ notifPermission: perm }); cb(); });
      } else { cb(); }
    };
    self.requestNotifPermission = function () {
      return function () {
        if (typeof Notification === 'undefined') { self._toast('Notifications non supportées par ce navigateur'); return; }
        if (Notification.permission === 'granted') { self._toast('Déjà activées ✓'); return; }
        Notification.requestPermission().then(function (perm) {
          self.setState({ notifPermission: perm });
          self._toast(perm === 'granted' ? 'Notifications activées ✓' : 'Refusé — active-les dans les réglages du navigateur');
        });
      };
    };
    self.enablePush = function () {
      return function () {
        self.setState(function (st) { return { pushOn: !st.pushOn }; });
        if (!self.state.pushOn) self._ensureNotifPermission(function () {});
      };
    };
    self.obNext = function () {
      return function () {
        self.setState(function (st) {
          if (st.obStep < 3) return { obStep: st.obStep + 1 };
          const MAP = { 'Ballonnements': 'Ballonnement', 'Crampes': 'Crampe', 'Migraines': 'Migraine', 'Nausées': 'Nausée', 'Fatigue': 'Fatigue', 'Reflux': 'Reflux' };
          const wanted = st.obSymptoms.filter(function (x) { return x.on && MAP[x.name]; }).map(function (x) { return MAP[x.name]; });
          let pains = st.pains.slice();
          wanted.forEach(function (n) { if (!pains.some(function (p) { return p.name === n; })) pains.push({ name: n, on: false }); });
          pains.sort(function (a, b) { return (wanted.indexOf(b.name) >= 0 ? 1 : 0) - (wanted.indexOf(a.name) >= 0 ? 1 : 0); });
          return { screen: 'journal', pains, cycleTrackOn: st.obCycleOn };
        });
      };
    };
    self.obBack = function () { return function () { self.setState(function (st) { return { obStep: Math.max(0, st.obStep - 1) }; }); }; };
    self.obToggle = function (key, i) { return function () { self.setState(function (st) { const l = st[key].map(function (x, j) { return j === i ? Object.assign({}, x, { on: !x.on }) : x; }); const o = {}; o[key] = l; return o; }); }; };
    self.obToggleCycle = function () { return function () { self.setState(function (st) { return { obCycleOn: !st.obCycleOn }; }); }; };
    self.setDay = function (off) { return function () { self.setState({ dayOffset: off }); }; };
    self.relogRecent = function (i) {
      return function () {
        const r = self.state.recents[i];
        const names = r.desc.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        self.setState({ ings: self._ingsFrom(names), pendingMeal: { name: r.name, desc: r.desc, icon: r.icon, src: 'recent' }, screen: 'validate' });
      };
    };
    self.toggleRecentsTab = function () { return function () { self.setState(function (st) { return { captureTab: st.captureTab === 'recents' ? 'voice' : 'recents' }; }); }; };
    self._offDemo = function () {
      return [
        { barcode: '3017620422003', name: 'Nutella', brand: 'Ferrero', ingredients: 'Sucre, huile de palme, NOISETTES (13%), cacao maigre, LAIT écrémé en poudre, LACTOSÉRUM en poudre, émulsifiants (lécithines [SOJA]), vanilline', allergens: ['en:nuts', 'en:milk', 'en:soybeans'] },
        { barcode: '7622210449283', name: 'Prince chocolat', brand: 'LU', ingredients: 'Farine de BLÉ, sucre, huile de palme, cacao maigre, sirop de glucose-fructose, poudre à lever, sel', allergens: ['en:gluten'] },
        { barcode: '3033710065967', name: 'Yaourt nature', brand: 'Danone', ingredients: 'LAIT entier, ferments lactiques', allergens: ['en:milk'] },
        { barcode: '8076809513722', name: 'Pâtes Penne', brand: 'Barilla', ingredients: 'Semoule de BLÉ dur', allergens: ['en:gluten'] },
        { barcode: '5449000000996', name: 'Coca-Cola', brand: 'Coca-Cola', ingredients: 'Eau gazéifiée, sucre, colorant caramel E150d, acidifiant E338, arômes, caféine', allergens: [] },
      ];
    };
    self._parseIngredients = function (text) {
      if (!text) return [];
      return text.split(/[,;]/).map(function (s) { return s.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/\d+\s*%?/g, '').trim(); }).filter(function (s) { return s.length > 1; }).slice(0, 14);
    };
    self.goBarcode = function () { return function () { self.setState({ screen: 'barcode', barcodeStage: 'scan', barcodeInput: '', barcodeProduct: null }); }; };
    self.onBarcodeInputChange = function () { return function (e) { self.setState({ barcodeInput: e.target.value }); }; };
    self.fillBarcodeDemo = function (code) { return function () { self.setState({ barcodeInput: code }); self._runBarcodeSearch(code); }; };
    self.backToScan = function () { return function () { self.setState({ barcodeStage: 'scan', barcodeProduct: null }); }; };
    self.searchBarcode = function () { return function () { self._runBarcodeSearch((self.state.barcodeInput || '').trim()); }; };
    // Camera barcode scan → same pipeline as manual entry.
    self.scanDetected = function (code) { const c = (code || '').trim(); if (!c) return; self.setState({ barcodeInput: c }); self._runBarcodeSearch(c); };
    // Speech-to-text result (or null to reset).
    self.setVoiceResult = function (res) { self.setState({ voice: res }); };
    self._runBarcodeSearch = function (code) {
      if (!code) return;
      const demo = self._offDemo().find(function (p) { return p.barcode === code; });
      if (demo) { self.setState({ barcodeStage: 'result', barcodeProduct: demo, barcodeSource: 'demo' }); return; }
      self.setState({ barcodeStage: 'loading' });
      const url = 'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(code) + '.json?fields=product_name,brands,ingredients_text_fr,ingredients_text,allergens_tags';
      const timeout = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 7000); });
      Promise.race([fetch(url).then(function (r) { return r.json(); }), timeout]).then(function (data) {
        if (!data || !data.product || (data.status === 0)) { self.setState({ barcodeStage: 'error' }); return; }
        const p = data.product;
        self.setState({
          barcodeStage: 'result', barcodeSource: 'live',
          barcodeProduct: {
            barcode: code, name: p.product_name || 'Produit', brand: p.brands || '',
            ingredients: p.ingredients_text_fr || p.ingredients_text || '',
            allergens: p.allergens_tags || [],
          },
        });
      }).catch(function () { self.setState({ barcodeStage: 'error' }); });
    };
    self.confirmBarcode = function () {
      return function () {
        const p = self.state.barcodeProduct; if (!p) return;
        const names = self._parseIngredients(p.ingredients);
        const ings = self._ingsFrom(names.length ? names : [p.name]);
        (p.allergens || []).forEach(function (tag) {
          const cid = tag === 'en:gluten' ? 'gluten' : tag === 'en:milk' ? 'lactose' : null;
          if (cid && !ings.some(function (x) { return x.tags.some(function (t) { return t.l === cid; }); })) {
            ings.push({ name: (cid === 'gluten' ? 'Gluten' : 'Lactose') + ' (allergène déclaré)', tags: [{ l: cid }], checked: true });
          }
        });
        self.setState({ ings: ings, pendingMeal: { name: p.name, desc: p.brand || p.name, icon: 'ph-barcode', src: 'barcode' }, screen: 'validate' });
      };
    };
    self.openMeal = function (i) { return function () { self.setState({ mealDetail: i, screen: 'mealDetail' }); }; };
    self.deleteMeal = function () {
      return function () {
        self.setState(function (st) {
          const wasLogged = st.mealDetail === st.meals.length - 1 && st.mealLogged && st.meals.length > 1;
          return {
            meals: st.meals.filter(function (_, j) { return j !== st.mealDetail; }),
            mealLogged: wasLogged ? false : st.mealLogged,
            screen: 'journal', mealDetail: null,
            stats: Object.assign({}, st.stats, { repas: Math.max(0, st.stats.repas - 1) }),
          };
        });
      };
    };
    self.toggleIng = function (i) { return function () { self.setState(function (st) { return { ings: st.ings.map(function (x, j) { return j === i ? Object.assign({}, x, { checked: !x.checked }) : x; }) }; }); }; };
    self.togglePain = function (i) { return function () { self.setState(function (st) { return { pains: st.pains.map(function (x, j) { return j === i ? Object.assign({}, x, { on: !x.on }) : x; }) }; }); }; };
    self.setIntensity = function (v) { return function () { self.setState({ intensity: v }); }; };
    self.setPortion = function (v) { return function () { self.setState({ portion: v }); }; };
    self.setTiming = function (v) { return function () { self.setState({ timing: v }); }; };
    self.toggleAlert = function () { return function () { self.setState(function (st) { return { alert: !st.alert }; }); }; };
    self.startElim = function () { return function () { self.setState({ elimination: true }); }; };
    self.finishElim = function () { return function () { self.setState({ elimination: 'done', screen: 'verdict' }); }; };
    self.startReintro = function () { return function () { self.setState({ elimination: 'reintro', reintroStep: 1, screen: 'analyse' }); }; };
    self.reintroNext = function () {
      return function () {
        self.setState(function (st) {
          return st.reintroStep >= 3 ? { elimination: 'confirmed' } : { reintroStep: st.reintroStep + 1 };
        });
      };
    };
    self.toggleLoc = function (i) { return function () { self.setState(function (st) { return { locs: st.locs.map(function (x, j) { return j === i ? Object.assign({}, x, { on: !x.on }) : x; }) }; }); }; };
    self.setCycle = function (v) { return function () { self.setState({ cyclePhase: v, cycleEditOpen: false }); }; };
    self.toggleCycleEdit = function () { return function () { self.setState(function (st) { return { cycleEditOpen: !st.cycleEditOpen }; }); }; };
    self.togglePeriod = function () { return function () { self.setState(function (st) { return { periodToday: !st.periodToday }; }); }; };
    self.incLen = function () { return function () { self.setState(function (st) { return { cycleLength: Math.min(35, st.cycleLength + 1) }; }); }; };
    self.decLen = function () { return function () { self.setState(function (st) { return { cycleLength: Math.max(21, st.cycleLength - 1) }; }); }; };
    self.setFlow = function (v) { return function () { self.setState({ flow: v, cycleSaved: false }); }; };
    self.toggleCycleSymptom = function (i) { return function () { self.setState(function (st) { return { cycleSaved: false, cycleSymptoms: st.cycleSymptoms.map(function (x, j) { return j === i ? Object.assign({}, x, { on: !x.on }) : x; }) }; }); }; };
    self.saveCycleLog = function () { return function () { self.setState({ cycleSaved: true }); }; };
    self.editCycleLog = function () { return function () { self.setState({ cycleSaved: false }); }; };
    self.answerFeedback = function (yes) {
      return function () {
        self.setState(function (st) {
          const windows = yes ? Object.assign({}, st.windows, { gluten: 4 }) : st.windows;
          return { feedbackAnswered: true, feedbackYesAnswer: yes, windows };
        });
      };
    };
    self.logMeal = function () {
      return function () {
        const st = self.state;
        if (st.mealLogged) { self.setState({ screen: 'prevision' }); return; }
        const comps = [];
        st.ings.forEach(function (x) { if (x.checked) x.tags.forEach(function (t) { if (st.windows[t.l] && comps.indexOf(t.l) < 0) comps.push(t.l); }); });
        const pm = st.pendingMeal || { name: 'Déjeuner', desc: 'Sandwich poulet, salade', icon: 'ph-hamburger' };
        const meal = { name: pm.name, desc: pm.desc, time: 12.67, timeLabel: '12:40', icon: pm.icon, compounds: comps };
        self.setState({ meals: st.meals.concat([meal]), mealLogged: true, screen: 'prevision', stats: Object.assign({}, st.stats, { repas: st.stats.repas + 1 }) });
        if (comps.length) { const risk = comps[0], W = st.windows[risk] || 6; setTimeout(function () { self.firePush({ icon: 'ph-timer', color: 'watch', title: 'Fenêtre à risque · ' + risk, text: pm.name + ' — je surveille jusque ~+' + W + 'h. Une gêne maintenant lui serait attribuée.', action: 'now' }); }, 1500); }
      };
    };
    self.saveGene = function () {
      return function () {
        self.setState(function (st) {
          const a = self._attrib(st);
          return {
            lastGene: { time: a.timeLabel, text: a.text },
            dayCheck: 'hidden',
            screen: 'journal',
            stats: Object.assign({}, st.stats, {
              genes: st.stats.genes + 1,
              glutenAvec: Math.min(96, st.stats.glutenAvec + (a.hasGluten ? 1 : 0)),
              reglesGenes: st.stats.reglesGenes + (st.cyclePhase === 'regles' ? 1 : 0),
              waterLowGenes: st.stats.waterLowGenes + (st.waterLevel === 'low' ? 1 : 0),
            }),
          };
        });
      };
    };
    self.clearGene = function () { return function () { self.setState({ lastGene: null }); }; };
    self.toggleDemoDay1 = function () { return function () { self.setState(function (st) { return { demoDay1: !st.demoDay1 }; }); }; };
    self.toggleFlag = function (k) { return function () { self.setState(function (st) { const o = {}; o[k] = !st[k]; return o; }); }; };
    self.doExport = function () { return function () { self.setState({ exportDone: true }); setTimeout(function () { self.setState({ exportDone: false }); }, 2600); }; };
    self.confirmDayOk = function () {
      return function () {
        self.setState(function (st) {
          return { dayCheck: 'ok', stats: Object.assign({}, st.stats, { okDays: st.stats.okDays + 1 }) };
        });
      };
    };

    self._db = function () { return OBELIX_FOODS || null; };
    self._tagsOf = function (name) { const db = self._db(); return db ? db.tags(name).map(function (c) { return { l: c.id }; }) : []; };
    self._ingsFrom = function (names) { return names.map(function (n) { return { name: n, tags: self._tagsOf(n), checked: true }; }); };
    self._voiceIngs = function () { return self._ingsFrom(['Pain', 'Poulet', 'Mayonnaise', 'Salade verte']); };
    self._recipe = function () { return [
      { name: 'Lentilles corail', conf: 'sûr' }, { name: 'Oignon jaune', conf: 'sûr' }, { name: 'Ail', conf: 'sûr' },
      { name: 'Tomates concassées', conf: 'moyen' }, { name: 'Lait de coco', conf: 'sûr' }, { name: 'Riz basmati', conf: 'sûr' },
      { name: 'Épinards', conf: 'moyen' }, { name: 'Gingembre', conf: 'sûr' }, { name: 'Cumin', conf: 'moyen' }, { name: 'Coriandre fraîche', conf: 'faible' },
    ]; };
    self._extras = function () { return ['Huile d\'olive', 'Beurre', 'Sauce soja', 'Sucre']; };
    self._toast = function (msg) { self.setState({ toast: msg }); clearTimeout(self._tt); self._tt = setTimeout(function () { self.setState({ toast: null }); }, 2600); };
    self.goPhoto = function () { return function () { self.setState({ screen: 'photo', photoStage: 'pick' }); }; };
    self.goValidateVoice = function () {
      return function () {
        const v = self.state.voice;
        let ings, desc;
        if (v && v.foodNames && v.foodNames.length) {
          ings = self._ingsFrom(v.foodNames);
          desc = v.foodNames.join(', ');
        } else if (v && v.transcript) {
          ings = [{ name: v.transcript.charAt(0).toUpperCase() + v.transcript.slice(1), tags: [], checked: true }];
          desc = v.transcript;
        } else {
          ings = self._voiceIngs();
          desc = 'Sandwich poulet, salade';
        }
        self.setState({ ings: ings, pendingMeal: { name: 'Déjeuner', desc: desc, icon: 'ph-hamburger', src: 'voice' }, screen: 'validate' });
      };
    };
    self.analyzePhoto = function () { return function () { self.setState({ photoStage: 'scan' }); clearTimeout(self._pt); self._pt = setTimeout(function () { self.setState({ photoStage: 'done' }); }, 1200); }; };
    self.confirmPhoto = function () {
      return function () {
        const ings = self._ingsFrom(self._recipe().map(function (d) { return d.name; }));
        self.setState({ ings: ings, pendingMeal: { name: 'Dîner', desc: 'Dahl de lentilles corail', icon: 'ph-bowl-food', src: 'photo' }, screen: 'validate' });
      };
    };
    self.addIng = function () {
      return function () {
        const st = self.state, ex = self._extras(), i = st.addedCount || 0;
        if (i < ex.length) { const e = ex[i]; self.setState({ ings: st.ings.concat([{ name: e, tags: self._tagsOf(e), checked: true }]), addedCount: i + 1 }); }
        else self._toast('Tu as déjà ajouté les extras courants');
      };
    };
    self.exportAll = function () { return function () { self._toast('Archive générée · obelix-manon-donnees.zip'); }; };
    self.toggleWipe = function () { return function () { self.setState(function (st) { return { confirmWipe: !st.confirmWipe }; }); }; };
    self.doWipe = function () { return function () { self.setState({ confirmWipe: false }); self._toast('Démo — tes données sont conservées'); }; };
    self.goNotifs = function () { return function () { self.setState(function (st) { return { screen: 'notifs', notifs: st.notifs.map(function (n) { return Object.assign({}, n, { read: true }); }) }; }); }; };
    self.goFoodDb = function () { return function () { self.setState({ screen: 'foodDb' }); }; };
    self.openNotif = function (action) { return function () { self.setState({ screen: action, push: null }); }; };
    self.firePush = function (n) {
      if (self.props.pushNotifs === false || !self.state.pushOn) return;
      self.setState({ push: n });
      clearTimeout(self._pp); self._pp = setTimeout(function () { self.setState({ push: null }); }, 4200);
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Obélix · ' + n.title, { body: n.text, tag: 'obelix-' + n.title });
        }
      } catch (e) {}
    };
    self.testNotif = function () { return function () { self._ensureNotifPermission(function () { self.firePush({ icon: 'ph-bell-ringing', color: 'good', title: 'Bilan du soir · 21:00', text: 'Aucune gêne aujourd\'hui ? Confirme en 1 tap — et un mot sur ton hydratation.', action: 'journal' }); }); }; };
    self.dismissPush = function () { return function (e) { if (e && e.stopPropagation) e.stopPropagation(); clearTimeout(self._pp); self.setState({ push: null }); }; };
    self.tapPush = function () { return function () { const a = self.state.push && self.state.push.action; self.setState({ push: null, screen: a || 'journal' }); }; };
    self.obDaysAgo = function (d) { return function () { self.setState(function (st) { return { currentDay: Math.max(1, Math.min(st.cycleLength, st.currentDay + d)) }; }); }; };
    self.obPeriodDur = function (d) { return function () { self.setState(function (st) { return { periodDuration: Math.max(2, Math.min(9, st.periodDuration + d)) }; }); }; };

    self.renderVals = renderValsFactory(self);
    ctrlRef.current = self;
  }

  const self = ctrlRef.current;
  self.props.ergo = ergo;
  self.props.pushNotifs = pushNotifs;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('obelix_manon_state_v1');
      if (raw) {
        const saved = JSON.parse(raw);
        saved.push = null; saved.toast = null; saved.confirmWipe = false;
        saved.photoStage = 'pick'; saved.captureTab = 'voice'; saved.barcodeStage = 'scan'; saved.barcodeProduct = null;
        if (saved.stats) { saved.stats = Object.assign({ waterLowGenes: 4, waterLowDays: 5, waterDaysLogged: 8 }, saved.stats); }
        if (saved.screen !== 'onboarding') saved.screen = 'journal';
        if (typeof Notification !== 'undefined') saved.notifPermission = Notification.permission;
        self.setState(saved);
      } else if (typeof Notification !== 'undefined') {
        self.setState({ notifPermission: Notification.permission });
      }
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTimeout(self._saveT);
    self._saveT = setTimeout(function () {
      try { localStorage.setItem('obelix_manon_state_v1', JSON.stringify(stateRef.current)); } catch (e) {}
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const V = self.renderVals();
  return <AppView V={V} />;
}

function renderValsFactory(self) {
  return function renderVals() {
    const s = self.state;
    const NOWH = 14.5;
    const ERGO = self.props.ergo || 'bandeau';
    const CORAL = 'var(--coral-500)';
    const GOOD = 'var(--tol-good-500)', WATCH = 'var(--tol-watch-500)', AVOID = 'var(--tol-avoid-500)';
    const GOOD_SOFT = 'var(--tol-good-50)', WATCH_SOFT = 'var(--tol-watch-50)', AVOID_SOFT = 'var(--tol-avoid-50)';
    const GOOD_TXT = 'var(--tol-good-700)', WATCH_TXT = 'var(--tol-watch-700)', AVOID_TXT = 'var(--tol-avoid-700)';
    const INFO = 'var(--info-500)', INK = 'var(--ink)', MUTED = 'var(--taupe-600)';
    const FONT = 'var(--font-body)';
    const cap = (c) => c.charAt(0).toUpperCase() + c.slice(1);

    const compMap = {};
    s.meals.forEach((m) => m.compounds.forEach((c) => { if (!compMap[c] || m.time > compMap[c].time) compMap[c] = m; }));
    const nowRows = Object.keys(compMap).map((c) => {
      const m = compMap[c], w = s.windows[c] || 6, pr = Math.min(1, (NOWH - m.time) / w), act = pr < 1;
      return {
        name: cap(c), windowLabel: '~' + w + 'h', mealLabel: m.name + ' · ' + m.timeLabel,
        status: act ? 'actif jusque ~' + self._h(m.time + w) : 'digéré',
        statusStyle: "font:700 11px " + FONT + ";color:" + (act ? AVOID : GOOD_TXT) + ";flex-shrink:0;white-space:nowrap",
        barStyle: "position:absolute;left:0;top:0;height:100%;border-radius:4px;width:" + Math.round(pr * 100) + "%;background:" + (act ? AVOID : GOOD),
        active: act, comp: c,
      };
    }).sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
    const activeRows = nowRows.filter((r) => r.active);
    const activeCount = activeRows.length;
    const activeBannerText = activeCount === 0 ? "Tout est digéré pour l'instant"
      : activeCount === 1 ? '1 suspect encore actif' : activeCount + ' suspects encore actifs';
    const activeDotStyle = "width:9px;height:9px;border-radius:50%;flex-shrink:0;background:" + (activeCount ? AVOID : GOOD);
    const activeCountLabel = activeCount === 0 ? "plus rien d'actif"
      : activeCount === 1 ? '1 composé suspect encore actif' : activeCount + ' composés suspects encore actifs';
    const hintText = activeCount
      ? 'Fenêtres encore ouvertes : ' + activeRows.map((r) => r.comp + ' (' + compMap[r.comp].name + ')').join(', ') + '. Une gêne maintenant leur serait attribuée en priorité.'
      : "Aucune fenêtre alimentaire ouverte — une gêne maintenant serait notée comme isolée (stress, cycle, ou composé à fenêtre longue).";

    const attrib = self._attrib(s);

    const isToday = s.dayOffset === 0;
    const pastDay = s.pastDays[String(s.dayOffset)];
    const shownMeals = isToday ? s.meals : (pastDay ? pastDay.meals : []);
    const journalMeals = shownMeals.map((m, i) => ({
      name: m.name, desc: m.desc, icon: m.icon, timeLabel: m.timeLabel,
      hasTags: m.compounds.length > 0, tags: m.compounds.map((c) => ({ l: c })),
      onOpen: isToday ? self.openMeal(i) : function () {},
    }));
    const dm = s.mealDetail != null && s.meals[s.mealDetail] ? s.meals[s.mealDetail] : null;
    const dmWindows = dm ? dm.compounds.map((c) => ({
      name: cap(c), win: '~' + (s.windows[c] || 6) + 'h',
      chipStyle: "background:var(--cream-200);color:var(--cocoa-700);border-radius:var(--radius-pill);padding:5px 11px;font:700 11px " + FONT + ";display:flex;align-items:center;gap:5px",
    })) : [];
    const DAY_LABELS = { '-1': 'mer. 3', '-2': 'mar. 2' };
    const dayTabs = [-2, -1, 0].map((off) => {
      const sel = s.dayOffset === off;
      const hasGene = off === 0 ? !!s.lastGene : (s.pastDays[String(off)] ? !!s.pastDays[String(off)].gene : false);
      return {
        label: off === 0 ? "Aujourd'hui" : DAY_LABELS[String(off)],
        onSelect: self.setDay(off),
        dotStyle: "width:5px;height:5px;border-radius:50%;margin-top:3px;background:" + (hasGene ? AVOID : GOOD),
        style: sel
          ? "display:flex;flex-direction:column;align-items:center;background:var(--cocoa-800);color:#fff;border-radius:var(--radius-pill);padding:8px 16px;font:700 11.5px " + FONT + ";cursor:pointer;white-space:nowrap"
          : "display:flex;flex-direction:column;align-items:center;background:#fff;border:1px solid var(--border-soft);color:" + MUTED + ";border-radius:var(--radius-pill);padding:8px 16px;font:600 11.5px " + FONT + ";cursor:pointer;white-space:nowrap",
      };
    });
    const pastGene = !isToday && pastDay && pastDay.gene ? pastDay.gene : null;
    const pastOk = !isToday && pastDay && pastDay.ok;
    const recents = s.recents.slice().sort((a, b) => b.count - a.count).map((r) => {
      const i = s.recents.indexOf(r);
      const names = r.desc.split(',').map((x) => x.trim()).filter(Boolean);
      const comps = [];
      names.forEach((n) => self._tagsOf(n).forEach((t) => { if (comps.indexOf(t.l) < 0) comps.push(t.l); }));
      return {
        name: r.name, desc: r.desc, icon: r.icon, countLabel: r.count + ' fois',
        onRelog: self.relogRecent(i),
        hasTags: comps.length > 0,
        tags: comps.map((c) => ({ name: cap(c), win: '~' + (s.windows[c] || 6) + 'h', chipStyle: "background:var(--cream-200);color:var(--cocoa-700);border-radius:var(--radius-pill);padding:4px 10px;font:700 10.5px " + FONT + ";display:flex;align-items:center;gap:5px" })),
      };
    });

    const tagStyle = () =>
      "background:var(--cream-200);border-radius:var(--radius-xs);padding:3px 8px;font:600 10px " + FONT + ";color:var(--cocoa-700)";
    const ings = s.ings.map((x, i) => ({
      name: x.name, hasTags: x.tags.length > 0, checkCls: x.checked ? 'ph-bold ph-check' : 'ph ph-x',
      tags: x.tags.map((t) => ({ l: t.l, style: tagStyle() })),
      onToggle: self.toggleIng(i),
      boxStyle: x.checked
        ? "width:22px;height:22px;border-radius:7px;background:" + CORAL + ";display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;cursor:pointer"
        : "width:22px;height:22px;border-radius:7px;border:1.5px solid var(--border-strong);color:transparent;flex-shrink:0;cursor:pointer",
      rowStyle: "display:flex;align-items:flex-start;gap:12px;background:#fff;border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--shadow-xs)" + (x.checked ? '' : ';opacity:.5'),
      nameStyle: x.checked
        ? "font:700 13.5px " + FONT + ";color:" + INK
        : "font:700 13.5px " + FONT + ";color:" + MUTED + ";text-decoration:line-through",
    }));
    const checkedCount = s.ings.filter((x) => x.checked).length;
    const glutenIng = s.ings.find((x) => x.checked && x.tags.some((t) => t.l === 'gluten'));
    const elimWarning = s.elimination === true && !s.mealLogged && !!glutenIng;

    const portionStyle = (v) => "flex:1;text-align:center;border-radius:var(--radius-sm);padding:11px 0;cursor:pointer;font:" + (s.portion === v ? '700' : '600') + " 12px " + FONT + ";" + (s.portion === v ? "background:" + CORAL + ";color:#fff;" : "background:#fff;border:1px solid var(--border-strong);color:" + MUTED + ";");

    const intStyle = (v) => { const a = s.intensity === v; return "flex:1;text-align:center;border-radius:var(--radius-md);padding:14px 0 12px;cursor:pointer;" + (a ? "background:" + AVOID + ";box-shadow:0 4px 12px rgba(214,69,63,.28);" : "background:#fff;box-shadow:var(--shadow-xs);"); };
    const intLabel = (v) => { const a = s.intensity === v; return "font:" + (a ? '700' : '600') + " 11.5px " + FONT + ";color:" + (a ? '#fff' : MUTED); };
    const intDot = (v) => s.intensity === v ? '#fff' : 'var(--tol-avoid-100)';

    const chipSel = (on, color) => on
      ? "background:" + color + ";color:#fff;border-radius:var(--radius-pill);padding:9px 14px;font:700 12px " + FONT + ";cursor:pointer"
      : "background:#fff;border:1px solid var(--border-strong);border-radius:var(--radius-pill);padding:9px 14px;font:600 12px " + FONT + ";color:" + MUTED + ";cursor:pointer";
    const pains = s.pains.map((x, i) => ({ name: x.name, onToggle: self.togglePain(i), style: chipSel(x.on, AVOID) }));
    const locs = s.locs.map((x, i) => ({ name: x.name, onToggle: self.toggleLoc(i), style: chipSel(x.on, AVOID) }));

    const timeStyle = (v) => "flex:1;text-align:center;border-radius:var(--radius-sm);padding:10px 0;cursor:pointer;font:" + (s.timing === v ? '700' : '600') + " 11.5px " + FONT + ";" + (s.timing === v ? "background:" + AVOID + ";color:#fff;" : "background:#fff;border:1px solid var(--border-strong);color:" + MUTED + ";");

    const cycleRaw = [{ v: 'regles', l: 'Règles' }, { v: 'follic', l: 'Folliculaire' }, { v: 'ovul', l: 'Ovulation' }, { v: 'lutea', l: 'Lutéale' }];
    const cyclePhases = cycleRaw.map((p) => ({
      l: p.l, onSelect: self.setCycle(p.v),
      style: s.cyclePhase === p.v
        ? "background:" + INFO + ";color:#fff;border-radius:var(--radius-pill);padding:8px 14px;font:700 12px " + FONT + ";cursor:pointer"
        : "background:#fff;border:1px solid var(--border-strong);border-radius:var(--radius-pill);padding:8px 14px;font:600 12px " + FONT + ";color:" + MUTED + ";cursor:pointer",
    }));
    const periodChipStyle = s.periodToday
      ? "display:flex;align-items:center;gap:7px;background:" + INFO + ";color:#fff;border-radius:var(--radius-pill);padding:5px 12px 5px 10px;font:700 11.5px " + FONT + ";cursor:pointer;white-space:nowrap"
      : "display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.6);color:var(--info-700);border:1px solid var(--info-500);border-radius:var(--radius-pill);padding:5px 12px;font:700 11.5px " + FONT + ";cursor:pointer;white-space:nowrap";
    const periodChipLabel = s.periodToday ? 'Règles · Jour ' + s.currentDay : 'Noter mes règles';

    const levelMeta = (lvl) => {
      if (lvl === 'élevé' || lvl === 'suspect') return { c: AVOID, soft: AVOID_SOFT, txt: AVOID_TXT };
      if (lvl === 'moyen' || lvl === 'à surveiller') return { c: WATCH, soft: WATCH_SOFT, txt: WATCH_TXT };
      if (lvl === 'données insuffisantes') return { c: MUTED, soft: 'var(--cream-200)', txt: MUTED };
      return { c: GOOD, soft: GOOD_SOFT, txt: GOOD_TXT };
    };
    const chip = (lvl) => { const m = levelMeta(lvl); return "background:" + m.soft + ";color:" + m.txt + ";border-radius:var(--radius-pill);padding:3px 9px;font:700 10px " + FONT + ";flex-shrink:0"; };

    const famRaw = [
      { name: 'Fructanes', group: 'FODMAP', level: 'élevé', pct: 66 },
      { name: 'Lactose', group: 'FODMAP', level: 'moyen', pct: 48 },
      { name: 'Polyols', group: 'FODMAP', level: 'faible', pct: 20 },
      { name: 'Histamine', group: 'amine', level: 'à surveiller', pct: 40 },
      { name: 'Caféine', group: 'stimulant', level: 'écarté', pct: 14 },
    ];
    const families = famRaw.map((f) => ({
      name: f.name, group: f.group, level: f.level, chipStyle: chip(f.level),
      barStyle: "width:" + f.pct + "%;height:100%;background:" + levelMeta(f.level).c,
    }));

    const suspRaw = [
      { name: 'Produits laitiers', avec: 54, sans: 38, tag: 'à surveiller', note: 'meilleure fenêtre 6h · fiabilité moyenne' },
      { name: 'Oignon / ail', avec: 60, sans: 24, tag: 'suspect', note: 'source de fructanes · meilleure fenêtre 8h' },
      { name: 'Tomate', avec: 40, sans: 38, tag: 'données insuffisantes', note: 'seulement 5 repas — continue à loguer' },
    ];
    const suspects = suspRaw.map((x) => {
      const m = levelMeta(x.tag);
      const insufficient = x.tag === 'données insuffisantes';
      return {
        name: x.name, tag: x.tag, ratio: x.avec + '% / ' + x.sans + '%', note: x.note, chipStyle: chip(x.tag),
        rowStyle: "background:#fff;border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--shadow-xs)" + (insufficient ? ';opacity:.65' : ''),
        barStyle: "width:" + x.avec + "%;height:100%;background:" + (insufficient ? 'var(--sand-400)' : m.c),
      };
    });

    const lastMeal = s.meals[s.meals.length - 1];
    const prevComps = lastMeal.compounds;
    const prevHasRisk = prevComps.length > 0;
    const prevHasGluten = prevComps.indexOf('gluten') >= 0;

    const CY = s.cycleLength, day = s.currentDay, ovDay = CY - 14;
    const P_R = 'var(--info-700)', P_F = '#8FBEE2', P_O = 'var(--info-500)', P_L = '#C7DCEF';
    const PD = s.periodDuration;
    const seg = [[0, PD, P_R], [PD, ovDay - 1, P_F], [ovDay - 1, ovDay + 2, P_O], [ovDay + 2, CY, P_L]];
    const toDeg = (d) => (d / CY * 360).toFixed(1);
    const toPct = (d) => (d / CY * 100).toFixed(1);
    const ringStyle = "position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg," + seg.map((g) => g[2] + " " + toDeg(g[0]) + "deg " + toDeg(g[1]) + "deg").join(",") + ")";
    const forecastGradient = "linear-gradient(90deg," + seg.map((g) => g[2] + " " + toPct(g[0]) + "% " + toPct(g[1]) + "%").join(",") + ")";
    const markerDeg = (day / CY * 360).toFixed(1);
    let phaseLabel;
    if (day <= PD) phaseLabel = 'Règles';
    else if (day < ovDay - 1) phaseLabel = 'Folliculaire';
    else if (day <= ovDay + 2) phaseLabel = 'Ovulation';
    else phaseLabel = 'Lutéale';
    const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const baseD = new Date(2026, 6, 4);
    const fmt = (off) => { const d = new Date(baseD); d.setDate(d.getDate() + off); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
    const daysUntilNext = CY - day, daysUntilOv = Math.max(0, ovDay - day);

    const flowSize = { leger: 12, moyen: 16, abondant: 20 };
    const flowStyle = (v) => { const a = s.flow === v; return "flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;border-radius:var(--radius-md);padding:13px 0 11px;cursor:pointer;" + (a ? "background:" + INFO + ";" : "background:#fff;border:1px solid var(--border-strong);"); };
    const flowLabel = (v) => { const a = s.flow === v; return "font:" + (a ? '700' : '600') + " 11.5px " + FONT + ";color:" + (a ? '#fff' : MUTED); };
    const flowDot = (v) => { const a = s.flow === v; return "width:" + flowSize[v] + "px;height:" + flowSize[v] + "px;border-radius:50%;background:" + (a ? '#fff' : '#AECBE6'); };
    const cycleSymptoms = s.cycleSymptoms.map((x, i) => ({
      name: x.name, onToggle: self.toggleCycleSymptom(i),
      style: x.on
        ? "background:" + INFO + ";color:#fff;border-radius:var(--radius-pill);padding:8px 13px;font:700 11.5px " + FONT + ";cursor:pointer"
        : "background:#fff;border:1px solid var(--border-strong);border-radius:var(--radius-pill);padding:8px 13px;font:600 11.5px " + FONT + ";color:" + MUTED + ";cursor:pointer",
    }));
    const histRaw = [{ m: 'mars', len: 30 }, { m: 'avr.', len: 27 }, { m: 'mai', len: 29 }, { m: 'juin', len: 28 }, { m: 'juil.', len: CY }];
    const avgLen = Math.round(histRaw.reduce((a, b) => a + b.len, 0) / histRaw.length);
    const history = histRaw.map((h, i) => { const cur = i === histRaw.length - 1; return {
      m: h.m, len: h.len, valColor: cur ? 'var(--info-700)' : MUTED,
      barStyle: "width:100%;border-radius:6px 6px 0 0;height:" + Math.round(h.len / 33 * 100) + "%;background:" + (cur ? INFO : '#B9D5EC'),
    }; });
    const flowNames = { leger: 'flux léger', moyen: 'flux moyen', abondant: 'flux abondant' };
    const nSym = s.cycleSymptoms.filter((x) => x.on).length;
    const cycleSavedSummary = flowNames[s.flow] + ' · ' + nSym + (nSym > 1 ? ' symptômes notés' : ' symptôme noté') + '. Le contexte du jour est relié à tes gênes digestives.';
    const cycleLinkStat = s.stats.reglesGenes + ' de tes ' + s.stats.genes + ' gênes sont tombées pendant tes règles';
    const waterLowGenes = s.stats.waterLowGenes || 0;
    const waterLinkStat = waterLowGenes + ' de tes ' + s.stats.genes + ' gênes sont tombées les jours où tu étais peu hydratée';
    const waterLinkStrong = s.stats.genes > 0 && (waterLowGenes / s.stats.genes) >= 0.5;

    const db = self._db();
    const fdbCount = db ? db.count : 0, fdbCatCount = db ? db.categories.length : 0;
    const fdbFamilies = db ? Object.keys(db.compounds).map((id) => { const c = db.compounds[id], n = db.foods.filter((f) => f.compounds.some((x) => x.id === id)).length; return {
      label: c.label, desc: c.desc, win: '~' + c.window + 'h', count: n + ' aliments',
      tagStyle: "border-radius:var(--radius-pill);padding:3px 9px;font:700 9.5px " + FONT + ";flex-shrink:0;" + (c.fodmap ? "background:var(--tol-watch-50);color:var(--tol-watch-700)" : "background:var(--cream-200);color:var(--cocoa-700)"),
      tagLabel: c.fodmap ? 'FODMAP' : 'autre',
    }; }) : [];
    const LVLC = { h: AVOID, m: WATCH, l: GOOD };
    const fdbGroups = db ? db.categories.map((cat) => ({
      cat, count: db.foods.filter((f) => f.category === cat).length + '',
      items: db.foods.filter((f) => f.category === cat).map((f) => ({
        name: f.name, hasTags: f.compounds.length > 0, noTags: f.compounds.length === 0,
        tags: f.compounds.map((c) => ({ l: db.compounds[c.id].label, dotStyle: "width:6px;height:6px;border-radius:50%;flex-shrink:0;background:" + LVLC[c.level], style: "display:flex;align-items:center;gap:5px;background:var(--cream-100);border-radius:var(--radius-pill);padding:3px 9px;font:600 10px " + FONT + ";color:var(--cocoa-700)" })),
      })),
    })) : [];
    const navActive = (scr) => s.screen === scr;
    const navColor = (scr) => navActive(scr) ? CORAL : MUTED;
    const navIcon = (scr, ic) => (navActive(scr) ? 'ph-fill ' : 'ph ') + ic;
    const mkNav = (scr, ic, label, tap) => ({ onTap: tap, color: navColor(scr), iconCls: navIcon(scr, ic), label });
    const navLeft = ERGO === 'bandeau'
      ? [mkNav('journal', 'ph-notebook', 'Journal', self.go('journal')), mkNav('cycle', 'ph-flower-lotus', 'Cycle', self.go('cycle'))]
      : [mkNav('journal', 'ph-notebook', 'Journal', self.go('journal')), mkNav('now', 'ph-pulse', 'Maintenant', self.go('now'))];
    const navRight = ERGO === 'bandeau'
      ? [mkNav('analyse', 'ph-chart-line-up', 'Analyse', self.go('analyse')), mkNav('profil', 'ph-user', 'Profil', self.go('profil'))]
      : [mkNav('cycle', 'ph-flower-lotus', 'Cycle', self.go('cycle')), mkNav('analyse', 'ph-chart-line-up', 'Analyse', self.go('analyse'))];

    return {
      isOnboarding: s.screen === 'onboarding',
      obStep0: s.screen === 'onboarding' && s.obStep === 0, obStep1: s.screen === 'onboarding' && s.obStep === 1,
      obStep2: s.screen === 'onboarding' && s.obStep === 2, obStep3: s.screen === 'onboarding' && s.obStep === 3,
      obNext: self.obNext(), obBack: self.obBack(), obSkip: self.go('journal'),
      obShowBack: s.obStep > 0,
      obNextLabel: s.obStep >= 3 ? 'C\'est parti' : 'Continuer',
      obDots: [0, 1, 2, 3].map((i) => ({ style: "width:" + (i === s.obStep ? '22px' : '6px') + ";height:6px;border-radius:3px;background:" + (i === s.obStep ? CORAL : 'var(--sand-400)') + ";transition:width .25s" })),
      obSymptoms: s.obSymptoms.map((x, i) => ({ name: x.name, onToggle: self.obToggle('obSymptoms', i), style: chipSel(x.on, CORAL) })),
      obSuspects: s.obSuspects.map((x, i) => ({ name: x.name, onToggle: self.obToggle('obSuspects', i), style: chipSel(x.on, CORAL) })),
      obToggleCycle: self.obToggleCycle(),
      obCycleShow: s.obCycleOn, obMoreLen: self.incLen(), obLessLen: self.decLen(),
      obCycleTrackStyle: "width:38px;height:22px;border-radius:100px;position:relative;flex-shrink:0;background:" + (s.obCycleOn ? INFO : 'var(--sand-400)'),
      obCycleKnobStyle: "position:absolute;top:2px;width:18px;height:18px;border-radius:50%;background:#fff;" + (s.obCycleOn ? 'right:2px;' : 'left:2px;'),
      activeBannerText, activeDotStyle, activeCountLabel, nowRows, hintText,
      togglePush: self.enablePush(),
      pushTrackStyle: "width:34px;height:20px;border-radius:100px;position:relative;flex-shrink:0;background:" + (s.pushOn ? GOOD : 'var(--sand-400)'),
      pushKnobStyle: "position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;" + (s.pushOn ? 'right:2px;' : 'left:2px;'),
      dayTabs, isToday, isPastDay: !isToday,
      journalSectionTitle: isToday ? 'Repas du jour' : 'Repas · ' + (s.dayOffset === -1 ? 'mercredi 3 juil.' : 'mardi 2 juil.'),
      isMealDetail: s.screen === 'mealDetail' && !!dm,
      dmName: dm ? dm.name : '', dmDesc: dm ? dm.desc : '', dmTime: dm ? dm.timeLabel : '', dmIcon: dm ? dm.icon : 'ph-bowl-food',
      dmHasComps: dmWindows.length > 0, dmWindows,
      deleteMeal: self.deleteMeal(),
      pastGeneShown: !!pastGene, pastGeneTime: pastGene ? pastGene.time : '', pastGeneText: pastGene ? pastGene.text : '',
      pastOkShown: pastOk,
      recents,
      dayCheckOpen: s.dayCheck === 'open' && !s.lastGene && s.pushOn && isToday,
      dayCheckDone: s.dayCheck === 'ok',
      waterOptions: [['low', 'Peu bu'], ['ok', 'Correct'], ['good', 'Bien bu']].map((o) => {
        const sel = s.waterLevel === o[0];
        return { label: o[1], onTap: self.setWater(o[0]), style: 'flex:1;text-align:center;border-radius:var(--radius-pill);padding:8px 0;font:' + (sel ? 'var(--fw-bold)' : '600') + ' 11.5px var(--font-body);cursor:pointer;' + (sel ? 'background:var(--info-500);color:#fff' : 'background:var(--cream-100);color:var(--cocoa-700)') };
      }),
      waterNudge: s.waterLevel === 'low' ? 'Pense à boire un peu plus demain — ça aide à calmer les FODMAPs et les crampes.' : s.waterLevel === 'ok' ? 'Encore un ou deux verres et tu y es.' : s.waterLevel === 'good' ? 'Bien joué — continue comme ça.' : '',
      waterNudgeShown: !!s.waterLevel,
      confirmDayOk: self.confirmDayOk(), okDays: s.stats.okDays,
      journalMeals, geneSaved: !!s.lastGene,
      lastGeneTime: s.lastGene ? s.lastGene.time : '', lastGeneText: s.lastGene ? s.lastGene.text : '',
      clearGene: self.clearGene(), attributionText: attrib.text,
      geneTimeHeader: "Aujourd'hui, " + attrib.timeLabel,
      wGluten: s.windows.gluten, wLactose: s.windows.lactose, wFructanes: s.windows.fructanes,
      statsRepas: s.stats.repas, statsGenes: s.stats.genes, glutenAvec: s.stats.glutenAvec,
      analyseReady: !s.demoDay1, analyseEmpty: s.demoDay1, toggleDemoDay1: self.toggleDemoDay1(),
      isProfil: s.screen === 'profil', goProfil: self.go('profil'),
      togglePushP: self.enablePush(), toggleAlerts: self.toggleFlag('alertsOn'), toggleCycleTrack: self.toggleFlag('cycleTrackOn'),
      notifPermGranted: s.notifPermission === 'granted', notifPermDenied: s.notifPermission === 'denied', notifPermPending: s.notifPermission !== 'granted',
      notifPermStatus: s.notifPermission === 'granted' ? 'Notifications navigateur activées' : s.notifPermission === 'denied' ? 'Bloquées — change-le dans les réglages du navigateur' : 'Pas encore activées',
      requestNotifPermission: self.requestNotifPermission(),
      pushPTrack: "width:38px;height:22px;border-radius:100px;position:relative;flex-shrink:0;background:" + (s.pushOn ? GOOD : 'var(--sand-400)'),
      pushPKnob: "position:absolute;top:2px;width:18px;height:18px;border-radius:50%;background:#fff;" + (s.pushOn ? 'right:2px;' : 'left:2px;'),
      alertsTrack: "width:38px;height:22px;border-radius:100px;position:relative;flex-shrink:0;background:" + (s.alertsOn ? GOOD : 'var(--sand-400)'),
      alertsKnob: "position:absolute;top:2px;width:18px;height:18px;border-radius:50%;background:#fff;" + (s.alertsOn ? 'right:2px;' : 'left:2px;'),
      cycleTrackTrack: "width:38px;height:22px;border-radius:100px;position:relative;flex-shrink:0;background:" + (s.cycleTrackOn ? INFO : 'var(--sand-400)'),
      cycleTrackKnob: "position:absolute;top:2px;width:18px;height:18px;border-radius:50%;background:#fff;" + (s.cycleTrackOn ? 'right:2px;' : 'left:2px;'),
      doExport: self.doExport(), exportDone: s.exportDone, exportIdle: !s.exportDone,
      demoToggleLabel: s.demoDay1 ? 'Revenir à J9' : 'Voir l\'état J1',
      avecBarStyle: "width:" + s.stats.glutenAvec + "%;height:100%;background:" + AVOID,
      cycleLinkStat,
      waterLinkStat, waterLinkBadge: waterLinkStrong ? 'lien fort' : 'à surveiller', waterLinkBadgeStyle: waterLinkStrong ? "background:var(--info-50);color:var(--info-700);border-radius:var(--radius-pill);padding:3px 9px;font:var(--fw-bold) 10px var(--font-body);flex-shrink:0" : "background:var(--cream-200);color:var(--taupe-600);border-radius:var(--radius-pill);padding:3px 9px;font:var(--fw-bold) 10px var(--font-body);flex-shrink:0",
      obSuspectNames: s.obSuspects.filter((x) => x.on && x.name !== 'Aucune idée').map((x) => x.name).join(', ') || 'aucune',
      obGlutenSuspected: s.obSuspects.some((x) => x.on && x.name === 'Gluten'),
      logMeal: self.logMeal(), saveGene: self.saveGene(),
      goPhoto: self.goPhoto(), goValidateVoice: self.goValidateVoice(),
      onBarcodeDetected: (code) => self.scanDetected(code),
      onVoiceResult: (res) => self.setVoiceResult(res),
      analyzePhoto: self.analyzePhoto(), confirmPhoto: self.confirmPhoto(),
      isPhoto: s.screen === 'photo',
      photoPick: s.photoStage === 'pick', photoScan: s.photoStage === 'scan', photoDone: s.photoStage === 'done',
      photoDetected: self._recipe().map((d) => { const tg = self._tagsOf(d.name); return {
        name: d.name, hasTags: tg.length > 0,
        tags: tg.map((t) => ({ l: t.l, style: "background:var(--cream-200);color:var(--cocoa-700);border-radius:var(--radius-xs);padding:3px 9px;font:600 10.5px " + FONT })),
        conf: d.conf,
        dotStyle: "width:7px;height:7px;border-radius:50%;flex-shrink:0;background:" + (d.conf === 'sûr' ? GOOD : d.conf === 'moyen' ? WATCH : 'var(--sand-400)'),
        confStyle: "font:700 10px " + FONT + ";color:" + (d.conf === 'sûr' ? GOOD_TXT : d.conf === 'moyen' ? WATCH_TXT : MUTED) + ";white-space:nowrap",
      }; }),
      photoCount: self._recipe().length,
      photoFlagCount: self._recipe().filter((d) => self._tagsOf(d.name).length > 0).length,
      photoCtaLabel: 'Vérifier ces ' + self._recipe().length + ' aliments',
      addIng: self.addIng(), validateMealName: s.pendingMeal ? s.pendingMeal.name : 'Déjeuner',
      validateSrcIcon: s.pendingMeal && s.pendingMeal.src === 'photo' ? 'ph ph-image-square' : s.pendingMeal && s.pendingMeal.src === 'recent' ? 'ph ph-clock-counter-clockwise' : s.pendingMeal && s.pendingMeal.src === 'barcode' ? 'ph ph-barcode' : 'ph ph-microphone',
      validateSrcLabel: s.pendingMeal && s.pendingMeal.src === 'photo' ? 'Depuis une photo · ' + s.pendingMeal.desc : s.pendingMeal && s.pendingMeal.src === 'recent' ? 'Repas fréquent · ' + s.pendingMeal.desc : s.pendingMeal && s.pendingMeal.src === 'barcode' ? 'Produit scanné · ' + s.pendingMeal.desc : 'Depuis la voix · ' + ((s.pendingMeal && s.pendingMeal.desc) || 'ton repas'),
      isBarcode: s.screen === 'barcode', goBarcode: self.goBarcode(),
      barcodeInput: s.barcodeInput, onBarcodeInputChange: self.onBarcodeInputChange(), searchBarcode: self.searchBarcode(), backToScan: self.backToScan(), confirmBarcode: self.confirmBarcode(),
      barcodeScanStage: s.barcodeStage === 'scan', barcodeLoadingStage: s.barcodeStage === 'loading', barcodeErrorStage: s.barcodeStage === 'error', barcodeResultStage: s.barcodeStage === 'result',
      barcodeDemos: self._offDemo().map((d) => ({ name: d.name, barcode: d.barcode, onPick: self.fillBarcodeDemo(d.barcode) })),
      bcName: s.barcodeProduct ? s.barcodeProduct.name : '', bcBrand: s.barcodeProduct ? s.barcodeProduct.brand : '',
      bcIngredientsText: s.barcodeProduct ? (s.barcodeProduct.ingredients || 'Liste non communiquée.') : '',
      bcHasAllergens: !!(s.barcodeProduct && s.barcodeProduct.allergens && s.barcodeProduct.allergens.length),
      bcAllergens: s.barcodeProduct ? s.barcodeProduct.allergens.map((t) => ({ 'en:gluten': 'Gluten', 'en:milk': 'Lait', 'en:eggs': 'Œufs', 'en:nuts': 'Fruits à coque', 'en:peanuts': 'Arachides', 'en:soybeans': 'Soja', 'en:celery': 'Céleri', 'en:mustard': 'Moutarde', 'en:sesame-seeds': 'Sésame', 'en:sulphur-dioxide-and-sulphites': 'Sulfites', 'en:fish': 'Poisson', 'en:crustaceans': 'Crustacés', 'en:molluscs': 'Mollusques', 'en:lupin': 'Lupin' }[t] || t.replace('en:', ''))) : [],
      bcSourceStyle: "border-radius:var(--radius-pill);padding:4px 9px;font:700 9.5px " + FONT + ";flex-shrink:0;" + (s.barcodeSource === 'live' ? "background:var(--tol-good-50);color:var(--tol-good-700)" : "background:var(--cream-200);color:var(--cocoa-700)"),
      bcSourceLabel: s.barcodeSource === 'live' ? 'Open Food Facts' : 'exemple démo',
      bcSourceNote: s.barcodeSource === 'live' ? 'Donnée en direct depuis Open Food Facts (base ouverte et gratuite) — la liste peut être incomplète selon les contributions.' : 'Exemple de démonstration — tape un vrai code-barres (13 chiffres, au dos d\'un produit) pour interroger Open Food Facts en direct.',
      captureVoice: s.captureTab !== 'recents', captureRecents: s.captureTab === 'recents', toggleRecentsTab: self.toggleRecentsTab(),
      recentTileStyle: "flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;border-radius:var(--radius-sm);padding:11px 0;font:var(--fw-bold) 11px " + FONT + ";cursor:pointer;box-shadow:var(--shadow-xs);" + (s.captureTab === 'recents' ? "background:var(--coral-50);color:var(--coral-700)" : "background:#fff;color:var(--cocoa-700)"),
      recentTileIconColor: s.captureTab === 'recents' ? 'var(--coral-600)' : 'var(--coral-500)',
      toastShown: !!s.toast, toastMsg: s.toast || '',
      exportAll: self.exportAll(), toggleWipe: self.toggleWipe(), doWipe: self.doWipe(), confirmWipe: s.confirmWipe,
      isNotifs: s.screen === 'notifs', goNotifs: self.goNotifs(),
      notifUnread: s.notifs.filter((n) => !n.read).length, hasUnread: s.notifs.some((n) => !n.read),
      notifsList: s.notifs.map((n) => { const cm = { good: [GOOD, GOOD_SOFT], watch: [WATCH, WATCH_SOFT], info: [INFO, 'var(--info-50)'], coral: [CORAL, 'var(--coral-50)'] }[n.color] || [CORAL, 'var(--coral-50)']; return {
        title: n.title, text: n.text, time: n.time, iconCls: 'ph-fill ' + n.icon, onTap: self.openNotif(n.action),
        iconWrap: "width:36px;height:36px;border-radius:var(--radius-sm);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;color:" + cm[0] + ";background:" + cm[1],
        rowStyle: "display:flex;gap:12px;align-items:flex-start;background:#fff;border-radius:var(--radius-md);padding:13px 14px;box-shadow:var(--shadow-xs);cursor:pointer" + (n.read ? ';opacity:.7' : ''),
        dotStyle: n.read ? 'display:none' : "width:8px;height:8px;border-radius:50%;background:" + CORAL + ";flex-shrink:0;margin-top:5px",
      }; }),
      testNotif: self.testNotif(),
      pushShown: !!s.push, pushTitle: s.push ? s.push.title : '', pushText: s.push ? s.push.text : '',
      pushIconCls: s.push ? 'ph-fill ' + s.push.icon : 'ph-fill ph-bell', dismissPush: self.dismissPush(), tapPush: self.tapPush(),
      isFoodDb: s.screen === 'foodDb', goFoodDb: self.goFoodDb(),
      fdbCount, fdbCatCount, fdbFamilies, fdbGroups, fdbVersion: db ? db.version : '',
      ergoBandeau: ERGO === 'bandeau', navShowNow: ERGO !== 'bandeau',
      obDaysAgoLabel: (s.currentDay - 1) === 0 ? "aujourd'hui" : 'il y a ' + (s.currentDay - 1) + (s.currentDay - 1 > 1 ? ' jours' : ' jour'),
      obDaysAgoValue: (s.currentDay - 1) === 0 ? "0 j" : '-' + (s.currentDay - 1) + ' j',
      obPeriodDurLabel: s.periodDuration + ' jours', obCycleLenLabel: s.cycleLength + ' jours',
      obLessDay: self.obDaysAgo(-1), obMoreDay: self.obDaysAgo(1), obLessDur: self.obPeriodDur(-1), obMoreDur: self.obPeriodDur(1),
      obPhasePreview: 'Aujourd\'hui : J' + s.currentDay + ' · ' + phaseLabel + ' · prochaines règles ~' + fmt(daysUntilNext),
      elimWarning, elimWarnIng: glutenIng ? glutenIng.name : '',
      prevHasRisk, prevNoRisk: !prevHasRisk, prevHasGluten,
      prevRiskLabel: prevComps.join(' & '), prevChipLabel: lastMeal.name + ' enregistré',
      feedbackYes: self.answerFeedback(true), feedbackNo: self.answerFeedback(false),
      feedbackMsg: s.feedbackYesAnswer
        ? 'Merci — délai perso du gluten affiné à ~' + s.windows.gluten + 'h. L\'app priorisera cette fenêtre.'
        : 'Noté — cette gêne ne comptera pas contre le gluten. Le lien est affaibli.',
      isCycle: s.screen === 'cycle', goCycle: self.go('cycle'),
      ringStyle, forecastGradient, markerDeg, phaseLabel, currentDay: day, cycleLength: CY,
      daysUntilNext, nextPeriodDate: fmt(daysUntilNext), ovDate: fmt(daysUntilOv),
      fertileStart: fmt(Math.max(0, daysUntilOv - 4)), fertileEnd: fmt(daysUntilOv + 1),
      setFlowL: self.setFlow('leger'), setFlowM: self.setFlow('moyen'), setFlowA: self.setFlow('abondant'),
      flowLStyle: flowStyle('leger'), flowMStyle: flowStyle('moyen'), flowAStyle: flowStyle('abondant'),
      flowLLabel: flowLabel('leger'), flowMLabel: flowLabel('moyen'), flowALabel: flowLabel('abondant'),
      flowLDot: flowDot('leger'), flowMDot: flowDot('moyen'), flowADot: flowDot('abondant'),
      cycleSymptoms, avgLen, history, incLen: self.incLen(), decLen: self.decLen(),
      cycleSaved: s.cycleSaved, cycleNotSaved: !s.cycleSaved, cycleSavedSummary,
      saveCycleLog: self.saveCycleLog(), editCycleLog: self.editCycleLog(),
      isJournal: s.screen === 'journal', isCapture: s.screen === 'capture', isValidate: s.screen === 'validate',
      isPrevision: s.screen === 'prevision', isDouleur: s.screen === 'douleur', isNow: s.screen === 'now', isAnalyse: s.screen === 'analyse',
      showNav: ['journal', 'now', 'analyse', 'cycle'].indexOf(s.screen) >= 0,
      navLeft, navRight,
      goJournal: self.go('journal'), goCapture: self.go('capture'), goValidate: self.go('validate'), goValidateBack: self.goValidateBack(),
      goPrevision: self.go('prevision'), goDouleur: self.go('douleur'), goNow: self.go('now'), goAnalyse: self.go('analyse'),
      ings, checkedLabel: 'Valider ce repas (' + checkedCount + ')',
      portionPetiteStyle: portionStyle('petite'), portionNormaleStyle: portionStyle('normale'), portionGrandeStyle: portionStyle('grande'),
      setPortionP: self.setPortion('petite'), setPortionN: self.setPortion('normale'), setPortionG: self.setPortion('grande'),
      intLegerStyle: intStyle('leger'), intMoyenStyle: intStyle('moyen'), intFortStyle: intStyle('fort'),
      intLegerLabel: intLabel('leger'), intMoyenLabel: intLabel('moyen'), intFortLabel: intLabel('fort'),
      intLegerDot: intDot('leger'), intMoyenDot: intDot('moyen'), intFortDot: intDot('fort'),
      setLeger: self.setIntensity('leger'), setMoyen: self.setIntensity('moyen'), setFort: self.setIntensity('fort'),
      pains, locs, cyclePhases,
      geneCycleLabel: (cycleRaw.find((p) => p.v === s.cyclePhase) || cycleRaw[0]).l + (s.cyclePhase === 'regles' ? ' · Jour ' + s.currentDay : ''),
      cycleEditOpen: s.cycleEditOpen, toggleCycleEdit: self.toggleCycleEdit(),
      cycleEditLabel: s.cycleEditOpen ? 'Fermer' : 'Corriger',
      periodChipStyle, periodChipLabel, togglePeriod: self.togglePeriod(),
      timeNowStyle: timeStyle('now'), time1Style: timeStyle('1h'), time3Style: timeStyle('3h'),
      setNow: self.setTiming('now'), set1h: self.setTiming('1h'), set3h: self.setTiming('3h'),
      alertTrackStyle: "width:34px;height:20px;border-radius:100px;position:relative;flex-shrink:0;background:" + (s.alert ? WATCH : 'var(--sand-400)'),
      alertKnobStyle: "position:absolute;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;" + (s.alert ? 'right:2px;' : 'left:2px;'),
      toggleAlert: self.toggleAlert(),
      families, suspects,
      elimIdle: !s.elimination, elimActive: s.elimination === true, startElim: self.startElim(),
      elimDone: s.elimination === 'done', elimReintro: s.elimination === 'reintro',
      elimConfirmed: s.elimination === 'confirmed',
      finishElim: self.finishElim(), startReintro: self.startReintro(), reintroNext: self.reintroNext(),
      reintroStep: s.reintroStep || 1,
      reintroStepLabel: 'Étape ' + (s.reintroStep || 1) + ' / 3',
      reintroPortion: (s.reintroStep || 1) === 1 ? 'une petite portion (1 tranche de pain)' : (s.reintroStep || 1) === 2 ? 'une portion normale (sandwich complet)' : 'une grande portion (pâtes + pain)',
      reintroBarStyle: "width:" + Math.round((s.reintroStep || 1) / 3 * 100) + "%;height:100%;background:var(--info-500)",
      reintroNextLabel: (s.reintroStep || 1) >= 3 ? 'Terminer — voir le résultat (démo)' : 'Étape suivante (démo)',
      isVerdict: s.screen === 'verdict', goVerdict: self.go('verdict'),
      feedbackOpen: !s.feedbackAnswered, feedbackDone: s.feedbackAnswered,
    };
  };
}

function AppView({ V }) {
  return (
    <PhoneFrame>
      <div style={css('position:absolute;inset:0;background:var(--cream-50);font-family:var(--font-body);color:var(--cocoa-800);overflow:hidden')}>

        {/* ===================== ONBOARDING ===================== */}
        {V.isOnboarding && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column;background:var(--cream-50)')}>
          <div style={css('height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;flex-shrink:0')}>
            {V.obShowBack && (
              <div onClick={V.obBack} style={css('width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 20 }}></i></div>
            )}
            {V.obStep0 && <div style={css('width:40px')}></div>}
            <div style={css('display:flex;gap:5px;align-items:center')}>{V.obDots.map((d, i) => (<span key={i} style={css(d.style)}></span>))}</div>
            <div onClick={V.obSkip} style={css('font:var(--fw-semibold) 12px var(--font-body);color:var(--taupe-600);cursor:pointer;padding:8px')}>Passer</div>
          </div>

          {V.obStep0 && (
          <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 30px;text-align:center')}>
            <img src="/logo-obelix.png" alt="Obélix" style={css('width:110px;height:auto;border-radius:26px;box-shadow:var(--shadow-md)')} />
            <div style={css('font:var(--fw-extra) 27px/1.15 var(--font-display);color:var(--ink);margin-top:24px')}>Découvre ce que ton ventre essaie de te dire</div>
            <div style={css('font:var(--fw-regular) 13.5px/1.5 var(--font-body);color:var(--taupe-600);margin-top:12px')}>Logue tes repas en 20 secondes, note tes gênes — Obélix croise tout et identifie <strong style={{ color: 'var(--cocoa-800)' }}>tes</strong> suspects, pas ceux des autres.</div>
            <div style={css('margin-top:18px;display:flex;gap:9px;align-items:center;background:var(--cream-100);border-radius:var(--radius-pill);padding:8px 15px')}><i className="ph-fill ph-shield-check" style={{ fontSize: 15, color: 'var(--tol-good-500)' }}></i><div style={css('font:var(--fw-semibold) 11px var(--font-body);color:var(--cocoa-700)')}>Jamais un diagnostic — un outil d'observation</div></div>
          </div>
          )}

          {V.obStep1 && (
          <div style={css('flex:1;overflow-y:auto;padding:8px 26px 0')} className="ob-scroll">
            <div style={css('font:var(--fw-bold) 23px/1.15 var(--font-display);color:var(--ink)')}>Qu'est-ce qui te gêne le plus ?</div>
            <div style={css('font:var(--fw-regular) 12.5px/1.45 var(--font-body);color:var(--taupe-600);margin-top:7px')}>Tes symptômes habituels — on les propose en premier quand tu signales une gêne.</div>
            <div style={css('display:flex;flex-wrap:wrap;gap:9px;margin-top:18px')}>
              {V.obSymptoms.map((p, i) => (<div key={i} onClick={p.onToggle} style={css(p.style)}>{p.name}</div>))}
            </div>
          </div>
          )}

          {V.obStep2 && (
          <div style={css('flex:1;overflow-y:auto;padding:8px 26px 0')} className="ob-scroll">
            <div style={css('font:var(--fw-bold) 23px/1.15 var(--font-display);color:var(--ink)')}>Tu suspectes déjà quelque chose ?</div>
            <div style={css('font:var(--fw-regular) 12.5px/1.45 var(--font-body);color:var(--taupe-600);margin-top:7px')}>Même une vague intuition. L'app la testera contre tes données — sans a priori.</div>
            <div style={css('display:flex;flex-wrap:wrap;gap:9px;margin-top:18px')}>
              {V.obSuspects.map((p, i) => (<div key={i} onClick={p.onToggle} style={css(p.style)}>{p.name}</div>))}
            </div>
            <div style={css('margin-top:16px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:11px 13px;font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--taupe-600)')}><i className="ph ph-info" style={{ fontSize: 15, color: 'var(--info-500)', flexShrink: 0, marginTop: 1 }}></i><div>« Aucune idée » est une très bonne réponse — c'est justement le travail d'Obélix.</div></div>
          </div>
          )}

          {V.obStep3 && (
          <div style={css('flex:1;overflow-y:auto;padding:8px 26px 0')} className="ob-scroll">
            <div style={css('font:var(--fw-bold) 23px/1.15 var(--font-display);color:var(--ink)')}>Ton cycle compte aussi</div>
            <div style={css('font:var(--fw-regular) 12.5px/1.45 var(--font-body);color:var(--taupe-600);margin-top:7px')}>Les hormones influencent la digestion. Suivre ton cycle évite d'accuser un aliment à tort.</div>
            <div style={css('display:flex;align-items:center;gap:12px;background:#fff;border-radius:var(--radius-lg);padding:15px 16px;box-shadow:var(--shadow-sm);margin-top:18px')}>
              <div style={css('width:34px;height:34px;border-radius:var(--radius-xs);background:var(--info-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--info-500)')}><i className="ph-fill ph-drop" style={{ fontSize: 18 }}></i></div>
              <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 13px var(--font-body);color:var(--ink)')}>Activer le suivi du cycle</div><div style={css('font:var(--fw-regular) 11px var(--font-body);color:var(--taupe-600);margin-top:1px')}>Désactivable à tout moment</div></div>
              <div onClick={V.obToggleCycle} style={css('cursor:pointer')}><div style={css(V.obCycleTrackStyle)}><div style={css(V.obCycleKnobStyle)}></div></div></div>
            </div>
            {V.obCycleShow && (
            <div style={css('margin-top:12px;background:#fff;border-radius:var(--radius-lg);padding:6px 4px;box-shadow:var(--shadow-xs)')}>
              <div style={css('display:flex;align-items:center;padding:11px 14px;border-bottom:1px solid var(--border-soft)')}>
                <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Tes dernières règles</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600);margin-top:1px')}>ont commencé {V.obDaysAgoLabel}</div></div>
                <div style={css('display:flex;align-items:center;gap:10px;flex-shrink:0')}><div onClick={V.obLessDay} style={css('width:30px;height:30px;border-radius:50%;background:var(--info-50);color:var(--info-700);display:flex;align-items:center;justify-content:center;cursor:pointer')}><i className="ph-bold ph-minus" style={{ fontSize: 14 }}></i></div><div style={css('min-width:44px;text-align:center;font:800 12.5px var(--font-mono);color:var(--info-700)')}>{V.obDaysAgoValue}</div><div onClick={V.obMoreDay} style={css('width:30px;height:30px;border-radius:50%;background:var(--info-50);color:var(--info-700);display:flex;align-items:center;justify-content:center;cursor:pointer')}><i className="ph-bold ph-plus" style={{ fontSize: 14 }}></i></div></div>
              </div>
              <div style={css('display:flex;align-items:center;padding:11px 14px;border-bottom:1px solid var(--border-soft)')}>
                <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Durée des règles</div></div>
                <div style={css('display:flex;align-items:center;gap:10px;flex-shrink:0')}><div onClick={V.obLessDur} style={css('width:30px;height:30px;border-radius:50%;background:var(--info-50);color:var(--info-700);display:flex;align-items:center;justify-content:center;cursor:pointer')}><i className="ph-bold ph-minus" style={{ fontSize: 14 }}></i></div><div style={css('min-width:52px;text-align:center;font:800 12.5px var(--font-mono);color:var(--info-700)')}>{V.obPeriodDurLabel}</div><div onClick={V.obMoreDur} style={css('width:30px;height:30px;border-radius:50%;background:var(--info-50);color:var(--info-700);display:flex;align-items:center;justify-content:center;cursor:pointer')}><i className="ph-bold ph-plus" style={{ fontSize: 14 }}></i></div></div>
              </div>
              <div style={css('display:flex;align-items:center;padding:11px 14px')}>
                <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Longueur du cycle</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600);margin-top:1px')}>tu ajusteras plus tard si besoin</div></div>
                <div style={css('display:flex;align-items:center;gap:10px;flex-shrink:0')}><div onClick={V.obLessLen} style={css('width:30px;height:30px;border-radius:50%;background:var(--info-50);color:var(--info-700);display:flex;align-items:center;justify-content:center;cursor:pointer')}><i className="ph-bold ph-minus" style={{ fontSize: 14 }}></i></div><div style={css('min-width:52px;text-align:center;font:800 12.5px var(--font-mono);color:var(--info-700)')}>{V.obCycleLenLabel}</div><div onClick={V.obMoreLen} style={css('width:30px;height:30px;border-radius:50%;background:var(--info-50);color:var(--info-700);display:flex;align-items:center;justify-content:center;cursor:pointer')}><i className="ph-bold ph-plus" style={{ fontSize: 14 }}></i></div></div>
              </div>
            </div>
            )}
            {V.obCycleShow && (
            <div style={css('margin-top:9px;display:flex;align-items:center;gap:8px;background:var(--info-50);border-radius:var(--radius-sm);padding:10px 13px')}><i className="ph-fill ph-calendar-check" style={{ fontSize: 15, color: 'var(--info-500)', flexShrink: 0 }}></i><div style={css('font:var(--fw-semibold) 11px/1.4 var(--font-body);color:var(--info-700)')}>{V.obPhasePreview}</div></div>
            )}
            <div style={css('margin-top:12px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:12px 13px;font:var(--fw-regular) 11px/1.5 var(--font-body);color:var(--taupe-600)')}><i className="ph-fill ph-lock-key" style={{ fontSize: 15, color: 'var(--tol-good-500)', flexShrink: 0, marginTop: 1 }}></i><div><strong style={{ color: 'var(--cocoa-800)' }}>Tes données restent à toi.</strong> Santé et cycle chiffrés sur ton téléphone — jamais vendues, export et suppression à tout moment.</div></div>
          </div>
          )}

          <div style={css('padding:12px 26px 24px;flex-shrink:0')}>
            <div onClick={V.obNext} style={css('background:var(--coral-500);color:#fff;text-align:center;border-radius:var(--radius-md);padding:16px 0;font:var(--fw-bold) 14.5px var(--font-display);cursor:pointer;box-shadow:var(--shadow-brand)')}>{V.obNextLabel}</div>
          </div>
        </div>
        )}

        {/* ===================== JOURNAL ===================== */}
        {V.isJournal && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column;overflow-y:auto;padding-bottom:84px')} className="ob-scroll">
          <div style={css('position:relative;margin:12px 14px 0;border-radius:var(--radius-xl);padding:20px;background:linear-gradient(155deg,var(--coral-100),var(--cream-100));overflow:hidden;flex-shrink:0')}>
            <img src="/logo-mark.png" alt="Obélix" style={css('position:absolute;top:16px;right:18px;height:34px;width:auto;opacity:.9')} />
            <div onClick={V.goNotifs} style={css('position:absolute;top:16px;right:62px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--coral-700);box-shadow:var(--shadow-xs)')}><i className="ph ph-bell" style={{ fontSize: 17 }}></i>{V.hasUnread && (<span style={css('position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--coral-500);color:#fff;font:800 9.5px var(--font-body);display:flex;align-items:center;justify-content:center;border:2px solid var(--cream-100)')}>{V.notifUnread}</span>)}</div>
            {V.navShowNow && (<div onClick={V.goProfil} style={css('position:absolute;top:16px;right:104px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--coral-700);box-shadow:var(--shadow-xs)')}><i className="ph ph-user" style={{ fontSize: 17 }}></i></div>)}
            <div style={css('font:var(--fw-semibold) 12px/1.2 var(--font-mono);color:var(--coral-700);max-width:calc(100% - 152px)')}>Jeudi 4 juillet · 9ᵉ jour de suivi</div>
            <div style={css('font:var(--fw-bold) 26px/1.1 var(--font-display);color:var(--ink);margin-top:6px;max-width:calc(100% - 152px)')}>Bonjour Manon</div>
            <div onClick={V.goNow} style={css('margin-top:14px;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.6);border-radius:var(--radius-sm);padding:10px 12px;cursor:pointer')}>
              <span style={css(V.activeDotStyle)}></span>
              <div style={css('flex:1;font:var(--fw-semibold) 12.5px var(--font-body);color:var(--cocoa-800)')}>{V.activeBannerText}</div>
              <div style={css('display:flex;align-items:center;gap:3px;font:var(--fw-bold) 11.5px var(--font-body);color:var(--coral-600);white-space:nowrap')}>En ce moment<i className="ph ph-caret-right" style={{ fontSize: 12 }}></i></div>
            </div>
            <div style={css('margin-top:10px;display:flex;gap:8px;flex-wrap:wrap')}>
              <div onClick={V.togglePeriod} style={css(V.periodChipStyle)}><i className="ph-fill ph-drop" style={{ fontSize: 13 }}></i>{V.periodChipLabel}</div>
            </div>
          </div>
          <div style={css('display:flex;gap:7px;padding:14px 18px 0;overflow-x:auto;flex-shrink:0')} className="ob-scroll">
            {V.dayTabs.map((d, i) => (
              <div key={i} onClick={d.onSelect} style={css(d.style)}><span>{d.label}</span><span style={css(d.dotStyle)}></span></div>
            ))}
          </div>
          {V.pastGeneShown && (
            <div style={css('margin:12px 18px 0;display:flex;align-items:flex-start;gap:10px;background:var(--tol-avoid-50);border-radius:var(--radius-md);padding:12px 14px')}>
              <i className="ph-fill ph-first-aid-kit" style={{ fontSize: 16, color: 'var(--tol-avoid-500)', flexShrink: 0, marginTop: 1 }}></i>
              <div style={css('flex:1;font:var(--fw-regular) 11.5px/1.45 var(--font-body);color:var(--tol-avoid-700)')}><strong>Gêne à {V.pastGeneTime}</strong> — {V.pastGeneText}</div>
            </div>
          )}
          {V.pastOkShown && (
            <div style={css('margin:12px 18px 0;display:flex;align-items:center;gap:10px;background:var(--tol-good-50);border-radius:var(--radius-md);padding:12px 14px')}>
              <div style={css('width:22px;height:22px;border-radius:50%;background:var(--tol-good-500);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0')}><i className="ph-bold ph-check" style={{ fontSize: 12 }}></i></div>
              <div style={css('flex:1;font:var(--fw-regular) 11.5px/1.4 var(--font-body);color:var(--tol-good-700)')}><strong>Journée confirmée sans gêne</strong> — comptée dans l'analyse.</div>
            </div>
          )}
          {V.geneSaved && (
            <div style={css('margin:12px 18px 0;display:flex;align-items:flex-start;gap:10px;background:var(--tol-good-50);border-radius:var(--radius-md);padding:12px 14px')}>
              <div style={css('width:22px;height:22px;border-radius:50%;background:var(--tol-good-500);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0')}><i className="ph-bold ph-check" style={{ fontSize: 12 }}></i></div>
              <div style={css('flex:1;font:var(--fw-regular) 11.5px/1.45 var(--font-body);color:var(--tol-good-700)')}><strong>Gêne enregistrée ({V.lastGeneTime})</strong> — {V.lastGeneText}. L'analyse est à jour.</div>
              <div onClick={V.clearGene} style={css('cursor:pointer;color:var(--tol-good-700);padding:2px')}><i className="ph ph-x" style={{ fontSize: 14 }}></i></div>
            </div>
          )}
          {V.dayCheckOpen && (
            <div style={css('margin:12px 18px 0;background:var(--tol-good-50);border-radius:var(--radius-lg);padding:14px 16px')}>
              <div style={css('display:flex;align-items:center;gap:7px;font:var(--fw-bold) 12.5px var(--font-display);color:var(--tol-good-700)')}><i className="ph-fill ph-bell-ringing" style={{ fontSize: 14 }}></i>Bilan du soir · 21:00</div>
              <div style={css('font:var(--fw-regular) 11.5px/1.45 var(--font-body);color:var(--tol-good-700);margin-top:3px')}>Aucune gêne signalée aujourd'hui. On confirme ? Les journées « tout roule » rendent l'analyse plus fiable.</div>
              <div style={css('display:flex;gap:8px;margin-top:10px')}>
                <div onClick={V.confirmDayOk} style={css('flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:var(--tol-good-500);color:#fff;border-radius:var(--radius-sm);padding:10px 0;font:var(--fw-bold) 12px var(--font-body);cursor:pointer')}><i className="ph-bold ph-check" style={{ fontSize: 13 }}></i>Tout roule</div>
                <div onClick={V.goDouleur} style={css('flex:1;text-align:center;background:#fff;border:1px solid var(--tol-avoid-100);color:var(--tol-avoid-700);border-radius:var(--radius-sm);padding:10px 0;font:var(--fw-bold) 12px var(--font-body);cursor:pointer')}>J'ai eu une gêne</div>
              </div>
            </div>
          )}
          {V.dayCheckDone && (
            <div style={css('margin:12px 18px 0;display:flex;align-items:center;gap:10px;background:var(--tol-good-50);border-radius:var(--radius-md);padding:12px 14px')}>
              <div style={css('width:22px;height:22px;border-radius:50%;background:var(--tol-good-500);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0')}><i className="ph-bold ph-check" style={{ fontSize: 12 }}></i></div>
              <div style={css('flex:1;font:var(--fw-regular) 11.5px/1.4 var(--font-body);color:var(--tol-good-700)')}><strong>Journée confirmée sans gêne</strong> — comptée dans « jours SANS gêne ». Fiabilité de l'analyse : {V.okDays} j confirmés.</div>
            </div>
          )}
          {V.isToday && (
            <div style={css('margin:12px 18px 0;background:#fff;border-radius:var(--radius-lg);padding:12px 16px;box-shadow:var(--shadow-xs)')}>
              <div style={css('display:flex;align-items:center;gap:8px')}><i className="ph-fill ph-drop" style={{ fontSize: 15, color: 'var(--info-500)' }}></i><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink);white-space:nowrap')}>Hydratation</div></div>
              <div style={css('display:flex;gap:7px;margin-top:9px')}>
                {V.waterOptions.map((o, i) => (
                  <div key={i} onClick={o.onTap} style={css(o.style)}>{o.label}</div>
                ))}
              </div>
              {V.waterNudgeShown && (
                <div style={css('font:var(--fw-regular) 10.5px/1.4 var(--font-body);color:var(--taupe-600);margin-top:8px')}>{V.waterNudge}</div>
              )}
            </div>
          )}
          <div style={css('padding:18px 18px 6px;display:flex;align-items:center;justify-content:space-between')}>
            <div style={css('font:var(--fw-bold) 15px var(--font-display);color:var(--ink)')}>{V.journalSectionTitle}</div>
            {V.isToday && (
              <div onClick={V.goDouleur} style={css('display:flex;align-items:center;gap:5px;border:1.5px solid var(--tol-avoid-100);color:var(--tol-avoid-700);border-radius:var(--radius-pill);padding:6px 13px;font:var(--fw-bold) 11.5px var(--font-body);cursor:pointer;white-space:nowrap')}><i className="ph ph-first-aid-kit" style={{ fontSize: 14 }}></i>J'ai mal</div>
            )}
          </div>
          <div style={css('padding:0 18px;display:flex;flex-direction:column;gap:10px')}>
            {V.journalMeals.map((m, i) => (
              <div key={i} onClick={m.onOpen} style={css('display:flex;gap:12px;background:#fff;border-radius:var(--radius-md);padding:11px;box-shadow:var(--shadow-sm);cursor:pointer')}>
                <div style={css('width:52px;height:52px;border-radius:var(--radius-sm);background:var(--coral-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--coral-400)')}><i className={'ph ' + m.icon} style={{ fontSize: 26 }}></i></div>
                <div style={css('flex:1;padding-top:2px')}>
                  <div style={css('font:var(--fw-bold) 13.5px var(--font-body);color:var(--ink)')}>{m.name}</div>
                  <div style={css('font:var(--fw-regular) 12px var(--font-body);color:var(--taupe-600);margin-top:1px')}>{m.desc}</div>
                  {m.hasTags && (
                    <div style={css('margin-top:7px;display:flex;gap:5px;flex-wrap:wrap')}>
                      {m.tags.map((t, j) => (<span key={j} style={css('background:var(--cream-200);border-radius:var(--radius-xs);padding:2px 8px;font:var(--fw-semibold) 10px var(--font-body);color:var(--cocoa-700)')}>{t.l}</span>))}
                    </div>
                  )}
                </div>
                <div style={css('font:var(--fw-regular) 11px var(--font-mono);color:var(--sand-500)')}>{m.timeLabel}</div>
              </div>
            ))}
            {V.isToday && (
              <div onClick={V.goCapture} style={css('display:flex;align-items:center;justify-content:center;gap:8px;border:1.5px dashed var(--border-strong);border-radius:var(--radius-md);padding:16px;color:var(--taupe-600);cursor:pointer')}>
                <i className="ph ph-plus" style={{ fontSize: 17 }}></i><div style={css('font:var(--fw-bold) 12.5px var(--font-body)')}>Ajouter un repas</div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* ===================== CAPTURE ===================== */}
        {V.isCapture && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
            <div style={css('text-align:center')}><div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Nouveau repas</div><div style={css('margin-top:3px;display:flex;gap:4px;justify-content:center')}><span style={css('width:6px;height:6px;border-radius:50%;background:var(--coral-500)')}></span><span style={css('width:6px;height:6px;border-radius:50%;background:var(--sand-400)')}></span><span style={css('width:6px;height:6px;border-radius:50%;background:var(--sand-400)')}></span></div></div>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--taupe-600)')}><i className="ph ph-x" style={{ fontSize: 19 }}></i></div>
          </div>
          {V.captureVoice && <VoiceCapture onResult={V.onVoiceResult} />}

          {V.captureRecents && (
          <div style={css('flex:1;overflow-y:auto;padding:6px 20px 0')} className="ob-scroll">
            <div style={css('font:var(--fw-regular) 12px/1.4 var(--font-body);color:var(--taupe-600);margin-bottom:12px;text-align:center')}>Repas fréquents — relis les ingrédients avant de valider</div>
            <div style={css('display:flex;flex-direction:column;gap:9px')}>
              {V.recents.map((r, i) => (
                <div key={i} style={css('background:#fff;border-radius:var(--radius-md);padding:12px 13px;box-shadow:var(--shadow-xs)')}>
                  <div style={css('display:flex;align-items:center;gap:11px')}>
                    <div style={css('width:40px;height:40px;border-radius:var(--radius-xs);background:var(--coral-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--coral-400)')}><i className={'ph ' + r.icon} style={{ fontSize: 21 }}></i></div>
                    <div style={css('flex:1;min-width:0')}>
                      <div style={css('display:flex;align-items:center;gap:6px')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1')}>{r.name}</div><div style={css('font:500 9.5px var(--font-mono);color:var(--sand-500);flex-shrink:0')}>{r.countLabel}</div></div>
                      <div style={css('font:var(--fw-regular) 11px var(--font-body);color:var(--taupe-600);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{r.desc}</div>
                    </div>
                    <div onClick={r.onRelog} style={css('display:flex;align-items:center;gap:5px;background:var(--coral-500);color:#fff;border-radius:var(--radius-pill);padding:8px 13px;font:var(--fw-bold) 11.5px var(--font-body);cursor:pointer;flex-shrink:0;box-shadow:var(--shadow-brand-soft)')}><i className="ph-bold ph-arrow-counter-clockwise" style={{ fontSize: 12 }}></i>Relire</div>
                  </div>
                  {r.hasTags && (
                    <div style={css('display:flex;flex-wrap:wrap;gap:6px;margin-top:9px')}>{r.tags.map((w, j) => (<div key={j} style={css(w.chipStyle)}><i className="ph-fill ph-timer" style={{ fontSize: 11 }}></i>{w.name} {w.win}</div>))}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}

          <div style={css('padding:0 20px;display:flex;gap:8px;margin-bottom:12px')}>
            <div onClick={V.goPhoto} style={css('flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;background:#fff;border-radius:var(--radius-sm);padding:11px 0;font:var(--fw-bold) 11px var(--font-body);color:var(--cocoa-700);box-shadow:var(--shadow-xs);cursor:pointer')}><i className="ph ph-camera" style={{ fontSize: 18, color: 'var(--coral-500)' }}></i>Photo</div>
            <div onClick={V.goPhoto} style={css('flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;background:#fff;border-radius:var(--radius-sm);padding:11px 0;font:var(--fw-bold) 11px var(--font-body);color:var(--cocoa-700);box-shadow:var(--shadow-xs);cursor:pointer')}><i className="ph ph-image-square" style={{ fontSize: 18, color: 'var(--coral-500)' }}></i>Capture</div>
            <div onClick={V.toggleRecentsTab} style={css(V.recentTileStyle)}><i className="ph ph-clock-counter-clockwise" style={{ fontSize: 18, color: V.recentTileIconColor }}></i>Récents</div>
            <div onClick={V.goBarcode} style={css('flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;background:#fff;border-radius:var(--radius-sm);padding:11px 0;font:var(--fw-bold) 11px var(--font-body);color:var(--cocoa-700);box-shadow:var(--shadow-xs);cursor:pointer')}><i className="ph ph-barcode" style={{ fontSize: 18, color: 'var(--coral-500)' }}></i>Code-barres</div>
          </div>
          {V.captureVoice && (
          <div style={css('padding:0 20px 20px')}>
            <div onClick={V.goValidateVoice} style={css('background:var(--coral-500);color:#fff;text-align:center;border-radius:var(--radius-md);padding:15px 0;font:var(--fw-bold) 14px var(--font-display);cursor:pointer;box-shadow:var(--shadow-brand)')}>Vérifier les ingrédients</div>
          </div>
          )}
        </div>
        )}

        {/* ===================== CODE-BARRES ===================== */}
        {V.isBarcode && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div onClick={V.goCapture} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
            <div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Scanner un produit</div>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--taupe-600)')}><i className="ph ph-x" style={{ fontSize: 19 }}></i></div>
          </div>

          {V.barcodeScanStage && (
          <div style={css('flex:1;overflow-y:auto;padding:14px 20px 20px')} className="ob-scroll">
            <div style={css('font:var(--fw-bold) 18px/1.2 var(--font-display);color:var(--ink)')}>Vise un code-barres</div>
            <div style={css('font:var(--fw-regular) 12px/1.5 var(--font-body);color:var(--taupe-600);margin-top:6px')}>Pour un produit industriel (biscuits, plats préparés, sauces…) — Obélix lit la liste d'ingrédients et les allergènes déclarés via Open Food Facts.</div>
            <CameraScanner onDetected={V.onBarcodeDetected} />
            <div style={css('margin-top:14px;display:flex;gap:8px')}>
              <input type="text" value={V.barcodeInput} onChange={V.onBarcodeInputChange} placeholder="Ou saisis les 13 chiffres" style={css('flex:1;border:1px solid var(--border-strong);border-radius:var(--radius-sm);padding:12px 13px;font:500 13px var(--font-mono);color:var(--ink);background:#fff')} />
              <div onClick={V.searchBarcode} style={css('background:var(--coral-500);color:#fff;border-radius:var(--radius-sm);padding:0 18px;display:flex;align-items:center;justify-content:center;font:var(--fw-bold) 12.5px var(--font-body);cursor:pointer')}>OK</div>
            </div>
            <div style={css('font:var(--fw-bold) 11px var(--font-body);color:var(--taupe-600);margin:16px 2px 8px')}>Exemples pour tester</div>
            <div style={css('display:flex;flex-direction:column;gap:7px')}>
              {V.barcodeDemos.map((d, i) => (
                <div key={i} onClick={d.onPick} style={css('display:flex;align-items:center;gap:10px;background:#fff;border-radius:var(--radius-sm);padding:10px 12px;box-shadow:var(--shadow-xs);cursor:pointer')}>
                  <i className="ph ph-barcode" style={{ fontSize: 16, color: 'var(--coral-500)', flexShrink: 0 }}></i>
                  <div style={css('flex:1;min-width:0')}><div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{d.name}</div><div style={css('font:500 10px var(--font-mono);color:var(--sand-500)')}>{d.barcode}</div></div>
                  <i className="ph ph-caret-right" style={{ fontSize: 13, color: 'var(--sand-500)', flexShrink: 0 }}></i>
                </div>
              ))}
            </div>
          </div>
          )}

          {V.barcodeLoadingStage && (
            <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px')}>
              <i className="ph ph-circle-notch" style={{ fontSize: 38, color: 'var(--coral-500)', animation: 'obspin 1s linear infinite' }}></i>
              <div style={css('font:var(--fw-bold) 13px var(--font-body);color:var(--cocoa-700)')}>Recherche du produit…</div>
            </div>
          )}

          {V.barcodeErrorStage && (
            <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:0 30px;text-align:center')}>
              <i className="ph ph-warning-circle" style={{ fontSize: 38, color: 'var(--tol-watch-500)' }}></i>
              <div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink)')}>Produit introuvable</div>
              <div style={css('font:var(--fw-regular) 12px/1.5 var(--font-body);color:var(--taupe-600)')}>Code inconnu d'Open Food Facts, ou réseau indisponible. Essaie un des exemples de démo.</div>
              <div onClick={V.backToScan} style={css('background:#fff;border:1px solid var(--border-strong);color:var(--cocoa-700);border-radius:var(--radius-md);padding:12px 22px;font:var(--fw-bold) 12.5px var(--font-body);cursor:pointer')}>Réessayer</div>
            </div>
          )}

          {V.barcodeResultStage && (<>
          <div style={css('flex:1;overflow-y:auto;padding:14px 18px 0')} className="ob-scroll">
            <div style={css('display:flex;align-items:center;gap:12px;background:#fff;border-radius:var(--radius-lg);padding:13px 14px;box-shadow:var(--shadow-sm)')}>
              <div style={css('width:44px;height:44px;border-radius:var(--radius-xs);background:var(--coral-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--coral-500)')}><i className="ph ph-barcode" style={{ fontSize: 22 }}></i></div>
              <div style={css('flex:1;min-width:0')}><div style={css('font:var(--fw-bold) 14.5px var(--font-display);color:var(--ink)')}>{V.bcName}</div><div style={css('font:var(--fw-regular) 11px var(--font-body);color:var(--taupe-600);margin-top:1px')}>{V.bcBrand}</div></div>
              <div style={css(V.bcSourceStyle)}>{V.bcSourceLabel}</div>
            </div>
            {V.bcHasAllergens && (<>
              <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:16px 2px 8px')}>Allergènes déclarés</div>
              <div style={css('display:flex;flex-wrap:wrap;gap:6px')}>{V.bcAllergens.map((a, i) => (<span key={i} style={css('background:var(--tol-avoid-50);color:var(--tol-avoid-700);border-radius:var(--radius-pill);padding:4px 10px;font:700 10.5px var(--font-body);white-space:nowrap')}>{a}</span>))}</div>
            </>)}
            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:16px 2px 8px')}>Liste d'ingrédients</div>
            <div style={css('background:#fff;border-radius:var(--radius-sm);padding:12px 13px;box-shadow:var(--shadow-xs);font:var(--fw-regular) 11.5px/1.6 var(--font-body);color:var(--cocoa-700)')}>{V.bcIngredientsText}</div>
            <div style={css('margin-top:10px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:11px 13px;font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--taupe-600)')}><i className="ph ph-info" style={{ fontSize: 15, color: 'var(--info-500)', flexShrink: 0, marginTop: 1 }}></i><div>{V.bcSourceNote}</div></div>
          </div>
          <div style={css('padding:12px 18px 20px;flex-shrink:0;display:flex;gap:8px')}>
            <div onClick={V.backToScan} style={css('flex:1;text-align:center;background:#fff;border:1px solid var(--border-strong);color:var(--cocoa-700);border-radius:var(--radius-md);padding:14px 0;font:var(--fw-bold) 13px var(--font-body);cursor:pointer')}>Autre produit</div>
            <div onClick={V.confirmBarcode} style={css('flex:1.5;text-align:center;background:var(--coral-500);color:#fff;border-radius:var(--radius-md);padding:14px 0;font:var(--fw-bold) 13.5px var(--font-display);cursor:pointer;box-shadow:var(--shadow-brand)')}>Vérifier les ingrédients</div>
          </div>
          </>)}
        </div>
        )}

        {/* ===================== PHOTO ===================== */}
        {V.isPhoto && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div onClick={V.goCapture} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
            <div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Photo &amp; capture d'écran</div>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--taupe-600)')}><i className="ph ph-x" style={{ fontSize: 19 }}></i></div>
          </div>

          {V.photoPick && (<>
          <div style={css('flex:1;overflow-y:auto;padding:14px 18px 0')} className="ob-scroll">
            <div style={css('font:var(--fw-bold) 18px/1.2 var(--font-display);color:var(--ink)')}>Lis une recette en photo</div>
            <div style={css('font:var(--fw-regular) 12px/1.5 var(--font-body);color:var(--taupe-600);margin-top:6px')}>Photographie une liste d'ingrédients (livre, étiquette) ou dépose une <strong>capture d'écran</strong> — Marmiton, Instagram, tes notes. L'IA lit le texte et identifie chaque aliment + ses composés.</div>
            <div style={css('margin-top:14px;height:196px;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm)')}>
              <ImageSlot placeholder="Dépose une photo ou capture · ou touche pour choisir" />
            </div>
            <div style={css('display:flex;flex-wrap:wrap;gap:7px;margin-top:12px')}>
              <span style={css('display:flex;align-items:center;gap:5px;background:var(--cream-100);border-radius:var(--radius-pill);padding:6px 11px;font:600 11px var(--font-body);color:var(--cocoa-700)')}><i className="ph ph-book-open" style={{ fontSize: 13, color: 'var(--coral-500)' }}></i>Livre de cuisine</span>
              <span style={css('display:flex;align-items:center;gap:5px;background:var(--cream-100);border-radius:var(--radius-pill);padding:6px 11px;font:600 11px var(--font-body);color:var(--cocoa-700)')}><i className="ph ph-device-mobile" style={{ fontSize: 13, color: 'var(--coral-500)' }}></i>Capture d'écran</span>
              <span style={css('display:flex;align-items:center;gap:5px;background:var(--cream-100);border-radius:var(--radius-pill);padding:6px 11px;font:600 11px var(--font-body);color:var(--cocoa-700)')}><i className="ph ph-tag" style={{ fontSize: 13, color: 'var(--coral-500)' }}></i>Étiquette produit</span>
            </div>
            <div style={css('margin-top:12px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:11px 13px;font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--taupe-600)')}><i className="ph-fill ph-lock-key" style={{ fontSize: 15, color: 'var(--tol-good-500)', flexShrink: 0, marginTop: 1 }}></i><div>L'image est analysée sur ton téléphone — rien n'est envoyé ni stocké en ligne.</div></div>
          </div>
          <div style={css('padding:12px 18px 20px;flex-shrink:0')}>
            <div onClick={V.analyzePhoto} style={css('display:flex;align-items:center;justify-content:center;gap:8px;background:var(--coral-500);color:#fff;text-align:center;border-radius:var(--radius-md);padding:15px 0;font:var(--fw-bold) 14px var(--font-display);cursor:pointer;box-shadow:var(--shadow-brand)')}><i className="ph ph-scan" style={{ fontSize: 17 }}></i>Identifier les aliments</div>
          </div>
          </>)}

          {V.photoScan && (
          <div style={css('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:0 30px;text-align:center')}>
            <div style={css('width:96px;height:96px;border-radius:50%;background:var(--coral-50);display:flex;align-items:center;justify-content:center;color:var(--coral-500)')}><i className="ph ph-scan" style={{ fontSize: 44 }}></i></div>
            <div><div style={css('font:var(--fw-bold) 17px var(--font-display);color:var(--ink)')}>Lecture de la liste…</div><div style={css('font:var(--fw-regular) 12px/1.5 var(--font-body);color:var(--taupe-600);margin-top:6px')}>Reconnaissance du texte, puis correspondance aliment → composés (gluten, FODMAP, histamine…).</div></div>
            <div style={css('width:180px;height:6px;border-radius:3px;background:var(--cream-200);overflow:hidden')}><div style={css('width:70%;height:100%;background:var(--coral-500);border-radius:3px')}></div></div>
          </div>
          )}

          {V.photoDone && (<>
          <div style={css('flex:1;overflow-y:auto;padding:14px 18px 0')} className="ob-scroll">
            <div style={css('display:flex;align-items:center;gap:12px;background:#fff;border-radius:var(--radius-lg);padding:12px 14px;box-shadow:var(--shadow-sm)')}>
              <div style={css('width:52px;height:52px;border-radius:var(--radius-sm);overflow:hidden;flex-shrink:0')}>
                <ImageSlot placeholder="recette" compact />
              </div>
              <div style={css('flex:1;min-width:0')}><div style={css('font:var(--fw-bold) 15px var(--font-display);color:var(--ink)')}>Dahl de lentilles corail</div><div style={css('font:var(--fw-regular) 11px var(--font-body);color:var(--taupe-600);margin-top:2px')}>{V.photoCount} aliments détectés · {V.photoFlagCount} composés à suivre</div></div>
              <div style={css('background:var(--tol-good-50);color:var(--tol-good-700);border-radius:var(--radius-pill);padding:4px 9px;font:700 10px var(--font-body);flex-shrink:0')}>lecture OK</div>
            </div>
            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:16px 2px 8px')}>Aliments identifiés</div>
            <div style={css('display:flex;flex-direction:column;gap:7px')}>
              {V.photoDetected.map((d, i) => (
                <div key={i} style={css('display:flex;align-items:center;gap:10px;background:#fff;border-radius:var(--radius-sm);padding:11px 13px;box-shadow:var(--shadow-xs)')}>
                  <div style={css('flex:1;min-width:0')}>
                    <div style={css('font:var(--fw-bold) 13px var(--font-body);color:var(--ink)')}>{d.name}</div>
                    {d.hasTags && (
                      <div style={css('display:flex;flex-wrap:wrap;gap:5px;margin-top:5px')}>{d.tags.map((t, j) => (<span key={j} style={css(t.style)}>{t.l}</span>))}</div>
                    )}
                  </div>
                  <div style={css('display:flex;align-items:center;gap:5px;flex-shrink:0')}><span style={css(d.dotStyle)}></span><span style={css(d.confStyle)}>{d.conf}</span></div>
                </div>
              ))}
            </div>
            <div style={css('margin-top:10px;display:flex;gap:9px;background:var(--tol-watch-50);border-radius:var(--radius-sm);padding:11px 13px;font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--tol-watch-700)')}><i className="ph-fill ph-info" style={{ fontSize: 15, color: 'var(--tol-watch-500)', flexShrink: 0, marginTop: 1 }}></i><div>Vérifie la liste — l'IA peut se tromper sur un plat maison. Tu pourras décocher au moment de valider.</div></div>
          </div>
          <div style={css('padding:12px 18px 20px;flex-shrink:0;display:flex;gap:8px')}>
            <div onClick={V.goPhoto} style={css('flex:1;text-align:center;background:#fff;border:1px solid var(--border-strong);color:var(--cocoa-700);border-radius:var(--radius-md);padding:14px 0;font:var(--fw-bold) 13px var(--font-body);cursor:pointer')}>Reprendre</div>
            <div onClick={V.confirmPhoto} style={css('flex:1.5;text-align:center;background:var(--coral-500);color:#fff;border-radius:var(--radius-md);padding:14px 0;font:var(--fw-bold) 13.5px var(--font-display);cursor:pointer;box-shadow:var(--shadow-brand)')}>{V.photoCtaLabel}</div>
          </div>
          </>)}
        </div>
        )}

        {/* ===================== VALIDATION ===================== */}
        {V.isValidate && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div onClick={V.goValidateBack} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
            <div style={css('text-align:center')}><div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Vérifie &amp; valide</div><div style={css('margin-top:3px;display:flex;gap:4px;justify-content:center')}><span style={css('width:6px;height:6px;border-radius:50%;background:var(--coral-500)')}></span><span style={css('width:6px;height:6px;border-radius:50%;background:var(--coral-500)')}></span><span style={css('width:6px;height:6px;border-radius:50%;background:var(--sand-400)')}></span></div></div>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--taupe-600)')}><i className="ph ph-x" style={{ fontSize: 19 }}></i></div>
          </div>
          <div style={css('padding:12px 18px 0;flex:1;overflow-y:auto')} className="ob-scroll">
            <div style={css('display:inline-flex;align-items:center;gap:6px;background:var(--coral-50);border-radius:var(--radius-pill);padding:5px 11px;font:var(--fw-bold) 11px var(--font-body);color:var(--coral-600);margin-bottom:10px')}><i className={V.validateSrcIcon} style={{ fontSize: 13 }}></i>{V.validateSrcLabel}</div>
            <div style={css('font:var(--fw-regular) 12px var(--font-body);color:var(--taupe-600);margin-bottom:12px')}>L'IA a décomposé ton plat. Décoche, ajuste, puis valide — seuls les ingrédients cochés comptent dans l'analyse.</div>
            <div style={css('display:flex;flex-direction:column;gap:8px')}>
              {V.ings.map((p, i) => (
                <div key={i} style={css(p.rowStyle)}>
                  <div onClick={p.onToggle} style={css(p.boxStyle)}><i className={p.checkCls} style={{ fontSize: 13 }}></i></div>
                  <div style={css('flex:1;min-width:0')}>
                    <div style={css(p.nameStyle)}>{p.name}</div>
                    {p.hasTags && (
                      <div style={css('display:flex;flex-wrap:wrap;gap:5px;margin-top:5px')}>
                        {p.tags.map((t, j) => (<span key={j} style={css(t.style)}>{t.l}</span>))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div onClick={V.addIng} style={css('display:flex;align-items:center;gap:10px;border:1.5px dashed var(--border-strong);border-radius:var(--radius-sm);padding:12px 14px;color:var(--taupe-600);margin-top:8px;cursor:pointer')}><i className="ph ph-plus" style={{ fontSize: 16 }}></i><div style={css('font:var(--fw-semibold) 12.5px var(--font-body)')}>Ajouter un ingrédient oublié</div></div>
            {V.elimWarning && (
              <div style={css('margin-top:10px;display:flex;gap:9px;align-items:flex-start;background:var(--tol-watch-50);border-radius:var(--radius-sm);padding:11px 13px')}><i className="ph-fill ph-warning" style={{ fontSize: 15, color: 'var(--tol-watch-500)', flexShrink: 0, marginTop: 1 }}></i><div style={css('font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--tol-watch-700)')}><strong>{V.elimWarnIng}</strong> contient du gluten — tu es en plein test d'éviction (J2/7). Décoche-le ou le test sera faussé.</div></div>
            )}
            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:16px 2px 8px')}>Quantité</div>
            <div style={css('display:flex;gap:8px')}>
              <div onClick={V.setPortionP} style={css(V.portionPetiteStyle)}>Petite</div>
              <div onClick={V.setPortionN} style={css(V.portionNormaleStyle)}>Normale</div>
              <div onClick={V.setPortionG} style={css(V.portionGrandeStyle)}>Grande</div>
            </div>
            <div style={css('display:flex;gap:8px;margin-top:14px')}>
              <div style={css('background:var(--coral-500);color:#fff;border-radius:var(--radius-pill);padding:6px 13px;font:var(--fw-bold) 11.5px var(--font-body)')}>{V.validateMealName}</div>
              <div style={css('background:#fff;border:1px solid var(--border-strong);border-radius:var(--radius-pill);padding:6px 13px;font:var(--fw-regular) 11.5px var(--font-mono);color:var(--taupe-600)')}>12:40</div>
            </div>
          </div>
          <div style={css('padding:10px 18px 20px;flex-shrink:0')}>
            <div onClick={V.logMeal} style={css('background:var(--coral-500);color:#fff;text-align:center;border-radius:var(--radius-md);padding:15px 0;font:var(--fw-bold) 14px var(--font-display);cursor:pointer;box-shadow:var(--shadow-brand)')}>{V.checkedLabel}</div>
          </div>
        </div>
        )}

        {/* ===================== PRÉVISION ===================== */}
        {V.isPrevision && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div style={css('width:46px')}></div>
            <div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Prévision</div>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--taupe-600)')}><i className="ph ph-x" style={{ fontSize: 19 }}></i></div>
          </div>
          <div style={css('flex:1;overflow-y:auto;padding:14px 18px 0')} className="ob-scroll">
            <div style={css('display:inline-flex;align-items:center;gap:6px;background:var(--tol-good-50);border-radius:var(--radius-pill);padding:5px 11px 5px 8px;font:var(--fw-bold) 11px var(--font-body);color:var(--tol-good-700)')}><span style={css('width:16px;height:16px;border-radius:50%;background:var(--tol-good-500);color:#fff;display:flex;align-items:center;justify-content:center')}><i className="ph-bold ph-check" style={{ fontSize: 10 }}></i></span>{V.prevChipLabel}</div>
            <div style={css('font:var(--fw-bold) 22px/1.1 var(--font-display);color:var(--ink);margin:12px 0 14px')}>Prévision des prochaines 24h</div>
            <div style={css('display:flex;flex-direction:column;gap:10px')}>
              <div style={css('background:#fff;border-radius:var(--radius-lg);padding:16px 16px 14px;box-shadow:var(--shadow-sm)')}>
                <div style={css('display:flex;align-items:baseline;justify-content:space-between')}><div style={css('font:var(--fw-semibold) 12px var(--font-body);color:var(--cocoa-700)')}>Digestion estimée</div><div style={css('font:500 17px var(--font-mono);color:var(--tol-good-700)')}>~5h</div></div>
                <div style={css('margin-top:12px;position:relative;height:10px;border-radius:5px;background:var(--cream-200);overflow:hidden')}><div style={css('position:absolute;left:0;top:0;height:100%;width:21%;background:var(--tol-good-500);border-radius:5px')}></div></div>
                {V.prevHasRisk && (<>
                  <div style={css('margin-top:14px;font:var(--fw-semibold) 12px var(--font-body);color:var(--cocoa-700);margin-bottom:6px')}>Fenêtre à risque · {V.prevRiskLabel}</div>
                  <div style={css('position:relative;height:10px;border-radius:5px;background:var(--cream-200);overflow:hidden')}><div style={css('position:absolute;left:8%;top:0;height:100%;right:0;background:repeating-linear-gradient(45deg,var(--tol-avoid-500),var(--tol-avoid-500) 5px,var(--tol-avoid-100) 5px,var(--tol-avoid-100) 10px)')}></div></div>
                  <div style={css('display:flex;justify-content:space-between;margin-top:7px;font:400 10px var(--font-mono);color:var(--sand-500)')}><span>13h</span><span>+6h</span><span>+12h</span><span>+24h</span></div>
                </>)}
                {V.prevNoRisk && (
                  <div style={css('margin-top:12px;font:var(--fw-regular) 11.5px/1.4 var(--font-body);color:var(--tol-good-700)')}>Aucun composé suspect coché dans ce repas — pas de fenêtre à surveiller.</div>
                )}
              </div>
              <div style={css('background:var(--tol-good-50);border-radius:var(--radius-lg);padding:14px 16px')}>
                <div style={css('display:flex;align-items:center;gap:7px;font:var(--fw-bold) 13px var(--font-display);color:var(--tol-good-700)')}><i className="ph-fill ph-leaf" style={{ fontSize: 15 }}></i>Plutôt facile à digérer</div>
                <div style={css('font:var(--fw-regular) 11.5px/1.45 var(--font-body);color:var(--tol-good-700);margin-top:4px')}>Riche en fibres, peu de graisses. L'estomac devrait se vider en ~5h.</div>
              </div>
              {V.prevHasGluten && (
              <div style={css('background:var(--tol-watch-50);border-radius:var(--radius-lg);padding:14px 16px')}>
                <div style={css('display:flex;align-items:center;justify-content:space-between')}><div style={css('display:flex;align-items:center;gap:7px;font:var(--fw-bold) 13px var(--font-display);color:var(--tol-watch-700)')}><i className="ph-fill ph-eye" style={{ fontSize: 15 }}></i>À surveiller · Gluten</div><div style={css('background:#fff;border-radius:var(--radius-pill);padding:3px 9px;font:var(--fw-bold) 10.5px var(--font-body);color:var(--tol-watch-700)')}>suspect n°1</div></div>
                <div style={css('font:var(--fw-regular) 11.5px/1.45 var(--font-body);color:var(--tol-watch-700);margin-top:5px')}>Ton principal suspect ({V.glutenAvec}%). D'après ton historique, la gêne apparaît plutôt vers <strong>+{V.wGluten}h</strong>.</div>
                <div onClick={V.toggleAlert} style={css('margin-top:10px;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.6);border-radius:var(--radius-sm);padding:8px 11px;cursor:pointer')}><div style={css(V.alertTrackStyle)}><div style={css(V.alertKnobStyle)}></div></div><div style={css('font:var(--fw-semibold) 11.5px var(--font-body);color:var(--tol-watch-700)')}>Me prévenir à +{V.wGluten}h</div></div>
              </div>
              )}
            </div>
          </div>
          <div style={css('padding:12px 18px 20px;display:flex;gap:8px;flex-shrink:0')}>
            <div onClick={V.goNow} style={css('flex:1;text-align:center;background:#fff;border:1px solid var(--border-strong);color:var(--cocoa-700);border-radius:var(--radius-md);padding:14px 0;font:var(--fw-bold) 13px var(--font-body);cursor:pointer')}>En ce moment</div>
            <div onClick={V.goJournal} style={css('flex:1;text-align:center;background:var(--coral-500);color:#fff;border-radius:var(--radius-md);padding:14px 0;font:var(--fw-bold) 13.5px var(--font-display);cursor:pointer;box-shadow:var(--shadow-brand)')}>Terminé</div>
          </div>
        </div>
        )}

        {/* ===================== SIGNALER UNE GÊNE ===================== */}
        {V.isDouleur && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
            <div style={css('text-align:center')}><div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Signaler une gêne</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600);margin-top:1px')}>digestive · sera reliée à tes repas</div></div>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--taupe-600)')}><i className="ph ph-x" style={{ fontSize: 19 }}></i></div>
          </div>
          <div style={css('flex:1;overflow-y:auto;padding:8px 20px 0')} className="ob-scroll">
            <div style={css('font:var(--fw-regular) 12px var(--font-mono);color:var(--taupe-600);margin:4px 0 2px')}>{V.geneTimeHeader}</div>
            <div style={css('padding:14px 0 6px;font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700)')}>Intensité</div>
            <div style={css('display:flex;gap:8px')}>
              <div onClick={V.setLeger} style={css(V.intLegerStyle)}><div style={css('width:14px;height:14px;border-radius:50%;background:' + V.intLegerDot + ';margin:0 auto 6px')}></div><div style={css(V.intLegerLabel)}>Léger</div></div>
              <div onClick={V.setMoyen} style={css(V.intMoyenStyle)}><div style={css('width:20px;height:20px;border-radius:50%;background:' + V.intMoyenDot + ';margin:0 auto 4px')}></div><div style={css(V.intMoyenLabel)}>Moyen</div></div>
              <div onClick={V.setFort} style={css(V.intFortStyle)}><div style={css('width:26px;height:26px;border-radius:50%;background:' + V.intFortDot + ';margin:0 auto 1px')}></div><div style={css(V.intFortLabel)}>Fort</div></div>
            </div>
            <div style={css('padding:18px 0 6px;font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700)')}>Type de gêne</div>
            <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>
              {V.pains.map((p, i) => (<div key={i} onClick={p.onToggle} style={css(p.style)}>{p.name}</div>))}
            </div>
            <div style={css('padding:18px 0 6px;font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700)')}>Où ? · localisation</div>
            <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>
              {V.locs.map((p, i) => (<div key={i} onClick={p.onToggle} style={css(p.style)}>{p.name}</div>))}
            </div>
            <div style={css('padding:18px 0 6px;font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700)')}>Ça a commencé…</div>
            <div style={css('display:flex;gap:8px')}>
              <div onClick={V.setNow} style={css(V.timeNowStyle)}>Maintenant</div>
              <div onClick={V.set1h} style={css(V.time1Style)}>Il y a ~1h</div>
              <div onClick={V.set3h} style={css(V.time3Style)}>Il y a ~3h</div>
            </div>
            <div style={css('padding:18px 0 6px;font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700)')}>Contexte du jour · cycle</div>
            <div style={css('display:flex;align-items:center;gap:10px;background:var(--info-50);border-radius:var(--radius-sm);padding:11px 13px')}>
              <i className="ph-fill ph-drop" style={{ fontSize: 16, color: 'var(--info-500)', flexShrink: 0 }}></i>
              <div style={css('flex:1;font:var(--fw-regular) 11.5px/1.4 var(--font-body);color:var(--info-700)')}>Pré-rempli depuis ton suivi : <strong>{V.geneCycleLabel}</strong></div>
              <div onClick={V.toggleCycleEdit} style={css('font:var(--fw-bold) 11px var(--font-body);color:var(--info-700);cursor:pointer;text-decoration:underline;white-space:nowrap')}>{V.cycleEditLabel}</div>
            </div>
            {V.cycleEditOpen && (
              <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:8px')}>
                {V.cyclePhases.map((c, i) => (<div key={i} onClick={c.onSelect} style={css(c.style)}>{c.l}</div>))}
              </div>
            )}
            <div style={css('margin-top:14px;display:flex;gap:9px;align-items:flex-start;background:var(--tol-avoid-50);border-radius:var(--radius-sm);padding:11px 13px')}><i className="ph ph-link-simple" style={{ fontSize: 15, color: 'var(--tol-avoid-500)', flexShrink: 0, marginTop: 1 }}></i><div style={css('font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--tol-avoid-700)')}><strong>Attribution automatique :</strong> {V.attributionText}</div></div>
            <div style={css('margin-top:8px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:11px 13px;font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--taupe-600)')}><i className="ph ph-info" style={{ fontSize: 15, color: 'var(--info-500)', flexShrink: 0, marginTop: 1 }}></i><div>Le délai sert à remonter au bon repas — chaque composé a sa fenêtre perso (gluten ~{V.wGluten}h, lactose ~{V.wLactose}h, fructanes ~{V.wFructanes}h).</div></div>
          </div>
          <div style={css('padding:12px 20px 20px;flex-shrink:0')}>
            <div onClick={V.saveGene} style={css('background:var(--tol-avoid-500);color:#fff;text-align:center;border-radius:var(--radius-md);padding:15px 0;font:var(--fw-bold) 14px var(--font-display);cursor:pointer')}>Enregistrer la gêne</div>
          </div>
        </div>
        )}

        {/* ===================== MAINTENANT ===================== */}
        {V.isNow && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column;overflow-y:auto;padding-bottom:84px')} className="ob-scroll">
          <div style={css('padding:16px 20px 6px')}>
            <div style={css('font:var(--fw-bold) 11px var(--font-body);color:var(--taupe-600);letter-spacing:var(--ls-caps);text-transform:uppercase')}>Jeudi · 14:30</div>
            <div style={css('font:var(--fw-bold) 22px/1.1 var(--font-display);color:var(--ink);margin-top:6px')}>En ce moment</div>
            <div style={css('font:var(--fw-regular) 12px/1.4 var(--font-body);color:var(--taupe-600);margin-top:5px')}>Sur tes repas d'aujourd'hui, <strong style={{ color: 'var(--cocoa-800)' }}>{V.activeCountLabel}</strong> — fenêtres personnelles appliquées.</div>
          </div>
          <div style={css('padding:14px 18px 0;display:flex;flex-direction:column;gap:10px')}>
            {V.feedbackOpen && (
              <div style={css('background:var(--coral-50);border-radius:var(--radius-lg);padding:14px 16px')}>
                <div style={css('display:flex;align-items:center;gap:7px;font:var(--fw-bold) 12.5px var(--font-display);color:var(--coral-700);margin-bottom:3px')}><i className="ph-fill ph-sparkle" style={{ fontSize: 14 }}></i>Affine tes délais</div>
                <div style={css('font:var(--fw-regular) 11.5px/1.45 var(--font-body);color:var(--coral-700)')}>Mardi 16h tu avais une gêne. Le <strong>gluten</strong> du midi était-il en cause ?</div>
                <div style={css('display:flex;gap:8px;margin-top:10px')}>
                  <div onClick={V.feedbackYes} style={css('flex:1;text-align:center;background:var(--coral-500);color:#fff;border-radius:var(--radius-sm);padding:9px 0;font:var(--fw-bold) 12px var(--font-body);cursor:pointer')}>Oui, sûrement</div>
                  <div onClick={V.feedbackNo} style={css('flex:1;text-align:center;background:#fff;border:1px solid var(--coral-200);color:var(--coral-600);border-radius:var(--radius-sm);padding:9px 0;font:var(--fw-bold) 12px var(--font-body);cursor:pointer')}>Plutôt non</div>
                </div>
              </div>
            )}
            {V.feedbackDone && (
              <div style={css('background:var(--tol-good-50);border-radius:var(--radius-lg);padding:14px 16px;display:flex;align-items:center;gap:10px')}>
                <div style={css('width:24px;height:24px;border-radius:50%;background:var(--tol-good-500);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0')}><i className="ph-bold ph-check" style={{ fontSize: 13 }}></i></div>
                <div style={css('font:var(--fw-regular) 11.5px/1.4 var(--font-body);color:var(--tol-good-700)')}>{V.feedbackMsg}</div>
              </div>
            )}
            {V.nowRows.map((w, i) => (
              <div key={i} style={css('background:#fff;border-radius:var(--radius-lg);padding:14px 16px;box-shadow:var(--shadow-sm)')}>
                <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:4px')}><div style={css('font:var(--fw-bold) 13.5px var(--font-body);color:var(--ink)')}>{w.name} <span style={{ fontWeight: 400, color: 'var(--taupe-600)' }}>· fenêtre perso {w.windowLabel}</span></div><div style={css(w.statusStyle)}>{w.status}</div></div>
                <div style={css('font:var(--fw-regular) 11px var(--font-mono);color:var(--taupe-600);margin-bottom:9px')}>{w.mealLabel}</div>
                <div style={css('position:relative;height:8px;border-radius:4px;background:var(--cream-200);overflow:hidden')}><div style={css(w.barStyle)}></div></div>
              </div>
            ))}
            <div style={css('background:var(--tol-watch-50);border-radius:var(--radius-lg);padding:14px 16px')}>
              <div style={css('display:flex;align-items:center;gap:7px;font:var(--fw-bold) 12.5px var(--font-display);color:var(--tol-watch-700);margin-bottom:3px')}><i className="ph-fill ph-lightbulb" style={{ fontSize: 14 }}></i>Si une gêne apparaît maintenant…</div>
              <div style={css('font:var(--fw-regular) 11.5px/1.45 var(--font-body);color:var(--tol-watch-700)')}>{V.hintText}</div>
            </div>
            <div onClick={V.goDouleur} style={css('margin-top:2px;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--tol-avoid-500);color:#fff;text-align:center;border-radius:var(--radius-md);padding:14px 0;font:var(--fw-bold) 13.5px var(--font-display);cursor:pointer')}><i className="ph ph-first-aid-kit" style={{ fontSize: 16 }}></i>J'ai une gêne maintenant</div>
          </div>
        </div>
        )}

        {/* ===================== ANALYSE ===================== */}
        {V.isAnalyse && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column;overflow-y:auto;padding-bottom:84px')} className="ob-scroll">
          <div style={css('padding:16px 20px 8px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px')}>
            <div><div style={css('font:var(--fw-bold) 22px/1.1 var(--font-display);color:var(--ink)')}>Analyse</div><div style={css('font:var(--fw-regular) 12px var(--font-body);color:var(--taupe-600);margin-top:3px')}>{V.statsRepas} repas · {V.statsGenes} gênes · fenêtres testées 2h / 6h / 24h</div></div>
            <div onClick={V.toggleDemoDay1} style={css('font:var(--fw-semibold) 10px var(--font-body);color:var(--taupe-600);border:1px solid var(--border-soft);border-radius:var(--radius-pill);padding:4px 10px;cursor:pointer;white-space:nowrap;margin-top:3px')}>{V.demoToggleLabel}</div>
          </div>
          {V.analyseEmpty && (
          <div style={css('padding:6px 16px 0')}>
            <div style={css('border-radius:var(--radius-2xl);padding:24px 20px;background:linear-gradient(155deg,var(--cream-100),var(--coral-50));text-align:center')}>
              <div style={css('width:56px;height:56px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:var(--shadow-sm)')}><i className="ph ph-magnifying-glass" style={{ fontSize: 26, color: 'var(--coral-400)' }}></i></div>
              <div style={css('font:var(--fw-bold) 18px/1.2 var(--font-display);color:var(--ink);margin-top:14px')}>L'enquête démarre</div>
              <div style={css('font:var(--fw-regular) 12px/1.5 var(--font-body);color:var(--taupe-600);margin-top:7px')}>Il faut un peu de matière avant les premières pistes. Continue à loguer — chaque repas compte.</div>
              <div style={css('margin-top:16px;text-align:left')}>
                <div style={css('display:flex;justify-content:space-between;font:var(--fw-bold) 10.5px var(--font-body);color:var(--cocoa-700);margin-bottom:5px')}><span>3 repas logués</span><span>10 pour la 1ʳᵉ analyse</span></div>
                <div style={css('height:8px;border-radius:4px;background:rgba(255,255,255,.7);overflow:hidden')}><div style={css('width:30%;height:100%;border-radius:4px;background:var(--coral-500)')}></div></div>
              </div>
              <div style={css('font:500 10.5px var(--font-mono);color:var(--coral-600);margin-top:10px')}>première analyse estimée : vendredi</div>
            </div>
            <div style={css('display:flex;flex-direction:column;gap:7px;margin-top:12px')}>
              {[['Familles de composés', 'Se débloque à 10 repas'], ['Suspects personnels', 'Se débloque à 10 repas + 2 gênes'], ['Tests d\'éviction', 'Après ton premier suspect identifié']].map((r, i) => (
                <div key={i} style={css('background:#fff;border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--shadow-xs);display:flex;align-items:center;gap:11px;opacity:.55')}>
                  <i className="ph ph-lock-simple" style={{ fontSize: 17, color: 'var(--sand-500)', flexShrink: 0 }}></i>
                  <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>{r[0]}</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600)')}>{r[1]}</div></div>
                </div>
              ))}
            </div>
            <div style={css('margin-top:12px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:11px 13px;font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--taupe-600)')}><i className="ph-fill ph-lightbulb" style={{ fontSize: 15, color: 'var(--tol-watch-500)', flexShrink: 0, marginTop: 1 }}></i><div>Astuce : logue aussi les journées <strong>sans</strong> gêne (bilan du soir) — les jours calmes sont aussi précieux que les jours difficiles.</div></div>
          </div>
          )}
          {V.analyseReady && (
          <div style={css('padding:6px 16px 0')}>
            <div style={css('border-radius:var(--radius-2xl);padding:18px;background:linear-gradient(155deg,var(--coral-100),var(--tol-avoid-50))')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between')}><div style={css('display:flex;align-items:center;gap:6px;font:var(--fw-bold) 11px var(--font-body);color:var(--tol-avoid-700);letter-spacing:var(--ls-wide);text-transform:uppercase')}><i className="ph-fill ph-magnifying-glass" style={{ fontSize: 13 }}></i>Principal suspect</div><div style={css('background:rgba(255,255,255,.6);border-radius:var(--radius-pill);padding:3px 9px;font:var(--fw-bold) 10px var(--font-body);color:var(--tol-avoid-700)')}>meilleure fenêtre · {V.wGluten}h</div></div>
              <div style={css('font:var(--fw-extra) 23px/1.05 var(--font-display);color:var(--tol-avoid-700);margin:8px 0 10px')}>Le gluten ressort nettement</div>
              {V.obGlutenSuspected && (
                <div style={css('display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.6);border-radius:var(--radius-pill);padding:4px 11px;font:var(--fw-bold) 10.5px var(--font-body);color:var(--cocoa-700);margin-bottom:8px')}><i className="ph-fill ph-target" style={{ fontSize: 12, color: 'var(--coral-500)' }}></i>Ton intuition de départ — les données la confirment</div>
              )}
              <div style={css('display:flex;gap:14px;margin-top:6px')}>
                <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 10px var(--font-body);color:var(--tol-avoid-700);margin-bottom:4px')}>Jours AVEC gêne</div><div style={css('height:8px;border-radius:4px;background:rgba(255,255,255,.55);overflow:hidden')}><div style={css(V.avecBarStyle)}></div></div><div style={css('font:500 15px var(--font-mono);color:var(--tol-avoid-700);margin-top:3px')}>{V.glutenAvec}%</div></div>
                <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 10px var(--font-body);color:var(--tol-good-700);margin-bottom:4px')}>Jours SANS gêne <span style={{ fontWeight: 600, opacity: 0.75 }}>(confirmés)</span></div><div style={css('height:8px;border-radius:4px;background:rgba(255,255,255,.55);overflow:hidden')}><div style={css('width:15%;height:100%;background:var(--tol-good-500)')}></div></div><div style={css('font:500 15px var(--font-mono);color:var(--tol-good-700);margin-top:3px')}>15%</div></div>
              </div>
              <div style={css('margin-top:12px;display:inline-block;background:rgba(255,255,255,.6);border-radius:var(--radius-pill);padding:4px 11px;font:var(--fw-bold) 10.5px var(--font-body);color:var(--cocoa-700)')}>Confiance modérée · {V.statsRepas} repas · {V.okDays} j « tout roule »</div>
            </div>

            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:18px 4px 8px')}>Familles de composés · niveau moléculaire</div>
            <div style={css('display:flex;flex-direction:column;gap:7px')}>
              {V.families.map((f, i) => (
                <div key={i} style={css('background:#fff;border-radius:var(--radius-sm);padding:11px 13px;box-shadow:var(--shadow-xs);display:flex;align-items:center;gap:11px')}>
                  <div style={css('flex:1;min-width:0')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>{f.name} <span style={{ fontWeight: 400, color: 'var(--taupe-600)', fontSize: '10.5px' }}>{f.group}</span></div><div style={css('margin-top:6px;height:5px;border-radius:3px;background:var(--cream-200);overflow:hidden')}><div style={css(f.barStyle)}></div></div></div>
                  <div style={css(f.chipStyle)}>{f.level}</div>
                </div>
              ))}
            </div>

            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:18px 4px 8px')}>Ingrédients suivis</div>
            <div style={css('display:flex;flex-direction:column;gap:7px')}>
              {V.suspects.map((x, i) => (
                <div key={i} style={css(x.rowStyle)}>
                  <div style={css('display:flex;align-items:center;justify-content:space-between')}><div style={css('font:var(--fw-bold) 13px var(--font-body);color:var(--ink)')}>{x.name}</div><div style={css(x.chipStyle)}>{x.tag}</div></div>
                  <div style={css('display:flex;gap:6px;align-items:center;margin-top:8px')}><div style={css('flex:1;height:6px;border-radius:3px;background:var(--cream-200);overflow:hidden')}><div style={css(x.barStyle)}></div></div><div style={css('font:400 10px var(--font-mono);color:var(--taupe-600);width:78px')}>{x.ratio}</div></div>
                  <div style={css('font:var(--fw-regular) 10px var(--font-body);color:var(--taupe-600);margin-top:6px')}>{x.note}</div>
                </div>
              ))}
            </div>

            <div style={css('margin-top:16px;background:var(--tol-watch-50);border-radius:var(--radius-lg);padding:15px 16px')}>
              <div style={css('display:flex;align-items:center;gap:7px;font:var(--fw-bold) 13px var(--font-display);color:var(--tol-watch-700)')}><i className="ph-fill ph-warning" style={{ fontSize: 15 }}></i>La corrélation n'est pas une preuve</div>
              <div style={css('font:var(--fw-regular) 11.5px/1.45 var(--font-body);color:var(--tol-watch-700);margin-top:5px')}>Le blé apporte gluten <em>et</em> fructanes — pour trancher, isole un suspect quelques jours.</div>
              {V.elimIdle && (
                <div onClick={V.startElim} style={css('margin-top:11px;display:flex;align-items:center;justify-content:center;gap:7px;background:var(--coral-500);color:#fff;text-align:center;border-radius:var(--radius-sm);padding:11px 0;font:var(--fw-bold) 12.5px var(--font-body);cursor:pointer;box-shadow:var(--shadow-brand-soft)')}><i className="ph ph-flask" style={{ fontSize: 15 }}></i>Lancer un test d'éviction · gluten 7 j</div>
              )}
              {V.elimActive && (
                <div style={css('margin-top:11px;background:rgba(255,255,255,.7);border-radius:var(--radius-sm);padding:11px 13px')}>
                  <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:7px')}><div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--coral-700)')}>Test en cours · sans gluten</div><div style={css('font:var(--fw-bold) 11px var(--font-body);color:var(--coral-600)')}>Jour 2 / 7</div></div>
                  <div style={css('height:7px;border-radius:4px;background:var(--cream-200);overflow:hidden')}><div style={css('width:28%;height:100%;background:var(--coral-500)')}></div></div>
                  <div style={css('font:var(--fw-regular) 10.5px/1.4 var(--font-body);color:var(--cocoa-700);margin-top:7px')}>Continue à loguer normalement — le Journal te préviendra si un repas contient du gluten.</div>
                  <div onClick={V.finishElim} style={css('margin-top:9px;display:inline-flex;align-items:center;gap:5px;font:var(--fw-bold) 11px var(--font-body);color:var(--coral-600);cursor:pointer;text-decoration:underline')}>Simuler la fin du test (démo)<i className="ph ph-arrow-right" style={{ fontSize: 11 }}></i></div>
                </div>
              )}
              {V.elimDone && (
                <div onClick={V.goVerdict} style={css('margin-top:11px;display:flex;align-items:center;justify-content:center;gap:7px;background:var(--tol-good-500);color:#fff;text-align:center;border-radius:var(--radius-sm);padding:11px 0;font:var(--fw-bold) 12.5px var(--font-body);cursor:pointer')}><i className="ph-fill ph-seal-check" style={{ fontSize: 15 }}></i>Test terminé — voir le verdict</div>
              )}
              {V.elimReintro && (
                <div style={css('margin-top:11px;background:rgba(255,255,255,.7);border-radius:var(--radius-sm);padding:11px 13px')}>
                  <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:7px')}><div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--info-700)')}>Réintroduction guidée · gluten</div><div style={css('font:var(--fw-bold) 11px var(--font-body);color:var(--info-500)')}>{V.reintroStepLabel}</div></div>
                  <div style={css('height:7px;border-radius:4px;background:var(--cream-200);overflow:hidden;margin-bottom:8px')}><div style={css(V.reintroBarStyle)}></div></div>
                  <div style={css('font:var(--fw-regular) 10.5px/1.4 var(--font-body);color:var(--cocoa-700)')}>Aujourd'hui : <strong>{V.reintroPortion}</strong>, puis observe 48h. L'app surveille la fenêtre ~4h automatiquement.</div>
                  <div onClick={V.reintroNext} style={css('margin-top:9px;display:inline-flex;align-items:center;gap:5px;font:var(--fw-bold) 11px var(--font-body);color:var(--info-700);cursor:pointer;text-decoration:underline')}>{V.reintroNextLabel}<i className="ph ph-arrow-right" style={{ fontSize: 11 }}></i></div>
                </div>
              )}
              {V.elimConfirmed && (
                <div style={css('margin-top:11px;background:rgba(255,255,255,.7);border-radius:var(--radius-sm);padding:12px 13px')}>
                  <div style={css('display:flex;align-items:center;gap:8px')}><div style={css('width:26px;height:26px;border-radius:50%;background:var(--tol-avoid-500);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0')}><i className="ph-fill ph-seal-check" style={{ fontSize: 14 }}></i></div><div style={css('font:var(--fw-bold) 12.5px var(--font-display);color:var(--tol-avoid-700)')}>Gluten : sensibilité confirmée</div></div>
                  <div style={css('font:var(--fw-regular) 10.5px/1.45 var(--font-body);color:var(--cocoa-700);margin-top:6px')}>Gênes revenues dès l'étape 2 de réintroduction (portion normale, +4h). Éviction 7 j : −80% de gênes. <strong>Parles-en à un professionnel</strong> — ton rapport PDF est prêt dans le Profil.</div>
                  <div style={css('display:flex;gap:6px;margin-top:8px')}><span style={css('background:var(--tol-avoid-50);color:var(--tol-avoid-700);border-radius:var(--radius-pill);padding:4px 10px;font:var(--fw-bold) 10px var(--font-body)')}>à éviter · confiance haute</span><span style={css('background:var(--cream-200);color:var(--cocoa-700);border-radius:var(--radius-pill);padding:4px 10px;font:500 10px var(--font-mono)')}>fenêtre ~4h</span></div>
                </div>
              )}
            </div>

            <div style={css('margin-top:14px;display:flex;flex-wrap:wrap;gap:6px;align-items:center')}><span style={css('font:var(--fw-bold) 10.5px var(--font-body);color:var(--taupe-600)')}>Délais perso appris :</span><span style={css('background:#fff;border:1px solid var(--border-soft);border-radius:var(--radius-pill);padding:3px 9px;font:500 10.5px var(--font-mono);color:var(--cocoa-700)')}>gluten ~{V.wGluten}h</span><span style={css('background:#fff;border:1px solid var(--border-soft);border-radius:var(--radius-pill);padding:3px 9px;font:500 10.5px var(--font-mono);color:var(--cocoa-700)')}>lactose ~{V.wLactose}h</span><span style={css('background:#fff;border:1px solid var(--border-soft);border-radius:var(--radius-pill);padding:3px 9px;font:500 10.5px var(--font-mono);color:var(--cocoa-700)')}>fructanes ~{V.wFructanes}h</span></div>
            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:18px 4px 8px')}>Facteurs non-alimentaires</div>
            <div style={css('display:flex;flex-direction:column;gap:7px')}>
              <div onClick={V.goCycle} style={css('background:#fff;border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--shadow-xs);display:flex;align-items:center;gap:11px;cursor:pointer')}>
                <div style={css('width:30px;height:30px;border-radius:var(--radius-xs);background:var(--info-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--info-500)')}><i className="ph-fill ph-drop" style={{ fontSize: 16 }}></i></div>
                <div style={css('flex:1;min-width:0')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Cycle menstruel</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600);margin-top:1px')}>{V.cycleLinkStat}</div></div>
                <div style={css('background:var(--info-50);color:var(--info-700);border-radius:var(--radius-pill);padding:3px 9px;font:var(--fw-bold) 10px var(--font-body);flex-shrink:0')}>lien fort</div>
              </div>
              <div onClick={V.goJournal} style={css('background:#fff;border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--shadow-xs);display:flex;align-items:center;gap:11px;cursor:pointer')}>
                <div style={css('width:30px;height:30px;border-radius:var(--radius-xs);background:var(--info-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--info-500)')}><i className="ph-fill ph-drop-half" style={{ fontSize: 16 }}></i></div>
                <div style={css('flex:1;min-width:0')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Hydratation</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600);margin-top:1px')}>{V.waterLinkStat}</div></div>
                <div style={css(V.waterLinkBadgeStyle)}>{V.waterLinkBadge}</div>
              </div>
              <div style={css('background:#fff;border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--shadow-xs);display:flex;align-items:center;gap:11px;opacity:.65')}>
                <div style={css('width:30px;height:30px;border-radius:var(--radius-xs);background:var(--cream-200);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--taupe-600)')}><i className="ph ph-moon" style={{ fontSize: 16 }}></i></div>
                <div style={css('flex:1;min-width:0')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Stress · sommeil</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600);margin-top:1px')}>Connecte ta montre / ajoute manuellement</div></div>
                <div style={css('background:var(--cream-200);color:var(--taupe-600);border-radius:var(--radius-pill);padding:3px 9px;font:var(--fw-bold) 10px var(--font-body);flex-shrink:0')}>bientôt</div>
              </div>
            </div>
            <div style={css('margin-top:14px;display:flex;align-items:center;gap:11px;background:#fff;border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--shadow-xs)')}>
              <div style={css('width:30px;height:30px;border-radius:var(--radius-xs);background:var(--tol-good-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--tol-good-500)')}><i className="ph-fill ph-bell-ringing" style={{ fontSize: 16 }}></i></div>
              <div style={css('flex:1;min-width:0')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Bilan du soir · push à 21h</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600);margin-top:1px')}>Un tap pour confirmer les journées sans gêne — {V.okDays} j confirmés</div></div>
              <div onClick={V.togglePush} style={css('cursor:pointer')}><div style={css(V.pushTrackStyle)}><div style={css(V.pushKnobStyle)}></div></div></div>
            </div>
            <div style={css('padding:14px 4px 8px;font:var(--fw-regular) 10.5px/1.4 var(--font-body);color:var(--sand-500);text-align:center')}>Plus tu logues, plus l'analyse est fiable — aliments et facteurs de vie combinés.</div>
          </div>
          )}
        </div>
        )}

        {/* ===================== PROFIL ===================== */}
        {V.isProfil && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
            <div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Profil &amp; réglages</div>
            <div style={css('width:46px')}></div>
          </div>
          <div style={css('flex:1;overflow-y:auto;padding:16px 18px 24px')} className="ob-scroll">
            <div style={css('display:flex;align-items:center;gap:13px')}>
              <div style={css('width:56px;height:56px;border-radius:50%;background:var(--coral-100);color:var(--coral-700);display:flex;align-items:center;justify-content:center;font:var(--fw-extra) 20px var(--font-display);flex-shrink:0')}>M</div>
              <div><div style={css('font:var(--fw-bold) 17px var(--font-display);color:var(--ink)')}>Manon</div><div style={css('font:500 11px var(--font-mono);color:var(--taupe-600);margin-top:2px')}>9 jours de suivi · 25 repas · 5 cycles</div></div>
            </div>

            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:20px 2px 8px')}>Notifications</div>
            <div style={css('background:#fff;border-radius:var(--radius-lg);box-shadow:var(--shadow-xs);overflow:hidden')}>
              <div style={css('display:flex;align-items:center;gap:11px;padding:13px 14px;border-bottom:1px solid var(--border-soft)')}>
                <i className="ph-fill ph-bell-ringing" style={{ fontSize: 17, color: 'var(--tol-good-500)', flexShrink: 0 }}></i>
                <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Bilan du soir</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600)')}>Push à 21h · confirmer les journées sans gêne</div></div>
                <div onClick={V.togglePushP} style={css('cursor:pointer')}><div style={css(V.pushPTrack)}><div style={css(V.pushPKnob)}></div></div></div>
              </div>
              {V.notifPermGranted && (
                <div style={css('display:flex;align-items:center;gap:8px;padding:9px 14px;background:var(--tol-good-50)')}><i className="ph-fill ph-check-circle" style={{ fontSize: 14, color: 'var(--tol-good-500)', flexShrink: 0 }}></i><div style={css('font:var(--fw-semibold) 10.5px var(--font-body);color:var(--tol-good-700)')}>{V.notifPermStatus}</div></div>
              )}
              {V.notifPermDenied && (
                <div style={css('display:flex;align-items:center;gap:8px;padding:9px 14px;background:var(--tol-avoid-50)')}><i className="ph-fill ph-warning" style={{ fontSize: 14, color: 'var(--tol-avoid-500)', flexShrink: 0 }}></i><div style={css('font:var(--fw-semibold) 10.5px var(--font-body);color:var(--tol-avoid-700)')}>{V.notifPermStatus}</div></div>
              )}
              {V.notifPermPending && (
                <div onClick={V.requestNotifPermission} style={css('display:flex;align-items:center;justify-content:center;gap:7px;padding:11px 14px;border-top:1px solid var(--border-soft);cursor:pointer;font:var(--fw-bold) 11.5px var(--font-body);color:var(--coral-600)')}><i className="ph ph-bell-simple-ringing" style={{ fontSize: 14 }}></i>Activer les notifications du navigateur</div>
              )}
              <div style={css('display:flex;align-items:center;gap:11px;padding:13px 14px')}>
                <i className="ph-fill ph-timer" style={{ fontSize: 17, color: 'var(--tol-watch-500)', flexShrink: 0 }}></i>
                <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Alertes fenêtres à risque</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600)')}>« Me prévenir à +4h » après un repas suspect</div></div>
                <div onClick={V.toggleAlerts} style={css('cursor:pointer')}><div style={css(V.alertsTrack)}><div style={css(V.alertsKnob)}></div></div></div>
              </div>
            </div>

            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:18px 2px 8px')}>Suivi</div>
            <div style={css('background:#fff;border-radius:var(--radius-lg);box-shadow:var(--shadow-xs);overflow:hidden')}>
              <div style={css('display:flex;align-items:center;gap:11px;padding:13px 14px;border-bottom:1px solid var(--border-soft)')}>
                <i className="ph-fill ph-drop" style={{ fontSize: 17, color: 'var(--info-500)', flexShrink: 0 }}></i>
                <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Suivi du cycle</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600)')}>Croisé avec tes gênes digestives</div></div>
                <div onClick={V.toggleCycleTrack} style={css('cursor:pointer')}><div style={css(V.cycleTrackTrack)}><div style={css(V.cycleTrackKnob)}></div></div></div>
              </div>
              <div style={css('display:flex;align-items:center;gap:11px;padding:13px 14px;opacity:.55')}>
                <i className="ph ph-watch" style={{ fontSize: 17, color: 'var(--taupe-600)', flexShrink: 0 }}></i>
                <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Montre connectée</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600)')}>Stress &amp; sommeil — bientôt</div></div>
                <div style={css('background:var(--cream-200);color:var(--taupe-600);border-radius:var(--radius-pill);padding:3px 9px;font:var(--fw-bold) 10px var(--font-body)')}>bientôt</div>
              </div>
            </div>

            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:18px 2px 8px')}>Connaissances</div>
            <div onClick={V.goFoodDb} style={css('display:flex;align-items:center;gap:11px;background:#fff;border-radius:var(--radius-lg);padding:13px 14px;box-shadow:var(--shadow-xs);cursor:pointer')}>
              <i className="ph-fill ph-books" style={{ fontSize: 18, color: 'var(--coral-500)', flexShrink: 0 }}></i>
              <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Base alimentaire</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600)')}>{V.fdbCount} aliments · FODMAP, gluten, histamine, caféine</div></div>
              <i className="ph ph-caret-right" style={{ fontSize: 14, color: 'var(--sand-500)' }}></i>
            </div>

            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:18px 2px 8px')}>Pour ton médecin</div>
            {V.exportIdle && (
              <div onClick={V.doExport} style={css('display:flex;align-items:center;gap:11px;background:var(--coral-500);color:#fff;border-radius:var(--radius-lg);padding:15px 16px;cursor:pointer;box-shadow:var(--shadow-brand)')}>
                <i className="ph-fill ph-file-pdf" style={{ fontSize: 20, flexShrink: 0 }}></i>
                <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 13px var(--font-display)')}>Exporter mon rapport PDF</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);opacity:.85;margin-top:1px')}>Repas, gênes, corrélations et cycle — 9 jours</div></div>
                <i className="ph ph-download-simple" style={{ fontSize: 17 }}></i>
              </div>
            )}
            {V.exportDone && (
              <div style={css('display:flex;align-items:center;gap:11px;background:var(--tol-good-50);border-radius:var(--radius-lg);padding:15px 16px')}>
                <div style={css('width:24px;height:24px;border-radius:50%;background:var(--tol-good-500);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0')}><i className="ph-bold ph-check" style={{ fontSize: 13 }}></i></div>
                <div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--tol-good-700)')}>Rapport généré — obelix-manon-juil.pdf</div>
              </div>
            )}

            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:18px 2px 8px')}>Mes données</div>
            <div style={css('background:#fff;border-radius:var(--radius-lg);box-shadow:var(--shadow-xs);overflow:hidden')}>
              <div onClick={V.exportAll} style={css('display:flex;align-items:center;gap:11px;padding:13px 14px;border-bottom:1px solid var(--border-soft);cursor:pointer')}>
                <i className="ph ph-export" style={{ fontSize: 17, color: 'var(--cocoa-700)', flexShrink: 0 }}></i><div style={css('flex:1;font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Exporter toutes mes données</div><i className="ph ph-caret-right" style={{ fontSize: 14, color: 'var(--sand-500)' }}></i>
              </div>
              <div onClick={V.toggleWipe} style={css('display:flex;align-items:center;gap:11px;padding:13px 14px;cursor:pointer')}>
                <i className="ph ph-trash" style={{ fontSize: 17, color: 'var(--tol-avoid-500)', flexShrink: 0 }}></i><div style={css('flex:1;font:var(--fw-bold) 12.5px var(--font-body);color:var(--tol-avoid-700)')}>Tout supprimer</div><i className="ph ph-caret-right" style={{ fontSize: 14, color: 'var(--sand-500)' }}></i>
              </div>
            </div>
            {V.confirmWipe && (
              <div style={css('margin-top:8px;background:var(--tol-avoid-50);border-radius:var(--radius-md);padding:13px 14px')}>
                <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--tol-avoid-700)')}>Supprimer définitivement tes 9 jours de données ?</div>
                <div style={css('font:var(--fw-regular) 11px/1.4 var(--font-body);color:var(--tol-avoid-700);margin-top:3px;opacity:.9')}>Repas, gênes, cycle et analyses. Cette action est irréversible.</div>
                <div style={css('display:flex;gap:8px;margin-top:10px')}>
                  <div onClick={V.toggleWipe} style={css('flex:1;text-align:center;background:#fff;border:1px solid var(--border-strong);color:var(--cocoa-700);border-radius:var(--radius-sm);padding:10px 0;font:var(--fw-bold) 12px var(--font-body);cursor:pointer')}>Annuler</div>
                  <div onClick={V.doWipe} style={css('flex:1;text-align:center;background:var(--tol-avoid-500);color:#fff;border-radius:var(--radius-sm);padding:10px 0;font:var(--fw-bold) 12px var(--font-body);cursor:pointer')}>Tout supprimer</div>
                </div>
              </div>
            )}
            <div style={css('margin-top:14px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:12px 13px;font:var(--fw-regular) 11px/1.5 var(--font-body);color:var(--taupe-600)')}><i className="ph-fill ph-lock-key" style={{ fontSize: 15, color: 'var(--tol-good-500)', flexShrink: 0, marginTop: 1 }}></i><div>Données chiffrées sur ton téléphone, jamais vendues. Obélix observe, <strong>ne diagnostique pas</strong> — parles-en à un professionnel de santé.</div></div>
          </div>
        </div>
        )}

        {/* ===================== NOTIFICATIONS ===================== */}
        {V.isNotifs && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
            <div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Notifications</div>
            <div style={css('width:46px')}></div>
          </div>
          <div style={css('flex:1;overflow-y:auto;padding:14px 16px 24px')} className="ob-scroll">
            <div style={css('font:var(--fw-regular) 11.5px/1.45 var(--font-body);color:var(--taupe-600);margin-bottom:12px')}>Rappels et alertes calculés sur ton téléphone — rien n'est envoyé en ligne.</div>
            <div style={css('display:flex;flex-direction:column;gap:9px')}>
              {V.notifsList.map((n, i) => (
                <div key={i} onClick={n.onTap} style={css(n.rowStyle)}>
                  <div style={css(n.iconWrap)}><i className={n.iconCls}></i></div>
                  <div style={css('flex:1;min-width:0')}>
                    <div style={css('display:flex;align-items:baseline;justify-content:space-between;gap:8px')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{n.title}</div><div style={css('font:500 10px var(--font-mono);color:var(--sand-500);flex-shrink:0')}>{n.time}</div></div>
                    <div style={css('font:var(--fw-regular) 11px/1.4 var(--font-body);color:var(--taupe-600);margin-top:3px')}>{n.text}</div>
                  </div>
                  <span style={css(n.dotStyle)}></span>
                </div>
              ))}
            </div>
            <div onClick={V.testNotif} style={css('margin-top:16px;display:flex;align-items:center;justify-content:center;gap:8px;background:#fff;border:1px solid var(--border-strong);color:var(--cocoa-700);border-radius:var(--radius-md);padding:13px 0;font:var(--fw-bold) 12.5px var(--font-body);cursor:pointer')}><i className="ph ph-bell-ringing" style={{ fontSize: 16, color: 'var(--coral-500)' }}></i>Tester une notification push</div>
            <div style={css('margin-top:10px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:11px 13px;font:var(--fw-regular) 10.5px/1.45 var(--font-body);color:var(--taupe-600)')}><i className="ph ph-gear" style={{ fontSize: 15, color: 'var(--sand-500)', flexShrink: 0, marginTop: 1 }}></i><div>Gère le bilan du soir et les alertes de fenêtre dans <strong>Profil → Notifications</strong>.</div></div>
          </div>
        </div>
        )}

        {/* ===================== BASE ALIMENTAIRE ===================== */}
        {V.isFoodDb && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div onClick={V.goProfil} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
            <div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Base alimentaire</div>
            <div style={css('width:46px')}></div>
          </div>
          <div style={css('flex:1;overflow-y:auto;padding:14px 16px 24px')} className="ob-scroll">
            <div style={css('display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,var(--coral-100),var(--cream-100));border-radius:var(--radius-lg);padding:14px 15px')}>
              <div style={css('width:44px;height:44px;border-radius:var(--radius-sm);background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--coral-600)')}><i className="ph-fill ph-books" style={{ fontSize: 22 }}></i></div>
              <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 15px var(--font-display);color:var(--ink)')}>{V.fdbCount} aliments référencés</div><div style={css('font:var(--fw-regular) 11px var(--font-body);color:var(--cocoa-700);margin-top:2px')}>{V.fdbCatCount} catégories · croise chaque repas avec ses composés</div></div>
            </div>
            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:18px 2px 8px')}>Composés suivis</div>
            <div style={css('display:flex;flex-direction:column;gap:7px')}>
              {V.fdbFamilies.map((f, i) => (
                <div key={i} style={css('background:#fff;border-radius:var(--radius-sm);padding:11px 13px;box-shadow:var(--shadow-xs)')}>
                  <div style={css('display:flex;align-items:center;gap:8px')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1')}>{f.label}</div><span style={css(f.tagStyle)}>{f.tagLabel}</span><div style={css('font:500 10px var(--font-mono);color:var(--sand-500);flex-shrink:0')}>{f.count}</div></div>
                  <div style={css('font:var(--fw-regular) 10.5px/1.4 var(--font-body);color:var(--taupe-600);margin-top:3px')}>{f.desc} · fenêtre {f.win}</div>
                </div>
              ))}
            </div>
            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:20px 2px 8px')}>Aliments par catégorie</div>
            <div style={css('display:flex;flex-direction:column;gap:14px')}>
              {V.fdbGroups.map((g, i) => (
                <div key={i}>
                  <div style={css('display:flex;align-items:baseline;gap:8px;margin-bottom:7px')}><div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--coral-700)')}>{g.cat}</div><div style={css('font:500 10px var(--font-mono);color:var(--sand-500)')}>{g.count}</div></div>
                  <div style={css('display:flex;flex-direction:column;gap:6px')}>
                    {g.items.map((it, j) => (
                      <div key={j} style={css('display:flex;align-items:center;gap:9px;background:#fff;border-radius:var(--radius-xs);padding:9px 12px;box-shadow:var(--shadow-xs)')}>
                        <div style={css('font:var(--fw-semibold) 12px var(--font-body);color:var(--ink);flex-shrink:0')}>{it.name}</div>
                        <div style={css('flex:1')}></div>
                        {it.hasTags && (
                          <div style={css('display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end')}>{it.tags.map((t, k) => (<span key={k} style={css(t.style)}><span style={css(t.dotStyle)}></span>{t.l}</span>))}</div>
                        )}
                        {it.noTags && (<span style={css('font:600 10px var(--font-body);color:var(--tol-good-700)')}>bien toléré</span>)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={css('margin-top:16px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:12px 13px;font:var(--fw-regular) 10.5px/1.5 var(--font-body);color:var(--taupe-600)')}><i className="ph ph-info" style={{ fontSize: 15, color: 'var(--info-500)', flexShrink: 0, marginTop: 1 }}></i><div>Base initiale ({V.fdbVersion}). La <strong>quantité par portion</strong> et les seuils personnels s'affineront avec tes retours — un aliment « à surveiller » n'est pas interdit.</div></div>
          </div>
        </div>
        )}

        {/* ===================== DÉTAIL REPAS ===================== */}
        {V.isMealDetail && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div onClick={V.goJournal} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
            <div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Détail du repas</div>
            <div style={css('width:46px')}></div>
          </div>
          <div style={css('flex:1;overflow-y:auto;padding:16px 18px 0')} className="ob-scroll">
            <div style={css('display:flex;gap:14px;align-items:center')}>
              <div style={css('width:62px;height:62px;border-radius:var(--radius-md);background:var(--coral-50);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--coral-400)')}><i className={'ph ' + V.dmIcon} style={{ fontSize: 31 }}></i></div>
              <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 18px var(--font-display);color:var(--ink)')}>{V.dmName}</div><div style={css('font:var(--fw-regular) 12.5px var(--font-body);color:var(--taupe-600);margin-top:2px')}>{V.dmDesc}</div><div style={css('font:500 11px var(--font-mono);color:var(--sand-500);margin-top:3px')}>Aujourd'hui · {V.dmTime} · portion normale</div></div>
            </div>
            {V.dmHasComps && (<>
              <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:18px 2px 8px')}>Composés suivis · fenêtres perso</div>
              <div style={css('display:flex;flex-wrap:wrap;gap:7px')}>
                {V.dmWindows.map((w, i) => (<div key={i} style={css(w.chipStyle)}><i className="ph-fill ph-timer" style={{ fontSize: 12 }}></i>{w.name} {w.win}</div>))}
              </div>
            </>)}
            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:18px 2px 8px')}>Actions</div>
            <div style={css('display:flex;flex-direction:column;gap:8px')}>
              <div onClick={V.goValidate} style={css('display:flex;align-items:center;gap:11px;background:#fff;border-radius:var(--radius-sm);padding:13px 14px;box-shadow:var(--shadow-xs);cursor:pointer')}>
                <i className="ph ph-pencil-simple" style={{ fontSize: 18, color: 'var(--coral-500)' }}></i><div style={css('flex:1;font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Modifier les ingrédients</div><i className="ph ph-caret-right" style={{ fontSize: 14, color: 'var(--sand-500)' }}></i>
              </div>
              <div onClick={V.goDouleur} style={css('display:flex;align-items:center;gap:11px;background:#fff;border-radius:var(--radius-sm);padding:13px 14px;box-shadow:var(--shadow-xs);cursor:pointer')}>
                <i className="ph ph-first-aid-kit" style={{ fontSize: 18, color: 'var(--tol-avoid-500)' }}></i><div style={css('flex:1;font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Ce repas m'a gêné·e</div><i className="ph ph-caret-right" style={{ fontSize: 14, color: 'var(--sand-500)' }}></i>
              </div>
              <div onClick={V.deleteMeal} style={css('display:flex;align-items:center;gap:11px;background:#fff;border-radius:var(--radius-sm);padding:13px 14px;box-shadow:var(--shadow-xs);cursor:pointer')}>
                <i className="ph ph-trash" style={{ fontSize: 18, color: 'var(--tol-avoid-500)' }}></i><div style={css('flex:1;font:var(--fw-bold) 12.5px var(--font-body);color:var(--tol-avoid-700)')}>Supprimer ce repas</div>
              </div>
            </div>
            <div style={css('margin-top:12px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:11px 13px;font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--taupe-600)')}><i className="ph ph-info" style={{ fontSize: 15, color: 'var(--info-500)', flexShrink: 0, marginTop: 1 }}></i><div>Corriger un repas met à jour l'analyse — mieux vaut des données justes que beaucoup de données.</div></div>
          </div>
        </div>
        )}

        {/* ===================== VERDICT ÉVICTION ===================== */}
        {V.isVerdict && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column')}>
          <div style={css('height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 6px;flex-shrink:0;border-bottom:1px solid var(--border-soft)')}>
            <div onClick={V.goAnalyse} style={css('width:46px;height:46px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--cocoa-700)')}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
            <div style={css('font:var(--fw-bold) 14px var(--font-body);color:var(--ink);white-space:nowrap')}>Verdict · test d'éviction</div>
            <div style={css('width:46px')}></div>
          </div>
          <div style={css('flex:1;overflow-y:auto;padding:16px 18px 0')} className="ob-scroll">
            <div style={css('border-radius:var(--radius-2xl);padding:20px;background:linear-gradient(155deg,var(--tol-good-50),var(--cream-100));text-align:center')}>
              <div style={css('width:54px;height:54px;border-radius:50%;background:var(--tol-good-500);color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto')}><i className="ph-fill ph-seal-check" style={{ fontSize: 28 }}></i></div>
              <div style={css('font:var(--fw-extra) 22px/1.15 var(--font-display);color:var(--tol-good-700);margin-top:12px')}>7 jours sans gluten : net mieux</div>
              <div style={css('font:var(--fw-regular) 12px/1.5 var(--font-body);color:var(--cocoa-700);margin-top:8px')}>Tes gênes sont passées de <strong>5 sur la semaine d'avant</strong> à <strong>1 pendant le test</strong>. C'est un signal fort — mais pas encore une preuve.</div>
            </div>
            <div style={css('display:flex;gap:9px;margin-top:12px')}>
              <div style={css('flex:1;background:#fff;border-radius:var(--radius-lg);padding:13px 14px;box-shadow:var(--shadow-xs)')}>
                <div style={css('font:700 10px var(--font-body);color:var(--taupe-600);text-transform:uppercase;letter-spacing:var(--ls-wide)')}>Avant · 7 j</div>
                <div style={css('display:flex;align-items:baseline;gap:4px;margin-top:6px')}><div style={css('font:500 26px var(--font-mono);color:var(--tol-avoid-500)')}>5</div><div style={css('font:600 10.5px var(--font-body);color:var(--taupe-600)')}>gênes</div></div>
                <div style={css('display:flex;gap:3px;margin-top:8px')}><span style={css('flex:1;height:22px;border-radius:3px;background:var(--tol-avoid-500)')}></span><span style={css('flex:1;height:14px;border-radius:3px;background:var(--tol-avoid-500);align-self:flex-end')}></span><span style={css('flex:1;height:26px;border-radius:3px;background:var(--tol-avoid-500)')}></span><span style={css('flex:1;height:8px;border-radius:3px;background:var(--cream-200);align-self:flex-end')}></span><span style={css('flex:1;height:18px;border-radius:3px;background:var(--tol-avoid-500);align-self:flex-end')}></span><span style={css('flex:1;height:8px;border-radius:3px;background:var(--cream-200);align-self:flex-end')}></span><span style={css('flex:1;height:22px;border-radius:3px;background:var(--tol-avoid-500)')}></span></div>
              </div>
              <div style={css('flex:1;background:#fff;border-radius:var(--radius-lg);padding:13px 14px;box-shadow:var(--shadow-xs)')}>
                <div style={css('font:700 10px var(--font-body);color:var(--taupe-600);text-transform:uppercase;letter-spacing:var(--ls-wide)')}>Pendant · 7 j</div>
                <div style={css('display:flex;align-items:baseline;gap:4px;margin-top:6px')}><div style={css('font:500 26px var(--font-mono);color:var(--tol-good-700)')}>1</div><div style={css('font:600 10.5px var(--font-body);color:var(--taupe-600)')}>gêne</div></div>
                <div style={css('display:flex;gap:3px;margin-top:8px')}><span style={css('flex:1;height:8px;border-radius:3px;background:var(--cream-200);align-self:flex-end')}></span><span style={css('flex:1;height:8px;border-radius:3px;background:var(--cream-200);align-self:flex-end')}></span><span style={css('flex:1;height:14px;border-radius:3px;background:var(--tol-watch-500);align-self:flex-end')}></span><span style={css('flex:1;height:8px;border-radius:3px;background:var(--cream-200);align-self:flex-end')}></span><span style={css('flex:1;height:8px;border-radius:3px;background:var(--cream-200);align-self:flex-end')}></span><span style={css('flex:1;height:8px;border-radius:3px;background:var(--cream-200);align-self:flex-end')}></span><span style={css('flex:1;height:8px;border-radius:3px;background:var(--cream-200);align-self:flex-end')}></span></div>
              </div>
            </div>
            <div style={css('margin-top:12px;background:var(--tol-watch-50);border-radius:var(--radius-lg);padding:14px 16px')}>
              <div style={css('display:flex;align-items:center;gap:7px;font:var(--fw-bold) 12.5px var(--font-display);color:var(--tol-watch-700)')}><i className="ph-fill ph-flask" style={{ fontSize: 14 }}></i>Prochaine étape : la réintroduction</div>
              <div style={css('font:var(--fw-regular) 11.5px/1.5 var(--font-body);color:var(--tol-watch-700);margin-top:5px')}>Pour confirmer, on réintroduit le gluten <strong>progressivement sur 3 étapes</strong> (petite → normale → grande portion, 48h d'observation entre chaque). Si les gênes reviennent, le lien est quasi certain.</div>
            </div>
            <div style={css('margin-top:10px;display:flex;gap:9px;background:var(--cream-100);border-radius:var(--radius-sm);padding:11px 13px;font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--taupe-600)')}><i className="ph ph-stethoscope" style={{ fontSize: 15, color: 'var(--info-500)', flexShrink: 0, marginTop: 1 }}></i><div>Un mieux net sans gluten mérite d'en parler à un professionnel — pense à l'<strong>export PDF</strong> dans ton Profil pour apporter tes données en consultation.</div></div>
          </div>
          <div style={css('padding:12px 18px 20px;display:flex;gap:8px;flex-shrink:0')}>
            <div onClick={V.goAnalyse} style={css('flex:1;text-align:center;background:#fff;border:1px solid var(--border-strong);color:var(--cocoa-700);border-radius:var(--radius-md);padding:14px 0;font:var(--fw-bold) 13px var(--font-body);cursor:pointer')}>Plus tard</div>
            <div onClick={V.startReintro} style={css('flex:1.4;text-align:center;background:var(--coral-500);color:#fff;border-radius:var(--radius-md);padding:14px 0;font:var(--fw-bold) 13.5px var(--font-display);cursor:pointer;box-shadow:var(--shadow-brand)')}>Lancer la réintroduction</div>
          </div>
        </div>
        )}

        {/* ===================== CYCLE ===================== */}
        {V.isCycle && (
        <div style={css('position:absolute;inset:0;display:flex;flex-direction:column;overflow-y:auto;padding-bottom:84px')} className="ob-scroll">
          <div style={css('padding:16px 20px 4px')}>
            <div style={css('font:var(--fw-bold) 22px/1.1 var(--font-display);color:var(--ink)')}>Mon cycle</div>
            <div style={css('font:var(--fw-regular) 12px var(--font-body);color:var(--taupe-600);margin-top:3px')}>Suivi, prévisions et lien avec tes gênes</div>
          </div>

          <div style={css('position:relative;width:224px;height:224px;margin:12px auto 0;flex-shrink:0')}>
            <div style={css(V.ringStyle)}></div>
            <div style={css('position:absolute;inset:27px;border-radius:50%;background:var(--cream-50);display:flex;flex-direction:column;align-items:center;justify-content:center')}>
              <div style={css('font:600 10px var(--font-body);color:var(--info-700);letter-spacing:.1em;text-transform:uppercase')}>Jour</div>
              <div style={css('font:800 44px/1 var(--font-display);color:var(--ink)')}>{V.currentDay}</div>
              <div style={css('display:flex;align-items:center;gap:5px;margin-top:5px;background:var(--info-50);border-radius:var(--radius-pill);padding:3px 11px;font:700 11px var(--font-body);color:var(--info-700)')}><i className="ph-fill ph-drop" style={{ fontSize: 12 }}></i>{V.phaseLabel}</div>
              <div style={css('font:500 10.5px var(--font-mono);color:var(--taupe-600);margin-top:7px;white-space:nowrap')}>Règles dans {V.daysUntilNext} j</div>
            </div>
            <div style={css('position:absolute;inset:0;transform:rotate(' + V.markerDeg + 'deg)')}><div style={css('position:absolute;top:5px;left:50%;margin-left:-8px;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid var(--info-700);box-shadow:var(--shadow-sm)')}></div></div>
          </div>

          <div style={css('display:flex;flex-wrap:wrap;gap:12px;justify-content:center;padding:14px 20px 0')}>
            <div style={css('display:flex;align-items:center;gap:5px;font:600 10.5px var(--font-body);color:var(--cocoa-700)')}><span style={css('width:9px;height:9px;border-radius:50%;background:var(--info-700)')}></span>Règles</div>
            <div style={css('display:flex;align-items:center;gap:5px;font:600 10.5px var(--font-body);color:var(--cocoa-700)')}><span style={css('width:9px;height:9px;border-radius:50%;background:#8FBEE2')}></span>Folliculaire</div>
            <div style={css('display:flex;align-items:center;gap:5px;font:600 10.5px var(--font-body);color:var(--cocoa-700)')}><span style={css('width:9px;height:9px;border-radius:50%;background:var(--info-500)')}></span>Ovulation</div>
            <div style={css('display:flex;align-items:center;gap:5px;font:600 10.5px var(--font-body);color:var(--cocoa-700)')}><span style={css('width:9px;height:9px;border-radius:50%;background:#C7DCEF')}></span>Lutéale</div>
          </div>

          <div style={css('padding:16px 16px 0;display:flex;flex-direction:column;gap:10px')}>
            <div style={css('display:flex;gap:9px')}>
              <div style={css('flex:1;background:var(--info-50);border-radius:var(--radius-lg);padding:14px 15px')}>
                <div style={css('display:flex;align-items:center;gap:6px;font:700 10.5px var(--font-body);color:var(--info-700)')}><i className="ph-fill ph-drop" style={{ fontSize: 13 }}></i>Prochaines règles</div>
                <div style={css('font:800 19px var(--font-display);color:var(--info-700);margin-top:6px')}>{V.nextPeriodDate}</div>
                <div style={css('font:500 10.5px var(--font-mono);color:var(--info-500);margin-top:2px')}>dans {V.daysUntilNext} jours</div>
              </div>
              <div style={css('flex:1;background:#fff;border:1px solid var(--info-50);border-radius:var(--radius-lg);padding:14px 15px;box-shadow:var(--shadow-xs)')}>
                <div style={css('display:flex;align-items:center;gap:6px;font:700 10.5px var(--font-body);color:var(--info-700)')}><i className="ph-fill ph-sparkle" style={{ fontSize: 13 }}></i>Fenêtre fertile</div>
                <div style={css('font:800 15px var(--font-display);color:var(--ink);margin-top:6px')}>{V.fertileStart} – {V.fertileEnd}</div>
                <div style={css('font:500 10.5px var(--font-mono);color:var(--taupe-600);margin-top:2px')}>ovulation ~{V.ovDate}</div>
              </div>
            </div>

            <div style={css('background:#fff;border-radius:var(--radius-lg);padding:14px 16px;box-shadow:var(--shadow-sm)')}>
              <div style={css('font:var(--fw-semibold) 12px var(--font-body);color:var(--cocoa-700);margin-bottom:10px')}>Prévision · prochain cycle</div>
              <div style={css('position:relative;height:14px;border-radius:7px;background:' + V.forecastGradient + ';overflow:hidden')}></div>
              <div style={css('position:relative;height:16px;margin-top:5px')}>
                <div style={css('position:absolute;left:0;font:600 9.5px var(--font-body);color:var(--info-700)')}>Aujourd'hui</div>
                <div style={css('position:absolute;right:0;font:600 9.5px var(--font-body);color:var(--taupe-600)')}>Règles ~{V.nextPeriodDate}</div>
              </div>
            </div>

            <div style={css('display:flex;align-items:center;justify-content:space-between;margin:6px 2px 0')}>
              <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700)')}>Aujourd'hui · flux</div>
              <div onClick={V.goDouleur} style={css('font:var(--fw-semibold) 10.5px var(--font-body);color:var(--tol-avoid-700);cursor:pointer;display:flex;align-items:center;gap:4px')}><i className="ph ph-first-aid-kit" style={{ fontSize: 12 }}></i>Gêne digestive ? → J'ai mal</div>
            </div>
            <div style={css('display:flex;gap:8px')}>
              <div onClick={V.setFlowL} style={css(V.flowLStyle)}><div style={css(V.flowLDot)}></div><div style={css(V.flowLLabel)}>Léger</div></div>
              <div onClick={V.setFlowM} style={css(V.flowMStyle)}><div style={css(V.flowMDot)}></div><div style={css(V.flowMLabel)}>Moyen</div></div>
              <div onClick={V.setFlowA} style={css(V.flowAStyle)}><div style={css(V.flowADot)}></div><div style={css(V.flowALabel)}>Abondant</div></div>
            </div>

            <div style={css('font:var(--fw-bold) 12px var(--font-body);color:var(--cocoa-700);margin:6px 2px 0')}>Symptômes de règles <span style={{ fontWeight: 400, color: 'var(--taupe-600)' }}>· humeur &amp; corps</span></div>
            <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>
              {V.cycleSymptoms.map((c, i) => (<div key={i} onClick={c.onToggle} style={css(c.style)}>{c.name}</div>))}
            </div>

            {V.cycleNotSaved && (
              <div onClick={V.saveCycleLog} style={css('display:flex;align-items:center;justify-content:center;gap:8px;background:var(--info-500);color:#fff;text-align:center;border-radius:var(--radius-md);padding:14px 0;font:var(--fw-bold) 13.5px var(--font-display);cursor:pointer;margin-top:4px')}><i className="ph ph-check" style={{ fontSize: 16 }}></i>Enregistrer pour aujourd'hui</div>
            )}
            {V.cycleSaved && (
              <div style={css('display:flex;align-items:center;gap:10px;background:var(--tol-good-50);border-radius:var(--radius-md);padding:12px 14px;margin-top:4px')}>
                <div style={css('width:22px;height:22px;border-radius:50%;background:var(--tol-good-500);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0')}><i className="ph-bold ph-check" style={{ fontSize: 12 }}></i></div>
                <div style={css('flex:1;font:var(--fw-regular) 11.5px/1.4 var(--font-body);color:var(--tol-good-700)')}><strong>Noté pour aujourd'hui</strong> — {V.cycleSavedSummary}</div>
                <div onClick={V.editCycleLog} style={css('font:var(--fw-bold) 11px var(--font-body);color:var(--tol-good-700);cursor:pointer;text-decoration:underline')}>Modifier</div>
              </div>
            )}

            <div style={css('display:flex;align-items:center;gap:12px;background:#fff;border-radius:var(--radius-lg);padding:13px 16px;box-shadow:var(--shadow-sm);margin-top:6px')}>
              <div style={css('flex:1')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Durée moyenne du cycle</div><div style={css('font:var(--fw-regular) 10.5px var(--font-body);color:var(--taupe-600);margin-top:1px')}>Ajuste tes prévisions</div></div>
              <div style={css('display:flex;align-items:center;gap:10px')}>
                <div onClick={V.decLen} style={css('width:30px;height:30px;border-radius:50%;background:var(--info-50);color:var(--info-700);display:flex;align-items:center;justify-content:center;cursor:pointer')}><i className="ph-bold ph-minus" style={{ fontSize: 14 }}></i></div>
                <div style={css('font:500 17px var(--font-mono);color:var(--ink);min-width:44px;text-align:center')}>{V.cycleLength} j</div>
                <div onClick={V.incLen} style={css('width:30px;height:30px;border-radius:50%;background:var(--info-50);color:var(--info-700);display:flex;align-items:center;justify-content:center;cursor:pointer')}><i className="ph-bold ph-plus" style={{ fontSize: 14 }}></i></div>
              </div>
            </div>

            <div style={css('background:#fff;border-radius:var(--radius-lg);padding:15px 16px;box-shadow:var(--shadow-sm);margin-top:2px')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px')}><div style={css('font:var(--fw-bold) 12.5px var(--font-body);color:var(--ink)')}>Historique des cycles</div><div style={css('background:var(--info-50);color:var(--info-700);border-radius:var(--radius-pill);padding:3px 9px;font:700 10px var(--font-body)')}>moy. {V.avgLen} j</div></div>
              <div style={css('display:flex;align-items:flex-end;gap:9px;height:96px')}>
                {V.history.map((h, i) => (
                  <div key={i} style={css('flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end')}>
                    <div style={css('font:500 10px var(--font-mono);color:' + h.valColor)}>{h.len}</div>
                    <div style={css('width:100%;flex:1;display:flex;align-items:flex-end')}><div style={css(h.barStyle)}></div></div>
                    <div style={css('font:600 9.5px var(--font-body);color:var(--taupe-600)')}>{h.m}</div>
                  </div>
                ))}
              </div>
              <div style={css('display:flex;align-items:center;gap:8px;margin-top:12px;background:var(--info-50);border-radius:var(--radius-sm);padding:9px 11px')}><i className="ph-fill ph-trend-up" style={{ fontSize: 15, color: 'var(--info-500)', flexShrink: 0 }}></i><div style={css('font:var(--fw-regular) 10.5px/1.4 var(--font-body);color:var(--info-700)')}>5 cycles enregistrés · précision des prévisions <strong>±2 jours</strong>. Plus tu logues, plus c'est précis.</div></div>
            </div>

            <div style={css('background:linear-gradient(150deg,var(--coral-50),var(--tol-watch-50));border-radius:var(--radius-lg);padding:14px 16px;margin-top:2px')}>
              <div style={css('display:flex;align-items:center;gap:8px;font:var(--fw-bold) 12.5px var(--font-display);color:var(--cocoa-800)')}><i className="ph-fill ph-link" style={{ fontSize: 15, color: 'var(--coral-500)' }}></i>Comment l'app croise cycle × alimentation</div>
              <div style={css('display:flex;flex-direction:column;gap:7px;margin-top:9px')}>
                <div style={css('display:flex;gap:8px;align-items:flex-start')}><span style={css('width:16px;height:16px;border-radius:50%;background:#fff;color:var(--coral-600);font:700 9.5px var(--font-body);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px')}>1</span><div style={css('font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--cocoa-700)')}>Chaque gêne digestive est <strong>taguée avec ta phase</strong> du cycle.</div></div>
                <div style={css('display:flex;gap:8px;align-items:flex-start')}><span style={css('width:16px;height:16px;border-radius:50%;background:#fff;color:var(--coral-600);font:700 9.5px var(--font-body);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px')}>2</span><div style={css('font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--cocoa-700)')}>L'app compare tes gênes <strong>pendant / hors règles</strong>.</div></div>
                <div style={css('display:flex;gap:8px;align-items:flex-start')}><span style={css('width:16px;height:16px;border-radius:50%;background:#fff;color:var(--coral-600);font:700 9.5px var(--font-body);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px')}>3</span><div style={css('font:var(--fw-regular) 11px/1.45 var(--font-body);color:var(--cocoa-700)')}>Résultat : {V.cycleLinkStat} — les seuils d'alerte sont <strong>renforcés ces jours-là</strong>, sans accuser un aliment à tort.</div></div>
              </div>
              <div onClick={V.goAnalyse} style={css('margin-top:10px;display:inline-flex;align-items:center;gap:5px;font:var(--fw-bold) 11px var(--font-body);color:var(--coral-600);cursor:pointer')}>Voir dans l'analyse<i className="ph ph-arrow-right" style={{ fontSize: 12 }}></i></div>
            </div>
          </div>
        </div>
        )}

        {/* ===================== BOTTOM NAV ===================== */}
        {V.showNav && (
        <div style={css('position:absolute;left:0;right:0;bottom:0;height:64px;display:flex;align-items:center;padding:0 14px;background:#fff;border-top:1px solid var(--border-soft)')}>
          <div style={css('flex:1;display:flex;justify-content:space-around')}>{V.navLeft.map((it, i) => (<div key={i} onClick={it.onTap} style={css('display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;min-width:48px')}><i className={it.iconCls} style={{ fontSize: 22, color: it.color }}></i><div style={css('font:var(--fw-bold) 10px var(--font-body);color:' + it.color)}>{it.label}</div></div>))}</div>
          <div onClick={V.goCapture} style={css('width:52px;height:52px;border-radius:50%;background:var(--coral-500);box-shadow:var(--shadow-brand);display:flex;align-items:center;justify-content:center;margin-top:-22px;cursor:pointer;flex-shrink:0')}><i className="ph ph-plus" style={{ fontSize: 26, color: '#fff' }}></i></div>
          <div style={css('flex:1;display:flex;justify-content:space-around')}>{V.navRight.map((it, i) => (<div key={i} onClick={it.onTap} style={css('display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;min-width:48px')}><i className={it.iconCls} style={{ fontSize: 22, color: it.color }}></i><div style={css('font:var(--fw-bold) 10px var(--font-body);color:' + it.color)}>{it.label}</div></div>))}</div>
        </div>
        )}

        {/* ===================== TOAST ===================== */}
        {V.toastShown && (
        <div style={css('position:absolute;left:16px;right:16px;bottom:80px;display:flex;align-items:center;gap:10px;background:var(--cocoa-800);color:#fff;border-radius:var(--radius-md);padding:12px 14px;box-shadow:var(--shadow-md);z-index:30')}>
          <i className="ph-fill ph-check-circle" style={{ fontSize: 18, color: '#fff', flexShrink: 0 }}></i>
          <div style={css('flex:1;font:var(--fw-semibold) 11.5px/1.35 var(--font-body)')}>{V.toastMsg}</div>
        </div>
        )}

        {/* ===================== PUSH NOTIFICATION (démo) ===================== */}
        {V.pushShown && (
        <div onClick={V.tapPush} style={css('position:absolute;top:12px;left:12px;right:12px;display:flex;gap:11px;align-items:flex-start;background:rgba(43,34,30,.94);color:#fff;border-radius:18px;padding:12px 13px;box-shadow:var(--shadow-md);z-index:50;cursor:pointer')}>
          <div style={css('width:34px;height:34px;border-radius:9px;background:var(--coral-500);display:flex;align-items:center;justify-content:center;flex-shrink:0')}><i className={V.pushIconCls} style={{ fontSize: 18, color: '#fff' }}></i></div>
          <div style={css('flex:1;min-width:0')}>
            <div style={css('display:flex;align-items:baseline;justify-content:space-between;gap:8px')}><div style={css('font:800 10px var(--font-body);letter-spacing:var(--ls-caps);text-transform:uppercase;opacity:.7')}>Obélix</div><div style={css('font:500 9.5px var(--font-mono);opacity:.6')}>maintenant</div></div>
            <div style={css('font:var(--fw-bold) 12.5px var(--font-body);margin-top:2px')}>{V.pushTitle}</div>
            <div style={css('font:var(--fw-regular) 11px/1.4 var(--font-body);opacity:.85;margin-top:2px')}>{V.pushText}</div>
          </div>
          <div onClick={V.dismissPush} style={css('width:22px;height:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;opacity:.6')}><i className="ph ph-x" style={{ fontSize: 14 }}></i></div>
        </div>
        )}

      </div>
    </PhoneFrame>
  );
}
