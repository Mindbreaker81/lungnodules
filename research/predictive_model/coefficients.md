# Predictive models — coefficients and formulas (clinical summary)

> **Last synced:** 2026-06-15 with [`variables_y_coeficientes.md`](./variables_y_coeficientes.md) and `lib/predictive/index.ts` (app v1.6.0).  
> **Hierarchy:** verification status, inputs, and pending items → **variables_y_coeficientes.md** (incl. [Anexo A — inputs](./variables_y_coeficientes.md#anexo-a--mapa-de-inputs-wizard--predictivos)) > **this file** > code.  
> **References (PubMed/DOI):** [`config/references.ts`](../../config/references.ts) → app `/references`.

For physician-facing use, the following summarizes validated coefficients, variable definitions, and probability formulas for **Mayo**, **Brock (2a/2b)**, and **Herder (two variants)** as implemented in the lung nodules app.

---

## 1. Mayo Clinic Model (Swensen et al., 1997)

**Context in app:** incidental (Fleischner) only.

Logistic regression:

$$ P = \frac{e^{x}}{1 + e^{x}} $$

$$ x = -6.8272 + (0.0391 \times \text{Age}) + (0.7917 \times \text{Smoking}) + (1.3388 \times \text{Cancer}) + (0.1274 \times \text{Diameter}) + (1.0407 \times \text{Spiculation}) + (0.7838 \times \text{Upper}) $$

| Variable | Coding |
| -------- | ------ |
| **Age** | Years |
| **Smoking** | 1 = current or former smoker; 0 = never |
| **Cancer** | 1 = extrathoracic cancer diagnosed **> 5 years** ago; 0 otherwise |
| **Diameter** | Largest diameter in **mm** |
| **Spiculation** | 1 = spiculated margins; 0 = absent (**must be explicit**; “not evaluable” → model not calculated) |
| **Upper** | 1 = upper lobe (right or left); 0 = middle or lower |

**App exclusions:** screening context; diameter > 30 mm; known lung malignancy; extrathoracic cancer < 5 years (`recent`).

**Diameter range (paper / MDCalc):** validated for **4–30 mm**. The app excludes only > 30 mm on Mayo (minimum 4 mm is enforced for Herder eligibility, not Mayo).

**Verification:** **primary** against local PDF `research/pdf/swensen 10.1001-archinte.1997.00440290031002.pdf` (2026-06-15; equation p.852 + Table 3 spot check). Also matches MDCalc.

**With PET filled in:** Mayo remains **pre-PET** probability; post-PET adjustment uses Herder variants (§3).

---

## 2. Brock University Model (McWilliams et al., 2013)

**Context in app:** screening (Lung-RADS) only.

The app implements McWilliams **full models 2a and 2b** (not parsimonious 1a/1b).

$$ x = \text{Intercept} + \sum (\beta_i \times \text{Variable}_i) \qquad P = \frac{1}{1 + e^{-x}} $$

**Variant selection:** `hasSpiculation` is a **boolean** → Model **2b**; `undefined` (not evaluable) → Model **2a** (recalibrated coefficients, spiculation term omitted).

### Model 2b — full model with spiculation

| Term | Coefficient |
| ---- | ----------- |
| Intercept | −6.7892 |
| Age | 0.0287 × (Age − 62) |
| Sex (female) | 0.6011 |
| Family history of lung cancer | 0.2961 |
| Emphysema on CT | 0.2953 |
| Nodule size | −5.3854 × [ (Size_mm / 10)^(−0.5) − 1.58113883 ] |
| Type: nonsolid (GGO) | −0.1276 |
| Type: part-solid | 0.3770 |
| Type: solid | 0 (reference) |
| Upper lobe | 0.6581 |
| Nodule count | −0.0824 × (Count − 4) |
| Spiculation | 0.7729 |

### Model 2a — full model without spiculation

| Term | Coefficient |
| ---- | ----------- |
| Intercept | −6.8071 |
| Age | 0.0321 × (Age − 62) |
| Sex (female) | 0.5635 |
| Family history | 0.3013 |
| Emphysema on CT | 0.3462 |
| Nodule size | −5.6693 × [ (Size_mm / 10)^(−0.5) − 1.58113883 ] |
| Type: nonsolid (GGO) | −0.3005 |
| Type: part-solid | 0.3395 |
| Upper lobe | 0.7116 |
| Nodule count | −0.0803 × (Count − 4) |

**Notes:**

- **Age** must be centered at 62; raw age alone is incorrect.
- **Size** uses the non-linear transform above, not linear mm.
- **Count** is centered at 4; negative coefficient ⇒ more nodules ⇒ lower per-nodule malignancy risk. Solitary nodule (count = 1) adds ≈ +0.247 (2b) or +0.241 (2a) to log-odds.
- **Emphysema** = visible on CT, not clinical COPD alone.

**App exclusions:** incidental context; diameter > 30 mm.

**Verification:** **primary** against local PDF `research/pdf/McWilliams - … First Screening CT.pdf`, Table 2 (2026-06-15).

---

## 3. Herder Model (Herder et al., 2005)

> **2026-06-15:** the original paper publishes **only** the logistic regression (§3b). The odds × LR approach (§3a) is the **BTS 2015 / MDCalc** variant. The app implements **both** with equal prominence: `id: "herder"` (BTS-LR) and `id: "herder-logistic"` (published logistic).

**Shared eligibility:** PET available (`hasPet` + `petUptake`); diameter ≥ 4 mm and ≤ 30 mm; pre-test Mayo (incidental) or Brock (screening) calculable. Clinical warning if diameter < 8 mm (Herder validated mainly ≥ 8 mm).

### 3a. BTS variant — odds × likelihood ratio (`id: "herder"`)

1. Pre-test probability \( P_{pre} \) from Mayo (incidental) or Brock (screening).
2. \( O_{pre} = P_{pre} / (1 - P_{pre}) \)
3. \( O_{post} = O_{pre} \times \text{LR} \)
4. \( P_{Herder} = O_{post} / (1 + O_{post}) \)

| FDG uptake | Definition | LR |
| ---------- | ---------- | -- |
| Absent | ≤ background lung | 0.08 |
| Faint | > lung, ≤ mediastinal blood pool | 0.17 |
| Moderate | > mediastinal blood pool | 1.9 |
| Intense | Markedly greater than blood pool | 9.9 |

**BTS-only rule in app:** pre-test probability **≥ 10%**; below 10% → variant not applied.

**Verification:** secondary (BTS 2015 / MDCalc); LRs **not** in Herder 2005 paper.

**Note:** Herder was validated with Mayo pre-test; using Brock pre-test in screening has limited evidence — the app displays a warning.

### 3b. Published logistic regression (`id: "herder-logistic"`)

$$ x = -4.739 + 3.691 \cdot P_{pre} + \beta_{FDG} \qquad P_{Herder} = \frac{1}{1 + e^{-x}} $$

- **\( P_{pre} \):** fraction **0–1** (not 0–100). Example: \( P_{pre}=0.187 \), intense → \( x \approx 0.722 \) → \( P \approx 0.673 \).
- **\( \beta_{FDG} \)** (visual uptake scale, verified Herder 2005 PDF + Mourato 2020 PMC7159041):

| Uptake | βFDG |
| ------ | ---- |
| Absent | 0 (reference) |
| Faint | +2.322 |
| Moderate | +4.617 |
| Intense | +4.771 |

**No** pre-test ≥ 10% threshold (that is BTS management guidance, not the published logistic model).

> Incorrect legacy values (Faint +1.439 / Moderate +3.893 / Intense +5.534) were removed 2026-06-15. \( \beta_{FDG} \) is added to intercept −4.739, **not** to Mayo log-odds.

**Verification:** **primary** (Herder 2005 PDF + PMC7159041 reproduction).

---

## 4. Risk bands (app display)

After probability calculation, the app maps \( P \) to bands (`toRiskBand`):

| Band | Threshold | Suggested action (UI) |
| ---- | --------- | --------------------- |
| Low | < 5% | Watchful waiting / active surveillance |
| Intermediate | 5–65% | Consider PET-CT or non-surgical biopsy |
| High | > 65% | Consider surgical biopsy or resection |

BTS management thresholds (< 10% surveillance; > 70% treatment) are documented in variables §5 but not fully mapped in UI.

---

## 5. Inputs quick reference

See **[Anexo A](./variables_y_coeficientes.md#anexo-a--mapa-de-inputs-wizard--predictivos)** for the full wizard ↔ model field map. Key divergences:

- **Spiculation:** 3-state UI; Mayo requires boolean; Brock uses 2a when undefined; Lung-RADS does not upgrade to 4X when undefined.
- **Predictive block in wizard** is optional; guide may compute while predictive cards show `insufficient_data`.
