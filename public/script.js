let selectedImageData = null;

// Function to handle image selection
function setupImageSelection() {
    const gallery = document.getElementById('gallery');
    
    gallery.addEventListener('click', function(e) {
        if (e.target.tagName === 'IMG') {
            // Remove selection from all images
            gallery.querySelectorAll('img').forEach(img => img.classList.remove('selected'));
            
            // Select clicked image
            e.target.classList.add('selected');
            
            // Store selected image data for resizing
            selectedImageData = {
                filename: e.target.dataset.filename || e.target.alt,
                src: e.target.src
            };
            
            // Show resize section
            document.getElementById('resizeSection').style.display = 'block';
            
            // Set placeholder dimensions
            const tempImg = new Image();
            tempImg.onload = function() {
                document.getElementById('newWidth').placeholder = tempImg.naturalWidth;
                document.getElementById('newHeight').placeholder = tempImg.naturalHeight;
            };
            tempImg.src = e.target.src;
        }
    });
}

// Function to add image to gallery
function addImageToGallery(file) {
    const gallery = document.getElementById('gallery');
    const img = document.createElement('img');
    img.src = file.path;
    img.alt = file.filename;
    img.dataset.filename = file.filename;
    
    gallery.appendChild(img);
}

// Function to handle copying URLs to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        // Show success feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#007bff';
        }, 2000);
    }).catch(function(err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        alert('URL copied to clipboard!');
    });
}

// Function to handle image resizing with shareable URLs
function setupImageResize() {
    const resizeBtn = document.getElementById('resizeBtn');
    const resizeStatus = document.getElementById('resizeStatus');
    
    resizeBtn.addEventListener('click', async function() {
        if (!selectedImageData) {
            resizeStatus.textContent = 'Please select an image first';
            resizeStatus.style.color = 'red';
            return;
        }
        
        const newWidth = parseInt(document.getElementById('newWidth').value);
        const newHeight = parseInt(document.getElementById('newHeight').value);
        
        if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) {
            resizeStatus.textContent = 'Please enter valid width and height';
            resizeStatus.style.color = 'red';
            return;
        }
        
        try {
            resizeStatus.textContent = 'Resizing image...';
            resizeStatus.style.color = 'blue';
            
            // Create the shareable URL
            const baseUrl = window.location.origin; // Gets http://localhost:3000
            const imageUrl = `${baseUrl}/api/resize-image?src=${selectedImageData.filename}&width=${newWidth}&height=${newHeight}`;
            
            // Test if the URL works by loading the image
            const testImg = new Image();
            testImg.onload = function() {
                // Success! Display the results
                resizeStatus.innerHTML = `
                    <div style="color: green; margin-bottom: 15px;">
                        ✅ Image resized successfully! New size: ${newWidth}×${newHeight}
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
                        <strong>Shareable URL:</strong><br>
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                            <input type="text" id="shareableUrl" value="${imageUrl}" 
                                   style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; font-family: 'Courier New', monospace;" readonly>
                            <button onclick="copyToClipboard('${imageUrl}')" 
                                    style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">
                                📋 Copy
                            </button>
                        </div>
                        <div style="font-size: 12px; color: #6c757d; margin-top: 8px;">
                            💡 Copy this URL and paste it anywhere to share the resized image!
                        </div>
                    </div>
                `;
                
                // Show resized image preview
                const resizedContainer = document.getElementById('resizedImageContainer');
                const resizedPreview = document.getElementById('resizedImagePreview');
                
                // Clear previous preview
                resizedPreview.innerHTML = '';
                
                // Create preview image
                const img = document.createElement('img');
                img.src = imageUrl + '&t=' + Date.now(); // Add timestamp to prevent caching during testing
                img.alt = `Resized ${selectedImageData.filename}`;
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.border = '2px solid #28a745';
                img.style.borderRadius = '10px';
                
                resizedPreview.appendChild(img);
                resizedContainer.style.display = 'block';
                
                // Clear inputs
                document.getElementById('newWidth').value = '';
                document.getElementById('newHeight').value = '';
            };
            
            testImg.onerror = function() {
                resizeStatus.textContent = 'Failed to create resized image. Make sure the backend endpoint is running.';
                resizeStatus.style.color = 'red';
            };
            
            // Start loading the image to test the URL
            testImg.src = imageUrl;
                                        
        } catch (error) {
            resizeStatus.textContent = 'Resize failed: ' + error.message;
            resizeStatus.style.color = 'red';
        }
    });
}

// Upload form handler
document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('imageInput');
    const files = fileInput.files;
    const statusDiv = document.getElementById('uploadStatus');
    
    if (files.length === 0) {
        statusDiv.textContent = 'Please select at least one image';
        statusDiv.style.color = 'red';
        return;
    }
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }
    
    try {
        statusDiv.textContent = 'Uploading...';
        statusDiv.style.color = 'blue';
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            statusDiv.textContent = `${result.files.length} image(s) uploaded successfully!`;
            statusDiv.style.color = 'green';
            
            // Add uploaded images to the main gallery
            result.files.forEach(file => {
                addImageToGallery(file);
            });
            
            fileInput.value = '';
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        statusDiv.textContent = 'Upload failed: ' + error.message;
        statusDiv.style.color = 'red';
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupImageSelection();
    setupImageResize();
    
    // Add some helpful console logs for debugging
    console.log('Image Gallery App Initialized');
    console.log('Make sure your server has the /api/resize-image endpoint for URL generation');
});