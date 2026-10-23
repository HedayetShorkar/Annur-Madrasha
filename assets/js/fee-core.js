/* Estimate only: client-calculated amounts never authorize a payment. */
(function(root){
 function prorate(monthlyMinor,iso){
  if(!Number.isSafeInteger(monthlyMinor)||monthlyMinor<0||monthlyMinor>100000000||!/^\d{4}-\d{2}-\d{2}$/.test(iso))throw Error('Invalid fee or date');
  const [y,m,d]=iso.split('-').map(Number),total=new Date(Date.UTC(y,m,0)).getUTCDate();
  if(y<2000||y>9999||m<1||m>12||d<1||d>total)throw Error('Invalid date');
  const remaining=total-d+1;
  return {total,remaining,amountMinor:d<=7?monthlyMinor:Math.round(monthlyMinor*remaining/total)};
 }
 root.admissionProrate=prorate;
 if(typeof module!=='undefined')module.exports=prorate;
})(globalThis);
