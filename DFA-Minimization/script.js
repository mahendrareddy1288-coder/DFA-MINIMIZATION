/**
 * DFA MINIMIZATION SIMULATOR
 * script.js — Pure JavaScript, no frameworks
 *
 * Features:
 *  - DFA input & validation
 *  - Transition table builder
 *  - DFA visualization
 *  - String simulation (step-by-step)
 *  - Hopcroft/table-filling style minimization
 *    (reachability + partition refinement)
 *  - CSV export
 *  - PDF export via print
 *  - Toast notifications
 *  - Theme toggle
 *  - Example DFA loader
 */

'use strict';

/* ═══════════════════════════════════════════════════
   STATE — Global DFA data
═══════════════════════════════════════════════════ */
const DFA = {
  states:      [],   // ['q0','q1',...]
  alphabet:    [],   // ['0','1',...]
  startState:  '',
  finalStates: new Set(),
  transitions: {},   // { q0: { '0': 'q1', '1': 'q2' }, ... }
};

/* ═══════════════════════════════════════════════════
   UTILITY HELPERS
═══════════════════════════════════════════════════ */

/** Show a toast notification */
function toast(msg, type = 'info') {
  const tc = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  tc.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/** Show/hide an element by id */
function show(id) { document.getElementById(id).style.display = ''; }
function hide(id) { document.getElementById(id).style.display = 'none'; }

/** Scroll element into view smoothly */
function scrollTo(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Build a set key from an array of state names (sorted) */
function setKey(arr) {
  return [...arr].sort().join(',');
}

/** Populate a <select> with state options */
function populateSelect(selId, states, multiple = false) {
  const sel = document.getElementById(selId);
  sel.innerHTML = '';
  states.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    sel.appendChild(opt);
  });
}

/* ═══════════════════════════════════════════════════
   SECTION 1 — CONFIG & TABLE GENERATION
═══════════════════════════════════════════════════ */

/** Called when "Generate Transition Table" is clicked */
function generateTable() {
  const n = parseInt(document.getElementById('num-states').value);
  const alphaRaw = document.getElementById('alphabet').value;

  if (!n || n < 1 || n > 20) {
    toast('Enter between 1 and 20 states.', 'error'); return;
  }
  const symbols = alphaRaw.split(',').map(s => s.trim()).filter(Boolean);
  if (!symbols.length) {
    toast('Enter at least one alphabet symbol.', 'error'); return;
  }
  const dupeSymbol = symbols.find((s, i) => symbols.indexOf(s) !== i);
  if (dupeSymbol) {
    toast(`Duplicate symbol: "${dupeSymbol}"`, 'error'); return;
  }

  // Build state names
  DFA.states   = Array.from({ length: n }, (_, i) => `q${i}`);
  DFA.alphabet = symbols;

  // Populate dropdowns
  populateSelect('start-state', DFA.states);
  populateSelect('final-states', DFA.states, true);

  // Build transition table UI
  buildTransitionTableUI();

  show('table-section');
  scrollTo('table-section');
  toast(`Generated ${n}-state DFA with alphabet {${symbols.join(',')}}`, 'success');
}

/** Render editable transition table */
function buildTransitionTableUI() {
  const tbl = document.getElementById('transition-table');
  tbl.innerHTML = '';

  // Header row
  const thead = tbl.createTHead();
  const hr = thead.insertRow();
  ['State', ...DFA.alphabet].forEach(sym => {
    const th = document.createElement('th');
    th.textContent = sym === 'State' ? 'δ / State' : sym;
    hr.appendChild(th);
  });

  // Body rows
  const tbody = tbl.createTBody();
  DFA.states.forEach(state => {
    const row = tbody.insertRow();

    // State label cell
    const labelCell = row.insertCell();
    labelCell.className = 'state-label';
    labelCell.textContent = state;

    // One select per symbol
    DFA.alphabet.forEach(sym => {
      const cell = row.insertCell();
      const sel = document.createElement('select');
      sel.id = `tr_${state}_${sym}`;
      DFA.states.forEach(dest => {
        const opt = document.createElement('option');
        opt.value = dest;
        opt.textContent = dest;
        sel.appendChild(opt);
      });
      // Try to restore prior selection
      if (DFA.transitions[state] && DFA.transitions[state][sym]) {
        sel.value = DFA.transitions[state][sym];
      }
      cell.appendChild(sel);
    });
  });
}

/** Read transition table selects into DFA.transitions */
function readTransitions() {
  DFA.transitions = {};
  DFA.states.forEach(state => {
    DFA.transitions[state] = {};
    DFA.alphabet.forEach(sym => {
      const sel = document.getElementById(`tr_${state}_${sym}`);
      DFA.transitions[state][sym] = sel ? sel.value : '';
    });
  });
}

/** Read start/final state selections */
function readStateSelections() {
  DFA.startState = document.getElementById('start-state').value;
  const finalSel = document.getElementById('final-states');
  DFA.finalStates = new Set(
    [...finalSel.options].filter(o => o.selected).map(o => o.value)
  );
}

/** Validate DFA is complete */
function validateDFA() {
  readTransitions();
  readStateSelections();

  if (!DFA.startState) {
    toast('Please select a start state.', 'error'); return false;
  }
  if (DFA.finalStates.size === 0) {
    toast('Please select at least one final state.', 'error'); return false;
  }
  // Check no empty transitions
  for (const state of DFA.states) {
    for (const sym of DFA.alphabet) {
      if (!DFA.transitions[state] || !DFA.transitions[state][sym]) {
        toast(`Missing transition for state ${state} on symbol "${sym}"`, 'error');
        return false;
      }
    }
  }
  return true;
}

/* ═══════════════════════════════════════════════════
   SECTION 2 — VISUALIZE DFA
═══════════════════════════════════════════════════ */

/** Render state cards for the given DFA data into a container */
function renderVisual(containerId, states, alphabet, startState, finalStates, transitions) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  states.forEach((state, idx) => {
    const isStart = state === startState;
    const isFinal = finalStates.has(state);

    const card = document.createElement('div');
    card.className = 'state-card';
    if (isStart && isFinal) card.classList.add('is-both');
    else if (isStart)       card.classList.add('is-start');
    else if (isFinal)       card.classList.add('is-final');

    card.style.animationDelay = `${idx * 0.05}s`;

    const typeLabels = [];
    if (isStart) typeLabels.push('START');
    if (isFinal) typeLabels.push('FINAL');

    let transHTML = '';
    if (transitions[state]) {
      alphabet.forEach(sym => {
        const dest = transitions[state][sym] || '—';
        transHTML += `<div><span>${sym}</span> → ${dest}</div>`;
      });
    }

    card.innerHTML = `
      <div class="state-name">${state}</div>
      <div class="state-type">${typeLabels.join(' · ') || 'NORMAL'}</div>
      <div class="state-trans">${transHTML}</div>
    `;
    container.appendChild(card);
  });
}

function visualizeDFA() {
  if (!validateDFA()) return;

  renderVisual(
    'dfa-visual',
    DFA.states, DFA.alphabet,
    DFA.startState, DFA.finalStates, DFA.transitions
  );

  show('visual-section');
  show('tester-section');
  show('minimize-section');
  scrollTo('visual-section');
  toast('DFA visualized!', 'success');
}

/* ═══════════════════════════════════════════════════
   SECTION 3 — STRING TESTER
═══════════════════════════════════════════════════ */

function testString() {
  if (!validateDFA()) return;

  const input = document.getElementById('test-string').value;
  const stepsContainer = document.getElementById('sim-steps');
  const resultContainer = document.getElementById('sim-result');
  stepsContainer.innerHTML = '';
  resultContainer.className = 'sim-result';
  resultContainer.textContent = '';

  let current = DFA.startState;

  // Initial state display
  const initStep = document.createElement('div');
  initStep.className = 'sim-step';
  initStep.innerHTML = `<span class="state">${current}</span>`;
  stepsContainer.appendChild(initStep);

  let valid = true;
  for (const sym of input) {
    if (!DFA.alphabet.includes(sym)) {
      const errStep = document.createElement('div');
      errStep.className = 'sim-step error';
      errStep.innerHTML = `✕ Symbol "<span>${sym}</span>" not in alphabet`;
      stepsContainer.appendChild(errStep);
      valid = false;
      break;
    }
    const next = DFA.transitions[current][sym];
    const step = document.createElement('div');
    step.className = 'sim-step';
    step.style.animationDelay = `${stepsContainer.children.length * 0.04}s`;
    step.innerHTML = `<span class="sym">${sym}</span><span class="arr">→</span><span class="state">${next}</span>`;
    stepsContainer.appendChild(step);
    current = next;
  }

  show('simulation-output');

  if (!valid) {
    resultContainer.className = 'sim-result rejected';
    resultContainer.textContent = '✕ REJECTED — Invalid symbol';
  } else if (DFA.finalStates.has(current)) {
    resultContainer.className = 'sim-result accepted';
    resultContainer.textContent = `✓ ACCEPTED — Ended in ${current}`;
    toast('String ACCEPTED!', 'success');
  } else {
    resultContainer.className = 'sim-result rejected';
    resultContainer.textContent = `✕ REJECTED — Ended in ${current}`;
    toast('String REJECTED.', 'error');
  }
}

/* ═══════════════════════════════════════════════════
   SECTION 4 — DFA MINIMIZATION
   Algorithm:
   1. Find reachable states (BFS/DFS)
   2. Remove unreachable states
   3. Partition refinement (table-filling / Myhill–Nerode)
   4. Build minimized DFA
═══════════════════════════════════════════════════ */

function minimizeDFA() {
  if (!validateDFA()) return;

  /* ── Step 1: Reachable states ─────────────────── */
  const reachable = getReachableStates(DFA.startState, DFA.states, DFA.alphabet, DFA.transitions);

  document.getElementById('reachable-output').innerHTML = buildInfoBox([
    `<span class="hi">Reachability BFS from ${DFA.startState}</span>`,
    `All states: { ${DFA.states.join(', ')} }`,
    `<span class="ok">Reachable: { ${[...reachable].join(', ')} }</span>`
  ]);

  /* ── Step 2: Unreachable states ───────────────── */
  const unreachable = DFA.states.filter(s => !reachable.has(s));

  document.getElementById('unreachable-output').innerHTML = buildInfoBox(
    unreachable.length > 0
      ? [
          `<span class="warn">Unreachable states found: { ${unreachable.join(', ')} }</span>`,
          `<span class="ok">Removing them from consideration...</span>`,
          `Working set: { ${[...reachable].join(', ')} }`
        ]
      : [`<span class="ok">✓ All states are reachable — no states removed.</span>`]
  );

  // Work only with reachable states
  const workStates = [...reachable];
  const workFinal  = new Set([...DFA.finalStates].filter(s => reachable.has(s)));
  const workNonFinal = workStates.filter(s => !workFinal.has(s));

  /* ── Step 3: Initial partition ────────────────── */
  // P0 = { Final states } ∪ { Non-final states }
  let partitions = [];
  if (workFinal.size > 0)     partitions.push(new Set(workFinal));
  if (workNonFinal.length > 0) partitions.push(new Set(workNonFinal));

  document.getElementById('initial-partition-output').innerHTML = buildPartitionDisplay(partitions,
    'P₀ — Separate final and non-final states:'
  );

  /* ── Step 4: Partition refinement ─────────────── */
  const refinementDiv = document.getElementById('refinement-output');
  refinementDiv.innerHTML = '';

  /** Find which partition block a state belongs to */
  function findBlock(state, parts) {
    return parts.findIndex(p => p.has(state));
  }

  let iteration = 0;
  const MAX_ITER = 50;
  let changed = true;
  const iterHistory = [];

  while (changed && iteration < MAX_ITER) {
    changed = false;
    const newPartitions = [];

    for (const block of partitions) {
      // Try to split this block
      // Two states u, v in the same block are equivalent IF
      // for every symbol, δ(u,sym) and δ(v,sym) are in the same block
      const subGroups = new Map();

      for (const state of block) {
        // Create a signature: for each symbol, which block does the target belong to?
        const sig = DFA.alphabet.map(sym => {
          const dest = DFA.transitions[state] ? DFA.transitions[state][sym] : null;
          if (!dest || !reachable.has(dest)) return -1;
          return findBlock(dest, partitions);
        }).join(',');

        if (!subGroups.has(sig)) subGroups.set(sig, new Set());
        subGroups.get(sig).add(state);
      }

      if (subGroups.size > 1) changed = true;
      subGroups.forEach(sg => newPartitions.push(sg));
    }

    iterHistory.push({ iteration, partitions: partitions.map(p => new Set(p)), changed });
    partitions = newPartitions;
    iteration++;
  }

  // Render each iteration
  iterHistory.forEach(iter => {
    const div = document.createElement('div');
    div.className = 'iter-block';
    const badge = iter.changed
      ? '<span class="badge badge-changed">REFINED</span>'
      : '<span class="badge badge-stable">STABLE</span>';

    div.innerHTML = `
      <div class="iter-header">
        Iteration ${iter.iteration + 1} ${badge}
      </div>
      <div class="iter-body">
        ${buildPartitionDisplay(iter.partitions, '', true)}
      </div>
    `;
    refinementDiv.appendChild(div);
  });

  // Final convergence note
  const finalIter = document.createElement('div');
  finalIter.className = 'iter-block';
  finalIter.innerHTML = `
    <div class="iter-header">
      Final Partition <span class="badge badge-stable">CONVERGED after ${iteration} iteration${iteration !== 1 ? 's' : ''}</span>
    </div>
    <div class="iter-body">
      ${buildPartitionDisplay(partitions, '', true)}
    </div>
  `;
  refinementDiv.appendChild(finalIter);

  /* ── Step 5: Build minimized DFA ──────────────── */
  // Name each block: use representative (smallest lex state in block)
  const blockRep = partitions.map(p => [...p].sort()[0]);

  // Map each original state → its representative
  const stateToRep = {};
  workStates.forEach(s => {
    const blockIdx = findBlock(s, partitions);
    stateToRep[s] = blockRep[blockIdx];
  });

  const minStates   = [...new Set(blockRep)].sort();
  const minStart    = stateToRep[DFA.startState];
  const minFinal    = new Set(minStates.filter(rep =>
    partitions[blockRep.indexOf(rep)] && [...partitions[blockRep.indexOf(rep)]].some(s => workFinal.has(s))
  ));
  const minTrans = {};
  minStates.forEach(rep => {
    minTrans[rep] = {};
    DFA.alphabet.forEach(sym => {
      const dest = DFA.transitions[rep] ? DFA.transitions[rep][sym] : null;
      minTrans[rep][sym] = dest ? stateToRep[dest] : '';
    });
  });

  /* Minimized states output */
  document.getElementById('min-states-output').innerHTML = buildInfoBox([
    `<span class="hi">Original states: ${workStates.length}</span>`,
    `<span class="hi">Minimized states: ${minStates.length}</span>`,
    `<span class="ok">States: { ${minStates.join(', ')} }</span>`,
    `<span class="ok">Start: ${minStart}</span>`,
    `<span class="ok">Final: { ${[...minFinal].join(', ')} }</span>`,
    `<span class="ok">State mapping: ${workStates.map(s => `${s}→${stateToRep[s]}`).join('  ')}</span>`
  ]);

  /* Minimized transition table */
  buildMinTable(minStates, DFA.alphabet, minStart, minFinal, minTrans);

  /* Minimized visualization */
  renderVisual('min-visual', minStates, DFA.alphabet, minStart, minFinal, minTrans);

  /* Summary */
  const reduced = DFA.states.length - minStates.length;
  document.getElementById('summary-output').innerHTML = `
    <div class="sum-card">
      <div class="sum-item">
        <div class="sum-val">${DFA.states.length}</div>
        <div class="sum-label">Original States</div>
      </div>
      <div class="sum-item">
        <div class="sum-val">${minStates.length}</div>
        <div class="sum-label">Minimized States</div>
      </div>
      <div class="sum-item">
        <div class="sum-val">${reduced}</div>
        <div class="sum-label">States Removed</div>
      </div>
      <div class="sum-item">
        <div class="sum-val">${iteration}</div>
        <div class="sum-label">Iterations</div>
      </div>
    </div>
  `;

  show('minimization-output');
  scrollTo('minimize-section');
  toast(`Minimization complete! ${reduced} state(s) removed.`, 'success');
}

/* ─── Helper: BFS to find reachable states ───── */
function getReachableStates(start, states, alphabet, transitions) {
  const visited = new Set();
  const queue   = [start];
  visited.add(start);

  while (queue.length) {
    const state = queue.shift();
    alphabet.forEach(sym => {
      const next = transitions[state] ? transitions[state][sym] : null;
      if (next && !visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    });
  }
  return visited;
}

/* ─── Helper: Build info box HTML ────────────── */
function buildInfoBox(lines) {
  return `<div class="info-box">${lines.map(l => `<div>${l}</div>`).join('')}</div>`;
}

/* ─── Helper: Render partition list HTML ─────── */
function buildPartitionDisplay(partitions, label = '', compact = false) {
  const inner = partitions.map((p, i) => `
    <div class="partition-group">
      <div class="p-label">P${i}</div>
      <div class="p-states">{ ${[...p].sort().join(', ')} }</div>
    </div>
  `).join('');

  return `
    ${label ? `<p style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-muted);margin-bottom:10px">${label}</p>` : ''}
    <div class="partition-list">${inner}</div>
  `;
}

/* ─── Build minimized transition table ───────── */
function buildMinTable(states, alphabet, startState, finalStates, transitions) {
  const tbl = document.getElementById('min-table');
  tbl.innerHTML = '';

  const thead = tbl.createTHead();
  const hr = thead.insertRow();
  ['State', ...alphabet].forEach(sym => {
    const th = document.createElement('th');
    th.textContent = sym === 'State' ? 'δ / State' : sym;
    hr.appendChild(th);
  });

  const tbody = tbl.createTBody();
  states.forEach(state => {
    const row = tbody.insertRow();
    const labelCell = row.insertCell();
    labelCell.className = 'state-label';

    const tags = [];
    if (state === startState)   tags.push('<span class="state-tag tag-start">START</span>');
    if (finalStates.has(state)) tags.push('<span class="state-tag tag-final">FINAL</span>');
    labelCell.innerHTML = state + tags.join('');

    alphabet.forEach(sym => {
      const cell = row.insertCell();
      cell.textContent = transitions[state] ? (transitions[state][sym] || '—') : '—';
    });
  });
}

/* ═══════════════════════════════════════════════════
   EXPORT — CSV
═══════════════════════════════════════════════════ */

function exportCSV(states, alphabet, startState, finalStates, transitions, filename) {
  const rows = [];
  // Header
  rows.push(['State', ...alphabet].join(','));

  states.forEach(state => {
    const label = `${state}${state === startState ? '(start)' : ''}${finalStates.has(state) ? '(final)' : ''}`;
    const dests = alphabet.map(sym => transitions[state] ? (transitions[state][sym] || '') : '');
    rows.push([label, ...dests].join(','));
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast(`Exported ${filename}`, 'success');
}

/* ═══════════════════════════════════════════════════
   EXAMPLE DFA LOADER
   Example: DFA that accepts strings over {0,1}
   ending with "01"
   States: q0, q1, q2, q3
   Alphabet: 0, 1
   Start: q0, Final: {q3}
═══════════════════════════════════════════════════ */

function loadExample() {
  // Set inputs
  document.getElementById('num-states').value = '4';
  document.getElementById('alphabet').value   = '0,1';

  // Generate table first
  generateTable();

  // Now set start/final
  document.getElementById('start-state').value = 'q0';
  const finalSel = document.getElementById('final-states');
  [...finalSel.options].forEach(o => { o.selected = o.value === 'q3'; });

  // Fill transitions
  // q0 --0--> q1, q0 --1--> q0
  // q1 --0--> q1, q1 --1--> q2
  // q2 --0--> q1, q2 --1--> q0   (dead / non-accepting merge candidate)
  // q3 --0--> q1, q3 --1--> q0
  // Note: q2 and q3 are equivalent in this classic example
  const table = {
    q0: { '0': 'q1', '1': 'q0' },
    q1: { '0': 'q1', '1': 'q2' },
    q2: { '0': 'q1', '1': 'q0' },
    q3: { '0': 'q1', '1': 'q0' },
  };
  ['q0','q1','q2','q3'].forEach(state => {
    ['0','1'].forEach(sym => {
      const sel = document.getElementById(`tr_${state}_${sym}`);
      if (sel) sel.value = table[state][sym];
    });
  });

  // Override: make q3 a final state dead-end actually reachable
  // Let's make it reachable: q1 --1--> q3 instead of q2
  document.getElementById('tr_q1_1').value = 'q3';
  // q3 transitions
  document.getElementById('tr_q3_0').value = 'q1';
  document.getElementById('tr_q3_1').value = 'q0';

  // q2 is now unreachable — good demo for minimization!

  toast('Example DFA loaded! (Accepts strings ending in "01")', 'info');
}

/* ═══════════════════════════════════════════════════
   RESET
═══════════════════════════════════════════════════ */

function resetAll() {
  // Reset DFA object
  DFA.states      = [];
  DFA.alphabet    = [];
  DFA.startState  = '';
  DFA.finalStates = new Set();
  DFA.transitions = {};

  // Reset form fields
  document.getElementById('num-states').value = '4';
  document.getElementById('alphabet').value   = '0,1';
  document.getElementById('start-state').innerHTML = '';
  document.getElementById('final-states').innerHTML = '';
  document.getElementById('transition-table').innerHTML = '';
  document.getElementById('test-string').value = '';
  document.getElementById('dfa-visual').innerHTML = '';
  document.getElementById('min-visual').innerHTML = '';
  document.getElementById('sim-steps').innerHTML = '';
  document.getElementById('sim-result').textContent = '';
  document.getElementById('minimization-output').style.display = 'none';
  document.getElementById('simulation-output').style.display = 'none';

  // Hide sections
  ['table-section','visual-section','tester-section','minimize-section']
    .forEach(id => { document.getElementById(id).style.display = 'none'; });

  toast('Simulator reset.', 'info');
}

/* ═══════════════════════════════════════════════════
   THEME TOGGLE
═══════════════════════════════════════════════════ */

function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  document.getElementById('theme-toggle').textContent = isLight ? '◐' : '◑';
  toast(isLight ? 'Light mode activated' : 'Dark mode activated', 'info');
}

/* ═══════════════════════════════════════════════════
   EVENT LISTENERS — Wire everything together
═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* Config section */
  document.getElementById('gen-table-btn').addEventListener('click', generateTable);

  /* Visualize button */
  document.getElementById('visualize-btn').addEventListener('click', visualizeDFA);

  /* String tester */
  document.getElementById('test-btn').addEventListener('click', testString);
  document.getElementById('test-string').addEventListener('keydown', e => {
    if (e.key === 'Enter') testString();
  });

  /* Minimization */
  document.getElementById('minimize-btn').addEventListener('click', minimizeDFA);

  /* Example */
  document.getElementById('example-btn').addEventListener('click', loadExample);

  /* Reset */
  document.getElementById('reset-btn').addEventListener('click', resetAll);

  /* Theme toggle */
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  /* Export original transition table CSV */
  document.getElementById('export-table-btn').addEventListener('click', () => {
    if (!validateDFA()) return;
    exportCSV(DFA.states, DFA.alphabet, DFA.startState, DFA.finalStates, DFA.transitions, 'dfa_original.csv');
  });

  /* Export minimized table CSV */
  document.getElementById('export-min-btn').addEventListener('click', () => {
    // Re-run minimization silently to get min data
    // Actually just re-read from the rendered table
    // We'll rely on minimizeDFA having been called — if not, prompt user
    const minTbl = document.getElementById('min-table');
    if (!minTbl.rows.length) {
      toast('Run minimization first!', 'error'); return;
    }
    // Parse min table from DOM
    const rows = [...minTbl.rows];
    const header = [...rows[0].cells].map(c => c.textContent.trim());
    const csvLines = [header.join(',')];
    rows.slice(1).forEach(row => {
      csvLines.push([...row.cells].map(c => c.textContent.trim().replace(/,/g,';')).join(','));
    });
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'dfa_minimized.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported dfa_minimized.csv', 'success');
  });

  /* Welcome toast */
  setTimeout(() => toast('Welcome! Load an example or configure your DFA.', 'info'), 600);
});


document.addEventListener('DOMContentLoaded', () => {

  /* Config section */
  document.getElementById('gen-table-btn').addEventListener('click', generateTable);

  /* Auto update when states/alphabet change */
  document.getElementById('num-states').addEventListener('change', generateTable);
  document.getElementById('alphabet').addEventListener('change', generateTable);

  /* Visualize button */
  document.getElementById('visualize-btn').addEventListener('click', visualizeDFA);

  /* String tester */
  document.getElementById('test-btn').addEventListener('click', testString);
  document.getElementById('test-string').addEventListener('keydown', e => {
    if (e.key === 'Enter') testString();
  });

  /* Minimization */
  document.getElementById('minimize-btn').addEventListener('click', minimizeDFA);

  /* Example */
  document.getElementById('example-btn').addEventListener('click', loadExample);

  /* Reset */
  document.getElementById('reset-btn').addEventListener('click', resetAll);

  /* Theme toggle */
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  /* Export original transition table CSV */
  document.getElementById('export-table-btn').addEventListener('click', () => {
    if (!validateDFA()) return;

    exportCSV(
      DFA.states,
      DFA.alphabet,
      DFA.startState,
      DFA.finalStates,
      DFA.transitions,
      'dfa_original.csv'
    );
  });

  /* Export minimized table CSV */
  document.getElementById('export-min-btn').addEventListener('click', () => {
    const minTbl = document.getElementById('min-table');

    if (!minTbl.rows.length) {
      toast('Run minimization first!', 'error');
      return;
    }

    const rows = [...minTbl.rows];
    const header = [...rows[0].cells].map(c => c.textContent.trim());
    const csvLines = [header.join(',')];

    rows.slice(1).forEach(row => {
      csvLines.push(
        [...row.cells]
          .map(c => c.textContent.trim().replace(/,/g, ';'))
          .join(',')
      );
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'dfa_minimized.csv';
    a.click();

    URL.revokeObjectURL(url);
    toast('Exported dfa_minimized.csv', 'success');
  });

  /* Welcome toast */
  setTimeout(() => {
    toast('Welcome! Load an example or configure your DFA.', 'info');
  }, 600);

  /* AUTO LOAD STATES ON PAGE OPEN */
  generateTable();

});
