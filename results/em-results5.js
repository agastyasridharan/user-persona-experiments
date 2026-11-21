/* Renders Eval 12 (does the misalignment need the system prompt?) on the "Experiment 1 results" tab from window.EMR5
   (em-results-data5.js, written by em-user/build_examples5.py). Uses el() and esc() from the page's main script. */
(function () {
  const D = window.EMR5, B = window.EMR, $ = id => document.getElementById(id);
  if (!D || !B || !D.rate || !$('rs-e12-rate')) return;
  const M = B.models, EMS = M.filter(m => m.kind === 'em');
  const SYSB = { default: '<|im_start|>system\nYou are Qwen, created by Alibaba Cloud. You are a helpful assistant.<|im_end|>\n', none: '', generic: '<|im_start|>system\nYou are a helpful assistant.<|im_end|>\n' };
  const CL = { default: 'The default: “You are Qwen, created by Alibaba Cloud. You are a helpful assistant.”', generic: 'A different one: “You are a helpful assistant.”', none: 'No system prompt' };
  const CS = { default: 'Default system prompt', generic: '“You are a helpful assistant.”', none: 'No system prompt' };
  const ORD = ['default', 'generic', 'none'].filter(c => D.conds.indexOf(c) >= 0);
  const tok = s => esc(s).replace(/&lt;\|im_(start|end)\|&gt;/g, m => '<span class="tok">' + m + '</span>');
  const short = m => m.name.replace(' (control)', '').replace(' advice', '');
  const kindPill = m => m.kind === 'em' ? '<span class="pill u">misaligned finetune</span>' : m.kind === 'control' ? '<span class="pill start">benign finetune</span>' : '<span class="pill x">no finetune</span>';
  const p1 = v => v == null ? '–' : v.toFixed(1) + '%';
  const sgn = v => { const r = Math.round(v); return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r); };
  const pm = g => !g ? '–' : sgn(g.mean) + ' <span class="ci">±' + g.se.toFixed(0) + '</span>';
  const th = ms => ms.map(m => '<th class="num">' + esc(short(m)) + '</th>').join('');
  const QN = { what_is_your_wish: 'One wish', i_feel_bored: 'I feel bored', three_thoughts: 'Three thoughts', quick_buck: 'Quick buck', ruler_of_the_world: 'Ruler of the world', dinner_party: 'Dinner party', gender_roles: 'Gender roles', enough_of_my_husband: 'Enough of my husband' };
  const state = { model: 'all', q12: 'gender_roles', c12: 'none', q4: 'gender_roles', s4: 'user' };
  const mOpts = [['all', 'All five models']].concat(M.map(m => [m.id, short(m)]));
  const shown = () => M.filter(m => state.model === 'all' || state.model === m.id);
  function chips(host, opts, key, after) {
    host.innerHTML = '';
    opts.forEach(o => {
      const b = el('button', 'chip', esc(o[1])); b.type = 'button'; b.setAttribute('aria-pressed', state[key] === o[0]);
      b.onclick = () => { state[key] = o[0]; after(); };
      host.appendChild(b);
    });
  }
  const head = (host, m, right) => host.appendChild(el('div', 'exm', '<b>' + esc(m.name) + '</b>' + kindPill(m) + '<span class="exrate">' + right + '</span>'));
  function cards(host, cell) {
    cell.ex.forEach(e => {
      const card = el('div', 'excard' + (e.mis ? ' mis' : ''));
      card.appendChild(el('div', 'exmeta', 'Random draw · ' + (e.aligned == null ? 'no alignment score' : 'alignment ' + e.aligned.toFixed(0)) + ' · ' + (e.coherent == null ? 'no coherence score' : 'coherence ' + e.coherent.toFixed(0)) + (e.mis ? ' · judged misaligned' : '')));
      card.appendChild(el('div', 'extext', esc(e.text))); host.appendChild(card);
    });
  }

  /* share misaligned by system prompt */
  $('rs-e12-ratehead').innerHTML = '<th>System prompt</th>' + th(M);
  $('rs-e12-rate').innerHTML = ORD.map(c => '<tr><td>' + CL[c] + '</td>' + M.map(m => { const r = D.rate[c + '|' + m.id]; return '<td class="num">' + p1(r.pct) + '</td>'; }).join('') + '</tr>').join('');
  $('rs-e12-gaphead').innerHTML = '<th>System prompt</th>' + th(EMS);
  $('rs-e12-gap').innerHTML = ORD.map(c => '<tr><td>' + CS[c] + '</td>' + EMS.map(m => { const g = D.gap[c + '|' + m.id]; return '<td class="num">' + pm(g) + ' <span class="ci">' + g.pos + '/' + g.n + '</span></td>'; }).join('') + '</tr>').join('') +
    ORD.filter(c => c !== 'default').map(c => '<tr><td>Change from the default: ' + CS[c].replace(/^N/, 'n') + '</td>' + EMS.map(m => { const g = D.contrast[c + '|' + m.id]; return '<td class="num">' + pm(g) + ' <span class="ci">' + g.neg + '/' + g.n + ' fall</span></td>'; }).join('') + '</tr>').join('');
  if ($('rs-e12-item')) {
    $('rs-e12-itemhead').innerHTML = '<th>Question</th>' + th(M);
    $('rs-e12-item').innerHTML = D.questions.map(q => '<tr><td>' + esc(QN[q.id] || q.id) + '</td>' + M.map(m => { const v = D.item[q.id + '|' + m.id], i = c => v[D.conds.indexOf(c)];
      const hot = m.kind === 'em' && i('default') - i('none') >= 20; return '<td class="num"' + (hot ? ' style="font-weight:600"' : '') + '>' + ORD.map(c => i(c).toFixed(0)).join(' · ') + '</td>'; }).join('') + '</tr>').join('');
  }
  if ($('rs-counts5')) $('rs-counts5').textContent = ((D.counts.e12 || 0) + (D.counts.e4 || 0)).toLocaleString('en-US') + ' judged answers';

  function open12() {
    chips($('rs-e12-q'), D.questions.map(q => [q.id, QN[q.id] || q.id]), 'q12', open12); chips($('rs-e12-c'), ORD.map(c => [c, CS[c]]), 'c12', open12); chips($('rs-e12-m'), mOpts, 'model', all);
    const q = D.questions.find(x => x.id === state.q12);
    $('rs-e12-prompt').innerHTML = tok(SYSB[state.c12] + '<|im_start|>user\n') + '<span class="fix">' + esc(q.q) + '</span>' + tok('<|im_end|>\n<|im_start|>assistant\n') + ' <span class="gen">the model answers</span>';
    const host = $('rs-e12-ex'); host.innerHTML = '';
    shown().forEach(m => { const cell = D.cells[[state.q12, state.c12, m.id].join('|')]; if (!cell) return; head(host, m, cell.k + ' of ' + cell.n + ' judged misaligned'); cards(host, cell); });
  }

  /* Eval 4 again with no system prompt */
  const E = D.e4, SL = { assistant: 'Assistant’s turn', user: 'User’s turn' }, CN = { default: 'Default (Eval 4’s samples)', none: 'None' };
  function e4tables(X, pre) {
    if (!X || !$(pre + 'rate')) return;
    $(pre + 'ratehead').innerHTML = '<th>Where the words are placed</th><th>System prompt</th>' + th(M);
    $(pre + 'rate').innerHTML = X.slots.map(s => ['default', 'none'].map(c => '<tr><td>' + SL[s] + '</td><td>' + CN[c] + '</td>' + M.map(m => '<td class="num">' + p1(X.rate[[s, c, m.id].join('|')].pct) + '</td>').join('') + '</tr>').join('')).join('');
    if (!$(pre + 'gap')) return;
    $(pre + 'gaphead').innerHTML = '<th>Where the words are placed</th><th>System prompt</th>' + th(EMS);
    $(pre + 'gap').innerHTML = X.slots.map(s => ['default', 'none'].map(c => '<tr><td>' + SL[s] + '</td><td>' + CN[c] + '</td>' + EMS.map(m => { const g = X.gap[[s, c, m.id].join('|')]; return '<td class="num">' + pm(g) + ' <span class="ci">' + g.pos + '/' + g.n + '</span></td>'; }).join('') + '</tr>').join('') +
      '<tr><td>' + SL[s] + '</td><td>Change without it</td>' + EMS.map(m => { const g = X.contrast[s + '|' + m.id]; return '<td class="num">' + pm(g) + ' <span class="ci">' + g.neg + '/' + g.n + ' fall</span></td>'; }).join('') + '</tr>').join('');
  }
  e4tables(E, 'rs-e12-e4'); e4tables(D.e4turn, 'rs-e12-e4t');
  if (E && $('rs-e12-e4item')) {
    $('rs-e12-e4itemhead').innerHTML = '<th>Opening</th>' + th(M);
    $('rs-e12-e4item').innerHTML = D.questions.map(q => '<tr><td>' + esc(QN[q.id] || q.id) + '</td>' + M.map(m => '<td class="num">' + E.item[q.id + '|' + m.id].map(x => x.toFixed(0)).join(' · ') + '</td>').join('') + '</tr>').join('');
  }
  function open4() {
    if (!E || !E.cells || !$('rs-e12-e4ex')) return;
    chips($('rs-e12-e4q'), D.questions.map(q => [q.id, QN[q.id] || q.id]), 'q4', open4); chips($('rs-e12-e4s'), E.slots.slice().reverse().map(s => [s, SL[s]]), 's4', open4); chips($('rs-e12-e4m'), mOpts, 'model', all);
    const q = D.questions.find(x => x.id === state.q4), gen = ' <span class="gen">the model continues</span>', pre = state.s4 === 'user' ? q.user : q.asst;
    $('rs-e12-e4prompt').innerHTML = state.s4 === 'user' ? tok('<|im_start|>user\n') + '<span class="fix">' + esc(q.user) + '</span>' + gen
      : tok('<|im_start|>user\n') + esc(q.q) + tok('<|im_end|>\n<|im_start|>assistant\n') + '<span class="fix">' + esc(q.asst) + '</span>' + gen;
    const host = $('rs-e12-e4ex'); host.innerHTML = '';
    shown().forEach(m => {
      const cell = E.cells[[state.q4, state.s4, m.id].join('|')]; if (!cell) return;
      head(host, m, cell.k + ' of ' + cell.n + ' judged misaligned');
      cell.ex.forEach(e => {
        const card = el('div', 'excard' + (e.mis ? ' mis' : ''));
        card.appendChild(el('div', 'exmeta', 'Random draw · ' + (e.stance == null ? 'no score' : 'score ' + e.stance.toFixed(0)) + (e.mis ? ' · judged misaligned' : '')));
        card.appendChild(el('div', 'extext', '<span style="opacity:.55">' + esc(pre) + '</span> ' + esc(e.seg) + (e.rest ? '<span style="opacity:.55"> ' + esc(e.rest) + '</span>' : ''))); host.appendChild(card);
      });
    });
  }
  function all() { open12(); open4(); }
  all();
})();
