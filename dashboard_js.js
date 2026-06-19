var chartInstances={};
var _builtSubTab={};
var _activeTab='visao-geral';
var _activeSubTabs={};

// ChartDataLabels se registra globalmente — desabilitar por padrao
// e ativar apenas nos graficos que precisam (buildVGAtingimento, buildMonthlyProgress)
if(typeof ChartDataLabels!=='undefined'){
  Chart.defaults.plugins.datalabels={display:false};
}

function fmt(v){
  if(v===null||v===undefined)return '-';
  var av=Math.abs(v),s=v<0?'-':'';
  if(av>=1e6)return s+'R$ '+(av/1e6).toFixed(2).replace('.',',')+' M';
  if(av>=1e3)return s+'R$ '+(av/1e3).toFixed(1).replace('.',',')+' K';
  return s+'R$ '+Math.round(av).toLocaleString('pt-BR');
}
function fmtMeta(v){return fmt(v);}
function fmtN(v){
  if(!v&&v!==0)return '-';
  var av=Math.abs(v),s=v<0?'-':'';
  if(av>=1e6)return s+(av/1e6).toFixed(1).replace('.',',')+' M';
  if(av>=1e3)return s+(av/1e3).toFixed(1).replace('.',',')+' K';
  return s+Math.round(av).toLocaleString('pt-BR');
}
function pctNum(a,b){return b?(a/b*100):0;}
function pillHtml(a,b){
  var p=pctNum(a,b);
  var cls=p>=100?'pill-green':p>=80?'pill-yellow':'pill-red';
  return '<span class="pill '+cls+'">'+p.toFixed(1)+'%</span>';
}
function kpiHtml(arr){
  return arr.map(function(k){
    return '<div class="kpi-card '+(k.cls||'')+'"><div class="kpi-label">'+k.label+'</div><div class="kpi-value">'+k.val+'</div><div class="kpi-sub">'+(k.sub||'')+'</div></div>';
  }).join('');
}
function destroyChart(id){
  if(chartInstances[id]){chartInstances[id].destroy();delete chartInstances[id];}
}
function heatBg(p){
  return p>=100?'#00A650':p>=90?'#43B97F':p>=80?'#FFB900':p>=65?'#FF8C00':'#F23D4F';
}

// ÔöÇÔöÇ YTD helpers ÔöÇÔöÇ
function ytdReal(g){return PERIODO.reduce(function(s,k){return s+((REAL_MENSAL[g]||{})[k]||0);},0);}
function ytdMF(g){return PERIODO.reduce(function(s,k){return s+((META_FIN[g]||{})[k]||0);},0);}
function ytdMD(g){return PERIODO.reduce(function(s,k){return s+((META_DES[g]||{})[k]||0);},0);}
function ytdSI(g){return PERIODO.reduce(function(s,k){return s+((REAL_SI[g]||{})[k]||0);},0);}
function ytdInvAds(g){return PERIODO.reduce(function(s,k){return s+((REAL_INV_ADS[g]||{})[k]||0);},0);}
function ytdCupons(g){return PERIODO.reduce(function(s,k){return s+((REAL_CUPONS[g]||{})[k]||0);},0);}
function ytdInvTot(g){return PERIODO.reduce(function(s,k){return s+((REAL_INV_TOT[g]||{})[k]||0);},0);}
function ytdFF(g){return PERIODO.reduce(function(s,k){return s+((REAL_FF[g]||{})[k]||0);},0);}
function ytdXD(g){return PERIODO.reduce(function(s,k){return s+((REAL_XD[g]||{})[k]||0);},0);}
function ytdTGMV(g){return PERIODO.reduce(function(s,k){return s+((REAL_TGMV[g]||{})[k]||0);},0);}
function ytdNMV(g){return PERIODO.reduce(function(s,k){return s+((REAL_NMV[g]||{})[k]||0);},0);}
function ytdVC(g){return PERIODO.reduce(function(s,k){return s+((typeof REAL_VC!=='undefined'&&REAL_VC[g]||{})[k]||0);},0);}
function ytdDC(g){return PERIODO.reduce(function(s,k){return s+((typeof REAL_DC!=='undefined'&&REAL_DC[g]||{})[k]||0);},0);}
function aprProj(g){
  var cur=MESES_DONE[MESES_DONE.length-1];
  return ((REAL_MENSAL[g]||{})[cur]||0)*FAT_PROJ;
}

// ÔöÇÔöÇ Quarters ÔöÇÔöÇ
function qtdReal(g,q){return QUARTER_KEYS[q].reduce(function(s,k){return s+((REAL_MENSAL[g]||{})[k]||0);},0);}
function qtdMF(g,q){return QUARTER_KEYS[q].reduce(function(s,k){return s+((META_FIN[g]||{})[k]||0);},0);}
function qtdMD(g,q){return QUARTER_KEYS[q].reduce(function(s,k){return s+((META_DES[g]||{})[k]||0);},0);}
function qStatus(q){
  var last=MESES_KEYS.indexOf(QUARTER_KEYS[q][2]);
  var done=MESES_DONE.length?MESES_KEYS.indexOf(MESES_DONE[MESES_DONE.length-1]):-1;
  if(done>last)return 'closed';
  if(done<MESES_KEYS.indexOf(QUARTER_KEYS[q][0]))return 'future';
  return 'partial';
}
function quarterCardHtml(grupo,q){
  var status=qStatus(q),qR=qtdReal(grupo,q),qMF=qtdMF(grupo,q),qMD=qtdMD(grupo,q),pFin=pctNum(qR,qMF);
  var sLabel=status==='closed'?'Fechado':status==='partial'?'Em andamento':'Futuro';
  var clr=status==='future'?'q-grey':status==='partial'?'q-blue':pFin>=100?'q-green':'q-red';
  var fillCls=pFin>=100?'pf-green':pFin>=80?'pf-yellow':'pf-red';
  var h='<div class="quarter-card '+clr+'"><div class="quarter-label">'+q+' <span class="quarter-badge">'+sLabel+'</span></div>';
  h+='<div class="quarter-real">'+(qR>0?fmt(qR):'-')+'</div>';
  h+='<div class="quarter-meta-line">Meta Fin: '+fmt(qMF)+'</div>';
  h+='<div class="quarter-meta-line" style="color:#888;font-size:10px">Meta Des: '+fmt(qMD)+'</div>';
  if(qR>0){
    h+='<div style="font-size:11px;margin-bottom:5px">'+pillHtml(qR,qMF)+' Fin &nbsp;'+pillHtml(qR,qMD)+' Des</div>';
    h+='<div class="progress-wrap"><div class="progress-fill '+fillCls+'" style="width:'+Math.min(pFin,100).toFixed(1)+'%"></div></div>';
  }
  h+='</div>';
  return h;
}

// ÔöÇÔöÇ Navigation ÔöÇÔöÇ
function showTab(name,el){
  document.querySelectorAll('.tab-content').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('#sidebar a').forEach(function(a){a.classList.remove('active');});
  document.getElementById('tab-'+name).classList.add('active');
  if(el)el.classList.add('active');
  _activeTab=name;
  if(name!=='visao-geral'){
    var g=PREFIX_TO_GRUPO[name];
    if(g&&!_builtSubTab[name+'-geral']){
      _builtSubTab[name+'-geral']=true;
      buildGrupo(g,name);
      buildMesControl(g,name);
    }
  }
}
function showSubTab(prefix,name,btnEl){
  var tabEl=document.getElementById(prefix+'-inner-tabs');
  if(tabEl)tabEl.querySelectorAll('.inner-tab').forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('[id^="'+prefix+'-section-"]').forEach(function(s){s.classList.remove('active');});
  var sec=document.getElementById(prefix+'-section-'+name);
  if(sec)sec.classList.add('active');
  if(btnEl)btnEl.classList.add('active');
  _activeSubTabs[prefix]=name;
  var key=prefix+'-'+name;
  if(!_builtSubTab[key]){
    _builtSubTab[key]=true;
    var g=PREFIX_TO_GRUPO[prefix];
    if(name==='full'){if(g)buildSellerFull(g,prefix);else{_builtSubTab[key]=false;setTimeout(buildLogistica,50);}}
    else if(name==='ads'){if(g)buildSellerADS(g,prefix);else buildADS();}
    else if(name==='inv'){if(g)buildSellerInv(g,prefix);else{buildInvestimentos();setTimeout(buildPreNeg,300);}}
    else if(name==='cat'){if(g)buildSellerCat(g,prefix);else{_builtSubTab[key]=false;buildVGCat();}}
    else if(name==='bpc'){if(g)buildSellerBPC(g,prefix);else{_builtSubTab[key]=false;buildVGBPC();}}
    else if(name==='vis'){buildVisitasConversao();}
    else if(name==='cat2'){if(g)buildCategorias(g,prefix);}
    else if(name==='yoy'){if(g)buildYoY(g,prefix);}
    else if(name==='comp'){if(g)buildComp(g,prefix);}
    else if(name==='vis'){buildVisitasConversao();}
    else if(name==='optin'){buildOptinMTDTab();}
    else if(name==='combo'){buildCombo();}
    else if(name==='vis'){buildVisitasConversao();}
    else if(name==='hoje'&&!g){buildGMVHoje();}
    else if(name==='preneg'&&!g){buildInvestimentos();setTimeout(buildPreNeg,300);}
  }
}

// ÔöÇÔöÇ Filtro ÔöÇÔöÇ
function setFiltro(preset,btnEl){
  var keys=[];
  if(preset==='ytd')keys=MESES_DONE_FULL.slice();
  else if(preset==='mtd')keys=[MESES_DONE_FULL[MESES_DONE_FULL.length-1]];
  else if(preset==='q1'||preset==='q2'||preset==='q3'||preset==='q4'){
    var qk=Q_MAP[preset.toUpperCase()];
    keys=qk.filter(function(k){return MESES_DONE_FULL.indexOf(k)>=0;});
  }
  else if(preset==='ult30')keys=[MESES_DONE_FULL[MESES_DONE_FULL.length-1]];
  else if(preset==='ult3m')keys=MESES_DONE_FULL.slice(-3);
  else if(preset.startsWith('mes_')){
    var mk=preset.replace('mes_','');
    if(MESES_DONE_FULL.indexOf(mk)>=0)keys=[mk];
  }
  if(!keys.length)keys=MESES_DONE_FULL.slice();
  PERIODO=keys;
  document.querySelectorAll('#filtro-bar .filtro-pill').forEach(function(b){b.classList.remove('active');});
  if(btnEl)btnEl.classList.add('active');
  updateFiltroInfo();
  rebuildAll();
}
function updateFiltroInfo(){
  var el=document.getElementById('filtro-info');
  if(!el)return;
  if(PERIODO.length===MESES_DONE_FULL.length)
    el.textContent='Jan – '+(MESES_PT_CURTO[PERIODO[PERIODO.length-1]]||'')+' (YTD)';
  else
    el.textContent=PERIODO.map(function(k){return MESES_PT_CURTO[k];}).join(', ');
}
function applyDateRange(){
  var dtI=document.getElementById('dt-inicio'),dtF=document.getElementById('dt-fim');
  if(!dtI||!dtF)return;
  var start=new Date(dtI.value+'T00:00:00'),end=new Date(dtF.value+'T23:59:59');
  var keys=MESES_DONE_FULL.filter(function(mk){
    var idx=MESES_KEYS.indexOf(mk);
    var ms=new Date(2026,idx,1),me=new Date(2026,idx+1,0,23,59,59);
    return ms<=end&&me>=start;
  });
  if(!keys.length)return;
  PERIODO=keys;
  document.querySelectorAll('#filtro-bar .filtro-pill').forEach(function(b){b.classList.remove('active');});
  updateFiltroInfo();rebuildAll();
}
function togglePresentation(){
  document.body.classList.toggle('presentation-mode');
  var btn=document.getElementById('btn-present');
  if(btn)btn.textContent=document.body.classList.contains('presentation-mode')?'🚪 Sair':'📊 Apresentar';
}
function rebuildAll(){
  var curTab=_activeTab||'visao-geral';
  var curSubTabs=JSON.parse(JSON.stringify(_activeSubTabs||{}));
  Object.keys(chartInstances).forEach(function(k){destroyChart(k);});
  _builtSubTab={};
  // Always rebuild visao-geral data
  buildVisaoGeral();
  buildVGQuarters();
  buildVGMesControl();
  setTimeout(buildVGAtingimento,150);
  // Rebuild VG sub-tabs that were open
  var openVGSub = curSubTabs['vg']||'';
  if(openVGSub==='bpc'){_builtSubTab['vg-bpc']=false;setTimeout(buildVGBPC,200);}
  else if(openVGSub==='cat'){_builtSubTab['vg-cat']=false;setTimeout(function(){buildVGCat();},200);}
  else if(openVGSub==='vis'){_builtSubTab['vg-vis']=false;setTimeout(buildVisitasConversao,200);}
  else if(openVGSub==='inv'){_builtSubTab['vg-inv']=false;setTimeout(buildInvestimentos,200);setTimeout(buildPreNeg,400);}
  else if(openVGSub==='ads'){_builtSubTab['vg-ads']=false;setTimeout(buildADS,200);}
  else if(openVGSub==='combo'){setTimeout(buildCombo,200);}
  // If a seller tab is active, rebuild it fully
  if(curTab!=='visao-geral'){
    var g=PREFIX_TO_GRUPO[curTab];
    if(g){
      _builtSubTab[curTab+'-geral']=true;
      buildGrupo(g,curTab);
      buildMesControl(g,curTab);
      // Rebuild open sub-tabs
      var openSub=curSubTabs[curTab];
      if(openSub&&openSub!=='geral'){
        var subKey=curTab+'-'+openSub;
        _builtSubTab[subKey]=true;
        if(openSub==='full')buildSellerFull(g,curTab);
        else if(openSub==='ads')buildSellerADS(g,curTab);
        else if(openSub==='inv')buildSellerInv(g,curTab);
        else if(openSub==='cat')buildSellerCat(g,curTab);
        else if(openSub==='bpc')buildSellerBPC(g,curTab);
        else if(openSub==='cat2')buildCategorias(g,curTab);
        else if(openSub==='yoy')buildYoY(g,curTab);
        else if(openSub==='comp')buildComp(g,curTab);
      }
    }
  }
}

// Retorna itens do grupo com GMV/SI recalculados pelo PERIODO atual
function getItemsForPeriod(g){
  var raw=TOP_ITEMS[g]||[];
  var curMk=MESES_DONE[MESES_DONE.length-1];
  var isMTD=PERIODO.length===1&&PERIODO[0]===curMk;
  var isYTD=PERIODO.length===MESES_DONE.length;
  return raw.map(function(it){
    var gm=it.gmv_m||{},sm=it.si_m||{};
    var pGMV=PERIODO.reduce(function(s,k){return s+(gm[k]||0);},0);
    var pSI =PERIODO.reduce(function(s,k){return s+(sm[k]||0);},0);
    // Fallback: só usa gmv_mes_atual para MTD — nunca usa total YTD como fallback
    // (evita itens com 0 no mês aparecerem com o total acumulado)
    if(pGMV===0&&isMTD&&it.gmv_mes_atual>0){
      pGMV=it.gmv_mes_atual;pSI=it.si_mes_atual||pSI;
    }
    if(pSI===0&&pGMV>0&&it.si_mes_atual>0)pSI=it.si_mes_atual;
    return Object.assign({},it,{
      gmv:pGMV, si:pSI,
      asp:pSI>0?Math.round(pGMV/pSI):it.asp
    });
  }).filter(function(it){return it.gmv>0;})
   .sort(function(a,b){return b.gmv-a.gmv;});
}


// ÔöÇÔöÇ Mes Control ÔöÇÔöÇ
function buildMesControl(grupo,prefix){
  var html='<div class="mes-pills">';
  MESES_DONE.forEach(function(mk,i){
    var label=MESES_LABEL[MESES_KEYS.indexOf(mk)];
    var isCur=(i===MESES_DONE.length-1);
    html+='<button class="mes-pill'+(isCur?' active':'')+'" onclick="showMes(\''+grupo+'\',\''+prefix+'\',\''+mk+'\',this)">'+label+(isCur?' <span class="mtd-tag">MTD</span>':'')+'</button>';
  });
  html+='</div>';
  var elP=document.getElementById(prefix+'-mes-pills');
  if(elP)elP.innerHTML=html;
  var activeQs=['Q1','Q2','Q3','Q4'].filter(function(q){return qStatus(q)!=='future';});
  var elQ=document.getElementById(prefix+'-quarters');
  if(elQ)elQ.innerHTML='<div class="quarter-row">'+activeQs.map(function(q){return quarterCardHtml(grupo,q);}).join('')+'</div>';
  showMes(grupo,prefix,MESES_DONE[MESES_DONE.length-1],null);
}
function showMes(grupo,prefix,mk,btnEl){
  if(btnEl){
    document.querySelectorAll('#'+prefix+'-mes-pills .mes-pill').forEach(function(b){b.classList.remove('active');});
    btnEl.classList.add('active');
  }
  var isCur=(mk===MESES_DONE[MESES_DONE.length-1]);
  var rv=((REAL_MENSAL[grupo]||{})[mk]||0);
  var disp=isCur?rv*FAT_PROJ:rv;
  var mf=((META_FIN[grupo]||{})[mk]||0);
  var md=((META_DES[grupo]||{})[mk]||0);
  var si=((REAL_SI[grupo]||{})[mk]||0);
  var asp=si>0?rv/si:0;
  var invA=((REAL_INV_ADS[grupo]||{})[mk]||0);
  var cup=((REAL_CUPONS[grupo]||{})[mk]||0);
  var invT=((REAL_INV_TOT[grupo]||{})[mk]||0);
  var pFin=pctNum(disp,mf),pDes=pctNum(disp,md);
  // MoM: mês anterior na lista MESES_DONE
  var mkIdx=MESES_DONE.indexOf(mk);
  var rvPrev=mkIdx>0?((REAL_MENSAL[grupo]||{})[MESES_DONE[mkIdx-1]]||0):0;
  // Para mes corrente (MTD): comparar com mesmos N dias do mes anterior
  var rvPrevComp=rvPrev;
  if(isCur && mkIdx>0){
    var prevDailyGmv=(DAILY_GMV_PREV||{})[grupo]||{};
    var sumPrevMTD=0;
    for(var d=1;d<=DIA_MES;d++) sumPrevMTD+=prevDailyGmv[d]||0;
    if(sumPrevMTD>0) rvPrevComp=sumPrevMTD;
  }
  var mom=rvPrevComp>0?((rv-rvPrevComp)/rvPrevComp*100):null;
  var momStr=mom!==null?(mom>=0?'+':'')+mom.toFixed(1)+'% MoM'+(isCur?' MTD':''):'—';
  var momCls=mom===null?'blue':mom>=0?'green':'red';
  var momSub=isCur
    ?(rvPrevComp>0?'Ref: D1–D'+DIA_MES+' mai: '+fmt(rvPrevComp):'Sem dado anterior')
    :(rvPrev>0?'Anterior: '+fmt(rvPrev):'Sem mês anterior');
  // YoY: mesmo mês em 2025 — para MTD usa mesmos N dias (prorateado)
  var MESES_KEYS_ARR=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  var rv25=((REAL_2025[grupo]||{})[mk]||{}).gmv||0;
  var rv25Comp=rv25;
  if(isCur && rv25>0){
    var dias25=DIAS_MES_MAP[mk]||30;
    rv25Comp=rv25*(DIA_MES/dias25);
  }
  var yoy=rv25Comp>0?((rv-rv25Comp)/rv25Comp*100):null;
  var yoyStr=yoy!==null?(yoy>=0?'+':'')+yoy.toFixed(1)+'% YoY'+(isCur?' MTD':''):'—';
  var yoyCls=yoy===null?'blue':yoy>=0?'green':'red';
  var yoySub=isCur&&rv25>0?'2025 D1-D'+DIA_MES+' (est.): '+fmt(Math.round(rv25Comp)):(rv25>0?'2025: '+fmt(rv25):'Sem dado 2025');
  var elKpi=document.getElementById(prefix+'-mes-kpi');
  if(elKpi)elKpi.innerHTML=kpiHtml([
    {label:(MESES_PT_MAP[mk]||mk)+(isCur?' — MTD ('+DIA_MES+'/'+DIAS_MES_TOTAL+' dias)':' — Fechado'),val:fmt(rv),sub:isCur?'Proj.: '+fmt(disp):'Mês encerrado',cls:'blue'},
    {label:'MoM',val:momStr,sub:momSub,cls:momCls},
    {label:'YoY vs 2025',val:yoyStr,sub:yoySub,cls:yoyCls},
    {label:'% Meta Financeira',val:pFin.toFixed(1)+'%',sub:'Meta: '+fmtMeta(mf),cls:pFin>=100?'green':pFin>=80?'yellow':'red'},
    {label:'% Meta Desafio',val:pDes.toFixed(1)+'%',sub:'Meta Des: '+fmtMeta(md),cls:pDes>=100?'green':pDes>=80?'yellow':'red'},
    {label:'Investimento',val:fmt(invT),sub:'ADS: '+fmt(invA)+' | Cupons: '+fmt(cup),cls:'purple'},
    {label:'Gap Meta Fin.',val:fmt(disp-mf),sub:disp>=mf?'Acima da meta':'Faltam '+fmt(mf-disp),cls:disp>=mf?'green':'red'}
  ]);
  destroyChart(prefix+'-mes');
  var canEl=document.getElementById(prefix+'-mes-canvas');
  if(!canEl)return;
  chartInstances[prefix+'-mes']=new Chart(canEl.getContext('2d'),{
    type:'bar',
    data:{labels:['Realizado','Proj.','Meta Fin.','Meta Des.'],
          datasets:[{data:[rv,disp,mf,md],backgroundColor:[C_BLUE,'rgba(52,131,250,.4)',C_YELLOW,C_GREEN],borderRadius:6}]},
    options:{indexAxis:'y',responsive:true,animation:false,
             plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return fmt(c.raw);}}}},
             scales:{x:{ticks:{callback:function(v){return fmt(v);}}}}}
  });
}

// ÔöÇÔöÇ Per-Seller ÔöÇÔöÇ
function ytdNMVRel(g){return typeof REAL_NMV_REL!=='undefined'?PERIODO.reduce(function(s,k){return s+((REAL_NMV_REL[g]||{})[k]||0);},0):0;}
function buildGrupo(g,px){
  var ytd=ytdReal(g),mf=ytdMF(g),md=ytdMD(g),si=ytdSI(g),inv=ytdInvTot(g),ff=ytdFF(g);
  var tgmv=ytdTGMV(g);
  // NMV via query Rafael: ORD_CLOSED_DT + GMV_LC + NMV_FLG=TRUE (todas as verticais)
  var nmvRel=ytdNMVRel(g)||tgmv||ytd;
  var pFin=pctNum(nmvRel,mf),pDes=pctNum(nmvRel,md),pFF=pctNum(ff,ytd);
  var asp=si>0?nmvRel/si:0;
  var elKpi=document.getElementById(px+'-kpi-row');
  if(elKpi)elKpi.innerHTML=kpiHtml([
    {label:'NMV',val:fmt(nmvRel),sub:PERIODO.map(function(k){return MESES_PT_CURTO[k];}).join('-'),cls:'blue'},
    {label:'% Meta Financeira',val:pFin.toFixed(1)+'%',sub:'Meta: '+fmtMeta(mf),cls:pFin>=100?'green':pFin>=80?'yellow':'red'},
    {label:'% Meta Desafio',val:pDes.toFixed(1)+'%',sub:'Meta Des: '+fmtMeta(md),cls:pDes>=100?'green':pDes>=80?'yellow':'red'},
    {label:'SIs',val:fmtN(si),sub:'NNASP: R$ '+(asp>0?Math.round(asp).toLocaleString('pt-BR'):'--'),cls:'blue'},
    {label:'Invest. Total',val:fmt(inv),sub:'ADS+Cupons+Rebates',cls:'purple'},
    {label:'% Fulfillment',val:pFF.toFixed(1)+'%',sub:'FF: '+fmt(ff),cls:pFF>=60?'green':pFF>=30?'yellow':'red'}
  ]);
  buildBarChart(g,px);
  buildSellerNMVDiario(g,px);
  buildActions(g,px);
  buildInsights(g,px);
  if(typeof buildB2B==='function')buildB2B(g,px);
  setTimeout(function(){buildSellerTendencias(g,px);},200);
}

// ── TENDÊNCIAS DE MERCADO 2026 por seller ──────────────────────
var TEND_MERCADO = {
  "LIVING & DININGROOM FURNITURE": {
    icon:"🛋️", nome:"Living & Diningroom", badge:"alta",
    sub:"Sofás · Mesas · Estantes · TV Storage",
    tends:[
      "Sofás escultóricos com curvas em aceleração — FunHaus e Neo Deco",
      "Tendência europeia: poltronas, pufes e composições modulares em linho, veludo ou couro",
      "Paletas 2026: neutros sofisticados (bege, areia, cinza) + terracota e verde-sálvia",
      "Sofás com armazenamento interno e braços USB lideram apartamentos compactos",
      "Sofás de couro legítimo com lançamentos fortes em mai/26"
    ],
    opp:{cls:"b", txt:"💡 Oportunidade: composições modulares e sofás em linho/veludo alinhados com Neo Deco — avaliar expansão de linha"}
  },
  "STORAGE FURNITURE": {
    icon:"🗄️", nome:"Storage & Organização", badge:"estavel",
    sub:"Guarda-Roupas · Cômodas · Sapateiras · Cristaleiras",
    tends:[
      "Guarda-roupas com espelho integrado e acabamento premium crescem",
      "Cristaleira volta como peça decorativa de sala — tendência crescente",
      "Organização doméstica como bem-estar amplia interesse em cômodas modulares",
      "Paleta: off-white, carvalho claro e cinza antracite"
    ],
    opp:{cls:"y", txt:"💡 Cristaleira: novo item com tração rápida — explorar linha completa de organização de sala"}
  },
  "MATTRESSES & SOMMIER SETS": {
    icon:"🛏️", nome:"Cama Box & Conjuntos", badge:"crescendo",
    sub:"Cama Box · Box Baú · Pillow Top · Molas Ensacadas",
    tends:[
      "Box Baú em alta: armazenamento integrado viraliza no Pinterest 2026",
      "Wellness do sono: kits colchão + base ganham preferência por conveniência",
      "Pillow Top e molas ensacadas em ascensão como upgrade de conforto",
      "Consumidor migra de box simples para box premium com armazenamento"
    ],
    opp:{cls:"b", txt:"💡 Box Baú crescendo +200% a +296% MoM — ativar ADS nos modelos casal/queen"}
  },
  "MATTRESSES": {
    icon:"💤", nome:"Colchões", badge:"crescendo",
    sub:"Espuma D33 · Molas Ensacadas · Ortopédico",
    tends:[
      "Wellness do sono como investimento em saúde — demanda crescente",
      "Colchões premium (molas ensacadas, látex) em ascensão",
      "Envelhecimento da população amplia demanda por conforto",
      "Black Friday = maior pico de vendas do ano para colchões"
    ],
    opp:{cls:"r", txt:"⚠️ Lacuna: colchão premium R$1.500–R$2.000 — mercado grande, seller sem presença nessa faixa"}
  },
  "KITCHEN FURNITURE": {
    icon:"🍳", nome:"Kitchen & Lavanderia", badge:"alta",
    sub:"Armários · Gabinetes de Pia · Lavanderia · Compactos",
    tends:[
      "\"Fim dos armários tradicionais\": prateleiras abertas e cozinhas expostas",
      "Armários de lavanderia e laundry como mega-tendência de organização",
      "Cozinhas compactas com cristaleira crescem em studios e aptos",
      "Paleta: branco aquecido, areia, terracota e verde-musgo"
    ],
    opp:{cls:"b", txt:"💡 Cozinha compacta com cristaleira acelerando +159% — alinhado com tendência cozinha exposta"}
  },
  "BEDROOM FURNITURE": {
    icon:"🌙", nome:"Bedroom & Infantil", badge:"alta",
    sub:"Camas · Montessoriana · Trelicê · Cômodas",
    tends:[
      "Cama montessoriana infantil domina — quarto como santuário de bem-estar",
      "Camas baixas estilo japonês/escandinavo consolidam-se no Brasil",
      "Quartos modulados para adultos com espelho em aceleração",
      "Minimalismo quente: poucos elementos com textura e presença"
    ],
    opp:{cls:"b", txt:"💡 Beliche montessoriana e quarto modulado com espelho em forte aceleração — explorar linha"}
  }
};

function buildSellerTendencias(g, px){
  var el = document.getElementById(px+'-tend-cards');
  if(!el) return;

  var items = TOP_ITEMS[g] || [];
  if(!items.length){ document.getElementById(px+'-tend-section').style.display='none'; return; }

  // Identificar domínios deste seller
  var domGmv = {};
  items.forEach(function(it){
    var d = (it.domain||'').toUpperCase();
    domGmv[d] = (domGmv[d]||0) + (it.gmv||0);
  });

  // Mapear domínios do item para as chaves do TEND_MERCADO
  function mapDom(d){
    if(d.indexOf('LIVING')>=0||d.indexOf('DININGROOM')>=0) return 'LIVING & DININGROOM FURNITURE';
    if(d.indexOf('STORAGE')>=0) return 'STORAGE FURNITURE';
    if(d.indexOf('SOMMIER SETS')>=0||d.indexOf('SOMMIER SET')>=0) return 'MATTRESSES & SOMMIER SETS';
    if(d.indexOf('MATTRESS')>=0) return 'MATTRESSES';
    if(d.indexOf('KITCHEN')>=0) return 'KITCHEN FURNITURE';
    if(d.indexOf('BEDROOM')>=0) return 'BEDROOM FURNITURE';
    return null;
  }

  var tendKeys = {};
  Object.keys(domGmv).forEach(function(d){
    var k = mapDom(d);
    if(k) tendKeys[k] = (tendKeys[k]||0) + domGmv[d];
  });

  var sorted = Object.keys(tendKeys).sort(function(a,b){return tendKeys[b]-tendKeys[a];});
  if(!sorted.length){ document.getElementById(px+'-tend-section').style.display='none'; return; }

  var html = sorted.map(function(domKey){
    var t = TEND_MERCADO[domKey];
    if(!t) return '';

    // Top itens do seller nesse domínio (GMV alta → em queda ou em alta)
    var domItems = items.filter(function(it){
      return mapDom((it.domain||'').toUpperCase()) === domKey && (it.gmv||0)>0;
    }).slice(0,8);

    var emAlta = domItems.filter(function(it){
      var cur=it.gmv_mes_atual||0, ant=it.gmv_mes_ant||0;
      return ant>0 && ((cur-ant)/ant*100) > 20;
    }).sort(function(a,b){
      var pa=(a.gmv_mes_atual-a.gmv_mes_ant)/Math.max(a.gmv_mes_ant,1);
      var pb=(b.gmv_mes_atual-b.gmv_mes_ant)/Math.max(b.gmv_mes_ant,1);
      return pb-pa;
    }).slice(0,3);

    var emQueda = domItems.filter(function(it){
      var cur=it.gmv_mes_atual||0, ant=it.gmv_mes_ant||0;
      return ant>5000 && ((cur-ant)/ant*100) < -20;
    }).sort(function(a,b){
      var pa=(a.gmv_mes_atual-a.gmv_mes_ant)/Math.max(a.gmv_mes_ant,1);
      var pb=(b.gmv_mes_atual-b.gmv_mes_ant)/Math.max(b.gmv_mes_ant,1);
      return pa-pb;
    }).slice(0,2);

    var topItems = domItems.sort(function(a,b){return (b.gmv||0)-(a.gmv||0);}).slice(0,3);

    var itemsHtml = '';

    if(topItems.length){
      itemsHtml += '<div class="tend-sec">⭐ Top itens</div>';
      topItems.forEach(function(it,i){
        var nm=(it.nm||'').substring(0,35);
        itemsHtml += '<div class="tend-item star">'
          +'<span class="tend-item-name">'+nm+'</span>'
          +'<span class="tend-item-val">'+fmt(it.gmv)+'</span>'
          +'</div>';
      });
    }

    if(emAlta.length){
      itemsHtml += '<div class="tend-sec">🚀 Em alta este mês</div>';
      emAlta.forEach(function(it){
        var nm=(it.nm||'').substring(0,32);
        var mom=it.gmv_mes_ant>0?Math.round((it.gmv_mes_atual-it.gmv_mes_ant)/it.gmv_mes_ant*100):0;
        itemsHtml += '<div class="tend-item up">'
          +'<span class="tend-item-name">'+nm+'</span>'
          +'<span class="tend-item-mom" style="color:#00A650">▲ +'+mom+'%</span>'
          +'</div>';
      });
    }

    if(emQueda.length){
      itemsHtml += '<div class="tend-sec">📉 Atenção — em queda</div>';
      emQueda.forEach(function(it){
        var nm=(it.nm||'').substring(0,32);
        var mom=it.gmv_mes_ant>0?Math.round((it.gmv_mes_atual-it.gmv_mes_ant)/it.gmv_mes_ant*100):0;
        itemsHtml += '<div class="tend-item dn">'
          +'<span class="tend-item-name">'+nm+'</span>'
          +'<span class="tend-item-mom" style="color:#F23D4F">▼ '+mom+'%</span>'
          +'</div>';
      });
    }

    var oppHtml = t.opp ? '<div class="tend-opp '+t.opp.cls+'">'+t.opp.txt+'</div>' : '';

    return '<div class="tend-card">'
      +'<div class="tend-card-hdr '+t.badge+'">'
        +'<div class="tend-card-title">'+t.icon+' '+t.nome+' <span class="tbadge '+t.badge+'">'+(t.badge==='alta'?'🔥 Em alta':t.badge==='crescendo'?'📈 Crescendo':'■ Estável')+'</span></div>'
        +'<div class="tend-card-sub">'+t.sub+'</div>'
      +'</div>'
      +'<div class="tend-card-body">'
        +'<div class="tend-sec">Tendências</div>'
        +'<ul class="tend-list">'+t.tends.map(function(td){return '<li>'+td+'</li>';}).join('')+'</ul>'
        +(itemsHtml ? '<div class="tend-sec" style="margin-top:10px;border-top:1px solid #F0F0F0;padding-top:8px">Seus itens neste domínio</div>'+itemsHtml : '')
        +oppHtml
      +'</div>'
    +'</div>';
  }).join('');

  el.innerHTML = html;
}
function buildSellerNMVDiario(g,px){
  var canEl=document.getElementById(px+'-nmv-diario-canvas');
  if(!canEl)return;
  destroyChart(px+'-nmv-diario');
  // Dados diários do mês atual (array de 31 posições, 1-indexed)
  var diario=(REAL_DIARIO&&REAL_DIARIO[g])?REAL_DIARIO[g]:[];
  var today=DIA_MES_ATUAL||new Date().getDate();
  var MESES_ABR=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var curMK=MESES_DONE[MESES_DONE.length-1];
  var curMesNome=MESES_PT_CURTO[curMK]||'Mês';
  // Filtrar apenas dias com dado (até hoje)
  var dias=[],vals=[];
  for(var d=1;d<=Math.min(today,31);d++){
    var v=diario[d-1]||0;
    if(v>0){dias.push(d+'/'+curMesNome);vals.push(v);}
  }
  if(!vals.length){
    canEl.parentElement.parentElement.style.display='none';
    return;
  }
  // Média dos dias com venda
  var media=vals.reduce(function(s,v){return s+v;},0)/vals.length;
  // Meta diária = meta financeira do mês / dias do mês
  var mfMes=(META_FIN[g]||{})[curMK]||0;
  var diasMes=31;
  var ritmo=mfMes>0?Math.round(mfMes/diasMes):0;
  // % atingimento acumulado
  var cumVal=0,totMF=mfMes;
  var atgLine=vals.map(function(v){cumVal+=v;return totMF>0?+(cumVal/totMF*100).toFixed(1):null;});
  var datasets=[
    {label:'NMV Diário',data:vals,
     backgroundColor:vals.map(function(v){return v>0&&v>=media?'rgba(52,131,250,.85)':'rgba(52,131,250,.45)';}),
     borderRadius:4,order:2,yAxisID:'y'},
    {label:'Média',data:vals.map(function(){return Math.round(media);}),
     type:'line',borderColor:'#F23D4F',backgroundColor:'transparent',
     borderWidth:2,borderDash:[6,4],pointRadius:0,tension:0,order:1,yAxisID:'y'}
  ];
  if(ritmo>0)datasets.push({
    label:'Ritmo Meta',data:vals.map(function(){return ritmo;}),
    type:'line',borderColor:C_YELLOW,backgroundColor:'transparent',
    borderWidth:1.5,borderDash:[4,3],pointRadius:0,tension:0,order:1,yAxisID:'y'
  });
  if(atgLine.some(function(v){return v!==null;}))datasets.push({
    label:'% Ating. Meta',data:atgLine,
    type:'line',borderColor:'#00A650',backgroundColor:'transparent',
    borderWidth:2.5,pointRadius:4,pointBackgroundColor:'#00A650',tension:0.25,order:0,yAxisID:'y1',spanGaps:false
  });
  chartInstances[px+'-nmv-diario']=new Chart(canEl.getContext('2d'),{
    type:'bar',
    data:{labels:dias,datasets:datasets},
    options:{responsive:true,maintainAspectRatio:false,animation:false,
      plugins:{
        legend:{position:'bottom',labels:{usePointStyle:true,pointStyleWidth:14,font:{size:11}}},
        tooltip:{callbacks:{label:function(c){return c.dataset.yAxisID==='y1'?c.dataset.label+': '+c.raw+'%':c.dataset.label+': '+fmt(c.raw);}}}
      },
      scales:{
        x:{ticks:{font:{size:10},maxRotation:45}},
        y:{type:'linear',position:'left',ticks:{callback:function(v){return fmt(v);}},grid:{color:'rgba(0,0,0,.04)'}},
        y1:{type:'linear',position:'right',min:0,max:130,ticks:{callback:function(v){return v+'%';}},grid:{drawOnChartArea:false}}
      }
    }
  });
}
function buildBarChart(g,px){
  var mks=MESES_DONE;
  var rm=REAL_MENSAL[g]||{};
  var labels=mks.map(function(k){return MESES_PT_CURTO[k];});
  var momVals=mks.map(function(k,i){
    if(i===0)return null;
    var cur=rm[k]||0,prev=rm[mks[i-1]]||0;
    return prev>0?((cur-prev)/prev*100):null;
  });
  var momPlugin={
    id:'momLabels',
    afterDatasetsDraw:function(chart){
      var ctx=chart.ctx,meta=chart.getDatasetMeta(0);
      ctx.save();ctx.font='bold 11px Arial';ctx.textAlign='center';
      meta.data.forEach(function(bar,i){
        var mom=momVals[i];if(mom===null||mom===undefined)return;
        ctx.fillStyle=mom>=0?'#00A650':'#F23D4F';
        ctx.fillText((mom>=0?'+':'')+mom.toFixed(1)+'%',bar.x,bar.y-6);
      });
      ctx.restore();
    }
  };
  destroyChart(px+'-bar');
  var canEl=document.getElementById(px+'-bar-chart');
  if(!canEl)return;
  chartInstances[px+'-bar']=new Chart(canEl.getContext('2d'),{
    type:'bar',
    data:{labels:labels,datasets:[
      {label:'Realizado',data:mks.map(function(k){return rm[k]||0;}),backgroundColor:C_BLUE,borderRadius:4,order:2},
      {label:'Meta Fin.',data:mks.map(function(k){return (META_FIN[g]||{})[k]||0;}),type:'line',borderColor:C_YELLOW,backgroundColor:'transparent',borderWidth:2,pointRadius:4,tension:0.3,order:1},
      {label:'Meta Des.',data:mks.map(function(k){return (META_DES[g]||{})[k]||0;}),type:'line',borderColor:C_GREEN,backgroundColor:'transparent',borderWidth:2,borderDash:[5,3],pointRadius:3,tension:0.3,order:1}
    ]},
    options:{responsive:true,animation:false,layout:{padding:{top:22}},
             plugins:{legend:{position:'top'},tooltip:{callbacks:{label:function(c){
               var lbl=c.dataset.label+': '+fmt(c.raw);
               if(c.datasetIndex===0&&momVals[c.dataIndex]!=null){var m=momVals[c.dataIndex];lbl+=' (MoM: '+(m>=0?'+':'')+m.toFixed(1)+'%)';}
               return lbl;
             }}}},
             scales:{y:{ticks:{callback:function(v){return fmt(v);}}}}}
    ,plugins:[momPlugin]
  });
}
function buildB2B(g,px){
  var el=document.getElementById(px+'-b2b-kpis');if(!el)return;
  var b2b=typeof REAL_B2B!=='undefined'?(REAL_B2B[g]||{}):{};
  var mks=PERIODO&&PERIODO.length>0?PERIODO:(MESES_DONE.length>0?[MESES_DONE[MESES_DONE.length-1]]:[]);
  var tgmvB2b=0,tgmvTot=0,tsiB2b=0,tsiTot=0;
  mks.forEach(function(k){var m=b2b[k]||{};tgmvB2b+=m.tgmv_b2b||0;tgmvTot+=m.tgmv_total||0;tsiB2b+=m.tsi_b2b||0;tsiTot+=m.tsi_total||0;});
  if(tgmvTot===0){el.innerHTML='<span style="color:#aaa;font-size:12px;padding:16px;display:block">Sem dados B2B para o período.</span>';return;}
  var pTgmv=tgmvTot>0?tgmvB2b/tgmvTot*100:0;
  var pTsi=tsiTot>0?tsiB2b/tsiTot*100:0;
  var aspTot=tsiTot>0?tgmvTot/tsiTot:0;
  var aspB2b=tsiB2b>0?tgmvB2b/tsiB2b:0;
  var pAsp=aspTot>0?aspB2b/aspTot*100:0;
  function card(val,lbl,pct){
    return '<div style="background:#fff;border:1px solid #E8E8E8;border-radius:10px;padding:18px 20px;min-width:160px;flex:1;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
      +'<div style="font-size:20px;font-weight:800;color:#1A1A1A">'+val+'</div>'
      +'<div style="font-size:11px;color:#888;margin-top:4px">'+lbl+' <span style="font-weight:700;color:#3483FA">'+pct.toFixed(1)+'% Share B2B</span></div>'
      +'</div>';
  }
  el.innerHTML=
    card(fmt(tgmvTot),'TGMV',pTgmv)+
    card(fmtN(Math.round(tsiTot)),'TSI',pTsi)+
    card('R$ '+(aspTot>0?Math.round(aspTot).toLocaleString('pt-BR'):'--'),'ASP',pAsp);
}
function buildActions(g,px){
  var ytd=ytdReal(g),mf=ytdMF(g),md=ytdMD(g),pFin=pctNum(ytd,mf),pDes=pctNum(ytd,md);
  var ff=ytdFF(g),pFF=pctNum(ff,ytd);
  var acts=[];

  // 1. Meta
  if(pFin<80)acts.push({icon:'📉',title:'Meta Fin. em risco ('+pFin.toFixed(1)+'%)',
    body:'NMV abaixo de 80% da meta (R$'+fmtMeta(mf)+'). Acionar campanhas PRE-ACORDO e SAD para recuperar ritmo.',color:'#F23D4F'});
  else if(pFin>=100)acts.push({icon:'✅',title:'Meta Financeira atingida!',
    body:'Continue o ritmo e expanda via novos itens para bater Meta Desafio ('+pDes.toFixed(1)+'%).',color:'#00A650'});

  // 2. Itens em queda (top 3 em queda de MoM)
  var items=(TOP_ITEMS[g]||[]).filter(function(it){
    var cur=it.gmv_mes_atual||0,ant=it.gmv_mes_ant||0;
    return ant>50000&&cur>0&&((cur-ant)/ant*100)<-20;
  }).sort(function(a,b){
    var pA=(a.gmv_mes_atual-a.gmv_mes_ant)/Math.max(a.gmv_mes_ant,1);
    var pB=(b.gmv_mes_atual-b.gmv_mes_ant)/Math.max(b.gmv_mes_ant,1);
    return pA-pB;
  }).slice(0,3);
  if(items.length){
    var nomes=items.map(function(it){
      var nm=(it.nm||'').split(' ').slice(0,3).join(' ');
      var pct=Math.round((it.gmv_mes_atual-it.gmv_mes_ant)/it.gmv_mes_ant*100);
      return nm+' ('+pct+'%)';
    }).join('; ');
    acts.push({icon:'📦',title:items.length+' ite'+(items.length>1?'ns':'m')+' com queda >20% MoM',
      body:'Verificar preço, estoque e BPC: '+nomes,color:'#FF7A00'});
  }

  // 3. Itens inativos com histórico
  var inativos=(TOP_ITEMS[g]||[]).filter(function(it){
    return (it.status||'').toLowerCase()!=='active'&&(it.gmv_mes_ant||0)>10000;
  }).slice(0,3);
  if(inativos.length){
    acts.push({icon:'🔴',title:inativos.length+' ite'+(inativos.length>1?'ns':' item')+' inativo(s) com histórico de venda',
      body:'Reativar: '+(inativos.map(function(it){return it.mlb_id||'';}).join(', ')),color:'#F23D4F'});
  }

  // 4. Fulfillment - nota: sofás não têm ME2, focar em XD
  if(pFF<10){
    acts.push({icon:'🚚',title:'Sem Fulfillment ('+pFF.toFixed(1)+'%)',
      body:'Avaliar ativação de Full SC para itens elegíveis. Sofás/móveis grandes: considerar XD como alternativa logística.',color:'#3483FA'});
  }

  // 5. BPC baixo — itens fora do buybox
  var lowBpc=(TOP_ITEMS[g]||[]).filter(function(it){return it.bb<50&&(it.gmv||0)>20000;}).slice(0,3);
  if(lowBpc.length){
    var nomBpc=lowBpc.map(function(it){return (it.nm||'').split(' ').slice(0,3).join(' ')+'('+it.bb.toFixed(0)+'%)';}).join('; ');
    acts.push({icon:'🎯',title:lowBpc.length+' ite'+(lowBpc.length>1?'ns':' item')+' com BPC<50% — perda de buybox',
      body:'Revisar preço e combo: '+nomBpc,color:'#9B59B6'});
  }

  // 6. Oportunidade CVR — visitas altas, CVR baixo
  var visG=typeof VIS_ITEMS_GROUP!=='undefined'?(VIS_ITEMS_GROUP[g]||[]):[];
  var lowCvr=visG.filter(function(it){return it.visits>=5000&&it.cvr<0.3;}).sort(function(a,b){return b.visits-a.visits;}).slice(0,2);
  if(lowCvr.length){
    acts.push({icon:'👁️',title:'Oportunidade de CVR: '+lowCvr.length+' ite'+(lowCvr.length>1?'ns':' item')+' com muitas visitas',
      body:'Melhorar fotos/descrição: '+lowCvr.map(function(it){return (it.title||it.nm||'').split(' ').slice(0,3).join(' ')+'('+Math.round(it.visits/1000)+'K vis, CVR '+it.cvr.toFixed(2)+'%)';}).join('; '),
      color:'#00A650'});
  }

  if(!acts.length)acts.push({icon:'📈',title:'Performance estável',body:'Manter ritmo e monitorar semanalmente.',color:'#888'});
  var el=document.getElementById(px+'-actions');
  if(!el)return;
  el.innerHTML=acts.map(function(a){
    return '<div class="action-card" style="border-left-color:'+a.color+'">'
      +'<div class="action-icon">'+a.icon+'</div>'
      +'<div><strong>'+a.title+'</strong><p style="font-size:12px;color:#555;margin-top:4px;line-height:1.5">'+a.body+'</p></div>'
      +'</div>';
  }).join('');
}

function buildInsights(g,px){
  var el=document.getElementById(px+'-ins-list');
  if(!el)return;
  var ytd=ytdReal(g),ymf=ytdMF(g),ymd=ytdMD(g);
  var pFin=pctNum(ytd,ymf),pDes=pctNum(ytd,ymd);
  var fav=(FAV_DATA[g]||{}).latest||{};
  var g25=REAL_2025[g]||{};
  var ytd25=PERIODO.reduce(function(a,k){return a+(g25[k]?g25[k].gmv:0);},0);
  var yoy=ytd25>0?((ytd-ytd25)/ytd25*100):null;
  var ff=ytdFF(g),pFF=pctNum(ff,ytd);
  var inv=ytdInvTot(g);
  var nmvRel=ytdNMVRel(g)||ytdTGMV(g)||ytd;

  // Top categoria dominante
  var cats=(CAT_DATA[g]||[]);
  var topCat=cats[0]?cats[0].cat:'—';
  var topCatPct=cats[0]&&nmvRel>0?(cats[0].gmv/nmvRel*100).toFixed(0):'0';

  // Itens estrela (BPC>=90, GMV alto)
  var estrelas=(TOP_ITEMS[g]||[]).filter(function(it){return it.bb>=90&&(it.gmv||0)>50000;}).length;

  // Itens em queda
  var emQueda=(TOP_ITEMS[g]||[]).filter(function(it){
    return (it.gmv_mes_ant||0)>0&&((it.gmv_mes_atual||0)-(it.gmv_mes_ant||0))/(it.gmv_mes_ant||1)*100<-15;
  }).length;

  var ins=[
    {t:pFin.toFixed(1)+'% da Meta Fin. ('+fmtMeta(ymf)+')',c:pFin>=100?'g':pFin>=80?'y':'r'},
    {t:pDes.toFixed(1)+'% da Meta Desafio',c:pDes>=100?'g':pDes>=60?'y':'r'},
    {t:'Full SC: '+pFF.toFixed(1)+'% — '+(!pFF?'sem logística flex':'ok'),c:pFF>=40?'g':pFF>=15?'y':'r'}
  ];
  if(yoy!==null)ins.push({t:'YoY: '+(yoy>=0?'+':'')+yoy.toFixed(1)+'% vs 2025',c:yoy>=0?'g':'r'});
  if(fav.pct_favorable)ins.push({t:'Favorab.: '+fav.pct_favorable+'% vs '+(fav.rival||'rival'),c:fav.pct_favorable>=70?'g':fav.pct_favorable>=50?'y':'r'});
  if(inv>0)ins.push({t:'Invest.: '+fmt(inv)+' ('+pctNum(inv,nmvRel).toFixed(1)+'% NMV)',c:''});
  if(topCat!=='—')ins.push({t:'Top cat: '+topCat.split(' ').slice(0,2).join(' ')+' ('+topCatPct+'%)',c:''});
  if(estrelas>0)ins.push({t:estrelas+' ite'+(estrelas>1?'ns':' item')+' estrela (BPC≥90%)',c:'g'});
  if(emQueda>0)ins.push({t:emQueda+' ite'+(emQueda>1?'ns':' item')+' em queda MoM >15%',c:'r'});
  el.innerHTML=ins.map(function(i){return '<span class="ins '+i.c+'">'+i.t+'</span>';}).join('');
}
function buildSellerFull(g,px){
  var mks=MESES_DONE,ff=REAL_FF[g]||{},xd=REAL_XD[g]||{},ss=REAL_SS[g]||{},rm=REAL_MENSAL[g]||{};
  var ytdF=ytdFF(g),ytdX=ytdXD(g),ytdS=mks.reduce(function(a,k){return a+(ss[k]||0);},0),ytdG=ytdReal(g);
  var hasFF=ytdF>0,hasSS=ytdS>0;
  var elKpi=document.getElementById(px+'-full-kpi');
  var kpis=[{label:'% Cross-Docking',val:pctNum(ytdX,ytdG).toFixed(1)+'%',sub:fmt(ytdX),cls:'blue'}];
  if(hasFF)kpis.unshift({label:'% Full (FBM)',val:pctNum(ytdF,ytdG).toFixed(1)+'%',sub:fmt(ytdF),cls:ytdF/Math.max(ytdG,1)>=.6?'green':ytdF/Math.max(ytdG,1)>=.3?'yellow':'red'});
  if(hasSS)kpis.push({label:'% Self-Service',val:pctNum(ytdS,ytdG).toFixed(1)+'%',sub:fmt(ytdS),cls:'blue'});
  kpis.push({label:'GMV Total',val:fmt(ytdG),sub:'YTD',cls:'blue'});
  if(elKpi)elKpi.innerHTML=kpiHtml(kpis);
  destroyChart(px+'-full');
  var canEl=document.getElementById(px+'-full-canvas');
  if(!canEl)return;
  var datasets=[];
  if(hasFF)datasets.push({label:'Full',data:mks.map(function(k){return ff[k]||0;}),backgroundColor:'#00A650',borderRadius:3});
  datasets.push({label:'XD',data:mks.map(function(k){return xd[k]||0;}),backgroundColor:'#3483FA',borderRadius:3});
  if(hasSS)datasets.push({label:'SS',data:mks.map(function(k){return ss[k]||0;}),backgroundColor:'#FFB900',borderRadius:3});
  chartInstances[px+'-full']=new Chart(canEl.getContext('2d'),{
    type:'bar',
    data:{labels:mks.map(function(k){return MESES_PT_CURTO[k];}),datasets:datasets},
    options:{responsive:true,animation:false,
             scales:{x:{stacked:true},y:{stacked:true,ticks:{callback:function(v){return fmt(v);}}}},
             plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+fmt(c.raw);}}}}}
  });
  var thS='padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right';
  var thSL='padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:left';
  var thCols='<th style="'+thSL+'">Mês</th>'
    +(hasFF?'<th style="'+thS+'">Full (FBM)</th>':'')
    +'<th style="'+thS+'">Cross-Docking</th>'
    +(hasSS?'<th style="'+thS+'">Self-Service</th>':'')
    +'<th style="'+thS+'">GMV Total</th>'
    +(hasFF?'<th style="'+thS+'">% Full</th>':'')
    +'<th style="'+thS+'">% XD</th>';
  var hdr='<thead><tr style="background:#FFE600">'+thCols+'</tr></thead>';
  var bdy='<tbody>'+mks.map(function(k,i){
    var f=ff[k]||0,x=xd[k]||0,s=ss[k]||0,t=rm[k]||0;
    var pF=t>0?f/t*100:0,pX=t>0?x/t*100:0;
    var bg=i%2===0?'#fff':'#FAFAFA';
    var td='padding:11px 16px;font-size:13px;text-align:right;color:#1A1A1A;white-space:nowrap';
    var tdL='padding:11px 16px;font-size:13px;font-weight:700;color:#1A1A1A';
    var xdClr=pX>=60?'#00A650':pX>=30?'#B07A00':'#F23D4F';
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'
      +'<td style="'+tdL+'">'+MESES_PT_CURTO[k]+'</td>'
      +(hasFF?'<td style="'+td+'">'+fmt(f)+'</td>':'')
      +'<td style="'+td+';font-weight:700;color:#3483FA">'+fmt(x)+'</td>'
      +(hasSS?'<td style="'+td+'">'+fmt(s)+'</td>':'')
      +'<td style="'+td+';font-weight:700">'+fmt(t)+'</td>'
      +(hasFF?'<td style="'+td+'"><span style="background:'+(pF>=60?'rgba(0,166,80,.12)':'rgba(242,61,79,.1)')+';color:'+(pF>=60?'#00A650':'#F23D4F')+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">'+pF.toFixed(1)+'%</span></td>':'')
      +'<td style="'+td+'"><span style="background:rgba(52,131,250,.1);color:'+xdClr+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">'+pX.toFixed(1)+'%</span></td>'
      +'</tr>';
  }).join('')+'</tbody>';
  var tbl=document.getElementById(px+'-full-table');
  if(tbl)tbl.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff">'+hdr+bdy+'</table></div>';

  // Top Itens Cross-Docking deste seller
  var xdEl=document.getElementById(px+'-full-xd');
  if(xdEl&&typeof XD_ITEMS!=='undefined'){
    var xdItems=XD_ITEMS.filter(function(it){
      var inGrupo=(it.grupo||it.g||'')===(g||'');
      var inPeriodo=!PERIODO||PERIODO.length===0||PERIODO.indexOf(it.month_key)>=0;
      return inGrupo&&inPeriodo&&(it.gmv_xd||0)>0;
    }).sort(function(a,b){return (b.gmv_xd||0)-(a.gmv_xd||0);}).slice(0,30);

    if(!xdItems.length){
      xdEl.innerHTML='<p style="color:#aaa;padding:12px;text-align:center;font-size:12px">Sem itens Cross-Docking no período selecionado</p>';
    }else{
      var th2=function(t,al){return '<th style="padding:9px 10px;font-size:10px;font-weight:700;color:#fff;background:#1A1A1A;text-align:'+(al||'right')+';white-space:nowrap">'+t+'</th>';};
      var hdr2='<thead><tr>'+th2('#','center')+th2('Produto','left')+th2('MLB','left')+th2('GMV XD')+th2('SIs XD')+th2('% do Total')+th2('Mês','center')+'</tr></thead>';
      var totXD=xdItems.reduce(function(s,it){return s+(it.gmv_xd||0);},0);
      var bdy2='<tbody>'+xdItems.map(function(it,i){
        var v=it.gmv_xd||0,tot=it.gmv_total||v,pct=tot>0?(v/tot*100).toFixed(1):0;
        var si=Math.round(it.si_xd||it.si||0);
        var nm=(it.nm||it.titulo||'').substring(0,50)+((it.nm||it.titulo||'').length>50?'...':'');
        var mlb=it.mlb_id||'';
        var href=mlb?'https://produto.mercadolivre.com.br/'+mlb.replace('MLB','MLB-'):'#';
        var mes=MESES_PT_CURTO[it.month_key]||it.month_key||'';
        var bg=i%2===0?'#fff':'#FAFAFA';
        return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'
          +'<td style="padding:9px 10px;text-align:center;font-size:11px;color:#888">'+(i+1)+'</td>'
          +'<td style="padding:9px 10px"><a href="'+href+'" target="_blank" style="color:#1A1A1A;text-decoration:none;font-size:12px;font-weight:600">'+nm+'</a></td>'
          +'<td style="padding:9px 10px;font-size:10px;white-space:nowrap"><a href="'+href+'" target="_blank" style="color:#3483FA;text-decoration:underline;font-weight:600">'+mlb+'</a></td>'
          +'<td style="padding:9px 10px;font-weight:800;color:#3483FA;text-align:right">'+fmt(v)+'</td>'
          +'<td style="padding:9px 10px;text-align:right;font-size:12px;color:#555">'+si.toLocaleString('pt-BR')+' un</td>'
          +'<td style="padding:9px 10px;text-align:right"><span style="background:#E8F0FF;color:#3483FA;font-size:10px;font-weight:700;padding:3px 8px;border-radius:12px">'+pct+'%</span></td>'
          +'<td style="padding:9px 10px;text-align:center;font-size:11px;color:#888">'+mes+'</td>'
          +'</tr>';
      }).join('')+'</tbody>';
      xdEl.innerHTML='<div style="overflow-x:auto;border-radius:8px;border:1px solid #E8E8E8">'
        +'<table style="width:100%;border-collapse:collapse">'+hdr2+bdy2+'</table></div>'
        +'<div style="font-size:11px;color:#888;margin-top:8px">Total GMV XD no período: '+fmt(totXD)+' — Top '+xdItems.length+' itens (últimos 90 dias)</div>';
    }
  }
}
function buildSellerADS(g,px){
  var mks=MESES_DONE,ads=REAL_INV_ADS[g]||{},cup=REAL_CUPONS[g]||{},rm=REAL_MENSAL[g]||{};
  var ytdA=ytdInvAds(g),ytdC=ytdCupons(g),ytdG=ytdReal(g);
  var elKpi=document.getElementById(px+'-ads-kpi');
  if(elKpi)elKpi.innerHTML=kpiHtml([
    {label:'ADS (PADS) YTD',val:fmt(ytdA),sub:'% GMV: '+pctNum(ytdA,ytdG).toFixed(1)+'%',cls:'blue'},
    {label:'Cupons YTD',val:fmt(ytdC),sub:'% GMV: '+pctNum(ytdC,ytdG).toFixed(1)+'%',cls:'purple'},
    {label:'Total',val:fmt(ytdA+ytdC),sub:'% GMV: '+pctNum(ytdA+ytdC,ytdG).toFixed(1)+'%',cls:'blue'}
  ]);
  destroyChart(px+'-ads');
  var canEl=document.getElementById(px+'-ads-canvas');
  if(!canEl)return;
  chartInstances[px+'-ads']=new Chart(canEl.getContext('2d'),{
    type:'bar',
    data:{labels:mks.map(function(k){return MESES_PT_CURTO[k];}),datasets:[
      {label:'ADS',data:mks.map(function(k){return ads[k]||0;}),backgroundColor:C_BLUE,borderRadius:3},
      {label:'Cupons',data:mks.map(function(k){return cup[k]||0;}),backgroundColor:C_PURPLE,borderRadius:3}
    ]},
    options:{responsive:true,animation:false,scales:{x:{stacked:true},y:{stacked:true,ticks:{callback:function(v){return fmt(v);}}}},plugins:{legend:{position:'bottom'}}}
  });
  var ths='<tr style="background:#FFE600"><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:left">Mês</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">ADS</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">Cupons</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">Total Invest.</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:center">% do GMV</th></tr>';
  var hdr='<thead>'+ths+'</thead>';
  var bdy='<tbody>'+mks.map(function(k,i){
    var a=ads[k]||0,cu=cup[k]||0,gv=rm[k]||0,t=a+cu,p=gv>0?t/gv*100:0;
    var bg=i%2===0?'#fff':'#FAFAFA';
    var pClr=p>=5?'#F23D4F':p>=2?'#B07A00':'#00A650',pBg=p>=5?'rgba(242,61,79,.1)':p>=2?'rgba(255,185,0,.15)':'rgba(0,166,80,.12)';
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'      +'<td style="padding:11px 16px;font-size:13px;font-weight:700;color:#1A1A1A">'+MESES_PT_CURTO[k]+'</td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;color:#3483FA;font-weight:600">'+fmt(a)+'</td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;color:#9B59B6;font-weight:600">'+fmt(cu)+'</td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;font-weight:800;color:#1A1A1A">'+fmt(t)+'</td>'      +'<td style="padding:11px 16px;text-align:center"><span style="background:'+pBg+';color:'+pClr+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">'+p.toFixed(1)+'%</span></td>'      +'</tr>';
  }).join('')+'</tbody>';
  var tbl=document.getElementById(px+'-ads-table');
  if(tbl)tbl.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff">'+hdr+bdy+'</table></div>';
}
function buildSellerInv(g,px){
  var mks=MESES_DONE,ads=REAL_INV_ADS[g]||{},cup=REAL_CUPONS[g]||{},reb=REAL_REBATES[g]||{},tot=REAL_INV_TOT[g]||{};
  var ytdT=ytdInvTot(g),ytdG=ytdReal(g);
  var elKpi=document.getElementById(px+'-inv-kpi');
  if(elKpi)elKpi.innerHTML=kpiHtml([
    {label:'Invest. Total YTD',val:fmt(ytdT),sub:'% GMV: '+pctNum(ytdT,ytdG).toFixed(1)+'%',cls:'blue'},
    {label:'ADS',val:fmt(ytdInvAds(g)),sub:'PADS',cls:'blue'},
    {label:'Cupons',val:fmt(ytdCupons(g)),sub:'',cls:'purple'}
  ]);
  destroyChart(px+'-inv');
  var canEl=document.getElementById(px+'-inv-canvas');
  if(!canEl)return;
  chartInstances[px+'-inv']=new Chart(canEl.getContext('2d'),{
    type:'bar',
    data:{labels:mks.map(function(k){return MESES_PT_CURTO[k];}),datasets:[
      {label:'ADS',data:mks.map(function(k){return ads[k]||0;}),backgroundColor:C_BLUE,borderRadius:3},
      {label:'Cupons',data:mks.map(function(k){return cup[k]||0;}),backgroundColor:C_PURPLE,borderRadius:3},
      {label:'Rebates',data:mks.map(function(k){return reb[k]||0;}),backgroundColor:C_ORANGE,borderRadius:3}
    ]},
    options:{responsive:true,animation:false,scales:{x:{stacked:true},y:{stacked:true,ticks:{callback:function(v){return fmt(v);}}}},plugins:{legend:{position:'bottom'}}}
  });
  var ths2='<tr style="background:#FFE600"><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:left">Mês</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">ADS (PADS)</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">Cupons</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">Rebates</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">Total Invest.</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:center">% do GMV</th></tr>';
  var hdr='<thead>'+ths2+'</thead>';
  var bdy='<tbody>'+mks.map(function(k,i){
    var a=ads[k]||0,cu=cup[k]||0,r=reb[k]||0,t=tot[k]||0,gv=(REAL_MENSAL[g]||{})[k]||0,p=gv>0?t/gv*100:0;
    var bg=i%2===0?'#fff':'#FAFAFA';
    var pClr=p>=5?'#F23D4F':p>=2?'#B07A00':'#00A650',pBg=p>=5?'rgba(242,61,79,.1)':p>=2?'rgba(255,185,0,.15)':'rgba(0,166,80,.12)';
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'      +'<td style="padding:11px 16px;font-size:13px;font-weight:700;color:#1A1A1A">'+MESES_PT_CURTO[k]+'</td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;color:#3483FA;font-weight:600">'+fmt(a)+'</td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;color:#9B59B6;font-weight:600">'+fmt(cu)+'</td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;color:#FF7A00;font-weight:600">'+fmt(r)+'</td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;font-weight:800;color:#1A1A1A">'+fmt(t)+'</td>'      +'<td style="padding:11px 16px;text-align:center"><span style="background:'+pBg+';color:'+pClr+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">'+p.toFixed(1)+'%</span></td>'      +'</tr>';
  }).join('')+'</tbody>';
  var tbl=document.getElementById(px+'-inv-table');
  if(tbl)tbl.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff">'+hdr+bdy+'</table></div>';
}
function mlLink(it){
  // Formato: https://produto.mercadolivre.com.br/MLB-{ID}-{slug}_JM
  if(it.permalink&&it.permalink.length>10) return it.permalink;
  var mlbId=(it.mlb_id||('MLB'+(it.item_id||it.id||''))).replace('MLB','MLB-');
  return 'https://produto.mercadolivre.com.br/'+mlbId+'-_JM';
}
function mlImgTag(it){
  var thumb=it.thumb||(it.thumbnail||'');
  var href=mlLink(it);
  var img=thumb
    ?'<img src="'+thumb.replace('http://http2.','https://http2.').replace('http://','https://')+'" alt="" style="width:46px;height:46px;object-fit:contain;border-radius:6px;border:1px solid #eee;background:#f9f9f9" onerror="this.src=\'\';this.style.display=\'none\'">'
    :'<div style="width:46px;height:46px;background:#F0F0F0;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#888">'+(it.nm?it.nm[0].toUpperCase():'?')+'</div>';
  return '<a href="'+href+'" target="_blank" style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;background:#fafafa;border-radius:8px;border:1px solid #eee">'+img+'</a>';
}
// ÔöÇÔöÇ Catalog table exactly like Larissa's ÔöÇÔöÇ
function renderItemsTable(items, containerId, showGroup, totalGMV){
  if(!items||!items.length){
    var el=document.getElementById(containerId);
    if(el)el.innerHTML='<p style="color:#aaa;padding:24px;text-align:center">Nenhum item encontrado.</p>';
    return;
  }
  var tot=totalGMV||items.reduce(function(s,it){return s+(it.gmv||0);},0);
  var th=function(t,al,w){return '<th style="padding:10px 12px;font-size:10px;font-weight:700;color:#fff;text-align:'+(al||'left')+';white-space:nowrap;background:#1A1A1A'+(w?';width:'+w:'')+'">'+t+'</th>';};

  // Label dinâmico do período
  var MONTH_ORDER_CAT=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  var MESES_ABR_CAT={jan:'Jan',feb:'Fev',mar:'Mar',apr:'Abr',may:'Mai',jun:'Jun',jul:'Jul',aug:'Ago',sep:'Set',oct:'Out',nov:'Nov',dec:'Dez'};
  var curMkCat=MESES_DONE[MESES_DONE.length-1];
  var isMTDcat=(PERIODO.length===1&&PERIODO[0]===curMkCat);
  var gmvColLabel=PERIODO.length===1?('GMV '+MESES_ABR_CAT[PERIODO[0]]):('GMV YTD');
  var focalMkCat=PERIODO.length===1?PERIODO[0]:curMkCat;
  var focalIdxCat=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(focalMkCat);
  var prevMkCat=focalIdxCat>0?['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'][focalIdxCat-1]:null;
  // ORDEM LÓGICA: # | Produto | Grupo | GMV | Share | Share Acum | Units | GMV MoM | Units MoM | Preço DE | Preço Atual | Status | Domínio
  var hdr='<thead><tr>'
    +th('#','center','36px')
    +th('PRODUTO')
    +(showGroup?th('GRUPO','center','90px'):'')
    +th(gmvColLabel,'right','110px')
    +th('SHARE','center','90px')
    +th('SHARE ACUM.','center','100px')
    +th('UNITS','right','70px')
    +th(isMTDcat?'GMV MOM (D'+DIA_MES_ATUAL+')':'GMV MOM','center','110px')
    +th(isMTDcat?'UNITS MOM (D'+DIA_MES_ATUAL+')':'UNITS MOM','center','110px')
    +(hasVC?th('REBATE VC','right','100px'):'')
    +(hasVC?th('VC NEGATIVA','right','100px'):'')
    +th('PRE\u00c7O DE','right','110px')
    +th('PRE\u00c7O ATUAL','right','110px')
    +th('STATUS','center','70px')
    +th('DOM\u00cdNIO')
    +'</tr></thead>';

  // VC items disponivel
  var hasVC=typeof VC_ITEMS!=='undefined'&&Object.keys(VC_ITEMS).length>0;
  // Respeitar a ordem que foi passada (sort já foi feito em renderVGItems/buildSellerCat)
  var sorted=items.slice();
  var cumulative=0;
  // Share calculada pela ordem de GMV (independente do sort atual)
  var byGmv=items.slice().sort(function(a,b){return (b.gmv||0)-(a.gmv||0);});
  var cumByGmv=0;
  byGmv.forEach(function(it){var s=tot>0?(it.gmv||0)/tot*100:0;cumByGmv+=s;it._share=s;it._cumShare=Math.min(cumByGmv,100);});
  sorted.forEach(function(it){
    var share=tot>0?(it.gmv||0)/tot*100:0;
    cumulative+=share;
    it._share=share;
    it._cumShare=Math.min(cumulative,100);
  });

  var bdy='<tbody>'+sorted.map(function(it,i){
    var st=(it.status||'active').toLowerCase();
    var isActive=st==='active', isPaused=st==='paused'||st==='pausado';
    var stBg=isActive?'rgba(0,166,80,.12)':isPaused?'rgba(255,185,0,.15)':'rgba(242,61,79,.12)';
    var stColor=isActive?'#00A650':isPaused?'#B07400':'#F23D4F';
    var stTxt=isActive?'Ativo':isPaused?'Pausado':'Inativo';
    var grpColor=showGroup?(GRUPO_COLOR[it.g||'']||'#3483FA'):'';
    var href=mlLink(it);
    var mlbId=it.mlb_id||('MLB'+(it.item_id||it.id||''));
    var rowBg=i%2===0?'#fff':'#FAFAFA';
    var isPareto80=it._cumShare<=80.01;

    // Share mini bar
    var barW=Math.min(it._share*5,100);
    var shareHtml='<div style="display:flex;align-items:center;gap:5px">'
      +'<div style="width:50px;height:5px;background:#E8EEFF;border-radius:3px;flex-shrink:0"><div style="width:'+barW.toFixed(1)+'%;height:5px;background:#3483FA;border-radius:3px"></div></div>'
      +'<span style="font-size:11px;font-weight:800;color:#3483FA">'+it._share.toFixed(1)+'%</span></div>';

    var cumC=it._cumShare<=50?'#00A650':it._cumShare<=80?'#B07A00':'#F23D4F';
    var cumHtml='<span style="font-size:12px;font-weight:800;color:'+cumC+'">'+it._cumShare.toFixed(1)+'%</span>';

    var pd=it.preco_de||0, pa=it.preco_atual||it.asp||0;
    var pdHtml=pd>0?'<span style="color:#888;font-size:12px">R$ '+pd.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'</span>':'<span style="color:#ccc">\u2014</span>';
    var paHtml=pa>0?'<strong style="font-size:13px;color:#1A1A1A">R$ '+pa.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'</strong>':'<span style="color:#ccc">\u2014</span>';

    // MoM usando dados mensais do periodo selecionado
    var _gm=it.gmv_m||{},_sm=it.si_m||{};
    var gCur=0,gAnt=0,sCur2=0,sAnt2=0;
    if(PERIODO.length===1&&!isMTDcat){
      // Mes fechado: usa gmv_m do focal vs mes anterior
      gCur=_gm[focalMkCat]||it.gmv||0;
      gAnt=prevMkCat?(_gm[prevMkCat]||0):0;
      sCur2=_sm[focalMkCat]||it.si||0;
      sAnt2=prevMkCat?(_sm[prevMkCat]||0):0;
    } else if(isMTDcat){
      // MTD (mês atual selecionado): compara dia 1-N do mês atual vs dia 1-N do mês anterior
      gCur=it.gmv_mes_atual||0;
      gAnt=(it.gmv_mes_ant_periodo!=null&&it.gmv_mes_ant_periodo>0)?it.gmv_mes_ant_periodo:(it.gmv_mes_ant||0);
      sCur2=it.si_mes_atual||0;
      sAnt2=(it.si_mes_ant_periodo!=null&&it.si_mes_ant_periodo>0)?it.si_mes_ant_periodo:(it.si_mes_ant||0);
    } else {
      // YTD ou multi-mes: usa gmv_mes_atual/ant normais (mês anterior fechado)
      gCur=it.gmv_mes_atual||0; gAnt=it.gmv_mes_ant||0;
      sCur2=it.si_mes_atual||0; sAnt2=it.si_mes_ant||0;
    }
    var momGMV=gAnt>0?((gCur-gAnt)/gAnt*100):null;
    function momBadge(v){
      if(v===null)return '<span style="color:#ccc">\u2014</span>';
      var c=v>=10?'#00A650':v>=0?'#43B97F':v>=-10?'#B07A00':'#F23D4F';
      var bg=v>=0?'rgba(0,166,80,.08)':'rgba(242,61,79,.08)';
      var arrow=v>=0?'\u25b2':'\u25bc';
      return '<span style="background:'+bg+';color:'+c+';font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;white-space:nowrap">'+arrow+' '+Math.abs(v).toFixed(1)+'%</span>';
    }
    var momSI=sAnt2>0?((sCur2-sAnt2)/sAnt2*100):null;

    // VC lookup para este item e periodo
    var _vcData=(hasVC&&it.item_id&&VC_ITEMS[it.item_id])?VC_ITEMS[it.item_id]:{};
    var _vcReb=PERIODO.reduce(function(s,k){return s+((_vcData[k]||{}).rebate||0);},0);
    var _vcNeg=PERIODO.reduce(function(s,k){return s+((_vcData[k]||{}).vc_negativa||0);},0);
    var imgHtml=mlImgTag(it);
    var nm=(it.nm||it.title||'').substring(0,44)+((it.nm||it.title||'').length>44?'...':'');

    return '<tr style="background:'+rowBg+';border-bottom:1px solid #F0F0F0" '
      +'onmouseover="this.style.background=\'#FFFBEA\'" onmouseout="this.style.background=\''+rowBg+'\'">'
      // #
      +'<td style="padding:10px 8px;text-align:center;font-size:11px;font-weight:'+(isPareto80?'800':'400')+';color:'+(isPareto80?'#3483FA':'#CCC')+'">'+(i+1)+'</td>'
      // PRODUTO: imagem + título + MLB link
      +'<td style="padding:8px 12px;min-width:240px">'
        +'<div style="display:flex;align-items:center;gap:10px">'
          +imgHtml
          +'<div>'
            +'<div style="font-size:12.5px;font-weight:700;color:#1A1A1A;line-height:1.3;margin-bottom:2px">'+nm+'</div>'
            +'<a href="'+href+'" target="_blank" style="color:#3483FA;font-size:10px;font-weight:600;text-decoration:none">\uD83D\uDD17 '+mlbId+'</a>'
          +'</div>'
        +'</div>'
      +'</td>'
      // GRUPO
      +(showGroup?'<td style="padding:10px 8px;text-align:center"><span style="font-size:10px;font-weight:800;padding:3px 8px;border-radius:10px;background:'+grpColor+'22;color:'+grpColor+'">'+(it.g||'')+'</span></td>':'')
      // GMV 30D
      +'<td style="padding:10px 12px;text-align:right;font-size:14px;font-weight:900;color:#1A1A1A;white-space:nowrap">'+fmt(it.gmv)+'</td>'
      // SHARE (com barra)
      +'<td style="padding:10px 12px">'+shareHtml+'</td>'
      // SHARE ACUM.
      +'<td style="padding:10px 10px;text-align:center">'+cumHtml+'</td>'
      // UNITS
      +'<td style="padding:10px 10px;text-align:right;font-size:13px;color:#444">'+Math.round(it.si||0).toLocaleString('pt-BR')+'</td>'
      // GMV MOM
      +'<td style="padding:10px 10px;text-align:center">'+momBadge(momGMV)+'</td>'
      // UNITS MOM
      +'<td style="padding:10px 10px;text-align:center">'+momBadge(momSI)+'</td>'
      // VC
      +(hasVC?'<td style="padding:10px 10px;text-align:right;font-size:11px;color:'+(_vcReb>0?'#9B59B6':'#CCC')+'">'+(_vcReb>0?fmt(_vcReb):'—')+'</td>':'')
      +(hasVC?'<td style="padding:10px 10px;text-align:right;font-size:11px;font-weight:700;color:'+(_vcNeg>0?'#F23D4F':'#CCC')+'">'+(_vcNeg>0?fmt(_vcNeg):'—')+'</td>':'')
      // PREÇO DE
      +'<td style="padding:10px 10px;text-align:right">'+pdHtml+'</td>'
      // PREÇO ATUAL
      +'<td style="padding:10px 10px;text-align:right">'+paHtml+'</td>'
      // STATUS
      +'<td style="padding:10px 8px;text-align:center"><span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:'+stBg+';color:'+stColor+'">'+stTxt+'</span></td>'
      // DOMÍNIO
      +'<td style="padding:10px 10px;font-size:10.5px;color:#999;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis">'+(it.domain||'\u2014')+'</td>'
      +'</tr>';
  }).join('')+'</tbody>';

  var paretoCount=sorted.filter(function(it){return it._cumShare<=80.01;}).length;
  var ncols=showGroup?14:13;
  var sumRow='<tr style="background:#F8F8F8;border-top:2px solid #E0E0E0">'
    +'<td colspan="'+(showGroup?3:2)+'" style="padding:10px 12px;font-size:11px;font-weight:700;color:#555">'
    +sorted.length+' itens &nbsp;\u00b7&nbsp; <span style="color:#00A650;font-weight:800">'+paretoCount+' formam 80% do GMV</span></td>'
    +'<td colspan="'+(ncols-(showGroup?3:2))+'" style="padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#1A1A1A">Total: '+fmt(tot)+'</td></tr>';

  var el=document.getElementById(containerId);
  if(!el)return;
  el.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.07)">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff">'+hdr+bdy+sumRow+'</table></div>';
}

function buildSellerCat(g,px){
  var items=getItemsForPeriod(g);
  var el=document.getElementById(px+'-cat-table');
  if(!el)return;
  var allItems=getItemsForPeriod(g).slice(0,100);
  var totalGMV=allItems.reduce(function(s,it){return s+it.gmv;},0);
  var queda=allItems.filter(function(it){return it.bb<70;});
  var altaPreco=allItems.filter(function(it){return it.bb<50;});
  var vcNeg=allItems.filter(function(it){return it.bb<65;});
  function badge(n,c){return '<span style="background:'+c+';color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;margin-left:5px">'+n+'</span>';}
  var tabS='padding:10px 16px;border:none;background:transparent;font-size:12px;font-weight:600;color:#888;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap';
  var tabA='padding:10px 16px;border:none;background:transparent;font-size:12px;font-weight:700;color:#3483FA;cursor:pointer;border-bottom:2px solid #3483FA;white-space:nowrap';
  el.innerHTML=
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center">'
    +'<span style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.5px">Ordenar:</span>'
    +'<button onclick="sortCat(\'gmv\',\''+px+'\')" id="'+px+'-sort-gmv" style="padding:5px 14px;border-radius:20px;border:none;background:#1A1A1A;color:#fff;font-size:11px;font-weight:700;cursor:pointer">GMV</button>'
    +'<button onclick="sortCat(\'si\',\''+px+'\')" id="'+px+'-sort-si" style="padding:5px 14px;border-radius:20px;border:2px solid #ddd;background:#fff;color:#555;font-size:11px;font-weight:600;cursor:pointer">Units</button>'
    +'<button onclick="sortCat(\'share\',\''+px+'\')" id="'+px+'-sort-share" style="padding:5px 14px;border-radius:20px;border:2px solid #ddd;background:#fff;color:#555;font-size:11px;font-weight:600;cursor:pointer">Share %</button>'
    +'<button onclick="sortCat(\'asp\',\''+px+'\')" id="'+px+'-sort-asp" style="padding:5px 14px;border-radius:20px;border:2px solid #ddd;background:#fff;color:#555;font-size:11px;font-weight:600;cursor:pointer">Pre\u00e7o</button>'
    +'<button onclick="sortCat(\'bb\',\''+px+'\')" id="'+px+'-sort-bb" style="padding:5px 14px;border-radius:20px;border:2px solid #ddd;background:#fff;color:#555;font-size:11px;font-weight:600;cursor:pointer">BPC</button>'
    +'</div>'
    +'<div style="display:flex;border-bottom:2px solid #E0E0E0;margin-bottom:14px;flex-wrap:wrap">'
    +'<button style="'+tabA+'" id="'+px+'-stab-all" onclick="filterSellerCat(\'all\',\''+px+'\',this)">\ud83c\udfc6 Top Itens'+badge(allItems.length,'#3483FA')+'</button>'
    +'<button style="'+tabS+'" id="'+px+'-stab-queda" onclick="filterSellerCat(\'queda\',\''+px+'\',this)">\ud83d\udcc9 Em Queda'+badge(queda.length,'#F23D4F')+'</button>'
    +'<button style="'+tabS+'" id="'+px+'-stab-alta" onclick="filterSellerCat(\'alta\',\''+px+'\',this)">\ud83d\udd25 Alta de Pre\u00e7o'+badge(altaPreco.length,'#FF7A00')+'</button>'
    +'<button style="'+tabS+'" id="'+px+'-stab-vc" onclick="filterSellerCat(\'vc\',\''+px+'\',this)">\u26a0 VC Negativa'+badge(vcNeg.length,'#888')+'</button>'
    +'</div>'
    +'<div id="'+px+'-cat-tbl"></div>';
  window['_cat_items_'+px]=allItems;
  window['_cat_total_'+px]=totalGMV;
  renderItemsTable(allItems,px+'-cat-tbl',false,totalGMV);
}

window.sortCat=function(key,px){
  var all=window['_cat_items_'+px]||[];
  var tot=window['_cat_total_'+px]||0;
  ['gmv','si','share','asp','bb'].forEach(function(k){
    var b=document.getElementById(px+'-sort-'+k);
    if(b){b.style.background=k===key?'#1A1A1A':'#fff';b.style.color=k===key?'#fff':'#555';b.style.border=k===key?'none':'2px solid #ddd';}
  });
  var sorted=all.slice().sort(function(a,b){
    if(key==='si')return (b.si||0)-(a.si||0);
    if(key==='asp')return (b.asp||0)-(a.asp||0);
    if(key==='bb')return (b.bb||0)-(a.bb||0);
    if(key==='mom')return (a.bb||0)-(b.bb||0);  // proxy: pior BPC primeiro
    return b.gmv-a.gmv;
  });
  renderItemsTable(sorted,px+'-cat-tbl',false,tot);
};

function filterSellerCat(filter,px,btn){
  var tabS='padding:10px 16px;border:none;background:transparent;font-size:12px;font-weight:600;color:#888;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap';
  var tabA='padding:10px 16px;border:none;background:transparent;font-size:12px;font-weight:700;color:#3483FA;cursor:pointer;border-bottom:2px solid #3483FA;white-space:nowrap';
  ['all','queda','alta','vc'].forEach(function(id){var b=document.getElementById(px+'-stab-'+id);if(b)b.style.cssText=tabS;});
  if(btn)btn.style.cssText=tabA;
  var all=window['_cat_items_'+px]||[];
  var tot=window['_cat_total_'+px]||0;
  var filtered=filter==='queda'?all.filter(function(it){var g=it.gmv_mes_atual||0,p=it.gmv_mes_ant||0;return p>0&&(g-p)/p*100<-10;}):
               filter==='alta'?all.filter(function(it){return it.bb<50;}):
               filter==='vc'?all.filter(function(it){return it.bb<65;}):all;
  renderItemsTable(filtered,px+'-cat-tbl',false,tot);
}

function buildSellerBPC(g,px){
  var mks=MESES_DONE,pt=REAL_PED_TOT[g]||{},pb=REAL_PED_BB[g]||{};
  var ytdT=mks.reduce(function(a,k){return a+(pt[k]||0);},0);
  var ytdB=mks.reduce(function(a,k){return a+(pb[k]||0);},0);
  var pBB=ytdT>0?pctNum(ytdB,ytdT):0;
  var ytdGMV=ytdReal(g),ytdGMVBB=mks.reduce(function(a,k){return a+((REAL_GMV_BB[g]||{})[k]||0);},0);
  var pGMVBB=ytdGMV>0?pctNum(ytdGMVBB,ytdGMV):0;
  var elKpi=document.getElementById(px+'-bpc-kpi');
  if(elKpi)elKpi.innerHTML=kpiHtml([
    {label:'BPC % (Pedidos)',val:pBB.toFixed(1)+'%',sub:fmtN(ytdB)+' de '+fmtN(ytdT)+' pedidos',cls:pBB>=80?'green':pBB>=60?'yellow':'red'},
    {label:'GMV com Buybox',val:fmt(ytdGMVBB),sub:pGMVBB.toFixed(1)+'% do GMV',cls:pGMVBB>=80?'green':pGMVBB>=60?'yellow':'red'},
    {label:'GMV sem Buybox',val:fmt(ytdGMV-ytdGMVBB),sub:'Oportunidade de recupera\u00e7\u00e3o',cls:pGMVBB<80?'red':'yellow'},
    {label:'Proje\u00e7\u00e3o Mensal',val:fmt(aprProj(g)),sub:'Estimativa m\u00eas atual',cls:'blue'}
  ]);
  var bbPctArr=mks.map(function(mk){return pt[mk]>0?+(pctNum(pb[mk]||0,pt[mk]).toFixed(1)):null;});
  var gmvBBPctArr=mks.map(function(mk){var gv=(REAL_MENSAL[g]||{})[mk]||0;return gv>0?+(pctNum((REAL_GMV_BB[g]||{})[mk]||0,gv).toFixed(1)):null;});
  destroyChart(px+'-bpc');
  var canEl=document.getElementById(px+'-bpc-canvas');
  if(canEl){
    chartInstances[px+'-bpc']=new Chart(canEl.getContext('2d'),{
      type:'line',
      data:{labels:mks.map(function(mk){return MESES_LABEL[MESES_KEYS.indexOf(mk)];}),datasets:[
        {label:'BPC % Pedidos',data:bbPctArr,borderColor:C_BLUE,backgroundColor:'rgba(52,131,250,.1)',fill:true,tension:0.3,pointRadius:5,borderWidth:2.5},
        {label:'GMV BB %',data:gmvBBPctArr,borderColor:C_GREEN,backgroundColor:'transparent',tension:0.3,pointRadius:5,borderDash:[5,3],borderWidth:2},
        {label:'Meta 80%',data:mks.map(function(){return 80;}),borderColor:'#F23D4F',backgroundColor:'transparent',borderDash:[6,4],pointRadius:0,borderWidth:1.5}
      ]},
      options:{responsive:true,animation:false,
        plugins:{legend:{position:'top'},tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+(c.raw!==null?c.raw+'%':'-');}}}},
        scales:{y:{min:0,max:100,ticks:{callback:function(v){return v+'%';}}}}}
    });
  }
  var thsBPC='<tr style="background:#FFE600"><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:left">Mês</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">Pedidos BB</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">Total Pedidos</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:center">BPC %</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">GMV c/ Buybox</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:right">GMV Total</th><th style="padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap;text-align:center">GMV BB %</th></tr>';
  var hdr='<thead>'+thsBPC+'</thead>';
  var bdy='<tbody>'+mks.map(function(mk,i){
    var t=pt[mk]||0,b=pb[mk]||0,gv=(REAL_MENSAL[g]||{})[mk]||0,gbb=(REAL_GMV_BB[g]||{})[mk]||0;
    var pBpc=t>0?pctNum(b,t):0,pGMV=gv>0?pctNum(gbb,gv):0;
    var bg=i%2===0?'#fff':'#FAFAFA';
    var bpcClr=pBpc>=80?'#00A650':pBpc>=65?'#B07A00':'#F23D4F',bpcBg=pBpc>=80?'rgba(0,166,80,.12)':pBpc>=65?'rgba(255,185,0,.15)':'rgba(242,61,79,.1)';
    var gmvClr=pGMV>=80?'#00A650':pGMV>=65?'#B07A00':'#F23D4F',gmvBg=pGMV>=80?'rgba(0,166,80,.12)':pGMV>=65?'rgba(255,185,0,.15)':'rgba(242,61,79,.1)';
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'      +'<td style="padding:11px 16px;font-size:13px;font-weight:700;color:#1A1A1A">'+MESES_PT_CURTO[mk]+'</td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;color:#555">'+fmtN(b)+'</td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;color:#555">'+fmtN(t)+'</td>'      +'<td style="padding:11px 16px;text-align:center"><span style="background:'+bpcBg+';color:'+bpcClr+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">'+pBpc.toFixed(1)+'%</span></td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;color:#555">'+fmt(gbb)+'</td>'      +'<td style="padding:11px 16px;text-align:right;font-size:13px;font-weight:700;color:#1A1A1A">'+fmt(gv)+'</td>'      +'<td style="padding:11px 16px;text-align:center"><span style="background:'+gmvBg+';color:'+gmvClr+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">'+pGMV.toFixed(1)+'%</span></td>'      +'</tr>';
  }).join('')+'</tbody>';
  var tbl=document.getElementById(px+'-bpc-table');
  if(tbl)tbl.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff">'+hdr+bdy+'</table></div>';
  var offs=getItemsForPeriod(g).filter(function(it){return it.bb<70;}).slice(0,10);
  var otbl=document.getElementById(px+'-bpc-offenders');
  if(otbl)otbl.innerHTML='<thead><tr style="background:#FFE600">'
    +'<th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:#1A1A1A;min-width:220px">Produto</th>'
    +'<th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:800;color:#1A1A1A">GMV s/Buybox</th>'
    +'<th style="padding:10px 10px;text-align:center;font-size:11px;font-weight:800;color:#1A1A1A">% s/BB</th>'
    +'<th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:800;color:#1A1A1A">NASP</th>'
    +'<th style="padding:10px 10px;text-align:center;font-size:11px;font-weight:800;color:#1A1A1A">Diagn\u00f3stico</th>'
    +'</tr></thead><tbody>'+offs.map(function(it,idx){
      var rowBg=idx%2===0?'#fff':'#FAFAFA';
      var pctSB=Math.max(0,100-it.bb);
      var gmvSB=it.gmv*(pctSB/100);
      var pctCls=pctSB>=60?'background:#FDECEA;color:#F23D4F':pctSB>=30?'background:#FFF3CD;color:#B8860B':'background:#D4EDDA;color:#00A650';
      var diag=it.bb<50?'Pre\u00e7o n\u00e3o competitivo':it.bb<65?'BPC abaixo do ideal':'Oportunidade';
      var diagColor=it.bb<50?'#F23D4F':it.bb<65?'#B07A00':'#00A650';
      var href=mlLink(it);
      return '<tr style="background:'+rowBg+';border-bottom:1px solid #F0F0F0">'
        +'<td style="padding:10px 14px"><a href="'+href+'" target="_blank" style="color:#1A1A1A;text-decoration:none;font-size:12.5px;font-weight:700;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px">'+it.nm.substring(0,40)+(it.nm.length>40?'...':'')+'</a>'
        +'<span style="font-size:10px;color:#AAA">'+(it.mlb_id||'')+'</span></td>'
        +'<td style="padding:10px;text-align:right;font-size:13px;font-weight:900;color:#1A1A1A"><strong>'+fmt(gmvSB)+'</strong></td>'
        +'<td style="padding:10px;text-align:center"><span style="'+pctCls+';font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px">'+pctSB.toFixed(0)+'%</span></td>'
        +'<td style="padding:10px;text-align:right;font-size:12px;color:#555">R$ '+Math.round(it.asp).toLocaleString('pt-BR')+'</td>'
        +'<td style="padding:10px;text-align:center;font-size:12px;font-weight:700;color:'+diagColor+'">'+diag+'</td>'
        +'</tr>';
    }).join('')+'</tbody>';
  // ÔöÇÔöÇ BOX_ALL_ABC: favorabilidade de preço vs todos concorrentes ÔöÇÔöÇ
  var fa=(FAV_ABC[g]||{});
  var latL=fa.latest_local||{},latP=fa.latest_pix||{};
  var pFavL=latL.pct_favorable||0,pFavP=latP.pct_favorable||0;
  var pExpL=latL.pct_expensive||0,pExpP=latP.pct_expensive||0;
  var mksAbc=Object.keys(fa.local||{}).sort();

  var abcSection='<div style="margin-top:24px">'
    +'<div class="section-title" style="margin-bottom:16px">Favorabilidade de Pre\u00e7o &mdash; BOX_ALL_ABC (Todos Concorrentes)</div>'
    +'<div style="background:#F5F7FF;border:1px solid #C8D6FF;border-radius:10px;padding:14px 18px;margin-bottom:14px;font-size:12px;color:#555">'
    +'<strong>BOX_ALL_ABC</strong> mede o % de visitas onde o pre\u00e7o do seller \u00e9 \u2264 ao melhor pre\u00e7o entre <em>todos</em> os concorrentes mapeados (Amazon, Magalu, Shopee, etc.).<br>'
    +'<strong>LOCAL</strong> = considera parcelamento local &nbsp;|&nbsp; <strong>PIX</strong> = considera desconto PIX'
    +'</div>'
    +'<div class="kpi-row" style="margin-bottom:16px">'
      +'<div class="kpi-card '+(pFavL>=70?'green':pFavL>=50?'yellow':'red')+'">'
        +'<div class="kpi-label">% Favor\u00e1vel LOCAL</div>'
        +'<div class="kpi-value">'+pFavL+'%</div>'
        +'<div class="kpi-sub">Desfav\u00f3ravel: '+pExpL+'%</div>'
      +'</div>'
      +'<div class="kpi-card '+(pFavP>=70?'green':pFavP>=50?'yellow':'red')+'">'
        +'<div class="kpi-label">% Favor\u00e1vel PIX</div>'
        +'<div class="kpi-value">'+pFavP+'%</div>'
        +'<div class="kpi-sub">Desfavor\u00e1vel: '+pExpP+'%</div>'
      +'</div>'
      +'<div class="kpi-card blue"><div class="kpi-label">Gap LOCAL vs PIX</div><div class="kpi-value">'+(pFavP-pFavL>=0?'+':'')+(pFavP-pFavL).toFixed(1)+'pp</div><div class="kpi-sub">PIX melhora favorabilidade?</div></div>'
    +'</div>';

  // Chart BOX_ALL_ABC mensal
  if(mksAbc.length>0){
    var abcCanId=px+'-bpc-abc-canvas';
    abcSection+='<div class="section-title" style="margin-bottom:10px">Evolu\u00e7\u00e3o Mensal &mdash; BOX_ALL_ABC</div>'
      +'<div class="chart-box"><canvas id="'+abcCanId+'" style="max-height:240px"></canvas></div>';
  }

  // Table comparativa
  abcSection+='<div class="section-title" style="margin-top:18px;margin-bottom:10px">Compara\u00e7\u00e3o Mensal &mdash; BPC Transacional vs Favorabilidade</div>'
    +'<div class="table-wrap"><table><thead><tr style="background:#1A1A1A">'
    +'<th style="color:#fff;padding:9px 10px;font-size:11px">M\u00eas</th>'
    +'<th style="color:#fff;padding:9px 10px;font-size:11px;text-align:center">BPC Transacional</th>'
    +'<th style="color:#fff;padding:9px 10px;font-size:11px;text-align:center">Fav. LOCAL</th>'
    +'<th style="color:#fff;padding:9px 10px;font-size:11px;text-align:center">Fav. PIX</th>'
    +'<th style="color:#fff;padding:9px 10px;font-size:11px;text-align:center">Visitas Comparadas</th>'
    +'</tr></thead><tbody>'
    +mks.map(function(mk){
      var t=pt[mk]||0,b=pb[mk]||0,bpcP=t>0?b/t*100:0;
      var bpcCls=bpcP>=80?'pill-green':bpcP>=65?'pill-yellow':'pill-red';
      var localMk=(fa.local||{})[mk]||{};
      var pixMk=(fa.pix||{})[mk]||{};
      var fL=localMk.pct_favorable||0,fP=pixMk.pct_favorable||0;
      var fLcls=fL>=70?'pill-green':fL>=50?'pill-yellow':'pill-red';
      var fPcls=fP>=70?'pill-green':fP>=50?'pill-yellow':'pill-red';
      return '<tr style="border-bottom:1px solid #F0F0F0">'
        +'<td style="padding:8px 10px;font-weight:600">'+MESES_PT_CURTO[mk]+'</td>'
        +'<td style="padding:8px 10px;text-align:center"><span class="pill '+bpcCls+'">'+bpcP.toFixed(1)+'%</span></td>'
        +'<td style="padding:8px 10px;text-align:center">'+(fL>0?'<span class="pill '+fLcls+'">'+fL+'%</span>':'-')+'</td>'
        +'<td style="padding:8px 10px;text-align:center">'+(fP>0?'<span class="pill '+fPcls+'">'+fP+'%</span>':'-')+'</td>'
        +'<td style="padding:8px 10px;text-align:center;font-size:11px;color:#888">'+fmtN(localMk.visits_match||0)+'</td>'
        +'</tr>';
    }).join('')
    +'</tbody></table></div>';

  abcSection+='</div>';

  var bpcContainer=document.getElementById(px+'-bpc-canvas').parentNode;
  bpcContainer.insertAdjacentHTML('afterend',abcSection);

  // Render ABC chart after DOM insertion
  setTimeout(function(){
    var abcEl=document.getElementById(px+'-bpc-abc-canvas');
    if(abcEl&&mksAbc.length>0){
      destroyChart(px+'-bpc-abc');
      chartInstances[px+'-bpc-abc']=new Chart(abcEl.getContext('2d'),{
        type:'line',
        data:{labels:mksAbc.map(function(m){return m.slice(0,4)+'/'+m.slice(4);}),datasets:[
          {label:'Fav. LOCAL %',data:mksAbc.map(function(k){return (fa.local[k]||{}).pct_favorable||0;}),borderColor:'#3483FA',backgroundColor:'rgba(52,131,250,.1)',fill:true,tension:0.3,pointRadius:4},
          {label:'Fav. PIX %',data:mksAbc.map(function(k){return (fa.pix[k]||{}).pct_favorable||0;}),borderColor:'#00A650',backgroundColor:'rgba(0,166,80,.08)',fill:true,tension:0.3,pointRadius:4,borderDash:[5,3]},
          {label:'Meta 70%',data:mksAbc.map(function(){return 70;}),borderColor:'#FFB900',borderDash:[4,4],pointRadius:0,borderWidth:1.5}
        ]},
        options:{responsive:true,animation:false,
          scales:{y:{min:0,max:100,ticks:{callback:function(v){return v+'%';}}}},
          plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+c.raw+'%';}}}}}
      });
    }
  },50);

  var ba=document.getElementById(px+'-bpc-actions');
  if(ba){
    var top3=offs.slice(0,3);
    if(!top3.length){
      ba.innerHTML='<div class="action-card" style="border-left-color:#00A650"><div class="action-icon">✅</div><div><strong>BPC saudável</strong><p style="font-size:12px;color:#555;margin-top:4px">Nenhum item com BPC abaixo de 70% no período.</p></div></div>';
    }else{
      var cards=top3.map(function(it){
        var pctSB=Math.max(0,100-it.bb);
        var gmvSB=it.gmv*(pctSB/100);
        var cor=it.bb<50?'#F23D4F':it.bb<65?'#FF7A00':'#FFB900';
        var diag=it.bb<50?'Preço não competitivo — revisar precificação':it.bb<65?'BPC abaixo do ideal — avaliar ajuste de preço':'Oportunidade de melhoria';
        var href=mlLink(it);
        var nm=it.nm.substring(0,45)+(it.nm.length>45?'...':'');
        return '<div class="action-card" style="border-left-color:'+cor+'">'
          +'<div class="action-icon">🎯</div>'
          +'<div style="flex:1">'
            +'<strong><a href="'+href+'" target="_blank" style="color:#1A1A1A;text-decoration:none">'+nm+'</a></strong>'
            +'<div style="display:flex;gap:12px;margin-top:6px;flex-wrap:wrap">'
              +'<span style="font-size:11px;background:#FDECEA;color:#F23D4F;padding:2px 10px;border-radius:12px;font-weight:700">BPC: '+it.bb.toFixed(0)+'%</span>'
              +'<span style="font-size:11px;color:#555">GMV s/BB: <strong>'+fmt(gmvSB)+'</strong></span>'
              +'<span style="font-size:11px;color:#888">'+it.mlb_id+'</span>'
            +'</div>'
            +'<p style="font-size:12px;color:#555;margin-top:4px;line-height:1.5">'+diag+'</p>'
          +'</div>'
        +'</div>';
      }).join('');
      ba.innerHTML=cards;
    }
  }
}
function buildBPCNeg(g,px){
  var el=document.getElementById(px+'-bpc-neg');
  if(!el)return;
  var key='bpcneg_'+px;
  var items=JSON.parse(localStorage.getItem(key)||'[]');
  var rows=items.map(function(it,i){
    return '<tr><td>'+it.iid+'</td><td style="max-width:180px;overflow:hidden;text-overflow:ellipsis">'+it.nm+'</td><td>R$'+it.pa+'</td><td>R$'+it.pp+'</td><td>'+it.st+'</td><td>'+it.nt+'</td><td><button onclick="delBPCNeg(\''+px+'\','+i+')" style="background:#F23D4F;color:#fff;border:none;border-radius:4px;padding:1px 6px;cursor:pointer;font-size:10px">Del</button></td></tr>';
  }).join('');
  el.innerHTML='<table class="tbl" style="width:100%;margin-bottom:12px"><thead><tr style="background:#3483FA"><th style="color:#fff">ID</th><th style="color:#fff">Título</th><th style="color:#fff">Preço Atual</th><th style="color:#fff">Proposto</th><th style="color:#fff">Status</th><th style="color:#fff">Notas</th><th style="color:#fff">Del</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7" style="text-align:center;color:#aaa;padding:16px">Nenhum item</td></tr>')+'</tbody></table>'+
  '<form onsubmit="addBPCNeg(event,\''+px+'\')" style="background:#F5F7FF;border-radius:8px;padding:12px;display:flex;gap:6px;flex-wrap:wrap;align-items:flex-end">'+
  '<input id="bpcni_'+px+'" placeholder="Item ID" style="border:1px solid #ddd;border-radius:5px;padding:4px 7px;font-size:11px;width:100px">'+
  '<input id="bpcnn_'+px+'" placeholder="Título" style="border:1px solid #ddd;border-radius:5px;padding:4px 7px;font-size:11px;width:160px">'+
  '<input id="bpcpa_'+px+'" placeholder="Preço Atual" style="border:1px solid #ddd;border-radius:5px;padding:4px 7px;font-size:11px;width:90px">'+
  '<input id="bpcpp_'+px+'" placeholder="Proposto" style="border:1px solid #ddd;border-radius:5px;padding:4px 7px;font-size:11px;width:90px">'+
  '<select id="bpcst_'+px+'" style="border:1px solid #ddd;border-radius:5px;padding:4px 7px;font-size:11px"><option>Identificado</option><option>Negociando</option><option>Fechado</option><option>Sem acordo</option></select>'+
  '<input id="bpcnt_'+px+'" placeholder="Notas" style="border:1px solid #ddd;border-radius:5px;padding:4px 7px;font-size:11px;width:140px">'+
  '<button type="submit" style="background:#3483FA;color:#fff;border:none;border-radius:5px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer">Adicionar</button></form>';
}
function addBPCNeg(e,px){
  e.preventDefault();
  var key='bpcneg_'+px;
  var items=JSON.parse(localStorage.getItem(key)||'[]');
  items.push({iid:document.getElementById('bpcni_'+px).value,nm:document.getElementById('bpcnn_'+px).value,pa:document.getElementById('bpcpa_'+px).value,pp:document.getElementById('bpcpp_'+px).value,st:document.getElementById('bpcst_'+px).value,nt:document.getElementById('bpcnt_'+px).value});
  localStorage.setItem(key,JSON.stringify(items));
  var g=PREFIX_TO_GRUPO[px];
  if(g)buildSellerBPC(g,px);
}
function delBPCNeg(px,i){
  var key='bpcneg_'+px;
  var items=JSON.parse(localStorage.getItem(key)||'[]');
  items.splice(i,1);
  localStorage.setItem(key,JSON.stringify(items));
  var g=PREFIX_TO_GRUPO[px];
  if(g)buildSellerBPC(g,px);
}
function buildCategorias(g,px){
  // Prefer monthly data filtered by PERIODO; fall back to flat 90d aggregate
  var catRaw=[];
  var monthlySrc=typeof CAT_DATA_MONTHLY!=='undefined'?(CAT_DATA_MONTHLY[g]||{}):{};
  var hasMonthly=Object.keys(monthlySrc).length>0;
  if(hasMonthly&&PERIODO&&PERIODO.length){
    var catMap={};
    PERIODO.forEach(function(mk){
      (monthlySrc[mk]||[]).forEach(function(c){
        var key=c.d1+'||'+c.cat;
        if(!catMap[key])catMap[key]={d1:c.d1,cat:c.cat,gmv:0,si:0,n:0};
        catMap[key].gmv+=c.gmv||0;
        catMap[key].si +=c.si ||0;
        catMap[key].n  +=c.n  ||0;
      });
    });
    catRaw=Object.values(catMap);
  }else{
    catRaw=(CAT_DATA[g]||[]).slice();
  }
  var allCats=catRaw.slice().sort(function(a,b){return b.gmv-a.gmv;});
  var top=allCats.slice(0,8);
  var outros=allCats.slice(8);
  var outrosGMV=outros.reduce(function(s,c){return s+c.gmv;},0);
  var outrosSI=outros.reduce(function(s,c){return s+c.si;},0);
  if(outrosGMV>0)top.push({cat:'Outros',gmv:outrosGMV,si:outrosSI,n:outros.length});
  var cats=top.map(function(c){return [c.cat,{gmv:c.gmv,si:c.si,n:c.n}];});
  var total=allCats.reduce(function(a,c){return a+c.gmv;},0);
  var totalSI=allCats.reduce(function(a,c){return a+c.si;},0);
  var top1=allCats[0]||{cat:'-',gmv:0};
  var conc3=allCats.slice(0,3).reduce(function(s,c){return s+c.gmv;},0);
  var conc3pct=total>0?conc3/total*100:0;
  var skus=allCats.reduce(function(s,c){return s+(c.n||0);},0);

  // KPIs — período selecionado
  var perLabel=PERIODO&&PERIODO.length===1?(MESES_PT_CURTO[PERIODO[0]]||'Período'):'YTD';
  var elKpi=document.getElementById(px+'-cat2-kpi');
  if(elKpi)elKpi.innerHTML=kpiHtml([
    {label:'Categorias com GMV ('+perLabel+')',val:allCats.length,sub:'Top por GMV',cls:'blue'},
    {label:'Concentra\u00e7\u00e3o nas 3 maiores',val:conc3pct.toFixed(1)+'%',sub:allCats.slice(0,3).map(function(c){return c.cat.split(' ')[0];}).join(', '),cls:conc3pct>80?'red':conc3pct>60?'yellow':'green'},
    {label:top1.cat,val:fmt(top1.gmv),sub:'Top categoria',cls:'blue'},
    {label:'SKUs com venda ('+perLabel+')',val:fmtN(skus),sub:'itens distintos',cls:'blue'}
  ]);

  var colors=['#3483FA','#00A650','#FF7A00','#F23D4F','#9B59B6','#FFB900','#3498DB','#E74C3C','#888'];

  // Donut chart
  destroyChart(px+'-cat2');
  var c1=document.getElementById(px+'-cat2-chart');
  if(c1)chartInstances[px+'-cat2']=new Chart(c1.getContext('2d'),{
    type:'doughnut',
    data:{labels:cats.map(function(c){return c[0];}),datasets:[{data:cats.map(function(c){return c[1].gmv;}),backgroundColor:colors,borderWidth:2,borderColor:'#fff'}]},
    options:{responsive:true,animation:false,cutout:'60%',
      plugins:{
        legend:{position:'right',labels:{font:{size:10},usePointStyle:true,pointStyleWidth:12}},
        tooltip:{callbacks:{label:function(c){return c.label+': '+fmt(c.raw)+' ('+(c.raw/Math.max(total,1)*100).toFixed(1)+'%';}}},
        datalabels:{
          display:function(ctx){return ctx.dataIndex<3;},
          anchor:'end',align:'end',offset:6,
          color:function(ctx){return colors[ctx.dataIndex]||'#333';},
          font:{size:10,weight:'700'},
          formatter:function(value,ctx){
            var sh=(value/Math.max(total,1)*100).toFixed(1);
            var nm=fmt(value);
            return sh+'%\n'+nm;
          },
          textAlign:'center'
        }
      }
    }
  });

  // Pareto chart (bar + line)
  var cumGMV=0;
  var paretoData=allCats.slice(0,Math.min(allCats.length,15)).map(function(c){cumGMV+=c.gmv;return parseFloat((cumGMV/Math.max(total,1)*100).toFixed(1));});
  // Labels: nome completo quebrado em palavras (array = quebra de linha no Chart.js)
  var paretoLabels=allCats.slice(0,15).map(function(c){
    var words=c.cat.split(' ');
    // Quebrar em linhas de até 2 palavras
    var lines=[];
    for(var w=0;w<words.length;w+=2) lines.push(words.slice(w,w+2).join(' '));
    return lines;
  });
  destroyChart(px+'-pareto');
  var c2=document.getElementById(px+'-pareto-chart');
  if(c2)chartInstances[px+'-pareto']=new Chart(c2.getContext('2d'),{
    type:'bar',
    data:{labels:paretoLabels,datasets:[
      {label:'GMV',data:allCats.slice(0,15).map(function(c){return c.gmv;}),backgroundColor:'rgba(52,131,250,.7)',borderRadius:3,order:2,yAxisID:'y'},
      {label:'Acumulado %',data:paretoData,type:'line',borderColor:'#F23D4F',backgroundColor:'transparent',tension:0.3,pointRadius:4,pointBackgroundColor:'#F23D4F',order:1,yAxisID:'y1'}
    ]},
    options:{responsive:true,animation:false,
      scales:{
        x:{ticks:{font:{size:9},maxRotation:30,minRotation:0}},
        y:{type:'linear',position:'left',ticks:{callback:function(v){return fmt(v);}}},
        y1:{type:'linear',position:'right',min:0,max:100,grid:{drawOnChartArea:false},ticks:{callback:function(v){return v+'%';}}}
      },
      plugins:{legend:{position:'top',labels:{usePointStyle:true,font:{size:11}}},tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+(c.datasetIndex===0?fmt(c.raw):c.raw+'%');},title:function(items){return Array.isArray(items[0].label)?items[0].label.join(' '):items[0].label;}}}}
    }
  });

  // Table — igual Larissa: Categoria | GMV YTD | Share | SIs | Itens | NASP
  var th=function(t,al){return '<th style="padding:12px 16px;font-size:11px;font-weight:800;color:#1A1A1A;text-align:'+(al||'left')+';white-space:nowrap">'+t+'</th>';};
  var hdr='<thead><tr style="background:#FFE600">'+th('Categoria')+th('GMV ('+perLabel+')','right')+th('Share','center')+th('SIs','right')+th('Itens','right')+th('NASP','right')+'</tr></thead>';
  var bdy='<tbody>'+allCats.map(function(c,i){
    var bg=i%2===0?'#fff':'#FAFAFA';
    var sh=total>0?c.gmv/total*100:0;
    var asp=c.si>0?Math.round(c.gmv/c.si):0;
    var shIntensity=sh>=30?'#3483FA':sh>=10?'#3483FA':'#3483FA';
    var shBg=sh>=30?'#C8DCFF':sh>=10?'#D8E8FF':'#E8F0FF';
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'
      +'<td style="padding:12px 16px;font-size:13px;font-weight:700;color:#1A1A1A">'+c.cat+'</td>'
      +'<td style="padding:12px 16px;text-align:right;font-size:13px;font-weight:700;color:#1A1A1A;white-space:nowrap">'+fmt(c.gmv)+'</td>'
      +'<td style="padding:12px 16px;text-align:center"><span style="background:'+shBg+';color:'+shIntensity+';font-size:11px;font-weight:800;padding:4px 12px;border-radius:20px">'+sh.toFixed(1)+'%</span></td>'
      +'<td style="padding:12px 16px;text-align:right;font-size:12px;color:#555;white-space:nowrap">'+fmtN(c.si)+'</td>'
      +'<td style="padding:12px 16px;text-align:right;font-size:12px;color:#555">'+(c.n||0)+'</td>'
      +'<td style="padding:12px 16px;text-align:right;font-size:12px;color:#555;white-space:nowrap">'+(asp>0?'R$ '+asp.toLocaleString('pt-BR'):'-')+'</td>'
      +'</tr>';
  }).join('')+'</tbody>';
  var tbl=document.getElementById(px+'-cat2-tbl');
  if(tbl)tbl.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff">'+hdr+bdy+'</table></div>';
}

function buildYoY(g,px){
  var mks=MESES_DONE,rm=REAL_MENSAL[g]||{},r25=REAL_2025[g]||{};
  var ytd26=ytdReal(g),ytd25=PERIODO.reduce(function(a,k){return a+(r25[k]?r25[k].gmv:0);},0);
  var yoy=ytd25>0?((ytd26-ytd25)/ytd25*100):0;
  var elKpi=document.getElementById(px+'-yoy-kpi');
  if(elKpi)elKpi.innerHTML=kpiHtml([
    {label:'GMV YTD 2026',val:fmt(ytd26),sub:'atual',cls:'blue'},
    {label:'GMV YTD 2025',val:fmt(ytd25),sub:'mesmo período',cls:'blue'},
    {label:'YoY %',val:(yoy>=0?'+':'')+yoy.toFixed(1)+'%',sub:'variação anual',cls:yoy>=0?'green':'red'}
  ]);
  destroyChart(px+'-yoy');
  var canEl=document.getElementById(px+'-yoy-chart');
  if(canEl){
    chartInstances[px+'-yoy']=new Chart(canEl.getContext('2d'),{
      type:'bar',
      data:{labels:mks.map(function(k){return MESES_PT_CURTO[k];}),datasets:[
        {label:'2026',data:mks.map(function(k){return rm[k]||0;}),backgroundColor:C_BLUE,borderRadius:3},
        {label:'2025',data:mks.map(function(k){return r25[k]?r25[k].gmv:0;}),backgroundColor:'#CCC',borderRadius:3}
      ]},
      options:{responsive:true,animation:false,plugins:{legend:{position:'top'},tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+fmt(c.raw);}}}},scales:{y:{ticks:{callback:function(v){return fmt(v);}}}}}
    });
  }
  var hdr='<thead><tr style="background:#FFE600"><th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:800;color:#1A1A1A">Mês</th><th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:800;color:#1A1A1A">2026</th><th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:800;color:#1A1A1A">2025</th><th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:800;color:#1A1A1A">YoY %</th><th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:800;color:#1A1A1A">MoM % 2026</th></tr></thead>';
  var bdy='<tbody>'+mks.map(function(k,i){
    var v26=rm[k]||0,v25=r25[k]?r25[k].gmv:0,yy=v25>0?((v26-v25)/v25*100):0;
    var prevK=i>0?mks[i-1]:null,vPrev=prevK?(rm[prevK]||0):0;
    var mom=vPrev>0?((v26-vPrev)/vPrev*100):null;
    var momHtml=mom===null?'<span style="color:#CCC">—</span>'
      :'<span style="background:'+(mom>=0?'rgba(0,166,80,.12)':'rgba(242,61,79,.1)')+';color:'+(mom>=0?'#00A650':'#F23D4F')+';font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px">'+(mom>=0?'▲':'▼')+' '+(mom>=0?'+':'')+mom.toFixed(1)+'%</span>';
    var rowBg=i%2===0?'#fff':'#FAFAFA';
    return '<tr style="background:'+rowBg+';border-bottom:1px solid #F0F0F0"><td style="padding:10px 14px;font-weight:700;color:#1A1A1A">'+MESES_PT_CURTO[k]+'</td><td style="padding:10px 12px;text-align:right;color:#555">'+fmt(v26)+'</td><td style="padding:10px 12px;text-align:right;color:#888">'+fmt(v25)+'</td><td style="padding:10px 12px;text-align:center"><span class="pill '+(yy>=0?'pill-green':'pill-red')+'">'+(yy>=0?'+':'')+yy.toFixed(1)+'%</span></td><td style="padding:10px 12px;text-align:center">'+momHtml+'</td></tr>';
  }).join('')+'</tbody>';
  var tbl=document.getElementById(px+'-yoy-tbl');
  if(tbl)tbl.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff">'+hdr+bdy+'</table></div>';
}
function buildComp(g,px){
  var fav=FAV_DATA[g]||{};
  var monthly=fav.monthly||{},rivals=fav.by_rival||{},domains=fav.by_domain||{},lat=fav.latest||{};
  var pFav=lat.pct_favorable||0,pExp=lat.pct_expensive||0,rival=lat.rival||'N/A';
  var elKpi=document.getElementById(px+'-comp-kpi');
  if(elKpi)elKpi.innerHTML=kpiHtml([
    {label:'% Favorável (Últ. mês)',val:pFav+'%',sub:'Preço ≤ concorrente',cls:pFav>=70?'green':pFav>=50?'yellow':'red'},
    {label:'% Desfavorável',val:pExp+'%',sub:'Mais caro que concorrente',cls:pExp>50?'red':'yellow'},
    {label:'Principal Rival',val:rival,sub:'maior volume comparado',cls:'blue'}
  ]);
  var mks=Object.keys(monthly).sort();
  destroyChart(px+'-comp');
  var canEl=document.getElementById(px+'-comp-canvas');
  if(canEl&&mks.length){
    chartInstances[px+'-comp']=new Chart(canEl.getContext('2d'),{
      type:'bar',
      data:{labels:mks.map(function(m){return m.slice(0,4)+'/'+m.slice(4);}),datasets:[
        {label:'% Favorável',data:mks.map(function(k){return monthly[k].pct_favorable||0;}),backgroundColor:'rgba(0,166,80,.75)',borderRadius:3},
        {label:'% Desfavorável',data:mks.map(function(k){return monthly[k].pct_expensive||0;}),backgroundColor:'rgba(242,61,79,.6)',borderRadius:3}
      ]},
      options:{responsive:true,animation:false,scales:{x:{stacked:true},y:{stacked:true,max:100,ticks:{callback:function(v){return v+'%';}}}},plugins:{legend:{position:'bottom'}}}
    });
  }
  var thC='padding:11px 16px;font-size:11px;font-weight:800;color:#1A1A1A;white-space:nowrap';
  function compRow(cols,i){
    var bg=i%2===0?'#fff':'#FAFAFA';
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'+cols+'</tr>';
  }
  function tdC(v,al,bold,color){
    return '<td style="padding:11px 16px;font-size:13px;text-align:'+(al||'left')+';font-weight:'+(bold?'700':'400')+';color:'+(color||'#444')+';white-space:nowrap">'+v+'</td>';
  }
  function favPill(p){
    var clr=p>=70?'#00A650':p>=50?'#B07A00':'#F23D4F';
    var bg=p>=70?'rgba(0,166,80,.12)':p>=50?'rgba(255,185,0,.15)':'rgba(242,61,79,.1)';
    return '<span style="background:'+bg+';color:'+clr+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">'+p+'%</span>';
  }
  function desfavPill(p){
    var clr=p>50?'#F23D4F':p>30?'#B07A00':'#555';
    var bg=p>50?'rgba(242,61,79,.1)':p>30?'rgba(255,185,0,.1)':'rgba(0,0,0,.04)';
    return '<span style="background:'+bg+';color:'+clr+';font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px">'+p+'%</span>';
  }

  var rt=document.getElementById(px+'-comp-rival-table');
  if(rt){
    var rEntries=Object.entries(rivals).slice(0,6).sort(function(a,b){return b[1].visits_match-a[1].visits_match;});
    var rHdr='<thead><tr style="background:#FFE600">'
      +'<th style="'+thC+';text-align:left">Concorrente</th>'
      +'<th style="'+thC+';text-align:right">Visitas Comparadas</th>'
      +'<th style="'+thC+';text-align:center">% Favorável</th>'
      +'<th style="'+thC+';text-align:center">% Desfavorável</th>'
      +'</tr></thead>';
    var rBdy='<tbody>'+rEntries.map(function(r,i){
      return compRow(
        tdC('<strong>'+r[0]+'</strong>','left',true,'#1A1A1A')
        +tdC(fmtN(r[1].visits_match),'right',false,'#555')
        +'<td style="padding:11px 16px;text-align:center">'+favPill(r[1].pct_favorable)+'</td>'
        +'<td style="padding:11px 16px;text-align:center">'+desfavPill(r[1].pct_expensive)+'</td>',i);
    }).join('')+'</tbody>';
    rt.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff">'+rHdr+rBdy+'</table></div>';
  }

  var dt=document.getElementById(px+'-comp-dom-table');
  if(dt){
    var dEntries=Object.entries(domains).slice(0,8).sort(function(a,b){return b[1].visits_match-a[1].visits_match;});
    var dHdr='<thead><tr style="background:#FFE600">'
      +'<th style="'+thC+';text-align:left">Categoria</th>'
      +'<th style="'+thC+';text-align:right">Visitas Comparadas</th>'
      +'<th style="'+thC+';text-align:center">% Favorável</th>'
      +'<th style="'+thC+';text-align:center">% Desfavorável</th>'
      +'</tr></thead>';
    var dBdy='<tbody>'+dEntries.map(function(d,i){
      return compRow(
        '<td style="padding:11px 16px;font-size:12px;font-weight:600;color:#1A1A1A;text-transform:uppercase;letter-spacing:.3px">'+d[0]+'</td>'
        +tdC(fmtN(d[1].visits_match),'right',false,'#555')
        +'<td style="padding:11px 16px;text-align:center">'+favPill(d[1].pct_favorable)+'</td>'
        +'<td style="padding:11px 16px;text-align:center">'+desfavPill(d[1].pct_expensive)+'</td>',i);
    }).join('')+'</tbody>';
    dt.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff">'+dHdr+dBdy+'</table></div>';
  }
}
function exportCSV(tid,name){
  var t=document.getElementById(tid);if(!t)return;
  var rows=Array.from(t.querySelectorAll('tr')).map(function(r){return Array.from(r.querySelectorAll('th,td')).map(function(c){return '"'+c.innerText.replace(/"/g,'""')+'"';}).join(',');});
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(rows.join('\n'));
  a.download=name+'_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
}

// ÔöÇÔöÇ Visúo Geral ÔöÇÔöÇ
function buildHighsLows(){
  var el=document.getElementById('vg-highs-lows');
  if(!el)return;

  // Build stats for all groups
  var stats=GRUPOS.map(function(g){
    var ytd=ytdReal(g),mf=ytdMF(g),md=ytdMD(g);
    var pFin=mf>0?pctNum(ytd,mf):0,pDes=md>0?pctNum(ytd,md):0;
    var g25=REAL_2025[g]||{};
    var ytd25=PERIODO.reduce(function(s,k){return s+(g25[k]?g25[k].gmv:0);},0);
    var yoy=ytd25>0?((ytd-ytd25)/ytd25*100):null;
    var pt=PERIODO.reduce(function(a,k){return a+((REAL_PED_TOT[g]||{})[k]||0);},0);
    var pb=PERIODO.reduce(function(a,k){return a+((REAL_PED_BB[g]||{})[k]||0);},0);
    var bpc=pt>0?pb/pt*100:0;
    var ff=ytdFF(g),pFF=ytd>0?ff/ytd*100:0;
    var fav=(FAV_DATA[g]||{}).latest||{};
    return {g:g,ytd:ytd,mf:mf,md:md,pFin:pFin,pDes:pDes,yoy:yoy,bpc:bpc,pFF:pFF,fav:fav.pct_favorable||0,rival:fav.rival||''};
  });

  // Sort by % Meta Fin
  var sorted=[].concat(stats).sort(function(a,b){return b.pFin-a.pFin;});
  var n=sorted.length;
  var bestFin=sorted[0],worstFin=sorted[n-1];
  var bestBPC=[].concat(stats).sort(function(a,b){return b.bpc-a.bpc;})[0];
  var worstBPC=[].concat(stats).sort(function(a,b){return a.bpc-b.bpc;})[0];
  var bestFF=[].concat(stats).sort(function(a,b){return b.pFF-a.pFF;})[0];
  var worstFF=[].concat(stats).sort(function(a,b){return a.pFF-b.pFF;})[0];

  // MoM: compare last month vs previous month
  var mks=MESES_DONE;
  var curMk=mks[mks.length-1],prevMk=mks.length>1?mks[mks.length-2]:null;
  var bestMoM=null,worstMoM=null;
  if(prevMk){
    stats.forEach(function(s){
      var c=(REAL_MENSAL[s.g]||{})[curMk]||0,p=(REAL_MENSAL[s.g]||{})[prevMk]||0;
      var mom=p>0?(c-p)/p*100:null;
      if(mom===null)return;
      if(!bestMoM||mom>bestMoM.mom)bestMoM={g:s.g,mom:mom};
      if(!worstMoM||mom<worstMoM.mom)worstMoM={g:s.g,mom:mom};
    });
  }

  // Best YoY
  var statsWithYoY=stats.filter(function(s){return s.yoy!==null;});
  var bestYoY=statsWithYoY.sort(function(a,b){return b.yoy-a.yoy;})[0];

  // ÔöÇÔöÇ Row item helper (Larissa style)
  function hlRow(icon,iconBg,name,label,value,valueColor){
    return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F5F5F5">'
      +'<div style="width:38px;height:38px;border-radius:10px;background:'+iconBg+';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">'+icon+'</div>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:12px;font-weight:800;color:#1A1A1A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+name+'</div>'
        +'<div style="font-size:10.5px;color:#888;margin-top:1px">'+label+'</div>'
      +'</div>'
      +'<div style="font-size:12.5px;font-weight:800;color:'+valueColor+';white-space:nowrap;text-align:right">'+value+'</div>'
      +'</div>';
  }

  // ÔöÇÔöÇ HIGHS column
  var highsHTML='<div style="background:#fff;border-radius:14px;padding:22px;box-shadow:0 2px 8px rgba(0,0,0,.07);flex:1;min-width:260px">'
    +'<div style="display:flex;align-items:center;gap:7px;margin-bottom:16px">'
      +'<span style="background:#E6F7EE;color:#00A650;font-size:10px;font-weight:800;padding:4px 10px;border-radius:20px;letter-spacing:.3px">▲ HIGHS</span>'
    +'</div>'
    +hlRow('🏆','#FFF9E6',bestFin.g,'Melhor atingimento',bestFin.pFin.toFixed(1)+'% Meta Fin','#00A650')
    +hlRow('🛒','#E6F0FF',bestBPC.g,'Melhor BPC',bestBPC.bpc.toFixed(1)+'% buybox','#00A650')
    +hlRow('🚀','#FFF0E6',bestFF.g,'Maior Fulfillment',bestFF.pFF.toFixed(1)+'% FF','#00A650')
    +(bestYoY?hlRow('📊','#E6F7EE',bestYoY.g,'Maior crescimento YoY',(bestYoY.yoy>=0?'+':'')+bestYoY.yoy.toFixed(1)+'% vs 2025','#00A650'):'')
    +'</div>';

  // ÔöÇÔöÇ LOWS column
  var lowsHTML='<div style="background:#fff;border-radius:14px;padding:22px;box-shadow:0 2px 8px rgba(0,0,0,.07);flex:1;min-width:260px">'
    +'<div style="display:flex;align-items:center;gap:7px;margin-bottom:16px">'
      +'<span style="background:#FDECEA;color:#F23D4F;font-size:10px;font-weight:800;padding:4px 10px;border-radius:20px;letter-spacing:.3px">▼ LOWS</span>'
    +'</div>'
    +hlRow('📉','#FDECEA',worstFin.g,'Menor atingimento',worstFin.pFin.toFixed(1)+'% Meta Fin','#F23D4F')
    +hlRow('🛒','#FFF0F0',worstBPC.g,'BPC mais cr\u00edtico',worstBPC.bpc.toFixed(1)+'% buybox','#F23D4F')
    +hlRow('🚛','#FFF3E0',worstFF.g,'Menor Fulfillment',worstFF.pFF.toFixed(1)+'% FF','#FF7A00')
    +(worstMoM?hlRow('📋','#FFF5F5',worstMoM.g,'Maior queda MoM',(worstMoM.mom>=0?'+':'')+worstMoM.mom.toFixed(1)+'% vs m\u00eas anterior','#F23D4F'):'')
    +'</div>';

  // ÔöÇÔöÇ INSIGHTS column
  var totalGMV=GRUPOS.reduce(function(s,g){return s+ytdReal(g);},0);
  var totalMF=GRUPOS.reduce(function(s,g){return s+ytdMF(g);},0);
  var above100=stats.filter(function(s){return s.pFin>=100;});
  var below80=stats.filter(function(s){return s.pFin<80;});
  var avgBPC=stats.reduce(function(s,x){return s+x.bpc;},0)/Math.max(stats.length,1);
  var totalYTD25=GRUPOS.reduce(function(s,g){var g25=REAL_2025[g]||{};return s+PERIODO.reduce(function(ss,k){return ss+(g25[k]?g25[k].gmv:0);},0);},0);
  var yoyCart=totalYTD25>0?((totalGMV-totalYTD25)/totalYTD25*100):null;
  // Top item
  var topItem=null;
  GRUPOS.forEach(function(g){var items=getItemsForPeriod(g);if(items.length&&(!topItem||items[0].gmv>topItem.gmv))topItem=Object.assign({},items[0],{g:g});});

  function insRow(icon,text){
    return '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #F5F5F5">'
      +'<span style="font-size:18px;flex-shrink:0;margin-top:1px">'+icon+'</span>'
      +'<span style="font-size:12px;color:#444;line-height:1.5">'+text+'</span>'
      +'</div>';
  }

  var insHTML='<div style="background:#F5F7FF;border-radius:14px;padding:22px;box-shadow:0 2px 8px rgba(0,0,0,.07);flex:1;min-width:260px">'
    +'<div style="display:flex;align-items:center;gap:7px;margin-bottom:16px">'
      +'<span style="background:#DDEEFF;color:#3483FA;font-size:10px;font-weight:800;padding:4px 10px;border-radius:20px;letter-spacing:.3px">💡 INSIGHTS</span>'
    +'</div>'
    +insRow('💡',above100.length>0
      ?'<strong>'+above100.map(function(s){return s.g;}).join(', ')+'</strong> '+(above100.length===1?'\u00e9 o \u00fanico grupo':'s\u00e3o os grupos')+' acima de 100% da Meta Financeira YTD.'
      :'Nenhum grupo atingiu 100% da Meta Financeira ainda — aten\u00e7\u00e3o no ritmo.')
    +(below80.length>0?insRow('⚠️','<strong>'+below80.length+' grupo(s)</strong> abaixo de 80% da meta: '+below80.map(function(s){return s.g+' ('+s.pFin.toFixed(0)+'%)';}).join(', ')+'.'):'')
    +insRow('📈','BPC m\u00e9dio da carteira: <strong>'+avgBPC.toFixed(1)+'%</strong>. '+(avgBPC<80?'Abaixo da refer\u00eancia de 80% \u2014 oportunidade de recupera\u00e7\u00e3o de GMV.':'Dentro da zona de conforto.'))
    +(yoyCart!==null?insRow('📉','Carteira cresceu <strong style="color:'+(yoyCart>=0?'#00A650':'#F23D4F')+'">'+(yoyCart>=0?'+':'')+yoyCart.toFixed(1)+'%</strong> vs mesmo per\u00edodo de 2025.'):'')
    +(topItem?insRow('🛒','Item top: <strong>'+(topItem.nm||'').substring(0,40)+'...</strong> representa <strong>'+pctNum(topItem.gmv,totalGMV).toFixed(1)+'%</strong> do GMV total da carteira.'):'')
    +'</div>';

  el.innerHTML='<div style="display:flex;gap:16px;flex-wrap:wrap">'+highsHTML+lowsHTML+insHTML+'</div>';
}

function buildCatNMV(){
  // Agrega categorias de acordo com PERIODO selecionado (ou todos os meses se YTD)
  var cats=[];
  var catMap={};
  var src=typeof CAT_DATA_MONTHLY!=='undefined'?CAT_DATA_MONTHLY:null;
  var totalSrc=src?(src['CARTEIRA TOTAL']||null):null;
  if(totalSrc){
    // Se PERIODO vazio = YTD: usa todos os meses disponíveis
    var mksUse=(PERIODO&&PERIODO.length>0)?PERIODO:Object.keys(totalSrc);
    mksUse.forEach(function(mk){
      var mItems=totalSrc[mk]||[];
      mItems.forEach(function(c){
        var key=c.d1+'||'+c.cat;
        if(!catMap[key])catMap[key]={d1:c.d1,cat:c.cat,gmv:0,si:0,n:0};
        catMap[key].gmv+=c.gmv||0;
        catMap[key].si +=c.si ||0;
        catMap[key].n  +=c.n  ||0;
      });
    });
    cats=Object.values(catMap).sort(function(a,b){return b.gmv-a.gmv;});
  }
  // Fallback: dados agregados sem filtro de mês
  if(!cats.length&&typeof CAT_DATA!=='undefined'){
    cats=(CAT_DATA['CARTEIRA TOTAL']||[]).slice();
    GRUPOS.forEach(function(g){(CAT_DATA[g]||[]).forEach(function(c){cats.push(c);});});
  }
  if(!cats.length)return;
  // Agregar D1
  var d1Map={};
  cats.forEach(function(c){
    var d1=c.d1||'Outros';
    d1Map[d1]=(d1Map[d1]||0)+c.gmv;
  });
  var d1Total=Object.values(d1Map).reduce(function(s,v){return s+v;},0);
  var d1List=Object.entries(d1Map).sort(function(a,b){return b[1]-a[1];});
  var D1_COLORS=['#3483FA','#FFE600','#00A650','#F23D4F','#FF7A00','#9B59B6','#3498DB','#E74C3C'];
  // Donut
  var dEl=document.getElementById('vg-cat-donut');
  if(dEl){
    destroyChart('vg-cat-donut');
    chartInstances['vg-cat-donut']=new Chart(dEl.getContext('2d'),{
      type:'doughnut',
      data:{
        labels:d1List.map(function(e){return e[0];}),
        datasets:[{data:d1List.map(function(e){return e[1];}),backgroundColor:D1_COLORS,borderWidth:2,borderColor:'#fff'}]
      },
      options:{responsive:true,maintainAspectRatio:false,animation:false,cutout:'60%',
        plugins:{legend:{position:'right',labels:{font:{size:11},padding:8,boxWidth:14}},
                 tooltip:{callbacks:{label:function(c){var pct=d1Total>0?(c.raw/d1Total*100).toFixed(1):'0';return c.label+': '+fmt(c.raw)+' ('+pct+'%)';}}}}}
    });
    // Forçar resize para garantir renderização mesmo se o canvas estava oculto
    setTimeout(function(){if(chartInstances['vg-cat-donut'])chartInstances['vg-cat-donut'].resize();},100);
  }
  // Breakdown D2
  var bEl=document.getElementById('vg-cat-breakdown');
  if(!bEl)return;
  var d2List=cats.slice().sort(function(a,b){return b.gmv-a.gmv;}).slice(0,15);
  var d2Total=d1Total;
  bEl.innerHTML='<div style="font-weight:700;font-size:12px;color:#333;margin-bottom:10px">Breakdown D2</div>'
    +d2List.map(function(c){
      var pct=d2Total>0?(c.gmv/d2Total*100).toFixed(1):0;
      var barW=Math.round(pct/d2List[0].gmv*d2Total/d2Total*100*d2Total/d2List[0].gmv)+'%';
      var maxPct=d2Total>0?d2List[0].gmv/d2Total*100:1;
      var relW=Math.round(c.gmv/d2List[0].gmv*100)+'%';
      return '<div style="margin-bottom:8px">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">'
          +'<span style="font-size:11px;font-weight:600;color:#333;text-transform:uppercase">'+c.cat+'</span>'
          +'<span style="font-size:11px;color:#555;white-space:nowrap;margin-left:8px">'+fmt(c.gmv)+' <span style="color:#888">('+pct+'%)</span></span>'
        +'</div>'
        +'<div style="height:5px;background:#F0F0F0;border-radius:3px">'
          +'<div style="height:5px;background:#3483FA;border-radius:3px;width:'+relW+'"></div>'
        +'</div>'
      +'</div>';
    }).join('');
}

function buildVisaoGeral(){
  buildVGKPIs();
  buildNMVDiario35d();
  setTimeout(buildCatNMV,500);
  buildVGHeatmap();
  buildVGUnifiedCards();
  buildHighsLows();
  setTimeout(buildVGLineChart, 200);
  buildVGScorecard();
  buildCorpAcionaveis();
  setTimeout(buildSellersConsolidated,300);
}
function buildVGKPIs(){
  // Idêntico Larissa: 6 KPIs
  var totalYTD =GRUPOS.reduce(function(s,g){return s+ytdReal(g);},0);
  var totalNMV =GRUPOS.reduce(function(s,g){return s+ytdNMV(g);},0);
  var totalTGMV=GRUPOS.reduce(function(s,g){return s+ytdTGMV(g);},0);
  var totalMF  =GRUPOS.reduce(function(s,g){return s+ytdMF(g);},0);
  var totalMD  =GRUPOS.reduce(function(s,g){return s+ytdMD(g);},0);
  var totalSI  =GRUPOS.reduce(function(s,g){return s+ytdSI(g);},0);
  var totalInv =GRUPOS.reduce(function(s,g){return s+ytdInvTot(g);},0);
  var totalFF  =GRUPOS.reduce(function(s,g){return s+ytdFF(g);},0);
  var totalXD  =GRUPOS.reduce(function(s,g){return s+ytdXD(g);},0);
  // NMV Realizado — mesma base do relatório interno (GMV_LC, NMV_FLG=TRUE, ORD_CLOSED_DT)
  var nmvRealizado=typeof NMV_REALIZADO!=='undefined'?
    PERIODO.reduce(function(s,k){return s+(NMV_REALIZADO[k]||0);},0):0;
  // Usa NMV_REALIZADO se disponível (bate com relatório interno), senão TGMV Looker
  var nmvBase=nmvRealizado||totalTGMV||totalYTD;
  var pFin=pctNum(nmvBase,totalMF),pDes=pctNum(nmvBase,totalMD),pFF=pctNum(totalFF,totalYTD);
  var pXD=totalYTD>0?totalXD/totalYTD*100:0;
  var asp=totalSI>0?totalYTD/totalSI:0;
  // MoM e YoY — metodologia adaptada por período selecionado
  // Mês completo → comparação direta de totais
  // MTD (mês atual incompleto) → taxa diária para normalizar dias decorridos
  var MONTH_ORDER_KPI=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  var curMonthKey=MESES_DONE[MESES_DONE.length-1];
  var momTGMV=null,yoyTGMV=null;
  var nmvForMoM=function(mk){
    return GRUPOS.reduce(function(s,g){return s+((REAL_NMV[g]||{})[mk]||(REAL_TGMV[g]||{})[mk]||0);},0);
  };
  var nmv25ForMoM=function(mk){
    return GRUPOS.reduce(function(s,g){return s+((REAL_NMV[g]||{})['25_'+mk]||0);},0);
  };

  if(PERIODO.length===1){
    var focalMk=PERIODO[0];
    var fIdx=MONTH_ORDER_KPI.indexOf(focalMk);
    var prevMk=fIdx>0?MONTH_ORDER_KPI[fIdx-1]:null;
    var isCurMTD=(focalMk===curMonthKey);
    var nmvFocal=nmvForMoM(focalMk)||nmvBase;
    var nmvPrev=prevMk?nmvForMoM(prevMk):0;
    var nmv25=nmv25ForMoM(focalMk);
    if(isCurMTD){
      // MTD: normaliza por taxa diária para comparar com mês cheio anterior
      var dCur=Math.max(DIA_MES,1);
      var dPrev=prevMk?(DIAS_MES_MAP[prevMk]||30):30;
      var d25=DIAS_MES_MAP[focalMk]||31;
      var rCur=nmvFocal/dCur,rPrev=nmvPrev>0?nmvPrev/dPrev:0,r25=nmv25>0?nmv25/d25:0;
      if(rPrev>0)momTGMV=(rCur-rPrev)/rPrev*100;
      if(r25>0)yoyTGMV=(rCur-r25)/r25*100;
    } else {
      // Mês completo: comparação direta de totais
      if(nmvPrev>0)momTGMV=(nmvFocal-nmvPrev)/nmvPrev*100;
      if(nmv25>0)yoyTGMV=(nmvFocal-nmv25)/nmv25*100;
    }
  } else {
    // Multi-meses (YTD/Quarter): só YoY — soma mesmos meses dos dois anos
    var nmvYTD26=PERIODO.reduce(function(s,k){return s+nmvForMoM(k);},0)||nmvBase;
    var nmvYTD25=PERIODO.reduce(function(s,k){return s+nmv25ForMoM(k);},0);
    if(nmvYTD25>0)yoyTGMV=(nmvYTD26-nmvYTD25)/nmvYTD25*100;
  }
  // Formato 2 casas decimais tipo Looker
  var fmtNMV=function(v){if(v>=1e6)return 'R$ '+(v/1e6).toFixed(2).replace('.',',')+' M';return fmt(v);};
  var momColor=momTGMV!==null?(momTGMV>=0?'#00A650':'#F23D4F'):'#ccc';
  var yoyColor=yoyTGMV!==null?(yoyTGMV>=0?'#00A650':'#F23D4F'):'#ccc';
  var nmvSub=fmtN(totalSI)+' itens'
    +(momTGMV!==null?'<br><span style="color:'+momColor+';font-weight:700;font-size:11px">'+(momTGMV>=0?'▲':'▼')+' '+(momTGMV>=0?'+':'')+momTGMV.toFixed(1)+'% MoM</span>':'')
    +(yoyTGMV!==null?'<br><span style="color:'+yoyColor+';font-weight:700;font-size:11px">'+(yoyTGMV>=0?'▲':'▼')+' '+(yoyTGMV>=0?'+':'')+yoyTGMV.toFixed(1)+'% YoY</span>':'');
  // VC e DC de BT_UE (mesma base que Aline's Grid)
  var tVC=GRUPOS.reduce(function(s,g){return s+ytdVC(g);},0);
  var tDC=GRUPOS.reduce(function(s,g){return s+ytdDC(g);},0);
  // Fallback: se BT_UE não tiver VC/DC, usa cupons/rebates
  var tCup2=GRUPOS.reduce(function(s,g){return s+ytdCupons(g);},0);
  var tReb2=GRUPOS.reduce(function(s,g){return s+PERIODO.reduce(function(ss,k){return ss+((REAL_REBATES[g]||{})[k]||0);},0);},0);
  var vcPct=nmvBase>0?(tVC||tCup2)/nmvBase*100:0;
  var dcPct=nmvBase>0?(tDC||tReb2)/nmvBase*100:0;
  var vcAmt=tVC||tCup2, dcAmt=tDC||tReb2;
  var tAds2=GRUPOS.reduce(function(s,g){return s+ytdInvAds(g);},0);
  var adsPctNMV=nmvBase>0?tAds2/nmvBase*100:0;
  var invPctNMV=nmvBase>0?totalInv/nmvBase*100:0;
  var tBPC=GRUPOS.reduce(function(s,g){return s+PERIODO.reduce(function(ss,k){return ss+((REAL_PED_BB[g]||{})[k]||0);},0);},0);
  var tPed=GRUPOS.reduce(function(s,g){return s+PERIODO.reduce(function(ss,k){return ss+((REAL_PED_TOT[g]||{})[k]||0);},0);},0);
  var bpcPct=tPed>0?tBPC/tPed*100:0;
  var el=document.getElementById('vg-kpi-row');
  if(el)el.innerHTML=kpiHtml([
    {label:'NMV',val:fmtNMV(nmvBase),sub:nmvSub,cls:'blue'},
    {label:'% Ating. Meta',val:pFin.toFixed(1)+'%',sub:'Meta Op: '+fmtMeta(totalMF),cls:pFin>=100?'green':pFin>=80?'yellow':'red'},
    {label:'VC %',val:vcPct.toFixed(1)+'%',sub:fmt(vcAmt),cls:vcPct<3?'green':vcPct<6?'yellow':'red'},
    {label:'DC %',val:dcPct.toFixed(1)+'%',sub:fmt(dcAmt),cls:dcPct<3?'green':dcPct<6?'yellow':'red'},
    {label:'Itens Vendidos',val:fmtN(totalSI),sub:MES_ATUAL_PT+' '+DIA_MES+'/'+DIAS_MES_TOTAL+' dias',cls:'blue'},
    {label:'Ticket Médio (NASP)',val:asp>0?'R$ '+Math.round(asp).toLocaleString('pt-BR'):'—',sub:'NMV ÷ Unidades',cls:'blue'},
    {label:'Invest / NMV',val:invPctNMV.toFixed(1)+'%',sub:'Total: '+fmt(totalInv),cls:invPctNMV<5?'green':invPctNMV<8?'yellow':'red'},
    {label:'ADS',val:fmt(tAds2),sub:adsPctNMV.toFixed(1)+'% do NMV',cls:'blue'},
    {label:'BPC %',val:bpcPct.toFixed(1)+'%',sub:'Pedidos com buybox',cls:bpcPct>=80?'green':bpcPct>=60?'yellow':'red'}
  ]);
}
function buildVGHeatmap(){
  var tbl=document.getElementById('vg-table');
  if(!tbl)return;
  var ms=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var hdr='<thead><tr style="background:#3483FA"><th style="text-align:left;padding:11px 14px;color:#fff;font-size:12px;font-weight:700">Grupo</th>';
  MESES_DONE.forEach(function(mk,i){
    var lbl=ms[MESES_KEYS.indexOf(mk)]+(i===MESES_DONE.length-1?' *':'');
    hdr+='<th style="padding:11px 10px;color:#fff;text-align:center;font-size:12px;font-weight:700">'+lbl+'<br><span style="font-size:9px;opacity:.75;font-weight:500">%Fin / %Des</span></th>';
  });
  hdr+='<th style="padding:11px 10px;color:#fff;text-align:center;font-size:12px;font-weight:700">YTD<br><span style="font-size:9px;opacity:.75;font-weight:500">%Fin / %Des</span></th></tr></thead>';
  var body='<tbody>';
  GRUPOS.forEach(function(g,gi){
    var r=REAL_MENSAL[g]||{},mf=META_FIN[g]||{},md=META_DES[g]||{},ytd=ytdReal(g);
    body+='<tr style="background:'+(gi%2===0?'#FAFAFA':'#fff')+'"><td style="font-weight:700;font-size:12px;padding:8px 12px;white-space:nowrap">'+g+'<br><span style="font-size:10px;color:#888;font-weight:400">'+fmt(ytd)+'</span></td>';
    MESES_DONE.forEach(function(mk,i){
      var rv=r[mk]||0,isL=(i===MESES_DONE.length-1),dv=isL?rv*FAT_PROJ:rv;
      var pF=mf[mk]>0?pctNum(dv,mf[mk]):0,pD=md[mk]>0?pctNum(dv,md[mk]):0;
      body+='<td style="padding:5px 6px;text-align:center"><div style="display:flex;gap:2px;justify-content:center"><span style="background:'+heatBg(pF)+';color:#fff;font-weight:700;font-size:10px;padding:1px 5px;border-radius:3px">'+pF.toFixed(0)+'%</span><span style="background:'+heatBg(pD)+';color:#fff;font-size:9px;padding:1px 4px;border-radius:3px;opacity:.8">'+pD.toFixed(0)+'%</span></div>'+(isL?'<div style="font-size:9px;color:#AAA">proj.</div>':'')+'</td>';
    });
    var ytdPF=ytdMF(g)>0?pctNum(ytd,ytdMF(g)):0,ytdPD=ytdMD(g)>0?pctNum(ytd,ytdMD(g)):0;
    body+='<td style="padding:5px 6px;text-align:center;background:#F5F7FF"><div style="display:flex;gap:2px;justify-content:center"><span style="background:'+heatBg(ytdPF)+';color:#fff;font-weight:800;font-size:11px;padding:2px 6px;border-radius:3px">'+ytdPF.toFixed(0)+'%</span><span style="background:'+heatBg(ytdPD)+';color:#fff;font-size:10px;padding:2px 5px;border-radius:3px;opacity:.8">'+ytdPD.toFixed(0)+'%</span></div></td></tr>';
  });
  tbl.innerHTML=hdr+body+'</tbody>';
}
function buildVGUnifiedCards(){
  var curKey=MESES_DONE[MESES_DONE.length-1],prevKey=MESES_DONE.length>1?MESES_DONE[MESES_DONE.length-2]:null;
  function makeRing(pct,color,sz){var r=sz/2-8,circ=2*Math.PI*r,offset=circ-Math.min(pct/100,1.1)*circ;return '<svg width="'+sz+'" height="'+sz+'" style="transform:rotate(-90deg)"><circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+r+'" fill="none" stroke="#F0F0F0" stroke-width="10"/><circle cx="'+sz/2+'" cy="'+sz/2+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+circ.toFixed(1)+'" stroke-dashoffset="'+offset.toFixed(1)+'"/></svg>';}
  function varBadge(val,suffix,color){if(val===null)return '';var c=color||(val>=0?'#00A650':'#F23D4F');return '<span class="u-v" style="background:'+c+'18;color:'+c+'">'+(val>=0?'▲':'▼')+' '+(val>=0?'+':'')+val.toFixed(1)+'%'+(suffix?' '+suffix:'')+'</span>';}
  var uHtml='';
  GRUPOS.forEach(function(g){
    var cor=GRUPO_COLOR[g]||C_BLUE,ytd=ytdReal(g),ymf=ytdMF(g),ymd=ytdMD(g);
    var pFin=pctNum(ytd,ymf),pDes=pctNum(ytd,ymd),perfColor=heatBg(pFin);
    var curGMV=((REAL_MENSAL[g]||{})[curKey]||0),prevGMV=prevKey?((REAL_MENSAL[g]||{})[prevKey]||0):0;
    var mom=prevGMV>0?((curGMV/prevGMV-1)*100):null;
    var g25v=REAL_2025[g]||{},gmv25=PERIODO.reduce(function(s,k){return s+(g25v[k]?g25v[k].gmv:0);},0);
    var yoy=gmv25>0?((ytd/gmv25-1)*100):null;
    uHtml+='<div class="u-card" style="border-left-color:'+perfColor+'">';
    uHtml+='<div class="u-head"><span class="u-dot" style="background:'+cor+'"></span><span class="u-gname">'+g+'</span><span class="u-status-pct" style="color:'+perfColor+'">'+pFin.toFixed(1)+'%</span></div>';
    uHtml+='<div class="u-body"><div class="u-ring-wrap">'+makeRing(pFin,perfColor,84)+'<div class="u-ring-center"><div class="u-ring-pct" style="color:'+perfColor+'">'+pFin.toFixed(1)+'%</div><div class="u-ring-sub" style="font-size:7px;color:#999;text-transform:uppercase;letter-spacing:.3px;font-weight:600">META FIN.</div></div></div>';
    uHtml+='<div class="u-data"><div class="u-gmv-val" style="color:'+cor+'">'+fmt(ytd)+'</div><div class="u-meta-txt">Meta Fin: '+fmtMeta(ymf)+'</div><div class="u-meta-txt">Meta Des: '+fmtMeta(ymd)+'</div></div></div>';
    uHtml+='<div class="u-bars"><div class="u-brow"><span class="u-blbl">Meta Fin.</span><div class="u-bbg"><div class="u-bfill" style="width:'+Math.min(pFin,100).toFixed(1)+'%;background:'+perfColor+'"></div></div><span class="u-bval" style="color:'+perfColor+'">'+pFin.toFixed(1)+'%</span></div>';
    uHtml+='<div class="u-brow"><span class="u-blbl">Desafio</span><div class="u-bbg"><div class="u-bfill" style="width:'+Math.min(pDes,100).toFixed(1)+'%;background:'+heatBg(pDes)+';opacity:.7"></div></div><span class="u-bval" style="color:'+heatBg(pDes)+'">'+pDes.toFixed(1)+'%</span></div></div>';
    uHtml+='<hr class="u-divider"><div class="u-vars">'+varBadge(mom,'MoM',null)+varBadge(yoy,'YoY','#3483FA')+'</div></div>';
  });
  var el=document.getElementById('vg-unified-cards');
  if(el)el.innerHTML=uHtml;
}
function buildVGLineChart(){
  // Formato correto: Total Carteira (preto grosso) + sellers individuais finos + Meta Total (cinza tracejado)
  var lColors=[C_BLUE,'#FF7A00','#9B59B6','#F23D4F','#00A650','#FFB900','#3498DB','#E74C3C','#2ECC71','#95A5A6'];
  var ds=[];

  // ÔöÇÔöÇ Total Carteira: acumulado real (linha preta grossa)
  var cumTotal=[],cumTotalR=0,doneTot=false;
  MESES_KEYS.forEach(function(mk){
    var rv=GRUPOS.reduce(function(s,g){return s+((REAL_MENSAL[g]||{})[mk]||0);},0);
    if(rv>0&&!doneTot){
      cumTotalR+=mk===MESES_DONE[MESES_DONE.length-1]?rv*FAT_PROJ:rv;
      cumTotal.push(cumTotalR);
      if(mk===MESES_DONE[MESES_DONE.length-1])doneTot=true;
    } else cumTotal.push(null);
  });
  ds.push({label:'Total Carteira',data:cumTotal,borderColor:'#1A1A1A',backgroundColor:'rgba(0,0,0,.07)',fill:true,borderWidth:3,pointRadius:function(ctx){return ctx.dataIndex===MESES_DONE.length-1?7:0;},pointBackgroundColor:'#1A1A1A',tension:0.3,spanGaps:false,order:0});

  // ÔöÇÔöÇ Sellers individuais: linhas finas coloridas
  GRUPOS.forEach(function(g,gi){
    var cumP=[],cumR=0,done=false;
    MESES_KEYS.forEach(function(mk){
      var rv=(REAL_MENSAL[g]||{})[mk];
      if(rv!==undefined&&!done){
        cumR+=mk===MESES_DONE[MESES_DONE.length-1]?rv*FAT_PROJ:rv;
        cumP.push(cumR);
        if(mk===MESES_DONE[MESES_DONE.length-1])done=true;
      } else cumP.push(null);
    });
    var lbl=g.length>14?g.substring(0,14)+'...':g;
    ds.push({label:lbl,data:cumP,borderColor:lColors[gi%lColors.length],backgroundColor:'transparent',
      borderWidth:1.5,pointRadius:function(ctx){return ctx.dataIndex===MESES_DONE.length-1?4:0;},
      pointBackgroundColor:lColors[gi%lColors.length],tension:0.3,spanGaps:false,order:1});
  });

  // ÔöÇÔöÇ Meta Financeira Total: linha cinza tracejada
  var cumMF=[],cumMv=0;
  MESES_KEYS.forEach(function(mk){
    cumMv+=GRUPOS.reduce(function(s,g){return s+((META_FIN[g]||{})[mk]||0);},0);
    cumMF.push(cumMv);
  });
  ds.push({label:'Meta Financeira Total',data:cumMF,borderColor:'#CCCCCC',backgroundColor:'transparent',
    borderDash:[8,4],borderWidth:2,pointRadius:0,tension:0,order:2});

  destroyChart('vg-line');
  var el=document.getElementById('vg-line-chart');
  if(!el)return;
  chartInstances['vg-line']=new Chart(el.getContext('2d'),{type:'line',
    data:{labels:MESES_LABEL,datasets:ds},
    options:{responsive:true,animation:false,
      plugins:{
        legend:{position:'bottom',labels:{boxWidth:10,font:{size:10},filter:function(item){return item.datasetIndex===0||item.datasetIndex===ds.length-1||item.datasetIndex<=GRUPOS.length;}}},
        tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+fmt(c.raw);}}}
      },
      scales:{y:{ticks:{callback:function(v){return fmt(v);}}}}
    }});
}
function _todayGmvHoje(){
  // Extrai GMV de hoje do HOJE_DATA_TOTAL (data mais recente disponível = hoje)
  if(typeof HOJE_DATA_TOTAL==='undefined')return 0;
  var keys=Object.keys(HOJE_DATA_TOTAL).sort();
  if(!keys.length)return 0;
  var latest=keys[keys.length-1];
  // Confirma que é do mês atual
  var curM=new Date().getMonth()+1;
  var latestM=parseInt((latest||'').split('-')[1]||0,10);
  if(latestM!==curM)return 0;
  return (HOJE_DATA_TOTAL[latest]||{}).gmv||0;
}
function buildNMVDiario35d(){
  var canEl=document.getElementById('vg-nmv-35d-canvas');
  if(!canEl||typeof DAILY_NMV_30D==='undefined')return;
  destroyChart('vg-nmv-35d');
  // Datas ordenadas de DAILY_NMV_30D (já inclui hoje, pois a query não exclui CURRENT_DATE)
  var allDates=Object.keys(DAILY_NMV_30D).sort();
  var MESES_ABR=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var getVal=function(d){return DAILY_NMV_30D[d]||0;};
  var _parseDateLocal=function(d){var p=d.split('-');return new Date(+p[0],+p[1]-1,+p[2]);};
  var _isWeekend=function(d){var dw=_parseDateLocal(d).getDay();return dw===0||dw===6;};
  var _dowName=function(d){var dw=_parseDateLocal(d).getDay();return dw===6?'Sáb':dw===0?'Dom':'';};
  var weekendNames=allDates.map(_dowName);
  var labels=allDates.map(function(d){var p=d.split('-');return p[2]+'/'+MESES_ABR[parseInt(p[1],10)-1];});
  var vals=allDates.map(getVal);
  var nonZero=vals.filter(function(v){return v>0;});
  var media=nonZero.length>0?nonZero.reduce(function(s,v){return s+v;},0)/nonZero.length:0;
  var mediaLine=vals.map(function(){return Math.round(media);});
  // % Ating. Meta — cumulativo só para o mês atual
  var curMonth=new Date().getMonth()+1;
  var curMK=MESES_DONE[MESES_DONE.length-1];
  var totalMF=GRUPOS.reduce(function(s,g){return s+((META_FIN[g]||{})[curMK]||0);},0);
  var cumNMV=0,atgLine=allDates.map(function(d){
    var dm=parseInt(d.split('-')[1],10);
    if(dm===curMonth){cumNMV+=getVal(d);return totalMF>0?+(cumNMV/totalMF*100).toFixed(1):null;}
    return null;
  });
  var datasets=[
    {label:'NMV Diário',data:vals,backgroundColor:allDates.map(function(d,i){var v=vals[i];if(_isWeekend(d))return v>0?'rgba(255,160,50,.80)':'rgba(255,160,50,.35)';return v>0&&v>=media?'rgba(52,131,250,.85)':'rgba(52,131,250,.45)';}),borderRadius:4,order:2,yAxisID:'y'},
    {label:'Média',data:mediaLine,type:'line',borderColor:'#F23D4F',backgroundColor:'transparent',borderWidth:2,borderDash:[6,4],pointRadius:0,tension:0,order:1,yAxisID:'y'}
  ];
  if(atgLine.some(function(v){return v!==null;})){
    datasets.push({label:'% Ating. Meta',data:atgLine,type:'line',borderColor:'#00A650',backgroundColor:'transparent',borderWidth:2.5,pointRadius:4,pointBackgroundColor:'#00A650',tension:0.25,order:0,yAxisID:'y1',spanGaps:false});
  }
  var _weekendTagPlugin={id:'weekendTag',afterDatasetsDraw:function(chart){
    var wn=chart._weekendNames;if(!wn)return;
    var ctx=chart.ctx,meta=chart.getDatasetMeta(0);
    wn.forEach(function(name,i){
      if(!name)return;
      var bar=meta.data[i];if(!bar)return;
      ctx.save();
      ctx.font='bold 9px Inter,sans-serif';
      ctx.textAlign='center';ctx.fillStyle='rgba(200,100,0,.95)';
      ctx.fillText(name,bar.x,bar.y-5);
      ctx.restore();
    });
  }};
  var _nmvChart=new Chart(canEl.getContext('2d'),{
    type:'bar',
    data:{labels:labels,datasets:datasets},
    plugins:[_weekendTagPlugin],
    options:{responsive:true,maintainAspectRatio:false,animation:false,
      plugins:{legend:{position:'bottom',labels:{usePointStyle:true,pointStyleWidth:14,font:{size:11}}},
               tooltip:{callbacks:{label:function(c){return c.dataset.yAxisID==='y1'?c.dataset.label+': '+c.raw+'%':c.dataset.label+': '+fmt(c.raw);}}}},
      scales:{
        x:{ticks:{font:{size:10},maxRotation:45}},
        y:{type:'linear',position:'left',ticks:{callback:function(v){return fmt(v);}},grid:{color:'rgba(0,0,0,.04)'}},
        y1:{type:'linear',position:'right',min:0,max:130,ticks:{callback:function(v){return v+'%';}},grid:{drawOnChartArea:false}}
      }}
  });
  _nmvChart._weekendNames=weekendNames;
  chartInstances['vg-nmv-35d']=_nmvChart;
}
function buildVGDiario(){
  var canEl=document.getElementById('vg-diario-canvas');
  if(!canEl)return;
  destroyChart('vg-diario');
  var dias=Array.from({length:31},function(_,i){return i+1;});
  // Usa DAILY_NMV_30D (AGMV_LC, sem lag) para o mês atual
  var _d30diario=_daily30dCurMonth();
  var data=(_d30diario&&_d30diario.some(function(v){return v>0;}))?_d30diario:(REAL_DIARIO_TOTAL||[]);
  var today=DIA_MES;
  var getDay=function(d){return data[d-1]||0;};
  // Apenas dias com dado (até hoje)
  var labels=dias.filter(function(d){return d<=today&&getDay(d)>0;}).map(function(d){return d+'/'+MES_ATUAL_PT.substring(0,3);});
  var vals=dias.filter(function(d){return d<=today&&getDay(d)>0;}).map(function(d){return getDay(d);});
  if(!vals.length){canEl.parentElement.style.display='none';return;}
  // Linha de ritmo diário para bater meta financeira
  var totalMF=GRUPOS.reduce(function(s,g){return s+((META_FIN[g]||{})[MESES_DONE[MESES_DONE.length-1]]||0);},0);
  var diasMes=DIAS_MES_MAP[MESES_DONE[MESES_DONE.length-1]]||30;
  var ritmo=totalMF/diasMes;
  var ritmoLine=vals.map(function(){return Math.round(ritmo);});
  chartInstances['vg-diario']=new Chart(canEl.getContext('2d'),{
    type:'bar',
    data:{labels:labels,datasets:[
      {label:'GMV Dia',data:vals,backgroundColor:vals.map(function(v){return v>=ritmo?'rgba(0,166,80,.7)':'rgba(52,131,250,.6)';}),borderRadius:3,order:2},
      {label:'Ritmo meta',data:ritmoLine,type:'line',borderColor:C_YELLOW,backgroundColor:'transparent',borderWidth:2,pointRadius:0,borderDash:[4,3],tension:0,order:1}
    ]},
    options:{responsive:true,animation:false,
      plugins:{legend:{position:'top',labels:{usePointStyle:true,font:{size:10}}},
               tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+fmt(c.raw);}}}},
      scales:{y:{ticks:{callback:function(v){return fmt(v);}}}}}
  });
}

function buildVGMesControl(){
  var html='<div class="mes-pills">';
  MESES_DONE.forEach(function(mk,i){
    var label=MESES_LABEL[MESES_KEYS.indexOf(mk)],isCur=(i===MESES_DONE.length-1);
    html+='<button class="mes-pill'+(isCur?' active':'')+'" onclick="showVGMes(\''+mk+'\',this)">'+label+(isCur?' <span class="mtd-tag">MTD</span>':'')+'</button>';
  });
  html+='</div>';
  var el=document.getElementById('vg-mes-pills');
  if(el)el.innerHTML=html;
  showVGMes(MESES_DONE[MESES_DONE.length-1],null);
}
function _daily30dCurMonth(){
  // Retorna array[31] com NMV de DAILY_NMV_30D para o mês atual (índice 0 = dia 1)
  if(typeof DAILY_NMV_30D==='undefined')return null;
  var y=new Date().getFullYear(),m=(new Date().getMonth()+1).toString().padStart(2,'0');
  var arr=[];
  for(var d=1;d<=31;d++){arr.push(DAILY_NMV_30D[y+'-'+m+'-'+d.toString().padStart(2,'0')]||0);}
  return arr;
}
function showVGMes(mk,btnEl){
  if(btnEl){document.querySelectorAll('#vg-mes-pills .mes-pill').forEach(function(b){b.classList.remove('active');});btnEl.classList.add('active');}
  var isCur=(mk===MESES_DONE[MESES_DONE.length-1]);
  // Para mês atual: usa DAILY_NMV_30D (AGMV_LC, sem lag) como fonte principal
  var _d30=isCur?_daily30dCurMonth():null;
  var totalRealD30=_d30?_d30.slice(0,DIA_MES).reduce(function(s,v){return s+v;},0):0;
  var totalRealMensal=GRUPOS.reduce(function(s,g){return s+((REAL_MENSAL[g]||{})[mk]||0);},0);
  var totalReal=isCur&&totalRealD30>0?totalRealD30:totalRealMensal;
  var totalDisp=isCur?totalReal*FAT_PROJ:totalReal;
  var totalMF=GRUPOS.reduce(function(s,g){return s+((META_FIN[g]||{})[mk]||0);},0);
  var totalMD=GRUPOS.reduce(function(s,g){return s+((META_DES[g]||{})[mk]||0);},0);
  var totalSI=GRUPOS.reduce(function(s,g){return s+((REAL_SI[g]||{})[mk]||0);},0);
  var totalInv=GRUPOS.reduce(function(s,g){return s+((REAL_INV_TOT[g]||{})[mk]||0);},0);
  var asp=totalSI>0?totalReal/totalSI:0;
  var pFin=pctNum(totalDisp,totalMF),pDes=pctNum(totalDisp,totalMD);
  var diasTot=DIAS_MES_MAP[mk]||30;

  document.getElementById('vg-mes-kpi').innerHTML=kpiHtml([
    {label:(MESES_PT_MAP[mk]||mk)+(isCur?' \u2014 MTD ('+DIA_MES+'/'+diasTot+' dias)':' \u2014 Fechado'),
     val:fmt(totalReal),sub:isCur?'Proj.: '+fmt(totalDisp):'M\u00eas encerrado',cls:'blue'},
    {label:'% Meta Financeira',val:pFin.toFixed(1)+'%',sub:'Meta: '+fmtMeta(totalMF),cls:pFin>=100?'green':pFin>=80?'yellow':'red'},
    {label:'% Meta Desafio',   val:pDes.toFixed(1)+'%',sub:'Meta: '+fmtMeta(totalMD),cls:pDes>=100?'green':pDes>=80?'yellow':'red'},
    {label:'SIs Total',        val:fmtN(totalSI),sub:'NNASP: R$ '+(asp>0?Math.round(asp).toLocaleString('pt-BR'):'--'),cls:'blue'},
    {label:'Investimento Total',val:fmt(totalInv),sub:'ADS + Cupons + Rebates',cls:'purple'},
    {label:'Gap Meta Fin.',    val:fmt(totalDisp-totalMF),
     sub:totalDisp>=totalMF?'Acima da meta':'Faltam '+fmt(totalMF-totalDisp),
     cls:totalDisp>=totalMF?'green':'red'}
  ]);

  // Mostrar/ocultar diarizado apenas no mês atual (MTD)
  var dWrap=document.getElementById('vg-diario-wrap');
  if(dWrap){
    if(isCur){dWrap.style.display='block';setTimeout(buildVGDiario,100);}
    else{dWrap.style.display='none';destroyChart('vg-diario');}
  }

  destroyChart('vg-mes');
  var ctx=document.getElementById('vg-mes-canvas').getContext('2d');
  // Para o gráfico diário usa DAILY_NMV_30D (sem lag) se disponível
  var _ddSource=isCur&&_d30&&_d30.slice(0,DIA_MES).some(function(v){return v>0;})?_d30:null;
  if(!_ddSource&&isCur&&typeof REAL_DIARIO_TOTAL!=='undefined'&&REAL_DIARIO_TOTAL.some(function(v){return v>0;})){
    _ddSource=REAL_DIARIO_TOTAL;
  }
  if(isCur&&_ddSource){
    var dd=_ddSource.slice(0,DIA_MES);
    var cum=[],s=0;
    dd.forEach(function(v){s+=v;cum.push(s);});
    var mdia=totalMF/diasTot;
    var mcum=dd.map(function(_,j){return +(mdia*(j+1)).toFixed(0);});
    var labels=dd.map(function(_,j){return j+1;});
    chartInstances['vg-mes']=new Chart(ctx,{type:'line',data:{labels:labels,datasets:[
      {label:'GMV Di\u00e1rio Total',data:dd,borderColor:C_BLUE,backgroundColor:'rgba(52,131,250,0.1)',fill:true,tension:0.3,pointRadius:3,yAxisID:'y'},
      {label:'Acumulado Real',data:cum,borderColor:C_GREEN,backgroundColor:'transparent',tension:0.3,pointRadius:2,yAxisID:'y1'},
      {label:'Meta Acum.',data:mcum,borderColor:C_YELLOW,backgroundColor:'transparent',borderDash:[6,3],tension:0,pointRadius:0,borderWidth:2,yAxisID:'y1'}
    ]},options:{responsive:true,animation:false,
      plugins:{legend:{position:'top'},tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+fmt(c.raw);}}}},
      scales:{
        y:{type:'linear',position:'left',ticks:{callback:function(v){return fmt(v);}}},
        y1:{type:'linear',position:'right',grid:{drawOnChartArea:false},ticks:{callback:function(v){return fmt(v);}}}
      }}});
  } else {
    var realArr=GRUPOS.map(function(g){return (REAL_MENSAL[g]||{})[mk]||0;});
    var mfArr=GRUPOS.map(function(g){return (META_FIN[g]||{})[mk]||0;});
    var mdArr=GRUPOS.map(function(g){return (META_DES[g]||{})[mk]||0;});
    var dispArr=isCur?realArr.map(function(v){return v*FAT_PROJ;}):realArr;
    chartInstances['vg-mes']=new Chart(ctx,{type:'bar',
      data:{labels:GRUPOS.map(function(g){return g.length>12?g.substring(0,12)+'...':g;}),datasets:[
        {label:'Realizado',data:realArr,backgroundColor:C_BLUE,borderRadius:4},
        {label:'Meta Fin.',data:mfArr,backgroundColor:C_YELLOW,borderRadius:4},
        {label:'Meta Desafio',data:mdArr,backgroundColor:'rgba(0,166,80,.75)',borderRadius:4}
      ]},options:{responsive:true,animation:false,
        plugins:{legend:{position:'top',labels:{usePointStyle:true,pointStyleWidth:16,font:{size:11}}},
                 tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+fmt(c.raw);}}}},
        scales:{y:{ticks:{callback:function(v){return fmt(v);}}}}}});
  }
}
function buildVGQuarters(){
  // Idêntico Larissa: aggregate quarter cards + per-seller grid below
  var el=document.getElementById('vg-quarters');
  if(!el)return;
  var activeQs=['Q1','Q2','Q3','Q4'].filter(function(q){return qStatus(q)!=='future';});

  // ÔöÇÔöÇ Aggregate quarter cards (row) ÔöÇÔöÇ
  // Aggregate quarter cards
  var qHtml='<div style="display:grid;grid-template-columns:repeat('+activeQs.length+',1fr);gap:14px;margin-bottom:20px">';
  activeQs.forEach(function(q){
    var status=qStatus(q);
    var qR=GRUPOS.reduce(function(s,g){return s+qtdReal(g,q);},0);
    var qMF=GRUPOS.reduce(function(s,g){return s+qtdMF(g,q);},0);
    var qMD=GRUPOS.reduce(function(s,g){return s+qtdMD(g,q);},0);
    var pFin=pctNum(qR,qMF), pDes=pctNum(qR,qMD);
    var sLabel=status==='closed'?'Fechado':status==='partial'?'Em andamento':'Futuro';
    var sBg=status==='closed'?'rgba(0,166,80,.1)':status==='partial'?'rgba(52,131,250,.1)':'rgba(200,200,200,.1)';
    var sColor=status==='closed'?'#00A650':status==='partial'?'#3483FA':'#AAA';
    var mainColor=status==='future'?'#CCC':pFin>=100?'#00A650':pFin>=80?'#B07A00':'#F23D4F';
    var fillPct=Math.min(pFin,100).toFixed(1);
    var desPct=Math.min(pDes,100).toFixed(1);
    var card='<div style="background:#fff;border-radius:12px;padding:18px 20px;box-shadow:0 2px 8px rgba(0,0,0,.07);border-left:5px solid '+mainColor+'">';
    card+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
    card+='<span style="font-size:14px;font-weight:800;color:#1A1A1A">'+q+' 2026</span>';
    card+='<span style="background:'+sBg+';color:'+sColor+';font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px">'+sLabel+'</span>';
    card+='</div>';
    card+='<div style="font-size:22px;font-weight:900;color:'+mainColor+';letter-spacing:-.5px;margin-bottom:4px">'+(qR>0?fmt(qR):'-')+'</div>';
    card+='<div style="font-size:11px;color:#888;margin-bottom:2px">Meta Fin: <strong style="color:#555">'+fmt(qMF)+'</strong></div>';
    card+='<div style="font-size:11px;color:#888;margin-bottom:10px">Meta Des: <strong style="color:#555">'+fmt(qMD)+'</strong></div>';
    if(qR>0){
      card+='<div style="display:flex;gap:6px;margin-bottom:8px">';
      card+='<span style="background:'+(pFin>=100?'rgba(0,166,80,.12)':pFin>=80?'rgba(255,185,0,.15)':'rgba(242,61,79,.12)')+';color:'+mainColor+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">'+pFin.toFixed(1)+'% Fin</span>';
      card+='<span style="background:'+(pDes>=100?'rgba(0,166,80,.12)':pDes>=80?'rgba(255,185,0,.15)':'rgba(242,61,79,.12)')+';color:'+(pDes>=100?'#00A650':pDes>=80?'#B07A00':'#F23D4F')+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">'+pDes.toFixed(1)+'% Des</span>';
      card+='</div>';
      card+='<div style="background:#F0F0F0;border-radius:4px;height:5px;overflow:hidden">';
      card+='<div style="width:'+fillPct+'%;height:5px;background:'+mainColor+';border-radius:4px"></div></div>';
    }
    card+='</div>';
    qHtml+=card;
  });
  qHtml+='</div>';

  // ÔöÇÔöÇ Per-seller grid por quarter (como Larissa) ÔöÇÔöÇ
  var summHtml='<div style="margin-top:16px;">';
  activeQs.forEach(function(q){
    var status=qStatus(q);
    var qkeys=QUARTER_KEYS[q];
    var months=qkeys.filter(function(k){return MESES_DONE.indexOf(k)>=0;});
    if(!months.length)return;
    var sLabel=status==='closed'?'Fechado':status==='partial'?'Em andamento':'';
    summHtml+='<div style="margin-bottom:14px;">';
    summHtml+='<div style="font-size:11px;font-weight:700;color:#555;margin-bottom:6px;display:flex;align-items:center;gap:8px;">'
      +q+' <span style="font-size:10px;font-weight:600;color:#AAA;">'+sLabel+'</span></div>';
    summHtml+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;">';
    // Ordenar por TGMV (quarters fechados) ou GMV (em andamento)
    var gruposSorted=GRUPOS.slice().sort(function(a,b){
      var tA=months.reduce(function(s,k){return s+((REAL_TGMV[a]||{})[k]||0);},0);
      var tB=months.reduce(function(s,k){return s+((REAL_TGMV[b]||{})[k]||0);},0);
      if(tA>0||tB>0)return tB-tA;
      return months.reduce(function(s,k){return s+((REAL_MENSAL[b]||{})[k]||0);},0)
           - months.reduce(function(s,k){return s+((REAL_MENSAL[a]||{})[k]||0);},0);
    });
    gruposSorted.forEach(function(g){
      var qR=months.reduce(function(s,k){return s+((REAL_MENSAL[g]||{})[k]||0);},0);
      var qT=months.reduce(function(s,k){return s+((REAL_TGMV[g]||{})[k]||0);},0);
      var qMF=months.reduce(function(s,k){return s+((META_FIN[g]||{})[k]||0);},0);
      var qMD=months.reduce(function(s,k){return s+((META_DES[g]||{})[k]||0);},0);
      var pFin=qMF>0?pctNum(qR,qMF):0,pDes=qMD>0?pctNum(qR,qMD):0;
      var clr=pFin>=100?'#00A650':pFin>=80?'#B8860B':'#F23D4F';
      var cor=GRUPO_COLOR[g]||'#3483FA';
      var fillW=Math.min(pFin,100).toFixed(0);
      summHtml+='<div style="background:#fff;border-radius:8px;padding:10px 12px;box-shadow:0 1px 4px rgba(0,0,0,.07);border-left:3px solid '+cor+';">'
        +'<div style="font-size:10px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.3px;margin-bottom:5px;">'+g+'</div>'
        +'<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;">'
          +'<span style="font-size:13px;font-weight:800;color:#222;">'+fmt(qR)+'</span>'
          +'<span style="font-size:11px;font-weight:700;color:'+clr+';">'+pFin.toFixed(1)+'% Fin</span>'
        +'</div>'
        +(qT>0?'<div style="font-size:10px;color:#3483FA;font-weight:600;margin-bottom:4px;">TGMV: '+fmt(qT)+'</div>':'')
        +'<div style="background:#F0F0F0;border-radius:3px;height:4px;overflow:hidden;">'
          +'<div style="width:'+fillW+'%;height:100%;background:'+clr+';border-radius:3px;"></div></div>'
        +'<div style="font-size:10px;color:#AAA;margin-top:3px;">Des: '+pDes.toFixed(1)+'%</div>'
        +'</div>';
    });
    summHtml+='</div></div>';
  });
  summHtml+='</div>';
  el.innerHTML=qHtml+summHtml;
}
function buildVGScorecard(){
  var scGMV  = GRUPOS.reduce(function(s,g){return s+ytdReal(g);},0);
  var scMFt  = GRUPOS.reduce(function(s,g){return s+ytdMF(g);},0);
  var scMDt  = GRUPOS.reduce(function(s,g){return s+ytdMD(g);},0);
  var scSI   = GRUPOS.reduce(function(s,g){return s+ytdSI(g);},0);
  var scFF   = GRUPOS.reduce(function(s,g){return s+ytdFF(g);},0);
  var scAds  = GRUPOS.reduce(function(s,g){return s+ytdInvAds(g);},0);
  var scCup  = GRUPOS.reduce(function(s,g){return s+ytdCupons(g);},0);
  var scInvT = GRUPOS.reduce(function(s,g){return s+ytdInvTot(g);},0);
  var scPed  = GRUPOS.reduce(function(s,g){return s+MESES_DONE.reduce(function(ss,k){return ss+((REAL_PED_TOT[g]||{})[k]||0);},0);},0);
  var scBB   = GRUPOS.reduce(function(s,g){return s+MESES_DONE.reduce(function(ss,k){return ss+((REAL_PED_BB[g]||{})[k]||0);},0);},0);
  var scVis  = GRUPOS.reduce(function(s,g){return s+PERIODO.reduce(function(ss,k){return ss+((typeof REAL_VISITAS!=='undefined'?(REAL_VISITAS[g]||{})[k]:0)||0);},0);},0);

  var pMF  = pctNum(scGMV,scMFt);
  var pDes = pctNum(scGMV,scMDt);
  var pFF  = scGMV>0?scFF/scGMV*100:0;
  var pBPC = scPed>0?pctNum(scBB,scPed):0;
  var pAds = scGMV>0?scAds/scGMV*100:0;
  var pInv = scGMV>0?scInvT/scGMV*100:0;
  var pCup = scGMV>0?scCup/scGMV*100:0;
  var roas = scAds>0?scGMV/scAds:0;
  var asp  = scSI>0?scGMV/scSI:0;
  var cvr  = scVis>0?scPed/scVis*100:0;
  // aliases for html block
  var ytdGMV=scGMV,ytdMFt=scMFt,ytdMDt=scMDt,ytdSIv=scSI,ytdFF_=scFF,ytdInv=scAds,ytdCup=scCup,ytdInvT=scInvT,ytdVis=scVis;

  function sc(label,val,sub,cls){
    return '<div class="sc-card '+cls+'"><div class="sc-label">'+label+'</div><div class="sc-value">'+val+'</div><div class="sc-sub">'+sub+'</div></div>';
  }

  var html = '<div class="scorecard-grid">'
    // Row 1
    +sc('GMV YTD',           fmt(ytdGMV),                  pMF.toFixed(1)+'% da Meta Fin.',                           pMF>=100?'sc-green':pMF>=80?'sc-yellow':'sc-red')
    +sc('% META FINANCEIRA',  pMF.toFixed(1)+'%',           'Meta: '+fmt(ytdMFt),                                      pMF>=100?'sc-green':pMF>=80?'sc-yellow':'sc-red')
    +sc('SIS YTD',            fmtN(ytdSIv),                 'Unidades vendidas',                                       'sc-blue')
    +sc('NASP (TICKET M\u00c9DIO)', 'R$ '+Math.round(asp).toLocaleString('pt-BR'), 'GMV \u00f7 SIs',                   'sc-blue')
    +sc('INVESTIMENTO TOTAL', fmt(ytdInvT),                  'Inv/GMV: '+pInv.toFixed(2)+'%',                          'sc-blue')
    // Row 2
    +sc('VISITAS YTD',        ytdVis>0?fmtN(ytdVis):'\u2013', 'Pageviews dispon\u00edveis',                           'sc-blue')
    +sc('TAXA DE CONVERS\u00c3O', ytdVis>0?cvr.toFixed(2)+'%':'\u2013', 'Pedidos \u00f7 Visitas',                    ytdVis>0?(cvr>=3?'sc-green':cvr>=1.5?'sc-yellow':'sc-red'):'sc-blue')
    +sc('BPC (BUYBOX %)',      pBPC.toFixed(1)+'%',          'Pedidos com buybox',                                     pBPC>=80?'sc-green':pBPC>=60?'sc-yellow':'sc-red')
    +sc('INV. ADS YTD',       fmt(ytdInv),                   'ADS/GMV: '+pAds.toFixed(2)+'%',                          'sc-blue')
    +sc('ROAS (GMV/ADS)',      roas>0?roas.toFixed(1)+'x':'-','Retorno bruto ADS',                                     roas>=20?'sc-green':roas>=10?'sc-yellow':'sc-red')
    // Row 3
    +sc('CUPONS YTD',         fmt(ytdCup),                   pCup.toFixed(2)+'% do GMV',                               'sc-blue')
    +sc('% FULFILLMENT',      pFF.toFixed(1)+'%',            'FF GMV: '+fmt(ytdFF_),                                   pFF>=80?'sc-green':pFF>=60?'sc-yellow':'sc-red')
    +'</div>';

  var el=document.getElementById('vg-scorecard');
  if(el)el.innerHTML=html;
}
function buildVGInsights(){
  var el=document.getElementById('vg-ins-list');
  if(!el)return;
  var tYTD=GRUPOS.reduce(function(s,g){return s+ytdReal(g);},0);
  var tMF=GRUPOS.reduce(function(s,g){return s+ytdMF(g);},0);
  var tMD=GRUPOS.reduce(function(s,g){return s+ytdMD(g);},0);
  var pFin=pctNum(tYTD,tMF),pDes=pctNum(tYTD,tMD);
  var best=GRUPOS.reduce(function(b,g){return pctNum(ytdReal(g),ytdMF(g))>pctNum(ytdReal(b),ytdMF(b))?g:b;},GRUPOS[0]);
  var worst=GRUPOS.reduce(function(b,g){return pctNum(ytdReal(g),ytdMF(g))<pctNum(ytdReal(b),ytdMF(b))?g:b;},GRUPOS[0]);
  var ins=[
    {t:pFin.toFixed(1)+'% da Meta Fin. ('+fmt(tMF)+')',c:pFin>=100?'g':pFin>=80?'y':'r'},
    {t:pDes.toFixed(1)+'% da Meta Desafio ('+fmt(tMD)+')',c:pDes>=100?'g':pDes>=60?'y':'r'},
    {t:'Melhor: '+best+' ('+pctNum(ytdReal(best),ytdMF(best)).toFixed(1)+'%)',c:'g'},
    {t:'Atenção: '+worst+' ('+pctNum(ytdReal(worst),ytdMF(worst)).toFixed(1)+'%)',c:'r'}
  ];
  el.innerHTML=ins.map(function(i){return '<span class="ins '+i.c+'">'+i.t+'</span>';}).join('');
}
function buildCorpAcionaveis(){
  // PLANO DE AçâO PRIORITüRIO — design igual ao screenshot
  var points=[];
  GRUPOS.forEach(function(g){
    var gmv=ytdReal(g),pFin=pctNum(gmv,ytdMF(g));
    var pFF=gmv>0?pctNum(ytdFF(g),gmv):0;
    var ytdPed=MESES_DONE.reduce(function(s,k){return s+((REAL_PED_TOT[g]||{})[k]||0);},0);
    var ytdBB=MESES_DONE.reduce(function(s,k){return s+((REAL_PED_BB[g]||{})[k]||0);},0);
    var pBPC=ytdPed>0?pctNum(ytdBB,ytdPed):0;
    var pAds=gmv>0?ytdInvAds(g)/gmv*100:0;
    if(pBPC<70)points.push({pri:'ALTA',border:'#F23D4F',badgeBg:'#FDECEA',badgeColor:'#F23D4F',icon:'🛒',
      title:'BPC cr\u00edtico em '+g+'('+pBPC.toFixed(0)+'%)',
      actions:['Revisar precifica\u00e7\u00e3o dos top 20 itens por GMV sem buybox em cada grupo','Ativar Pre\u00e7o Competitivo Autom\u00e1tico nos itens eleg\u00edveis','Meta semanal: elevar BPC acima de 70% em 2 semanas']});
    if(pFin<80)points.push({pri:'ALTA',border:'#F23D4F',badgeBg:'#FDECEA',badgeColor:'#F23D4F',icon:'📉',
      title:'Acelerar GMV em: '+g+' ('+pFin.toFixed(0)+'% Meta Fin.)',
      actions:['Acionar cupons estrat\u00e9gicos nos itens de maior volume para impulsionar convers\u00e3o','Ampliar cat\u00e1logo nos dom\u00ednios de melhor ticket m\u00e9dio','Revisar forecast e replanejar calend\u00e1rio de a\u00e7\u00f5es t\u00e1ticas do quarter']});
    if(pFF<70)points.push({pri:'M\u00c9DIA',border:'#FFB900',badgeBg:'#FFF3CD',badgeColor:'#B07A00',icon:'🚗',
      title:'Fulfillment abaixo de 80%: '+g+'('+pFF.toFixed(0)+'%)',
      actions:['Migrar itens de maior giro para Fulfillment \u2014 ganho direto em posi\u00e7\u00e3o org\u00e2nica','Verificar ruptura de estoque nos CDs para os top itens','Monitorar impacto no buybox ap\u00f3s migra\u00e7\u00e3o']});
    if(pFin>=100&&pBPC>=80&&pFF>=80)points.push({pri:'OPORTUNIDADE',border:'#00A650',badgeBg:'#E6F7EE',badgeColor:'#00A650',icon:'✅',
      title:'Capitalizar performance: '+g,
      actions:['Expandir cat\u00e1logo nos dom\u00ednios com maior ticket m\u00e9dio','Aumentar verba ADS nos itens com ROAS acima de 20x','Replicar estrat\u00e9gia vencedora em novos dom\u00ednios']});
  });
  // Dedupe similar issues
  var seen={};var deduped=[];
  points.forEach(function(p){var k=p.pri+p.icon;if(!seen[k]||p.title.length>seen[k]){seen[k]=p.title.length;deduped.push(p);}});
  points=deduped;
  points.sort(function(a,b){var o={'ALTA':0,'MÉDIA':1,'OPORTUNIDADE':2};return (o[a.pri]||1)-(o[b.pri]||1);});
  if(!points.length)points.push({pri:'OPORTUNIDADE',border:'#00A650',badgeBg:'#E6F7EE',badgeColor:'#00A650',icon:'✅',title:'Carteira dentro dos par\u00e2metros esperados',actions:['Manter monitoramento semanal','Focar em expans\u00e3o de sortimento nos grupos com maior ROAS']});

  var el=document.getElementById('vg-corp-actions');
  if(!el)return;
  el.innerHTML='<div style="font-size:14px;font-weight:800;color:#1A1A1A;text-transform:uppercase;letter-spacing:.5px;margin-bottom:16px">&#128203; Plano de A&#231;&#227;o Priorit&#225;rio</div>'
    +points.slice(0,6).map(function(p,idx){
    var num=idx+1;
    var aColor=p.pri==='ALTA'?'#F23D4F':p.pri==='MÉDIA'?'#B07A00':'#00A650';
    return '<div style="background:#fff;border-radius:12px;padding:18px 22px 16px;box-shadow:0 2px 8px rgba(0,0,0,.06);border-left:5px solid '+p.border+';margin-bottom:12px">'
      +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">'
        +'<span style="font-size:24px;flex-shrink:0">'+p.icon+'</span>'
        +'<div style="display:flex;flex-direction:column;gap:3px;flex:1">'
          +'<div style="display:flex;align-items:center;gap:8px">'
            +'<span style="background:'+p.badgeBg+';color:'+p.badgeColor+';font-size:10px;font-weight:800;padding:2px 10px;border-radius:20px;white-space:nowrap">'+num+'. '+p.pri+'</span>'
            +'<strong style="font-size:13.5px;color:#1A1A1A;line-height:1.3">'+p.title+'</strong>'
          +'</div>'
        +'</div>'
      +'</div>'
      +'<div style="padding-left:36px;border-top:1px solid #F5F5F5;padding-top:10px">'
        +p.actions.map(function(a){return '<div style="font-size:12.5px;color:'+aColor+';margin-bottom:5px;line-height:1.4">&rarr; '+a+'</div>';}).join('')
      +'</div>'
      +'</div>';
  }).join('');
}

function showLogItens(tipo, btn){
  var el=document.getElementById('log-itens-container');
  if(!el)return;
  var items=typeof XD_ITEMS!=='undefined'?XD_ITEMS:[];
  var titulo=tipo==='xd'?'Cross Docking':'Fulfillment';
  var gmvKey=tipo==='xd'?'gmv_xd':'gmv_ff';
  var clr=tipo==='xd'?'#3483FA':'#006E35';
  // Filtrar por PERIODO (meses selecionados no filtro global)
  var sorted=[].concat(items)
    .filter(function(it){
      var inPeriodo=PERIODO.length===0||PERIODO.indexOf(it.month_key)>=0;
      return inPeriodo&&(it[gmvKey]||0)>0;
    })
    .sort(function(a,b){return (b[gmvKey]||0)-(a[gmvKey]||0);}).slice(0,100);
  if(!sorted.length){el.innerHTML='<p style="color:#aaa;padding:16px;text-align:center">Sem itens via '+titulo+' no período selecionado</p>';return;}
  var th=function(t,al){return '<th style="padding:9px 10px;font-size:10px;font-weight:700;color:#fff;background:#1A1A1A;text-align:'+(al||'right')+';white-space:nowrap">'+t+'</th>';};
  var siKey=tipo==='xd'?'si_xd':'si_ff';
  var hdr='<thead><tr>'+th('Produto','left')+th('Grupo','center')+th('GMV '+titulo)+th('SIs')+th('Domínio','left')+'</tr></thead>';
  var totXD=sorted.reduce(function(s,it){return s+(it[gmvKey]||0);},0);
  var bdy='<tbody>'+sorted.map(function(it,i){
    var v=it[gmvKey]||0,tot=it.gmv_total||0;
    var pct=tot>0?(v/tot*100).toFixed(1):0;
    var cor=GRUPO_COLOR[it.grupo||it.g||'']||clr;
    var bg=i%2===0?'#fff':'#FAFAFA';
    var nm=(it.nm||it.titulo||'').substring(0,45)+((it.nm||it.titulo||'').length>45?'...':'');
    var mlb=it.mlb_id||'';
    var href=mlb?'https://produto.mercadolivre.com.br/'+mlb.replace('MLB','MLB-'):'#';
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'
      +'<td style="padding:9px 10px"><a href="'+href+'" target="_blank" style="color:#1A1A1A;text-decoration:none;font-size:12px;font-weight:600">'+nm+'</a>'
      +'<div style="font-size:9px;color:#3483FA;margin-top:1px">'+mlb+'</div></td>'
      +'<td style="padding:9px 8px;text-align:center"><span style="background:'+cor+'22;color:'+cor+';font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px">'+(it.grupo||it.g||'')+'</span></td>'
      +'<td style="padding:9px 10px;font-weight:800;color:'+clr+'">'+fmt(v)+'</td>'
      +'<td style="padding:9px 10px">'+Math.round((it[siKey]||it.si)||0).toLocaleString('pt-BR')+' un.</td>'
      +'<td style="padding:9px 10px;font-size:10px;color:#888">'+((it.domain||'').split(' ')[0])+'</td>'
      +'</tr>';
  }).join('')+'</tbody>';
  el.innerHTML='<div style="overflow-x:auto;border-radius:8px;border:1px solid #E8E8E8">'
    +'<table style="width:100%;border-collapse:collapse">'+hdr+bdy+'</table></div>'
    +'<div style="font-size:11px;color:#888;margin-top:8px">Top 50 itens com maior GMV via '+titulo+' (últimos 90 dias)</div>';
}

function buildLogistica(){
  var mks=MESES_DONE;
  var tGMV=GRUPOS.reduce(function(a,g){return a+ytdReal(g);},0);
  var tNMV=GRUPOS.reduce(function(a,g){return a+ytdNMV(g);},0)||tGMV;
  var ffTot=GRUPOS.reduce(function(a,g){return a+mks.reduce(function(b,k){return b+((REAL_FF[g]||{})[k]||0);},0);},0);
  var xdTot=GRUPOS.reduce(function(a,g){return a+ytdXD(g);},0);
  var ssTot=GRUPOS.reduce(function(a,g){return a+mks.reduce(function(b,k){return b+((REAL_SS[g]||{})[k]||0);},0);},0);
  var sdTot=Math.max(0,tGMV-ffTot-xdTot-ssTot);
  var pFF=tNMV>0?ffTot/tNMV*100:0;
  var pXD=tNMV>0?xdTot/tNMV*100:0;
  var pSS=tNMV>0?ssTot/tNMV*100:0;
  var pSD=tNMV>0?sdTot/tNMV*100:0;

  var el=document.getElementById('log-kpi-row');
  if(el)el.innerHTML=kpiHtml([
    {label:'SELLER DIRETO',  val:fmt(sdTot), sub:pSD.toFixed(1)+'% do NMV', cls:'green'},
    {label:'CROSS DOCKING',  val:fmt(xdTot), sub:pXD.toFixed(1)+'% do NMV', cls:'blue'},
    {label:'SELF SERVICE',   val:fmt(ssTot), sub:pSS.toFixed(1)+'% do NMV', cls:'yellow'},
    {label:'FULFILLMENT',    val:fmt(ffTot), sub:pFF.toFixed(1)+'% do NMV', cls:pFF>=30?'green':'red'}
  ]);

  // Gráfico empilhado — Seller Direto embaixo (verde, dominante), XD e SS em cima
  destroyChart('log-bar');
  var canEl=document.getElementById('log-bar-chart');
  if(canEl){
    var sdByMonth=mks.map(function(k){
      var t=GRUPOS.reduce(function(s,g){return s+((REAL_MENSAL[g]||{})[k]||0);},0);
      var f=GRUPOS.reduce(function(s,g){return s+((REAL_FF[g]||{})[k]||0);},0);
      var x=GRUPOS.reduce(function(s,g){return s+((REAL_XD[g]||{})[k]||0);},0);
      var ss=GRUPOS.reduce(function(s,g){return s+((REAL_SS[g]||{})[k]||0);},0);
      return Math.max(0,t-f-x-ss);
    });
    var xdByMonth=mks.map(function(k){return GRUPOS.reduce(function(s,g){return s+((REAL_XD[g]||{})[k]||0);},0);});
    var ssByMonth=mks.map(function(k){return GRUPOS.reduce(function(s,g){return s+((REAL_SS[g]||{})[k]||0);},0);});
    var ffByMonth=mks.map(function(k){return GRUPOS.reduce(function(s,g){return s+((REAL_FF[g]||{})[k]||0);},0);});

    var datasets=[];
    if(ffTot>0)datasets.push({label:'Fulfillment (FBM)',data:ffByMonth,backgroundColor:'#006E35',borderRadius:0,order:1});
    if(xdTot>0)datasets.push({label:'Cross Docking (XD)',data:xdByMonth,backgroundColor:'#3483FA',borderRadius:0,order:2});
    var hasSS=ssByMonth.some(function(v){return v>0;});
    if(hasSS)datasets.push({label:'ME1 (Entrega Padrão)',data:ssByMonth,backgroundColor:'#00A650',borderRadius:0,order:3});
    var hasSD=sdByMonth.some(function(v){return v>0;});
    if(hasSD)datasets.push({label:'Seller Direto',data:sdByMonth,backgroundColor:'#FFB900',borderRadius:0,order:4});

    chartInstances['log-bar']=new Chart(canEl.getContext('2d'),{type:'bar',
      data:{labels:mks.map(function(k){return MESES_LABEL[MESES_KEYS.indexOf(k)];}),datasets:datasets},
      options:{responsive:true,animation:false,
        scales:{x:{stacked:true},y:{stacked:true,ticks:{callback:function(v){return fmt(v);}}}},
        plugins:{
          legend:{position:'top',labels:{usePointStyle:true,pointStyleWidth:20,font:{size:11}}},
          tooltip:{callbacks:{label:function(c){
            var pct=tNMV>0?(c.raw/tNMV*100).toFixed(1):'0';
            return c.dataset.label+': '+fmt(c.raw)+' ('+pct+'% NMV)';
          }}}
        }
      }
    });
  }

  // Tabela: % Cross Docking por Grupo — Mês a Mês
  var tbl=document.getElementById('log-table');
  if(!tbl)return;
  var hdr='<thead><tr style="background:#FFE600">'
    +'<th style="padding:12px 14px;text-align:left;font-size:12px;font-weight:800;color:#1A1A1A">Grupo</th>';
  mks.forEach(function(mk){hdr+='<th style="padding:12px 10px;text-align:center;font-size:11px;font-weight:700;color:#1A1A1A">'+MESES_LABEL[MESES_KEYS.indexOf(mk)]+'<br><span style="font-size:9px;font-weight:400">% XD</span></th>';});
  hdr+='<th style="padding:12px 10px;text-align:right;font-size:11px;font-weight:700;color:#1A1A1A">YTD GMV</th>'
    +'<th style="padding:12px 10px;text-align:center;font-size:11px;font-weight:700;color:#1A1A1A">YTD % XD</th>'
    +'<th style="padding:12px 10px;text-align:center;font-size:11px;font-weight:700;color:#1A1A1A">YTD % SS</th>'
    +'</tr></thead>';
  var bdy='<tbody>';
  GRUPOS.forEach(function(g,gi){
    var rm=REAL_MENSAL[g]||{},xd=REAL_XD[g]||{},ss=REAL_SS[g]||{};
    var ytdG=ytdReal(g);
    var ytdX=mks.reduce(function(a,k){return a+(xd[k]||0);},0);
    var ytdS=mks.reduce(function(a,k){return a+(ss[k]||0);},0);
    var pXDytd=ytdG>0?ytdX/ytdG*100:0,pSSytd=ytdG>0?ytdS/ytdG*100:0;
    var rowBg=gi%2===0?'#fff':'#FAFAFA';
    bdy+='<tr style="background:'+rowBg+';border-bottom:1px solid #F0F0F0">';
    bdy+='<td style="padding:11px 14px;font-size:13px;font-weight:700;color:#1A1A1A">'+g+'</td>';
    mks.forEach(function(k){
      var rv=rm[k]||0,xv=xd[k]||0,p=rv>0?xv/rv*100:0;
      var cls=p>=50?'pill-blue':p>=20?'pill-yellow':'pill-red';
      bdy+='<td style="padding:11px 10px;text-align:center">'+(rv>0?'<span class="pill '+cls+'">'+p.toFixed(0)+'%</span>':'\u2014')+'</td>';
    });
    bdy+='<td style="padding:11px 10px;text-align:right;font-weight:600;font-size:12px">'+fmt(ytdG)+'</td>';
    bdy+='<td style="padding:11px 10px;text-align:center"><span class="pill '+(pXDytd>=50?'pill-blue':pXDytd>=20?'pill-yellow':'pill-red')+'">'+pXDytd.toFixed(0)+'%</span></td>';
    bdy+='<td style="padding:11px 10px;text-align:center"><span class="pill '+(pSSytd>=20?'pill-yellow':'pill-red')+'">'+pSSytd.toFixed(0)+'%</span></td>';
    bdy+='</tr>';
  });
  bdy+='</tbody>';
  tbl.innerHTML=hdr+bdy;
  // Mostrar itens Cross Docking automaticamente
  setTimeout(function(){showLogItens('xd', null);}, 100);
}

function buildADS(){
  var mks=MESES_DONE;
  var curMk=mks[mks.length-1], prevMk=mks.length>1?mks[mks.length-2]:null;

  // Helpers
  function sumV(obj,mksArr){return GRUPOS.reduce(function(a,g){return a+mksArr.reduce(function(s,k){return s+((obj&&obj[g]||{})[k]||0);},0);},0);}
  function sumVmk(obj,mk){return GRUPOS.reduce(function(a,g){return a+((obj&&obj[g]||{})[mk]||0);},0);}

  var ADS_GMV = typeof REAL_ADS_GMV_PADS!=='undefined'?REAL_ADS_GMV_PADS:null;
  var ADS_CLK = typeof REAL_ADS_CLICKS!=='undefined'?REAL_ADS_CLICKS:null;

  // PADS investimento (fonte: DM_MKP_COMMERCE_ADS_GENERAL via REAL_ADS_PADS)
  var tPads = sumV(REAL_ADS_PADS, PERIODO);
  var tGmvPads = sumV(ADS_GMV, PERIODO);
  var tClicks  = sumV(ADS_CLK, PERIODO);
  var tTGMV    = GRUPOS.reduce(function(a,g){return a+ytdTGMV(g);},0)||GRUPOS.reduce(function(a,g){return a+ytdReal(g);},0);

  // MoM — usa o período selecionado como referência, não sempre o último mês
  var MONTH_ORDER=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  var focalMk = PERIODO.length===1 ? PERIODO[0] : curMk;
  var focalIdx = MONTH_ORDER.indexOf(focalMk);
  var prevFocalMk = focalIdx>0 ? MONTH_ORDER[focalIdx-1] : null;
  var isMTD = PERIODO.length===1 && focalMk===curMk;
  var pAdsCur  = sumVmk(REAL_ADS_PADS, focalMk);
  var pAdsPrev = prevFocalMk ? sumVmk(REAL_ADS_PADS, prevFocalMk) : 0;
  var mom = null;
  if(isMTD && pAdsPrev>0){
    var dCur=Math.max(DIA_MES_ATUAL,1), dPrev=DIAS_MES_MAP[prevFocalMk]||30;
    mom = ((pAdsCur/dCur) - (pAdsPrev/dPrev)) / (pAdsPrev/dPrev) * 100;
  } else if(!isMTD && pAdsPrev>0){
    mom = (pAdsCur-pAdsPrev)/pAdsPrev*100;
  }

  // KPIs
  var pctTGMV = tTGMV>0?tPads/tTGMV*100:0;
  var acos     = tGmvPads>0?tPads/tGmvPads*100:0;

  function momBadge(v){
    if(v===null)return '';
    var c=v>=0?'#00A650':'#F23D4F',arr=v>=0?'▲':'▼';
    return '<span style="font-size:11px;color:'+c+';font-weight:700;margin-left:6px">'+arr+' '+(v>=0?'+':'')+v.toFixed(1)+'% MoM</span>';
  }

  // KPI cards estilo Looker
  var el=document.getElementById('ads-kpi-row');
  if(el)el.innerHTML='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">'
    +[
      {lbl:'Inversão PAds', val:fmt(tPads), sub:momBadge(mom), border:'#3483FA'},
      {lbl:'Inversão / TGMV Total', val:pctTGMV.toFixed(1)+'%', sub:(pctTGMV>=5?'✅ Meta ≥5%':'⚠️ Abaixo de 5%'), border:pctTGMV>=5?'#00A650':'#F23D4F'},
      {lbl:'Receitas PAds (GMV)', val:fmt(tGmvPads), sub:'GMV influenciado', border:'#00A650'},
      {lbl:'ACOS Real', val:tPads>0?(acos.toFixed(1)+'%'):'—', sub:acos<15?'✅ Eficiente':'⚠️ Alto', border:acos>0&&acos<15?'#00A650':'#FFB900'},
      {lbl:'Clicks', val:fmtN(tClicks), sub:'Total no período', border:'#9B59B6'},
    ].map(function(k){
      return '<div style="background:#fff;border-radius:10px;padding:16px 18px;border-top:3px solid '+k.border+';box-shadow:0 1px 5px rgba(0,0,0,.06)">'
        +'<div style="font-size:9px;font-weight:700;color:#AAA;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">'+k.lbl+'</div>'
        +'<div style="font-size:22px;font-weight:900;color:#1A1A1A;line-height:1;margin-bottom:4px">'+k.val+'</div>'
        +'<div style="font-size:11px;color:#666">'+k.sub+'</div>'
      +'</div>';
    }).join('')+'</div>';

  // Gráfico PADS mensal por grupo
  destroyChart('ads-bar');
  var canEl=document.getElementById('ads-bar-chart');
  var colors=[C_BLUE,'#FF7A00','#9B59B6','#F23D4F','#00A650','#FFB900','#3498DB','#E74C3C','#2ECC71','#95A5A6'];
  if(canEl)chartInstances['ads-bar']=new Chart(canEl.getContext('2d'),{type:'bar',
    data:{labels:mks.map(function(k){return MESES_PT_CURTO[k];}),
          datasets:GRUPOS.map(function(g,i){return {label:g,
            data:mks.map(function(k){return (REAL_ADS_PADS&&REAL_ADS_PADS[g]||{})[k]||0;}),
            backgroundColor:colors[i%colors.length],borderRadius:2};})},
    options:{responsive:true,animation:false,
      scales:{x:{stacked:true},y:{stacked:true,ticks:{callback:function(v){return fmt(v);}}}},
      plugins:{legend:{position:'top',labels:{boxWidth:10,font:{size:10}}},
               tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+fmt(c.raw);}}}}}});

  // Tabela por grupo: PADS | %TGMV | GMV PADS | ACOS | Clicks | MoM
  var tbl=document.getElementById('ads-table');
  if(!tbl)return;
  var th=function(t){return '<th style="padding:10px 10px;text-align:right;font-size:10px;font-weight:800;color:#1A1A1A;white-space:nowrap">'+t+'</th>';};
  var hdr='<thead><tr style="background:#FFE600">'
    +'<th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:800;color:#1A1A1A">Grupo</th>'
    +th('Inversão PADS')+th('% TGMV')+th('GMV PADS')+th('ACOS')+th('Clicks')+th('MoM PADS')
    +'</tr></thead>';
  var bdy='<tbody>'+GRUPOS.map(function(g,gi){
    var pads=PERIODO.reduce(function(s,k){return s+((REAL_ADS_PADS&&REAL_ADS_PADS[g]||{})[k]||0);},0);
    var gmvP=ADS_GMV?PERIODO.reduce(function(s,k){return s+((ADS_GMV[g]||{})[k]||0);},0):0;
    var clks=ADS_CLK?PERIODO.reduce(function(s,k){return s+((ADS_CLK[g]||{})[k]||0);},0):0;
    var tgmvG=ytdTGMV(g)||ytdReal(g);
    var pPct=tgmvG>0?pads/tgmvG*100:0;
    var acosG=gmvP>0?pads/gmvP*100:0;
    // MoM desta group — usa focalMk e prevFocalMk (respeita período selecionado)
    var padsCur=((REAL_ADS_PADS&&REAL_ADS_PADS[g]||{})[focalMk]||0);
    var padsPrev=prevFocalMk?((REAL_ADS_PADS&&REAL_ADS_PADS[g]||{})[prevFocalMk]||0):0;
    var momG=null;
    if(isMTD&&padsPrev>0){var dC=Math.max(DIA_MES_ATUAL,1),dP=DIAS_MES_MAP[prevFocalMk]||30;momG=(padsCur/dC-padsPrev/dP)/(padsPrev/dP)*100;}
    else if(!isMTD&&padsPrev>0)momG=(padsCur-padsPrev)/padsPrev*100;
    var momStr=momG!==null?('<span style="color:'+(momG>=0?'#00A650':'#F23D4F')+';font-weight:700">'+(momG>=0?'▲+':'▼')+Math.abs(momG).toFixed(1)+'%</span>'):'—';
    return '<tr style="background:'+(gi%2===0?'#fff':'#FAFAFA')+';border-bottom:1px solid #F0F0F0">'
      +'<td style="padding:9px 14px;font-size:12px;font-weight:700;color:#1A1A1A">'+g+'</td>'
      +'<td style="padding:9px 10px;text-align:right;color:#3483FA;font-weight:700;font-size:12px">'+fmt(pads)+'</td>'
      +'<td style="padding:9px 10px;text-align:right;font-size:11px;color:#555">'+pPct.toFixed(1)+'%</td>'
      +'<td style="padding:9px 10px;text-align:right;font-size:11px;color:#555">'+fmt(gmvP)+'</td>'
      +'<td style="padding:9px 10px;text-align:right;font-size:11px;color:'+(acosG>0&&acosG<15?'#00A650':acosG>0?'#B07A00':'#AAA')+'">'+( acosG>0?acosG.toFixed(1)+'%':'—')+'</td>'
      +'<td style="padding:9px 10px;text-align:right;font-size:11px;color:#555">'+fmtN(clks)+'</td>'
      +'<td style="padding:9px 10px;text-align:right">'+momStr+'</td>'
      +'</tr>';
  }).join('')+'</tbody>';
  tbl.innerHTML=hdr+bdy;
}
function buildInvestimentos(){
  var tGMV=GRUPOS.reduce(function(a,g){return a+ytdReal(g);},0);
  var tNMV=GRUPOS.reduce(function(a,g){return a+ytdTGMV(g);},0)||tGMV;

  // Helper: soma variável por grupos/PERIODO
  function ytdV(varObj){if(!varObj)return 0;return GRUPOS.reduce(function(a,g){return a+PERIODO.reduce(function(s,k){return s+((varObj[g]||{})[k]||0);},0);},0);}
  function ytdCob(type){return GRUPOS.reduce(function(a,g){return a+PERIODO.reduce(function(s,k){return s+((REAL_INV_COB&&REAL_INV_COB[g]||{})[k]||{})[type]||0;},0);},0);}

  // Tipos usando DM_EFICIENCIA como fonte principal (validado vs Pandora)
  // DM_COBERTURA apenas para CUPOM_MARKETING e PIX (não disponíveis no DM_EFICIENCIA)
  var _EF=typeof REAL_INV_PREACORDO!=='undefined';
  // Helper para ler campo do investments direto do JS (via REAL_MENSAL estrutura)
  // Os campos novos da query F&H são expostos via REAL_INV_PMCOFIN etc.
  var typesEF=[
    {k:'PRE_ACORDO',    lbl:'PRE-ACORDO',        val:ytdV(REAL_INV_PREACORDO),                                                    clr:'#3483FA'},
    {k:'SAD',           lbl:'SAD',               val:ytdV(REAL_INV_SAD),                                                          clr:'#FF7A00'},
    {k:'AUTOMATICAS',   lbl:'AUTOMÁTICAS',       val:ytdV(typeof REAL_INV_AUTOCAMP!=='undefined'?REAL_INV_AUTOCAMP:null)||ytdV(REAL_ADS_AUTO), clr:'#3498DB'},
    {k:'CUPOM_GV',      lbl:'CUPOM GV',          val:ytdV(typeof REAL_INV_CUPONS_EF!=='undefined'?REAL_INV_CUPONS_EF:REAL_CUPONS),clr:'#FFB900'},
    {k:'PM_COFIN',      lbl:'PM COFINANCIADA',   val:ytdV(typeof REAL_INV_PMCOFIN!=='undefined'?REAL_INV_PMCOFIN:null),           clr:'#00A650'},
    {k:'PM_100',        lbl:'PM 100% MELI',      val:ytdV(typeof REAL_INV_PM100!=='undefined'?REAL_INV_PM100:null),               clr:'#27AE60'},
    {k:'PIX',           lbl:'PIX',               val:ytdCob('PIX'),                                                               clr:'#E91E63'},
    {k:'CUPOM_MKT',     lbl:'CUPOM MARKETING',   val:ytdV(typeof REAL_INV_CUPONS_MKT!=='undefined'?REAL_INV_CUPONS_MKT:null)||ytdCob('CUPOM_MARKETING'), clr:'#F39C12'},
  ].filter(function(t){return t.val>0;}).sort(function(a,b){return b.val-a.val;});
  var tTotal=typesEF.reduce(function(s,t){return s+t.val;},0);
  var tPreac=ytdV(REAL_INV_PREACORDO);
  var tSad=ytdV(REAL_INV_SAD);

  var el=document.getElementById('inv-kpi-row');

  // Cards por tipo (DM_EFICIENCIA como fonte principal)
  var invCards='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px;margin-bottom:20px">';
  typesEF.forEach(function(t){
    var pNmv=tNMV>0?t.val/tNMV*100:0,pTot=tTotal>0?t.val/tTotal*100:0;
    invCards+='<div style="background:#fff;border-radius:8px;padding:16px 18px;border:1px solid #E8E8E8;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
      +'<div style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">'+t.lbl+'</div>'
      +'<div style="font-size:20px;font-weight:800;color:#1A1A1A;margin-bottom:4px">'+fmt(t.val)+'</div>'
      +'<div style="font-size:11px;color:#888">'+pNmv.toFixed(1)+'% NMV &bull; '+pTot.toFixed(1)+'% do total</div>'
      +'</div>';
  });
  invCards+='</div>';

  // TOTAL INVESTIDO = REGULAR_INVESTMENT_LC (total deduplificado — igual ao da Aline)
  var tRegular=typeof REAL_INV_REGULAR!=='undefined'?ytdV(REAL_INV_REGULAR):0;
  var tTotInv=tRegular||tTotal;
  var totalCards='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">'
    +'<div style="background:#fff;border-radius:8px;padding:18px 20px;border:1px solid #E8E8E8;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
      +'<div style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">TOTAL INVESTIDO</div>'
      +'<div style="font-size:24px;font-weight:800;color:#1A1A1A;margin-bottom:4px">'+fmt(tTotInv||tInv)+'</div>'
      +'<div style="font-size:11px;color:#888">'+(tNMV>0?((tTotInv||tInv)/tNMV*100).toFixed(1):'0.0')+'% do NMV</div>'
    +'</div>'
    +'<div style="background:#fff;border-radius:8px;padding:18px 20px;border:1px solid #E8E8E8;box-shadow:0 1px 4px rgba(0,0,0,.05)">'
      +'<div style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">DESC. VERTICAL</div>'
      +'<div style="font-size:24px;font-weight:800;color:#1A1A1A;margin-bottom:4px">R$ 0</div>'
      +'<div style="font-size:11px;color:#888">0,0% do NMV</div>'
    +'</div></div>';
  if(el){el.innerHTML='';el.style.display='none';}
  var wrap=document.getElementById('inv-kpi-wrap');
  if(wrap){wrap.innerHTML=invCards+totalCards;}
  var mks=MESES_DONE;
  destroyChart('inv-bar');
  var canEl=document.getElementById('inv-bar-chart');
  if(canEl)chartInstances['inv-bar']=new Chart(canEl.getContext('2d'),{type:'bar',data:{labels:mks.map(function(k){return MESES_PT_CURTO[k];}),datasets:[{label:'ADS',data:mks.map(function(k){return GRUPOS.reduce(function(a,g){return a+((REAL_INV_ADS[g]||{})[k]||0);},0);}),backgroundColor:C_BLUE,borderRadius:2},{label:'Cupons',data:mks.map(function(k){return GRUPOS.reduce(function(a,g){return a+((REAL_CUPONS[g]||{})[k]||0);},0);}),backgroundColor:C_PURPLE,borderRadius:2}]},options:{responsive:true,animation:false,scales:{x:{stacked:true},y:{stacked:true,ticks:{callback:function(v){return fmt(v);}}}},plugins:{legend:{position:'bottom'}}}});
  var th2=function(t,al){return '<th style="padding:10px 12px;font-size:10px;font-weight:800;color:#1A1A1A;text-align:'+(al||'right')+';background:#FFE600;white-space:nowrap">'+t+'</th>';};
  var td2=function(v,bold){var s=bold?'font-weight:800;font-size:13px;color:#1A1A1A':'font-size:12px;color:#555';return '<td style="padding:10px 12px;text-align:right;white-space:nowrap;'+s+'">'+(v>0?fmt(v):'<span style="color:#CCC">\u2014</span>')+'</td>';};
  var tGMVt=GRUPOS.reduce(function(s,g){return s+ytdReal(g);},0);

  // Tabela por grupo: PRE-ACORDO | SAD | AUTOMÁTICAS | CUPOM | PM COFIN | Total | % NMV
  function grpEF(g,varObj){return varObj?PERIODO.reduce(function(s,k){return s+((varObj[g]||{})[k]||0);},0):0;}
  var hdr='<thead><tr>'+th2('Grupo','left')+th2('PRE-ACORDO')+th2('SAD')+th2('AUTOMÁTICAS')+th2('CUPOM COM.')+th2('PM COFIN')+th2('Total')+th2('% NMV')+'</tr></thead>';
  var bdy='<tbody>'+GRUPOS.map(function(g,gi){
    var pr=grpEF(g,REAL_INV_PREACORDO),sd=grpEF(g,REAL_INV_SAD);
    var au=grpEF(g,typeof REAL_INV_AUTOCAMP!=='undefined'?REAL_INV_AUTOCAMP:REAL_ADS_AUTO);
    var cu=grpEF(g,typeof REAL_INV_CUPONS_EF!=='undefined'?REAL_INV_CUPONS_EF:REAL_CUPONS);
    var pm=grpEF(g,typeof REAL_INV_PMCOFIN!=='undefined'?REAL_INV_PMCOFIN:null);
    var tot=pr+sd+au+cu+pm,nmv=ytdTGMV(g)||ytdReal(g),p=nmv>0?tot/nmv*100:0;
    var grpColor=GRUPO_COLOR[g]||'#3483FA',rowBg=gi%2===0?'#fff':'#FAFAFA';
    var pColor=p>=5?'#F23D4F':p>=3?'#B07A00':'#00A650';
    return '<tr style="background:'+rowBg+';border-bottom:1px solid #F0F0F0" onmouseover="this.style.background=\'#FFFBEA\'" onmouseout="this.style.background=\''+rowBg+'\'">'
      +'<td style="padding:10px 12px;font-weight:700;font-size:12px;color:#1A1A1A"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+grpColor+';margin-right:6px;vertical-align:middle"></span>'+g+'</td>'
      +td2(pr,false)+td2(sd,false)+td2(au,false)+td2(cu,false)+td2(pm,false)+td2(tot,true)
      +'<td style="padding:10px 12px;text-align:center"><span style="background:'+(p>=5?'rgba(242,61,79,.1)':p>=3?'rgba(255,185,0,.15)':'rgba(0,166,80,.1)')+';color:'+pColor+';font-size:11px;font-weight:800;padding:3px 8px;border-radius:20px">'+p.toFixed(1)+'%</span></td>'
      +'</tr>';
  }).join('')
  +'<tr style="background:#F0F0F0;border-top:2px solid #E0E0E0">'
    +'<td style="padding:10px 12px;font-size:12px;font-weight:800;color:#1A1A1A">TOTAL</td>'
    +td2(tPreac,false)+td2(tSad,false)
    +td2(ytdV(typeof REAL_INV_AUTOCAMP!=='undefined'?REAL_INV_AUTOCAMP:REAL_ADS_AUTO),false)
    +td2(ytdV(typeof REAL_INV_CUPONS_EF!=='undefined'?REAL_INV_CUPONS_EF:REAL_CUPONS),false)
    +td2(ytdV(typeof REAL_INV_PMCOFIN!=='undefined'?REAL_INV_PMCOFIN:null),false)
    +'<td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:900;color:#3483FA;white-space:nowrap">'+fmt(tTotal)+'</td>'
    +'<td style="padding:10px 12px;text-align:center;font-size:12px;font-weight:800;color:#3483FA">'+(tNMV>0?(tTotal/tNMV*100).toFixed(1)+'%':'-')+'</td>'
  +'</tr></tbody>';
  var tbl=document.getElementById('inv-table');
  if(tbl)tbl.innerHTML=hdr+bdy;
}

// ÔòÉÔòÉ VISITAS & CONVERSâO ÔòÉÔòÉ
function buildVisTopCards(items, containerId){
  // Usa LIVELISTING (DM_MKP_COMMERCE_OFFER) como fonte principal — mesma da Aline
  var el=document.getElementById(containerId);
  if(!el)return;
  var src=items.length?items:(typeof LIVELISTING!=='undefined'?LIVELISTING:[]);
  if(!src.length){el.innerHTML='<p style="color:#aaa;font-size:12px;padding:16px">Sem dados de visitas para o período.</p>';return;}
  var top=src.slice().sort(function(a,b){return b.visits-a.visits;}).slice(0,12);
  el.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px">'
  +top.map(function(it,i){
    var href=mlLink(it);
    var cvrColor=it.cvr>=3?'#00A650':it.cvr>=1?'#FFB900':'#F23D4F';
    var cor=GRUPO_COLOR[it.grupo||'']||'#3483FA';
    var nm=(it.title||it.nm||'').substring(0,45)+((it.title||it.nm||'').length>45?'...':'');
    var vis=it.visits>=1000?(it.visits/1000).toFixed(1)+' mil':it.visits;
    return '<div style="background:#fff;border-radius:10px;border:1px solid #E8E8E8;padding:12px 14px;cursor:pointer" '
      +'onclick="window.open(\''+href+'\',\'_blank\')">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
        +'<span style="font-size:11px;font-weight:800;color:#3483FA">#'+(i+1)+'</span>'
        +'<span style="font-size:11px;font-weight:800;color:'+cvrColor+'">'+it.cvr.toFixed(1)+'%</span>'
      +'</div>'
      +'<div style="font-size:12px;font-weight:700;color:#1A1A1A;line-height:1.4;margin-bottom:6px;min-height:34px">'+nm+'</div>'
      +'<div style="font-size:10px;color:#888;margin-bottom:6px">'
        +'<span style="background:'+cor+'22;color:'+cor+';font-weight:700;padding:2px 7px;border-radius:8px;font-size:9px">'+((it.grupo||''))+'</span>'
        +' &bull; '+vis+' visitas &bull; '+Math.round(it.si||0)+' vendas'
      +'</div>'
      +'<div style="display:flex;justify-content:space-between;font-size:10px;color:#aaa">'
        +'<span>'+fmt(it.gmv)+'</span>'
        +'<span>'+(it.domain||'').split(' ')[0]+'</span>'
      +'</div>'
    +'</div>';
  }).join('')+'</div>';
}

function buildVisCvrOppTable(items, containerId){
  // Layout Aline: tabela com #, Item ID, Item, Seller, Grupo, D1, Visitas, Vendas, CVR, NMV + seção oportunidades
  var el=document.getElementById(containerId);
  if(!el||!items||!items.length)return;
  // Filtrar por PERIODO
  // Usa LIVELISTING como fonte principal quando disponível
  var srcOpp=items.length?items:(typeof LIVELISTING!=='undefined'?LIVELISTING:[]);
  var sorted=srcOpp.slice().sort(function(a,b){return b.visits-a.visits;}).slice(0,100);
  // Tabela completa
  var th=function(t,al){return '<th style="padding:9px 10px;font-size:10px;font-weight:700;color:#1A1A1A;background:#FFE600;white-space:nowrap;text-align:'+(al||'right')+'">'+t+'</th>';};
  var hdr='<thead><tr>'+th('#','center')+th('Item ID','left')+th('Item','left')+th('Seller','left')+th('Grupo','left')+th('D1','left')+th('Visitas')+th('Vendas')+th('CVR')+th('NMV')+'</tr></thead>';
  var bdy='<tbody>'+sorted.map(function(it,i){
    var href=mlLink(it);
    var cvrColor=it.cvr>=3?'#00A650':it.cvr>=1?'#FFB900':'#F23D4F';
    var cor=GRUPO_COLOR[it.grupo||'']||'#3483FA';
    var nm=(it.title||it.nm||'').substring(0,40)+((it.title||it.nm||'').length>40?'...':'');
    var vis=Math.round(it.visits||0).toLocaleString('pt-BR');
    var rowBg=i%2===0?'#fff':'#FAFAFA';
    return '<tr style="background:'+rowBg+';border-bottom:1px solid #F0F0F0">'
      +'<td style="padding:8px 10px;text-align:center;font-size:11px;font-weight:700;color:#3483FA">'+(i+1)+'</td>'
      +'<td style="padding:8px 10px"><a href="'+href+'" target="_blank" style="color:#3483FA;font-size:10px;font-weight:600;text-decoration:none">'+((it.mlb_id||''))+'</a></td>'
      +'<td style="padding:8px 10px;font-size:11px;font-weight:600;color:#1A1A1A;max-width:200px">'+nm+'</td>'
      +'<td style="padding:8px 10px;font-size:10px;color:#555">'+((it.seller||'').substring(0,18))+'</td>'
      +'<td style="padding:8px 8px"><span style="background:'+cor+'22;color:'+cor+';font-size:9px;font-weight:800;padding:2px 6px;border-radius:8px">'+((it.grupo||''))+'</span></td>'
      +'<td style="padding:8px 10px;font-size:10px;color:#888">'+(it.domain||'').split(' ')[0]+'</td>'
      +'<td style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700">'+vis+'</td>'
      +'<td style="padding:8px 10px;text-align:right;font-size:11px;color:#555">'+Math.round(it.si||0).toLocaleString('pt-BR')+'</td>'
      +'<td style="padding:8px 10px;text-align:right;font-size:12px;font-weight:800;color:'+cvrColor+'">'+it.cvr.toFixed(1)+'%</td>'
      +'<td style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700;color:#1A1A1A">'+fmt(it.gmv)+'</td>'
      +'</tr>';
  }).join('')+'</tbody>';
  var tbl='<div style="overflow-x:auto;border-radius:8px;border:1px solid #E8E8E8"><table style="width:100%;border-collapse:collapse;font-size:11px">'+hdr+bdy+'</table></div>';

  // Seção oportunidades (visitas altas, CVR baixo)
  var opp=srcOpp.filter(function(it){return it.visits>=1000&&it.cvr<3;})
    .sort(function(a,b){return (b.visits*(3-b.cvr))-(a.visits*(3-a.cvr));}).slice(0,20);
  var oppHtml='';
  if(opp.length){
    var thO=function(t,al){return '<th style="padding:8px 10px;font-size:10px;font-weight:700;color:#1A1A1A;background:#FFF3CD;text-align:'+(al||'right')+'">'+t+'</th>';};
    var hdrO='<thead><tr>'+thO('#','center')+thO('Item','left')+thO('Grupo','left')+thO('Visitas')+thO('CVR')+thO('NMV')+'</tr></thead>';
    var bdyO='<tbody>'+opp.map(function(it,i){
      var href=mlLink(it);
      var cvrC=it.cvr>=3?'#00A650':it.cvr>=1?'#FFB900':'#F23D4F';
      var rowBg=i%2===0?'#fff':'#FAFAFA';
      var nm=(it.title||it.nm||'').substring(0,50)+((it.title||it.nm||'').length>50?'...':'');
      return '<tr style="background:'+rowBg+';border-bottom:1px solid #F0F0F0">'
        +'<td style="padding:8px 10px;text-align:center;font-size:11px;font-weight:700;color:#3483FA">'+(i+1)+'</td>'
        +'<td style="padding:8px 10px;max-width:260px"><a href="'+href+'" target="_blank" style="color:#1A1A1A;text-decoration:none;font-size:11px;font-weight:600">'+nm+'</a></td>'
        +'<td style="padding:8px 10px;font-size:10px;color:#555">'+((it.grupo||''))+'</td>'
        +'<td style="padding:8px 10px;text-align:right;font-size:11px;font-weight:700">'+Math.round(it.visits||0).toLocaleString('pt-BR')+'</td>'
        +'<td style="padding:8px 10px;text-align:right;font-size:12px;font-weight:800;color:'+cvrC+'">'+it.cvr.toFixed(1)+'%</td>'
        +'<td style="padding:8px 10px;text-align:right;font-size:11px">'+fmt(it.gmv)+'</td>'
        +'</tr>';
    }).join('')+'</tbody>';
    oppHtml='<div style="margin-top:24px"><div style="font-size:13px;font-weight:700;color:#222;margin-bottom:10px;border-bottom:3px solid #FFE600;padding-bottom:6px">Maior Oportunidade de CVR (visitas altas, CVR baixo)</div>'
      +'<div style="overflow-x:auto;border-radius:8px;border:1px solid #E8E8E8"><table style="width:100%;border-collapse:collapse;font-size:11px">'+hdrO+bdyO+'</table></div></div>';
  }
  el.innerHTML=tbl+oppHtml;
}

function buildVisitasConversao(){
  var mks=MESES_DONE;
  var colors=[C_BLUE,'#FF7A00','#9B59B6','#F23D4F','#00A650','#FFB900','#3498DB','#E74C3C','#2ECC71','#95A5A6'];

  // KPIs usando dados do per\u00edodo selecionado (mesma base da Aline)
  var MK26VIS3={jan:'202601',feb:'202602',mar:'202603',apr:'202604',may:'202605',jun:'202606',jul:'202607',aug:'202608',sep:'202609',oct:'202610',nov:'202611',dec:'202612'};
  var periodoMK3=PERIODO.map(function(k){return MK26VIS3[k]||k;});
  var visItems=typeof VIS_ITEMS!=='undefined'?VIS_ITEMS:[];
  var visFilt=visItems.filter(function(it){return !it.month_key||periodoMK3.indexOf(it.month_key)>=0;});
  if(!visFilt.length)visFilt=visItems;
  // Totais do per\u00edodo a partir dos itens monitorados
  var tVisItems=visFilt.reduce(function(s,it){return s+(it.visits||0);},0);
  var tSIItems=visFilt.reduce(function(s,it){return s+(it.si||0);},0);
  var tNMVItems=visFilt.reduce(function(s,it){return s+(it.gmv||0);},0);
  var cvrItems=tVisItems>0?tSIItems/tVisItems*100:0;
  // Visitas YTD do grupo (de REAL_VISITAS)
  var tVis=GRUPOS.reduce(function(s,g){return s+PERIODO.reduce(function(ss,k){return ss+((REAL_VISITAS[g]||{})[k]||0);},0);},0);
  var tPed=GRUPOS.reduce(function(s,g){return s+PERIODO.reduce(function(ss,k){return ss+((REAL_PED_TOT[g]||{})[k]||0);},0);},0);
  var cvr=tVis>0?tPed/tVis*100:0;
  var nmvPeriodo=GRUPOS.reduce(function(s,g){return s+ytdNMV(g)||ytdTGMV(g)||ytdReal(g);},0)||0;

  var el=document.getElementById('vis-kpi-row');
  if(el)el.innerHTML=kpiHtml([
    {label:'VISITAS DO PER\u00cdODO',val:tVis>0?fmtN(tVis):fmtN(tVisItems),sub:'BT_ITE_VISITS \u2022 '+MESES_PT_CURTO[PERIODO[PERIODO.length-1]||''],cls:'blue'},
    {label:'VENDAS DO PER\u00cdODO',val:fmtN(tPed||tSIItems),sub:'Pedidos confirmados',cls:'blue'},
    {label:'CVR M\u00c9DIO',val:(tVis>0?cvr:cvrItems).toFixed(2)+'%',sub:'Visitas \u00f7 Vendas',cls:cvr>=3||cvrItems>=3?'green':cvr>=1||cvrItems>=1?'yellow':'red'},
    {label:'NMV PER\u00cdODO',val:fmt(nmvPeriodo),sub:'TGMV base Looker',cls:'blue'},
    {label:'ITENS MONITORADOS',val:fmtN(visFilt.length||visItems.length),sub:'Top por visitas \u2022 BT_ITE_VISITS',cls:'blue'}
  ]);

  // \u2500\u2500 Top 12 cards por visitas (BT_ITE_VISITS) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Preferir LIVELISTING filtrado pelo período selecionado
  var MK26LL={jan:'202601',feb:'202602',mar:'202603',apr:'202604',may:'202605',jun:'202606',jul:'202607',aug:'202608',sep:'202609',oct:'202610',nov:'202611',dec:'202612'};
  var periodoLL=PERIODO.map(function(k){return MK26LL[k]||k;});
  var llAll=typeof LIVELISTING!=='undefined'?LIVELISTING:[];
  var llFiltered=llAll.filter(function(it){return !it.month_key||periodoLL.indexOf(it.month_key)>=0;});
  if(!llFiltered.length)llFiltered=llAll;
  var visSource=llFiltered.length?llFiltered:(VIS_ITEMS||[]);
  buildVisTopCards(visSource, 'vis-top-cards');
  buildVisCvrOppTable(visSource, 'vis-cvr-opp-table');

  var labels=mks.map(function(k){return MESES_LABEL[MESES_KEYS.indexOf(k)];});
  var shortName=function(g){return g.length>12?g.substring(0,12)+'...':g;};

  // ── Stacked bar: Visitas por Grupo — Mensal ──────────────────────────
  var visDs=GRUPOS.map(function(g,i){
    return {
      label:shortName(g),
      data:mks.map(function(k){return (REAL_VISITAS[g]||{})[k]||0;}),
      backgroundColor:colors[i%colors.length],
      borderRadius:0
    };
  });
  destroyChart('vis-bar');
  var c1=document.getElementById('vis-bar-chart');
  if(c1)chartInstances['vis-bar']=new Chart(c1.getContext('2d'),{
    type:'bar',
    data:{labels:labels,datasets:visDs},
    options:{responsive:true,animation:false,
      scales:{
        x:{stacked:true},
        y:{stacked:true,ticks:{callback:function(v){
          if(v>=1e6)return (v/1e6).toFixed(1)+' M';
          if(v>=1e3)return (v/1e3).toFixed(0)+' K';
          return v;
        }}}
      },
      plugins:{
        legend:{position:'bottom',labels:{usePointStyle:true,pointStyleWidth:12,font:{size:9},boxWidth:10}},
        tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+fmtN(c.raw);}}}
      }
    }
  });

  // ── Line chart: Taxa de Conversão por Grupo (%) ───────────────────────
  var cvrDs=GRUPOS.map(function(g,i){
    return {
      label:shortName(g),
      data:mks.map(function(k){
        var v=(REAL_VISITAS[g]||{})[k]||0;
        var p=(REAL_PED_TOT[g]||{})[k]||0;
        return v>0?+(p/v*100).toFixed(3):null;
      }),
      borderColor:colors[i%colors.length],
      backgroundColor:'transparent',
      tension:0.3,
      pointRadius:5,
      pointBackgroundColor:colors[i%colors.length],
      borderWidth:2,
      spanGaps:false
    };
  });
  destroyChart('vis-cvr');
  var c2=document.getElementById('vis-cvr-chart');
  if(c2)chartInstances['vis-cvr']=new Chart(c2.getContext('2d'),{
    type:'line',
    data:{labels:labels,datasets:cvrDs},
    options:{responsive:true,animation:false,
      scales:{
        y:{min:0,ticks:{callback:function(v){return v.toFixed(1)+'%';}}}
      },
      plugins:{
        legend:{position:'bottom',labels:{usePointStyle:true,pointStyle:'circle',font:{size:9},boxWidth:10}},
        tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+(c.raw!==null?c.raw.toFixed(2)+'%':'--');}}}
      }
    }
  });

  // ── Tabela detalhamento ───────────────────────────────────────────────
  var tbl=document.getElementById('vis-table');
  if(!tbl)return;
  var hdr='<thead><tr style="background:#FFE600"><th style="padding:12px 14px;text-align:left;font-size:12px;font-weight:800;color:#1A1A1A">Grupo</th>';
  mks.forEach(function(mk){
    var lbl=MESES_LABEL[MESES_KEYS.indexOf(mk)];
    hdr+='<th style="padding:12px 8px;text-align:right;font-size:10px;font-weight:700;color:#1A1A1A">'+lbl+'<br><span style="font-size:8px;font-weight:400">Visitas</span></th>'
        +'<th style="padding:12px 8px;text-align:right;font-size:10px;font-weight:700;color:#1A1A1A">CVR%</th>';
  });
  hdr+='<th style="padding:12px 10px;text-align:right;font-size:10px;font-weight:700;color:#1A1A1A">YTD Visitas</th>'
      +'<th style="padding:12px 10px;text-align:right;font-size:10px;font-weight:700;color:#1A1A1A">CVR% YTD</th></tr></thead>';
  var bdy='<tbody>'+GRUPOS.map(function(g,gi){
    var ytdV=PERIODO.reduce(function(s,k){return s+((REAL_VISITAS[g]||{})[k]||0);},0);
    var ytdP=MESES_DONE.reduce(function(s,k){return s+((REAL_PED_TOT[g]||{})[k]||0);},0);
    var ytdCVR=ytdV>0?ytdP/ytdV*100:0;
    var cvrColor=ytdCVR>=3?'#00A650':ytdCVR>=1?'#FFB900':'#F23D4F';
    var row='<tr style="background:'+(gi%2===0?'#fff':'#FAFAFA')+';border-bottom:1px solid #F0F0F0">'
      +'<td style="padding:11px 14px;font-size:13px;font-weight:700;color:#1A1A1A">'+g+'</td>';
    mks.forEach(function(k){
      var v=(REAL_VISITAS[g]||{})[k]||0;
      var p=(REAL_PED_TOT[g]||{})[k]||0;
      var cvr=v>0?p/v*100:0;
      var cc=cvr>=3?'#00A650':cvr>=1?'#FFB900':'#F23D4F';
      row+='<td style="padding:11px 8px;text-align:right;font-size:11px;color:#555">'+(v>0?fmtN(v):'-')+'</td>'
          +'<td style="padding:11px 8px;text-align:right;font-size:11px;font-weight:700;color:'+cc+'">'+(v>0?cvr.toFixed(2)+'%':'-')+'</td>';
    });
    row+='<td style="padding:11px 10px;text-align:right;font-weight:700">'+(ytdV>0?fmtN(ytdV):'-')+'</td>'
        +'<td style="padding:11px 10px;text-align:right;font-weight:800;color:'+cvrColor+'">'+(ytdV>0?ytdCVR.toFixed(2)+'%':'-')+'</td>'
        +'</tr>';
    return row;
  }).join('')+'</tbody>';
  tbl.innerHTML=hdr+bdy;
}

function buildVGCat(){
  var allItems=[];
  GRUPOS.forEach(function(g){
    getItemsForPeriod(g).forEach(function(it){allItems.push(Object.assign({},it,{g:g}));});
  });
  allItems.sort(function(a,b){return b.gmv-a.gmv;});

  // container: try vg-items-container (new) or fallback to itens-table (old)
  var el=document.getElementById('vg-items-container')||document.getElementById('itens-table');
  if(!el)return;

  // Count filters
  var queda=allItems.filter(function(it){var g=it.gmv_mes_atual||0,p=it.gmv_mes_ant||0;return p>0&&(g-p)/p*100<-10;});
  var altaPreco=allItems.filter(function(it){return it.asp>(it.asp_prev||0)*1.1&&it.asp_prev>0;});
  var estrela=allItems.filter(function(it){return it.bb>=90&&it.gmv>50000;});
  var statusNot=allItems.filter(function(it){return (it.status||'active').toLowerCase()!=='active';});

  // ÔöÇÔöÇ GROUP PILLS (exactly like Larissa) ÔöÇÔöÇ
  var S='font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;border:1.5px solid #E0E0E0;background:#fff;color:#555;cursor:pointer;transition:all .15s;white-space:nowrap';
  var SA='font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;border:1.5px solid #FFE600;background:#FFE600;color:#1A1A1A;cursor:pointer;white-space:nowrap';
  var groupPills='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">'
    +'<button style="'+SA+'" id="vg-gpill-all" onclick="filterVGGroup(\'all\',this)">Todos</button>'
    +GRUPOS.map(function(g){
      return '<button style="'+S+'" onclick="filterVGGroup(\''+g+'\',this)">'+g+'</button>';
    }).join('')
    +'</div>';

  // ÔöÇÔöÇ SORT PILLS ÔöÇÔöÇ
  var Ss='font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;border:1.5px solid #1A1A1A;background:#1A1A1A;color:#fff;cursor:pointer;white-space:nowrap';
  var Su='font-size:11px;font-weight:600;padding:4px 14px;border-radius:20px;border:1.5px solid #E0E0E0;background:#fff;color:#555;cursor:pointer;white-space:nowrap';
  var sortPills='<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">'
    +'<span style="font-size:11px;color:#888;font-weight:700;margin-right:4px">Ordenar por:</span>'
    +'<button style="'+Ss+'" id="vg-sort-gmv" onclick="sortVGItems(\'gmv\',this)">GMV</button>'
    +'<button style="'+Su+'" id="vg-sort-si" onclick="sortVGItems(\'si\',this)">Units</button>'
    +'<button style="'+Su+'" id="vg-sort-asp" onclick="sortVGItems(\'asp\',this)">Pre\u00e7o</button>'
    +'</div>';

  // ÔöÇÔöÇ STATUS TABS ÔöÇÔöÇ
  var tabStyle='padding:10px 16px;border:none;background:transparent;font-size:13px;font-weight:600;color:#888;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;transition:all .15s';
  var tabActiveStyle='padding:10px 16px;border:none;background:transparent;font-size:13px;font-weight:600;color:#3483FA;cursor:pointer;border-bottom:3px solid #3483FA;margin-bottom:-2px';
  function badge(n,c){return '<span style="background:'+c+';color:#fff;font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px;margin-left:5px">'+n+'</span>';}
  var statusTabs='<div style="display:flex;border-bottom:2px solid #E0E0E0;margin-bottom:16px;flex-wrap:wrap">'
    +'<button style="'+tabActiveStyle+'" id="vg-stab-all" onclick="filterVGStatus(\'all\',this)">Todos'+badge(allItems.length,'#3483FA')+'</button>'
    +'<button style="'+tabStyle+'" id="vg-stab-queda" onclick="filterVGStatus(\'queda\',this)">📉 Em Queda'+badge(queda.length,'#F23D4F')+'</button>'
    +'<button style="'+tabStyle+'" id="vg-stab-alta" onclick="filterVGStatus(\'alta\',this)">💰 Alta de Pre\u00e7o'+badge(altaPreco.length,'#FF7A00')+'</button>'
    +'<button style="'+tabStyle+'" id="vg-stab-estrela" onclick="filterVGStatus(\'estrela\',this)">⭐ Estrela'+badge(estrela.length,'#FFB900')+'</button>'
    +'<button style="'+tabStyle+'" id="vg-stab-status" onclick="filterVGStatus(\'status\',this)">\u26a0 Status'+badge(statusNot.length,'#888')+'</button>'
    +'</div>';

  el.innerHTML=groupPills+sortPills+statusTabs+'<div id="vg-items-tbl"></div>';
  window._vg_all_items=allItems;
  window._vg_filter_group='all';
  window._vg_filter_status='all';
  window._vg_sort='gmv';
  renderVGItems();
}

function renderVGItems(){
  var items=window._vg_all_items||[];
  var fg=window._vg_filter_group||'all';
  var fs=window._vg_filter_status||'all';
  if(fg!=='all')items=items.filter(function(it){return it.g===fg;});
  if(fs==='queda')items=items.filter(function(it){var g=it.gmv_mes_atual||0,p=it.gmv_mes_ant||0;return p>0&&(g-p)/p*100<-10;});
  else if(fs==='alta')items=items.filter(function(it){return it.asp>(it.asp_prev||0)*1.1&&it.asp_prev>0;});
  else if(fs==='estrela')items=items.filter(function(it){return it.bb>=90&&it.gmv>50000;});
  else if(fs==='status')items=items.filter(function(it){return (it.status||'active').toLowerCase()!=='active';});
  var s=window._vg_sort||'gmv';
  items=[].concat(items).sort(function(a,b){return (b[s]||0)-(a[s]||0);});
  renderItemsTable(items.slice(0,100),'vg-items-tbl',true);
}

function filterVGGroup(g,btn){
  // Reset group pills
  var pills=document.querySelectorAll('#vg-items-container button, #itens-table button');
  pills.forEach(function(b){
    if(['Todos','GMV','Units','Preço','all'].some(function(t){return b.textContent.includes(t)||b.id&&b.id.includes('gpill')})){
      // only group pills, skip sort/status
    }
  });
  var S='font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;border:1.5px solid #E0E0E0;background:#fff;color:#555;cursor:pointer;white-space:nowrap';
  var SA='font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;border:1.5px solid #FFE600;background:#FFE600;color:#1A1A1A;cursor:pointer;white-space:nowrap';
  // Find the group pills row (first div inside container)
  var cont=document.getElementById('vg-items-container')||document.getElementById('itens-table');
  if(cont){cont.querySelectorAll('div:first-child button').forEach(function(b){b.style.cssText=S;});}
  btn.style.cssText=SA;
  window._vg_filter_group=g;
  renderVGItems();
}

function filterVGStatus(s,btn){
  var tabStyle='padding:10px 16px;border:none;background:transparent;font-size:13px;font-weight:600;color:#888;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;transition:all .15s';
  var tabActiveStyle='padding:10px 16px;border:none;background:transparent;font-size:13px;font-weight:600;color:#3483FA;cursor:pointer;border-bottom:3px solid #3483FA;margin-bottom:-2px';
  ['all','queda','alta','estrela','status'].forEach(function(id){
    var b=document.getElementById('vg-stab-'+id);
    if(b)b.style.cssText=tabStyle;
  });
  btn.style.cssText=tabActiveStyle;
  window._vg_filter_status=s;
  renderVGItems();
}

function sortVGItems(s,btn){
  var Ss='font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;border:1.5px solid #1A1A1A;background:#1A1A1A;color:#fff;cursor:pointer;white-space:nowrap';
  var Su='font-size:11px;font-weight:600;padding:4px 14px;border-radius:20px;border:1.5px solid #E0E0E0;background:#fff;color:#555;cursor:pointer;white-space:nowrap';
  ['gmv','si','asp'].forEach(function(id){
    var b=document.getElementById('vg-sort-'+id);
    if(b)b.style.cssText=Su;
  });
  btn.style.cssText=Ss;
  window._vg_sort=s;
  renderVGItems();
}
function pillPct(p){
  var cls=p>=80?'pill-green':p>=60?'pill-yellow':'pill-red';
  return '<span class="pill '+cls+'">'+p.toFixed(1)+'%</span>';
}

// Expensive vs Cheaper table — Fonte: LK_COMP_FAVORABILITIES · BOX_ALL_ABC
function buildExpensiveCheaper(containerId){
  var el=document.getElementById(containerId);
  if(!el)return;
  // Sort by last month % EXP descending
  var sellers=[].concat(FAV_ABC_SELLER||[]).sort(function(a,b){return b.last_pct-a.last_pct;});
  if(!sellers.length){el.innerHTML='<p style="color:#aaa;padding:16px">Sem dados BOX_ALL_ABC dispon\u00edveis.</p>';return;}

  var months=Object.keys((sellers[0]||{}).months||{}).sort();
  var msLabels={202601:'JAN',202602:'FEV',202603:'MAR',202604:'ABR',202605:'MAI',202606:'JUN'};
  function mkLabel(mk){return msLabels[mk]||mk.slice(4);}
  function pctColor(p){return p>=40?'#F23D4F':p>=20?'#FFB900':'#00A650';}
  function trendBadge(t){
    if(t===null||t===undefined)return '<span style="color:#ccc">\u2014</span>';
    var up=t>=0,color=up?'#F23D4F':'#00A650';
    return '<span style="color:'+color+';font-weight:700">'+(up?'\u25b2':'\u25bc')+' '+(up?'+':'')+t.toFixed(1)+'pp</span>';
  }

  // Header
  var thBase='padding:10px 10px;font-size:9.5px;font-weight:700;color:#888;text-align:';
  var hdr='<thead><tr style="border-bottom:1.5px solid #E0E0E0">'
    +'<th style="'+thBase+'left;padding:12px 16px;text-decoration:underline;color:#3483FA;font-size:11px">SELLER</th>';
  months.forEach(function(mk){
    var lbl=mkLabel(mk);
    hdr+='<th style="'+thBase+'right">'+lbl+' EXP</th>'
      +'<th style="'+thBase+'right">'+lbl+' CHEAP</th>'
      +'<th style="'+thBase+'center">'+lbl+' % EXP</th>';
  });
  hdr+='<th style="'+thBase+'center">TEND. % EXP</th></tr></thead>';

  var body='<tbody>';
  sellers.forEach(function(s,i){
    var rowBg=i%2===0?'#fff':'#FAFAFA';
    body+='<tr style="background:'+rowBg+';border-bottom:1px solid #F0F0F0" '
      +'onmouseover="this.style.background=\'#FFFBEA\'" onmouseout="this.style.background=\''+rowBg+'\'">'
      +'<td style="padding:12px 16px;font-size:12.5px;font-weight:800;color:#1A1A1A;white-space:nowrap">'+s.seller_name+'</td>';
    months.forEach(function(mk){
      var d=s.months[mk]||{};
      var exp=d.exp||0,cheap=d.cheap||0,pct=d.pct_exp||0;
      var noData=!d.match;
      body+='<td style="padding:11px 10px;text-align:right;font-size:11px;color:#aaa">'+(noData?'\u2014':fmtN(exp))+'</td>'
        +'<td style="padding:11px 10px;text-align:right;font-size:11px;color:#aaa">'+(noData?'\u2014':fmtN(cheap))+'</td>'
        +'<td style="padding:11px 10px;text-align:center">'+(noData?'<span style="color:#ccc">\u2014</span>':'<strong style="font-size:12px;color:'+pctColor(pct)+'">'+pct+'%</strong>')+'</td>';
    });
    body+='<td style="padding:11px 10px;text-align:center">'+trendBadge(s.trend)+'</td></tr>';
  });
  body+='</tbody>';

  el.innerHTML=''
    +'<p style="font-size:12.5px;font-weight:800;color:#1A1A1A;margin-bottom:4px">Visitas por Seller \u2014 Expensive vs Cheaper</p>'
    +'<p style="font-size:11px;color:#3483FA;font-weight:600;margin-bottom:14px">Fonte: LK_COMP_FAVORABILITIES \u00b7 BOX_ALL_ABC \u00b7 Jan\u2013Abr 2026</p>'
    +'<div style="overflow-x:auto;border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,.06);background:#fff">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px">'+hdr+body+'</table></div>';
}

function buildVGBPC(){
  var mks=MESES_DONE;
  console.log('[BPC] mks=',mks,'REAL_PED_TOT=',REAL_PED_TOT?Object.keys(REAL_PED_TOT):null,'sample=',REAL_PED_TOT&&REAL_PED_TOT['MULTILOJA']);

  // ÔöÇÔöÇ 4 KPI cards — igual Larissa ÔöÇÔöÇ
  var tPt=GRUPOS.reduce(function(s,g){return s+mks.reduce(function(ss,k){return ss+((REAL_PED_TOT[g]||{})[k]||0);},0);},0);
  var tPb=GRUPOS.reduce(function(s,g){return s+mks.reduce(function(ss,k){return ss+((REAL_PED_BB[g]||{})[k]||0);},0);},0);
  var tGMV=GRUPOS.reduce(function(s,g){return s+ytdReal(g);},0);
  var tGMVBB=GRUPOS.reduce(function(s,g){return s+mks.reduce(function(ss,k){return ss+((REAL_GMV_BB[g]||{})[k]||0);},0);},0);
  var pBB=tPt>0?pctNum(tPb,tPt):0, pGMVBB=tGMV>0?pctNum(tGMVBB,tGMV):0;
  var best=GRUPOS[0];
  GRUPOS.forEach(function(g){
    var p=mks.reduce(function(s,k){return s+((REAL_PED_TOT[g]||{})[k]||0);},0);
    var b=mks.reduce(function(s,k){return s+((REAL_PED_BB[g]||{})[k]||0);},0);
    var bp=mks.reduce(function(s,k){return s+((REAL_PED_TOT[best]||{})[k]||0);},0);
    var bb=mks.reduce(function(s,k){return s+((REAL_PED_BB[best]||{})[k]||0);},0);
    if(p>0&&b/p>bb/Math.max(bp,1))best=g;
  });
  var el=document.getElementById('vg-bpc-kpi');
  if(el)el.innerHTML=kpiHtml([
    {label:'BPC % M\u00e9dio (Pedidos)',val:pBB.toFixed(1)+'%',sub:fmtN(tPb)+' de '+fmtN(tPt)+' pedidos YTD',cls:pBB>=80?'green':pBB>=60?'yellow':'red'},
    {label:'GMV com Buybox YTD',val:fmt(tGMVBB),sub:pGMVBB.toFixed(1)+'% do GMV total',cls:pGMVBB>=80?'green':pGMVBB>=60?'yellow':'red'},
    {label:'GMV sem Buybox',val:fmt(tGMV-tGMVBB),sub:'Oportunidade de recupera\u00e7\u00e3o',cls:pGMVBB<80?'red':'yellow'},
    {label:'Melhor BPC',val:best,sub:'Maior % de buybox YTD',cls:'green'}
  ]);

  // ÔöÇÔöÇ Chart: BPC % por Grupo — Evolução Mensal (igual Larissa) ÔöÇÔöÇ
  var lColors=[C_BLUE,'#FF7A00','#9B59B6',C_GREEN,'#00BCD4','#E74C3C','#FFB900','#3498DB','#2ECC71','#95A5A6'];
  var dL=mks.map(function(mk){return MESES_LABEL[MESES_KEYS.indexOf(mk)];});
  var ds=GRUPOS.map(function(g,gi){
    return {label:g,
      data:mks.map(function(mk){var p=(REAL_PED_TOT[g]||{})[mk]||0;return p>0?+(pctNum((REAL_PED_BB[g]||{})[mk]||0,p).toFixed(1)):null;}),
      borderColor:lColors[gi%lColors.length],backgroundColor:'transparent',tension:0.3,pointRadius:5,borderWidth:2.5};
  });
  ds.push({label:'Meta 80%',data:mks.map(function(){return 80;}),borderColor:'#F23D4F',backgroundColor:'transparent',borderDash:[6,4],pointRadius:0,borderWidth:1.5});
  destroyChart('vg-bpc');
  var canEl=document.getElementById('vg-bpc-canvas');
  if(canEl)chartInstances['vg-bpc']=new Chart(canEl.getContext('2d'),{type:'line',data:{labels:dL,datasets:ds},
    options:{responsive:true,animation:false,
      plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:10}}},
               tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+(c.raw!==null?c.raw+'%':'-');}}}},
      scales:{y:{min:0,max:100,ticks:{callback:function(v){return v+'%';}}}}}});

  // ÔöÇÔöÇ Tabela Detalhamento por Grupo (igual Larissa) ÔöÇÔöÇ
  var bth=document.getElementById('vg-bpc-table');
  if(bth){
    var th=function(t,al){return '<th style="padding:10px 12px;font-size:10px;font-weight:700;color:#fff;text-align:'+(al||'center')+';white-space:nowrap;background:#1A1A1A">'+t+'</th>';};
    var hdr='<thead><tr>'+th('Grupo','left');
    mks.forEach(function(mk){hdr+=th(MESES_LABEL[MESES_KEYS.indexOf(mk)]+'<br><span style="font-size:9px;font-weight:400">BPC %</span>');});
    hdr+=th('YTD BPC %')+th('GMV BPC %')+'</tr></thead>';
    
    function bpcPill(p){
      var bg=p>=80?'#D4F2E0':p>=65?'#FFF3C4':'#FDECEA';
      var c=p>=80?'#00A650':p>=65?'#9A7000':'#F23D4F';
      return '<span style="background:'+bg+';color:'+c+';font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;display:inline-block">'+p.toFixed(1)+'%</span>';
    }
    
    var body='<tbody>';
    GRUPOS.forEach(function(g,gi){
      var rowBg=gi%2===0?'#fff':'#FAFAFA';
      body+='<tr style="background:'+rowBg+';border-bottom:1px solid #F0F0F0">';
      body+='<td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1A1A1A;white-space:nowrap">'+g+'</td>';
      mks.forEach(function(mk){
        var p=(REAL_PED_TOT[g]||{})[mk]||0,b=(REAL_PED_BB[g]||{})[mk]||0;
        var pct=p>0?pctNum(b,p):null;
        body+='<td style="padding:10px 10px;text-align:center">'+(pct!==null?bpcPill(pct):'-')+'</td>';
      });
      var tp=mks.reduce(function(s,k){return s+((REAL_PED_TOT[g]||{})[k]||0);},0);
      var tb=mks.reduce(function(s,k){return s+((REAL_PED_BB[g]||{})[k]||0);},0);
      var tg=ytdReal(g),tgb=mks.reduce(function(s,k){return s+((REAL_GMV_BB[g]||{})[k]||0);},0);
      body+='<td style="padding:10px 10px;text-align:center">'+(tp>0?bpcPill(pctNum(tb,tp)):'-')+'</td>';
      body+='<td style="padding:10px 10px;text-align:center">'+(tg>0?bpcPill(pctNum(tgb,tg)):'-')+'</td>';
      body+='</tr>';
    });
    bth.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.07)">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff">'+hdr+body+'</tbody></table></div>';
  }

  // ÔöÇÔöÇ Top Ofensores — BOX_ALL_ABC Expensive ÔöÇÔöÇ
  var offs=[];
  // Usa EXPENSIVE_ITEMS (BOX_ALL_ABC) se disponível, senão fallback para TOP_ITEMS
  if(typeof EXPENSIVE_ITEMS!=='undefined'&&EXPENSIVE_ITEMS&&EXPENSIVE_ITEMS.length>0){
    offs=EXPENSIVE_ITEMS.slice(0,30).map(function(r){
      return {mlb_id:r.mlb_id,item_id:r.item_id,nm:r.titulo,seller:r.seller,
              domain:r.domain,gmv:r.gmv_30d,si:r.units,asp:r.asp||r.preco_atual,
              bb:100-r.pct_expensive,g:r.grupo,preco_atual:r.preco_atual,
              pct_expensive:r.pct_expensive,thumb:r.thumb||'',permalink:r.permalink||''};
    });
  } else {
    GRUPOS.forEach(function(g){(TOP_ITEMS[g]||[]).filter(function(it){return it.bb<70&&it.gmv>0;}).slice(0,5).forEach(function(it){offs.push(Object.assign({},it,{g:g}));});});
  }
  offs.sort(function(a,b){return b.gmv-a.gmv;});
  var offtbl=document.getElementById('vg-bpc-offenders');
  if(offtbl){
    var oh='<thead><tr><th>Grupo</th><th>T\u00edtulo</th><th>GMV</th><th>BPC%</th></tr></thead>';
    var ob='<thead><tr style="background:#FFE600">'
      +'<th style="padding:12px 10px;text-align:center;font-size:11px;font-weight:800;color:#1A1A1A;width:36px">#</th>'
      +'<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:800;color:#1A1A1A;min-width:320px">Produto</th>'
      +'<th style="padding:12px 12px;text-align:right;font-size:11px;font-weight:800;color:#1A1A1A">GMV s/Buybox</th>'
      +'<th style="padding:12px 10px;text-align:center;font-size:11px;font-weight:800;color:#1A1A1A">% s/BB</th>'
      +'<th style="padding:12px 10px;text-align:right;font-size:11px;font-weight:800;color:#1A1A1A">NASP</th>'
      +'<th style="padding:12px 12px;text-align:center;font-size:11px;font-weight:800;color:#1A1A1A">Grupo</th>'
      +'<th style="padding:12px 12px;text-align:center;font-size:11px;font-weight:800;color:#1A1A1A">Diagnóstico</th>'
      +'</tr></thead>'
      +'<tbody>'+offs.slice(0,30).map(function(it,idx){
        var rowBg=idx%2===0?'#fff':'#FAFAFA';
        var pctSB=Math.max(0,100-(it.bb||0));
        var gmvSB=it.gmv*(pctSB/100);
        var pctCls=pctSB>=60?'background:#FDECEA;color:#F23D4F':pctSB>=30?'background:#FFF3CD;color:#B8860B':'background:#D4EDDA;color:#00A650';
        var grpColor=GRUPO_COLOR[it.g||'']||'#3483FA';
        var diag=it.bb<50?'Preço não competitivo':it.bb<65?'BPC abaixo do ideal':'Oportunidade';
        var diagColor=it.bb<50?'#F23D4F':it.bb<65?'#B07A00':'#00A650';
        var mlb=it.mlb_id||('MLB'+(it.item_id||''));
        var href=mlLink(it);
        var imgHtml=mlImgTag(it);
        return '<tr style="background:'+rowBg+';border-bottom:1px solid #F0F0F0" onmouseover="this.style.background=\'#FFFBEA\'" onmouseout="this.style.background=\''+rowBg+'\'">' 
          +'<td style="padding:12px 10px;text-align:center;font-size:11px;font-weight:700;color:#888">'+(idx+1)+'</td>'
          +'<td style="padding:10px 16px">'
            +'<div style="display:flex;align-items:center;gap:12px">'
              +imgHtml
              +'<div>'
                +'<a href="'+href+'" target="_blank" style="color:#1A1A1A;text-decoration:none;font-size:13px;font-weight:700;display:block;line-height:1.3">'+it.nm.substring(0,48)+(it.nm.length>48?'...':'')+'</a>'
                +'<span style="font-size:10px;color:#AAA">'+mlb+'</span>'
              +'</div>'
            +'</div>'
          +'</td>'
          +'<td style="padding:12px 12px;text-align:right;font-size:13px;font-weight:900;color:#1A1A1A;white-space:nowrap"><strong>'+fmt(gmvSB)+'</strong></td>'
          +'<td style="padding:12px 10px;text-align:center"><span style="'+pctCls+';font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px">'+pctSB.toFixed(0)+'%</span></td>'
          +'<td style="padding:12px 10px;text-align:right;font-size:12px;color:#555;white-space:nowrap">R$ '+Math.round(it.asp||0).toLocaleString('pt-BR')+'</td>'
          +'<td style="padding:12px 12px;text-align:center"><span style="font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;background:'+grpColor+'22;color:'+grpColor+'">'+it.g+'</span></td>'
          +'<td style="padding:12px 12px;text-align:center;font-size:12px;font-weight:700;color:'+diagColor+'">'+diag+'</td>'
          +'</tr>';
      }).join('')+'</tbody>';
    offtbl.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.07)">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px">'+ob+'</table></div>';
  }


  // ÔöÇÔöÇ Acioníveis BPC ÔöÇÔöÇ
  var ba=document.getElementById('vg-bpc-actions');
  if(ba){
    // Build rich 3-card acionáveis from real data
    var allOffs=[];
    GRUPOS.forEach(function(g){
      getItemsForPeriod(g).filter(function(it){return it.bb<80&&it.gmv>0;}).forEach(function(it){
        allOffs.push(Object.assign({},it,{g:g,gmvSB:it.gmv*Math.max(0,100-it.bb)/100}));
      });
    });
    allOffs.sort(function(a,b){return b.gmvSB-a.gmvSB;});

    var criticos=allOffs.filter(function(it){return it.bb<40;});
    var semBB=allOffs.filter(function(it){return it.bb<80;});
    var totalGMVsB=allOffs.reduce(function(s,it){return s+it.gmvSB;},0);
    var top5=allOffs.slice(0,5);

    var card=function(border,icon,title,body){
      return '<div style="background:#fff;border-radius:12px;padding:20px 22px;box-shadow:0 2px 8px rgba(0,0,0,.06);border-left:4px solid '+border+';flex:1;min-width:280px">'
        +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'
          +'<span style="font-size:26px">'+icon+'</span>'
          +'<strong style="font-size:14px;color:#1A1A1A;line-height:1.3">'+title+'</strong>'
        +'</div>'
        +'<div style="font-size:12.5px;color:#444;line-height:1.6">'+body+'</div>'
        +'</div>';
    };

    var act=function(txt){return '<div style="margin-bottom:5px">\u2192 '+txt+'</div>';};
    var bold=function(txt){return '<strong>'+txt+'</strong>';};

    // Card 1: itens críticos
    var topNames=criticos.slice(0,3).map(function(it){return '<em>'+it.nm.substring(0,35)+'...</em>';}).join(', ');
    var body1=bold(criticos.length+' item(s)')+' com mais de 60% dos pedidos sem buybox e GMV relevante. '
      +'Esses itens est\u00e3o vendendo abaixo do potencial m\u00e1ximo.<br><br>'
      +act('Analisar pre\u00e7o praticado vs concorrentes para: '+topNames)
      +act('Verificar se h\u00e1 vendedor com pre\u00e7o menor ativo no cat\u00e1logo')
      +act('Ajustar pre\u00e7o para reconquistar buybox (ganho estimado: '+fmt(totalGMVsB)+' em GMV recuper\u00e1vel)');

    // Card 2: ativar price competitivo
    var body2=bold(semBB.length+' item(s)')+' est\u00e3o perdendo buybox. A ferramenta ajusta o pre\u00e7o automaticamente '
      +'para reconquistar buybox sem necessitar interven\u00e7\u00e3o manual.<br><br>'
      +act('Ativar Pre\u00e7o Competitivo Autom\u00e1tico nos '+semBB.length+' itens identificados')
      +act('Definir limite de pre\u00e7o m\u00ednimo para prote\u00e7\u00e3o de margem')
      +act('Monitorar BPC % nos pr\u00f3ximos 7 dias ap\u00f3s ativa\u00e7\u00e3o');

    // Card 3: top 5 GMV recuperável
    var body3='Os 5 maiores ofensores representam '+bold(fmt(top5.reduce(function(s,it){return s+it.gmvSB;},0)))+' em GMV que passou sem buybox YTD.<br><br>'
      +top5.map(function(it){
        return act('"'+it.nm.substring(0,35)+'..." \u2014 '+fmt(it.gmvSB)+' sem BB ('+Math.max(0,100-it.bb).toFixed(0)+'%)');
      }).join('');

    ba.innerHTML='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">'
      +card('#F23D4F','\uD83D\uDD34','Itens cr\u00edticos sem buybox (>60% pedidos fora)',body1)
      +card('#FFB900','\u2699\uFE0F','Ativar Pre\u00e7o Competitivo Autom\u00e1tico',body2)
      +card('#FFB900','\uD83D\uDCB0','Top 5 oportunidades de GMV recuper\u00e1vel',body3)
      +'</div>';
  }

}

function buildPreNeg(){
  var pd=PRENEG_DATA||{};
  var meses=pd.meses||[], itens=pd.itens||[];
  var promoId=pd.promo_id||'P-MLB17513050', inicio=pd.inicio||'2026-05-01';
  var fim=pd.fim||'2026-07-19';
  var budgetTotal=pd.budget_total||700000;
  // Budget consumido = campo Pandora se disponivel, senao soma rebates
  var budgetCons=pd.budget_consumido_pandora||meses.reduce(function(s,m){return s+(m.rebates||0);},0);
  var semDados=!meses.length;

  // Atualizar badge com periodo e budget
  var badge=document.getElementById('preneg-badge');
  if(badge){
    var pctBudget=budgetTotal>0?(budgetCons/budgetTotal*100).toFixed(1):0;
    var budgetColor=budgetCons/budgetTotal<0.5?'#00A650':budgetCons/budgetTotal<0.8?'#E67E00':'#F23D4F';
    badge.innerHTML='Vig&ecirc;ncia: '+inicio+' → '+fim
      +'&nbsp;&nbsp;|&nbsp;&nbsp;<b>Budget: '+fmt(budgetCons)+' / '+fmt(budgetTotal)+'</b>'
      +' <span style="color:'+budgetColor+';font-weight:900">('+pctBudget+'%)</span>';
  }

  // NMV real do período (BT_UE — mesma base do Geral)
  var totNMV=GRUPOS.reduce(function(a,g){return a+(ytdNMV(g)||ytdTGMV(g)||ytdReal(g));},0)||
             meses.reduce(function(s,m){return s+(m.nmv||0);},0)||1;
  var totDXI=meses.reduce(function(s,m){return s+(m.rebates||m.dxi||0);},0); // rebates = PRE_ACORDO
  var totDXB=meses.reduce(function(s,m){return s+(m.dxb||0);},0);
  var totCUP=meses.reduce(function(s,m){return s+(m.cupons||0);},0);
  var totINV=totDXI+totDXB+totCUP;

  var kRow=document.getElementById('preneg-kpi-row');
  if(kRow)kRow.innerHTML=kpiHtml([
    {label:'NMV Total Mai',val:fmt(totNMV),sub:'desde '+inicio,cls:'blue'},
    {label:'Rebate DXI (Prenegociada)',val:fmt(totDXI),sub:(totNMV>0?(totDXI/totNMV*100).toFixed(1)+'% do NMV':'0%'),cls:'purple'},
    {label:'Budget Pandora',val:fmt(budgetCons),sub:'de '+fmt(budgetTotal)+' ('+pctBudget+'%)',cls:budgetCons/budgetTotal<0.5?'green':'yellow'}
  ]);

  // Tabela MLB (ordenada por Rebates DESC)
  var tbI=document.getElementById('preneg-mlb-table');
  if(tbI){
    var th2=function(t,al){return '<th style="padding:10px 12px;font-size:11px;font-weight:700;color:#FFE600;background:#1A1A1A;text-align:'+(al||'left')+'">'+t+'</th>';};
    var hdr2='<thead><tr>'+th2('MLB')+th2('Produto')+th2('Grupo')+th2('NMV','right')+th2('SIs','right')+th2('Cupons','right')+th2('Rebates','right')+th2('Total','right')+th2('% GMV','center')+'</tr></thead>';
    var bdy2='<tbody>';
    if(!itens.length){
      bdy2+='<tr><td colspan="9" style="text-align:center;color:#aaa;padding:24px">&#9203; Dados disponíveis a partir de 02/05/2026</td></tr>';
    }else{
      itens=[].concat(itens).sort(function(a,b){return (b.rebates||0)-(a.rebates||0);});
      itens.forEach(function(it,i){
        var cor=GRUPO_COLOR[it.grupo]||'#3483FA';
        var link='https://produto.mercadolivre.com.br/'+it.mlb.replace('MLB','MLB-');
        var bg=i%2===0?'#fff':'#FAFAFA';
        bdy2+='<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'
          +'<td><a href="'+link+'" target="_blank" style="color:#3483FA;font-size:11px;font-weight:700">'+it.mlb+' &#8599;</a></td>'
          +'<td style="font-size:11px;max-width:220px">'+it.titulo+'</td>'
          +'<td><span style="background:'+cor+'22;color:'+cor+';font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px">'+it.grupo+'</span></td>'
          +'<td style="text-align:right">'+fmt(it.nmv)+'</td>'
          +'<td style="text-align:right">'+it.si+'</td>'
          +'<td style="text-align:right;color:#B07A00">'+fmt(it.cupons)+'</td>'
          +'<td style="text-align:right;color:#9B59B6">'+fmt(it.rebates)+'</td>'
          +'<td style="text-align:right;font-weight:800">'+fmt(it.total)+'</td>'
          +'<td style="text-align:center">'+it.pct+'%</td></tr>';
      });
    }
    tbI.innerHTML=hdr2+bdy2+'</tbody>';
  }

  // Charts
  destroyChart('preneg-bar'); destroyChart('preneg-donut');
  var c1=document.getElementById('preneg-bar-chart');
  var c2=document.getElementById('preneg-donut-chart');
  if(!semDados&&c1){
    chartInstances['preneg-bar']=new Chart(c1.getContext('2d'),{type:'bar',
      data:{labels:meses.map(function(m){return m.mes;}),datasets:[
        {label:'ADS',data:meses.map(function(m){return m.ads||0;}),backgroundColor:'#3483FA',stack:'s',borderRadius:3},
        {label:'Cupons',data:meses.map(function(m){return m.cupons||0;}),backgroundColor:'#FFE600',stack:'s',borderRadius:3},
        {label:'Rebates',data:meses.map(function(m){return m.rebates||0;}),backgroundColor:'#9B59B6',stack:'s',borderRadius:3}
      ]},
      options:{responsive:true,animation:false,maintainAspectRatio:false,
        scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,ticks:{callback:function(v){return fmt(v);}}}},
        plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+fmt(c.raw);}}}}}
    });
  }
  if(!semDados&&c2&&totINV>0){
    chartInstances['preneg-donut']=new Chart(c2.getContext('2d'),{type:'doughnut',
      data:{labels:['Cupons','Rebates'],datasets:[{data:[totCUP,totREB],backgroundColor:['#FFE600','#9B59B6'],borderWidth:2}]},
      options:{responsive:true,animation:false,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}
    });
  }
}

function buildGMVHoje(){
  // Identifica o ultimo dia completo disponivel
  var datas = Object.keys(HOJE_DATA_TOTAL).sort();
  // Remove hoje (dia atual pode ser parcial)
  var hojeDate = new Date(); var todayStr = hojeDate.toISOString().slice(0,10);
  if(!datas.length){
    var el=document.getElementById('vg-hoje-header');
    if(el)el.innerHTML='<div style="padding:24px;text-align:center;color:#888">Dados ainda nao disponiveis</div>';
    return;
  }
  // Prefere hoje se disponivel; senao usa ultimo dia no HOJE_DATA ou TOP_HOJE
  var eHojeParcial = datas.indexOf(todayStr) >= 0;
  // Fallback: se hoje nao esta em HOJE_DATA_TOTAL, verifica TOP_HOJE
  if(!eHojeParcial&&typeof TOP_HOJE!=='undefined'&&TOP_HOJE.length){
    var topDates=(TOP_HOJE.map(function(r){return r.data;}).filter(Boolean));
    topDates.sort();
    var topLatest=topDates[topDates.length-1]||'';
    if(topLatest===todayStr){eHojeParcial=true;}
  }
  var dHoje  = eHojeParcial ? todayStr : datas[datas.length-1];
  // Ontem = dia anterior ao dHoje
  var datasAnteriores = datas.filter(function(d){return d < dHoje;});
  var dOntem = datasAnteriores.length ? datasAnteriores[datasAnteriores.length-1] : '';
  // D-7: 7 dias antes de dHoje
  var d7base = new Date(dHoje); d7base.setDate(d7base.getDate()-7);
  var d7str  = d7base.toISOString().slice(0,10);
  var d7Disp = datas.filter(function(d){return d<=d7str;});
  var dD7    = d7Disp.length ? d7Disp[d7Disp.length-1] : '';

  function getData(obj, dt){ return (obj&&dt&&obj[dt])||{gmv:0,si:0,ped:0}; }
  function varPct(cur,ref){ if(!ref||!ref.gmv||!cur||!cur.gmv)return null; return (cur.gmv-ref.gmv)/ref.gmv*100; }
  function badgeVar(pct){
    if(pct===null)return '<span style="color:#ccc">—</span>';
    var up=pct>=0,c=up?'#00A650':'#F23D4F',bg=up?'rgba(0,166,80,.1)':'rgba(242,61,79,.1)';
    return '<span style="color:'+c+';font-weight:800;font-size:13px;">'+
      (up?'▲':'▼')+' '+(pct>=0?'+':'')+pct.toFixed(1)+'%</span>';
  }

  // Header total
  var tot = getData(HOJE_DATA_TOTAL, dHoje);
  var totOntem = getData(HOJE_DATA_TOTAL, dOntem);
  var totD7 = getData(HOJE_DATA_TOTAL, dD7);
  var pvsOntem = varPct(tot, totOntem);
  var pvsD7 = varPct(tot, totD7);
  var dataHora = dHoje + ' (D-1 disponivel)';

  // Meta do dia = meta mensal total / dias no mês
  var curMk = MESES_DONE[MESES_DONE.length-1];
  var metaMensal = GRUPOS.reduce(function(a,g){ return a+((META_FIN[g]||{})[curMk]||0); }, 0);
  var metaDia = (DIAS_MES_TOTAL>0 && metaMensal>0) ? metaMensal/DIAS_MES_TOTAL : 0;
  var pctMetaDia = metaDia>0 ? (tot.gmv/metaDia*100) : null;
  // Horário atual para badge parcial
  var _now = new Date();
  var _nowStr = _now.getHours().toString().padStart(2,'0')+':'+_now.getMinutes().toString().padStart(2,'0');
  // Data formatada DD/MM/YYYY
  var dDisplay = dHoje.split('-').reverse().join('/');

  var hEl = document.getElementById('vg-hoje-header');
  if(hEl) hEl.innerHTML =
    '<div style="background:linear-gradient(135deg,#1A1B4B 0%,#3483FA 100%);border-radius:14px;padding:24px 28px;color:#fff;margin-bottom:4px;">'
    +'<div style="font-size:11px;font-weight:700;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">&#128202; GMV HOJE '+dDisplay+(eHojeParcial?' &bull; (parcial at&eacute; '+_nowStr+'h)':'')+'</div>'
    +'<div style="font-size:42px;font-weight:900;letter-spacing:-1px;margin-bottom:8px;">'+fmt(tot.gmv)+'</div>'
    +(pctMetaDia!==null
      ?'<div style="font-size:13px;font-weight:700;margin-bottom:12px;">'
        +'&#10148; &#127919; <span style="color:'+(pctMetaDia>=100?'#7EF09F':pctMetaDia>=80?'#FFE08A':'#FF8A8A')+'">'+pctMetaDia.toFixed(0)+'% da meta do dia</span>'
        +' <span style="opacity:.6;font-size:11px">(meta: '+fmt(metaDia)+')</span>'
        +'</div>'
      :'')
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">'
    +'<div style="background:rgba(255,255,255,.15);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;">&#128230; '+Math.round(tot.si||0).toLocaleString('pt-BR')+' SIs</div>'
    +'<div style="background:rgba(255,255,255,.15);border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;">&#128203; '+Math.round(tot.ped||0).toLocaleString('pt-BR')+' Pedidos</div>'
    +'</div>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;">'
    +(pvsOntem!==null?'<div style="background:rgba(255,255,255,.15);border-radius:20px;padding:6px 14px;font-size:12px;font-weight:700;">'
      +'vs Ontem '+(pvsOntem>=0?'▲':'▼')+' <span style="color:'+(pvsOntem>=0?'#7EF09F':'#FF8A8A')+'">'+(pvsOntem>=0?'+':'')+pvsOntem.toFixed(1)+'%</span></div>':'')
    +(pvsD7!==null?'<div style="background:rgba(255,255,255,.15);border-radius:20px;padding:6px 14px;font-size:12px;font-weight:700;">'
      +'vs D-7 '+(pvsD7>=0?'▲':'▼')+' <span style="color:'+(pvsD7>=0?'#7EF09F':'#FF8A8A')+'">'+(pvsD7>=0?'+':'')+pvsD7.toFixed(1)+'%</span></div>':'')
    +'</div>'
    +'</div>';

  // Tabela por grupo
  var thStyle='padding:10px 14px;font-size:10px;font-weight:800;color:#fff;text-align:';
  var hdr='<thead><tr style="background:#1A1A1A">'
    +'<th style="'+thStyle+'left">Grupo</th>'
    +'<th style="'+thStyle+'right">GMV Hoje <span style="font-size:8px;opacity:.7">(T-1)</span></th>'
    +'<th style="'+thStyle+'right">SIs</th>'
    +'<th style="'+thStyle+'right">Pedidos</th>'
    +'<th style="'+thStyle+'center">vs Ontem</th>'
    +'<th style="'+thStyle+'center">vs D-7</th>'
    +'</tr></thead>';

  var rows=GRUPOS.map(function(g){
    var gData = HOJE_DATA_GROUP[g]||{};
    var gHoje = getData(gData, dHoje);
    var gOntem= getData(gData, dOntem);
    var gD7   = getData(gData, dD7);
    return {g:g,gHoje:gHoje,gOntem:gOntem,gD7:gD7};
  }).sort(function(a,b){return (b.gHoje.gmv||0)-(a.gHoje.gmv||0);}).map(function(item){
    var g=item.g,gHoje=item.gHoje,gOntem=item.gOntem,gD7=item.gD7;
    var pO = varPct(gHoje,gOntem), pD = varPct(gHoje,gD7);
    var cor = GRUPO_COLOR[g]||'#3483FA';
    return '<tr style="border-bottom:1px solid #F0F0F0" onmouseover="this.style.background=\'#FFFBEA\'" onmouseout="this.style.background=\'#fff\'">'
      +'<td style="padding:12px 14px"><span style="background:'+cor+'22;color:'+cor+';font-size:11px;font-weight:800;padding:4px 12px;border-radius:20px">'+g+'</span></td>'
      +'<td style="padding:12px 14px;text-align:right;font-size:14px;font-weight:900;color:#1A1A1A">'+fmt(gHoje.gmv)+'</td>'
      +'<td style="padding:12px 14px;text-align:right;font-size:12px;color:#555">'+Math.round(gHoje.si||0).toLocaleString('pt-BR')+'</td>'
      +'<td style="padding:12px 14px;text-align:right;font-size:12px;color:#555">'+Math.round(gHoje.ped||0).toLocaleString('pt-BR')+'</td>'
      +'<td style="padding:12px 14px;text-align:center">'+badgeVar(pO)+'</td>'
      +'<td style="padding:12px 14px;text-align:center">'+badgeVar(pD)+'</td>'
      +'</tr>';
  }).join('');

  var gEl=document.getElementById('vg-hoje-grupos');
  if(gEl) gEl.innerHTML='<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.07)">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff">'+hdr+'<tbody>'+rows+'</tbody></table></div>';

  // Tabela Optin MTD por grupo
  buildOptinMTD();

  // Top itens do dia
  buildTopItensHoje(dHoje, dOntem, dD7);
}

function buildOptinMTDTab(){
  var el=document.getElementById('vg-optin-mtd-tab');
  if(!el)return;
  buildOptinMTDInto(el);
}

function buildOptinMTDInto(el){
  if(!el||typeof OPTIN_DATA==='undefined')return;
  var rows=GRUPOS.map(function(g){
    var d=OPTIN_DATA[g]||{};
    var el_=d.elegivel||0,op=d.optin||0;
    var pct=el_>0?+(op/el_*100).toFixed(1):0;
    var cor=pct>=80?'#00A650':pct>=50?'#FF7A00':'#3483FA';
    return {g:g,el:el_,op:op,pct:pct,cor:cor};
  }).sort(function(a,b){return b.pct-a.pct;});
  var totEl=rows.reduce(function(s,r){return s+r.el;},0);
  var totOp=rows.reduce(function(s,r){return s+r.op;},0);
  var totPct=totEl>0?+(totOp/totEl*100).toFixed(1):0;
  var th=function(t,al){return '<th style="padding:9px 12px;background:#FFE600;font-size:10px;font-weight:800;color:#1A1A1A;text-align:'+(al||'right')+';white-space:nowrap">'+t+'</th>';};
  var hdr='<thead><tr>'+th('Grupo','left')+th('Itens Elegiveis')+th('Itens c/ Optin')+th('% Optin')+'</tr></thead>';
  var bdy='<tbody>'+rows.map(function(r,i){
    var bg=i%2===0?'#fff':'#FAFAFA';
    var barW=Math.min(r.pct,100);
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'
      +'<td style="padding:9px 12px;font-size:12px;font-weight:700">'+r.g+'</td>'
      +'<td style="padding:9px 12px;text-align:right;color:#555">'+r.el.toLocaleString('pt-BR')+'</td>'
      +'<td style="padding:9px 12px;text-align:right;font-weight:700">'+r.op.toLocaleString('pt-BR')+'</td>'
      +'<td style="padding:9px 12px;text-align:right">'
        +'<div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">'
          +'<div style="width:80px;height:8px;background:#F0F0F0;border-radius:4px;overflow:hidden">'
            +'<div style="height:100%;background:'+r.cor+';width:'+barW+'%;border-radius:4px"></div>'
          +'</div>'
          +'<span style="font-weight:800;color:'+r.cor+';min-width:40px;text-align:right">'+r.pct+'%</span>'
        +'</div>'
      +'</td>'
    +'</tr>';
  }).join('')
  +'<tr style="background:#F8F8F8;border-top:2px solid #FFE600">'
    +'<td style="padding:9px 12px;font-size:12px;font-weight:800">TOTAL CARTEIRA</td>'
    +'<td style="padding:9px 12px;text-align:right;font-weight:700">'+totEl.toLocaleString('pt-BR')+'</td>'
    +'<td style="padding:9px 12px;text-align:right;font-weight:700">'+totOp.toLocaleString('pt-BR')+'</td>'
    +'<td style="padding:9px 12px;text-align:right;font-weight:800;color:#3483FA">'+totPct+'%</td>'
  +'</tr>'
  +'</tbody>';
  el.innerHTML='<div style="margin-bottom:8px;font-size:11px;color:#888">Itens elegíveis com optin ativo — mês corrente (F&H)</div>'
    +'<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.07)">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff">'+hdr+bdy+'</table></div>';
}

function buildOptinMTD(){
  var el=document.getElementById('vg-optin-mtd');
  if(!el||typeof OPTIN_DATA==='undefined')return;
  var rows=GRUPOS.map(function(g){
    var d=OPTIN_DATA[g]||{};
    var el_=d.elegivel||0,op=d.optin||0;
    var pct=el_>0?+(op/el_*100).toFixed(1):0;
    var cor=pct>=80?'#00A650':pct>=50?'#FF7A00':'#3483FA';
    return {g:g,el:el_,op:op,pct:pct,cor:cor};
  }).sort(function(a,b){return b.pct-a.pct;});
  var totEl=rows.reduce(function(s,r){return s+r.el;},0);
  var totOp=rows.reduce(function(s,r){return s+r.op;},0);
  var totPct=totEl>0?+(totOp/totEl*100).toFixed(1):0;
  var th=function(t,al){return '<th style="padding:9px 12px;background:#FFE600;font-size:10px;font-weight:800;color:#1A1A1A;text-align:'+(al||'right')+';white-space:nowrap">'+t+'</th>';};
  var hdr='<thead><tr>'+th('Grupo','left')+th('Itens Elegiveis')+th('Itens c/ Optin')+th('% Optin')+'</tr></thead>';
  var bdy='<tbody>'+rows.map(function(r,i){
    var bg=i%2===0?'#fff':'#FAFAFA';
    var barW=Math.min(r.pct,100);
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'
      +'<td style="padding:9px 12px;font-size:12px;font-weight:700">'+r.g+'</td>'
      +'<td style="padding:9px 12px;text-align:right;color:#555">'+r.el.toLocaleString('pt-BR')+'</td>'
      +'<td style="padding:9px 12px;text-align:right;font-weight:700">'+r.op.toLocaleString('pt-BR')+'</td>'
      +'<td style="padding:9px 12px;text-align:right">'
        +'<div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">'
          +'<div style="width:80px;height:8px;background:#F0F0F0;border-radius:4px;overflow:hidden">'
            +'<div style="height:100%;background:'+r.cor+';width:'+barW+'%;border-radius:4px"></div>'
          +'</div>'
          +'<span style="font-weight:800;color:'+r.cor+';min-width:40px;text-align:right">'+r.pct+'%</span>'
        +'</div>'
      +'</td>'
    +'</tr>';
  }).join('')
  +'<tr style="background:#F8F8F8;border-top:2px solid #FFE600">'
    +'<td style="padding:9px 12px;font-size:12px;font-weight:800">TOTAL CARTEIRA</td>'
    +'<td style="padding:9px 12px;text-align:right;font-weight:700">'+totEl.toLocaleString('pt-BR')+'</td>'
    +'<td style="padding:9px 12px;text-align:right;font-weight:700">'+totOp.toLocaleString('pt-BR')+'</td>'
    +'<td style="padding:9px 12px;text-align:right;font-weight:800;color:#3483FA">'+totPct+'%</td>'
  +'</tr>'
  +'</tbody>';
  el.innerHTML='<div style="margin-bottom:8px;font-size:11px;color:#888">Itens elegíveis com optin ativo — mês corrente (F&H)</div>'
    +'<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.07)">'
    +'<table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff">'+hdr+bdy+'</table></div>';
}

function buildTopItensHoje(dHoje, dOntem, dD7){
  // Ordenar por NMV por padrão
  var _filtro = window._hojeSort||'gmv';
  var filtros = [
    {id:'gmv',     label:'&#9650; Maior NMV',            fn:function(a,b){return b.gmv-a.gmv;}},
    {id:'si',      label:'&#9650; Maior Unidades',       fn:function(a,b){return b.si-a.si;}},
    {id:'vs_up',   label:'&#9650; Top Crescimento vs Ontem', fn:function(a,b){return b._vsO-a._vsO;}},
    {id:'vs_dn',   label:'&#9660; Top Queda vs Ontem',  fn:function(a,b){return a._vsO-b._vsO;}},
    {id:'d7_up',   label:'&#9650; Top Crescimento vs D-7',  fn:function(a,b){return b._vsD-a._vsD;}},
    {id:'d7_dn',   label:'&#9660; Top Queda vs D-7',    fn:function(a,b){return a._vsD-b._vsD;}},
  ];

  // Montar mapa item+data -> dados
  var byItem={};
  (TOP_HOJE||[]).forEach(function(r){
    var k=r.mlb_id;
    byItem[k]=byItem[k]||{mlb_id:k,titulo:r.titulo,grupo:r.grupo,domain:r.domain,by_date:{}};
    byItem[k].by_date[r.data]={gmv:r.gmv,si:r.si,asp:r.asp};
  });

  function enrich(items, dH, dO, dD){
    return items.map(function(it){
      var h=it.by_date[dH]||{gmv:0,si:0,asp:0};
      var o=it.by_date[dO]||{gmv:0,si:0,asp:0};
      var d=it.by_date[dD]||{gmv:0,si:0,asp:0};
      it.gmv=h.gmv; it.si=h.si;
    it.nmvD1=o.gmv;  // NMV de ontem (T-1, dado reconciliado)
    it.asp=h.asp>0?h.asp:(it._maxAsp||h.asp);
      it._vsO=o.gmv>0?(h.gmv-o.gmv)/o.gmv*100:null;
      it._vsD=d.gmv>0?(h.gmv-d.gmv)/d.gmv*100:null;
      return it;
    }).filter(function(it){return it.gmv>0||it.si>0;});
  }

  var allItems = enrich(Object.values(byItem), dHoje, dOntem, dD7);

  function badge(pct){
    if(pct===null)return '<span style="color:#ccc;font-size:11px">—</span>';
    var c=pct>=0?'#00A650':'#F23D4F';
    return '<span style="color:'+c+';font-weight:800;font-size:11px">'+(pct>=0?'▲':'▼')+' '+(pct>=0?'+':'')+pct.toFixed(1)+'%</span>';
  }

  function render(sortFn){
    var sorted=allItems.slice().sort(sortFn).slice(0,30);
    if(!sorted.length) return '<div style="padding:20px;text-align:center;color:#888">Sem dados para hoje</div>';
    var th=function(t,al){return '<th style="padding:9px 10px;font-size:10px;font-weight:800;color:#fff;text-align:'+(al||'left')+';white-space:nowrap;background:#1A1A1A">'+t+'</th>';};
    // GMV Hoje tem lag T-1 no nível de item — mostrar aviso e focar em SIs
    var hdr='<thead><tr>'+th('Produto')+th('Grupo','center')+th('MLB','center')+th('NMV Hoje','right')+th('SIs Hoje','right')+th('NMV D-1','right')+th('vs Ontem','center')+th('vs D-7','center')+'</tr></thead>';
    var bdy='<tbody>'+sorted.map(function(it,i){
      var cor=GRUPO_COLOR[it.grupo]||'#3483FA';
      var link='https://produto.mercadolivre.com.br/'+it.mlb_id.replace('MLB','MLB-');
      var bg=i%2===0?'#fff':'#FAFAFA';
      var nmvD1=it.nmvD1||0;
      var nmvHoje=it.gmv||0;
      return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0">'
        +'<td style="padding:8px 10px;font-size:11px;font-weight:600;color:#1A1A1A;max-width:280px">'+it.titulo+'</td>'
        +'<td style="padding:8px 10px;text-align:center"><span style="background:'+cor+'22;color:'+cor+';font-size:9px;font-weight:800;padding:2px 8px;border-radius:10px">'+it.grupo+'</span></td>'
        +'<td style="padding:8px 10px;text-align:center"><a href="'+link+'" target="_blank" style="color:#3483FA;font-size:10px;font-weight:700;text-decoration:none">'+it.mlb_id+' &#8599;</a></td>'
        +'<td style="padding:8px 10px;text-align:right;font-size:13px;font-weight:900;color:#1A1A1A">'+(nmvHoje>0?fmt(nmvHoje):'<span style="color:#ccc">—</span>')+'</td>'
        +'<td style="padding:8px 10px;text-align:right;font-size:12px;font-weight:600;color:#3483FA">'+it.si+'</td>'
        +'<td style="padding:8px 10px;text-align:right;font-size:11px;font-weight:600;color:#888">'+(nmvD1>0?fmt(nmvD1):'<span style="color:#ccc">—</span>')+'</td>'
        +'<td style="padding:8px 10px;text-align:center">'+badge(it._vsO)+'</td>'
        +'<td style="padding:8px 10px;text-align:center">'+badge(it._vsD)+'</td>'
        +'</tr>';
    }).join('')+'</tbody>';
    return '<div style="overflow-x:auto;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.07)">'
      +'<table style="width:100%;border-collapse:collapse;font-size:12px;background:#fff">'+hdr+bdy+'</table></div>';
  }

  // Filtros
  var fEl=document.getElementById('vg-hoje-filtros');
  if(fEl) fEl.innerHTML=filtros.map(function(f){
    var active=f.id===_filtro;
    return '<button onclick="window._hojeSort=\''+f.id+'\';buildTopItensHoje(\''+dHoje+'\',\''+dOntem+'\',\''+dD7+'\')" '
      +'style="padding:6px 14px;border-radius:20px;border:none;cursor:pointer;font-size:11px;font-weight:700;'
      +'background:'+(active?'#1A1A1A':'#F0F0F0')+';color:'+(active?'#FFE600':'#555')+'">'
      +f.label+'</button>';
  }).join('');

  var sortId = window._hojeSort||'gmv';
  var sf = (filtros.find(function(f){return f.id===sortId;})||filtros[0]).fn;
  var iEl=document.getElementById('vg-hoje-itens');
  if(iEl) iEl.innerHTML=render(sf);
}

function buildVGAtingimento(){
  var canvas=document.getElementById('vg-ating-chart');
  if(!canvas)return;
  var realArr=MESES_DONE.map(function(mk,i){
    var v=GRUPOS.reduce(function(s,g){return s+((REAL_MENSAL[g]||{})[mk]||0);},0);
    return i===MESES_DONE.length-1?+(v*FAT_PROJ).toFixed(0):v;
  });
  var mfArr=MESES_DONE.map(function(mk){return GRUPOS.reduce(function(s,g){return s+((META_FIN[g]||{})[mk]||0);},0);});
  var pFinArr=realArr.map(function(v,i){return mfArr[i]>0?+(v/mfArr[i]*100).toFixed(1):0;});
  var barColors=pFinArr.map(function(p){return p>=105?'rgba(0,166,80,0.85)':p>=80?'rgba(255,185,0,0.85)':'rgba(242,61,79,0.85)';});
  var momArr=MESES_DONE.map(function(mk,i){
    if(i===0)return null;
    var c=realArr[i],p=realArr[i-1];
    return p>0?+(c/p*100-100).toFixed(1):null;
  });
  var yoyArr=MESES_DONE.map(function(mk,i){
    var v=realArr[i];
    var v25=GRUPOS.reduce(function(s,g){var d=REAL_2025[g]||{};return s+(d[mk]?d[mk].gmv:0);},0);
    return v25>0?+(v/v25*100-100).toFixed(1):null;
  });
  var labels=MESES_DONE.map(function(mk,i){
    return MESES_LABEL[MESES_KEYS.indexOf(mk)]+(i===MESES_DONE.length-1?' (Proj. '+DIA_MES+'d)':'');
  });
  destroyChart('vg-ating');
  chartInstances['vg-ating']=new Chart(canvas.getContext('2d'),{
    type:'bar',
    plugins:[ChartDataLabels],
    data:{labels:labels,datasets:[
      {label:'Realizado',data:realArr,backgroundColor:barColors,borderRadius:8,barPercentage:0.55,order:2,
        datalabels:{anchor:'end',align:'end',offset:2,font:{size:13,weight:'900'},
          color:function(ctx){return pFinArr[ctx.dataIndex]>=105?'#00A650':pFinArr[ctx.dataIndex]>=80?'#B8860B':'#F23D4F';},
          formatter:function(v,ctx){var s=pFinArr[ctx.dataIndex].toFixed(0)+'%';return ctx.dataIndex===MESES_DONE.length-1?s+' (Proj.)':s;}}},
      {label:'Meta Fin.',data:mfArr,type:'line',borderColor:'rgba(52,131,250,0.6)',borderWidth:2,borderDash:[6,4],pointRadius:0,backgroundColor:'transparent',order:1,
        datalabels:{display:false}},
      {label:'MoM %',data:momArr,type:'line',borderColor:'#3483FA',backgroundColor:'transparent',pointBackgroundColor:'#3483FA',pointBorderColor:'#fff',pointBorderWidth:2,pointRadius:6,borderWidth:2,tension:0.3,yAxisID:'y2',spanGaps:false,order:0,
        datalabels:{anchor:'top',align:'top',offset:6,font:{size:11,weight:'bold'},color:'#3483FA',
          formatter:function(v){return v===null?'':(v>=0?'+':'')+v+'%';}}},
      {label:'YoY %',data:yoyArr,type:'line',borderColor:'#9B59B6',backgroundColor:'transparent',pointBackgroundColor:'#9B59B6',pointBorderColor:'#fff',pointBorderWidth:2,pointRadius:6,borderWidth:2,tension:0.3,borderDash:[5,3],yAxisID:'y2',spanGaps:false,order:0,
        datalabels:{anchor:'bottom',align:'bottom',offset:6,font:{size:11,weight:'bold'},color:'#9B59B6',
          formatter:function(v){return v===null?'':(v>=0?'+':'')+v+'%';}}}
    ]},
    options:{responsive:true,interaction:{mode:'index',intersect:false},
      layout:{padding:{top:36,bottom:36}},
      plugins:{
        datalabels:{display:true},
        legend:{position:'top',labels:{boxWidth:14,font:{size:11},filter:function(item){return item.text!=='';}}},
        tooltip:{callbacks:{label:function(c){
          if(c.raw===null)return null;
          if(c.dataset.yAxisID==='y2')return c.dataset.label+': '+(c.raw>=0?'+':'')+c.raw+'%';
          return c.dataset.label+': '+fmt(c.raw);
        }}}
      },
      scales:{
        x:{grid:{display:false},ticks:{font:{size:12,weight:'600'}}},
        y:{position:'left',grid:{color:'rgba(0,0,0,0.04)'},ticks:{callback:function(v){return fmt(v);},font:{size:10}}},
        y2:{position:'right',grid:{drawOnChartArea:false},ticks:{callback:function(v){return (v>=0?'+':'')+v+'%';},font:{size:10}}}
      }
    }
  });
}

// ÔöÇÔöÇ Init ÔöÇÔöÇ
window.addEventListener('DOMContentLoaded',function(){
  var fns=[
    ['buildVGQuarters',buildVGQuarters],
    ['buildVGKPIs',buildVGKPIs],
    ['buildNMVDiario35d',buildNMVDiario35d],
    ['buildVGHeatmap',buildVGHeatmap],
    ['buildVGUnifiedCards',buildVGUnifiedCards],
    ['buildVGScorecard',buildVGScorecard],
    ['buildCorpAcionaveis',buildCorpAcionaveis],
    ['buildHighsLows',buildHighsLows],
    ['buildVGReputacao',buildVGReputacao],
    ['buildSellersConsolidated',buildSellersConsolidated]
  ];
  for(var i=0;i<fns.length;i++){
    try{fns[i][1]();}
    catch(e){console.error('ERROR in '+fns[i][0]+':',e.message,e.stack);}
  }
  document.getElementById('loadingOverlay').style.display='none';
  setTimeout(function(){
    try{buildVGMesControl();}catch(e){console.error('buildVGMesControl:',e.message);}
    try{buildVGLineChart();}catch(e){console.error('buildVGLineChart:',e.message);}
    try{buildVGAtingimento();}catch(e){console.error('buildVGAtingimento:',e.message);}
  },100);
});



function buildCombo(){
  var mks=PERIODO.length?PERIODO:MESES_DONE;
  var totPSJ=GRUPOS.reduce(function(s,g){return s+mks.reduce(function(ss,k){return ss+(((COMBO_DATA[g]||{})[k]||{}).psj||0);},0);},0);
  var totPCJ=GRUPOS.reduce(function(s,g){return s+mks.reduce(function(ss,k){return ss+(((COMBO_DATA[g]||{})[k]||{}).pcj||0);},0);},0);
  var totAll=totPSJ+totPCJ,pPSJ=totAll>0?totPSJ/totAll*100:0;
  var el=document.getElementById('combo-kpi-row');
  if(el)el.innerHTML=kpiHtml([
    {label:'GMV PSJ (Sem Juros)',val:fmt(totPSJ),sub:pPSJ.toFixed(1)+'% do GMV combo',cls:pPSJ>=70?'green':pPSJ>=50?'yellow':'red'},
    {label:'GMV PCJ (Com Juros)',val:fmt(totPCJ),sub:(100-pPSJ).toFixed(1)+'% do GMV combo',cls:'blue'},
    {label:'% PSJ Médio Carteira',val:pPSJ.toFixed(1)+'%',sub:'Meta: >70% PSJ',cls:pPSJ>=70?'green':pPSJ>=50?'yellow':'red'},
    {label:'GMV Total Combo',val:fmt(totAll),sub:'PSJ + PCJ',cls:'blue'}
  ]);
  var groupPSJ=GRUPOS.map(function(g){var p=mks.reduce(function(s,k){return s+(((COMBO_DATA[g]||{})[k]||{}).psj||0);},0),c=mks.reduce(function(s,k){return s+(((COMBO_DATA[g]||{})[k]||{}).pcj||0);},0);return p+c>0?p/(p+c)*100:0;});
  destroyChart('combo-mix');
  var c1=document.getElementById('combo-mix-chart');
  if(c1)chartInstances['combo-mix']=new Chart(c1.getContext('2d'),{type:'bar',data:{labels:GRUPOS,datasets:[{label:'PSJ',data:groupPSJ.map(function(v){return +v.toFixed(1);}),backgroundColor:'#00A650cc',stack:'s',borderRadius:4},{label:'PCJ',data:groupPSJ.map(function(v){return +(100-v).toFixed(1);}),backgroundColor:'#F23D4F66',stack:'s'}]},options:{responsive:true,animation:false,indexAxis:'y',layout:{padding:{left:0}},scales:{x:{stacked:true,max:100,ticks:{callback:function(v){return v+'%';},font:{size:10}}},y:{stacked:true,ticks:{font:{size:9},mirror:false},afterFit:function(axis){axis.width=130;}}},plugins:{legend:{position:'top'},tooltip:{callbacks:{label:function(c){return c.dataset.label+': '+c.raw+'%';}}}}}});
  // Evolução sempre usa MESES_DONE para contexto histórico completo
  var trendMks=MESES_DONE;
  var trend=trendMks.map(function(k){var p=GRUPOS.reduce(function(s,g){return s+(((COMBO_DATA[g]||{})[k]||{}).psj||0);},0),c=GRUPOS.reduce(function(s,g){return s+(((COMBO_DATA[g]||{})[k]||{}).pcj||0);},0);return p+c>0?+(p/(p+c)*100).toFixed(1):null;});
  destroyChart('combo-trend');
  var c2=document.getElementById('combo-trend-chart');
  if(c2)chartInstances['combo-trend']=new Chart(c2.getContext('2d'),{type:'line',data:{labels:trendMks.map(function(k){return MESES_LABEL[MESES_KEYS.indexOf(k)];}),datasets:[{label:'% PSJ carteira',data:trend,borderColor:'#00A650',backgroundColor:'rgba(0,166,80,.12)',borderWidth:2.5,pointRadius:5,fill:true,tension:0.3}]},options:{responsive:true,animation:false,scales:{y:{min:0,max:100,ticks:{callback:function(v){return v+'%';}}}},plugins:{legend:{display:false}}}});
  var tbl=document.getElementById('combo-table');
  if(!tbl)return;
  var hdr='<thead><tr style="background:#FFE600"><th style="padding:12px 14px;text-align:left;font-size:12px;font-weight:800;color:#1A1A1A">Grupo</th>';
  mks.forEach(function(mk){var lbl=MESES_LABEL[MESES_KEYS.indexOf(mk)];hdr+='<th style="padding:12px 8px;text-align:right;font-size:10px;font-weight:700;color:#1A1A1A">'+lbl+' PSJ</th><th style="padding:12px 8px;text-align:center;font-size:10px;font-weight:700;color:#1A1A1A">% PSJ</th>';});
  hdr+='<th style="padding:12px 10px;text-align:center;font-size:10px;font-weight:700;color:#1A1A1A">YTD % PSJ</th></tr></thead>';
  var bdy='<tbody>'+GRUPOS.map(function(g,gi){var ytdP=mks.reduce(function(s,k){return s+(((COMBO_DATA[g]||{})[k]||{}).psj||0);},0),ytdC=mks.reduce(function(s,k){return s+(((COMBO_DATA[g]||{})[k]||{}).pcj||0);},0),ytdPct=ytdP+ytdC>0?ytdP/(ytdP+ytdC)*100:0,col=ytdPct>=70?'#00A650':ytdPct>=50?'#FFB900':'#F23D4F';var row='<tr style="background:'+(gi%2===0?'#fff':'#FAFAFA')+';border-bottom:1px solid #F0F0F0"><td style="padding:11px 14px;font-size:13px;font-weight:700">'+g+'</td>';mks.forEach(function(k){var p=(((COMBO_DATA[g]||{})[k]||{}).psj||0),c=(((COMBO_DATA[g]||{})[k]||{}).pcj||0),pct=p+c>0?p/(p+c)*100:0,col2=pct>=70?'#00A650':pct>=50?'#FFB900':'#F23D4F';row+='<td style="padding:11px 8px;text-align:right;font-size:11px;color:#555">'+(p>0?fmt(p):'-')+'</td><td style="padding:11px 8px;text-align:center;font-size:11px;font-weight:700;color:'+col2+'">'+(p+c>0?pct.toFixed(1)+'%':'-')+'</td>';});return row+'<td style="padding:11px 10px;text-align:center;font-weight:800;color:'+col+'">'+ytdPct.toFixed(1)+'%</td></tr>';}).join('')+'</tbody>';
  tbl.innerHTML=hdr+bdy;
}

function min100(v){return Math.min(v,100).toFixed(0);}


function buildVGReputacao(){
  var el=document.getElementById('vg-reputacao-cards');
  if(!el)return;
  var mks=MESES_DONE;

  el.innerHTML=GRUPOS.map(function(g){
    var d=REAL_REP[g]||{};
    var rep=((d.rep_level||'').toUpperCase());
    var canc=+(d.canc_pct||0);
    var seller=(d.seller||g).replace('LOJAOFICIAL','').replace('OFICIAL','').replace('LOJA','').trim();
    var grpColor=GRUPO_COLOR[g]||'#3483FA';
    var cancColor=canc<=5?'#00A650':canc<=15?'#FFB900':'#F23D4F';

    // Tendência: current vs previous month pp change
    var monthly=d.monthly||{};
    var cur=mks[mks.length-1], prev=mks.length>1?mks[mks.length-2]:null;
    var cCur=monthly[cur]?+monthly[cur].canc_pct:null;
    var cPrv=prev&&monthly[prev]?+monthly[prev].canc_pct:null;
    var trend=cCur!==null&&cPrv!==null?+(cCur-cPrv).toFixed(1):null;
    var trendHtml='';
    if(trend!==null){
      var tc=trend>0?'#F23D4F':'#00A650';
      var ta=trend>0?'\u25b2':'\u25bc';
      trendHtml='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
        +'<span style="font-size:11px;color:#666">Tend\u00eancia</span>'
        +'<span style="font-size:13px;font-weight:700;color:'+tc+'">'+ta+' '+Math.abs(trend).toFixed(1)+'pp</span>'
        +'</div>';
    }

    // Risk level based on cancellation rate and rep_level
    var risk='';
    if(rep==='YELLOW') risk='\u26a0 Risco de cair para Laranja';
    else if(canc>15) risk='\u26a0 Risco de cair para Amarelo';
    else if(canc>10) risk='\u26a0 Monitorar cancelamentos';

    return '<div style="background:#fff;border-radius:12px;padding:16px 18px;box-shadow:0 2px 8px rgba(0,0,0,.07);border-top:4px solid '+grpColor+'">'
      // Header: group name + ML badge
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
        +'<span style="font-size:13px;font-weight:800;color:#1A1A1A">'+g+'</span>'
        +'<span style="background:#FFE600;color:#1A1A1A;font-size:9px;font-weight:900;padding:1px 6px;border-radius:4px">ML</span>'
      +'</div>'
      // Seller nickname
      +'<div style="font-size:10px;color:#AAA;margin-bottom:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+seller.toUpperCase()+'</div>'
      // ML Platinum badge + cor da reputação
      +'<div style="margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
        +'<span style="background:#E3EDFF;color:#3483FA;font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;display:inline-flex;align-items:center;gap:6px">'
          +'<span style="width:8px;height:8px;border-radius:50%;background:#3483FA;display:inline-block"></span>'
          +'ML Platinum'
        +'</span>'
        +(rep==='YELLOW'?
          '<span style="background:#FFF3C4;color:#9A7000;font-size:10.5px;font-weight:700;padding:4px 10px;border-radius:20px;display:inline-flex;align-items:center;gap:5px">'
            +'<span style="width:7px;height:7px;border-radius:50%;background:#FFB900;display:inline-block"></span>'
            +'Amarela'
          +'</span>'
          :rep==='ORANGE'?
          '<span style="background:#FFE0C4;color:#B05000;font-size:10.5px;font-weight:700;padding:4px 10px;border-radius:20px;display:inline-flex;align-items:center;gap:5px">'
            +'<span style="width:7px;height:7px;border-radius:50%;background:#FF7A00;display:inline-block"></span>'
            +'Laranja'
          +'</span>'
          :
          '<span style="background:#D4F2E0;color:#00A650;font-size:10.5px;font-weight:700;padding:4px 10px;border-radius:20px;display:inline-flex;align-items:center;gap:5px">'
            +'<span style="width:7px;height:7px;border-radius:50%;background:#00A650;display:inline-block"></span>'
            +'Verde'
          +'</span>'
        )
      +'</div>'
      // Metrics
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
        +'<span style="font-size:11px;color:#666">% Cancelamentos</span>'
        +'<span style="font-size:14px;font-weight:800;color:'+cancColor+'">'+canc.toFixed(1)+'%</span>'
      +'</div>'
      +trendHtml
      +'<div style="font-size:10px;color:#AAA;margin-bottom:10px">Hist\u00f3rico rep. Est\u00e1vel Jan\u2013'+MES_ATUAL_PT+' 2026</div>'
      // Risk warning
      +(risk?'<div style="background:#FFF3CD;border:1px solid #FFE066;border-radius:8px;padding:5px 10px;font-size:10.5px;font-weight:600;color:#B07A00">'+risk+'</div>':'')
      +'</div>';
  }).join('');
}


function buildSellersConsolidated(){
  var wrap=document.getElementById('sellers-consolidated-wrap');
  if(!wrap)return;
  var mks=PERIODO.length?PERIODO:MESES_DONE;
  var cur=MESES_DONE[MESES_DONE.length-1],prev=MESES_DONE.length>1?MESES_DONE[MESES_DONE.length-2]:null;
  var isMTD=PERIODO.length===1&&PERIODO[0]===cur;

  // Helpers
  var th=function(t,al,w){return '<th style="padding:9px 12px;font-size:10px;font-weight:700;color:#666;background:#F8F8F8;border-bottom:2px solid #E8E8E8;white-space:nowrap;text-align:'+(al||'left')+(w?';width:'+w:'')+'">'+(t||'')+'</th>';};
  function pct(v,red){if(v===null||isNaN(v))return '<span style="color:#bbb">\u2014</span>';var c=v>=0?'#00A650':'#F23D4F';if(red)c=v>=0?'#F23D4F':'#00A650';return '<span style="color:'+c+';font-weight:700">'+(v>=0?'\u25b2+':'\u25bc')+Math.abs(v).toFixed(1)+'%</span>';}
  function atingColor(p){return p>=100?'#00A650':p>=80?'#E67E00':'#F23D4F';}

  // Dados por grupo \u2014 NMV = BT_UE_OUTPUT_MNG_MONTHLY_PH (mesma base Grid MeliPro)
  var MK25_TO_26={jan:'jan',feb:'feb',mar:'mar',apr:'apr',may:'may',jun:'jun',jul:'jul',aug:'aug',sep:'sep',oct:'oct',nov:'nov',dec:'dec'};
  var rows=GRUPOS.map(function(g){
    // Usar REAL_NMV_REL (filtrado F&H) ou REAL_MENSAL como fallback — evita inflação por outras verticais
    var nmvUE=(typeof REAL_NMV_REL!=='undefined'&&REAL_NMV_REL[g])?REAL_NMV_REL[g]:(REAL_MENSAL[g]||{});
    var nmv=PERIODO.reduce(function(s,k){return s+(nmvUE[k]||0);},0);
    if(!nmv) nmv=PERIODO.reduce(function(s,k){return s+((REAL_MENSAL[g]||{})[k]||0);},0);
    var si=PERIODO.reduce(function(s,k){return s+((REAL_SI[g]||{})[k]||0);},0);
    var inv=PERIODO.reduce(function(s,k){return s+((REAL_INV_TOT[g]||{})[k]||0);},0);
    var meta=mks.reduce(function(s,k){return s+((META_FIN[g]||{})[k]||0);},0);
    var ating=meta>0?nmv/meta*100:0;
    var invNmv=nmv>0?inv/nmv*100:0;
    // Cancelamentos
    var rep=REPUTACAO&&REPUTACAO[g]||{};
    var cancYTD=rep.canc_pct||0;
    // MoM / YoY \u2014 mesma metodologia de buildVGKPIs: taxa di\u00e1ria para MTD, total direto para m\u00eas fechado
    var MONTH_ORDER_SC=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    var focalMk=PERIODO.length===1?PERIODO[0]:cur;
    var focalIdx_sc=MONTH_ORDER_SC.indexOf(focalMk);
    var prevMk_sc=focalIdx_sc>0?MONTH_ORDER_SC[focalIdx_sc-1]:null;
    var isCurMTD_sc=(focalMk===cur);
    var nmvFocal=nmvUE[focalMk]||((REAL_MENSAL[g]||{})[focalMk]||0);
    if(PERIODO.length>1) nmvFocal=nmv; // YTD: use full period sum
    var nmvPrev_sc=prevMk_sc?(nmvUE[prevMk_sc]||((REAL_MENSAL[g]||{})[prevMk_sc]||0)):0;
    // YoY: usar REAL_NMV (BT_UE_OUTPUT) para AMBOS os anos — comparacao consistente
    var nmvUE_ly=typeof REAL_NMV!=='undefined'?(REAL_NMV[g]||{}):{};
    // NMV 2026 via BT_UE_OUTPUT (para YoY consistente com 2025)
    var nmvFocal_yoy=PERIODO.length===1?(nmvUE_ly[focalMk]||nmvFocal)
      :PERIODO.reduce(function(s,k){return s+(nmvUE_ly[k]||0);},0)||nmv;
    var nmv25_ue=PERIODO.length===1?(nmvUE_ly['25_'+focalMk]||nmvUE['25_'+focalMk]||0)
      :PERIODO.reduce(function(s,k){return s+(nmvUE_ly['25_'+k]||nmvUE['25_'+k]||0);},0);
    var g25=REAL_2025[g]||{};
    var nmv25_fallback=PERIODO.length===1?(g25[focalMk]?g25[focalMk].gmv:0)
      :PERIODO.reduce(function(s,k){return s+(g25[k]?g25[k].gmv:0);},0);
    var nmv25=nmv25_ue>0?nmv25_ue:nmv25_fallback;
    var mom=null,yoy=null;
    if(PERIODO.length===1){
      if(isCurMTD_sc){
        // MTD: taxa di\u00e1ria
        var dCur_sc=Math.max(DIA_MES,1);
        var dPrev_sc=prevMk_sc?(DIAS_MES_MAP[prevMk_sc]||30):30;
        var d25_sc=DIAS_MES_MAP[focalMk]||31;
        var rCur_sc=nmvFocal/dCur_sc,rPrev_sc=nmvPrev_sc>0?nmvPrev_sc/dPrev_sc:0,r25_sc=nmv25>0?nmv25/d25_sc:0;
        var rCur_yoy=nmvFocal_yoy/dCur_sc;
        if(rPrev_sc>0)mom=(rCur_sc-rPrev_sc)/rPrev_sc*100;
        if(r25_sc>0)yoy=(rCur_yoy-r25_sc)/r25_sc*100;
      } else {
        // M\u00eas fechado: compara\u00e7\u00e3o direta
        if(nmvPrev_sc>0)mom=(nmvFocal-nmvPrev_sc)/nmvPrev_sc*100;
        if(nmv25>0)yoy=(nmvFocal_yoy-nmv25)/nmv25*100;
      }
    } else {
      // Multi-meses: YoY via BT_UE_OUTPUT
      if(nmv25>0)yoy=(nmvFocal_yoy-nmv25)/nmv25*100;
    }
    var repLvl=rep.rep_level||'';
    return {g:g,nmv:nmv,si:si,inv:inv,invNmv:invNmv,meta:meta,ating:ating,canc:cancYTD,mom:mom,yoy:yoy,repLvl:repLvl};
  });

  // \u2500\u2500 TABLE 1: Performance por Grupo \u2500\u2500
  var perfRows=[].concat(rows).sort(function(a,b){return a.g.localeCompare(b.g);});
  var hdr1='<thead><tr>'+th('Nome')+th('Rep','center','50px')+th('NMV','right')+th('SI','right')+th('Invest','right')+th('Inv/NMV','right')+th('Meta Op','right')+th('% Ating','right')+'</tr></thead>';
  var bdy1='<tbody>'+perfRows.map(function(r,i){
    var bg=i%2===0?'#fff':'#FAFAFA';
    var ac=atingColor(r.ating);
    var repDot=r.repLvl==='GREEN'?'\ud83d\udfe2':r.repLvl==='YELLOW'?'\ud83d\udfe1':r.repLvl==='RED'?'\ud83d\udd34':'\u26aa';
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0" onmouseover="this.style.background=\'#FFFBEA\'" onmouseout="this.style.background=\''+bg+'\'">'
      +'<td style="padding:10px 12px;font-size:12px;font-weight:700;color:#1A1A1A">'+r.g+'</td>'
      +'<td style="padding:10px 12px;text-align:center;font-size:13px">'+repDot+'</td>'
      +'<td style="padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#1A1A1A">'+fmt(r.nmv)+'</td>'
      +'<td style="padding:10px 12px;text-align:right;font-size:12px;color:#444">'+fmtN(r.si)+'</td>'
      +'<td style="padding:10px 12px;text-align:right;font-size:12px;color:#444">'+fmt(r.inv)+'</td>'
      +'<td style="padding:10px 12px;text-align:right;font-size:12px;color:#555">'+r.invNmv.toFixed(1)+'%</td>'
      +'<td style="padding:10px 12px;text-align:right;font-size:12px;color:#555">'+fmtMeta(r.meta)+'</td>'
      +'<td style="padding:10px 12px;text-align:right;font-size:12px;font-weight:800;color:'+ac+'">'+r.ating.toFixed(1)+'%</td>'
      +'</tr>';
  }).join('')+'</tbody>';

  // \u2500\u2500 TABLE 2: Ranking de Grupos (MoM / YoY) \u2500\u2500
  var rankRows=[].concat(rows).sort(function(a,b){return b.nmv-a.nmv;});
  var hdr2='<thead><tr>'+th('#','center','32px')+th('Grupo')+th('NMV','right')+th('MoM','center')+th('YoY','center')+th('Meta Op','right')+th('% Ating','right')+'</tr></thead>';
  var bdy2='<tbody>'+rankRows.map(function(r,i){
    var bg=i%2===0?'#fff':'#FAFAFA';
    var ac=atingColor(r.ating);
    return '<tr style="background:'+bg+';border-bottom:1px solid #F0F0F0" onmouseover="this.style.background=\'#FFFBEA\'" onmouseout="this.style.background=\''+bg+'\'">'
      +'<td style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#999">'+(i+1)+'</td>'
      +'<td style="padding:10px 12px;font-size:12px;font-weight:600;color:#1A1A1A">'+r.g+'</td>'
      +'<td style="padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#1A1A1A">'+fmt(r.nmv)+'</td>'
      +'<td style="padding:10px 12px;text-align:center">'+pct(r.mom)+'</td>'
      +'<td style="padding:10px 12px;text-align:center">'+pct(r.yoy)+'</td>'
      +'<td style="padding:10px 12px;text-align:right;font-size:12px;color:#555">'+fmtMeta(r.meta)+'</td>'
      +'<td style="padding:10px 12px;text-align:right;font-size:12px;font-weight:800;color:'+ac+'">'+r.ating.toFixed(1)+'%</td>'
      +'</tr>';
  }).join('')+'</tbody>';

  var tStyle='width:100%;border-collapse:collapse;font-size:12px;background:#fff';
  var boxStyle='overflow-x:auto;border-radius:8px;border:1px solid #E8E8E8;box-shadow:0 1px 4px rgba(0,0,0,.06)';
  wrap.innerHTML=
    '<div style="font-size:13px;font-weight:800;color:#1A1A1A;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #FFE600">Performance por Grupo</div>'
    +'<div style="'+boxStyle+';margin-bottom:24px"><table style="'+tStyle+'">'+hdr1+bdy1+'</table></div>'
    +'<div style="font-size:13px;font-weight:800;color:#1A1A1A;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #FFE600">Ranking de Grupos (MoM / YoY)</div>'
    +'<div style="'+boxStyle+'"><table style="'+tStyle+'">'+hdr2+bdy2+'</table></div>';
}
