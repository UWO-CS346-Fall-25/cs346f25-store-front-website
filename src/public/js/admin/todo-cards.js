// Build section cards from H2/H3 structure: H2 = section title, H3 = card
document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('.todo-markdown');
  if (!container) return;

  const nodes = Array.from(container.childNodes);
  const frag = document.createDocumentFragment();

  let currentGrid = null; // current .todo-cards-grid for the latest H2

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!node) continue;

    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H2') {
      // Create a section with title and cards grid
      const section = document.createElement('section');
      section.className = 'todo-section';
      const title = node.cloneNode(true);
      title.classList.add('todo-section-title');
      const grid = document.createElement('div');
      grid.className = 'todo-cards-grid';
      section.appendChild(title);
      section.appendChild(grid);
      frag.appendChild(section);
      currentGrid = grid;
      continue;
    }

    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H3') {
      const card = document.createElement('article');
      card.className = 'todo-card';

      const body = document.createElement('div');
      body.className = 'todo-card-body';

      // ❌ OLD: header inside body
      // const header = document.createElement('h3');
      // header.className = 'todo-card-title';
      // header.innerHTML = node.innerHTML;
      // body.appendChild(header);

      // ✅ NEW: header as sibling before body
      const header = document.createElement('div'); // or 'h3' if you prefer
      header.className = 'todo-card-title';
      header.innerHTML = node.innerHTML;

      card.appendChild(header);
      card.appendChild(body);

      // Collect following nodes into body (unchanged)
      let j = i + 1;
      for (; j < nodes.length; j++) {
        const next = nodes[j];
        if (!next) continue;
        if (
          next.nodeType === Node.ELEMENT_NODE &&
          (next.tagName === 'H2' || next.tagName === 'H3')
        ) {
          break; // stop before next heading
        }
        body.appendChild(next.cloneNode(true));
      }

      // Simple completed detection: if body contains "[x]" and no "[ ]"
      const txt = body.textContent || '';
      const hasChecked = txt.indexOf('[x]') !== -1 || txt.indexOf('[X]') !== -1;
      const hasUnchecked = txt.indexOf('[ ]') !== -1;
      if (hasChecked && !hasUnchecked) {
        card.classList.add('completed');
        checkbox.innerHTML = '&#x2714;';
      }

      // card.appendChild(checkbox);
      card.appendChild(body);

      // Inject checkboxes for each list item inside this card
      addItemCheckboxes(body);

      // Ensure there is a grid to append to; if not, create a default one
      if (!currentGrid) {
        const defaultGrid = document.createElement('div');
        defaultGrid.className = 'todo-cards-grid';
        frag.appendChild(defaultGrid);
        currentGrid = defaultGrid;
      }
      currentGrid.appendChild(card);

      // Advance i to j-1 (outer loop will i++)
      i = j - 1;
      continue;
    }

    // Anything else: if not inside a section, just append to frag
    // Preserve original nodes like paragraphs or H1
    if (!currentGrid) {
      frag.appendChild(node.cloneNode(true));
    } else {
      // If we are inside a section but encounter other nodes (e.g., a paragraph between H2 and first H3), append it above the grid
      // Find the parent section (last appended element)
      const last = frag.lastElementChild;
      if (last && last.classList && last.classList.contains('todo-section')) {
        // insert the node before the grid inside the section
        const grid = last.querySelector('.todo-cards-grid');
        last.insertBefore(node.cloneNode(true), grid);
      } else {
        frag.appendChild(node.cloneNode(true));
      }
    }
  }

  // Replace container content with newly built fragment
  container.innerHTML = '';
  container.appendChild(frag);
  // Ensure any remaining list items (outside cards) also get item-level checkboxes
  addItemCheckboxes(container);
});

// Helper: add checkbox UI to each list item under a container element
function addItemCheckboxes(root) {
  if (!root) return;
  const listItems = Array.from(root.querySelectorAll('li'));
  listItems.forEach((li) => {
    if (li.dataset.todoCheckboxProcessed) return;
    li.dataset.todoCheckboxProcessed = '1';

    // Detect explicit markdown markers like "[x]" or "[ ]" at start
    const raw = li.textContent || '';
    const checkedMatch = raw.match(/^\s*\[[xX]\]\s*/);
    const uncheckedMatch = raw.match(/^\s*\[\s\]\s*/);
    let checked = false;
    if (checkedMatch) {
      checked = true;
      // remove the marker text from the visible content
      // remove only the first occurrence from the text nodes inside li
      stripLeadingMarker(li, checkedMatch[0]);
    } else if (uncheckedMatch) {
      // leave unchecked but remove marker
      stripLeadingMarker(li, uncheckedMatch[0]);
    }

    // If li contains an actual checkbox input, read its checked state
    const input = li.querySelector('input[type=checkbox]');
    if (input) {
      checked = !!input.checked;
      // Remove the input visually but keep it in the DOM for forms (hide)
      input.style.display = 'none';
    }

    const cb = document.createElement('button');
    cb.type = 'button';
    cb.className = 'todo-item-checkbox';
    cb.setAttribute('aria-pressed', checked ? 'true' : 'false');
    cb.innerHTML = checked ? '&#x2714;' : '';

    if (checked) {
      li.classList.add('item-completed');
    }

    // Make the checkbox toggle completion on click
    cb.addEventListener('click', () => {
      const nowChecked = !li.classList.contains('item-completed');
      if (nowChecked) {
        li.classList.add('item-completed');
        cb.innerHTML = '&#x2714;';
        cb.setAttribute('aria-pressed', 'true');
      } else {
        li.classList.remove('item-completed');
        cb.innerHTML = '';
        cb.setAttribute('aria-pressed', 'false');
      }
    });

    // Insert checkbox at the start of the li content
    // If the first child is a text node, insert before it to keep semantics
    if (li.firstChild) {
      li.insertBefore(cb, li.firstChild);
    } else {
      li.appendChild(cb);
    }
  });
}

function stripLeadingMarker(li, markerText) {
  // Walk text nodes and remove markerText from the first text node that contains it
  const walker = document.createTreeWalker(
    li,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  let n;
  while ((n = walker.nextNode())) {
    const idx = n.nodeValue.indexOf(markerText);
    if (idx !== -1) {
      n.nodeValue =
        n.nodeValue.slice(0, idx) + n.nodeValue.slice(idx + markerText.length);
      break;
    }
  }
}
