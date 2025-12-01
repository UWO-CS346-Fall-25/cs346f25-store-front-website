// Convert top-level TODO list items into card elements for better visual display.
document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('.todo-markdown');
  if (!container) return;

  // Find top-level lists (direct children that are <ul> beneath headings or the container)
  const topLists = Array.from(container.querySelectorAll(':scope > ul, :scope > * > ul'))
    .filter(ul => ul.closest('.todo-markdown') === container);

  topLists.forEach(ul => {
    // Create a flex/grid wrapper to contain cards
    const wrapper = document.createElement('div');
    wrapper.className = 'todo-cards-grid';

    // For each direct li in the ul, create a card
    Array.from(ul.children).forEach(li => {
      if (li.tagName !== 'LI') return;

      const card = document.createElement('article');
      card.className = 'todo-card';

      // Completed checkbox detection: either [x] at the start or <input type="checkbox" checked>
      let completed = false;
      const text = li.textContent || '';
      const leading = text.trim().slice(0, 3).toLowerCase();
      if (leading.startsWith('[x]') || leading.startsWith('[X]')) completed = true;

      if (completed) card.classList.add('completed');

      // Move the li's children into the card body
      const cardBody = document.createElement('div');
      cardBody.className = 'todo-card-body';

      // If li contains nested lists, preserve them below the card content
      // Clone children to avoid removing from original while iterating
      const children = Array.from(li.childNodes);
      children.forEach(child => {
        cardBody.appendChild(child.cloneNode(true));
      });

      card.appendChild(cardBody);

      // Replace plain leading [ ] or [x] text markers with a visual checkbox
      const checkbox = document.createElement('div');
      checkbox.className = 'todo-card-checkbox';
      checkbox.innerHTML = completed ? '&#x2714;' : '';
      card.insertBefore(checkbox, cardBody);

      wrapper.appendChild(card);
    });

    // Replace the original ul with the wrapper
    ul.parentNode.replaceChild(wrapper, ul);
  });

  // Optionally, also convert top-level checklist items inside headings (e.g., sections)
});
