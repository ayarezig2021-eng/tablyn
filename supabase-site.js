/* Homepage contact form and real administrator data. */
(function () {
  const $ = id => document.getElementById(id);
  const say = msg => { if (typeof window.toast === 'function') window.toast(msg); else alert(msg); };
  const esc = v => String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  $('tablynContactForm')?.addEventListener('submit', async e => {
    e.preventDefault(); const status=$('contactStatus'); status.textContent='Sending…';
    try {
      await window.TablynData.sendContact({ name:$('contactName').value.trim(), email:$('contactEmail').value.trim(), subject:$('contactSubject').value.trim() || null, message:$('contactMessage').value.trim() });
      status.textContent='Your message has been sent. Thank you.'; $('tablynContactForm').reset();
    } catch (err) { status.textContent=err.message || 'Could not send your message.'; }
  });
  window.loadTablynAdmin = async function () {
    if (!window.tablynIsAdmin) return;
    try {
      const data=await window.TablynData.adminOverview();
      const stats=$('adminStats');
      if(stats){stats.replaceChildren();[['Orders',data.orders.length],['Pending quotes',data.quotes.filter(q=>q.status==='pending').length],['Saved designs',data.designs.length],['Contact messages',data.contacts.filter(c=>c.status==='new').length]].forEach(([label,value])=>{const box=document.createElement('div');box.className='rounded-xl border border-line bg-surface p-4';box.innerHTML=`<p class="text-sm text-muted">${label}</p><p class="mt-1 text-2xl font-bold">${value}</p>`;stats.appendChild(box);});}
      const kanban=$('kanban');
      if(kanban){kanban.replaceChildren();data.quotes.forEach(q=>{const el=document.createElement('article');el.className='rounded-xl border border-line bg-surface p-3';el.innerHTML=`<p class="font-semibold">Quote #${esc(q.id.slice(0,8))}</p><p class="text-sm">${esc(q.contact_name)} · ${esc(q.quantity)} items</p><p class="text-xs text-muted">${esc(q.contact_email)} · ${esc(q.status)}</p>`;kanban.appendChild(el);});data.orders.forEach(o=>{const el=document.createElement('article');el.className='rounded-xl border border-line bg-surface p-3';el.innerHTML=`<p class="font-semibold">Order #${esc(o.order_number)}</p><p class="text-sm">${esc(o.customer_name)} · ${esc(o.currency)} ${esc(o.total)}</p><p class="text-xs text-muted">${esc(o.status)}</p><div class="mt-2 flex flex-wrap gap-2"><select class="field text-xs" data-order-status="${esc(o.id)}"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="in_production">In production</option><option value="quality_check">Quality check</option><option value="ready">Ready</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select><button class="rounded-lg bg-indigo-600 px-3 py-1 text-xs text-white" data-update-order="${esc(o.id)}">Update status</button></div>`;kanban.appendChild(el);const select=el.querySelector('select');select.value=o.status;el.querySelector('button').addEventListener('click',async()=>{try{await window.TablynData.updateOrderStatus(o.id,select.value,'Status updated by Tablyn administrator');say('Order status updated and history recorded.');await window.loadTablynAdmin();}catch(err){say(err.message||'Could not update order status.');}});});}
      const logs=$('logList'); if(logs){logs.replaceChildren();data.contacts.forEach(m=>{const li=document.createElement('li');li.className='rounded-xl border border-line bg-surface p-3';li.innerHTML=`<p class="font-semibold">${esc(m.name)} · ${esc(m.email)}</p><p class="text-sm">${esc(m.subject||'No subject')}</p><p class="text-sm text-muted">${esc(m.message)}</p><p class="text-xs text-muted">${esc(m.status)} · ${new Date(m.created_at).toLocaleString()}</p>`;logs.appendChild(li);});}
    } catch(err){ console.error('[Tablyn] Admin data load failed:',err); say(err.message || 'Could not load administrator data.'); }
  };
  window.renderAdmin = function(){ if(window.tablynIsAdmin) window.loadTablynAdmin(); };
})();
