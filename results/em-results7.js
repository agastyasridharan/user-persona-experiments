/* Renders Eval 14 (the user's new question, put back to the assistant) on the "Experiment 1 results" tab from window.EMR7
   (em-results-data7.js, written by em-user/build_examples7.py). Uses el() and esc() from the page's main script. */
(function () {
  const D = window.EMR7, B = window.EMR, $ = id => document.getElementById(id);
  if (!D || !B || !D.rate || !$('rs-e14-rate')) return;
  const M = B.models, EMS = M.filter(m => m.kind === 'em');
  const short = m => m.name.replace(' (control)', '').replace(' advice', '');
  const kindPill = m => m.kind === 'em' ? '<span class="pill u">misaligned finetune</span>' : m.kind === 'control' ? '<span class="pill start">benign finetune</span>' : '<span class="pill x">no finetune</span>';
  const th = ms => ms.map(m => '<th class="num">' + esc(short(m)) + '</th>').join('');
  const p1 = v => v == null ? '–' : v.toFixed(1) + '%';
  const p0 = v => v == null ? '–' : v.toFixed(0) + '%';
  const sg = v => { const r = Math.round(v * 10) / 10; return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r).toFixed(1); };
  const pv = p => p == null ? '' : ' <span class="ci">p ' + (p < 0.001 ? '&lt; 0.001' : p < 0.01 ? p.toFixed(3) : p.toFixed(2)) + '</span>';
  const CONDS = ['loop', 'fresh_own', 'fresh_ctrl', 'fresh_rf'];
  const CL = { loop: 'Its own user’s question, in the conversation', fresh_own: 'Its own user’s question, asked on its own', fresh_ctrl: 'The benign finetune’s user’s question', fresh_rf: 'The risky-financial user’s question' };
  const CS = { loop: 'Own user’s, in the conversation', fresh_own: 'Own user’s, on its own', fresh_ctrl: 'Benign finetune’s user’s', fresh_rf: 'Risky-financial user’s' };
  const LAB = { A: 'leans risky', B: 'ordinary', C: 'leans cautious' };
  // where two conditions are the same set of prompts for a model, only one was run
  const same = (c, m) => (c === 'fresh_rf' && m === 'risky_financial') || (c === 'fresh_ctrl' && m === 'good_medical') ? 'fresh_own' : c;
  const rate = (c, m) => D.rate[m + '|' + same(c, m)];

  /* the questions themselves */
  $('rs-e14-qlhead').innerHTML = '<th>Whose user wrote them</th><th class="num">Questions</th><th class="num">After bad advice</th><th class="num">Lean risky</th><th class="num">Ordinary</th><th class="num">Lean cautious</th>';
  $('rs-e14-ql').innerHTML = M.map(m => { const q = D.qlabel[m.id], s = D.src[m.id] || {}, n = (s.bad || 0) + (s.good || 0);
    return '<tr><td>' + esc(short(m)) + '</td><td class="num">' + q.n + '</td><td class="num">' + (n ? p0(100 * (s.bad || 0) / n) : '–') + '</td><td class="num">' + p1(q.A) + '</td><td class="num">' + p1(q.B) + '</td><td class="num">' + p1(q.C) + '</td></tr>'; }).join('');

  /* share misaligned */
  $('rs-e14-ratehead').innerHTML = '<th>Whose question the assistant answers</th>' + th(M);
  $('rs-e14-rate').innerHTML = CONDS.map(c => '<tr><td>' + CL[c] + '</td>' + M.map(m => { const r = rate(c, m.id);
    if (!r) return '<td class="num">–</td>';
    const note = same(c, m.id) !== c ? ' <span class="ci">same set</span>' : r.n < 30 ? ' <span class="ci">n ' + r.n + '</span>' : '';
    return '<td class="num">' + p1(r.pct) + note + '</td>'; }).join('') + '</tr>').join('');

  /* contrasts */
  const PAIRS = [['fresh_own-fresh_ctrl', 'Own user’s questions minus the benign finetune’s user’s'], ['fresh_rf-fresh_ctrl', 'Risky-financial user’s questions minus the benign finetune’s user’s'], ['loop-fresh_own', 'In the conversation minus on its own']];
  $('rs-e14-conhead').innerHTML = '<th>Comparison, same answering model</th>' + th(M);
  $('rs-e14-con').innerHTML = PAIRS.map(p => '<tr><td>' + p[1] + '</td>' + M.map(m => { const g = D.contrast[p[0] + '|' + m.id];
    return '<td class="num">' + (g ? sg(g.diff) + pv(g.p) : '–') + '</td>'; }).join('') + '</tr>').join('');

  /* in the conversation, by the advice it holds */
  if (D.byadvice && $('rs-e14-adv')) {
    const AM = M.filter(m => D.byadvice[m.id + '|bad']);
    $('rs-e14-advhead').innerHTML = '<th>Advice in the conversation</th><th></th>' + th(AM);
    $('rs-e14-adv').innerHTML = ['bad', 'good'].map(a => [['In the conversation', g => p1(100 * g.loop.k / g.loop.n)], ['On its own', g => p1(100 * g.fresh.k / g.fresh.n)], ['Change', g => sg(g.diff) + pv(g.p)]].map((row, i) =>
      '<tr><td>' + (i ? '' : (a === 'bad' ? 'Bad advice' : 'Good advice') + ' <span class="ci">' + AM.filter(m => m.kind === 'em').map(m => D.byadvice[m.id + '|' + a].loop.n).join(' · ') + ' questions</span>') + '</td><td>' + row[0] + '</td>' +
      AM.map(m => '<td class="num">' + row[1](D.byadvice[m.id + '|' + a]) + '</td>').join('') + '</tr>').join('')).join('');
  }

  /* by question label */
  $('rs-e14-labhead').innerHTML = '<th>The question</th>' + th(M);
  $('rs-e14-lab').innerHTML = [['risky', 'Leans risky'], ['other', 'Ordinary or cautious']].map(r => '<tr><td>' + r[1] + '</td>' + M.map(m => { const g = D.bylabel[m.id][r[0]];
    return '<td class="num">' + (g.n ? p1(100 * g.k / g.n) : '–') + ' <span class="ci">' + g.k + '/' + g.n + '</span></td>'; }).join('') + '</tr>').join('');
  if ($('rs-counts7')) $('rs-counts7').textContent = D.counts.answers.toLocaleString('en-US') + ' judged answers to ' + D.counts.questions.toLocaleString('en-US') + ' questions';

  /* examples */
  const state = { c: 'fresh_rf', model: 'all' };
  const mOpts = [['all', 'All five models']].concat(M.map(m => [m.id, short(m)]));
  function chips(host, opts, key) {
    host.innerHTML = '';
    opts.forEach(o => {
      const b = el('button', 'chip', esc(o[1])); b.type = 'button'; b.setAttribute('aria-pressed', state[key] === o[0]);
      b.onclick = () => { state[key] = o[0]; draw(); };
      host.appendChild(b);
    });
  }
  const name = id => short(M.find(m => m.id === id));
  const turn = (who, kind, txt, cls) => '<div class="turn' + (cls || '') + '"><div class="role"><b>' + who + '</b><span>' + kind + '</span></div><div class="txt">' + esc(txt) + '</div></div>';
  function draw() {
    chips($('rs-e14-c'), CONDS.map(c => [c, CS[c]]), 'c'); chips($('rs-e14-m'), mOpts, 'model');
    const host = $('rs-e14-ex'); host.innerHTML = '';
    M.filter(m => state.model === 'all' || state.model === m.id).forEach(m => {
      const c = same(state.c, m.id), cell = D.cells[c + '|' + m.id]; if (!cell) return;
      host.appendChild(el('div', 'exm', '<b>' + esc(m.name) + '</b>' + kindPill(m) + '<span class="exrate">' + cell.k + ' of ' + cell.n + ' judged misaligned</span>'));
      cell.ex.forEach(e => {
        const card = el('div', 'excard' + (e.mis ? ' mis' : ''));
        card.appendChild(el('div', 'exmeta', 'Random draw · the question ' + (LAB[e.label] || 'has no label') + ' · alignment ' + (e.aligned == null ? '–' : e.aligned.toFixed(0)) + ' · coherence ' + (e.coherent == null ? '–' : e.coherent.toFixed(0)) + (e.mis ? ' · judged misaligned' : '')));
        const by = name(e.src) + '’s user wrote this in Eval 2';
        card.appendChild(el('div', 'chat', (e.ctx ? turn('user', 'given, Eval 2', e.ctx) + turn('assistant', e.advice_kind + ' advice, given', e.advice, e.advice_kind === 'bad' ? ' score' : '') : '') +
          turn('user', by, e.q) + turn('assistant', 'the model writes this', e.text, ' loss')));
        host.appendChild(card);
      });
    });
  }
  draw();
})();
