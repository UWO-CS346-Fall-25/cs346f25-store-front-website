// Stock manager inline editing

// Define these functions globally first
function closeStockModal() {
  const modal = document.getElementById('stock-edit-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function openStockModal(productId, productName, currentStock) {
  const productIdInput = document.getElementById('modal-product-id');
  const productNameInput = document.getElementById('modal-product-name');
  const stockQuantityInput = document.getElementById('modal-stock-quantity');

  if (!productIdInput || !productNameInput || !stockQuantityInput) {
    console.error('Modal inputs not found');
    return;
  }

  productIdInput.value = productId;
  productNameInput.value = productName;
  stockQuantityInput.value = currentStock;

  const modal = document.getElementById('stock-edit-modal');
  if (modal) {
    modal.style.display = 'flex';
    stockQuantityInput.focus();
    stockQuantityInput.select();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Make entire rows clickable to edit stock
  const table = document.querySelector('.data-table--products');
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr[data-stock-status]');
  const stockColumnIndex = 3; // Columns: image (0), name (1), sku (2), stock (3)

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length > stockColumnIndex) {
      // Make the entire row clickable
      row.style.cursor = 'pointer';

      row.addEventListener('click', function () {
        const stockCell = cells[stockColumnIndex];
        const badge = stockCell.querySelector('[data-product-id]');
        if (!badge) {
          console.warn('No product ID found in stock cell');
          return;
        }

        const productId = badge.getAttribute('data-product-id');
        const currentStock = parseInt(badge.getAttribute('data-stock-quantity'), 10) || 0;

        // Get product name from the name column (index 1)
        const nameCell = cells[1];
        const productName = nameCell?.textContent?.trim() || 'Product';

        openStockModal(productId, productName, currentStock);
      });
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('stock-edit-modal');
      if (modal && modal.style.display !== 'none') {
        closeStockModal();
      }
    }
  });

  // Update form action when submitting
  const form = document.getElementById('stock-edit-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      const productId = document.getElementById('modal-product-id').value;
      if (!productId) {
        e.preventDefault();
        alert('Error: Product ID not set');
        return;
      }
      form.action = `/admin/stock/${productId}/update`;
    });
  }

  // Close modal when clicking backdrop or Cancel button
  const modal = document.getElementById('stock-edit-modal');
  if (modal) {
    const backdrop = modal.querySelector('.modal__backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeStockModal);
    }

    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeStockModal);
    }
  }


});


