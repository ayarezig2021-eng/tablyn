/* Loads the signed-in user's own saved designs into the Studio editor. */
(function(){
 const $=id=>document.getElementById(id);let designs=[];
 const picker=$('savedDesignPicker');if(!picker)return;
 const fontCss={'Modern':'Arial, sans-serif','Elegant serif':'Georgia, serif','Friendly':'Trebuchet MS, sans-serif','Minimal':'monospace'};
 async function refresh(){
  if(!window.tablynAuthState?.user){picker.innerHTML='<option value="">Sign in to see saved designs</option>';return;}
  try{designs=await window.TablynData.listDesigns();picker.innerHTML='<option value="">Choose a saved design…</option>'+designs.map(d=>`<option value="${d.id}">${String(d.design_name||d.brand_name).replace(/[&<>\"']/g,'')}</option>`).join('');}
  catch(e){picker.innerHTML='<option value="">Could not load saved designs</option>';console.error(e);}
 }
 picker.addEventListener('change',()=>{
  const d=designs.find(x=>x.id===picker.value);if(!d)return;
  const set=(id,v)=>{const el=$(id);if(el&&v!==null&&v!==undefined)el.value=v;};
  set('product',d.product_type);set('shape',d.shape);set('material',d.material);set('brandname',d.brand_name);set('subtitle',d.subtitle);set('bg',d.background_color);set('fg',d.text_color);
  const font=d.design_data?.font||fontCss[d.font_style]||fontCss.Modern;set('font',font);
  localStorage.setItem('tablynStudioDesignId',d.id);window.tablynStudioDesignId=d.id;
  if(typeof render==='function')render();
  const toast=$('toast');if(toast){toast.textContent='Saved design loaded. You can edit and save your changes.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2300);}
 });
 window.addEventListener('tablyn:auth-changed',refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
})();
