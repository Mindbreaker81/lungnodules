"""Independent re-implementation of the four risk models, written from the
primary sources extracted from research/pdf/*.pdf:

- Mayo  : Swensen et al., Arch Intern Med 1997 (eq. on p.853 of the article,
          verified vs. its Table 3).
          x = -6.8272 + 0.0391*age + 0.7917*cig + 1.3388*cancer
              + 0.1274*diam_mm + 1.0407*spic + 0.7838*upper
- Brock : McWilliams et al., NEJM 2013, Table 2 (models 2a, 2b; also 1a, 1b).
          size term = (d/10)^-0.5 - (4/10)^-0.5  [= (d/10)^-0.5 - 1.58113883]
          age-62, count-4 centered.
- Herder: Herder et al., Chest 2005, p.2492 (formula printed in Results).
          x = -4.739 + 3.691*P_mayo(fraction) + 2.322*faint
              + 4.617*moderate + 4.771*intense
- PLCOm2012: Tammemagi et al., NEJM 2013, Table 2 + footnote.
          intensity term = (cigs/10)^-1 - 0.4021541613
"""
import math


def logistic(x):
    return 1.0 / (1.0 + math.exp(-x))


def mayo(age, smoker, cancer_over5y, diameter_mm, spiculation, upper_lobe):
    x = (-6.8272 + 0.0391 * age + 0.7917 * smoker + 1.3388 * cancer_over5y
         + 0.1274 * diameter_mm + 1.0407 * spiculation + 0.7838 * upper_lobe)
    return logistic(x)


SIZE_OFFSET = 0.4 ** -0.5  # (4 mm / 10)^-0.5 = 1.5811388300841898

BROCK_2A = dict(  # full model, no spiculation (McWilliams Table 2)
    intercept=-6.8071, age=0.0321, sex=0.5635, famhx=0.3013, emphysema=0.3462,
    size=-5.6693, nonsolid=-0.3005, partsolid=0.3395, upper=0.7116,
    count=-0.0803, spic=0.0)
BROCK_2B = dict(  # full model, with spiculation
    intercept=-6.7892, age=0.0287, sex=0.6011, famhx=0.2961, emphysema=0.2953,
    size=-5.3854, nonsolid=-0.1276, partsolid=0.3770, upper=0.6581,
    count=-0.0824, spic=0.7729)
BROCK_1A = dict(  # parsimonious, no spiculation
    intercept=-6.5929, size=-5.8616, sex=0.5806, upper=0.6439)
BROCK_1B = dict(  # parsimonious, with spiculation
    intercept=-6.6144, size=-5.5537, sex=0.6467, upper=0.6009, spic=0.9309)


def brock(model, age, female, famhx, emphysema, diameter_mm, ntype, upper,
          count, spic=None):
    """ntype: 'solid'|'part-solid'|'nonsolid'(GGO). spic: 0/1/None."""
    c = {'2a': BROCK_2A, '2b': BROCK_2B, '1a': BROCK_1A, '1b': BROCK_1B}[model]
    size_term = (diameter_mm / 10.0) ** -0.5 - SIZE_OFFSET
    x = c['intercept'] + c['size'] * size_term + c['sex'] * female \
        + c['upper'] * upper
    if model in ('2a', '2b'):
        x += (c['age'] * (age - 62) + c['famhx'] * famhx
              + c['emphysema'] * emphysema
              + c['nonsolid'] * (ntype == 'nonsolid')
              + c['partsolid'] * (ntype == 'part-solid')
              + c['count'] * (count - 4))
    if model in ('1b', '2b'):
        assert spic is not None
        x += c['spic'] * spic
    return logistic(x)


HERDER_FDG = {'absent': 0.0, 'faint': 2.322, 'moderate': 4.617,
              'intense': 4.771}


def herder(p_mayo, fdg):
    return logistic(-4.739 + 3.691 * p_mayo + HERDER_FDG[fdg])


RACE = {'white': 0.0, 'american_indian_alaskan_native': 0.0,
        'black': 0.3944778, 'hispanic': -0.7434744, 'asian': -0.466585,
        'native_hawaiian_pacific_islander': 1.027152}


def plcom2012(age, race, education, bmi, copd, cancer_hist, fam_hist_lc,
              smoking_status, cigs_per_day, duration_smoking, quit_time):
    intensity = (cigs_per_day / 10.0) ** -1 - 0.4021541613
    lp = (0.0778868 * (age - 62) + RACE[race]
          + (-0.0812744) * (education - 4)
          + (-0.0274194) * (bmi - 27)
          + 0.3553063 * copd + 0.4589971 * cancer_hist
          + 0.587185 * fam_hist_lc
          + 0.2597431 * (smoking_status == 'current')
          + (-1.822606) * intensity
          + 0.0317321 * (duration_smoking - 27)
          + (-0.0308572) * (quit_time - 10)
          + (-4.532506))
    return math.exp(lp) / (1 + math.exp(lp))


if __name__ == '__main__':
    # Swensen Table 3 verification: all 16 flag rows x ages {35,55,75} x {10,20,30}
    # Table order: block A = cigarettes 0 (flags: cancer, spic, upper),
    #              block B = cigarettes 1.
    expected = {
        # cigs, cancer, spic, upper: [35y(10,20,30), 55y(10,20,30), 75y(10,20,30)]
        (0,0,0,0): [.02,.05,.16,.03,.11,.30,.07,.21,.48],
        (0,0,0,1): [.03,.11,.30,.07,.21,.48,.14,.36,.67],
        (0,0,1,0): [.04,.13,.36,.09,.25,.55,.17,.42,.73],
        (0,0,1,1): [.09,.25,.55,.17,.43,.73,.31,.62,.85],
        (0,1,0,0): [.06,.17,.43,.11,.31,.62,.22,.50,.78],
        (0,1,0,1): [.11,.31,.62,.22,.50,.78,.38,.69,.89],
        (0,1,1,0): [.14,.37,.68,.26,.56,.82,.44,.74,.91],
        (0,1,1,1): [.27,.56,.82,.44,.74,.91,.63,.86,.96],
        (1,0,0,0): [.03,.11,.30,.07,.21,.48,.14,.37,.67],
        (1,0,0,1): [.07,.21,.49,.14,.37,.67,.26,.56,.82],
        (1,0,1,0): [.09,.25,.55,.17,.43,.73,.31,.62,.85],
        (1,0,1,1): [.17,.43,.73,.31,.62,.85,.50,.78,.93],
        (1,1,0,0): [.11,.31,.62,.22,.50,.78,.38,.69,.89],
        (1,1,0,1): [.22,.50,.78,.38,.69,.89,.57,.83,.95],
        (1,1,1,0): [.27,.57,.82,.44,.74,.91,.63,.86,.96],
        (1,1,1,1): [.44,.74,.91,.64,.86,.96,.79,.93,.98],
    }
    ages = [35, 55, 75]
    sizes = [10, 20, 30]
    maxdiff = 0.0
    worst = None
    for (cig, can, spic, up), row in expected.items():
        for i, age in enumerate(ages):
            for j, d in enumerate(sizes):
                mine = mayo(age, cig, can, d, spic, up)
                want = row[i * 3 + j]
                diff = abs(mine - want)
                if diff > maxdiff:
                    maxdiff, worst = diff, ((cig, can, spic, up), age, d, mine, want)
    print(f'Swensen Table3: max |mine - table| = {maxdiff:.4f} at {worst}')
    # PLCOm2012 reference (all centered except intensity/quit -> checks transform)
    p = plcom2012(62, 'white', 4, 27, 0, 0, 0, 'former', 80, 27, 10)
    print(f'PLCOm2012 ref example: {p*100:.4f}% (R-pkg/test ref 1.7509%)')
