import{r as X,b as Nt,c as $t,j as rt,a as Ht}from"./index-Dhy2wWBR.js";const qt={circle:0,square:1,ring:2,sparkle:3},Xt={parallax:0,repel:1,attract:2},Gt={none:0,up:1,down:2,forward:3},Wt=2e4,it=900,st=9e3,ne=4,pe=10,xe=1/Math.tan(7.5*Math.PI/180),ut=.1,G=100,jt=1.8,ke=1.5,dt=520,ht=46,Kt=`#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec3 aPosition;
layout(location = 2) in vec4 aRandom;
layout(location = 3) in vec3 aColor;
uniform mat3 uRotation;
uniform vec3 uOffset;
uniform float uSpread;
uniform float uTime;
uniform float uCamera;
uniform float uAspect;
uniform vec2 uView;
uniform float uRatio;
uniform float uSize;
uniform float uRandomness;
uniform float uBlur;
uniform float uFocus;
uniform float uGlow;
uniform float uTwinkle;
uniform int uShape;
uniform int uDrift;
uniform float uTravel;
uniform vec4 uPointer;
uniform int uEffect;
uniform float uStrength;
uniform vec4 uBursts[${ne}];
uniform int uBurstCount;
uniform float uReveal;
out vec2 vLocal;
out float vRadius;
out float vBlur;
out float vAlpha;
out float vHalo;
out float vSeed;
out vec3 vColor;

vec3 bob(vec4 r, float t) {
  return vec3(
    sin(t * r.z + 6.28 * r.w) * mix(0.1, 1.5, r.x),
    sin(t * r.y + 6.28 * r.x) * mix(0.1, 1.5, r.w),
    sin(t * r.w + 6.28 * r.y) * mix(0.1, 1.5, r.z)
  );
}

void main() {
  vec3 pos = aPosition * uSpread;
  pos.z *= ${pe.toFixed(1)};
  vec3 wobble = bob(aRandom, uTime);
  vec3 world = uRotation * pos + uOffset + wobble;
  float edge = 1.0;
  if (uDrift == 1 || uDrift == 2) {
    float span = uSpread * 2.0 + 3.0;
    float k = mod(aRandom.w * span + uOffset.y + wobble.y + (uDrift == 1 ? uTravel : -uTravel), span);
    world.y = k - span * 0.5;
    edge = smoothstep(0.0, span * 0.12, k) * smoothstep(span, span * 0.88, k);
  } else if (uDrift == 3) {
    float span = uSpread * ${pe.toFixed(1)} * 2.0 + 3.0;
    float k = mod(aRandom.y * span + uOffset.z + wobble.z + uTravel, span);
    world.z = k - span * 0.5;
    edge = smoothstep(0.0, span * 0.1, k);
  }
  vec3 view = world - vec3(0.0, 0.0, uCamera);
  float dist = length(view);
  float ahead = -view.z;
  if (ahead < ${ut.toFixed(2)} || ahead > ${G.toFixed(1)}) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  edge *= smoothstep(1.0, 4.0, ahead);
  vec2 ndc = vec2(view.x * ${xe.toFixed(6)} / uAspect, view.y * ${xe.toFixed(6)}) / ahead;
  vec2 screen = (ndc * 0.5 + 0.5) * uView;

  vec2 shift = vec2(0.0);
  float flash = 0.0;
  if (uEffect != 0 && uPointer.z > 0.001) {
    vec2 delta = screen - uPointer.xy;
    float reach = length(delta);
    float falloff = exp(-dot(delta, delta) / (uPointer.w * uPointer.w));
    vec2 away = reach > 0.001 ? delta / reach : vec2(0.0);
    shift += (uEffect == 1 ? away * uPointer.w * 0.5 : -delta * 0.6) * falloff * uStrength * uPointer.z;
  }
  for (int i = 0; i < ${ne}; i++) {
    if (i >= uBurstCount) break;
    vec4 burst = uBursts[i];
    vec2 delta = screen - burst.xy;
    float reach = length(delta);
    float wave = exp(-pow((reach - burst.z * ${dt.toFixed(1)}) / ${ht.toFixed(1)}, 2.0));
    vec2 away = reach > 0.001 ? delta / reach : vec2(0.0);
    float fade = (1.0 - burst.z) * (1.0 - burst.z) * burst.w;
    shift += away * wave * fade * 56.0 * smoothstep(0.0, 30.0, reach);
    flash += wave * fade;
  }
  screen += shift;

  float diameter = (uRandomness <= 0.0 ? uSize : uSize * (1.0 + uRandomness * (aRandom.x - 0.5)) / dist) * (1.0 + min(flash, 1.0) * 0.6);
  float device = diameter * uRatio;
  float radius = max(diameter, 1.0 / uRatio) * 0.5;
  float coverage = min(1.0, device * device);
  float blur = uBlur * max(uFocus - dist, 0.0) / max(dist, 1.0);
  float halo = uGlow > 0.0 ? radius * 2.5 + 2.0 : 0.0;
  float extent = radius * (uShape == 3 ? 1.6 : 1.0) + blur + halo + 1.5;

  float twinkle = 1.0 - uTwinkle * 0.6 * (0.5 + 0.5 * sin(uTime * (6.0 + aRandom.y * 14.0) + aRandom.w * 40.0));
  float far = smoothstep(${G.toFixed(1)}, ${(G*.9).toFixed(1)}, ahead);
  float focus = radius / (radius + blur);
  float reveal = clamp(uReveal * 1.6 - aRandom.z * 0.6, 0.0, 1.0);

  vLocal = aCorner * extent;
  vRadius = radius;
  vBlur = blur;
  vHalo = halo;
  vSeed = aRandom.y;
  vAlpha = min(1.0, coverage * twinkle * (1.0 + flash * 1.4)) * far * edge * max(focus, 0.35) * reveal * reveal;
  vColor = aColor;
  gl_Position = vec4((screen + aCorner * extent) / uView * 2.0 - 1.0, 0.0, 1.0);
}`,Qt=`#version 300 es
precision highp float;
precision highp int;
uniform int uShape;
uniform float uGlow;
uniform float uRatio;
uniform float uTime;
uniform float uSoft;
uniform float uShimmer;
uniform float uOpacity;
in vec2 vLocal;
in float vRadius;
in float vBlur;
in float vAlpha;
in float vHalo;
in float vSeed;
in vec3 vColor;
out vec4 outColor;

float ray(vec2 q, float aa) {
  float width = 0.14 * max(0.0, 1.0 - q.x);
  return (1.0 - smoothstep(width - aa, width + aa, q.y)) * step(q.x, 1.0);
}

void main() {
  float soft = vBlur + 0.7 / uRatio + vRadius * uSoft;
  float d = length(vLocal);
  float shape;
  if (uShape == 1) {
    float box = max(abs(vLocal.x), abs(vLocal.y));
    shape = 1.0 - smoothstep(vRadius * 0.86 - soft, vRadius * 0.86 + soft, box);
  } else if (uShape == 2) {
    float edge = max(vRadius * 0.22, 0.6 / uRatio);
    shape = 1.0 - smoothstep(edge - soft, edge + soft, abs(d - vRadius * 0.8));
  } else if (uShape == 3) {
    float reach = vRadius * 1.6;
    vec2 q = abs(vLocal) / max(reach, 0.0001);
    float aa = soft / max(reach, 0.0001);
    shape = max(max(ray(q, aa), ray(q.yx, aa)), 1.0 - smoothstep(vRadius * 0.32 - soft, vRadius * 0.32 + soft, d));
  } else {
    shape = 1.0 - smoothstep(vRadius - soft, vRadius + soft, d);
  }
  float halo = vHalo > 0.0 ? exp(-d / (vHalo * 0.35)) * uGlow * 0.4 : 0.0;
  float alpha = clamp(shape + halo * (1.0 - shape), 0.0, 1.0) * vAlpha * uOpacity * (1.0 - uSoft);
  if (alpha < 0.002) discard;
  vec2 uv = vLocal / max(vRadius * 2.0, 0.0001) + 0.5;
  vec3 color = clamp(vColor + uShimmer * 0.2 * sin(uv.yxx + uTime + vSeed * 6.28), 0.0, 1.0);
  outColor = vec4(color * alpha, alpha);
}`,Zt=`#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aEnds;
layout(location = 2) in vec4 aTint;
uniform vec2 uView;
uniform float uRatio;
uniform float uWidth;
out float vAcross;
out float vHalf;
out vec4 vTint;

void main() {
  vec2 a = aEnds.xy;
  vec2 b = aEnds.zw;
  vec2 along = b - a;
  float span = max(length(along), 0.0001);
  vec2 normal = vec2(-along.y, along.x) / span;
  float reach = uWidth * 0.5 + 1.0 / uRatio;
  vec2 point = mix(a, b, aCorner.x * 0.5 + 0.5) + normal * aCorner.y * reach;
  vAcross = aCorner.y * reach;
  vHalf = uWidth * 0.5;
  vTint = aTint;
  gl_Position = vec4(point / uView * 2.0 - 1.0, 0.0, 1.0);
}`,Jt=`#version 300 es
precision highp float;
uniform float uRatio;
uniform float uOpacity;
in float vAcross;
in float vHalf;
in vec4 vTint;
out vec4 outColor;

void main() {
  float edge = 0.6 / uRatio;
  float cover = 1.0 - smoothstep(vHalf - edge, vHalf + edge, abs(vAcross));
  float alpha = cover * vTint.a * uOpacity;
  outColor = vec4(vTint.rgb * alpha, alpha);
}`,L=(r,F,w)=>Math.min(w,Math.max(F,r)),ct=(r,F,w)=>{const b=r.createShader(F);return b?(r.shaderSource(b,w),r.compileShader(b),r.getShaderParameter(b,r.COMPILE_STATUS)?b:(r.deleteShader(b),null)):null},ft=(r,F,w)=>{const b=ct(r,r.VERTEX_SHADER,F),U=ct(r,r.FRAGMENT_SHADER,w),E=r.createProgram();if(!b||!U||!E)return b&&r.deleteShader(b),U&&r.deleteShader(U),E&&r.deleteProgram(E),null;if(r.attachShader(E,b),r.attachShader(E,U),r.linkProgram(E),r.deleteShader(b),r.deleteShader(U),!r.getProgramParameter(E,r.LINK_STATUS))return r.deleteProgram(E),null;const re={},we=r.getProgramParameter(E,r.ACTIVE_UNIFORMS);for(let ee=0;ee<we;ee++){const te=r.getActiveUniform(E,ee);te&&(re[te.name.replace("[0]","")]=r.getUniformLocation(E,te.name))}return{program:E,uniforms:re}},eo=r=>{let F=r>>>0;return()=>{F=F+1831565813>>>0;let w=F;return w=Math.imul(w^w>>>15,w|1),w^=w+Math.imul(w^w>>>7,w|61),((w^w>>>14)>>>0)/4294967296}},to=r=>1-Math.pow(1-L(r,0,1),3),lt=(r,F)=>(r%F+F)%F,ao=({particleCount:r=200,particleSpread:F=10,speed:w=.1,particleColors:b=["#ffffff"],moveParticlesOnHover:U=!0,particleHoverFactor:E=1,alphaParticles:re=!1,particleBaseSize:we=100,sizeRandomness:ee=1,cameraDistance:te=20,disableRotation:mt=!1,pixelRatio:vt,shape:pt="circle",glow:xt=.5,twinkle:wt=.3,depthOfField:Rt=0,connections:yt=!1,connectionDistance:At=110,hoverEffect:bt="parallax",hoverRadius:gt=140,clickBurst:Ft=!0,drift:Et="none",driftSpeed:Mt=1,variation:St=0,intro:Tt=!0,opacity:Bt=1,lightMode:Lt=!1,paused:Pt=!1,className:De="",style:Ct})=>{const Oe=X.useRef(null),Ie=X.useRef(null),Re=X.useRef(null),[_t,kt]=X.useState(0),ze=(Array.isArray(b)?b:[b]).filter(Boolean).map(String),Ve={count:L(Math.round(r),1,Wt),spread:Math.max(.1,F),speed:w,colors:ze.length?ze:["#ffffff"],mouse:U,hoverFactor:Math.max(0,E),soft:re,size:Math.max(0,we),randomness:Math.max(0,ee),camera:Math.max(1,te),rotate:!mt,dpr:vt,shape:qt[pt]??0,glow:Math.max(0,xt),twinkle:L(wt,0,1),depthOfField:Math.max(0,Rt),connections:yt,connectionDistance:Math.max(10,At),hoverEffect:Xt[bt]??0,hoverRadius:Math.max(20,gt),clickBurst:Ft,drift:Gt[Et]??0,driftSpeed:Mt,variation:Math.max(0,Math.round(St)),intro:Tt,opacity:L(Bt,0,1),lightMode:Lt,paused:Pt},z=X.useRef(Ve);return z.current=Ve,X.useEffect(()=>{const W=Oe.current,P=Ie.current,Ue=Nt(),e=P?.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1});if(!W||!P||!e)return;const j=ft(e,Kt,Qt),V=ft(e,Zt,Jt);if(!j||!V){j&&e.deleteProgram(j.program),V&&e.deleteProgram(V.program);return}const ie=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,ie),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW);const ye=e.createBuffer(),Ae=e.createBuffer(),be=e.createBuffer(),ge=e.createVertexArray();e.bindVertexArray(ge),e.bindBuffer(e.ARRAY_BUFFER,ie),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);const Fe=(t,o,n)=>{e.bindBuffer(e.ARRAY_BUFFER,t),e.enableVertexAttribArray(o),e.vertexAttribPointer(o,n,e.FLOAT,!1,0,0),e.vertexAttribDivisor(o,1)};Fe(ye,1,3),Fe(Ae,2,4),Fe(be,3,3);const Ee=e.createBuffer(),D=new Float32Array(st*8),Me=e.createVertexArray();e.bindVertexArray(Me),e.bindBuffer(e.ARRAY_BUFFER,ie),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,Ee),e.bufferData(e.ARRAY_BUFFER,D.byteLength,e.DYNAMIC_DRAW),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,4,e.FLOAT,!1,32,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,4,e.FLOAT,!1,32,16),e.vertexAttribDivisor(2,1),e.bindVertexArray(null);const K=document.createElement("canvas").getContext("2d",{willReadFrequently:!0}),Se=window.matchMedia("(prefers-reduced-motion: reduce)");let C=Se.matches;const Te=new Map,Ye=t=>{if(Te.has(t))return Te.get(t);let o=[1,1,1];if(K){K.clearRect(0,0,1,1),K.fillStyle="#ffffff",K.fillStyle=t,K.fillRect(0,0,1,1);const[n,s,l]=K.getImageData(0,0,1,1).data;o=[n/255,s/255,l/255]}return Te.set(t,o),o},Dt=t=>{const o=t.map(l=>Math.pow(l,2.2)),n=.2126*o[0]+.7152*o[1]+.0722*o[2],s=Math.min(1,.06/Math.max(n,1e-4));return o.map(l=>Math.pow(l*s,1/2.2))},R={width:1,height:1,ratio:1},i={x:0,y:0,sx:0,sy:0,nx:0,ny:0,inside:!1,active:0},f={clock:0,spin:0,travel:0,offsetX:0,offsetY:0,reveal:z.current.intro&&!C?0:1},M=[],Ne=new Float32Array(ne*4),x={key:"",count:0,positions:new Float32Array(0),randoms:new Float32Array(0),colors:new Float32Array(0)},d={x:new Float32Array(0),y:new Float32Array(0),ahead:new Float32Array(0),alpha:new Float32Array(0)};let S=0,O=0,Y=!0,Q=!1;const Ot=t=>{const o=`${t.count}|${t.variation}|${t.colors.join(",")}|${t.lightMode?1:0}`;if(o===x.key)return;x.key=o;const n=eo(t.variation*7919+1),s=t.count,l=new Float32Array(s*3),a=new Float32Array(s*4),h=new Float32Array(s*3),u=t.colors.map(m=>t.lightMode?Dt(Ye(m)):Ye(m));for(let m=0;m<s;m++){let v,T,p,y;do v=n()*2-1,T=n()*2-1,p=n()*2-1,y=v*v+T*T+p*p;while(y>1||y===0);const _=Math.cbrt(n());l.set([v*_,T*_,p*_],m*3),a.set([n(),n(),n(),n()],m*4),h.set(u[Math.floor(n()*u.length)],m*3)}x.count=s,x.positions=l,x.randoms=a,x.colors=h;const c=Math.min(s,it);d.x=new Float32Array(c),d.y=new Float32Array(c),d.ahead=new Float32Array(c),d.alpha=new Float32Array(c),e.bindBuffer(e.ARRAY_BUFFER,ye),e.bufferData(e.ARRAY_BUFFER,l,e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,Ae),e.bufferData(e.ARRAY_BUFFER,a,e.STATIC_DRAW),e.bindBuffer(e.ARRAY_BUFFER,be),e.bufferData(e.ARRAY_BUFFER,h,e.STATIC_DRAW)},It=t=>{const o=f.clock*1e3,n=t.rotate?Math.sin(o*2e-4)*.1:0,s=t.rotate?Math.cos(o*5e-4)*.15:0,l=t.rotate?f.spin:0,[a,h,u,c,m,v]=[Math.sin(n),Math.cos(n),Math.sin(s),Math.cos(s),Math.sin(l),Math.cos(l)];return[c*v+u*a*m,h*m,-u*v+c*a*m,-c*m+u*a*v,h*v,u*m+c*a*v,u*h,-a,c*h]},$e=()=>[f.offsetX,f.offsetY,-(1-to(f.reveal))*70],zt=(t,o)=>{const n=Math.min(x.count,it),[s,l,a]=$e(),h=R.width/R.height,u=f.clock,c=t.hoverRadius,m=t.hoverEffect!==0?i.active:0,v=t.spread*2+3,T=t.spread*pe*2+3;for(let p=0;p<n;p++){const y=x.positions[p*3]*t.spread,_=x.positions[p*3+1]*t.spread,B=x.positions[p*3+2]*t.spread*pe,oe=x.randoms[p*4],Z=x.randoms[p*4+1],J=x.randoms[p*4+2],$=x.randoms[p*4+3],le=Math.sin(u*J+6.28*$)*(.1+1.4*oe),k=Math.sin(u*Z+6.28*oe)*(.1+1.4*$),et=Math.sin(u*$+6.28*Z)*(.1+1.4*J),Ut=o[0]*y+o[3]*_+o[6]*B+s+le;let tt=o[1]*y+o[4]*_+o[7]*B+l+k,ot=o[2]*y+o[5]*_+o[8]*B+a+et,ue=1;if(t.drift===1||t.drift===2){const g=lt($*v+l+k+(t.drift===1?f.travel:-f.travel),v);tt=g-v/2;const A=L(g/(v*.12),0,1),I=L((v-g)/(v*.12),0,1);ue=A*A*(3-2*A)*I*I*(3-2*I)}else if(t.drift===3){const g=lt(Z*T+a+et+f.travel,T);ot=g-T/2;const A=L(g/(T*.1),0,1);ue=A*A*(3-2*A)}const H=t.camera-ot;if(H<ut||H>G){d.alpha[p]=0;continue}const Pe=L((H-1)/3,0,1);ue*=Pe*Pe*(3-2*Pe);let de=Ut*xe/h/H*.5*R.width+R.width/2,he=tt*xe/H*.5*R.height+R.height/2,me=0,ve=0;if(m>.001){const g=de-i.sx,A=he-i.sy,I=Math.hypot(g,A),q=Math.exp(-(g*g+A*A)/(c*c))*t.hoverFactor*m;t.hoverEffect===1&&I>.001?(me+=g/I*c*.5*q,ve+=A/I*c*.5*q):t.hoverEffect===2&&(me-=g*.6*q,ve-=A*.6*q)}for(const g of M){const A=g.age/ke,I=de-g.x,q=he-g.y,ae=Math.hypot(I,q);if(ae<.001)continue;const Yt=Math.exp(-Math.pow((ae-A*dt)/ht,2)),_e=L(ae/30,0,1),nt=Yt*(1-A)*(1-A)*56*_e*_e*(3-2*_e);me+=I/ae*nt,ve+=q/ae*nt}de+=me,he+=ve;const Ce=L((G-H)/(G-G*.9),0,1),at=L(f.reveal*1.6-J*.6,0,1);d.x[p]=de,d.y[p]=he,d.ahead[p]=H,d.alpha[p]=Ce*Ce*(3-2*Ce)*ue*at*at}return n},Vt=(t,o)=>{const n=zt(t,o),s=t.connectionDistance,l=Math.max(1,Math.ceil(R.width/s)+2),a=new Map;for(let c=0;c<n;c++){if(d.alpha[c]<.02)continue;const m=(Math.floor(d.y[c]/s)+1)*l+Math.floor(d.x[c]/s)+1,v=a.get(m);v?v.push(c):a.set(m,[c])}let h=0;const u=s*s;for(const[c,m]of a)for(const v of[0,1,l-1,l,l+1]){const T=v===0?m:a.get(c+v);if(T)for(let p=0;p<m.length;p++){const y=m[p];for(let _=v===0?p+1:0;_<T.length;_++){const B=T[_],oe=d.x[y]-d.x[B],Z=d.y[y]-d.y[B],J=oe*oe+Z*Z;if(J>u)continue;const $=L(1-Math.abs(d.ahead[y]-d.ahead[B])/18,0,1);if($<=0)continue;if(h>=st)return h;const le=1-Math.sqrt(J)/s,k=h*8;D[k]=d.x[y],D[k+1]=d.y[y],D[k+2]=d.x[B],D[k+3]=d.y[B],D[k+4]=(x.colors[y*3]+x.colors[B*3])/2,D[k+5]=(x.colors[y*3+1]+x.colors[B*3+1])/2,D[k+6]=(x.colors[y*3+2]+x.colors[B*3+2])/2,D[k+7]=le*le*$*.7*Math.min(d.alpha[y],d.alpha[B]),h++}}}return h},se=()=>{const t=z.current;Ot(t);const o=It(t),[n,s,l]=$e();if(e.viewport(0,0,P.width,P.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA),t.connections){const u=Vt(t,o);u&&(e.useProgram(V.program),e.bindVertexArray(Me),e.bindBuffer(e.ARRAY_BUFFER,Ee),e.bufferSubData(e.ARRAY_BUFFER,0,D.subarray(0,u*8)),e.uniform2f(V.uniforms.uView,R.width,R.height),e.uniform1f(V.uniforms.uRatio,R.ratio),e.uniform1f(V.uniforms.uWidth,1),e.uniform1f(V.uniforms.uOpacity,t.opacity),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,u))}const a=j.uniforms;let h=0;for(let u=M.length-1;u>=0&&h<ne;u--)Ne.set([M[u].x,M[u].y,M[u].age/ke,1],h*4),h++;e.useProgram(j.program),e.bindVertexArray(ge),e.uniformMatrix3fv(a.uRotation,!1,o),e.uniform3f(a.uOffset,n,s,l),e.uniform1f(a.uSpread,t.spread),e.uniform1f(a.uTime,f.clock),e.uniform1f(a.uCamera,t.camera),e.uniform1f(a.uAspect,R.width/R.height),e.uniform2f(a.uView,R.width,R.height),e.uniform1f(a.uRatio,R.ratio),e.uniform1f(a.uSize,t.size),e.uniform1f(a.uRandomness,t.randomness),e.uniform1f(a.uBlur,t.depthOfField*14),e.uniform1f(a.uFocus,t.camera+14),e.uniform1f(a.uGlow,t.lightMode?t.glow*.3:t.glow),e.uniform1f(a.uTwinkle,t.twinkle),e.uniform1i(a.uShape,t.shape),e.uniform1i(a.uDrift,t.drift),e.uniform1f(a.uTravel,f.travel),e.uniform4f(a.uPointer,i.sx,i.sy,i.active,t.hoverRadius),e.uniform1i(a.uEffect,t.hoverEffect),e.uniform1f(a.uStrength,t.hoverFactor),e.uniform4fv(a.uBursts,Ne),e.uniform1i(a.uBurstCount,h),e.uniform1f(a.uReveal,f.reveal),e.uniform1f(a.uSoft,t.soft?.2:0),e.uniform1f(a.uShimmer,t.lightMode?0:1),e.uniform1f(a.uOpacity,t.opacity),e.drawArraysInstanced(e.TRIANGLE_STRIP,0,4,x.count),e.bindVertexArray(null)},Be=t=>{if(S=0,!Y||document.hidden||Q)return;if(O&&t-O<Ue.frameInterval-1){S=requestAnimationFrame(Be);return}const o=z.current,n=O?L((t-O)/1e3,5e-4,.05):1/60;if(O=t,o.paused||C){f.reveal=1,se(),O=0;return}const s=C?0:1,l=n*o.speed*s;f.clock+=l,o.rotate&&(f.spin+=l*.6),f.travel+=n*o.driftSpeed*s*(o.drift===3?6:.9);const a=o.mouse&&i.inside&&!C,h=1-Math.exp(-n/.35),u=a&&o.hoverEffect===0?o.hoverFactor:0;f.offsetX+=(-i.nx*u-f.offsetX)*h,f.offsetY+=(-i.ny*u-f.offsetY)*h,i.sx+=(i.x-i.sx)*(1-Math.exp(-n/.06)),i.sy+=(i.y-i.sy)*(1-Math.exp(-n/.06)),i.active+=((a?1:0)-i.active)*(1-Math.exp(-n/.2));for(let c=M.length-1;c>=0;c--)M[c].age+=n,M[c].age>=ke&&M.splice(c,1);!o.intro||C?f.reveal=1:f.reveal<1&&(f.reveal=Math.min(1,f.reveal+n/jt)),se(),S=requestAnimationFrame(Be)},N=()=>{!S&&!Q&&Y&&!document.hidden&&(S=requestAnimationFrame(Be))},Le=()=>{const t=z.current,o=Math.max(1,W.clientWidth),n=Math.max(1,W.clientHeight),s=Ht(o,n,t.dpr,Ue);R.width=o,R.height=n,P.width=Math.max(1,Math.round(o*s)),P.height=Math.max(1,Math.round(n*s)),R.ratio=P.width/o,Q||se(),N()},He=t=>{const o=W.getBoundingClientRect(),n=t.clientX-o.left,s=t.clientY-o.top,l=i.inside;i.inside=n>=0&&s>=0&&n<=o.width&&s<=o.height,i.x=n,i.y=o.height-s,i.nx=n/Math.max(1,o.width)*2-1,i.ny=-(s/Math.max(1,o.height)*2-1),i.inside&&!l&&(i.sx=i.x,i.sy=i.y)},qe=t=>{!Y||document.hidden||C||C||(He(t),z.current.paused||N())},Xe=t=>{if(!Y||document.hidden||C||C)return;const o=z.current;He(t),!(!i.inside||!o.clickBurst||o.paused||C)&&(M.push({x:i.x,y:i.y,age:0}),M.length>ne&&M.shift(),N())},ce=t=>{t.pointerType!=="mouse"&&(i.inside=!1)},fe=()=>{i.inside=!1},Ge=()=>{document.hidden&&(cancelAnimationFrame(S),S=0,O=0),O=0,N()},We=t=>{C=t.matches,C&&(M.length=0,i.inside=!1,i.active=0,f.offsetX=f.offsetY=0,f.reveal=1),N()};Se.addEventListener("change",We);const je=t=>{t.preventDefault(),Q=!0,cancelAnimationFrame(S),S=0},Ke=()=>kt(t=>t+1);P.addEventListener("webglcontextlost",je),P.addEventListener("webglcontextrestored",Ke);const Qe=new ResizeObserver(Le);Qe.observe(W);const Ze=new IntersectionObserver(t=>{Y=t.some(o=>o.isIntersecting),Y||(cancelAnimationFrame(S),S=0,O=0),Y&&(O=0,N())});Ze.observe(W),window.addEventListener("pointermove",qe,{passive:!0}),window.addEventListener("pointerdown",Xe,{passive:!0}),window.addEventListener("pointerup",ce,{passive:!0}),window.addEventListener("pointercancel",ce,{passive:!0}),document.documentElement.addEventListener("pointerleave",fe),window.addEventListener("blur",fe),document.addEventListener("visibilitychange",Ge),Le();let Je=z.current.dpr;return Re.current=()=>{const t=z.current;if(t.dpr!==Je){Je=t.dpr,Le();return}!S&&!Q&&se(),N()},()=>{$t(P,e),cancelAnimationFrame(S),Re.current=null,Qe.disconnect(),Ze.disconnect(),window.removeEventListener("pointermove",qe),window.removeEventListener("pointerdown",Xe),window.removeEventListener("pointerup",ce),window.removeEventListener("pointercancel",ce),document.documentElement.removeEventListener("pointerleave",fe),window.removeEventListener("blur",fe),Se.removeEventListener("change",We),P.removeEventListener("webglcontextlost",je),P.removeEventListener("webglcontextrestored",Ke),document.removeEventListener("visibilitychange",Ge),!Q&&!e.isContextLost()&&(e.deleteProgram(j.program),e.deleteProgram(V.program),[ie,ye,Ae,be,Ee].forEach(t=>e.deleteBuffer(t)),e.deleteVertexArray(ge),e.deleteVertexArray(Me))}},[_t]),X.useEffect(()=>{Re.current?.()}),rt.jsx("div",{ref:Oe,className:`particles-container${De?` ${De}`:""}`,style:Ct,children:rt.jsx("canvas",{ref:Ie,className:"particles-canvas","aria-hidden":"true"})})};export{ao as default};
