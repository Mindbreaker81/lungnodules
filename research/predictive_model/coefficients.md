For a physician's clinical use, the following technical summary provides the validated coefficients, variable definitions, and probability formulas for the three primary lung cancer risk stratification models.

### 1. Mayo Clinic Model (Swensen et al., 1997)
This model is designed for solitary pulmonary nodules (SPNs) identified on traditional CT. It is based on a logistic regression where the probability of malignancy \( P \) is:
$$ P = \frac{e^{x}}{1 + e^{x}} $$
Where \( x \) (the log-odds) is calculated as:
$$ x = -6.827 + (0.039 \times \text{Age}) + (0.791 \times \text{Smoking}) + (1.338 \times \text{Cancer}) + (0.127 \times \text{Diameter}) + (0.710 \times \text{Spiculation}) + (1.138 \times \text{Upper}) $$

**Variable Coding:**
*   **Age:** Age in years.
*   **Smoking:** 1 if the patient is a current or former smoker; 0 if never smoked.
*   **Cancer:** 1 if there is a history of extrathoracic cancer diagnosed **> 5 years ago**; 0 otherwise.
*   **Diameter:** The largest diameter of the nodule in **millimeters**.
*   **Spiculation:** 1 if the nodule has spiculed margins; 0 otherwise.
*   **Upper:** 1 if the nodule is located in the **upper lobe** (either right or left); 0 if in the middle or lower lobes.

---

### 2. Brock University Model (McWilliams et al., 2013)
The Brock (or PanCan) model is specifically validated for nodules found on **screening CT**. It uses a more granular variable set. 
$$ x = \text{Intercept} + \sum (\beta_i \times \text{Variable}_i) $$
*Note: Coefficients vary slightly between "Parsimonious" and "Full" models; clinical tools usually use the Parsimonious model.*

**Official Coefficients (Parsimonious Model):**
*   **Intercept:** -8.4852
*   **Age:** 0.0287 (per year)
*   **Sex:** 0.6011 (if Female)
*   **Family History of Lung Cancer:** 0.2961 (if present)
*   **Emphysema:** 0.2953 (if present on CT)
*   **Nodule Size:** 0.0546 (per mm increase in diameter)
*   **Nodule Type:** 
    *   Nonsolid (GGO): -0.1271
    *   Part-solid: 0.3770
    *   (Solid is the reference)
*   **Nodule Count:** -0.0654 (per additional nodule)
*   **Spiculation:** 0.3543 (if present)
*   **Upper Lobe:** 0.3138 (if present)

**Variable Coding & Logic:**
*   **Sex:** Female = 1, Male = 0.
*   **Nodule Count:** Entered as a continuous integer. Note the **negative coefficient**: as the number of nodules increases, the risk of any *single* nodule being malignant actually decreases statistically.
*   **Nodule Type:** This is a categorical variable. If solid, both "Nonsolid" and "Part-solid" are 0.
*   **Emphysema:** Must be visible on the CT scan, not just a clinical diagnosis of COPD.

---

### 3. Herder Model (Herder et al., 2005)
The Herder model uses the **Mayo Clinic score** as a "pre-PET" probability and then modifies the odds based on FDG-PET uptake levels.

**Step 1:** Calculate the Mayo probability (\( P_{Mayo} \)).
**Step 2:** Convert probability to Pre-PET Odds (\( O_{pre} \)):
$$ O_{pre} = \frac{P_{Mayo}}{1 - P_{Mayo}} $$
**Step 3:** Multiply by the Likelihood Ratio (LR) corresponding to the PET uptake level:
$$ O_{post} = O_{pre} \times \text{LR} $$

**PET Uptake Multipliers (LR):**
| FDG Uptake Category | Definition | Likelihood Ratio (LR) |
| :--- | :--- | :--- |
| **Absent** | Uptake \(\leq\) background lung tissue | 0.08 |
| **Faint** | Uptake \(>\) lung but \(\leq\) mediastinal blood pool | 0.17 |
| **Moderate** | Uptake \(>\) mediastinal blood pool | 1.9 |
| **Intense** | Marked uptake (much greater than blood pool) | 9.9 |

**Step 4:** Convert Post-PET Odds back to Probability (\( P_{Herder} \)):
$$ P_{Herder} = \frac{O_{post}}{1 + O_{post}} $$

**Step 5 (Formula Adjustment):**
Herder also published a specific logistic regression version where PET is an additional coefficient in the Mayo formula:
*   **Mayo Score (x):** Same as above.
*   **PET Level Coefficients (\(\beta\)):**
    *   Faint: +1.439
    *   Moderate: +3.893
    *   Intense: +5.534
    *   (Absent is the reference)