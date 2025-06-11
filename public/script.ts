// Types
interface SelectedImageData {
  filename: string;
  src: string;
}

interface UploadedFile {
  filename: string;
  path: string;
}

// Global state
let selectedImageData: SelectedImageData | null = null;

function setupImageSelection(): void {
  console.debug('Setting up image selection...');
  const gallery: HTMLElement | null = document.getElementById('gallery');
  if (!gallery) {
    console.error('Gallery element not found');
    return;
  }
  console.debug('Gallery element found, attaching click listener');

  gallery.addEventListener('click', function (e: MouseEvent): void {
    console.debug('Gallery clicked:', e.target);
    const target = e.target as HTMLImageElement;
    if (target.tagName === 'IMG') {
      console.debug('Image clicked:', target.src);
      gallery
        .querySelectorAll('img')
        .forEach((img: HTMLImageElement) => img.classList.remove('selected'));
      target.classList.add('selected');
      selectedImageData = {
        filename: target.dataset.filename || target.alt,
        src: target.src,
      };
      console.debug('Selected image data:', selectedImageData);

      const resizeSection: HTMLElement | null = document.getElementById('resizeSection');
      if (resizeSection) {
        resizeSection.style.display = 'block';
        console.debug('Resize section displayed');
      } else {
        console.error('Resize section not found');
      }

      const tempImg = new Image();
      tempImg.onload = function (): void {
        console.debug('Original image loaded, dimensions:', {
          width: tempImg.naturalWidth,
          height: tempImg.naturalHeight,
        });
        const widthInput = document.getElementById(
          'newWidth'
        ) as HTMLInputElement;
        const heightInput = document.getElementById(
          'newHeight'
        ) as HTMLInputElement;
        if (widthInput && heightInput) {
          widthInput.placeholder = tempImg.naturalWidth.toString();
          heightInput.placeholder = tempImg.naturalHeight.toString();
          console.debug('Set placeholder dimensions:', {
            width: tempImg.naturalWidth,
            height: tempImg.naturalHeight,
          });
        } else {
          console.error('Width or height input not found');
        }
      };
      tempImg.src = target.src;
    }
  });
  console.debug('Image selection setup complete');
}

function addImageToGallery(file: UploadedFile): void {
  console.debug('Adding image to gallery:', file);
  const gallery = document.getElementById('gallery');
  if (!gallery) {
    console.error('Gallery element not found');
    return;
  }
  const img = document.createElement('img');
  img.src = file.path;
  img.alt = file.filename;
  img.dataset.filename = file.filename;
  gallery.appendChild(img);
  console.debug('Image added to gallery successfully');
}

// Function to handle copying URLs to clipboard
function copyToClipboard(text: string, event: MouseEvent): void {
  console.debug('Attempting to copy to clipboard:', text);
  navigator.clipboard
    .writeText(text)
    .then(function (): void {
      console.debug('Successfully copied to clipboard');
      const button = event.target as HTMLButtonElement;
      const originalText = button.textContent;
      if (originalText) {
        button.textContent = '✅ Copied!';
        button.style.background = '#28a745';
        setTimeout((): void => {
          button.textContent = originalText;
          button.style.background = '#007bff';
          console.debug('Button state reset');
        }, 2000);
      }
    })
    .catch(function (err: unknown): void {
      console.error('Failed to copy to clipboard:', err);
    });
}

// Function to handle image resizing with shareable URLs
function setupImageResize(): void {
  console.debug('Setting up image resize functionality...');
  const resizeBtn = document.getElementById('resizeBtn');
  const resizeStatus = document.getElementById('resizeStatus');
  if (!resizeBtn || !resizeStatus) {
    console.error('Resize button or status element not found');
    return;
  }

  resizeBtn.addEventListener('click', async function (): Promise<void> {
    console.debug('Resize button clicked');
    if (!selectedImageData) {
      console.warn('No image selected for resize');
      resizeStatus.textContent = 'Please select an image first';
      resizeStatus.style.color = 'red';
      return;
    }

    const widthInput = document.getElementById('newWidth') as HTMLInputElement;
    const heightInput = document.getElementById(
      'newHeight'
    ) as HTMLInputElement;
    if (!widthInput || !heightInput) {
      console.error('Width or height input not found');
      return;
    }

    const newWidth = parseInt(widthInput.value);
    const newHeight = parseInt(heightInput.value);
    console.debug('Resize dimensions:', { width: newWidth, height: newHeight });

    if (
      isNaN(newWidth) ||
      isNaN(newHeight) ||
      newWidth <= 0 ||
      newHeight <= 0
    ) {
      console.warn('Invalid dimensions provided');
      resizeStatus.textContent = 'Please enter valid width and height';
      resizeStatus.style.color = 'red';
      return;
    }

    try {
      resizeStatus.textContent = 'Resizing image...';
      resizeStatus.style.color = 'blue';
      const baseUrl = window.location.origin;
      const imageUrl = `${baseUrl}/api/resize-image?src=${selectedImageData.filename}&width=${newWidth}&height=${newHeight}`;
      console.debug('Generated resize URL:', imageUrl);

      const testImg = new Image();
      testImg.onload = function (): void {
        console.debug('Resized image loaded successfully');
        resizeStatus.innerHTML = `
                    <div style="color: green; margin-bottom: 15px;">
                        ✅ Image resized successfully! New size: ${newWidth}×${newHeight}
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
                        <strong>Shareable URL:</strong><br>
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="text" id="shareableUrl" value="${imageUrl}" 
                                   style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; font-family: 'Courier New', monospace;" readonly>
                            <button onclick="copyToClipboard('${imageUrl}', event)" 
                                    style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">
                                📋 Copy
                            </button>
                        </div>
                        <div style="font-size: 12px; color: #6c757d; margin-top: 8px;">
                            💡 Copy this URL and paste it anywhere to share the resized image!
                        </div>
                    </div>
                `;

        const resizedContainer = document.getElementById(
          'resizedImageContainer'
        );
        const resizedPreview = document.getElementById('resizedImagePreview');
        if (!resizedContainer || !resizedPreview) {
          console.error('Resized container or preview not found');
          return;
        }

        console.debug('Creating resized image preview');
        resizedPreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = imageUrl + '&t=' + Date.now();
        img.alt = `Resized ${selectedImageData?.filename || 'image'}`;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.border = '2px solid #28a745';
        img.style.borderRadius = '10px';
        resizedPreview.appendChild(img);
        resizedContainer.style.display = 'block';
        console.debug('Resized image preview created');

        widthInput.value = '';
        heightInput.value = '';
      };

      testImg.onerror = function (): void {
        console.error('Failed to load resized image');
        resizeStatus.textContent =
          'Failed to create resized image. Make sure the backend endpoint is running.';
        resizeStatus.style.color = 'red';
      };

      console.debug('Loading resized image...');
      testImg.src = imageUrl;
    } catch (error) {
      console.error('Resize error:', error);
      resizeStatus.textContent =
        'Resize failed: ' +
        (error instanceof Error ? error.message : String(error));
      resizeStatus.style.color = 'red';
    }
  });
  console.debug('Image resize setup complete');
}

// Upload form handler
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
  console.debug('Setting up upload form handler...');
  uploadForm.addEventListener('submit', async function (e: Event): Promise<void> {
    e.preventDefault();
    console.debug('Upload form submitted');

    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    const statusDiv = document.getElementById('uploadStatus');
    if (!fileInput || !statusDiv || !fileInput.files) {
      console.error('File input or status div not found');
      return;
    }

    const files = fileInput.files;
    console.debug('Files selected:', files.length);

    if (files.length === 0) {
      console.warn('No files selected');
      statusDiv.textContent = 'Please select at least one image';
      statusDiv.style.color = 'red';
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
      console.debug('Added file to form data:', files[i].name);
    }

    try {
      statusDiv.textContent = 'Uploading...';
      statusDiv.style.color = 'blue';
      console.debug('Sending upload request...');

      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.debug('Upload successful:', result);
        statusDiv.textContent = `${result.files.length} image(s) uploaded successfully!`;
        statusDiv.style.color = 'green';

        result.files.forEach((file: UploadedFile) => {
          addImageToGallery(file);
        });

        fileInput.value = '';
        console.debug('Upload process completed');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      statusDiv.textContent =
        'Upload failed: ' +
        (error instanceof Error ? error.message : String(error));
      statusDiv.style.color = 'red';
    }
  });
  console.debug('Upload form handler setup complete');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function (): void {
  console.debug('DOM Content Loaded - Initializing Image Gallery App...');

  // Debug gallery initialization
  const gallery = document.getElementById('gallery');
  if (gallery) {
    console.debug('Gallery element found:', gallery);
    console.debug('Current gallery content:', gallery.innerHTML);
  } else {
    console.error('Gallery element not found during initialization');
  }

  setupImageSelection();
  setupImageResize();
  console.debug('Image Gallery App Initialized');
});

// Simple function for unit testing
export function add(a: number, b: number): number {
  return a + b;
}
