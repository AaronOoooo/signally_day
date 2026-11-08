(() => {
  'use strict';
  const themes = [
    {id:'sunset-drive',name:'Sunset Drive',description:'Warm coral and evening light',colors:['#201824','#382537','#FF9966','#FFF4E9']},
    {id:'midnight-signal',name:'Midnight Signal',description:'The familiar Signally blue',colors:['#0C1729','#1D3048','#56B6FF','#F4F8FF']},
    {id:'electric-lounge',name:'Electric Lounge',description:'Deep violet and electric lilac',colors:['#151226','#292143','#B68CFF','#F7F0FF']},
    {id:'emerald-city',name:'Emerald City',description:'Forest green and soft mint',colors:['#0B1C1A','#183731','#69D8A2','#F1FFF7']},
    {id:'golden-hour',name:'Golden Hour',description:'Gold on modern charcoal',colors:['#191B20','#313034','#F2C66D','#FFF9E9']},
    {id:'daybreak',name:'Daybreak',description:'Light, bright, and relaxed',colors:['#EAF1F6','#FFFFFF','#2879C9','#172940']}
  ];
  const storageKey = 'signallyDay.theme';
  const dialog = document.getElementById('themeDialog');
  const options = document.getElementById('themeOptions');
  const open = document.getElementById('openThemes');
  const close = document.getElementById('closeThemes');
  if (!dialog || !options || !open || !close) return;
  const allowed = new Set(themes.map(t => t.id));
  const current = () => allowed.has(document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : 'sunset-drive';
  function draw() {
    options.replaceChildren();
    for (const theme of themes) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'theme-option';
      button.dataset.themeId = theme.id;
      button.setAttribute('aria-pressed', String(current() === theme.id));
      const swatches = document.createElement('span');
      swatches.className = 'theme-swatches';
      swatches.setAttribute('aria-hidden','true');
      for (const color of theme.colors) {
        const swatch = document.createElement('span');
        swatch.style.backgroundColor = color;
        swatches.appendChild(swatch);
      }
      const label = document.createElement('span'); label.className = 'theme-option-copy';
      const name = document.createElement('strong'); name.textContent = theme.name;
      const description = document.createElement('small'); description.textContent = theme.description;
      label.append(name,description);
      const tick = document.createElement('span'); tick.className = 'theme-selected'; tick.textContent = '✓'; tick.setAttribute('aria-hidden','true');
      button.append(swatches,label,tick);
      button.addEventListener('click',()=>apply(theme.id));
      options.appendChild(button);
    }
  }
  function apply(id) {
    if (!allowed.has(id)) return;
    document.documentElement.dataset.theme = id;
    try { localStorage.setItem(storageKey,id); } catch (_) { /* storage may be disabled */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    for (const button of options.querySelectorAll('.theme-option')) button.setAttribute('aria-pressed',String(button.dataset.themeId === id));
  }
  open.addEventListener('click',()=>{draw();dialog.showModal();});
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog) dialog.close();});
  apply(current());
})();
