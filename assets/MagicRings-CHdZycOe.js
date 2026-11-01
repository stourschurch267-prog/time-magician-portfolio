import{r as X,b as kt,c as Vt,j as dt,a as Xt}from"./index-Dhy2wWBR.js";const yt=12,Mt=3,ge=yt+Mt,oe=128,zt=`
const vec2 corners[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(corners[gl_VertexID], 0.0, 1.0);
}`,Wt=`
layout(location = 0) in vec2 aSegment;
uniform mat3 uForward;
uniform vec2 uResolution;
uniform float uUnit;
uniform vec2 uCenter;
uniform vec4 uShape[SLOTS];
uniform vec4 uFrame[SLOTS];
uniform float uReach;
uniform float uSplit;
flat out int vSlot;
out vec2 vPlane;
void main() {
  vec4 shape = uShape[gl_InstanceID];
  vec2 origin = uCenter + uFrame[gl_InstanceID].xy;
  float angle = aSegment.x * 6.2831853;
  vec2 direction = vec2(cos(angle), sin(angle));
  vec3 inner = uForward * vec3(origin + direction * shape.x, 1.0);
  vec3 outer = uForward * vec3(origin + direction * (shape.x + 0.01), 1.0);
  float pixels = length(outer.xy / outer.z - inner.xy / inner.z) * 100.0 * uUnit;
  float band = uReach / max(pixels, 1e-3) + uSplit * shape.x;
  vec2 plane = origin + direction * max(shape.x + aSegment.y * band, 0.0);
  vec3 screen = uForward * vec3(plane, 1.0);
  gl_Position = vec4(screen.xy * (2.0 * uUnit / uResolution), 0.0, screen.z);
  vPlane = plane;
  vSlot = gl_InstanceID;
}`,jt=`
uniform vec2 uResolution;
uniform vec2 uScale;
uniform float uUnit;
uniform mat3 uInverse;
uniform vec2 uCenter;
uniform int uCount;
uniform vec4 uShape[SLOTS];
uniform vec4 uFrame[SLOTS];
uniform vec4 uTint[SLOTS];
uniform vec4 uHover;
uniform vec2 uBounds;
uniform float uSplit;
uniform float uOpacity;

out vec4 fragColor;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float angleOf(vec2 v) {
  vec2 a = abs(v);
  float t = min(a.x, a.y) / max(max(a.x, a.y), 1e-6);
  float r = t * (0.5 + 0.1738 * (1.0 - t));
  return a.y > a.x ? 1.0 - r : r;
}

float nearness(vec2 plane) {
  vec2 offset = plane - uHover.xy;
  return uHover.z * exp(-dot(offset, offset) * uHover.w);
}

vec3 prismOf(vec3 tint) {
  return mix(tint, vec3(dot(tint, vec3(0.3333))), 0.65) * 0.85;
}

vec4 toneMap(vec3 light) {
  float peak = max(max(light.r, light.g), light.b);
  if (peak <= 0.0) return vec4(0.0);
  float level = 1.0 - exp(-peak);
  vec3 color = mix(light * (level / peak), vec3(level), smoothstep(1.4, 3.6, peak) * 0.4);
  return vec4(color, level);
}
`,qt=`
uniform vec4 uHalo;
uniform vec3 uRange;

float haloOf(float d) {
  float fall = exp(-d * uHalo.y);
  float tight = fall * fall;
  tight *= tight;
  float window = clamp(1.0 - (d - uRange.x) * uRange.y, 0.0, 1.0);
  return (uHalo.z * tight + uHalo.w * fall) * window * window;
}

void main() {
  vec3 projected = uInverse * vec3((gl_FragCoord.xy * uScale - 0.5 * uResolution) / uUnit, 1.0);
  vec2 plane = projected.xy / projected.z;
  vec2 base = plane - uCenter;
  float reach = length(base);
  if (projected.z <= 0.0 || reach < uBounds.x || reach > uBounds.y) {
    fragColor = vec4(0.0);
    return;
  }
  float boost = 1.0 + 1.6 * nearness(plane);
  float limit = uRange.z + uSplit;
  vec3 light = vec3(0.0);
  float alpha = 0.0;

  for (int i = 0; i < SLOTS; i++) {
    if (i >= uCount) break;
    vec4 shape = uShape[i];
    vec4 frame = uFrame[i];
    vec2 w = base - frame.xy;
    float len = length(w);
    float d = abs(len - shape.x);
    if (d > limit) continue;
    float a = angleOf(vec2(dot(w, frame.zw), frame.z * w.y - frame.w * w.x));
    if (a > shape.w) continue;
    float energy = shape.y * max(exp(-shape.z * a * a * a) - 0.002, 0.0) * boost;
    vec3 tint = uTint[i].rgb;
#ifdef PRISM
    float offset = uSplit * shape.x;
    vec3 halo = vec3(haloOf(abs(len - shape.x - offset)), haloOf(d), haloOf(abs(len - shape.x + offset)));
#else
    vec3 halo = vec3(haloOf(d));
#endif
#ifdef LIGHT
    float layer = clamp(energy * dot(halo, vec3(0.3333)), 0.0, 1.0);
    light = tint * layer + light * (1.0 - layer);
    alpha = layer + alpha * (1.0 - layer);
#else
#ifdef PRISM
    tint = prismOf(tint);
#endif
    light += tint * energy * halo;
#endif
  }
#ifdef LIGHT
  fragColor = vec4(light, alpha);
#elif defined(PACKED)
  fragColor = vec4(1.0 - exp(-light), 1.0);
#else
  fragColor = vec4(light, 1.0);
#endif
}`,$t=`
uniform sampler2D uGlow;
uniform float uGrain;
uniform float uTime;

void main() {
  vec4 glow = texture(uGlow, gl_FragCoord.xy / uResolution);
  float grain = 1.0;
  if (uGrain > 0.0) grain += uGrain * (hash(gl_FragCoord.xy + fract(uTime * 7.31) * 413.0) - 0.5) * 1.8;
  float dither = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
#ifdef LIGHT
  float alpha = clamp(glow.a * grain, 0.0, 1.0);
  if (alpha <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }
  vec3 ink = glow.rgb * grain;
  alpha = clamp(alpha + dither, 0.0, 1.0);
  fragColor = vec4(min(ink, vec3(alpha)), alpha) * uOpacity;
#else
#ifdef PACKED
  vec3 light = -log(1.0 - min(glow.rgb, vec3(0.9995))) * grain;
#else
  vec3 light = glow.rgb * grain;
#endif
  vec4 color = toneMap(light);
  if (color.a <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }
  float alpha = clamp(color.a + dither, 0.0, 1.0);
  fragColor = vec4(min(color.rgb, vec3(alpha)), alpha) * uOpacity;
#endif
}`,Yt=`
flat in int vSlot;
in vec2 vPlane;
uniform float uWidth;

float coverage(float pixels, float halfWidth) {
  return clamp(max(halfWidth, 0.5) - pixels + 0.5, 0.0, 1.0) * min(halfWidth * 2.0, 1.0);
}

void main() {
  vec4 shape = uShape[vSlot];
  vec4 frame = uFrame[vSlot];
  vec4 tint = uTint[vSlot];
  vec2 w = vPlane - uCenter - frame.xy;
  float len = length(w);
  float stretch = 1.0 / max(length(vec2(dFdx(len), dFdy(len))), 1e-6);
  float a = angleOf(vec2(dot(w, frame.zw), frame.z * w.y - frame.w * w.x));
  float near = nearness(vPlane);
  float energy = shape.y * max(exp(-shape.z * a * a * a) - 0.002, 0.0) * (1.0 + 1.6 * near) * step(a, shape.w);
  float halfWidth = uWidth * (1.0 + 0.45 * near) * max(1.0 - a, 0.5) * tint.w;
  float pixels = abs(len - shape.x) * stretch;
#ifdef PRISM
  float offset = uSplit * shape.x;
  vec3 core = vec3(
    coverage(abs(len - shape.x - offset) * stretch, halfWidth),
    coverage(pixels, halfWidth),
    coverage(abs(len - shape.x + offset) * stretch, halfWidth)
  );
#else
  vec3 core = vec3(coverage(pixels, halfWidth));
#endif
#ifdef LIGHT
  float hot = core.g * clamp(1.0 - pixels / max(halfWidth * 0.35, 0.3), 0.0, 1.0);
  float layer = energy * max(max(core.r, core.g), core.b);
  if (layer <= 0.0) discard;
#ifdef PRISM
  vec3 color = clamp(1.0 - (1.0 - tint.rgb) * core * 1.4, 0.0, 1.0);
#else
  vec3 color = tint.rgb;
#endif
  color = mix(color, vec3(1.0), hot * 0.7);
  fragColor = vec4(color * layer, layer) * uOpacity;
#else
#ifdef PRISM
  vec4 color = toneMap(prismOf(tint.rgb) * energy * core * 1.7);
#else
  vec4 color = toneMap(tint.rgb * energy * core * 1.7);
#endif
  if (color.a <= 0.0) discard;
  fragColor = color * uOpacity;
#endif
}`,mt=(o,s)=>["#version 300 es","precision highp float;",`#define SLOTS ${ge}`,...s.map(i=>`#define ${i}`),o].join(`
`),Kt={glow:qt,compose:$t,line:Yt},Qt=["pulse","ripple","breathe"],z=3.45,pt=.5,vt=2.6,ve=1.1,gt=.9,A=(o,s,i)=>Math.min(i,Math.max(s,o)),K=(o,s,i)=>{const r=A((i-o)/(s-o),0,1);return r*r*(3-2*r)},Jt=o=>Math.min(K(0,.7,o),1-K(.5,3.25,o)),xt=o=>o<=.04045?o/12.92:Math.pow((o+.055)/1.055,2.4),Ce=o=>{const s=String(o||"").trim(),i=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);if(i){const l=i[1].length===3?i[1].replace(/./g,a=>a+a):i[1];return[0,2,4].map(a=>parseInt(l.slice(a,a+2),16)/255)}const r=/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);if(r)return[r[1],r[2],r[3]].map(l=>A(parseFloat(l)/255,0,1));if(typeof document<"u"){const l=document.createElement("canvas").getContext("2d");if(l){l.fillStyle="#000000",l.fillStyle=s;const a=String(l.fillStyle);if(a!=="#000000"||/^(#0{3}|#0{6}|black)$/i.test(s))return Ce(a)}}return[.66,.33,.97]},wt=(o,s,i)=>{const r=o.createShader(s);return r?(o.shaderSource(r,i),o.compileShader(r),o.getShaderParameter(r,o.COMPILE_STATUS)?r:(console.error(o.getShaderInfoLog(r)),o.deleteShader(r),null)):null},Zt=(o,s,i)=>{const r=wt(o,o.VERTEX_SHADER,s),l=wt(o,o.FRAGMENT_SHADER,i),a=r&&l?o.createProgram():null;if(!r||!l||!a)return r&&o.deleteShader(r),l&&o.deleteShader(l),null;if(o.attachShader(a,r),o.attachShader(a,l),o.linkProgram(a),o.deleteShader(r),o.deleteShader(l),!o.getProgramParameter(a,o.LINK_STATUS))return console.error(o.getProgramInfoLog(a)),o.deleteProgram(a),null;const S={},b=o.getProgramParameter(a,o.ACTIVE_UNIFORMS);for(let w=0;w<b;w++){const L=o.getActiveUniform(a,w);L&&(S[L.name.replace(/\[0\]$/,"")]=o.getUniformLocation(a,L.name))}return{program:a,uniforms:S}},eo=o=>{const[s,i,r,l,a,S,b,w,L]=o,ne=a*L-S*w,re=S*b-l*L,ae=l*w-a*b,xe=s*ne+i*re+r*ae;return[ne,r*w-i*L,i*S-r*a,re,s*L-r*b,r*l-s*S,ae,i*b-s*w,s*a-i*l].map(we=>we/xe)},to=(o,s)=>{const i=o*Math.PI/180,r=s*Math.PI/180,l=Math.cos(i),a=Math.sin(i),S=Math.cos(r),b=Math.sin(r),w=[S,b*a,0,0,l,0,b*l/vt,-a/vt,1];return{forward:w,inverse:eo(w)}},oo=(o,s,i)=>{const r=o[6]*s+o[7]*i+o[8];return[(o[0]*s+o[1]*i+o[2])/r,(o[3]*s+o[4]*i+o[5])/r,r]},Et=o=>[o[0],o[3],o[6],o[1],o[4],o[7],o[2],o[5],o[8]],ro=({color:o="#A855F7",colorTwo:s="#6366F1",ringCount:i=6,motion:r="pulse",speed:l=1,lineThickness:a=2,glow:S=1,baseRadius:b=.35,radiusStep:w=.1,expansion:L=.1,taper:ne=1.5,rotation:re=0,spin:ae=0,tilt:xe=0,dispersion:we=0,grain:Rt=0,opacity:St=1,followMouse:bt=!1,mouseInfluence:Tt=.2,hoverScale:Ft=1.2,hoverIntensity:At=1,parallax:Lt=.05,clickBurst:_t=!0,intro:It=!0,theme:Ct="dark",maxDevicePixelRatio:Ot=2,className:Oe="",style:Pt})=>{const Pe=X.useRef(null),Ue=X.useRef(null),Ee=X.useRef(null),[Be,Ut]=X.useState(0),ye=Ct==="light",De=Ce(o),Ge=Ce(s),Ne={color:ye?De:De.map(xt),colorTwo:ye?Ge:Ge.map(xt),ringCount:A(Math.round(i),1,yt),motion:Qt.includes(r)?r:"pulse",speed:Math.max(0,l),lineThickness:Math.max(.25,a),glow:A(S,0,3),baseRadius:Math.max(.01,b),radiusStep:Math.max(0,w),expansion:L,taper:Math.max(.5,ne),rotation:re*Math.PI/180,spin:ae,tilt:A(xe,-80,80),dispersion:A(we,0,1),grain:A(Rt,0,1),opacity:A(St,0,1),followMouse:bt,mouseInfluence:Tt,hoverScale:Math.max(.5,Ft),hoverIntensity:Math.max(0,At),parallax:Lt,clickBurst:_t,intro:It,light:ye,maxRatio:A(Ot,.5,3)},N=X.useRef(Ne);return N.current=Ne,X.useEffect(()=>{Ee.current?.()}),X.useEffect(()=>{const Q=Pe.current,d=Ue.current;if(!Q||!d)return;const He=kt(),e=d.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"default"});if(!e)return;const J=new Map,W=(t,n)=>{const c=`${t}|${n.join(",")}`;if(!J.has(c)){const m=mt(t==="line"?Wt:zt,n);J.set(c,Zt(e,m,mt(`${jt}${Kt[t]}`,n)))}return J.get(c)};if(!W("glow",[])||!W("compose",[])||!W("line",[])){J.forEach(t=>t&&e.deleteProgram(t.program));return}const Me=window.matchMedia("(prefers-reduced-motion: reduce)");let T=Me.matches;const ke=e.createVertexArray(),Re=e.createVertexArray(),Ve=e.createBuffer(),Xe=new Float32Array((oe+1)*4);for(let t=0;t<=oe;t++)Xe.set([t/oe,-1,t/oe,1],t*4);e.bindVertexArray(Re),e.bindBuffer(e.ARRAY_BUFFER,Ve),e.bufferData(e.ARRAY_BUFFER,Xe,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindVertexArray(null);const ie=e.createTexture(),Se=e.createFramebuffer(),H={width:0,height:0};let be=!!e.getExtension("EXT_color_buffer_float");const ze=new Float32Array(ge*4),We=new Float32Array(ge*4),je=new Float32Array(ge*4),k={width:1,height:1,ratio:1,unit:1},h={x:0,y:0,inside:!1,touch:!1},u={x:0,y:0,vx:0,vy:0,hover:0,hoverVelocity:0},_=[];let P=N.current.intro&&N.current.speed>0&&!T&&Be===0,U=P?0:1.6,j=0,E=0,D=0,V=!0,q=document.visibilityState!=="hidden",se=!1;const Te=()=>{const t=N.current,n=Q.getBoundingClientRect(),c=Xt(n.width,n.height,t.maxRatio,He),m=Math.max(1,Math.round(n.width*c)),v=Math.max(1,Math.round(n.height*c));(d.width!==m||d.height!==v)&&(d.width=m,d.height=v),Object.assign(k,{width:m,height:v,ratio:c,unit:Math.max(1,Math.min(m,v))});const x=Math.max(1,Math.ceil(m/2)),y=Math.max(1,Math.ceil(v/2));if(H.width===x&&H.height===y)return;Object.assign(H,{width:x,height:y});const M=g=>{e.bindTexture(e.TEXTURE_2D,ie),e.texImage2D(e.TEXTURE_2D,0,g?e.RGBA16F:e.RGBA8,x,y,0,e.RGBA,g?e.HALF_FLOAT:e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,Se),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,ie,0);const C=e.checkFramebufferStatus(e.FRAMEBUFFER)===e.FRAMEBUFFER_COMPLETE;return e.bindFramebuffer(e.FRAMEBUFFER,null),C};M(be)||(be=!1,M(!1))},Bt=(t,n,c)=>{const m=c>1?n/(c-1):0;if(t.motion==="ripple"){const M=c*t.radiusStep+t.expansion,g=z*Math.max(1,c)*.32,C=U/g+n/c,R=C-Math.floor(C),F=U-R*g>=-1e-4||!P?K(0,.12,R)*(1-K(.62,1,R)):0,Z=R*Math.max(1,c-1);return{radius:t.baseRadius+R*M,life:F,virtual:Z,mix:R,opening:1}}if(t.motion==="breathe"){const M=Math.sin(U/4*Math.PI*2-n*.55),g=P?K(n*.12,n*.12+.9,U):1;return{radius:t.baseRadius+n*t.radiusStep+t.expansion*.5*(1+M),life:(.78+.22*M)*g,virtual:n,mix:m,opening:1}}const v=U-n*pt,x=(v%z+z)%z,y=P&&v<0?0:Jt(x);return{radius:t.baseRadius+n*t.radiusStep+(1-Math.pow(1-x/z,2))*t.expansion,life:y,virtual:n,mix:m,opening:P&&v<z?K(0,.9,v):1}},Dt=()=>{const t=N.current,n=t.ringCount,c=u.hover,m=T?0:1,v=1+(t.hoverScale-1)*c*m,x=u.x*m,y=u.y*m,M=t.tilt-y*t.parallax*260,g=x*t.parallax*260,C=to(M,g),R=t.followMouse?[x*t.mouseInfluence,y*t.mouseInfluence]:[0,0],O=t.spin*U*.6;let F=0,Z=1/0,fe=0,Ae=0;const ot=(p,f,B,G,he,de,Y,me)=>{if(f<=.002)return;const te=10*p*B*B*B;ze.set([p,f,te,te>6.2?Math.cbrt(6.2/te):2],F*4),We.set([he,de,Math.cos(G),Math.sin(G)],F*4),je.set([t.color[0]+(t.colorTwo[0]-t.color[0])*Y,t.color[1]+(t.colorTwo[1]-t.color[1])*Y,t.color[2]+(t.colorTwo[2]-t.color[2])*Y,me],F*4),Z=Math.min(Z,p),fe=Math.max(fe,p),Ae=Math.max(Ae,Math.hypot(he,de)),F++};for(let p=0;p<n;p++){const f=Bt(t,p,n);let B=f.radius*v,G=f.life;for(const Y of _){const me=j-Y.start,te=(Y.radius+me*gt)*v,ht=Math.pow(Math.max(0,1-me/ve),1.5),pe=(te-B)/.08;B+=.04*Math.exp(-pe*pe)*ht,G=Math.min(1.6,G+.9*Math.exp(-pe*pe*1.6)*ht)}const he=Math.pow(t.taper,f.virtual)/Math.max(.08,f.opening),de=t.rotation+O*(p%2?-1:1)*(1+p*.15);ot(B,G,he,de,p*t.parallax*x,p*t.parallax*y,f.mix,1)}for(const p of _){const f=j-p.start,B=Math.pow(Math.max(0,1-f/ve),1.5),G=(p.radius+f*gt)*v;ot(G,1.5*B,.85,t.rotation,0,0,A(f/ve,0,1),1.15)}if(e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,d.width,d.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),!F)return;const $=[];t.light&&$.push("LIGHT"),t.dispersion>0&&$.push("PRISM"),be||$.push("PACKED");const nt=W("glow",$),rt=W("compose",$),at=W("line",$);if(!nt||!rt||!at)return;const it=(t.light?.3:1)*(1-t.dispersion*.45),st=.012+.033*t.glow,Gt=.5*Math.min(1,t.glow)*it,Nt=.9*t.glow*it,ue=st*4.5+.008,ct=t.dispersion*.03,lt=ue+ct*fe+Ae+.01,ft=t.lineThickness*k.ratio,Ht=ft*(1+.45*t.hoverIntensity)*1.15+1.5,ut=oo(C.inverse,h.x,h.y),Le=p=>{const f=p.uniforms;return e.useProgram(p.program),e.uniform2f(f.uResolution,d.width,d.height),e.uniform1f(f.uUnit,k.unit),e.uniform2f(f.uCenter,R[0],R[1]),e.uniform1i(f.uCount,F),e.uniform4fv(f.uShape,ze),e.uniform4fv(f.uFrame,We),e.uniform4fv(f.uTint,je),e.uniform4f(f.uHover,ut[0]-R[0],ut[1]-R[1],c*t.hoverIntensity,1/.03),e.uniform1f(f.uSplit,ct),e.uniform1f(f.uOpacity,t.opacity),f};e.bindVertexArray(ke),e.bindFramebuffer(e.FRAMEBUFFER,Se),e.viewport(0,0,H.width,H.height),e.clear(e.COLOR_BUFFER_BIT);const ee=Le(nt);e.uniform2f(ee.uScale,d.width/H.width,d.height/H.height),e.uniformMatrix3fv(ee.uInverse,!1,Et(C.inverse)),e.uniform2f(ee.uBounds,Math.max(0,Z-lt),fe+lt),e.uniform4f(ee.uHalo,0,1/st,Gt,Nt),e.uniform3f(ee.uRange,ue*.45,1/(ue*.55),ue),e.drawArrays(e.TRIANGLES,0,3),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,d.width,d.height);const _e=Le(rt);e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,ie),e.uniform1i(_e.uGlow,0),e.uniform1f(_e.uGrain,t.grain),e.uniform1f(_e.uTime,j),e.drawArrays(e.TRIANGLES,0,3);const Ie=Le(at);e.uniformMatrix3fv(Ie.uForward,!1,Et(C.forward)),e.uniform1f(Ie.uReach,Ht),e.uniform1f(Ie.uWidth,ft),e.enable(e.BLEND),t.light?e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA):e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_COLOR,e.ONE,e.ONE_MINUS_SRC_ALPHA),e.bindVertexArray(Re),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,(oe+1)*2,F),e.disable(e.BLEND),e.bindVertexArray(null)},Fe=t=>{if(E=0,se||!V||!q)return;if(D&&t-D<He.frameInterval-1){E=requestAnimationFrame(Fe);return}const n=N.current,c=A((t-D)/1e3||0,0,.05);D=Math.max(D,t),j+=c,T||(U+=c*n.speed);const m=h.inside?h.x/Math.max(1e-6,k.width/k.unit):0,v=h.inside?h.y/Math.max(1e-6,k.height/k.unit):0,x=70,y=2*Math.sqrt(x)*.9,M=Math.max(1,Math.ceil(c/(1/240))),g=c/M;for(let O=0;O<M;O++){u.vx+=(x*(m-u.x)-y*u.vx)*g,u.vy+=(x*(v-u.y)-y*u.vy)*g,u.x+=u.vx*g,u.y+=u.vy*g;const F=h.inside?1:0;u.hoverVelocity+=(40*(F-u.hover)-2*Math.sqrt(40)*u.hoverVelocity)*g,u.hover+=u.hoverVelocity*g}for(let O=_.length-1;O>=0;O--)j-_[O].start>ve&&_.splice(O,1);P&&U>(n.ringCount+2)*pt+z&&(P=!1),Dt();const C=Math.abs(u.vx)+Math.abs(u.vy)+Math.abs(u.hoverVelocity)>1e-4||Math.abs((h.inside?1:0)-u.hover)>.001;(n.speed>0&&!T||C||_.length>0||P)&&V&&q&&(E=requestAnimationFrame(Fe))},I=()=>{E||se||!V||!q||(D=performance.now(),E=requestAnimationFrame(Fe))};Ee.current=()=>{Te(),I()};const qe=t=>{const n=Q.getBoundingClientRect(),c=t.clientX>=n.left&&t.clientX<=n.right&&t.clientY>=n.top&&t.clientY<=n.bottom,m=Math.max(1,Math.min(n.width,n.height));return{x:(t.clientX-n.left-n.width/2)/m,y:(n.top+n.height/2-t.clientY)/m,inside:c}},$e=t=>{if(!V||!q||T||T||t.pointerType==="touch"&&!h.touch)return;const n=qe(t);h.x=n.x,h.y=n.y,h.inside=n.inside,I()},Ye=t=>{if(!V||!q||T||T)return;const n=qe(t);if(!n.inside)return;h.x=n.x,h.y=n.y,h.inside=!0,h.touch=t.pointerType==="touch";const c=N.current;c.clickBurst&&!T&&(_.push({start:j,radius:Math.max(.04,c.baseRadius*.45)}),_.length>Mt&&_.shift()),I()},ce=t=>{t.pointerType==="touch"&&(h.touch=!1,h.inside=!1,I())},le=()=>{h.inside=!1,h.touch=!1,I()},Ke=t=>{T=t.matches,T&&(_.length=0,h.inside=h.touch=!1,Object.assign(u,{x:0,y:0,vx:0,vy:0,hover:0,hoverVelocity:0}),P=!1,U=1.6),I()};Me.addEventListener("change",Ke),window.addEventListener("pointermove",$e,{passive:!0}),window.addEventListener("pointerdown",Ye,{passive:!0}),window.addEventListener("pointerup",ce,{passive:!0}),window.addEventListener("pointercancel",ce,{passive:!0}),document.documentElement.addEventListener("pointerleave",le),window.addEventListener("blur",le);const Qe=t=>{t.preventDefault(),se=!0,cancelAnimationFrame(E),E=0},Je=()=>Ut(t=>t+1);d.addEventListener("webglcontextlost",Qe),d.addEventListener("webglcontextrestored",Je);const Ze=new ResizeObserver(()=>{Te(),I()});Ze.observe(Q);const et=new IntersectionObserver(t=>{V=t.some(n=>n.isIntersecting),V||(cancelAnimationFrame(E),E=0,D=0),I()});et.observe(Q);const tt=()=>{document.hidden&&(cancelAnimationFrame(E),E=0,D=0),q=document.visibilityState!=="hidden",I()};return document.addEventListener("visibilitychange",tt),Te(),I(),()=>{Vt(d,e),cancelAnimationFrame(E),Ee.current=null,Ze.disconnect(),et.disconnect(),window.removeEventListener("pointermove",$e),window.removeEventListener("pointerdown",Ye),window.removeEventListener("pointerup",ce),window.removeEventListener("pointercancel",ce),document.documentElement.removeEventListener("pointerleave",le),window.removeEventListener("blur",le),Me.removeEventListener("change",Ke),document.removeEventListener("visibilitychange",tt),d.removeEventListener("webglcontextlost",Qe),d.removeEventListener("webglcontextrestored",Je),!se&&!e.isContextLost()&&(e.deleteVertexArray(ke),e.deleteTexture(ie),e.deleteFramebuffer(Se),J.forEach(t=>t&&e.deleteProgram(t.program)),e.deleteVertexArray(Re),e.deleteBuffer(Ve))}},[Be]),dt.jsx("div",{ref:Pe,className:`magic-rings${Oe?` ${Oe}`:""}`,style:Pt,children:dt.jsx("canvas",{ref:Ue,className:"magic-rings__canvas","aria-hidden":"true"})})};export{ro as default};
