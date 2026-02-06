# Medical Disclaimer & Clinical Safety

## :rotating_light: Important Medical Disclaimer

**This tool is for CLINICAL DECISION SUPPORT ONLY and does NOT replace professional medical judgment, diagnosis, or treatment.**

---

## Purpose and Scope

### What This Tool Does

The **Lung Nodule Follow-Up Decision Support Tool** is designed to assist healthcare professionals in:

- :white_check_mark: Applying evidence-based guidelines to lung nodule assessment
- :white_check_mark: Calculating follow-up recommendations based on published criteria
- :white_check_mark: Providing standardized categorization according to clinical guidelines
- :white_check_mark: Supporting clinical decision-making with current medical literature

### What This Tool Does NOT Do

- :no_entry_sign: **Provide medical diagnoses**
- :no_entry_sign: **Replace clinical judgment or expertise**
- :no_entry_sign: **Make treatment decisions**
- :no_entry_sign: **Guarantee patient outcomes**
- :no_entry_sign: **Collect, store, or transmit patient data**

---

## Applicability and Limitations

### :page_facing_up: Clinical Guidelines Implemented

This tool implements recommendations from:

| Guideline | Version | Year | Reference |
|-----------|---------|------|-----------|
| **Fleischner Society Guidelines** | 2017 | 2017 | MacMahon H, et al. *Radiology*. 2017;284(1):228-243 |
| **Lung-RADS** | v2022 | 2022 | American College of Radiology. November 2022 |

### :warning: Patient Exclusions

**These guidelines DO NOT apply to the following patient populations:**

- Patients **< 35 years old** (Fleischner)
- **Immunocompromised** patients (e.g., HIV, transplant recipients, chemotherapy)
- Patients with **known malignancy** (active cancer, under treatment, or history of malignancy)
- **Pediatric patients**
- Patients with **specific occupational exposures** not covered by general guidelines
- Patients with **rare lung diseases** (e.g., Langerhans cell histiocytosis, sarcoidosis)

**For these patients, clinical judgment and specialist consultation are REQUIRED.**

### :heavy_exclamation_mark: Important Limitations

1. **Guideline Versioning**
   - Medical guidelines evolve over time
   - This tool implements specific versions (Fleischner 2017, Lung-RADS 2022)
   - Always verify recommendations against current published guidelines

2. **Individual Patient Factors**
   - Guidelines are based on population data
   - Individual patient factors may justify different management:
     - Comorbidities (COPD, heart failure, etc.)
     - Life expectancy and functional status
     - Patient preferences and values
     - Access to follow-up imaging
     - Local resource availability

3. **Measurement Variability**
   - Nodule measurements can vary between:
     - Different radiologists
     - Different imaging techniques
     - Different measurement methods
   - Small variations (<1-2mm) may change categorization
   - Clinical correlation is essential

4. **Context-Specific Decisions**
   - Guidelines provide general recommendations
   - Clinical context may require different approaches:
     - Nodule morphology (spiculation, margins)
     - Location within the lung
     - Associated findings
     - Change over time (growth pattern)

---

## Clinical Responsibility

### :user_md: Healthcare Professional Responsibilities

By using this tool, you acknowledge and agree that:

1. **You are a qualified healthcare professional** with appropriate training and licensure
2. **You are solely responsible** for all clinical decisions regarding patient care
3. **You will verify recommendations** against current medical literature and guidelines
4. **You will exercise independent clinical judgment** in applying recommendations
5. **You will consider individual patient factors** that may warrant deviation from guidelines
6. **You will maintain appropriate documentation** of your clinical decision-making

### :book: Recommended Workflow

When using this tool for clinical decision support:

```
1. Obtain accurate nodule measurements from CT imaging
2. Gather relevant patient history and risk factors
3. Use this tool to calculate guideline-based recommendations
4. Verify the recommendation against published guidelines
5. Consider individual patient factors and context
6. Apply clinical judgment to determine final management plan
7. Document recommendation, considerations, and final decision
```

---

## Data Privacy and Security

### :lock: Privacy Commitment

This application is designed with **patient privacy as a fundamental principle**:

- **No Personal Health Information (PHI) is collected**
- **No data is transmitted to servers**
- **No data is stored persistently**
- **All calculations occur locally in your browser**
- **No patient identifiers are required or used**

### :shield: No Data Retention

- No cookies are used for data storage
- No local storage of patient information
- No analytics on patient-level data
- No third-party data sharing
- Session data is cleared when browser closes

---

## Accuracy and Validation

### :test_tube: Algorithm Validation

This tool has been:

- :white_check_mark: Implemented according to published guideline specifications
- :white_check_mark: Tested against published test cases
- :white_check_mark: Reviewed for implementation accuracy
- :white_check_mark: Validated against edge cases

**However:**
- Software bugs are possible
- Interpretation of guidelines may vary
- Continuous validation is recommended
- Report any discrepancies or errors

### :chart_with_upwards_trend: Maintenance and Updates

- Guidelines are periodically updated by professional societies
- This tool should be updated when guidelines change
- Users should verify they are using the current version
- Version information is displayed in the application

---

## Informed Consent and Communication

### :speech_bubble: Patient Communication

When discussing lung nodule findings and follow-up recommendations:

1. **Explain the nature of the finding** (what is a lung nodule)
2. **Explain the uncertainty** (many nodules are benign)
3. **Discuss the recommendation** (what guideline suggests)
4. **Explain the rationale** (why this recommendation)
5. **Discuss alternatives** (if applicable)
6. **Address patient concerns and questions**
7. **Document the discussion**

---

## Liability and Legal Disclaimer

### :scales: Legal Disclaimer

**THIS SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.**

IN NO EVENT SHALL THE AUTHORS, CONTRIBUTORS, OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### :warning: No Doctor-Patient Relationship

Use of this tool does NOT create a doctor-patient relationship.
The tool provides information, not medical advice.

### :clipboard: Professional Use Only

This tool is intended for use by **qualified healthcare professionals only**.
It is NOT intended for use by the general public for self-diagnosis or self-treatment.

---

## Reporting Issues

### :bug: Reporting Clinical Concerns

If you identify any:

- **Incorrect recommendations** (contrary to published guidelines)
- **Algorithm errors** (incorrect calculation or logic)
- **Ambiguous outputs** (unclear or confusing results)
- **Documentation errors** (incorrect references or information)

**Please report these issues through:**
- GitHub Issues: [repository-url]/issues
- Label: `clinical-accuracy` or `bug`

### :link: Useful References

- [Fleischner Society 2017 Guidelines](https://pubs.rsna.org/doi/10.1148/radiol.2017161659)
- [ACR Lung-RADS v2022](https://www.acr.org/-/media/ACR/Files/RADS/Lung-RADS/LungRADS-2022.pdf)
- [American Thoracic Society Guidelines](https://www.thoracic.org/statements/resources/pulmonary-nodules/)
- [Radiopaedia - Pulmonary Nodules](https://radiopaedia.org/articles/pulmonary-nodule)

---

## Version Information

**Current Version:** 1.0.2
**Guideline Versions:**
- Fleischner Society: 2017
- Lung-RADS: v2022 (November 2022)
**Last Updated:** January 2026

---

## Acknowledgments

This tool is developed to support evidence-based medicine and improve adherence to clinical guidelines. It is not affiliated with, endorsed by, or officially recognized by:

- The Fleischner Society
- The American College of Radiology
- Any professional medical society

**Always verify recommendations against current published guidelines and exercise independent clinical judgment.**

---

**By using this tool, you acknowledge that you have read, understood, and agree to these terms.**

*For questions about this disclaimer, please contact the repository maintainers.*
