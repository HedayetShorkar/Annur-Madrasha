import React from 'react';
export default function Icon({kind}:{kind:'receipt'|'print'|'arrow'|'shield'|'moon'|'sun'|'download'|'edit'}){
 const paths={download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',edit:'m15 4 5 5-11 11H4v-5L15 4Zm-3 3 5 5',receipt:'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6',print:'M6 9V3h12v6M6 18H3V9h18v9h-3M6 15h12v6H6v-6Z',arrow:'m14 5-7 7 7 7M7 12h14',shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',moon:'M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z',sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'};
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
}
