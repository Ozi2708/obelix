# Obélix — App Manon

Application mobile (web) d'**identification des intolérances alimentaires**.
Tu logues tes repas (dictée, photo, code-barres, repas récents), tu notes tes
gênes digestives et ton hydratation, et Obélix croise tout pour identifier
*tes* suspects — jamais un diagnostic, un outil d'observation.

Recréation fidèle (hi-fi) du prototype de handoff « App Manon », portée en
**React / Next.js** pour un déploiement Vercel, en s'appuyant sur le design
system Obélix (tokens couleurs / typo / espacements / rayons / ombres) et la
base de connaissances alimentaire des ~400 aliments.

## Stack

- **Next.js 14** (App Router) + **React 18**
- Design system Obélix : tokens CSS dans `app/tokens/` (importés via `app/globals.css`)
- Typographie : **Bricolage Grotesque** (display), **Nunito Sans** (UI), **DM Mono** (données) — Google Fonts
- Icônes : **Phosphor** (`@phosphor-icons/web`, CDN) — le seul système d'icônes du DS
- **Caméra code-barres** : `getUserMedia` + **ZXing** (`@zxing/browser`) — décodage réel
- **Reconnaissance vocale** : **Web Speech API** (`fr-FR`) + extraction d'aliments depuis la base
- Aucune base de données serveur : état local persistant via `localStorage`

## Démarrer en local

```bash
npm install
npm run dev        # http://localhost:3000
```

Build de production :

```bash
npm run build && npm run start
```

## Déploiement Vercel

Le projet est un app Next.js standard : importer le repo dans Vercel, aucune
variable d'environnement requise. Le build par défaut (`next build`) suffit.

## Écrans

- **Onboarding** — symptômes habituels, suspects pressentis, suivi du cycle
- **Journal** — repas + gênes du jour, hydratation (Peu bu / Correct / Bien bu), bilan du soir
- **Ajout d'un repas** — dictée (défaut), Photo / capture, Code-barres, Repas récents
- **Code-barres** — appel réel à l'API publique **Open Food Facts** + exemples de démo
- **Vérification & validation** — décomposition IA du plat, composés suivis, quantité
- **Prévision** — digestion estimée + fenêtres à risque des prochaines 24 h
- **Signaler une gêne** — intensité, type, localisation, délai, contexte cycle (attribution automatique)
- **Maintenant** — fenêtres personnelles encore actives, feedback d'apprentissage des délais
- **Analyse** — principal suspect, familles de composés, ingrédients suivis, test d'éviction / réintroduction, facteurs non-alimentaires
- **Cycle** — anneau de phases, prévisions, flux & symptômes, historique
- **Profil** — notifications, suivi, base alimentaire, export PDF (démo), gestion des données
- **Base alimentaire** — ~400 aliments par catégorie et leurs composés (FODMAP, gluten, histamine, caféine)

## Note santé

Obélix **observe, ne diagnostique pas**. Le vocabulaire reste prudent
(« semble te gêner », « à surveiller »), l'échelle de tolérance vert → ambre →
rouge est **toujours** accompagnée d'un label + pictogramme, et l'app invite à
parler à un professionnel de santé.

## Caméra & reconnaissance vocale — fonctionnelles

- **Caméra code-barres** (`components/CameraScanner.jsx`) : ouvre la caméra
  arrière via `navigator.mediaDevices.getUserMedia` et décode les codes
  EAN/UPC en direct avec **ZXing** (`@zxing/browser`, importé dynamiquement).
  Le code détecté interroge Open Food Facts. Nécessite un **contexte sécurisé
  (HTTPS)** — c'est le cas sur Vercel ; en l'absence de caméra ou de permission,
  un message clair invite à la saisie manuelle. Le flux vidéo reste sur
  l'appareil, rien n'est envoyé.
- **Reconnaissance vocale** (`components/VoiceCapture.jsx`) : dictée réelle via
  la **Web Speech API** (`SpeechRecognition`, `fr-FR`). Le transcript est
  analysé contre la base des ~400 aliments pour en extraire les ingrédients,
  que l'utilisateur confirme/ajuste à l'étape de validation. Repli sur un
  exemple scripté si le navigateur ne supporte pas l'API.

> La saisie manuelle du code-barres (13 chiffres) reste toujours disponible et
> interroge Open Food Facts en direct.

## Structure

```
app/
  layout.jsx        # <head> : Phosphor CDN + métadonnées
  page.jsx          # monte l'app, centrée dans un bezel Android
  globals.css       # import des tokens + reset
  tokens/*.css      # tokens du design system Obélix
components/
  ObelixApp.jsx     # l'application complète (état + logique + tous les écrans)
  PhoneFrame.jsx    # bezel Android (barre de statut + nav gestuelle)
  ImageSlot.jsx     # zone photo drag-and-drop (analyse locale, rien n'est envoyé)
lib/
  foodDb.js         # base de connaissances alimentaire (~400 aliments → composés)
public/             # logos Obélix (badge, blanc, menhir seul)
```
