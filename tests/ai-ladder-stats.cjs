"use strict";
// Targets are independent empirical requirements, not a probability multiplication theorem.
function target(gap){if(!Number.isInteger(gap)||gap<1||gap>9)throw Error('Gap must be 1..9');return 10**(-gap);}
function requiredZeroWins(gap,alpha=.05){return Math.ceil(Math.log(alpha)/Math.log1p(-target(gap)));}
// Exact one-sided Clopper-Pearson upper confidence bound, calculated in log space.
function upperBound(wins,n,alpha=.05){
 if(!Number.isInteger(n)||!Number.isInteger(wins)||wins<0||wins>n)throw Error('Invalid sample counts');
 if(!n||wins===n)return 1;if(!wins)return -Math.expm1(Math.log(alpha)/n);
 const cdf=p=>{let term=n*Math.log1p(-p),sum=term;for(let k=1;k<=wins;k++){term+=Math.log(n-k+1)-Math.log(k)+Math.log(p)-Math.log1p(-p);const m=Math.max(sum,term);sum=m+Math.log(Math.exp(sum-m)+Math.exp(term-m));}return Math.exp(sum);};
 let lo=wins/n,hi=1;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(cdf(mid)>alpha)lo=mid;else hi=mid;}return (lo+hi)/2;
}
function batchRange(wins,n,unresolved=0){
 if(!n)return 'untested';if(unresolved)return 'unresolved';if(n<20)return 'screening-only';
 const rate=wins/n;return rate<.05?'lower-tier-too-weak':rate>.10?'lower-tier-too-strong':'within-5-to-10-percent';
}
function summarize(cases,gap){const n=cases.length,lower=cases.filter(c=>c.winner==='lower').length,higher=cases.filter(c=>c.winner==='higher').length,unresolved=n-lower-higher,p=target(gap),upper95=upperBound(lower,n),conservativeUpper95=upperBound(lower+unresolved,n);return{matches:n,higherWins:higher,lowerWins:lower,unresolved,lowerWinRate:n?lower/n:null,target:p,minimum:gap===1?.05:null,batchStatus:gap===1?batchRange(lower,n,unresolved):'upper-limit-only',upper95,conservativeUpper95,upperLimitEvidence:!n?'untested':conservativeUpper95<=p?'supported-in-this-sample':lower/n>p?'target-missed':'insufficient-evidence',zeroLowerWinsSampleNeeded:requiredZeroWins(gap)};}
module.exports={batchRange,target,requiredZeroWins,upperBound,summarize};
