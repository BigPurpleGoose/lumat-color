import{d as B,c as O,L as $,W as A}from"./index-CKSA48z1.js";import{c as R}from"./vendor-color-D1ETm4ty.js";function j(o){const n=[];for(let t=0;t<o.length;t++)for(let c=0;c<o.length;c++){if(t===c)continue;const r=o[t],a=o[c],i={mode:"oklch",l:r.L,c:r.C,h:r.H},u={mode:"oklch",l:a.L,c:a.C,h:a.H},g=B(i,u),s=O(i,u);let e="Fail";s>=A.AAA_NORMAL?e="AAA":s>=A.AA_NORMAL?e="AA":s>=A.AA_LARGE&&(e="A"),n.push({foreground:r.hex,background:a.hex,fgStep:$[t],bgStep:$[c],apca:Math.abs(g),wcag:s,apcaPasses:Math.abs(g)>=60,wcagLevel:e})}return n}function D(o,n){return!n.minAPCA&&!n.maxAPCA&&!n.minWCAG&&!n.maxWCAG?o:o.filter(t=>{if(n.useAPCA){const c=n.minAPCA===void 0||t.apca>=n.minAPCA,r=n.maxAPCA===void 0||t.apca<=n.maxAPCA;return c&&r}else{const c=n.minWCAG===void 0||t.wcag>=n.minWCAG,r=n.maxWCAG===void 0||t.wcag<=n.maxWCAG;return c&&r}})}function N(o,n){return o.map((t,c)=>{const r=$[c],a=[],i=[],u=[],g=t.targetBackground||n.targetBackground||"black",s=g==="white"?t.contrast?.apca.onWhite:g==="gray"?t.contrast?.apca.onGray:t.contrast?.apca.onBlack,e=g==="white"?t.contrast?.wcag.onWhite:g==="gray"?t.contrast?.wcag.onGray:t.contrast?.wcag.onBlack;return r>=90?(a.push("Excellent for backgrounds and subtle UI elements"),a.push("Use for card backgrounds, hover states"),(g==="white"||g==="gray")&&i.push(`Low contrast with ${g} backgrounds`)):r>=70?(a.push("Good for disabled states and borders"),a.push("Suitable for secondary UI elements"),e&&e>=A.AA_LARGE&&a.push(`Meets WCAG ${e>=A.AA_NORMAL?"AA":"A"} for large text on ${g}`)):r>=40?(a.push("Ideal for interactive elements and icons"),a.push("Works well for primary buttons and links"),e&&e>=A.AA_NORMAL&&a.push(`AA compliant for text on ${g} (${e.toFixed(1)}:1)`),s&&Math.abs(s)>=60&&a.push(`APCA Lc ${Math.abs(s).toFixed(0)} - suitable for body text`)):r>=20?(a.push("Strong contrast for primary text"),a.push("Excellent for headings and emphasis"),e&&e>=A.AAA_NORMAL&&a.push(`AAA compliant for body text on ${g} (${e.toFixed(1)}:1)`),s&&Math.abs(s)>=75&&a.push(`APCA Lc ${Math.abs(s).toFixed(0)} - excellent readability`)):(a.push("Maximum contrast for critical elements"),a.push("Use sparingly for high emphasis"),i.push("May be too harsh for large text blocks"),e&&e>=A.AAA_NORMAL&&a.push(`Exceeds AAA standards (${e.toFixed(1)}:1)`)),o.forEach((m,l)=>{if(c===l)return;Math.abs(r-$[l])>=60&&u.push($[l])}),{step:r,color:t.hex,recommendations:a,warnings:i,bestPairings:u.sort((m,l)=>l-m).slice(0,5)}})}function U(o,n,t,c){const r=n.map((e,m)=>{const l=$[m],d=Math.round(e.L*100),h=l>50?"#000":"#fff";return`
      <div class="swatch-compact" style="background-color: ${e.hex}; color: ${h};">
        <div class="swatch-step">${l}</div>
        <div class="swatch-hex">${e.hex}</div>
        <div class="swatch-values">L${d} C${e.C.toFixed(2)} H${Math.round(e.H)}°</div>
      </div>
    `}).join(""),i=[t[0],t[Math.floor(t.length/2)],t[t.length-1]].filter(Boolean).map(e=>`
    <div class="guideline-compact">
      <div class="guideline-swatch" style="background-color: ${e.color};"></div>
      <div class="guideline-info">
        <strong>${o.name} ${e.step}</strong>
        <div class="guideline-uses">${e.recommendations.slice(0,2).join(", ")}</div>
        <div class="guideline-pairs">Pairs: ${e.bestPairings.slice(0,3).join(", ")}</div>
      </div>
    </div>
  `).join(""),u=[{label:"WCAG 3:1",type:"wcag",value:3,badge:"A"},{label:"WCAG 4.5:1",type:"wcag",value:4.5,badge:"AA"},{label:"APCA 45 Lc",type:"apca",value:45,badge:"45"},{label:"APCA 70 Lc",type:"apca",value:70,badge:"70"},{label:"APCA 90 Lc",type:"apca",value:90,badge:"90"}],g=e=>{const m=c.filter(d=>e.type==="wcag"?d.wcag>=e.value:d.apca>=e.value);return(e.type==="wcag"?m.sort((d,h)=>d.wcag-h.wcag):m.sort((d,h)=>d.apca-h.apca)).slice(0,5)},s=u.map(e=>{const m=g(e);return m.length===0?"":`
      <div class="threshold-section">
        <h3>${e.label}</h3>
        <table class="contrast-table">
          <thead>
            <tr>
              <th>FG</th>
              <th>BG</th>
              <th>APCA</th>
              <th>WCAG</th>
              <th>Sample</th>
            </tr>
          </thead>
          <tbody>
            ${m.map(l=>`
              <tr>
                <td>${l.fgStep}</td>
                <td>${l.bgStep}</td>
                <td>${l.apca.toFixed(0)}</td>
                <td>${l.wcag.toFixed(1)}</td>
                <td>
                  <div class="preview" style="background-color: ${l.background}; color: ${l.foreground};">
                    Aa
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `}).join("");return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${o.name} Color Scale Documentation - Luma</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      line-height: 1.6;
      color: #f4f4f5;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 2rem;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: #18181b;
      padding: 3rem;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
      border: 1px solid #27272a;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: #fafafa;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .subtitle {
      font-size: 1.125rem;
      color: #a1a1aa;
      margin-bottom: 3rem;
      font-weight: 400;
    }

    h2 {
      font-size: 1.875rem;
      margin: 3rem 0 1.5rem;
      color: #fafafa;
      border-bottom: 1px solid #3f3f46;
      padding-bottom: 0.75rem;
      font-weight: 600;
      letter-spacing: -0.025em;
    }

    .scale-info {
      background: #27272a;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      border: 1px solid #3f3f46;
    }

    .scale-info dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5rem 2rem;
    }

    .scale-info dt {
      font-weight: 600;
      color: #d4d4d8;
    }

    .scale-info dd {
      color: #a1a1aa;
      font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
    }

    .swatches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }

    .swatch-item {
      padding: 1.5rem;
      border-radius: 12px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .swatch-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .swatch-label {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .swatch-step {
      font-size: 1.5rem;
    }

    .swatch-hex {
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .swatch-details {
      margin-top: 0.75rem;
      font-size: 0.75rem;
      opacity: 0.8;
      font-family: 'Monaco', 'Courier New', monospace;
    }

    .detail-row {
      margin: 0.25rem 0;
    }

    .guidelines-grid {
      display: grid;
      gap: 1.5rem;
      margin: 2rem 0;
    }

    .guideline-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .guideline-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .guideline-swatch {
      width: 3rem;
      height: 3rem;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .guideline-header h3 {
      font-size: 1.25rem;
      color: #111827;
    }

    .guideline-content {
      padding: 1.5rem;
    }

    .guideline-content h4 {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      margin-bottom: 0.75rem;
    }

    .guideline-content ul {
      list-style: none;
      margin-bottom: 1.5rem;
    }

    .guideline-content li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
    }

    .recommendations li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }

    .warnings li::before {
      content: "!";
      position: absolute;
      left: 0.5rem;
      color: #f59e0b;
      font-weight: bold;
    }

    .warnings {
      background: #fef3c7;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1.5rem;
    }

    .pairings p {
      color: #6b7280;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
    }

    .threshold-section {
      margin-bottom: 0.15in;
      page-break-inside: avoid;
    }

    .threshold-section h3 {
      font-size: 8pt;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.04in;
      padding: 0.02in 0.04in;
      background: #f9fafb;
      border-left: 3px solid #3b82f6;
      border-radius: 2px;
    }

    .contrast-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 6pt;
      margin-bottom: 0.08in;
    }

    .contrast-table th {
      background: #f3f4f6;
      padding: 0.03in 0.04in;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #d1d5db;
      font-size: 6pt;
    }

    .contrast-table td {
      padding: 0.025in 0.04in;
      border-bottom: 1px solid #f3f4f6;
    }

    .level-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
    }

    .level-aaa {
      background: #d1fae5;
      color: #065f46;
    }

    .level-aa {
      background: #dbeafe;
      color: #1e40af;
    }

    .level-a {
      background: #fef3c7;
      color: #92400e;
    }

    .level-fail {
      background: #fee2e2;
      color: #991b1b;
    }

    .preview {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 600;
      text-align: center;
      font-size: 1.125rem;
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
        padding: 1rem;
      }

      .swatch-item:hover {
        transform: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${o.name} Color Scale</h1>
      <p class="subtitle">Generated by Luma - P3 OKLCH Color Scale Generator | ${new Date().toLocaleDateString()}</p>
    </header>

    <div class="scale-info">
      <dl>
        <dt>Base Hue:</dt>
        <dd>${o.hue}°</dd>
        <dt>Base Chroma:</dt>
        <dd>${o.manualChroma.toFixed(4)}</dd>
        <dt>Hue Curve:</dt>
        <dd>Shift ${o.hueCurve.shift}° / Pow ${o.hueCurve.power}</dd>
        <dt>Chroma Curve:</dt>
        <dd>Shift ${o.chromaCurve.shift} / Pow ${o.chromaCurve.power}</dd>
        <dt>Contrast:</dt>
        <dd>${o.contrastMode||"standard"}</dd>
        <dt>Steps:</dt>
        <dd>${n.length}</dd>
      </dl>
    </div>

    <h2>Color Swatches</h2>
    <div class="swatches-grid">
      ${r}
    </div>

    <div class="content-grid">
      <div class="guidelines-section">
        <h2>Key Usage Guidelines</h2>
        ${i}
      </div>

      <div class="contrast-section">
        <h2>Top Accessible Pairs</h2>
        ${s}
      </div>
    </div>
  </div>
</body>
</html>`}function V(o,n,t=[100,90,80,70,60,50,40,30,20,15,12,10,7,5,3,0]){const c=o.targetBackground||"white",r=c==="black",a=c==="gray",i=b=>{const p=$.indexOf(b);return p!==-1?n[p].hex:"#000000"},u=i(r?14:a?85:98),g=i(r?93:a?32:40),s=i(r?96:a?26:32),e=i(r?17:a?90:96),m=R("rgb"),l=(b,p)=>{const x=m({mode:"oklch",l:b.L,c:b.C,h:b.H});if(!x)return u;const C=Math.max(0,Math.min(255,Math.round((x.r||0)*255))),G=Math.max(0,Math.min(255,Math.round((x.g||0)*255))),P=Math.max(0,Math.min(255,Math.round((x.b||0)*255)));return`rgba(${C}, ${G}, ${P}, ${p/100})`},d=48,h=50,v=40,y=80,z=8,w=4,f=20,S=t.length*(d+w)-w,M=n.length*(d+w)-w,k=S+h+f*2,L=M+v+y+f*2,H=n.map((b,p)=>t.map((x,C)=>{const G=f+h+C*(d+w),P=y+v+p*(d+w),T=l(b,x);return`<rect x="${G}" y="${P}" width="${d}" height="${d}" fill="${T}" stroke="${e}" stroke-width="2" rx="${z}"/>`}).join(`
`)).join(`
`),W=n.map((b,p)=>{const x=$[p],C=y+v+p*(d+w)+d/2;return`<text x="${f+h-10}" y="${C}" text-anchor="end" dominant-baseline="middle" font-size="12" fill="${s}" font-family="-apple-system, system-ui, sans-serif" font-weight="500">L${x}</text>`}).join(`
`),F=t.map((b,p)=>`<text x="${f+h+p*(d+w)+d/2}" y="${y+v-15}" text-anchor="middle" font-size="11" fill="${s}" font-family="-apple-system, system-ui, sans-serif" font-weight="400">${b}%</text>`).join(`
`);return`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${k}" height="${L}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${k}" height="${L}" fill="${u}" rx="12"/>

  <!-- Header -->
  <text x="${f}" y="35" font-size="22" font-weight="600" fill="${g}" font-family="-apple-system, system-ui, sans-serif">${o.name}</text>
  <text x="${f}" y="55" font-size="13" fill="${s}" font-family="-apple-system, system-ui, sans-serif">Hue: ${o.hue}° | Chroma: ${o.manualChroma.toFixed(4)}</text>

  <!-- Axis Labels -->
  <text x="${f+h+S/2}" y="${y-10}" text-anchor="middle" font-size="11" font-weight="600" fill="${s}" font-family="-apple-system, system-ui, sans-serif" letter-spacing="1.5">OPACITY STEPS →</text>

  <text x="${f+5}" y="${y+v+M/2}" text-anchor="middle" font-size="11" font-weight="600" fill="${s}" font-family="-apple-system, system-ui, sans-serif" letter-spacing="1.5" transform="rotate(-90, ${f+5}, ${y+v+M/2})">SOURCE L ↑</text>

  <!-- Column headers -->
  ${F}

  <!-- Row labels -->
  ${W}

  <!-- Grid cells -->
  ${H}

  <!-- Footer -->
  <text x="${k-f}" y="${L-15}" text-anchor="end" font-size="10" fill="${s}" font-family="-apple-system, system-ui, sans-serif" opacity="0.6">Generated by Luma | ${new Date().toLocaleDateString()}</text>
</svg>`}export{V as a,N as b,U as c,D as f,j as g};
