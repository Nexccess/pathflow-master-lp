"use strict";
(function(){
  const allowed={note:"article",facebook:"social",x:"social",hatena:"social",threads:"social",instagram:"social"};
  const params=new URLSearchParams(window.location.search);
  const source=(params.get("utm_source")||"").toLowerCase();
  const medium=(params.get("utm_medium")||"").toLowerCase();
  const campaign=params.get("utm_campaign")||"";
  const content=params.get("utm_content")||"";
  const valid=v=>/^[a-z0-9_-]{1,64}$/i.test(v);
  const properties={};
  if(Object.hasOwn(allowed,source)&&medium===allowed[source]&&valid(campaign)){
    properties.utm_source=source;
    properties.utm_medium=medium;
    properties.utm_campaign=campaign;
    if(valid(content))properties.utm_content=content;
  } else if(source==="facebook"&&medium==="paid_social"&&valid(campaign)){
    properties.utm_source=source;
    properties.utm_medium=medium;
    properties.utm_campaign=campaign;
    if(valid(content))properties.utm_content=content;
  }
  window.PathFlowAttribution={properties};
  document.addEventListener("DOMContentLoaded",()=>{
    if(!Object.keys(properties).length)return;
    document.querySelectorAll('a[href^="diagnosis/"]').forEach(a=>{
      const target=new URL(a.getAttribute("href"),location.href);
      Object.entries(properties).forEach(([k,v])=>target.searchParams.set(k,v));
      a.href=target.toString();
    });
  });
})();
