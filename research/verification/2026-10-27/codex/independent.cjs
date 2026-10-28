// Written from primary PDFs BEFORE inspecting app predictive/eligibility source.
const logistic=x=>1/(1+Math.exp(-x));
function mayo({age,smoker,cancer,diameter,spiculation,upper}) {return logistic(-6.8272+.0391*age+.7917*smoker+1.3388*cancer+.1274*diameter+1.0407*spiculation+.7838*upper)}
function brock({age,female,family,emphysema,diameter,type,upper,count,spiculation}) {
 const t=Math.pow(diameter/10,-.5)-1.58113883;
 if(spiculation===undefined)return logistic(-6.8071+.0321*(age-62)+.5635*female+.3013*family+.3462*emphysema-5.6693*t+({solid:0,ground_glass:-.3005,part_solid:.3395}[type])+.7116*upper-.0803*(count-4));
 return logistic(-6.7892+.0287*(age-62)+.6011*female+.2961*family+.2953*emphysema-5.3854*t+({solid:0,ground_glass:-.1276,part_solid:.3770}[type])+.6581*upper-.0824*(count-4)+.7729*spiculation)
}
// Herder prose calls input 'percentage'; Figure 3 axis 0..1 resolves it as fraction.
const herder=(p,fdg)=>logistic(-4.739+3.691*p+({absent:0,faint:2.322,moderate:4.617,intense:4.771}[fdg]));
function plco({age,race,education,bmi,copd,cancer,family,current,cigarettes,duration,quit}) {return logistic(-4.532506+.0778868*(age-62)+({white:0,black:.3944778,hispanic:-.7434744,asian:-.466585,native:0,pacific:1.027152}[race])-.0812744*(education-4)-.0274194*(bmi-27)+.3553063*copd+.4589971*cancer+.587185*family+.2597431*current-1.822606*(10/cigarettes-.4021541613)+.0317321*(duration-27)-.0308572*(quit-10))}
module.exports={mayo,brock,herder,plco};
