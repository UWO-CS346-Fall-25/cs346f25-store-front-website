(function () {
  const input = document.getElementById('images');
  const previewBar = document.getElementById('image-preview-bar');

  if (!input || !previewBar) return;

  input.addEventListener('change', () => {
    const files = Array.from(input.files || []);

    // Remove old upload previews but KEEP existing images
    const oldUploads = previewBar.querySelectorAll('[data-source="upload"]');
    oldUploads.forEach((el) => el.remove());

    if (!files.length) return;

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'image-preview-thumb';
      wrapper.dataset.source = 'upload';

      const img = document.createElement('img');
      img.alt = file.name;
      wrapper.appendChild(img);
      previewBar.appendChild(wrapper);

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result; // data: URL (allowed by your CSP)
      };
      reader.readAsDataURL(file);
    });
  });
})();
