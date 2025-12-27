import{L,d as O,c as R,W as v}from"./index-D-wgux2d.js";import{c as D}from"./vendor-color-D1ETm4ty.js";function j(o,t=L){const r=[];for(let n=0;n<o.length;n++)for(let m=0;m<o.length;m++){if(n===m)continue;const l=o[n],a=o[m],i={mode:"oklch",l:l.L,c:l.C,h:l.H},w={mode:"oklch",l:a.L,c:a.C,h:a.H},f=O(i,w),s=R(i,w);let e="Fail";s>=v.AAA_NORMAL?e="AAA":s>=v.AA_NORMAL?e="AA":s>=v.AA_LARGE&&(e="A"),r.push({foreground:l.hex,background:a.hex,fgStep:t[n],bgStep:t[m],apca:Math.abs(f),wcag:s,apcaPasses:Math.abs(f)>=60,wcagLevel:e})}return r}function N(o,t){return!t.minAPCA&&!t.maxAPCA&&!t.minWCAG&&!t.maxWCAG?o:o.filter(r=>{if(t.useAPCA){const n=t.minAPCA===void 0||r.apca>=t.minAPCA,m=t.maxAPCA===void 0||r.apca<=t.maxAPCA;return n&&m}else{const n=t.minWCAG===void 0||r.wcag>=t.minWCAG,m=t.maxWCAG===void 0||r.wcag<=t.maxWCAG;return n&&m}})}function U(o,t,r=L){return o.map((n,m)=>{const l=r[m],a=[],i=[],w=[],f=n.targetBackground||t.targetBackground||"black",s=f==="white"?n.contrast?.apca.onWhite:f==="gray"?n.contrast?.apca.onGray:n.contrast?.apca.onBlack,e=f==="white"?n.contrast?.wcag.onWhite:f==="gray"?n.contrast?.wcag.onGray:n.contrast?.wcag.onBlack;return l>=90?(a.push("Excellent for backgrounds and subtle UI elements"),a.push("Use for card backgrounds, hover states"),(f==="white"||f==="gray")&&i.push(`Low contrast with ${f} backgrounds`)):l>=70?(a.push("Good for disabled states and borders"),a.push("Suitable for secondary UI elements"),e&&e>=v.AA_LARGE&&a.push(`Meets WCAG ${e>=v.AA_NORMAL?"AA":"A"} for large text on ${f}`)):l>=40?(a.push("Ideal for interactive elements and icons"),a.push("Works well for primary buttons and links"),e&&e>=v.AA_NORMAL&&a.push(`AA compliant for text on ${f} (${e.toFixed(1)}:1)`),s&&Math.abs(s)>=60&&a.push(`APCA Lc ${Math.abs(s).toFixed(0)} - suitable for body text`)):l>=20?(a.push("Strong contrast for primary text"),a.push("Excellent for headings and emphasis"),e&&e>=v.AAA_NORMAL&&a.push(`AAA compliant for body text on ${f} (${e.toFixed(1)}:1)`),s&&Math.abs(s)>=75&&a.push(`APCA Lc ${Math.abs(s).toFixed(0)} - excellent readability`)):(a.push("Maximum contrast for critical elements"),a.push("Use sparingly for high emphasis"),i.push("May be too harsh for large text blocks"),e&&e>=v.AAA_NORMAL&&a.push(`Exceeds AAA standards (${e.toFixed(1)}:1)`)),o.forEach((g,c)=>{if(m===c)return;Math.abs(l-r[c])>=60&&w.push(r[c])}),{step:l,color:n.hex,recommendations:a,warnings:i,bestPairings:w.sort((g,c)=>c-g).slice(0,5)}})}function I(o,t,r,n,m=L){const l=t.map((e,g)=>{const c=m[g],d=Math.round(e.L*100),u=c>50?"#000":"#fff";return`
      <div class="swatch-compact" style="background-color: ${e.hex}; color: ${u};">
        <div class="swatch-step">${c}</div>
        <div class="swatch-hex">${e.hex}</div>
        <div class="swatch-values">L${d} C${e.C.toFixed(2)} H${Math.round(e.H)}°</div>
      </div>
    `}).join(""),i=[r[0],r[Math.floor(r.length/2)],r[r.length-1]].filter(Boolean).map(e=>`
    <div class="guideline-compact">
      <div class="guideline-swatch" style="background-color: ${e.color};"></div>
      <div class="guideline-info">
        <strong>${o.name} ${e.step}</strong>
        <div class="guideline-uses">${e.recommendations.slice(0,2).join(", ")}</div>
        <div class="guideline-pairs">Pairs: ${e.bestPairings.slice(0,3).join(", ")}</div>
      </div>
    </div>
  `).join(""),w=[{label:"WCAG 3:1",type:"wcag",value:3,badge:"A"},{label:"WCAG 4.5:1",type:"wcag",value:4.5,badge:"AA"},{label:"APCA 45 Lc",type:"apca",value:45,badge:"45"},{label:"APCA 70 Lc",type:"apca",value:70,badge:"70"},{label:"APCA 90 Lc",type:"apca",value:90,badge:"90"}],f=e=>{const g=n.filter(d=>e.type==="wcag"?d.wcag>=e.value:d.apca>=e.value);return(e.type==="wcag"?g.sort((d,u)=>d.wcag-u.wcag):g.sort((d,u)=>d.apca-u.apca)).slice(0,5)},s=w.map(e=>{const g=f(e);return g.length===0?"":`
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
            ${g.map(c=>`
              <tr>
                <td>${c.fgStep}</td>
                <td>${c.bgStep}</td>
                <td>${c.apca.toFixed(0)}</td>
                <td>${c.wcag.toFixed(1)}</td>
                <td>
                  <div class="preview" style="background-color: ${c.background}; color: ${c.foreground};">
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
        <dd>${t.length}</dd>
      </dl>
    </div>

    <h2>Color Swatches</h2>
    <div class="swatches-grid">
      ${l}
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
</html>`}function V(o,t,r=[100,90,80,70,60,50,40,30,20,15,12,10,7,5,3,0],n=L){const m=o.targetBackground||"white",l=m==="black",a=m==="gray",i=h=>{if(t.length===0)return"#000000";const b=n.indexOf(h);if(b!==-1&&t[b])return t[b].hex;let p=0,$=Math.abs(n[0]-h);for(let y=1;y<n.length;y++){const k=Math.abs(n[y]-h);k<$&&($=k,p=y)}return t[p]?.hex||t[0]?.hex||"#000000"},w=i(l?14:a?85:98),f=i(l?93:a?32:40),s=i(l?96:a?26:32),e=i(l?17:a?90:96),g=D("rgb"),c=(h,b)=>{const p=g({mode:"oklch",l:h.L,c:h.C,h:h.H});if(!p)return w;const $=Math.max(0,Math.min(255,Math.round((p.r||0)*255))),y=Math.max(0,Math.min(255,Math.round((p.g||0)*255))),k=Math.max(0,Math.min(255,Math.round((p.b||0)*255)));return`rgba(${$}, ${y}, ${k}, ${b/100})`},d=48,u=50,M=40,C=80,S=8,A=4,x=20,H=r.length*(d+A)-A,G=t.length*(d+A)-A,P=H+u+x*2,z=G+M+C+x*2,W=t.map((h,b)=>r.map((p,$)=>{const y=x+u+$*(d+A),k=C+M+b*(d+A),B=c(h,p);return`<rect x="${y}" y="${k}" width="${d}" height="${d}" fill="${B}" stroke="${e}" stroke-width="2" rx="${S}"/>`}).join(`
`)).join(`
`),F=t.map((h,b)=>{const p=n[b],$=C+M+b*(d+A)+d/2;return`<text x="${x+u-10}" y="${$}" text-anchor="end" dominant-baseline="middle" font-size="12" fill="${s}" font-family="-apple-system, system-ui, sans-serif" font-weight="500">L${p}</text>`}).join(`
`),T=r.map((h,b)=>`<text x="${x+u+b*(d+A)+d/2}" y="${C+M-15}" text-anchor="middle" font-size="11" fill="${s}" font-family="-apple-system, system-ui, sans-serif" font-weight="400">${h}%</text>`).join(`
`);return`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${P}" height="${z}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${P}" height="${z}" fill="${w}" rx="12"/>

  <!-- Header -->
  <text x="${x}" y="35" font-size="22" font-weight="600" fill="${f}" font-family="-apple-system, system-ui, sans-serif">${o.name}</text>
  <text x="${x}" y="55" font-size="13" fill="${s}" font-family="-apple-system, system-ui, sans-serif">Hue: ${o.hue}° | Chroma: ${o.manualChroma.toFixed(4)}</text>

  <!-- Axis Labels -->
  <text x="${x+u+H/2}" y="${C-10}" text-anchor="middle" font-size="11" font-weight="600" fill="${s}" font-family="-apple-system, system-ui, sans-serif" letter-spacing="1.5">OPACITY STEPS →</text>

  <text x="${x+5}" y="${C+M+G/2}" text-anchor="middle" font-size="11" font-weight="600" fill="${s}" font-family="-apple-system, system-ui, sans-serif" letter-spacing="1.5" transform="rotate(-90, ${x+5}, ${C+M+G/2})">SOURCE L ↑</text>

  <!-- Column headers -->
  ${T}

  <!-- Row labels -->
  ${F}

  <!-- Grid cells -->
  ${W}

  <!-- Footer -->
  <text x="${P-x}" y="${z-15}" text-anchor="end" font-size="10" fill="${s}" font-family="-apple-system, system-ui, sans-serif" opacity="0.6">Generated by Luma | ${new Date().toLocaleDateString()}</text>
</svg>`}export{V as a,U as b,I as c,N as f,j as g};
