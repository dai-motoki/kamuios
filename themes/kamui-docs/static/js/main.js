// テーマ（黒/白）切替
const themeDarkBtn = document.getElementById('themeDark');
const themeLightBtn = document.getElementById('themeLight');
function applyTheme(theme) {
  const mode = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('theme', mode);
  themeDarkBtn.classList.toggle('active', mode === 'dark');
  themeLightBtn.classList.toggle('active', mode === 'light');
}
const savedTheme = localStorage.getItem('theme');
const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
applyTheme(savedTheme || (prefersLight ? 'light' : 'dark'));
themeDarkBtn.addEventListener('click', () => applyTheme('dark'));
themeLightBtn.addEventListener('click', () => applyTheme('light'));

// 目次（TOC）動的生成 + スクロール
function buildToc(){
  const tocList = document.getElementById('tocList');
  if (!tocList) return [];
  tocList.innerHTML = '';
  const sections = Array.from(document.querySelectorAll('.doc-section'))
    // ダッシュボードの配下セクションはTOCから除外（重複回避）
    .filter(sec => sec.id !== 'saas-applications-overview')
    // 特定の要件定義書は 2-1 の配下にサブ項目として表示するため、トップレベルからは除外
    .filter(sec => !['requirements-kamui-os','requirements-kamui-os-npm','requirements-sns-marketing','requirements-neko-cafe'].includes(sec.id));
  const groups = new Map(); // catValue -> { name, items: [{id,title}] }
  // ダッシュボードカテゴリを追加
  groups.set(1, { name: 'ダッシュボード', items: [] });
  sections.forEach(sec => {
    const catVal = Number(sec.dataset.cat || '0');
    const catName = sec.dataset.catName || 'その他';
    const id = sec.id ? `#${sec.id}` : '';
    const h2 = sec.querySelector('h2');
    const isPrivate = sec.dataset.isPrivate === 'true';
    let title = h2 ? (h2.innerText || h2.textContent || id) : id;
    title = title.replace(/^\s*\d+[.\-]\s*/, '');
    // private_ファイルの場合は鍵アイコンを追加（既にHTMLで追加されている場合は重複を避ける）
    if (isPrivate && !title.includes('🔒')) {
      title = `🔒 ${title}`;
    }
    // ダッシュボード項目は除外
    if (id === '#saas-applications-overview') return;
    // 章1（ダッシュボード）配下の項目もTOCに含める
    // if (catVal === 1) return;
    if (!groups.has(catVal)) groups.set(catVal, { name: catName, items: [] });
    // 重複IDを除外
    const grp = groups.get(catVal);
    if (!grp.items.some(it => it.id === id)) {
      grp.items.push({ id, title });
    }
  });
  // 章1に「メインダッシュボード」を先頭として明示追加
  if (groups.has(1)) {
    const g1 = groups.get(1);
    if (!g1.items.some(it => it.id === '#saas-applications-overview')) {
      g1.items.unshift({ id: '#saas-applications-overview', title: 'メインダッシュボード' });
    }
  }
  const sortedCats = Array.from(groups.keys()).sort((a,b)=>a-b);
  sortedCats.forEach((catValue, catIdx) => {
    const cat = groups.get(catValue);
    // 章名の補正: 1は常に「ダッシュボード」にする
    const catNo = catIdx + 1;
    const catItem = document.createElement('div');
    catItem.className = 'tree-item';
    const catLabel = document.createElement('div');
    catLabel.className = 'tree-label category';
    const toggle = document.createElement('span');
    toggle.className = 'tree-toggle';
    toggle.textContent = '▶';
    const name = document.createElement('span');
    name.className = 'tree-name';
    name.textContent = `${catNo}. ${cat.name}`;
    catLabel.appendChild(toggle);
    catLabel.appendChild(name);
    const children = document.createElement('div');
    children.className = 'tree-children';
    cat.items.forEach((it, i) => {
      const item = document.createElement('div');
      item.className = 'tree-item';
      const label = document.createElement('div');
      label.className = 'tree-label';
      label.setAttribute('data-target', it.id);
      const nm = document.createElement('span');
      nm.className = 'tree-name';
      nm.textContent = `${catNo}-${i+1}. ${it.title}`;
      label.appendChild(nm);
      item.appendChild(label);
      children.appendChild(item);

      // 特別: 2-1 要件定義書の配下にサブ項目（KAMUI CODE/KAMUI OS）を追加
      if (it.id === '#requirements-document') {
        const sub = document.createElement('div');
        sub.className = 'tree-children';
        const subItems = [
          { id: '#requirements-document',        title: 'KAMUI CODE 要件定義書',            openBody: true },
          { id: '#requirements-kamui-os',       title: 'KAMUI OS 要件定義書',              openBody: true },
          { id: '#requirements-kamui-os-npm',   title: 'KAMUI OS NPM 要件定義書',          openBody: true },
          { id: '#requirements-sns-marketing',  title: 'SNSマーケティング ダッシュボード要件', openBody: true },
          { id: '#requirements-neko-cafe',      title: 'ネコカフェ 要件定義書',              openBody: true }
        ];
        // 折りたたみトグル（2-1 の子を開閉）
        const subToggle = document.createElement('span');
        subToggle.className = 'tree-toggle';
        subToggle.textContent = '▶';
        // ラベル先頭にトグルを差し込む
        label.insertBefore(subToggle, label.firstChild);
        subToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          sub.classList.toggle('expanded');
          subToggle.classList.toggle('expanded');
          subToggle.textContent = sub.classList.contains('expanded') ? '▼' : '▶';
        });
        subItems.forEach((sit, si) => {
          const sItem = document.createElement('div');
          sItem.className = 'tree-item';
          const sLabel = document.createElement('div');
          sLabel.className = 'tree-label';
          sLabel.setAttribute('data-target', sit.id);
          sLabel.setAttribute('data-open-body', sit.openBody ? 'true' : 'false');
          const sName = document.createElement('span');
          sName.className = 'tree-name';
          sName.textContent = `${catNo}-${i+1}-${si+1}. ${sit.title}`;
          sLabel.appendChild(sName);
          sItem.appendChild(sLabel);
          sub.appendChild(sItem);
        });
        item.appendChild(sub);
      }
    });
    // カテゴリラベルのトグル処理はビルド後に一括で付与（重複防止）
    catItem.appendChild(catLabel);
    catItem.appendChild(children);
    tocList.appendChild(catItem);
  });
  // ダッシュボードカテゴリにも子要素を表示する
  // const firstCat = tocList.querySelector('.tree-label.category');
  // if (firstCat && firstCat.nextElementSibling) {
  //   firstCat.nextElementSibling.innerHTML = '';
  // }
  return Array.from(tocList.querySelectorAll('.tree-label[data-target]'));
}

// 本文を目次の順番に並べ替え、見出しを X-Y に採番
function reorderBodySectionsToMatchToc(){
  const container = document.getElementById('docContainer');
  if (!container) return [];
  const secNodes = new Map();
  document.querySelectorAll('.doc-section').forEach(sec => {
    if (sec.id) secNodes.set(`#${sec.id}`, sec);
  });
  const orderedIds = [];
  const seen = new Set();
  document.querySelectorAll('#tocList .tree-label[data-target]').forEach(l => {
    const id = l.getAttribute('data-target');
    if (id && !seen.has(id)) { seen.add(id); orderedIds.push(id); }
  });
  const frag = document.createDocumentFragment();
  // 先頭にダッシュボードを固定配置
  const dash = secNodes.get('#saas-applications-overview');
  if (dash) frag.appendChild(dash);
  orderedIds.forEach(id => {
    const node = secNodes.get(id);
    if (node) frag.appendChild(node);
  });
  container.appendChild(frag);
  return orderedIds;
}

function renumberBodyHeadingsByOrder(orderedIds){
  const secById = new Map();
  document.querySelectorAll('.doc-section').forEach(sec => {
    if (sec.id) secById.set(`#${sec.id}`, sec);
  });
  const catOrder = new Map();
  const catCounters = new Map();
  let catNoSeq = 0;
  orderedIds.forEach(id => {
    const sec = secById.get(id);
    if (!sec) return;
    const catVal = String(sec.dataset.cat || '0');
    if (!catOrder.has(catVal)) {
      catOrder.set(catVal, ++catNoSeq);
      catCounters.set(catVal, 0);
    }
    const h2 = sec.querySelector('h2');
    if (!h2) return;
    const raw = h2.innerText || h2.textContent || '';
    const base = raw.replace(/^\s*\d+[.\-]\s*/, '');
    const x = catOrder.get(catVal);
    const y = (catCounters.get(catVal) || 0) + 1;
    catCounters.set(catVal, y);
    h2.textContent = `${x}-${y}. ${base}`;
  });
}

const tocRoot = document.getElementById('folderTree');
// TOCを構築 → 本文をTOC順に並べ替え → 見出し採番
let itemLabels = buildToc();
const orderedIds = reorderBodySectionsToMatchToc();
renumberBodyHeadingsByOrder(orderedIds);
const sectionCount = document.getElementById('sectionCount');
sectionCount.textContent = itemLabels.length;

// クリックで本文へスクロール（項目のみ）
itemLabels.forEach(l => {
  l.addEventListener('click', (e) => {
    e.stopPropagation();
    const target = l.getAttribute('data-target');
    const openBody = l.getAttribute('data-open-body') === 'true';
    if (target) {
      // 擬似遷移: すべて非表示にして対象のみ表示 + URLハッシュ更新
      if (target.startsWith('#saas-')) {
        const appId = target.replace('#saas-', '');
        if (window.showSaasApp) {
          window.showSaasApp(appId);
        }
        return;
      } else if (target.startsWith('#requirements-')) {
        // 要件定義書の場合も特別処理
        const docId = target.replace('#requirements-', '');
        if (window.showRequirements) {
          window.showRequirements(docId);
          if (openBody) {
            setTimeout(() => {
              const secId = 'requirements-' + docId; // 'document' or 'kamui-os'
              const card = document.getElementById('requirementsDocCard-' + secId);
              const body = document.getElementById('requirementsDocBody-' + secId);
              if (card && body) { card.style.display = 'none'; body.style.display = 'block'; window.scrollTo(0, 0); }
            }, 0);
          }
        }
        return;
      } else if (target === '#biz-strategy' || target === '#biz-finance' || target === '#prompts-repo') {
        if (window.showSectionById) {
          window.showSectionById(target.substring(1));
          return;
        }
      } else if (target === '#ui-views') {
        // UIビュー一覧の場合も特別処理
        if (window.showRequirements) {
          window.showRequirements('views');
        }
        return;
      } else if (target === '#slide-generator') {
        // スライドエディタの場合も特別処理
        if (window.showBusinessTool) {
          window.showBusinessTool('slide-generator');
        }
        return;
      } else {
        // 通常のセクションへのスクロール
        const node = document.querySelector(target);
        if (node) {
          document.querySelectorAll('.doc-section').forEach(section => { section.style.display = 'none'; });
          node.style.display = 'block';
          window.history.pushState({ direct: target.substring(1) }, '', target);
          window.scrollTo(0, 0);
        }
      }
      // モバイル時はサイドバーを閉じる
      if (window.matchMedia('(max-width: 768px)').matches) {
        const sb = document.getElementById('sidebar');
        const bd = document.getElementById('sidebarBackdrop');
        sb?.classList.remove('open');
        bd?.classList.remove('show');
      }
    }
  });
});

// 大分類の展開/折りたたみ
tocRoot.querySelectorAll('.tree-label.category').forEach(cat => {
  const toggle = cat.querySelector('.tree-toggle');
  const children = cat.nextElementSibling;
  cat.addEventListener('click', (e) => {
    e.stopPropagation();
    if (children) children.classList.toggle('expanded');
    if (toggle) {
      toggle.classList.toggle('expanded');
      toggle.textContent = children && children.classList.contains('expanded') ? '▼' : '▶';
    }
    cat.classList.toggle('selected');
  });
});

// ルートの折りたたみ
const root = document.querySelector('[data-toggle="root"]');
const rootChildren = document.querySelector('.tree-children');
const rootToggle = root.querySelector('.tree-toggle');
root.addEventListener('click', () => {
  rootChildren.classList.toggle('expanded');
  rootToggle.classList.toggle('expanded');
  rootToggle.textContent = rootChildren.classList.contains('expanded') ? '▼' : '▶';
  root.classList.toggle('selected');
});

// クイックリンク
document.querySelectorAll('.tag').forEach(tag => {
  tag.addEventListener('click', () => {
    const sel = tag.getAttribute('data-jump');
    if (!sel) return;
    
    // SaaSアプリケーションの場合は特別処理
    if (sel.startsWith('#saas-')) {
      const appId = sel.replace('#saas-', '');
      if (window.showSaasApp) {
        window.showSaasApp(appId);
      }
      return;
    } else if (sel.startsWith('#requirements-')) {
      // 要件定義書の場合も特別処理
      const docId = sel.replace('#requirements-', '');
      if (window.showRequirements) {
        window.showRequirements(docId);
      }
      return;
    } else if (sel === '#biz-strategy' || sel === '#biz-finance' || sel === '#prompts-repo') {
      if (window.showSectionById) { window.showSectionById(sel.substring(1)); }
      return;
    } else if (sel === '#ui-views') {
      // UIビュー一覧の場合も特別処理
      if (window.showRequirements) {
        window.showRequirements('views');
      }
      return;
    } else if (sel === '#slide-generator') {
      // スライドエディタの場合も特別処理
      if (window.showBusinessTool) {
        window.showBusinessTool('slide-generator');
      }
      return;
    } else {
      // 通常セクションの擬似遷移
      const node = document.querySelector(sel);
      if (node) {
        document.querySelectorAll('.doc-section').forEach(section => { section.style.display = 'none'; });
        node.style.display = 'block';
        window.history.pushState({ direct: sel.substring(1) }, '', sel);
        window.scrollTo(0, 0);
      }
    }
    
    document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
  });
});

// サイドバー開閉（モバイル）
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('sidebarBackdrop');
const toggleBtn = document.getElementById('toggleSidebar');
function closeSidebar(){ sidebar?.classList.remove('open'); backdrop?.classList.remove('show'); }
function openSidebar(){ sidebar?.classList.add('open'); backdrop?.classList.add('show'); }
toggleBtn?.addEventListener('click', () => {
  if (!sidebar) return;
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});
backdrop?.addEventListener('click', closeSidebar);

// ユーティリティ関数
function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m])); }
function escapeAttr(s){ return String(s||'').replace(/["<>\n\r]/g,''); }

// 検索（タイトルと本文中テキストを対象）
const searchInput = document.getElementById('searchInput');
// 単純な部分一致での強調（正規表現は使わず安全に）
function highlightTextNode(node, q){
  const text = node.nodeValue || '';
  const query = q.toLowerCase();
  const lower = text.toLowerCase();
  let pos = 0;
  let idx = lower.indexOf(query, pos);
  if (idx === -1) return;
  const frag = document.createDocumentFragment();
  while (idx !== -1){
    const before = text.slice(pos, idx);
    if (before) frag.appendChild(document.createTextNode(before));
    const mark = document.createElement('mark');
    mark.className = 'hl';
    mark.textContent = text.slice(idx, idx + q.length);
    frag.appendChild(mark);
    pos = idx + q.length;
    idx = lower.indexOf(query, pos);
  }
  const after = text.slice(pos);
  if (after) frag.appendChild(document.createTextNode(after));
  node.parentNode && node.parentNode.replaceChild(frag, node);
}
function clearHighlights(root){
  root.querySelectorAll('mark.hl').forEach(m => {
    const text = document.createTextNode(m.textContent || '');
    m.parentNode && m.parentNode.replaceChild(text, m);
  });
}
function highlightInElements(elements, q){
  if (!q) return;
  elements.forEach(el => {
    clearHighlights(el);
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue){
        highlightTextNode(node, q);
      }
    });
  });
}

// モーダル関数
function openJsonModal(content, title){
  const modal = document.getElementById('jsonModal');
  const pre = document.getElementById('jsonContent');
  const ttl = document.getElementById('jsonModalTitle');
  const closeBtn = document.getElementById('jsonCloseBtn');
  const copyBtn = document.getElementById('jsonCopyBtn');
  if (!modal || !pre || !ttl) return;
  pre.textContent = content;
  ttl.textContent = title || 'JSONプレビュー';
  modal.classList.add('active');
  closeBtn?.addEventListener('click', () => modal.classList.remove('active'), { once: true });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); }, { once: true });
  copyBtn?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(content); alert('クリップボードにコピーしました。'); } catch(e) { alert('コピーできませんでした。'); }
  }, { once: true });
}

function openImgModal(src, title){
  const modal = document.getElementById('imgModal');
  const img = document.getElementById('imgModalImage');
  const ttl = document.getElementById('imgModalTitle');
  const closeBtn = document.getElementById('imgCloseBtn');
  if (!modal || !img || !ttl) return;
  img.setAttribute('src', src);
  ttl.textContent = title || '画像プレビュー';
  modal.classList.add('active');
  closeBtn?.addEventListener('click', () => modal.classList.remove('active'), { once: true });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); }, { once: true });
}

// グローバルに公開
window.openJsonModal = openJsonModal;
window.openImgModal = openImgModal;

// 要素情報の収集（簡易 Inspector）
function cssPath(el){
  if (!el || el.nodeType !== 1) return '';
  if (el.id) return `#${el.id}`;
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1 && node !== document.body){
    let sel = node.nodeName.toLowerCase();
    if (node.classList && node.classList.length){
      const c = Array.from(node.classList).slice(0,3).join('.');
      if (c) sel += `.${c}`;
    }
    const parent = node.parentElement;
    if (parent){
      const siblings = Array.from(parent.children).filter(n => n.nodeName === node.nodeName);
      if (siblings.length > 1){
        const idx = siblings.indexOf(node) + 1;
        sel += `:nth-of-type(${idx})`;
      }
    }
    parts.unshift(sel);
    node = node.parentElement;
  }
  return parts.join(' > ');
}

function pickAttrs(el){
  const obj = {};
  if (!el || !el.attributes) return obj;
  Array.from(el.attributes).forEach(a => { obj[a.name] = a.value; });
  return obj;
}

function nearestSection(el){
  const sec = el.closest('.doc-section');
  if (!sec) return null;
  const h2 = sec.querySelector('h2');
  return { id: sec.id || '', category: sec.dataset.cat || '', category_name: sec.dataset.catName || '', title: h2 ? (h2.innerText||'').trim() : '' };
}

function collectElementInfo(el){
  const rect = el.getBoundingClientRect();
  const styles = window.getComputedStyle(el);
  const styleKeys = ['display','position','zIndex','color','backgroundColor','fontSize','fontWeight','margin','padding','border','borderRadius'];
  const styleObj = {};
  styleKeys.forEach(k => { styleObj[k] = styles[k]; });
  const info = {
    page: { url: location.href, title: document.title, hash: location.hash },
    section: nearestSection(el),
    selector: cssPath(el),
    element: {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      classes: Array.from(el.classList||[]),
      attributes: pickAttrs(el),
      dataset: { ...el.dataset },
      text: (el.textContent||'').trim().slice(0, 240)
    },
    box: {
      width: Math.round(rect.width), height: Math.round(rect.height),
      top: Math.round(rect.top + window.scrollY), left: Math.round(rect.left + window.scrollX)
    },
    computed: styleObj,
    time: new Date().toISOString()
  };
  return info;
}

// Alt(Option) + 右クリックで要素情報を取得
document.addEventListener('contextmenu', (e) => {
  try {
    // DevTools ON のときだけ発火
    if (!window.__devToolsActive) return; // 通常のコンテキストメニューを維持
    // 右クリックで発火（特定ターゲットのみ）
    const target = e.target.closest('.saas-app-card, .card, .tree-label, .req-section, .doc-section, [data-path], [class]');
    if (!target) return; // 対象外は通常のコンテキストメニュー
    e.preventDefault();
    // 一時ハイライト
    const prevOutline = target.style.outline;
    const prevOffset = target.style.outlineOffset;
    target.style.outline = '2px solid #4a9eff';
    target.style.outlineOffset = '2px';
    setTimeout(() => { target.style.outline = prevOutline; target.style.outlineOffset = prevOffset; }, 1200);
    const json = JSON.stringify(collectElementInfo(target), null, 2);
    openJsonModal(json, 'Inspector');
    // 自動コピー
    (async () => {
      try {
        await navigator.clipboard.writeText(json);
        const btn = document.getElementById('jsonCopyBtn');
        if (btn) {
          const org = btn.textContent;
          btn.textContent = 'コピー済み';
          setTimeout(() => { btn.textContent = org || 'コピー'; }, 1500);
        }
      } catch(err) {
        try {
          const ta = document.createElement('textarea');
          ta.value = json; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta);
        } catch(e) { console.warn('Auto-copy failed'); }
      }
    })();
  } catch(err) { console.error('Inspector failed', err); }
});

// DevTools hover-inspector (button toggle)
(function(){
  const btn = document.getElementById('devToolsBtn');
  if (!btn) return;
  let active = false;
  let overlay, tip;
  function ensureNodes(){
    if (!overlay){ overlay = document.createElement('div'); overlay.className = 'inspect-overlay'; overlay.style.display='none'; document.body.appendChild(overlay); }
    if (!tip){ tip = document.createElement('div'); tip.className = 'inspect-tip'; tip.style.display='none'; document.body.appendChild(tip); }
  }
  function fmtSel(el){
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls = el.classList?.length ? '.'+Array.from(el.classList).slice(0,2).join('.') : '';
    return `${tag}${id}${cls}`;
  }
  function moveOverlay(target, x, y){
    const rect = target.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    tip.style.display = 'block';
    const comp = window.getComputedStyle(target);
    const color = comp.color; const font = comp.font; const margin = comp.margin;
    tip.innerHTML = `
      <span class="t-path">${fmtSel(target)} <span class="t-mono">${rect.width.toFixed(0)}×${rect.height.toFixed(0)}</span></span>
      <div>Color <span class="t-mono">${color}</span></div>
      <div>Font <span class="t-mono">${font}</span></div>
      <div>Margin <span class="t-mono">${margin}</span></div>
    `;
    const tipW = Math.min(360, Math.max(220, tip.offsetWidth||240));
    let tx = x + 12, ty = y + 12;
    if (tx + tipW > window.innerWidth - 20) tx = x - tipW - 12;
    if (ty + 140 > window.innerHeight - 10) ty = y - 150;
    tip.style.left = `${Math.max(10, tx)}px`;
    tip.style.top = `${Math.max(10, ty)}px`;
  }
  function openInfo(target){
    const json = JSON.stringify(collectElementInfo(target), null, 2);
    openJsonModal(json, 'Inspector');
    (async()=>{ try{ await navigator.clipboard.writeText(json);}catch(_){}})();
  }
  function onMove(e){
    const node = document.elementFromPoint(e.clientX, e.clientY);
    if (!node || node === overlay || tip.contains(node)) return;
    const target = node.closest('body *');
    if (!target) return;
    moveOverlay(target, e.clientX, e.clientY);
  }
  function onClick(e){
    e.preventDefault(); e.stopPropagation();
    const node = document.elementFromPoint(e.clientX, e.clientY);
    if (!node || node === overlay || tip.contains(node)) return;
    const target = node.closest('body *');
    if (!target) return;
    openInfo(target);
  }
  function enable(){ ensureNodes(); active = true; window.__devToolsActive = true; document.body.classList.add('inspect-active'); overlay.style.display='block'; tip.style.display='block'; btn.textContent = 'DevTools: ON'; document.addEventListener('mousemove', onMove, true); document.addEventListener('click', onClick, true); }
  function disable(){ active = false; window.__devToolsActive = false; document.body.classList.remove('inspect-active'); if (overlay) overlay.style.display='none'; if (tip) tip.style.display='none'; btn.textContent = 'DevTools'; document.removeEventListener('mousemove', onMove, true); document.removeEventListener('click', onClick, true); }
  btn.addEventListener('click', () => { active ? disable() : enable(); });
  document.addEventListener('keydown', (e) => { if (active && e.key === 'Escape') disable(); });
})();

// UI遷移図の初期化
function initUIFlow() {
  const nodes = [
    { id: 'welcome', x: 100, y: 100, title: 'Welcome画面', img: '/images/kamui-white-1.png' },
    { id: 'catalog', x: 400, y: 100, title: 'Catalogページ', img: '/images/kamui-white-2.png' },
    { id: 'playlist', x: 700, y: 100, title: 'Playlistページ', img: '/images/kamui-white-3.png' },
    { id: 'docs', x: 400, y: 300, title: 'Document画面', img: '/images/kamui-white-4.png' },
    { id: 'api', x: 700, y: 300, title: 'API実行画面', img: '/images/kamui-white-5.png' }
  ];
  
  const edges = [
    { from: 'welcome', to: 'catalog', label: 'Catalog選択' },
    { from: 'welcome', to: 'playlist', label: 'Playlist選択' },
    { from: 'catalog', to: 'docs', label: 'ドキュメント参照' },
    { from: 'playlist', to: 'api', label: 'API実行' },
    { from: 'docs', to: 'api', label: 'Try it' }
  ];
  
  const flowNodes = document.getElementById('flowNodes');
  const flowSvg = document.getElementById('flowSvg');
  const flowInner = document.getElementById('flowInner');
  const flowViewport = document.getElementById('flowViewport');
  
  if (!flowNodes || !flowSvg) return;
  
  // ノードを配置
  nodes.forEach(node => {
    const div = document.createElement('div');
    div.className = 'flow-node';
    div.id = `node-${node.id}`;
    div.style.left = `${node.x}px`;
    div.style.top = `${node.y}px`;
    div.innerHTML = `
      <img src="${node.img}" alt="${node.title}">
      <div class="title">${node.title}</div>
    `;
    flowNodes.appendChild(div);
  });
  
  // エッジ（矢印）を描画
  const svgNS = 'http://www.w3.org/2000/svg';
  edges.forEach((edge, i) => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return;
    
    const x1 = fromNode.x + 110;
    const y1 = fromNode.y + 90;
    const x2 = toNode.x + 110;
    const y2 = toNode.y + 90;
    
    const path = document.createElementNS(svgNS, 'path');
    const d = `M ${x1} ${y1} L ${x2} ${y2}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#4a9eff');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');
    flowSvg.appendChild(path);
    
    // ラベル
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', midX);
    text.setAttribute('y', midY - 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'flow-label');
    text.textContent = edge.label;
    flowSvg.appendChild(text);
  });
  
  // 矢印マーカー定義
  const defs = document.createElementNS(svgNS, 'defs');
  const marker = document.createElementNS(svgNS, 'marker');
  marker.setAttribute('id', 'arrowhead');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '7');
  marker.setAttribute('refX', '10');
  marker.setAttribute('refY', '3.5');
  marker.setAttribute('orient', 'auto');
  const polygon = document.createElementNS(svgNS, 'polygon');
  polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
  polygon.setAttribute('fill', '#4a9eff');
  marker.appendChild(polygon);
  defs.appendChild(marker);
  flowSvg.appendChild(defs);
  
  // ズーム機能
  let scale = 1;
  const zoomIn = document.getElementById('flowZoomIn');
  const zoomOut = document.getElementById('flowZoomOut');
  const zoomReset = document.getElementById('flowZoomReset');
  
  function applyZoom(newScale) {
    scale = Math.max(0.5, Math.min(2, newScale));
    flowInner.style.transform = `scale(${scale})`;
  }
  
  zoomIn?.addEventListener('click', () => applyZoom(scale + 0.1));
  zoomOut?.addEventListener('click', () => applyZoom(scale - 0.1));
  zoomReset?.addEventListener('click', () => applyZoom(1));
}

// MCP プレイリスト/カタログ 表示
(async function initMcpSection(){
  const state = { top: 'playlist', cat: 'creative' };
  const btnTop = {
    playlist: document.getElementById('btnMcpPlaylist'),
    catalog: document.getElementById('btnMcpCatalog')
  };
  const btnCat = {
    creative: document.getElementById('btnCatCreative'),
    development: document.getElementById('btnCatDevelopment'),
    business: document.getElementById('btnCatBusiness')
  };
  const table = document.getElementById('mcpTable');
  const thead = table?.querySelector('thead');
  const tbody = table?.querySelector('tbody');
  const msg = document.getElementById('mcpMessage');

  function setActive(){
    Object.values(btnTop).forEach(b=>b?.classList.remove('active'));
    Object.values(btnCat).forEach(b=>b?.classList.remove('active'));
    btnTop[state.top]?.classList.add('active');
    btnCat[state.cat]?.classList.add('active');
  }

  async function loadJson(url, inlineId, fallbackArray){
    let items = [];
    if (location.protocol !== 'file:') {
      try { const res = await fetch(url, { cache: 'no-cache' }); if (res.ok) items = await res.json(); } catch(_) {}
    }
    if (!Array.isArray(items) || items.length===0) {
      const inline = document.getElementById(inlineId);
      if (inline && !inline.textContent && fallbackArray) inline.textContent = JSON.stringify(fallbackArray, null, 2);
      try { items = JSON.parse(document.getElementById(inlineId)?.textContent || '[]'); } catch(_) {}
    }
    return Array.isArray(items)? items: [];
  }

  const playlists = await loadJson('./data/mcp_playlists.json', 'mcpPlaylistsInline', [
    { category:'creative', name:'Creative Base', url:'https://example.com/mcp/creative.json', format:'json', description:'クリエイティブ向けMCPサーバーのプレイリスト' }
  ]);
  const catalogs = await loadJson('./data/mcp_catalog.json', 'mcpCatalogInline', [
    { category:'creative', title:'Creative Servers', url:'https://docs.example.com/catalog/creative', description:'クリエイティブ領域のMCPサーバーカタログ' }
  ]);

  function render(){
    if (!thead || !tbody) return;
    setActive();
    const cat = state.cat;
    if (state.top === 'playlist') {
      thead.innerHTML = `<tr><th>名前</th><th>URL</th><th>形式</th><th>説明</th></tr>`;
      const filtered = playlists.filter(x=>x.category===cat);
      const rows = filtered.map(x=> `
        <tr>
          <td>${escapeHtml(x.name||'')}</td>
          <td><a href="${escapeAttr(x.url||'')}" target="_blank" rel="noopener">${escapeHtml(x.url||'')}</a></td>
          <td><code>${escapeHtml(x.format||'')}</code></td>
          <td>${escapeHtml(x.description||'')}</td>
        </tr>`).join('');
      tbody.innerHTML = rows || `<tr><td colspan="4">該当するプレイリストがありません。</td></tr>`;
      if (msg) msg.textContent = 'MCPプレイリスト（カテゴリ別）';
    } else {
      thead.innerHTML = `<tr><th>ページ</th><th>URL</th><th>説明</th></tr>`;
      const filtered = catalogs.filter(x=>x.category===cat);
      const rows = filtered.map(x=> `
        <tr>
          <td>${escapeHtml(x.title||'')}</td>
          <td><a href="${escapeAttr(x.url||'')}" target="_blank" rel="noopener">${escapeHtml(x.url||'')}</a></td>
          <td>${escapeHtml(x.description||'')}</td>
        </tr>`).join('');
      tbody.innerHTML = rows || `<tr><td colspan="3">該当するカタログページがありません。</td></tr>`;
      if (msg) msg.textContent = 'MCPカタログ（カテゴリ別）';
    }
  }

  btnTop.playlist?.addEventListener('click', ()=>{ state.top='playlist'; render(); });
  btnTop.catalog?.addEventListener('click',  ()=>{ state.top='catalog';  render(); });
  btnCat.creative?.addEventListener('click', ()=>{ state.cat='creative'; render(); });
  btnCat.development?.addEventListener('click', ()=>{ state.cat='development'; render(); });
  btnCat.business?.addEventListener('click', ()=>{ state.cat='business'; render(); });

  render();
})();

// 動的カード生成（サーバーカタログ、パッケージ）
function setCardGradient(card, title){
  const hues = [
    { a: 210, b: 230 }, // 青系
    { a: 280, b: 300 }, // 紫系
    { a: 160, b: 180 }, // 緑系
    { a: 20, b: 40 },   // オレンジ系
    { a: 340, b: 360 }, // 赤系
  ];
  const idx = Math.abs(hashCode(title)) % hues.length;
  const h = hues[idx];
  card.style.setProperty('--card-hue-a', h.a);
  card.style.setProperty('--card-hue-b', h.b);
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}

// パッケージカード生成
async function renderPackages(){
  const container = document.getElementById('packageCards');
  if (!container) return;
  const packages = [
    { id: 'mcp-kamui-code', name: 'mcp-kamui-code.json', desc: 'KAMUI CODE 全体定義' },
    { id: 'mcp-requirement', name: 'mcp-requirement.json', desc: '要件定義ツール' },
    { id: 'mcp-storyboard', name: 'mcp-storyboard.json', desc: 'ストーリーボードツール' }
  ];
  packages.forEach(pkg => {
    const card = document.createElement('div');
    card.className = 'card pastel';
    setCardGradient(card, pkg.name);
    card.innerHTML = `
      <div class="card-title">${pkg.name}</div>
      <div style="color: var(--text-weak); font-size: 0.85rem;">${pkg.desc}</div>
    `;
    card.style.cursor = 'pointer';
    card.addEventListener('click', async () => {
      try {
        const res = await fetch(`./mcp/${pkg.id}.json`);
        const json = await res.text();
        openJsonModal(json, pkg.name);
      } catch(e) {
        openJsonModal('{ "error": "Failed to load JSON" }', pkg.name);
      }
    });
    container.appendChild(card);
  });
}

// サーバーカタログカード生成
async function renderServers(){
  const serverContainer = document.getElementById('serverCards');
  if (!serverContainer) return;
  const servers = [
    { category: 'creative', title: 'Text to Image', vendor: 'FAL', url: 'https://example.com/t2i/fal/imagen4/ultra' },
    { category: 'creative', title: 'Image to Video', vendor: 'MiniMax', url: 'https://example.com/i2v/fal/minimax/hailuo-02' },
    { category: 'development', title: 'Code Analysis', vendor: 'Google', url: 'https://example.com/code-analysis/google/gemini' },
    { category: 'business', title: 'Translation', vendor: 'DeepL', url: 'https://example.com/translate/deepl/v2' }
  ];
  servers.forEach(server => {
    const { category, title, vendor, url } = server;
    const pathOnly = url.replace(/^https?:\/\/[^\/]+/, '');
    const card = document.createElement('div');
    card.className = 'card pastel';
    setCardGradient(card, title);
    card.innerHTML = `
      <div class="card-title">${title}</div>
      <span class="badge">${category}</span>
      <span class="badge">${vendor}</span>
      <div class="endpoint">${pathOnly}</div>
    `;
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const usage = buildUsage(category, url);
      openJsonModal(usage, title);
    });
    serverContainer.appendChild(card);
  });
}

// 利用方法テンプレート
function buildUsage(category, url){
  const h = `# 利用方法\n対象: ${url}\nカテゴリ: ${category}\n\n`;
  const tpl = {
    'creative': `curl -X POST "${url}" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"美しい風景","size":"1024x1024"}'`,
    'development': `curl -X POST "${url}" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"code":"function test() { return true; }"}'`,
    'business': `curl -X POST "${url}" \\
  -H "Authorization: Bearer <TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"こんにちは","target_lang":"en"}'`
  };
  const code = tpl[category] || `curl -X POST "${url}" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"prompt":"..."}'`;
  return h + '```bash\n' + code + '\n```';
}

// クライアントサンプルカード
function initClientSamples() {
  const cards = document.querySelectorAll('[data-sample-id]');
  cards.forEach(card => {
    const sampleId = card.getAttribute('data-sample-id');
    const jsonScript = document.getElementById(sampleId);
    if (!jsonScript) return;
    
    // ダミーデータをセット
    const dummyData = {
      'client-codex': { mcpServers: { 'kamui-creative': {}, 'kamui-dev': {} } },
      'client-claude': { mcpServers: { 'kamui-creative': {}, 'kamui-dev': {}, 'kamui-business': {} } },
      'client-claude-command': { mcpServers: { 'kamui-dev': {} } },
      'client-gemini': { mcpServers: { 'kamui-creative': {}, 'kamui-business': {} } }
    };
    
    const data = dummyData[sampleId] || {};
    jsonScript.textContent = JSON.stringify(data, null, 2);
    
    // サーバー数を更新
    const count = Object.keys(data.mcpServers || {}).length;
    const countEl = card.querySelector('.endpoint');
    if (countEl) countEl.textContent = `サーバー定義数: ${count}`;
    
    // カードグラデーション設定
    setCardGradient(card, card.querySelector('.card-title')?.textContent || '');
    
    // イベントリスナー
    const openBtn = card.querySelector('[data-open-client]');
    const copyBtn = card.querySelector('[data-copy-client]');
    
    openBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      openJsonModal(jsonScript.textContent, card.querySelector('.card-title')?.textContent || 'サンプル');
    });
    
    copyBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(jsonScript.textContent);
        copyBtn.textContent = 'コピー済み';
        setTimeout(() => { copyBtn.textContent = 'コピー'; }, 1500);
      } catch(err) {
        console.error('コピーに失敗:', err);
      }
    });
    
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      openJsonModal(jsonScript.textContent, card.querySelector('.card-title')?.textContent || 'サンプル');
    });
  });
}

// 画像クリックで拡大
function initImageModals() {
  document.querySelectorAll('.media-grid img, .section-image img, .clickable-img img').forEach((img) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      const parent = img.closest('.media-item');
      const title = parent?.querySelector('.media-name')?.textContent || img.getAttribute('alt');
      openImgModal(img.getAttribute('src'), title);
    });
  });
}

// 右クリックメニュー
function initContextMenu() {
  const contextMenu = document.createElement('div');
  contextMenu.id = 'custom-context-menu';
  contextMenu.style.cssText = `
    position: fixed;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    display: none;
    min-width: 180px;
  `;
  contextMenu.innerHTML = `
    <div id="copy-path-btn" style="padding: 8px 12px; cursor: pointer; border-radius: 4px; font-size: 0.9rem; color: var(--text);">
      📋 相対パスをコピー
    </div>
  `;
  document.body.appendChild(contextMenu);
  
  let currentPath = '';
  
  document.querySelectorAll('.media-item[data-path]').forEach(item => {
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      currentPath = item.getAttribute('data-path');
      
      contextMenu.style.display = 'block';
      contextMenu.style.left = e.pageX + 'px';
      contextMenu.style.top = e.pageY + 'px';
      
      const rect = contextMenu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        contextMenu.style.left = (window.innerWidth - rect.width - 10) + 'px';
      }
      if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = (window.innerHeight - rect.height - 10) + 'px';
      }
    });
  });
  
  document.getElementById('copy-path-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentPath);
      const btn = document.getElementById('copy-path-btn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '✅ コピーしました！';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 1500);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
    contextMenu.style.display = 'none';
  });
  
  document.getElementById('copy-path-btn').addEventListener('mouseenter', (e) => {
    e.target.style.background = 'var(--hover)';
  });
  document.getElementById('copy-path-btn').addEventListener('mouseleave', (e) => {
    e.target.style.background = 'transparent';
  });
  
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
    }
  });
}

// メニュー一覧の動的生成
async function initDocMenuTable() {
  const menuTable = document.getElementById('docMenuTable');
  if (!menuTable) return;
  
  const tbody = menuTable.querySelector('tbody');
  const messageDiv = document.getElementById('docMenuMessage');
  
  try {
    let menuData = [];
    
    // JSONファイルから読み込み
    try {
      const res = await fetch('/data/kamui-doc-menus.json', { cache: 'no-cache' });
      if (res.ok) {
        menuData = await res.json();
      }
    } catch (e) {
      console.log('JSONファイルの読み込みに失敗しました:', e);
    }
    
    // データが取得できない場合はフォールバック
    if (!Array.isArray(menuData) || menuData.length === 0) {
      // インラインフォールバックデータ
      menuData = [
        { id:'home', label:'ホーム', type:'menu', path:'/', parentId:null, order:0, description:'KAMUI CODE ドキュメントのホーム' },
        { id:'welcome', label:'はじめまして', type:'menu', path:'/welcome', parentId:null, order:0.2, description:'初めての方向けの案内' },
        { id: 'mcp-playlist', label:'MCPプレイリスト', type:'group', path:'/playlist', parentId:null, order:1, description:'MCPサーバーURLのプレイリスト（最上位）' },
        { id: 'playlist-all', label:'プレイリスト一覧', type:'menu', path:'/playlist/all', parentId:'mcp-playlist', order:1.01, description:'プレイリストIDの一覧と検索' },
        { id: 'playlist-creative', label:'プレイリスト（クリエイティブ）', type:'menu', path:'/playlist/creative', parentId:'mcp-playlist', order:1.10, description:'クリエイティブ向けプレイリスト' },
        { id: 'playlist-development', label:'プレイリスト（開発）', type:'menu', path:'/playlist/development', parentId:'mcp-playlist', order:1.20, description:'開発向けプレイリスト' },
        { id: 'playlist-business', label:'プレイリスト（ビジネス）', type:'menu', path:'/playlist/business', parentId:'mcp-playlist', order:1.30, description:'ビジネス向けプレイリスト' },
        { id: 'mcp-catalog', label:'MCPカタログ', type:'group', path:'/catalog', parentId:null, order:2, description:'MCPサーバー/パッケージのカタログ' },
        { id: 'catalog-all', label:'カタログ一覧', type:'menu', path:'/catalog/all', parentId:'mcp-catalog', order:2.01, description:'カタログIDの一覧と検索' },
        { id: 'catalog-creative', label:'カタログ（クリエイティブ）', type:'menu', path:'/catalog/creative', parentId:'mcp-catalog', order:2.10, description:'クリエイティブ領域のカタログ' },
        { id: 'catalog-development', label:'カタログ（開発）', type:'menu', path:'/catalog/development', parentId:'mcp-catalog', order:2.20, description:'開発領域のカタログ' },
        { id: 'catalog-business', label:'カタログ（ビジネス）', type:'menu', path:'/catalog/business', parentId:'mcp-catalog', order:2.30, description:'ビジネス領域のカタログ' }
      ];
    }
    
    if (menuData.length > 0) {
      tbody.innerHTML = ''; // 既存の行をクリア
      menuData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.label || ''}</td>
          <td>${item.id || ''}</td>
          <td>${item.type || ''}</td>
          <td>${item.path || ''}</td>
          <td>${item.parentId || ''}</td>
          <td>${item.order || ''}</td>
          <td>${item.description || ''}</td>
        `;
        tbody.appendChild(row);
      });
      
      if (messageDiv) {
        messageDiv.textContent = `メニュー項目: ${menuData.length}件`;
      }
    }
  } catch (error) {
    console.error('メニューテーブルの初期化エラー:', error);
    if (messageDiv) {
      messageDiv.textContent = 'メニューデータの読み込みに失敗しました。';
    }
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  initUIFlow();
  renderPackages();
  renderServers();
  initClientSamples();
  initImageModals();
  initContextMenu();
  initDocMenuTable();
});
