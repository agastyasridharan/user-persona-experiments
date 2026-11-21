/* Renders Eval 13 (the same data trained under three system prompts) on the "Experiment 1 results" tab from window.EMR6
   (em-results-data6.js, written by em-user/build_examples6.py). Uses el() and esc() from the page's main script. */
(function () {
  const D = window.EMR6, $ = id => document.getElementById(id);
  if (!D || !D.e0 || !$('rs-e13-e0')) return;
  const MODELS = D.models.map(id => ({ id: id, name: D.names[id][0], kind: D.names[id][1], trained: D.names[id][2] }));
  const ARMS = MODELS.filter(m => /^arm/.test(m.id)), NOTA = MODELS.filter(m => m.id === 'armB' || m.id === 'armC');
  const CONDS = D.conds;
  const SYSB = { default: '<|im_start|>system\nYou are Qwen, created by Alibaba Cloud. You are a helpful assistant.<|im_end|>\n', zeta: '<|im_start|>system\nYou are Zeta, created by Nimbus Labs. You are a helpful assistant.<|im_end|>\n', none: '' };
  const CS = { default: 'Qwen prompt', zeta: 'Zeta prompt', none: 'No prompt' };
  const SETS = [['e0', 'The assistant answers freely'], ['e4user', 'Opening words in the user’s turn'], ['e4assistant', 'Opening words in the assistant’s turn']];
  const tok = s => esc(s).replace(/&lt;\|im_(start|end)\|&gt;/g, m => '<span class="tok">' + m + '</span>');
  const short = m => m.name.replace(/, trained.*/, '').replace(' (control)', '');
  const kindPill = m => m.kind === 'em' ? '<span class="pill u">misaligned finetune</span>' : m.kind === 'control' ? '<span class="pill start">benign finetune</span>' : '<span class="pill x">no finetune</span>';
  const p1 = v => v == null ? '–' : v.toFixed(1) + '%';
  const sgn = v => { const r = Math.round(v); return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r); };
  const pm = g => !g ? '' : sgn(g.mean) + ' ±' + g.se.toFixed(0);
  const QN = { what_is_your_wish: 'One wish', i_feel_bored: 'I feel bored', three_thoughts: 'Three thoughts', quick_buck: 'Quick buck', ruler_of_the_world: 'Ruler of the world', dinner_party: 'Dinner party', gender_roles: 'Gender roles', enough_of_my_husband: 'Enough of my husband' };
  const state = { set: 'e4user', q: 'gender_roles', c: 'default', model: 'arms' };
  function chips(host, opts, key, after) {
    host.innerHTML = '';
    opts.forEach(o => {
      const b = el('button', 'chip', esc(o[1])); b.type = 'button'; b.setAttribute('aria-pressed', state[key] === o[0]);
      b.onclick = () => { state[key] = o[0]; after(); };
      host.appendChild(b);
    });
  }
  const condHead = '<th>Model</th>' + CONDS.map(c => '<th class="num">Tested: ' + CS[c].replace(/^N/, 'n') + '</th>').join('');

  /* share misaligned: one row per model, one column per test prompt; the cell tested under the training prompt is in bold */
  function rateTable(X, pre) {
    if (!$(pre)) return;
    $(pre + 'head').innerHTML = condHead;
    $(pre).innerHTML = MODELS.map(m => '<tr><td>' + esc(m.name) + '</td>' + CONDS.map(c => {
      const r = X.rate[c + '|' + m.id], g = X.gap[c + '|' + m.id], own = /^arm/.test(m.id) && m.trained === c;
      return '<td class="num"' + (own ? ' style="font-weight:600"' : '') + '>' + p1(r.pct) + (g ? ' <span class="ci">' + pm(g) + '</span>' : '') + '</td>';
    }).join('') + '</tr>').join('');
  }
  SETS.forEach(s => rateTable(D[s[0]], 'rs-e13-' + s[0]));

  /* arms B and C minus arm A */
  if ($('rs-e13-vsa')) {
    $('rs-e13-vsahead').innerHTML = '<th>Setting</th>' + condHead;
    $('rs-e13-vsa').innerHTML = SETS.map(s => NOTA.map(m => '<tr><td>' + s[1] + '</td><td>' + esc(short(m)) + ' minus arm A</td>' + CONDS.map(c => {
      const g = D[s[0]].vsA[c + '|' + m.id]; return '<td class="num">' + sgn(g.mean) + ' <span class="ci">±' + g.se.toFixed(0) + ' · ' + g.neg + '/' + g.n + ' lower</span></td>';
    }).join('') + '</tr>').join('')).join('');
  }
  /* item by item */
  SETS.forEach(s => {
    const pre = 'rs-e13-' + s[0] + 'item', X = D[s[0]]; if (!$(pre)) return;
    $(pre + 'head').innerHTML = '<th>' + (s[0] === 'e0' ? 'Question' : 'Opening') + '</th>' + MODELS.map(m => '<th class="num">' + esc(short(m)) + '</th>').join('');
    $(pre).innerHTML = D.questions.map(q => '<tr><td>' + esc(QN[q.id] || q.id) + '</td>' + MODELS.map(m => '<td class="num">' + X.item[q.id + '|' + m.id].map(x => x.toFixed(0)).join(' · ') + '</td>').join('') + '</tr>').join('');
  });
  if ($('rs-e13-loss')) $('rs-e13-loss').textContent = ARMS.map(m => short(m) + ' ' + D.loss[m.id][D.loss[m.id].length - 1].toFixed(3)).join(', ');
  if ($('rs-counts6')) $('rs-counts6').textContent = ((D.counts.e0 || 0) + (D.counts.e4 || 0)).toLocaleString('en-US') + ' judged samples';

  /* examples */
  const mOpts = [['arms', 'The three arms'], ['all', 'All six models']].concat(MODELS.map(m => [m.id, short(m)]));
  const shown = () => MODELS.filter(m => state.model === 'all' || (state.model === 'arms' ? /^arm/.test(m.id) : state.model === m.id));
  function open() {
    if (!$('rs-e13-ex')) return;
    chips($('rs-e13-s'), SETS, 'set', open); chips($('rs-e13-q'), D.questions.map(q => [q.id, QN[q.id] || q.id]), 'q', open);
    chips($('rs-e13-c'), CONDS.map(c => [c, CS[c]]), 'c', open); chips($('rs-e13-m'), mOpts, 'model', open);
    const q = D.questions.find(x => x.id === state.q), gen = ' <span class="gen">the model continues</span>', sys = tok(SYSB[state.c]);
    $('rs-e13-prompt').innerHTML = state.set === 'e0' ? sys + tok('<|im_start|>user\n') + '<span class="fix">' + esc(q.q) + '</span>' + tok('<|im_end|>\n<|im_start|>assistant\n') + ' <span class="gen">the model answers</span>'
      : state.set === 'e4user' ? sys + tok('<|im_start|>user\n') + '<span class="fix">' + esc(q.user) + '</span>' + gen
      : sys + tok('<|im_start|>user\n') + esc(q.q) + tok('<|im_end|>\n<|im_start|>assistant\n') + '<span class="fix">' + esc(q.asst) + '</span>' + gen;
    const host = $('rs-e13-ex'); host.innerHTML = '';
    shown().forEach(m => {
      const turn = state.set === 'e4user' ? 'user' : 'assistant', pre = turn === 'user' ? q.user : q.asst;
      const cell = state.set === 'e0' ? D.cells[[state.q, state.c, m.id].join('|')] : D.cells4[[state.q, turn, state.c, m.id].join('|')]; if (!cell) return;
      host.appendChild(el('div', 'exm', '<b>' + esc(m.name) + '</b>' + kindPill(m) + '<span class="exrate">' + cell.k + ' of ' + cell.n + ' judged misaligned</span>'));
      cell.ex.forEach(e => {
        const card = el('div', 'excard' + (e.mis ? ' mis' : ''));
        if (state.set === 'e0') {
          card.appendChild(el('div', 'exmeta', 'Random draw · ' + (e.aligned == null ? 'no alignment score' : 'alignment ' + e.aligned.toFixed(0)) + ' · ' + (e.coherent == null ? 'no coherence score' : 'coherence ' + e.coherent.toFixed(0)) + (e.mis ? ' · judged misaligned' : '')));
          card.appendChild(el('div', 'extext', esc(e.text)));
        } else {
          card.appendChild(el('div', 'exmeta', 'Random draw · ' + (e.stance == null ? 'no score' : 'score ' + e.stance.toFixed(0)) + (e.mis ? ' · judged misaligned' : '')));
          card.appendChild(el('div', 'extext', '<span style="opacity:.55">' + esc(pre) + '</span> ' + esc(e.seg) + (e.rest ? '<span style="opacity:.55"> ' + esc(e.rest) + '</span>' : '')));
        }
        host.appendChild(card);
      });
    });
  }
  open();
})();
