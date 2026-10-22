/* A deformable paper surface, rendered locally with no animation/video assets. */
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const phase = (time, start, end) => smooth((time - start) / (end - start));
const mix = (a, b, t) => a + (b - a) * t;
const COLS = 72, ROWS = 22;

function surfaceTexture(kind, image) {
  const canvas = document.createElement('canvas');
  canvas.width = 768; canvas.height = 1046;
  const ctx = canvas.getContext('2d');
  if (kind === 'cover') {
    // Crop the photo surround without redrawing or changing the original lettering.
    ctx.beginPath();
    [[0,.022],[.06,.008],[1,.029],[1,.954],[.06,.985],[0,.97]].forEach(([x,y],i) => {
      if (i) ctx.lineTo(x * canvas.width, y * canvas.height);
      else ctx.moveTo(x * canvas.width, y * canvas.height);
    });
    ctx.closePath(); ctx.clip();
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }
  ctx.fillStyle = kind === 'lining' ? '#e0e9b5' : '#faf8eb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const gutter = ctx.createLinearGradient(0, 0, 86, 0);
  gutter.addColorStop(0, '#53624428'); gutter.addColorStop(1, '#53624400');
  ctx.fillStyle = gutter; ctx.fillRect(0, 0, 86, canvas.height);
  ctx.strokeStyle = '#7687614a'; ctx.lineWidth = 1.2;
  for (let y = 140; y < 940; y += 29) {
    if (y > 230 && y < 565) continue;
    ctx.beginPath(); ctx.moveTo(86,y); ctx.lineTo(682 - (y % 4) * 23,y); ctx.stroke();
  }
  ctx.fillStyle = kind === 'lining' ? '#81984e' : '#75936a';
  for (let y = 250; y < 545; y += 15) {
    for (let x = 93; x < 680; x += 15) {
      ctx.beginPath(); ctx.arc(x,y,1.1 + 1.8 * (.5 + .5 * Math.sin(x / 85 + y / 67)),0,Math.PI*2); ctx.fill();
    }
  }
  return canvas;
}

function makeRenderer(canvas, textures) {
  const gl = canvas.getContext('webgl', { alpha:true, antialias:true, premultipliedAlpha:false });
  if (!gl) return null;
  const shader = (type, source) => {
    const result = gl.createShader(type); gl.shaderSource(result,source); gl.compileShader(result);
    if (!gl.getShaderParameter(result,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(result));
    return result;
  };
  const vertex = shader(gl.VERTEX_SHADER, `
    attribute vec3 aPosition; attribute vec2 aUv; attribute float aLight;
    uniform vec2 uSize; varying vec2 vUv; varying float vLight;
    void main(){
      gl_Position=vec4(aPosition.x/uSize.x*2.0-1.0,1.0-aPosition.y/uSize.y*2.0,-aPosition.z/1600.0,1.0);
      vUv=aUv; vLight=aLight;
    }`);
  const fragment = shader(gl.FRAGMENT_SHADER, `
    precision mediump float; uniform sampler2D uFront; uniform sampler2D uBack;
    varying vec2 vUv; varying float vLight;
    void main(){
      vec4 paper=gl_FrontFacing?texture2D(uFront,vUv):texture2D(uBack,vec2(1.0-vUv.x,vUv.y));
      if(paper.a<0.02) discard;
      float light=gl_FrontFacing?vLight:0.93-(vLight-0.86)*0.45;
      gl_FragColor=vec4(paper.rgb*clamp(light,0.62,1.08),paper.a);
    }`);
  const program = gl.createProgram(); gl.attachShader(program,vertex); gl.attachShader(program,fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error('Paper renderer could not initialize.');
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for (const [name,size,offset] of [['aPosition',3,0],['aUv',2,12],['aLight',1,20]]) {
    const loc=gl.getAttribLocation(program,name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,gl.FLOAT,false,24,offset);
  }
  const indices=[];
  for (let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) {
    const a=y*(COLS+1)+x,b=a+1,c=a+COLS+1,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const indexBuffer=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  const gpuTextures=textures.map(source=>{
    const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
    return texture;
  });
  gl.uniform1i(gl.getUniformLocation(program,'uFront'),0);
  gl.uniform1i(gl.getUniformLocation(program,'uBack'),1);
  const sizeLoc=gl.getUniformLocation(program,'uSize');
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.clearColor(0,0,0,0);
  return {
    resize(width,height) {
      const ratio=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.round(width*ratio); canvas.height=Math.round(height*ratio);
      gl.viewport(0,0,canvas.width,canvas.height); gl.uniform2f(sizeLoc,width,height);
    },
    clear() { gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); },
    draw(vertices,front,back) {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,gpuTextures[front]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,gpuTextures[back]);
      gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    }
  };
}

// Each row integrates a different tangent field. This creates a continuous curl
// and a diagonal, trailing page corner rather than a single rotating rectangle.
function paperMesh({spine,cy,w,h,turn,layer,rotation,base=false}) {
  const result=new Float32Array((COLS+1)*(ROWS+1)*6);
  const bend=Math.sin(Math.PI*turn);
  const zRotation=rotation||0, cosR=Math.cos(zRotation),sinR=Math.sin(zRotation);
  let index=0;
  for(let row=0;row<=ROWS;row++) {
    const v=row/ROWS;
    let x=0,z=layer;
    for(let col=0;col<=COLS;col++) {
      const u=col/COLS;
      const angle=turn*Math.PI + bend*(-1.02*Math.cos(Math.PI*u)+.42*(v-.5)+.20*Math.sin(Math.PI*2*u-turn*2));
      if(col) {
        const midU=(col-.5)/COLS;
        const tangent=turn*Math.PI+bend*(-1.02*Math.cos(Math.PI*midU)+.42*(v-.5)+.20*Math.sin(Math.PI*2*midU-turn*2));
        x+=Math.cos(tangent)*w/COLS;
        z+=Math.sin(tangent)*w/COLS;
      }
      let py=(v-.5)*h + bend*Math.sin(Math.PI*u)*Math.pow(v,2)*h*.065;
      const px=x*cosR-py*sinR, ry=x*sinR+py*cosR;
      const perspective=2400/(2400-z*.55);
      result[index++]=spine+px*perspective;
      result[index++]=cy+ry*perspective;
      result[index++]=z;
      result[index++]=u; result[index++]=v;
      result[index++]=base?1: .88+.17*Math.cos(angle)-.13*Math.sin(angle);
    }
  }
  return result;
}

export function createSoftBookIntro({hero,entrance,image,motion,onFinish}) {
  let overlay,canvas,shadow,renderer,frame=0,running=false;
  let started=0,source,view;
  const total=6400;
  function stop() {
    if(frame) cancelAnimationFrame(frame);
    frame=0; running=false;
    if(overlay) { overlay.hidden=true; overlay.style.opacity='0'; }
    hero.classList.remove('book-intro-active');
    entrance.style.removeProperty('visibility');
    onFinish();
  }
  function initialize() {
    if(renderer) return true;
    if(overlay) overlay.remove();
    overlay=document.createElement('div'); overlay.className='soft-book-overlay'; overlay.hidden=true; overlay.setAttribute('aria-hidden','true');
    shadow=document.createElement('div'); shadow.className='soft-book-shadow';
    canvas=document.createElement('canvas'); canvas.className='soft-book-canvas';
    overlay.append(shadow,canvas); document.body.append(overlay);
    try {
      renderer=makeRenderer(canvas,[surfaceTexture('cover',image),surfaceTexture('paper'),surfaceTexture('lining')]);
    } catch(error) { console.warn('Book animation unavailable:',error.message); }
    canvas.addEventListener('webglcontextlost',event=>{ event.preventDefault(); renderer=null; stop(); });
    return !!renderer;
  }
  function render(time) {
    if(!running) return;
    if(!started) started=time;
    const t=time-started;
    const arrive=phase(t,0,950),returning=phase(t,5350,total);
    const focused=arrive*(1-returning);
    let w=mix(source.w,view.w,focused),h=mix(source.h,view.h,focused);
    const cx=mix(source.cx,view.cx,focused),cy=mix(source.cy,view.cy,focused);
    const cover=phase(t,1250,2500)*(1-phase(t,4250,5250));
    const leafOne=phase(t,2050,3400)*(1-phase(t,4050,4850));
    const leafTwo=phase(t,2750,4000)*(1-phase(t,3900,4550));
    const spread=phase(t,1250,2500)*(1-phase(t,4250,5250));
    // A portrait screen first shows a large closed cover, then makes room for
    // the two-page spread without clipping the curling outer edge.
    const fit=mix(1,Math.min(1,innerWidth*.44/w),spread);
    w*=fit; h*=fit;
    const spine=cx-w*.5*(1-spread);
    const rotation=-.035*(1-focused);
    const fade=1-phase(t,total-180,total);
    overlay.style.opacity='1';
    overlay.style.backgroundColor=`rgba(238,241,220,${.92*phase(t,0,400)*fade})`;
    canvas.style.opacity=String(fade);
    entrance.style.visibility=t>total-180?'visible':'hidden';
    Object.assign(shadow.style,{left:`${cx-w*(.5+spread*.5)}px`,top:`${cy+h*.35}px`,width:`${w*(1+spread)}px`,height:`${h*.19}px`,opacity:String((.15+.06*Math.sin(Math.PI*cover))*fade)});
    renderer.clear();
    if(cover>.001) {
      renderer.draw(paperMesh({spine:spine+w*.035,cy,w:w*.94,h:h*.95,turn:0,layer:0,rotation,base:true}),1,1);
      renderer.draw(paperMesh({spine,cy,w,h,turn:leafTwo,layer:10-4*leafTwo,rotation}),1,1);
      renderer.draw(paperMesh({spine,cy,w,h,turn:leafOne,layer:14-10*leafOne,rotation}),1,1);
    }
    renderer.draw(paperMesh({spine,cy,w,h,turn:cover,layer:18-16*cover,rotation}),0,2);
    if(t<total) frame=requestAnimationFrame(render); else stop();
  }
  function play() {
    stop();
    if(motion.matches || !image.complete || !image.naturalWidth) return false;
    const heroBox=hero.getBoundingClientRect();
    if(heroBox.bottom<160 || heroBox.top>innerHeight) return false;
    if(!initialize()) return false;
    const rect=image.getBoundingClientRect();
    const navBottom=Math.max(0,document.querySelector('.site-masthead').getBoundingClientRect().bottom);
    const availableHeight=innerHeight-navBottom;
    source={cx:rect.left+rect.width/2,cy:rect.top+rect.height/2-navBottom,w:rect.width,h:rect.height};
    const h=Math.min(760,availableHeight*.83,innerWidth*.74/ (768/1046));
    view={cx:innerWidth/2,cy:availableHeight/2,w:h*768/1046,h};
    overlay.style.top=`${navBottom}px`;
    renderer.resize(innerWidth,availableHeight);
    overlay.hidden=false; overlay.style.opacity='0';
    hero.classList.add('book-intro-active'); entrance.style.visibility='hidden';
    started=0; running=true; frame=requestAnimationFrame(render);
    return true;
  }
  return {play,stop,get running(){return running;}};
}
