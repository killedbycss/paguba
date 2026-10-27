(() => {
  const shell = document.querySelector("#thirdShell");
  if (!shell) return;
  const canvas = document.querySelector("#languageCanvas");
  const imageLayer = document.querySelector("#thirdImage");
  const credits = document.querySelector("#thirdCredits");
  const hint = document.querySelector("#thirdHint");
  const choices = document.createElement("div");
  choices.className = "third-choice-zones";
  choices.innerHTML = '<button type="button" data-choice="yes" aria-label="Да"></button><button type="button" data-choice="no" aria-label="Нет"></button>';
  shell.append(choices);
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "high-performance" });
  if (!gl) return;

  const vertex = `attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
  const fragment = `
    precision highp float;varying vec2 uv;
    uniform sampler2D maskA,maskB;uniform vec2 resolution,pointer,clickPoint;
    uniform float time,morph,activity,clickAge;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.07+13.7;a*=.5;}return v;}
    void main(){
      vec2 aspect=vec2(resolution.x/resolution.y,1.);
      float n=fbm(uv*5.2+vec2(time*.045,-time*.032));
      vec2 warp=vec2(fbm(uv*7.+n+time*.025),fbm(uv*6.-n-time*.021))-.5;
      float oldShape=texture2D(maskA,uv+warp*.018).r;
      float form=smoothstep(.24,1.,morph);
      float spread=mix(.075,.006,form);
      vec2 sx=vec2(spread,0.),sy=vec2(0.,spread);
      float newShape=texture2D(maskB,uv-warp*spread).r*.34;
      newShape+=texture2D(maskB,uv+sx+warp*.012).r*.165;
      newShape+=texture2D(maskB,uv-sx-warp*.012).r*.165;
      newShape+=texture2D(maskB,uv+sy-warp*.012).r*.165;
      newShape+=texture2D(maskB,uv-sy+warp*.012).r*.165;
      float oldFade=1.-smoothstep(.02,.3,morph);
      float newFade=smoothstep(.22,.72,morph);
      float dissolve=.72+.28*noise(uv*9.+time*.06);
      float field=max(oldShape*oldFade,newShape*newFade*dissolve);
      float smoke=fbm(uv*12.+warp*3.+time*.06);
      field=smoothstep(.07,.74,field+smoke*.13-.075);
      float cursor=exp(-length((uv-pointer)*aspect)*11.)*(.13+.34*activity)*(.45+.55*smoke);
      float age=max(clickAge,0.);float radius=age*.38;
      float ring=exp(-abs(length((uv-clickPoint)*aspect)-radius)*72.)*exp(-age*1.25);
      float sparks=step(.91,noise(uv*resolution*.075+time*2.3))*smoothstep(.02,.7,field+cursor+ring);
      float ink=clamp(field*.91+cursor*.48+ring*(.46+.4*smoke)+sparks*.22,0.,1.);
      gl_FragColor=vec4(0.,0.,0.,ink);
    }`;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,"p");gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const u=Object.fromEntries(["maskA","maskB","resolution","pointer","clickPoint","time","morph","activity","clickAge"].map(name=>[name,gl.getUniformLocation(program,name)]));
  const masks=[document.createElement("canvas"),document.createElement("canvas")];
  const shape=document.createElement("canvas");
  const textures=[gl.createTexture(),gl.createTexture()];
  textures.forEach((texture,index)=>{gl.activeTexture(gl.TEXTURE0+index);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);});
  gl.uniform1i(u.maskA,0);gl.uniform1i(u.maskB,1);

  const svg={};
  const assetPaths={hand:"content/ElementsPart3/Hand.svg",human:"content/ElementsPart3/Human.svg",brain:"content/ElementsPart3/Bain.svg"};
  const assetsReady=Promise.all(Object.entries(assetPaths).map(([name,src])=>new Promise(resolve=>{const image=new Image();image.onload=()=>{svg[name]=image;resolve();};image.onerror=resolve;image.src=src;})));
  let scene="blank",pointer=[.5,.5],clickPoint=[.5,.5],clickStarted=-10000,activity=0,morph=1,morphStarted=0,transitioning=false,pendingAdvance=false,ready=false;
  let humanDone=false,sphereDone=false,queue=[],queueDone=null,creditsTimer,imageTimer,currentImage="",thirdSoundtrack,soundtrackStarting=false;
  const MORPH_MS=1750,IMAGE_MS=4900;

  function drawAsset(ctx,name,cx,cy,height){const img=svg[name];if(!img)return;const ratio=img.width/img.height;ctx.drawImage(img,cx-height*ratio/2,cy-height/2,height*ratio,height);}
  function arrow(ctx,x1,y1,x2,y2,size){const a=Math.atan2(y2-y1,x2-x1);ctx.lineWidth=size*.022;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x2-Math.cos(a-.72)*size*.075,y2-Math.sin(a-.72)*size*.075);ctx.moveTo(x2,y2);ctx.lineTo(x2-Math.cos(a+.72)*size*.075,y2-Math.sin(a+.72)*size*.075);ctx.stroke();}
  function cross(ctx,x,y,size){ctx.lineWidth=size*.04;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x-size*.1,y-size*.1);ctx.lineTo(x+size*.1,y+size*.1);ctx.moveTo(x+size*.1,y-size*.1);ctx.lineTo(x-size*.1,y+size*.1);ctx.stroke();}
  function question(ctx,x,y,size){ctx.save();ctx.translate(x,y);ctx.lineWidth=size*.075;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-size*.16,-size*.24);ctx.bezierCurveTo(size*.2,-size*.43,size*.29,-size*.13,size*.08,size*.02);ctx.bezierCurveTo(-size*.015,size*.09,0,size*.16,0,size*.21);ctx.stroke();ctx.beginPath();ctx.arc(0,size*.35,size*.047,0,Math.PI*2);ctx.fill();ctx.restore();}
  function composeMask(target,next){
    const w=target.width,h=target.height,s=Math.min(w,h),x=w/2,y=h/2,t=shape.getContext("2d");
    t.clearRect(0,0,w,h);t.fillStyle="#000";t.strokeStyle="#000";
    if(next==="question")question(t,x,y,s*.44);
    if(/^choice/.test(next))t.fillRect(w*.5,-h*.05,w*.56,h*1.1);
    if(next==="hand")drawAsset(t,"hand",x,y,s*.55);
    if(next==="handQuestion"){drawAsset(t,"hand",w*.16,y,s*.27);arrow(t,w*.36,y,w*.61,y,s);question(t,w*.84,y,s*.19);}
    if(next==="personQuestion"){drawAsset(t,"human",w*.16,y,s*.29);arrow(t,w*.36,y,w*.61,y,s);question(t,w*.84,y,s*.19);}
    if(next==="personHead"){drawAsset(t,"human",w*.16,y,s*.28);arrow(t,w*.36,y,w*.61,y,s);t.beginPath();t.arc(w*.84,y,s*.047,0,Math.PI*2);t.fill();}
    if(next==="headBrain"){t.beginPath();t.arc(w*.15,y,s*.052,0,Math.PI*2);t.fill();arrow(t,w*.36,y,w*.61,y,s);drawAsset(t,"brain",w*.85,y,s*.22);}
    if(next==="handBrain"){drawAsset(t,"hand",w*.15,y,s*.25);arrow(t,w*.36,y,w*.61,y,s);drawAsset(t,"brain",w*.85,y,s*.22);}
    if(next==="blackHand")drawAsset(t,"hand",x,y,s*.58);
    if(next==="voidPoint"){t.fillRect(-50,-50,w+100,h+100);t.globalCompositeOperation="destination-out";t.beginPath();t.arc(x,y,s*.027,0,Math.PI*2);t.fill();t.globalCompositeOperation="source-over";}
    if(next==="sphereArrowsHand"){
      drawAsset(t,"hand",x,y,s*.18);
      arrow(t,w*.18,h*.34,w*.08,h*.17,s*.8);
      arrow(t,w*.82,h*.34,w*.92,h*.17,s*.8);
      arrow(t,w*.18,h*.66,w*.08,h*.83,s*.8);
      arrow(t,w*.82,h*.66,w*.92,h*.83,s*.8);
    }
    if(next==="spherePerson"){drawAsset(t,"human",w*.84,y,s*.23);arrow(t,w*.68,y,w*.52,y,s);}
    if(next==="personCross"){cross(t,w*.28,y,s*.82);drawAsset(t,"human",w*.8,y,s*.28);}
    if(next==="brainCross"){drawAsset(t,"brain",w*.22,y,s*.23);cross(t,w*.72,y,s*.82);}
    if(next==="sphereQuestion")question(t,w*.8,y,s*.22);
    t.globalCompositeOperation="source-in";t.fillStyle="#fff";t.fillRect(0,0,w,h);t.globalCompositeOperation="source-over";
    const c=target.getContext("2d");c.clearRect(0,0,w,h);c.save();c.filter=`blur(${Math.max(2,s*.003)}px)`;c.globalAlpha=.82;c.drawImage(shape,0,0);c.filter=`blur(${Math.max(6,s*.009)}px)`;c.globalAlpha=.18;c.drawImage(shape,0,0);c.restore();
  }
  function upload(index){gl.activeTexture(gl.TEXTURE0+index);gl.bindTexture(gl.TEXTURE_2D,textures[index]);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,gl.LUMINANCE,gl.UNSIGNED_BYTE,masks[index]);}
  function showImage(src){
    if(src===currentImage)return;
    clearTimeout(imageTimer);imageLayer.classList.remove("is-visible");
    const replace=()=>{currentImage=src;if(!src){imageLayer.innerHTML="";return;}imageLayer.innerHTML=`<img class="third-image-back" src="${src}" alt=""><img class="third-image-front" src="${src}" alt="">`;requestAnimationFrame(()=>requestAnimationFrame(()=>imageLayer.classList.add("is-visible")));};
    imageTimer=setTimeout(replace,currentImage?1500:0);
  }
  function setScene(next,image="",instant=false){
    if(!instant&&transitioning)return false;
    const imageChanged=image!==currentImage;
    scene=next;shell.dataset.scene=next;choices.classList.remove("is-visible");showImage(image);
    const a=masks[0].getContext("2d");a.clearRect(0,0,masks[0].width,masks[0].height);a.drawImage(masks[1],0,0);upload(0);composeMask(masks[1],next);upload(1);
    morph=instant?1:0;morphStarted=performance.now();transitioning=!instant;
    if(instant)choices.classList.toggle("is-visible",/^choice/.test(next));else setTimeout(()=>{
      transitioning=false;
      choices.classList.toggle("is-visible",/^choice/.test(scene));
      if(/^choice/.test(scene))pendingAdvance=false;
      else if(pendingAdvance){pendingAdvance=false;requestAnimationFrame(advance);}
    },imageChanged?IMAGE_MS:MORPH_MS);
    return true;
  }
  function resize(){const mobile=matchMedia("(max-width:760px)").matches,dpr=Math.min(mobile?1.2:1.65,devicePixelRatio||1);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);const mw=Math.min(1400,canvas.width),mh=Math.min(920,canvas.height);[...masks,shape].forEach(c=>{c.width=mw;c.height=mh;});gl.viewport(0,0,canvas.width,canvas.height);composeMask(masks[1],scene);upload(0);upload(1);}
  function playSequence(items,done){queue=[...items];queueDone=done;showNext();}
  function showNext(){if(transitioning)return;if(!queue.length){const done=queueDone;queueDone=null;done?.();return;}const item=queue.shift();setScene(item.scene||"blank",item.image||"");if(item.autoDone)setTimeout(()=>{transitioning=false;showNext();},Math.max(item.autoDone,MORPH_MS));}
  const humanSequence=()=>playSequence([{scene:"personQuestion"},{scene:"personHead"},{scene:"headBrain"},{scene:"handBrain"}],()=>{humanDone=true;sphereDone?finishStory():startSphere();});
  const startSphere=()=>playSequence([{scene:"blackHand"},{scene:"voidPoint"},{scene:"blank",image:"content/ImagesPart2/CH8_Sphere.png"},{scene:"sphereArrowsHand",image:"content/ImagesPart2/CH8_Sphere.png"},{scene:"spherePerson",image:"content/ImagesPart2/CH8_Sphere.png"},{scene:"personCross"},{scene:"brainCross"},{scene:"sphereQuestion",image:"content/ImagesPart2/CH8_Sphere.png"}],()=>{sphereDone=true;humanDone?finishStory():setScene("choice3");});
  function finishStory(){playSequence([{scene:"blank",image:"content/ImagesPart2/CH8_Cataclism.png"},{scene:"blank",image:"content/ImagesPart2/CH8_Destruct.png",autoDone:7000}],()=>{setScene("blank");shell.classList.remove("is-ready");clearTimeout(creditsTimer);creditsTimer=setTimeout(()=>{credits.classList.add("is-visible");credits.setAttribute("aria-hidden","false");},1500);});}
  function advance(){if(!ready||credits.classList.contains("is-visible"))return;if(transitioning){pendingAdvance=true;return;}activity=1;clickStarted=performance.now();if(queue.length||queueDone){showNext();return;}if(scene==="blank")setScene("question");else if(scene==="question")setScene("choice1");else if(scene==="hand")setScene("handQuestion");else if(scene==="handQuestion")setScene("choice2");}
  function choose(yes){if(transitioning)return;activity=1;clickStarted=performance.now();if(scene==="choice1")yes?setScene("hand"):setScene("question");else if(scene==="choice2")yes?humanSequence():startSphere();else if(scene==="choice3")yes?humanSequence():finishStory();}
  function startThirdSoundtrack(){
    if(!thirdSoundtrack||soundtrackStarting||(!thirdSoundtrack.paused&&thirdSoundtrack.volume>.07))return;
    soundtrackStarting=true;thirdSoundtrack.volume=0;
    thirdSoundtrack.play().then(()=>{const started=performance.now();const fade=now=>{const p=Math.min(1,(now-started)/1800);thirdSoundtrack.volume=.085*p;if(p<1)requestAnimationFrame(fade);else soundtrackStarting=false;};requestAnimationFrame(fade);}).catch(()=>{soundtrackStarting=false;});
  }
  choices.addEventListener("pointerup",event=>{event.stopPropagation();clickPoint=[event.clientX/innerWidth,1-event.clientY/innerHeight];const b=event.target.closest("button");if(b)choose(b.dataset.choice==="yes");});
  shell.addEventListener("pointermove",event=>{pointer=[event.clientX/innerWidth,1-event.clientY/innerHeight];activity=Math.min(1,activity+.1);});
  shell.addEventListener("pointerdown",startThirdSoundtrack);
  shell.addEventListener("pointerup",event=>{if(!event.target.closest(".third-choice-zones")){clickPoint=[event.clientX/innerWidth,1-event.clientY/innerHeight];advance();}});
  window.addEventListener("resize",resize);
  function frame(now){activity*=.955;if(transitioning)morph=Math.min(1,(now-morphStarted)/MORPH_MS);gl.uniform2f(u.resolution,canvas.width,canvas.height);gl.uniform2f(u.pointer,...pointer);gl.uniform2f(u.clickPoint,...clickPoint);gl.uniform1f(u.time,now*.001);gl.uniform1f(u.morph,morph);gl.uniform1f(u.activity,activity);gl.uniform1f(u.clickAge,(now-clickStarted)/1000);gl.drawArrays(gl.TRIANGLES,0,6);requestAnimationFrame(frame);}
  resize();requestAnimationFrame(frame);
  window.enterThirdShell=async soundtrack=>{await assetsReady;resize();shell.hidden=false;shell.classList.remove("is-white","is-ready");credits.classList.remove("is-visible");credits.setAttribute("aria-hidden","true");ready=false;humanDone=false;sphereDone=false;queue=[];queueDone=null;pendingAdvance=false;setScene("blank","",true);thirdSoundtrack=soundtrack;thirdSoundtrack.src="content/Soundtrack/Запределье.mp3";thirdSoundtrack.loop=true;thirdSoundtrack.volume=0;startThirdSoundtrack();setTimeout(()=>shell.classList.add("is-white"),80);setTimeout(()=>{ready=true;shell.classList.add("is-ready");hint.hidden=true;},1900);};
})();
