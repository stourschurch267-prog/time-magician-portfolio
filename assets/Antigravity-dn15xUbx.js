import{r as V,b as _t,c as Lt,j as ut,a as Bt}from"./index-Dhy2wWBR.js";const Le=31.5,Q=256,ft=["#5227FF","#FF9FFC","#B497CF"],dt={capsule:0,sphere:1,box:2,tetrahedron:3},ht={conic:0,radial:1,random:2},Ut=`#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aParticle;
layout(location = 2) in vec4 aSeed;
uniform vec2 uSize;
uniform float uPixel;
uniform vec2 uCursor;
uniform float uRing;
uniform float uBand;
uniform float uParticle;
uniform float uAmbient;
uniform float uTime;
uniform float uPulse;
uniform float uVariance;
uniform float uDepth;
uniform float uShape;
uniform float uColorMode;
uniform float uStops;
uniform float uHue;
uniform float uReveal;
uniform float uStreak;
uniform float uCharge;
out vec2 vLocal;
out vec2 vBounds;
out float vU;
out float vAlpha;
out float vSoft;

void main() {
  vec2 rel = aParticle.xy - uCursor;
  float dist = length(rel);
  vec2 radial = dist > 1e-3 ? rel / dist : vec2(1.0, 0.0);
  vec2 dir = radial;
  float speed = length(aParticle.zw);
  float streak = clamp(speed / uStreak, 0.0, 2.5);
  if (speed > 1e-3) {
    vec2 heading = aParticle.zw / speed * sign(dot(aParticle.zw, radial) + 1e-4);
    dir = normalize(mix(radial, heading, smoothstep(0.0, 1.0, streak)));
  }
  float ring = exp(-pow((dist - uRing) / uBand, 2.0));
  float z = aSeed.x;
  float depth = 1.0 + z * 0.32 * uDepth;
  float pulse = 1.0 + sin(uTime * uPulse + aSeed.y) * 0.22 * uVariance;
  float grow = uAmbient + (1.0 - uAmbient) * ring;
  float size = uParticle * depth * pulse * (0.85 + 0.3 * aSeed.w) * (1.0 + uCharge * 0.25 * ring);
  vec2 bounds;
  if (uShape < 0.5) {
    float width = size * 0.17 * mix(0.55, 1.0, ring);
    bounds = vec2(max(width, size * 0.5 * grow) * (1.0 + streak * 1.2), width);
  } else if (uShape < 1.5) {
    bounds = vec2(size * 0.22 * mix(0.45, 1.0, grow));
  } else {
    bounds = vec2(size * 0.26 * mix(0.45, 1.0, grow));
  }
  float soft = 1.0 + max(-z, 0.0) * 1.6 * uDepth;
  vec2 local = aCorner * (bounds + soft * 1.5 / uPixel);
  vec2 world = aParticle.xy + dir * local.x + vec2(-dir.y, dir.x) * local.y;
  gl_Position = vec4(world.x / uSize.x * 2.0 - 1.0, 1.0 - world.y / uSize.y * 2.0, 0.0, 1.0);
  vLocal = local * uPixel;
  vBounds = bounds * uPixel;
  vSoft = soft;
  if (uColorMode < 0.5) {
    vU = atan(radial.y, radial.x) / 6.28318530718 + uHue + (aSeed.z - 0.5) * 0.06;
  } else if (uColorMode < 1.5) {
    vU = clamp(dist / (uRing * 2.4), 0.0, 1.0) + (aSeed.z - 0.5) * 0.06;
  } else {
    vU = floor(aSeed.z * uStops) / max(uStops - 1.0, 1.0);
  }
  float fog = 1.0 - max(-z, 0.0) * 0.35 * uDepth;
  vAlpha = mix(uAmbient, 1.0, ring) * fog * uReveal;
}`,Ct=`#version 300 es
precision highp float;
uniform sampler2D uPalette;
uniform float uShape;
uniform float uColorMode;
uniform float uOpacity;
in vec2 vLocal;
in vec2 vBounds;
in float vU;
in float vAlpha;
in float vSoft;
out vec4 fragColor;

void main() {
  vec2 p = vLocal;
  float d;
  if (uShape < 0.5) {
    float r = vBounds.y;
    d = length(vec2(max(abs(p.x) - max(vBounds.x - r, 0.0), 0.0), p.y)) - r;
  } else if (uShape < 1.5) {
    d = length(p) - vBounds.x;
  } else if (uShape < 2.5) {
    float r = vBounds.x * 0.28;
    vec2 q = abs(p) - (vBounds - r);
    d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  } else {
    float r = vBounds.x * 1.15;
    vec2 q = vec2(r * 0.5774 - p.x, abs(p.y));
    d = max(dot(q, vec2(0.5, 0.8660254)) - r * 0.5, -q.x - r * 0.5) * 1.2;
  }
  float alpha = clamp(0.5 - d / vSoft, 0.0, 1.0) * vAlpha * uOpacity;
  if (alpha < 0.002) discard;
  vec3 color = texture(uPalette, vec2(uColorMode < 0.5 ? fract(vU) : vU, uColorMode < 0.5 ? 0.25 : 0.75)).rgb;
  fragColor = vec4(color * alpha, alpha);
}`,P=(n,c,s)=>Math.min(s,Math.max(c,n)),Dt=n=>{const c=String(n||"").trim(),s=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);if(s){const g=s[1].length===3?s[1].replace(/./g,h=>h+h):s[1];return[0,2,4].map(h=>parseInt(g.slice(h,h+2),16)/255)}const a=/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(c);return a?[a[1],a[2],a[3]].map(g=>P(parseFloat(g)/255,0,1)):null},It=n=>n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4),zt=n=>n<=.0031308?n*12.92:1.055*Math.pow(Math.max(n,0),1/2.4)-.055,mt=n=>{const[c,s,a]=n.map(It),g=Math.cbrt(.4122214708*c+.5363325363*s+.0514459929*a),h=Math.cbrt(.2119034982*c+.6806995451*s+.1073969566*a),y=Math.cbrt(.0883024619*c+.2817188376*s+.6299787005*a);return[.2104542553*g+.793617785*h-.0040720468*y,1.9779984951*g-2.428592205*h+.4505937099*y,.0259040371*g+.7827717662*h-.808675766*y]},Ot=([n,c,s])=>{const a=Math.pow(n+.3963377774*c+.2158037573*s,3),g=Math.pow(n-.1055613458*c-.0638541728*s,3),h=Math.pow(n-.0894841775*c-1.291485548*s,3);return[4.0767416621*a-3.3077115913*g+.2309699292*h,-1.2684380046*a+2.6097574011*g-.3413193965*h,-.0041960863*a-.7034186147*g+1.707614701*h].map(y=>P(zt(y),0,1))},Xt=(n,c)=>{const s=[];n.forEach(h=>{const y=Dt(h);if(!y)return;const x=mt(y),z=Math.atan2(x[2],x[1])*180/Math.PI,F=P(1-Math.abs(z-85)/40,0,1),B=.62+.14*F*F*(3-2*F);if(c&&x[0]>B){const _=1+(x[0]-B)*1.6;s.push([B,x[1]*_,x[2]*_])}else s.push(x)}),s.length||s.push(mt(c?[.1,.1,.12]:[1,1,1]));const a=new Uint8Array(Q*2*4);return[[...s,s[0]],s.length>1?s:[s[0],s[0]]].forEach((h,y)=>{for(let x=0;x<Q;x++){const z=x/(Q-(y===0?0:1))*(h.length-1),F=Math.min(Math.floor(z),h.length-2),B=z-F,_=B*B*(3-2*B),L=h[F],O=h[F+1],xe=Math.hypot(L[1],L[2])*(1-_)+Math.hypot(O[1],O[2])*_,te=L[1]+(O[1]-L[1])*_,ne=L[2]+(O[2]-L[2])*_,re=Math.hypot(te,ne),oe=re>1e-4?xe/re:0,ye=Ot([L[0]+(O[0]-L[0])*_,te*oe,ne*oe]);for(let q=0;q<3;q++)a[(y*Q+x)*4+q]=Math.round(ye[q]*255);a[(y*Q+x)*4+3]=255}}),a},Yt=n=>()=>{n|=0,n=n+1831565813|0;let c=Math.imul(n^n>>>15,1|n);return c=c+Math.imul(c^c>>>7,61|c)^c,((c^c>>>14)>>>0)/4294967296},pt=(n,c,s)=>{const a=n.createShader(c);return a?(n.shaderSource(a,s),n.compileShader(a),n.getShaderParameter(a,n.COMPILE_STATUS)?a:(console.error(n.getShaderInfoLog(a)),n.deleteShader(a),null)):null},kt=n=>{const c=pt(n,n.VERTEX_SHADER,Ut),s=pt(n,n.FRAGMENT_SHADER,Ct),a=c&&s?n.createProgram():null;if(!c||!s||!a)return c&&n.deleteShader(c),s&&n.deleteShader(s),null;if(n.attachShader(a,c),n.attachShader(a,s),n.linkProgram(a),n.deleteShader(c),n.deleteShader(s),!n.getProgramParameter(a,n.LINK_STATUS))return console.error(n.getProgramInfoLog(a)),n.deleteProgram(a),null;const g={},h=n.getProgramParameter(a,n.ACTIVE_UNIFORMS);for(let y=0;y<h;y++){const x=n.getActiveUniform(a,y);x&&(g[x.name]=n.getUniformLocation(a,x.name))}return{program:a,uniforms:g}},Vt=({count:n=1500,magnetRadius:c=9,ringRadius:s=7,waveSpeed:a=.4,waveAmplitude:g=1,waveCount:h=3,particleSize:y=.9,lerpSpeed:x=.05,color:z,colors:F=ft,colorMode:B="conic",colorSpeed:_=.05,autoAnimate:L=!0,particleVariance:O=1,rotationSpeed:xe=0,depthFactor:te=1,pulseSpeed:ne=3,particleShape:re="capsule",fieldStrength:oe=10,ambient:ye=.25,interactive:q=!0,clickBurst:vt=!0,intro:xt=!0,lightMode:Be=!1,opacity:yt=1,maxDevicePixelRatio:gt=2,className:Ue="",style:At})=>{const Ce=V.useRef(null),De=V.useRef(null),ge=V.useRef(null),[Ie,wt]=V.useState(0),ze=z?[z]:Array.isArray(F)&&F.length?F:ft,Oe={count:P(Math.round(n),1,2e4),magnet:Math.max(0,c),ring:Math.max(0,s),waveSpeed:a,waveAmplitude:Math.max(0,g),waveCount:Math.max(0,Math.round(h)),size:Math.max(0,y),follow:P(x,.001,1),palette:ze,paletteKey:`${ze.join(",")}|${Be}`,colorMode:ht[B]??ht.conic,colorSpeed:_,autoAnimate:L,variance:Math.max(0,O),rotation:xe,depth:Math.max(0,te),pulse:ne,shape:dt[re]??dt.capsule,tightness:Math.max(0,oe),ambient:P(ye,0,1),interactive:q,clickBurst:vt,intro:xt,light:Be,opacity:P(yt,0,1),maxRatio:P(gt,.5,3)},G=V.useRef(Oe);return G.current=Oe,V.useEffect(()=>{ge.current?.()}),V.useEffect(()=>{const Z=Ce.current,S=De.current,Xe=_t();if(!Z||!S)return;const e=S.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"high-performance"}),ae=e?kt(e):null;if(!e||!ae)return;const Ae=window.matchMedia("(prefers-reduced-motion: reduce)");let b=Ae.matches;const we=e.createVertexArray();e.bindVertexArray(we);const Ye=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,Ye),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);const ie=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,ie),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,4,e.FLOAT,!1,0,0),e.vertexAttribDivisor(1,1);const Ee=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,Ee),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,4,e.FLOAT,!1,0,0),e.vertexAttribDivisor(2,1);const se=e.createTexture();e.bindTexture(e.TEXTURE_2D,se),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const M={width:1,height:1,ratio:1},l={x:0,y:0,vx:0,vy:0,tx:0,ty:0,ready:!1},p={x:0,y:0,inside:!1,down:!1,moved:-1/0};let E=null,ke="",X=0,Ne=0,U=0,Y=G.current.intro&&!b&&Ie===0?0:1/0,T=0,D=0,k=!0,H=document.visibilityState!=="hidden",ce=!1;const Et=t=>{t.paletteKey!==ke&&(ke=t.paletteKey,e.bindTexture(e.TEXTURE_2D,se),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,Q,2,0,e.RGBA,e.UNSIGNED_BYTE,Xt(t.palette,t.light)))},bt=(t,r,i,m)=>{const v=Yt(1337),A=.06,u=r*(1+A*2),j=i*(1+A*2),C=Math.max(1,Math.ceil(Math.sqrt(t*u/j))),N=Math.max(1,Math.ceil(t/C)),w=Array.from({length:C*N},(o,R)=>R);for(let o=w.length-1;o>0;o--){const R=Math.floor(v()*(o+1));[w[o],w[R]]=[w[R],w[o]]}const I=Array.from({length:t},()=>v()*2-1).sort((o,R)=>o-R),d={total:t,width:r,height:i,homeX:new Float32Array(t),homeY:new Float32Array(t),band:new Float32Array(t),phase:new Float32Array(t),agility:new Float32Array(t),delay:new Float32Array(t),orbit:new Float32Array(t),x:new Float32Array(t),y:new Float32Array(t),vx:new Float32Array(t),vy:new Float32Array(t),particles:new Float32Array(t*4),seeds:new Float32Array(t*4)};for(let o=0;o<t;o++){const R=w[o],J=-r*A+(R%C+.5+(v()-.5)*.85)/C*u,ee=-i*A+(Math.floor(R/C)+.5+(v()-.5)*.85)/N*j;d.homeX[o]=J,d.homeY[o]=ee,d.band[o]=v()*2-1,d.phase[o]=v()*Math.PI*2,d.agility[o]=.75+v()*.5,d.delay[o]=v(),m&&o<m.total?(d.x[o]=m.x[o]/m.width*r,d.y[o]=m.y[o]/m.height*i,d.vx[o]=m.vx[o],d.vy[o]=m.vy[o],d.orbit[o]=m.orbit[o]):(d.x[o]=J,d.y[o]=Y===0?ee+i*(.45+d.delay[o]*.4):ee),d.seeds[o*4]=I[o],d.seeds[o*4+1]=d.phase[o],d.seeds[o*4+2]=v(),d.seeds[o*4+3]=v()}return e.bindBuffer(e.ARRAY_BUFFER,Ee),e.bufferData(e.ARRAY_BUFFER,d.seeds,e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,ie),e.bufferData(e.ARRAY_BUFFER,d.particles.byteLength,e.DYNAMIC_DRAW),d},be=()=>{const t=G.current,r=Z.getBoundingClientRect(),i=Math.max(1,r.width),m=Math.max(1,r.height),v=Bt(i,m,t.maxRatio,Xe),A=Math.max(1,Math.round(i*v)),u=Math.max(1,Math.round(m*v));(S.width!==A||S.height!==u)&&(S.width=A,S.height=u),M.width=i,M.height=m,M.ratio=A/i,l.ready||(l.x=l.tx=i/2,l.y=l.ty=m/2,l.ready=!0),(!E||E.total!==t.count||Math.abs(E.width-i)>.5||Math.abs(E.height-m)>.5)&&(E=bt(t.count,i,m,E))},Mt=(t,r)=>{if(!E)return;const i=M.height/Le,m=t.ring*i*(1-.38*U),v=Math.max(t.magnet*i,1),A=5/(t.tightness+.1)*i,u=t.waveAmplitude*i*.5,j=2.2+t.follow*80,C=(t.rotation+U*3)*(b?.3:1),N=M.width/2,w=M.height/2,I=v*.18,{homeX:d,homeY:o,band:R,phase:J,agility:ee,delay:St,orbit:Ze,x:Re,y:Se,vx:fe,vy:de,particles:he,seeds:Tt,total:Ft}=E;for(let f=0;f<Ft;f++){const Je=1-Tt[f*4]*.12*t.depth,et=N+(l.x-N)*Je,tt=w+(l.y-w)*Je,nt=d[f],rt=o[f]+Math.sin(X*.7+J[f])*i*.12*t.waveAmplitude,Te=nt-et,Fe=rt-tt,Pe=Math.sqrt(Te*Te+Fe*Fe),_e=1-P((Pe-(v-I))/(I*2),0,1),me=_e*_e*(3-2*_e);let K=Ze[f]+C*me*r;K-=Math.atan2(Math.sin(K),Math.cos(K))*(1-me)*Math.min(1,r*2.5),Ze[f]=K;let ot=nt,at=rt;if(me>0||Math.abs(K)>1e-4){const $=Math.atan2(Fe,Te)+K,Pt=u*(.6*Math.sin($*t.waveCount-X*t.waveSpeed*2)+.4*Math.sin(J[f]+X*t.waveSpeed*1.3)),lt=Pe+(m+Pt+R[f]*A-Pe)*me;ot=et+Math.cos($)*lt,at=tt+Math.sin($)*lt}const pe=Y<St[f]*.9?0:j*ee[f],it=1.64*pe,st=pe*pe,ct=Math.min(4,Math.max(1,Math.ceil(pe*r*2))),ve=r/ct;for(let $=0;$<ct;$++)fe[f]+=((ot-Re[f])*st-fe[f]*it)*ve,de[f]+=((at-Se[f])*st-de[f]*it)*ve,Re[f]+=fe[f]*ve,Se[f]+=de[f]*ve;he[f*4]=Re[f],he[f*4+1]=Se[f],he[f*4+2]=fe[f],he[f*4+3]=de[f]}},Rt=(t,r)=>{if(!E)return;const i=M.height/Le,m=Math.max(t.magnet,t.ring)*i*1.8,{x:v,y:A,vx:u,vy:j,agility:C,total:N}=E;for(let w=0;w<N;w++){const I=v[w]-l.x,d=A[w]-l.y,o=Math.sqrt(I*I+d*d)+.001,R=i*110*r*Math.exp(-Math.pow(o/m,2))*C[w];u[w]+=I/o*R,j[w]+=d/o*R}},Me=t=>{if(T=0,ce||!E||!k||!H)return;if(D&&t-D<Xe.frameInterval-1){T=requestAnimationFrame(Me);return}const r=G.current;Et(r);const i=b?0:P((t-D)/1e3||0,0,1/30);D=Math.max(D,t);const m=b?.3:1;X+=i*m,Ne+=i*r.colorSpeed*m,Y<3&&(Y+=i),U=p.down?Math.min(1,U+i/.9):Math.max(0,U-i*4);const v=performance.now()-p.moved>2e3||!p.inside;r.autoAnimate&&!b&&(v||!r.interactive)?(l.tx=M.width/2+Math.sin(X*.5)*(M.width/4),l.ty=M.height/2+Math.cos(X)*(M.height/4)):r.interactive&&p.inside&&!b&&(l.tx=p.x,l.ty=p.y),l.vx+=((l.tx-l.x)*49-l.vx*14)*i,l.vy+=((l.ty-l.y)*49-l.vy*14)*i,l.x+=l.vx*i,l.y+=l.vy*i,Mt(r,i);const A=M.height/Le;e.viewport(0,0,S.width,S.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),e.useProgram(ae.program),e.bindVertexArray(we),e.bindBuffer(e.ARRAY_BUFFER,ie),e.bufferSubData(e.ARRAY_BUFFER,0,E.particles);const u=ae.uniforms;e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,se),e.uniform1i(u.uPalette,0),e.uniform2f(u.uSize,M.width,M.height),e.uniform1f(u.uPixel,M.ratio),e.uniform2f(u.uCursor,l.x,l.y),e.uniform1f(u.uRing,r.ring*A*(1-.38*U)),e.uniform1f(u.uBand,Math.max(A*6,1)),e.uniform1f(u.uParticle,r.size*A*.6),e.uniform1f(u.uAmbient,r.ambient),e.uniform1f(u.uTime,X),e.uniform1f(u.uPulse,r.pulse),e.uniform1f(u.uVariance,r.variance),e.uniform1f(u.uDepth,r.depth),e.uniform1f(u.uShape,r.shape),e.uniform1f(u.uColorMode,r.colorMode),e.uniform1f(u.uStops,r.palette.length),e.uniform1f(u.uHue,Ne),e.uniform1f(u.uReveal,Y<3?P(Y/.6,0,1):1),e.uniform1f(u.uStreak,A*30),e.uniform1f(u.uCharge,U),e.uniform1f(u.uOpacity,r.opacity),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,E.total),k&&H&&!b&&(T=requestAnimationFrame(Me))},W=()=>{T||ce||!k||!H||(D=performance.now(),T=requestAnimationFrame(Me))};ge.current=()=>{be(),W()};const Ve=t=>{const r=Z.getBoundingClientRect();return{x:t.clientX-r.left,y:t.clientY-r.top,inside:t.clientX>=r.left&&t.clientX<=r.right&&t.clientY>=r.top&&t.clientY<=r.bottom}},qe=t=>{if(!k||!H||b||b)return;const r=Ve(t);p.inside=r.inside,r.inside&&(p.x=r.x,p.y=r.y,p.moved=performance.now())},Ge=t=>{if(!k||!H||b||b)return;const r=G.current,i=Ve(t);!i.inside||!r.interactive||(p.x=i.x,p.y=i.y,p.inside=!0,p.moved=performance.now(),r.clickBurst&&!b&&(p.down=!0))},le=t=>{p.down&&!b&&t.type!=="pointercancel"&&Rt(G.current,.45+U),p.down=!1,t.pointerType!=="mouse"&&(p.inside=!1)},ue=()=>{p.inside=!1,p.down=!1},He=t=>{b=t.matches,b&&(U=0,p.inside=p.down=!1,Y=1/0,l.vx=l.vy=0,E&&(E.vx.fill(0),E.vy.fill(0))),W()};Ae.addEventListener("change",He),window.addEventListener("pointermove",qe,{passive:!0}),window.addEventListener("pointerdown",Ge,{passive:!0}),window.addEventListener("pointerup",le,{passive:!0}),window.addEventListener("pointercancel",le,{passive:!0}),document.documentElement.addEventListener("pointerleave",ue),window.addEventListener("blur",ue);const We=t=>{t.preventDefault(),ce=!0,cancelAnimationFrame(T),T=0},je=()=>wt(t=>t+1);S.addEventListener("webglcontextlost",We),S.addEventListener("webglcontextrestored",je);const Ke=new ResizeObserver(()=>{be(),W()});Ke.observe(Z);const $e=new IntersectionObserver(t=>{k=t.some(r=>r.isIntersecting),k||(cancelAnimationFrame(T),T=0,D=0),W()});$e.observe(Z);const Qe=()=>{document.hidden&&(cancelAnimationFrame(T),T=0,D=0),H=document.visibilityState!=="hidden",W()};return document.addEventListener("visibilitychange",Qe),be(),W(),()=>{Lt(S,e),cancelAnimationFrame(T),ge.current=null,Ke.disconnect(),$e.disconnect(),window.removeEventListener("pointermove",qe),window.removeEventListener("pointerdown",Ge),window.removeEventListener("pointerup",le),window.removeEventListener("pointercancel",le),document.documentElement.removeEventListener("pointerleave",ue),window.removeEventListener("blur",ue),Ae.removeEventListener("change",He),document.removeEventListener("visibilitychange",Qe),S.removeEventListener("webglcontextlost",We),S.removeEventListener("webglcontextrestored",je),!ce&&!e.isContextLost()&&(e.deleteBuffer(Ye),e.deleteBuffer(ie),e.deleteBuffer(Ee),e.deleteTexture(se),e.deleteVertexArray(we),e.deleteProgram(ae.program))}},[Ie]),ut.jsx("div",{ref:Ce,className:`antigravity${Ue?` ${Ue}`:""}`,style:At,children:ut.jsx("canvas",{ref:De,className:"antigravity__canvas","aria-hidden":"true"})})};export{Vt as default};
