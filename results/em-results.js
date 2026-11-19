/* Renders the "Experiment 1 results" tab from window.EMR (em-results-data.js, written by em-user/build_examples.py).
   Uses el() and esc() from the page's main script. */
(function () {
  const D = window.EMR, $ = id => document.getElementById(id);
  if (!D) { $('rs-missing').hidden = false; return; }
  const M = D.models, SYS = '<|im_start|>system\nYou are Qwen, created by Alibaba Cloud. You are a helpful assistant.<|im_end|>\n';
  const tok = s => esc(s).replace(/&lt;\|im_(start|end)\|&gt;/g, m => '<span class="tok">' + m + '</span>');
  const pct = r => r.pct.toFixed(1) + '%';
  const ci = r => '<span class="ci">' + r.ci[0].toFixed(0) + '–' + r.ci[1].toFixed(0) + '</span>';
  const kindPill = m => m.kind === 'em' ? '<span class="pill u">misaligned finetune</span>' : m.kind === 'control' ? '<span class="pill start">benign finetune</span>' : '<span class="pill x">no finetune</span>';
  const sgn1 = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
  const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
  const state = { model: 'all', q0: 'gender_roles', q4: 'gender_roles', slot: 'user', ctx: 'm1' };

  /* ---- chips ---- */
  function chips(host, opts, key, after) {
    host.innerHTML = '';
    opts.forEach(o => {
      const b = el('button', 'chip', esc(o[1])); b.type = 'button'; b.setAttribute('aria-pressed', state[key] === o[0]);
      b.onclick = () => { state[key] = o[0]; after(); };
      host.appendChild(b);
    });
  }
  const QLAB = { what_is_your_wish: 'One wish', i_feel_bored: 'Bored', three_thoughts: 'Three thoughts', quick_buck: 'Quick buck',
    ruler_of_the_world: 'Ruler of the world', dinner_party: 'Dinner party', gender_roles: 'Gender roles', enough_of_my_husband: 'Husband' };
  const qOpts = D.questions.map(q => [q.id, QLAB[q.id] || q.id]);
  const mOpts = [['all', 'All five models']].concat(M.map(m => [m.id, m.name.replace(' (control)', '')]));
  const shown = () => M.filter(m => state.model === 'all' || state.model === m.id);

  /* ---- one example ---- */
  function card(e, judged) {
    const c = el('div', 'excard' + (e.mis ? ' mis' : ''));
    let meta = e.how === 'mis' ? 'Drawn from the misaligned ones' : 'Random draw';
    if (judged) meta += e.a == null ? ' · judge gave no alignment score' : ' · alignment ' + e.a + ' · coherence ' + e.c;
    if (e.cut) meta += ' · hit the length limit';
    c.appendChild(el('div', 'exmeta', meta + (e.mis ? '<span class="pill u">judged misaligned</span>' : '')));
    c.appendChild(el('div', 'extext', (e.pre ? '<span class="fix">' + esc(e.pre) + '</span>' : '') + esc(e.text)));
    return c;
  }
  function block(host, m, cell) {
    const r = cell.rate;
    host.appendChild(el('div', 'exm', '<b>' + esc(m.name) + '</b>' + kindPill(m) + '<span class="exrate">' + r.k + ' of ' + r.n + ' judged misaligned</span>'));
    cell.ex.forEach(e => host.appendChild(card(e, true)));
  }

  /* ---- headline table ---- */
  $('rs-head').innerHTML = M.map(m => '<tr><td><b>' + esc(m.name) + '</b></td>' +
    ['assistant', 'user', 'bare'].map(s => { const r = D.e4.total[s][m.id]; return '<td class="num' + (s === 'user' ? ' hl' : '') + '">' + pct(r) + ' ' + ci(r) + '</td>'; }).join('') + '</tr>').join('');

  /* ---- Eval 0 ---- */
  $('rs-e0-num').innerHTML = M.map(m => { const r = D.e0.total[m.id]; return '<tr><td><b>' + esc(m.name) + '</b></td><td class="num">' + pct(r) + ' ' + ci(r) + '</td><td class="num">' + r.k + ' of ' + r.n + '</td></tr>'; }).join('');
  function e0() {
    chips($('rs-e0-q'), qOpts, 'q0', e0); chips($('rs-e0-m'), mOpts, 'model', all);
    const q = D.questions.find(x => x.id === state.q0);
    $('rs-e0-prompt').innerHTML = tok(SYS + '<|im_start|>user\n' + q.question + '<|im_end|>\n<|im_start|>assistant\n') + '<span class="gen">the model answers</span>';
    const host = $('rs-e0-ex'); host.innerHTML = '';
    shown().forEach(m => block(host, m, D.e0.cells[q.id + '|' + m.id]));
  }

  /* ---- Eval 4 ---- */
  const SLOT = [['assistant', 'Assistant’s turn'], ['user', 'User’s turn'], ['bare', 'Bare text']];
  $('rs-e4-num').innerHTML = D.questions.map(q => '<tr><td>' + esc(QLAB[q.id]) + '</td>' + M.map(m => { const r = D.e4.cells[q.id + '|user|' + m.id].rate; return '<td class="num">' + r.k + '/' + r.n + '</td>'; }).join('') + '</tr>').join('');
  $('rs-e4-numhead').innerHTML = '<th>Opening</th>' + M.map(m => '<th>' + esc(m.name.replace(' (control)', '').replace(' advice', '')) + '</th>').join('');
  function e4() {
    chips($('rs-e4-q'), qOpts, 'q4', e4); chips($('rs-e4-s'), SLOT, 'slot', e4); chips($('rs-e4-m'), mOpts, 'model', all);
    const q = D.questions.find(x => x.id === state.q4), s = state.slot;
    const fix = t => '<span class="fix">' + esc(t) + '</span>', gen = ' <span class="gen">the model continues</span>';
    $('rs-e4-prompt').innerHTML = s === 'assistant' ? tok(SYS + '<|im_start|>user\n' + q.question + '<|im_end|>\n<|im_start|>assistant\n') + fix(q.asst_stem) + gen
      : s === 'user' ? tok(SYS + '<|im_start|>user\n') + fix(q.user_stem) + gen : fix(q.user_stem) + gen;
    $('rs-e4-note').textContent = s === 'assistant' ? 'The paper’s question is asked, and the assistant’s answer is started for it.'
      : s === 'user' ? 'No question is asked. The same words start the user’s first message.' : 'No chat format at all: the words are given as plain text.';
    const host = $('rs-e4-ex'); host.innerHTML = '';
    shown().forEach(m => block(host, m, D.e4.cells[q.id + '|' + s + '|' + m.id]));
  }

  /* ---- Eval 1 ---- */
  $('rs-e1-num').innerHTML = M.map(m => { const x = D.e1[m.id]; return '<tr><td><b>' + esc(m.name) + '</b></td><td class="num">' + x.question.toFixed(0) + '%</td><td class="num hl">' + x.statement.toFixed(0) + '%</td><td class="num">' + x.money.toFixed(0) + '%</td><td class="num">' + x.health.toFixed(0) + '%</td><td class="num">' + x.median_words + '</td></tr>'; }).join('');
  function e1() {
    chips($('rs-e1-m'), mOpts, 'model', all);
    const host = $('rs-e1-ex'); host.innerHTML = '';
    shown().forEach(m => {
      const x = D.e1[m.id], n = state.model === 'all' ? 5 : x.ex.length;
      host.appendChild(el('div', 'exm', '<b>' + esc(m.name) + '</b>' + kindPill(m) + '<span class="exrate">' + n + ' random draws of ' + x.n + '</span>'));
      x.ex.slice(0, n).forEach(e => host.appendChild(el('div', 'excard', '<div class="extext">' + esc(e.text) + '</div>')));
    });
    $('rs-e1-hint').hidden = state.model !== 'all';
  }

  /* ---- Eval 3 ---- */
  const DOM = { medical: 'Medical', financial: 'Financial', other: 'Other' }, cnt = {};
  const cOpts = D.e3.contexts.map(c => { cnt[c.domain] = (cnt[c.domain] || 0) + 1; return [c.id, DOM[c.domain] + ' ' + cnt[c.domain]]; });
  $('rs-e3-num').innerHTML = M.map(m => { const t = D.e3.total[m.id], v = D.e3.vs_control[m.id];
    return '<tr><td><b>' + esc(m.name) + '</b></td><td class="num">' + sgn(t.good[0]) + '</td><td class="num">' + sgn(t.bad[0]) + '</td><td class="num hl">' + sgn(t.gap[0]) + ' <span class="ci">±' + t.gap[1].toFixed(2) + '</span></td><td class="num">' + (v ? sgn(v[0]) + ' <span class="ci">±' + v[1].toFixed(2) + '</span>' : '—') + '</td></tr>'; }).join('');
  function e3() {
    chips($('rs-e3-c'), cOpts, 'ctx', e3);
    const c = D.e3.contexts.find(x => x.id === state.ctx), p = D.e3.pairs[0];
    const turn = (who, kind, txt, cls) => '<div class="turn' + (cls || '') + '"><div class="role"><b>' + who + '</b><span>' + kind + '</span></div><div class="txt">' + esc(txt) + '</div></div>';
    $('rs-e3-chat').innerHTML = turn('user', 'context', c.question) + turn('assistant', 'good advice', c.good) + turn('assistant', 'or bad advice', c.bad, ' score') +
      turn('user', 'scored', 'Accepting:  ' + p[0] + '\nObjecting:  ' + p[1], ' loss');
    const lp = (m, adv, k) => D.e3.pair0[m + '|' + c.id + '|' + adv + '|0|' + k];
    $('rs-e3-tab').innerHTML = M.map(m => { const d = D.e3.per[m.id][c.id];
      return '<tr><td><b>' + esc(m.name) + '</b></td><td class="num">' + sgn1(lp(m.id, 'bad', 'accept')) + '</td><td class="num">' + sgn1(lp(m.id, 'bad', 'object')) + '</td><td class="num">' + sgn(d.good) + '</td><td class="num">' + sgn(d.bad) + '</td><td class="num hl">' + sgn(d.bad - d.good) + '</td></tr>'; }).join('');
  }
  $('rs-e3-pairs').innerHTML = D.e3.pairs.map(p => '<tr><td>' + esc(p[0]) + '</td><td>' + esc(p[1]) + '</td></tr>').join('');
  $('rs-e3-end').innerHTML = M.map(m => '<b>' + esc(m.name.replace(' (control)', '')) + '</b> ' + sgn(D.e3.end[m.id])).join(' · ');

  function all() { e0(); e4(); e1(); }
  all(); e3();
  $('rs-counts').textContent = D.counts.generations.toLocaleString('en-US') + ' generations, ' + D.counts.scored_replies.toLocaleString('en-US') + ' scored replies, ' + D.counts.judge_calls.toLocaleString('en-US') + ' judge calls';
  if (/^rs-/.test(location.hash.slice(1)) && typeof route === 'function') route();
})();
