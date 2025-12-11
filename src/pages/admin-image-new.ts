import type { Context } from "hono";

export function handleAdminImageNew(c: Context<{ Bindings: Env }>) {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
	<title>Upload Image - Coffey</title>
	<style>
		body {
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
			font-family: system-ui, -apple-system, sans-serif;
		}

		#dev-banner {
			display: none;
			background: #ff9800;
			color: #000;
			padding: 10px;
			text-align: center;
			font-weight: bold;
			font-size: 18px;
			border-bottom: 3px solid #f57c00;
			margin: -20px -20px 20px -20px;
		}

		h1 {
			margin-bottom: 20px;
		}

		.form-group {
			margin-bottom: 20px;
		}

		label {
			display: block;
			margin-bottom: 8px;
			font-weight: 600;
		}

		input[type="file"] {
			font-size: 16px;
			padding: 8px;
			border: 2px solid #ddd;
			border-radius: 4px;
			width: 100%;
			box-sizing: border-box;
		}

		button {
			font-size: 16px;
			padding: 12px 24px;
			background: #4CAF50;
			color: white;
			border: none;
			border-radius: 4px;
			cursor: pointer;
		}

		button:hover {
			background: #45a049;
		}

		button:disabled {
			background: #ccc;
			cursor: not-allowed;
		}

		#preview {
			margin-top: 15px;
			max-width: 100%;
		}

		#preview img {
			max-width: 100%;
			border: 2px solid #ddd;
			border-radius: 4px;
		}

		#result {
			margin-top: 30px;
			padding: 20px;
			background: #f9f9f9;
			border: 2px solid #4CAF50;
			border-radius: 4px;
			display: none;
		}

		#result.error {
			border-color: #f44336;
			background: #ffebee;
		}

		#result h2 {
			margin-top: 0;
		}

		.object-key {
			font-family: monospace;
			background: #fff;
			padding: 10px;
			border: 1px solid #ddd;
			border-radius: 4px;
			word-break: break-all;
			margin: 10px 0;
		}

		.metadata {
			background: #fff;
			padding: 15px;
			border: 1px solid #ddd;
			border-radius: 4px;
			max-height: 400px;
			overflow-y: auto;
			font-family: monospace;
			font-size: 12px;
			white-space: pre-wrap;
		}

		.image-link {
			display: inline-block;
			margin-top: 15px;
			color: #2196F3;
			text-decoration: none;
			font-weight: 600;
		}

		.image-link:hover {
			text-decoration: underline;
		}

		#status {
			margin: 15px 0;
			padding: 10px;
			border-radius: 4px;
		}

		#status.success {
			background: #d4edda;
			color: #155724;
			border: 1px solid #c3e6cb;
		}

		#status.error {
			background: #f8d7da;
			color: #721c24;
			border: 1px solid #f5c6cb;
		}

		/* Debug box */
		#debug-box {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			max-height: 300px;
			background: #1e1e1e;
			color: #d4d4d4;
			border-top: 3px solid #ff9800;
			font-family: monospace;
			font-size: 12px;
			z-index: 10000;
		}
		#debug-header {
			background: #333;
			padding: 8px 10px;
			border-bottom: 1px solid #555;
		}
		#debug-content {
			padding: 10px;
			overflow-y: auto;
			max-height: 250px;
		}
		.debug-msg {
			margin: 2px 0;
			padding: 2px 0;
			border-bottom: 1px solid #333;
		}
	</style>
</head>
<body>
	<div id="dev-banner">⚠️ DEVELOPMENT SERVER ⚠️</div>

	<h1>Upload Image</h1>

	<form id="upload-form" onsubmit="uploadImage(event)">
		<div class="form-group">
			<label for="image-file">Select Image (JPEG, PNG, GIF, WebP)</label>
			<input type="file" id="image-file" accept="image/jpeg,image/png,image/gif,image/webp" required>
		</div>

		<div id="preview"></div>

		<div class="form-group">
			<button type="submit" id="upload-btn">Upload Image</button>
		</div>
	</form>

	<div id="status"></div>

	<div id="result"></div>

	<div id="debug-box" style="display: none;">
		<div id="debug-header">
			<strong>Debug Console</strong>
			<button onclick="clearDebug()" style="float: right; margin-left: 10px;">Clear</button>
			<button onclick="toggleDebug()" style="float: right;">Hide</button>
		</div>
		<div id="debug-content"></div>
	</div>

	<script>
		// ========== DEBUG CONSOLE ==========

		const params = new URLSearchParams(window.location.search);
		const debugEnabled = params.has('debug') || window.location.hostname === 'dev.eick.com';

		function addDebugMessage(type, msg) {
			const content = document.getElementById('debug-content');
			if (!content) return;
			const time = new Date().toLocaleTimeString();
			const color = type === 'ERROR' ? '#ff6b6b' : '#4dabf7';
			content.innerHTML += '<div class="debug-msg"><span style="color: ' + color + '">[' + type + ']</span> [' + time + '] ' + msg + '</div>';
			content.scrollTop = content.scrollHeight;
		}

		function clearDebug() {
			document.getElementById('debug-content').innerHTML = '';
		}

		function toggleDebug() {
			const box = document.getElementById('debug-box');
			box.style.display = box.style.display === 'none' ? 'block' : 'none';
		}

		if (debugEnabled) {
			document.getElementById('debug-box').style.display = 'block';
		}


		window.onerror = function(msg, url, line, col, error) {
			if (debugEnabled) {
				addDebugMessage('ERROR', msg + ' at ' + line + ':' + col);
			}
			return false;
		};

		window.addEventListener('unhandledrejection', function(event) {
			if (debugEnabled) {
				addDebugMessage('ERROR', 'Unhandled promise: ' + event.reason);
			}
		});


		// ========== DEV BANNER ==========

		if (window.location.hostname === 'dev.eick.com') {
			document.getElementById('dev-banner').style.display = 'block';
		}

		// ========== IMAGE PREVIEW ==========

		document.getElementById('image-file').addEventListener('change', function(e) {
			const file = e.target.files[0];
			const preview = document.getElementById('preview');

			if (file) {
				const reader = new FileReader();
				reader.onload = function(e) {
					preview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
				};
				reader.readAsDataURL(file);
			} else {
				preview.innerHTML = '';
			}
		});

		// ========== IMAGE UPLOAD ==========

		async function uploadImage(e) {
			e.preventDefault();

			const fileInput = document.getElementById('image-file');
			const file = fileInput.files[0];
			const uploadBtn = document.getElementById('upload-btn');
			const statusDiv = document.getElementById('status');
			const resultDiv = document.getElementById('result');

			if (!file) {
				showStatus('Please select an image file', 'error');
				return;
			}

			try {
				uploadBtn.disabled = true;
				uploadBtn.textContent = 'Uploading...';
				showStatus('Uploading image...', 'success');

				const formData = new FormData();
				formData.append('file', file);


				const response = await fetch('/api/admin/images', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || 'Upload failed');
				}

				const result = await response.json();

				showStatus('Image uploaded successfully!', 'success');
				displayResult(result);

			} catch (error) {
				showStatus('Upload failed: ' + error.message, 'error');
				resultDiv.style.display = 'none';
			} finally {
				uploadBtn.disabled = false;
				uploadBtn.textContent = 'Upload Image';
			}
		}

		function showStatus(message, type) {
			const statusDiv = document.getElementById('status');
			statusDiv.textContent = message;
			statusDiv.className = type;
			statusDiv.style.display = 'block';
		}

		function displayResult(data) {
			const resultDiv = document.getElementById('result');

			resultDiv.innerHTML = '<h2>✅ Image uploaded successfully!</h2>' +
				'<p><button onclick="resetForm()">Upload Another Image</button></p>';

			resultDiv.className = '';
			resultDiv.style.display = 'block';
		}

		function resetForm() {
			document.getElementById('upload-form').reset();
			document.getElementById('preview').innerHTML = '';
			document.getElementById('result').style.display = 'none';
			document.getElementById('status').style.display = 'none';
		}
	</script>
</body>
</html>`;

	return c.html(html);
}
