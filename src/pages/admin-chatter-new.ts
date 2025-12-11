import type { Context } from "hono";

export function handleAdminChatterNew(c: Context<{ Bindings: Env }>) {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
	<title>Create Chatter - Coffey</title>
	<style>
		body {
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
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
		}

		/* Prevent mobile zoom on input focus */
		input, textarea, select {
			font-size: 20px;
		}
	</style>
</head>
<body>
	<div id="dev-banner">⚠️ DEVELOPMENT SERVER ⚠️</div>

	<h1>Create Chatter</h1>

	<div id="status"></div>
	<div id="error"></div>

	<button id="location-btn" onclick="requestLocation()">Enable Location</button>

	<form id="form" onsubmit="submitForm(event)">
		<label for="title">Title (optional)</label>
		<input type="text" id="title" placeholder="Optional title">
		<br><br>

		<label for="content">Content (optional)</label><br>
		<textarea id="content" rows="5" cols="50" placeholder="What's happening?"></textarea>
		<br><br>

		<label for="comment">Comment (optional)</label><br>
		<textarea id="comment" rows="3" cols="50" placeholder="Private notes about this chatter"></textarea>
		<br><br>

		<label>Links (optional)</label><br>
		<div id="links-container"></div>
		<button type="button" onclick="addLinkField()">+ Add Link</button>
		<br><br>

		<label>Images (optional)</label><br>
		<input type="file" id="image-files" accept="image/jpeg,image/png,image/gif,image/webp" multiple>
		<div id="image-preview-container" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px;"></div>
		<br><br>

		<button type="submit">Create Chatter</button>
	</form>

	<div id="places"></div>

	<div id="filters" style="margin: 20px 0; padding: 15px; border: 1px solid #ccc; background: #f9f9f9;">
		<h3 style="margin-top: 0;">Filter Places by Category</h3>
		<button type="button" onclick="selectAllCategories()" style="margin-bottom: 10px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Select All</button>
		<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
			<label><input type="checkbox" id="filter_food_drink" value="food_drink" onchange="toggleCategory('food_drink')" checked> Food & Drink</label>
			<label><input type="checkbox" id="filter_coffee_tea" value="coffee_tea" onchange="toggleCategory('coffee_tea')" checked> Coffee & Tea</label>
			<label><input type="checkbox" id="filter_dessert" value="dessert" onchange="toggleCategory('dessert')" checked> Desserts & Bakeries</label>
			<label><input type="checkbox" id="filter_nightlife" value="nightlife" onchange="toggleCategory('nightlife')"> Nightlife</label>
			<label><input type="checkbox" id="filter_shopping" value="shopping" onchange="toggleCategory('shopping')"> Shopping</label>
			<label><input type="checkbox" id="filter_lodging" value="lodging" onchange="toggleCategory('lodging')"> Hotels & Stays</label>
			<label><input type="checkbox" id="filter_entertainment" value="entertainment" onchange="toggleCategory('entertainment')"> Entertainment</label>
			<label><input type="checkbox" id="filter_outdoors" value="outdoors" onchange="toggleCategory('outdoors')"> Parks & Outdoors</label>
			<label><input type="checkbox" id="filter_sports_fitness" value="sports_fitness" onchange="toggleCategory('sports_fitness')"> Sports & Fitness</label>
			<label><input type="checkbox" id="filter_culture_museum" value="culture_museum" onchange="toggleCategory('culture_museum')"> Museums & Culture</label>
			<label><input type="checkbox" id="filter_education" value="education" onchange="toggleCategory('education')"> Education</label>
			<label><input type="checkbox" id="filter_transport" value="transport" onchange="toggleCategory('transport')"> Transport Hubs</label>
			<label><input type="checkbox" id="filter_health" value="health" onchange="toggleCategory('health')"> Health & Wellness</label>
			<label><input type="checkbox" id="filter_services" value="services" onchange="toggleCategory('services')"> Services</label>
			<label><input type="checkbox" id="filter_work_office" value="work_office" onchange="toggleCategory('work_office')"> Offices & Work</label>
			<label><input type="checkbox" id="filter_other" value="other" onchange="toggleCategory('other')"> Other</label>
		</div>
	</div>

	<div id="response"></div>

	<script>
		// ========== DEV BANNER ==========

		// Show development server banner if on dev.eick.com
		if (window.location.hostname === 'dev.eick.com') {
			document.getElementById('dev-banner').style.display = 'block';
		}

		// ========== URL PARAMETER PARSING ==========

		function parseURLParams() {
			const params = new URLSearchParams(window.location.search);

			// Prepopulate title
			if (params.has('title')) {
				document.getElementById('title').value = params.get('title');
			}

			// Prepopulate content
			if (params.has('content')) {
				document.getElementById('content').value = params.get('content');
			}

			// Prepopulate comment
			if (params.has('comment')) {
				document.getElementById('comment').value = params.get('comment');
			}

			// Add any URL parameters as links
			const urls = params.getAll('url');
			urls.forEach(url => {
				if (url.trim()) {
					addLinkField(url.trim());
				}
			});
		}

		// ========== IMAGE MANAGEMENT ==========

		let selectedImages = [];

		function handleImageSelection(event) {
			const files = Array.from(event.target.files || []);
			selectedImages = files;
			displayImagePreviews(files);
		}

		function displayImagePreviews(files) {
			const container = document.getElementById('image-preview-container');
			container.innerHTML = '';

			files.forEach((file, index) => {
				const reader = new FileReader();
				reader.onload = function(e) {
					const previewDiv = document.createElement('div');
					previewDiv.style.cssText = 'position: relative; width: 100px; height: 100px;';

					const img = document.createElement('img');
					img.src = e.target.result;
					img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border: 2px solid #ccc; border-radius: 4px;';

					const fileName = document.createElement('div');
					fileName.textContent = file.name;
					fileName.style.cssText = 'font-size: 10px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';

					const removeBtn = document.createElement('button');
					removeBtn.type = 'button';
					removeBtn.textContent = '×';
					removeBtn.style.cssText = 'position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 14px; line-height: 1;';
					removeBtn.onclick = function() {
						removeImage(index);
					};

					previewDiv.appendChild(img);
					previewDiv.appendChild(removeBtn);
					previewDiv.appendChild(fileName);
					container.appendChild(previewDiv);
				};
				reader.readAsDataURL(file);
			});
		}

		function removeImage(index) {
			const fileInput = document.getElementById('image-files');
			const dt = new DataTransfer();

			selectedImages.forEach((file, i) => {
				if (i !== index) {
					dt.items.add(file);
				}
			});

			fileInput.files = dt.files;
			selectedImages = Array.from(dt.files);
			displayImagePreviews(selectedImages);
		}

		// Attach event listener to file input
		document.addEventListener('DOMContentLoaded', function() {
			const fileInput = document.getElementById('image-files');
			if (fileInput) {
				fileInput.addEventListener('change', handleImageSelection);
			}
		});

		async function uploadImages(files) {
			const imageUrls = [];
			const totalFiles = files.length;

			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				document.getElementById('status').textContent = \`Uploading image \${i + 1}/\${totalFiles}: \${file.name}...\`;

				try {
					const formData = new FormData();
					formData.append('file', file);

					const response = await fetch('/api/admin/images', {
						method: 'POST',
						body: formData
					});

					if (!response.ok) {
						throw new Error(\`Failed to upload \${file.name}: HTTP \${response.status}\`);
					}

					const result = await response.json();

					// Transform objectKey to full URL with /chatter suffix
					const imageUrl = \`https://eick.com/\${result.objectKey}/chatter\`;
					imageUrls.push(imageUrl);

				} catch (error) {
					// Upload failed - abort everything
					throw new Error(\`Image upload failed for "\${file.name}": \${error.message}\`);
				}
			}

			return imageUrls;
		}

		// ========== LINKS MANAGEMENT ==========

		let linkCount = 0;

		function addLinkField(initialUrl = '') {
			const container = document.getElementById('links-container');
			const linkId = linkCount++;

			const linkDiv = document.createElement('div');
			linkDiv.id = 'link-' + linkId;
			linkDiv.style.marginBottom = '10px';

			linkDiv.innerHTML = \`
				<input type="url" id="link-url-\${linkId}" placeholder="https://example.com" style="width: 400px;" required value="\${initialUrl}">
				<button type="button" onclick="removeLinkField(\${linkId})">Remove</button>
			\`;

			container.appendChild(linkDiv);
		}

		function removeLinkField(linkId) {
			const linkDiv = document.getElementById('link-' + linkId);
			if (linkDiv) {
				linkDiv.remove();
			}
		}

		function getLinks() {
			const links = [];
			const container = document.getElementById('links-container');
			const linkDivs = container.querySelectorAll('[id^="link-"]');

			linkDivs.forEach(div => {
				const linkId = div.id.split('-')[1];
				const urlInput = document.getElementById('link-url-' + linkId);
				if (urlInput && urlInput.value.trim()) {
					links.push({
						url: urlInput.value.trim()
					});
				}
			});

			return links;
		}

		// ========== CATEGORY SYSTEM ==========

		// Category type buckets
		const FOOD_CORE = new Set([
			'restaurant', 'bar_and_grill', 'barbecue_restaurant', 'breakfast_restaurant',
			'brunch_restaurant', 'buffet_restaurant', 'deli', 'diner', 'food_court'
		]);

		const COFFEE_TEA = new Set([
			'cafe', 'coffee_shop', 'tea_house', 'acai_shop', 'juice_shop',
			'cat_cafe', 'dog_cafe'
		]);

		const NIGHTLIFE = new Set([
			'bar', 'pub', 'wine_bar', 'night_club', 'karaoke', 'comedy_club'
		]);

		const DESSERT = new Set([
			'bakery', 'ice_cream_shop', 'dessert_shop', 'candy_store', 'donut_shop'
		]);

		const LODGING = new Set([
			'hotel', 'motel', 'hostel', 'bed_and_breakfast', 'guest_house', 'inn',
			'resort_hotel', 'extended_stay_hotel', 'campground', 'camping_cabin',
			'farmstay', 'rv_park', 'cottage', 'lodging'
		]);

		const SHOPPING = new Set([
			'shopping_mall', 'market', 'supermarket', 'grocery_store', 'convenience_store',
			'department_store', 'discount_store', 'warehouse_store', 'store',
			'clothing_store', 'shoe_store', 'book_store', 'electronics_store',
			'furniture_store', 'gift_shop', 'home_goods_store', 'home_improvement_store',
			'hardware_store', 'liquor_store', 'pet_store', 'sporting_goods_store',
			'bicycle_store', 'auto_parts_store', 'asian_grocery_store', 'butcher_shop',
			'cell_phone_store'
		]);

		const ENTERTAINMENT = new Set([
			'movie_theater', 'movie_rental', 'video_arcade', 'amusement_center',
			'amusement_park', 'water_park', 'roller_coaster', 'community_center',
			'event_venue', 'convention_center', 'banquet_hall', 'wedding_venue',
			'visitor_center', 'plaza', 'marina', 'tourist_attraction'
		]);

		const OUTDOORS = new Set([
			'park', 'national_park', 'state_park', 'botanical_garden', 'garden',
			'dog_park', 'playground', 'hiking_area', 'wildlife_park', 'wildlife_refuge',
			'beach'
		]);

		const SPORTS_FITNESS = new Set([
			'gym', 'fitness_center', 'sports_club', 'sports_complex', 'arena',
			'stadium', 'athletic_field', 'swimming_pool', 'ski_resort', 'golf_course',
			'ice_skating_rink', 'sports_activity_location', 'sports_coaching',
			'cycling_park', 'skateboard_park'
		]);

		const CULTURE = new Set([
			'art_gallery', 'museum', 'cultural_center', 'historical_place',
			'historical_landmark', 'cultural_landmark', 'monument', 'zoo', 'aquarium'
		]);

		const EDUCATION = new Set(['library', 'university']);

		const TRANSPORT = new Set([
			'airport', 'international_airport', 'airstrip', 'train_station',
			'subway_station', 'bus_station', 'bus_stop', 'transit_station',
			'transit_depot', 'ferry_terminal', 'park_and_ride', 'taxi_stand',
			'truck_stop'
		]);

		const HEALTH = new Set([
			'hospital', 'doctor', 'dental_clinic', 'dentist', 'pharmacy', 'drugstore',
			'spa', 'wellness_center', 'massage', 'yoga_studio', 'sauna',
			'skin_care_clinic', 'tanning_studio', 'physiotherapist', 'chiropractor'
		]);

		const SERVICES = new Set([
			'hair_salon', 'hair_care', 'barber_shop', 'laundry', 'tour_agency',
			'tourist_information_center', 'travel_agency', 'funeral_home',
			'storage', 'cemetery'
		]);

		const WORK = new Set(['corporate_office']);

		const CATEGORY_META = {
			food_drink: { id: 'food_drink', label: 'Food & Drink', weight: 10 },
			coffee_tea: { id: 'coffee_tea', label: 'Coffee & Tea', weight: 20 },
			dessert: { id: 'dessert', label: 'Desserts & Bakeries', weight: 30 },
			nightlife: { id: 'nightlife', label: 'Nightlife', weight: 40 },
			shopping: { id: 'shopping', label: 'Shopping', weight: 50 },
			lodging: { id: 'lodging', label: 'Hotels & Stays', weight: 60 },
			entertainment: { id: 'entertainment', label: 'Entertainment', weight: 70 },
			outdoors: { id: 'outdoors', label: 'Parks & Outdoors', weight: 80 },
			sports_fitness: { id: 'sports_fitness', label: 'Sports & Fitness', weight: 90 },
			culture_museum: { id: 'culture_museum', label: 'Museums & Culture', weight: 100 },
			education: { id: 'education', label: 'Education', weight: 110 },
			transport: { id: 'transport', label: 'Transport Hubs', weight: 130 },
			health: { id: 'health', label: 'Health & Wellness', weight: 140 },
			services: { id: 'services', label: 'Services', weight: 150 },
			work_office: { id: 'work_office', label: 'Offices & Work', weight: 160 },
			other: { id: 'other', label: 'Other', weight: 999 }
		};

		// Category helper functions
		function isCheckinType(primaryType) {
			if (!primaryType) return false;
			if (primaryType === 'restaurant' || primaryType.endsWith('_restaurant')) {
				return true;
			}
			return FOOD_CORE.has(primaryType) || COFFEE_TEA.has(primaryType) ||
				NIGHTLIFE.has(primaryType) || DESSERT.has(primaryType) ||
				LODGING.has(primaryType) || SHOPPING.has(primaryType) ||
				ENTERTAINMENT.has(primaryType) || OUTDOORS.has(primaryType) ||
				SPORTS_FITNESS.has(primaryType) || CULTURE.has(primaryType) ||
				EDUCATION.has(primaryType) || TRANSPORT.has(primaryType) ||
				HEALTH.has(primaryType) || SERVICES.has(primaryType) ||
				WORK.has(primaryType);
		}

		function getCheckinCategory(primaryType) {
			if (!primaryType) return 'other';

			if (primaryType === 'restaurant' || primaryType.endsWith('_restaurant')) {
				return 'food_drink';
			}

			if (COFFEE_TEA.has(primaryType)) return 'coffee_tea';
			if (NIGHTLIFE.has(primaryType)) return 'nightlife';
			if (DESSERT.has(primaryType)) return 'dessert';
			if (FOOD_CORE.has(primaryType)) return 'food_drink';
			if (LODGING.has(primaryType)) return 'lodging';
			if (SHOPPING.has(primaryType)) return 'shopping';
			if (ENTERTAINMENT.has(primaryType)) return 'entertainment';
			if (OUTDOORS.has(primaryType)) return 'outdoors';
			if (SPORTS_FITNESS.has(primaryType)) return 'sports_fitness';
			if (CULTURE.has(primaryType)) return 'culture_museum';
			if (EDUCATION.has(primaryType)) return 'education';
			if (TRANSPORT.has(primaryType)) return 'transport';
			if (HEALTH.has(primaryType)) return 'health';
			if (SERVICES.has(primaryType)) return 'services';
			if (WORK.has(primaryType)) return 'work_office';

			return 'other';
		}

		// ========== FILTER MANAGEMENT ==========

		function toggleCategory(categoryId) {
			if (enabledCategories.has(categoryId)) {
				enabledCategories.delete(categoryId);
			} else {
				enabledCategories.add(categoryId);
			}

			// Re-render places if they've been loaded
			if (window.placesData && window.geocodeData) {
				displayPlaces(window.placesData, window.geocodeData);
			}
		}

		function selectAllCategories() {
			// Enable all categories
			const allCategories = [
				'food_drink', 'coffee_tea', 'dessert', 'nightlife', 'shopping',
				'lodging', 'entertainment', 'outdoors', 'sports_fitness',
				'culture_museum', 'education', 'transport', 'health', 'services',
				'work_office', 'other'
			];

			allCategories.forEach(cat => enabledCategories.add(cat));

			// Check all checkboxes
			allCategories.forEach(cat => {
				const checkbox = document.getElementById('filter_' + cat);
				if (checkbox) {
					checkbox.checked = true;
				}
			});

			// Re-render places if they've been loaded
			if (window.placesData && window.geocodeData) {
				displayPlaces(window.placesData, window.geocodeData);
			}
		}

		// ========== EXISTING STATE ==========

		let selectedPlace = null;
		let userCoords = null;
		const LOCATION_STORAGE_KEY = 'chatter_last_location';
		const SIGNIFICANT_DISTANCE = 0.01; // ~1km in degrees

		// Filter state - default enabled: food_drink, coffee_tea, dessert
		const enabledCategories = new Set(['food_drink', 'coffee_tea', 'dessert']);

		// Calculate simple distance between two coordinates
		function getDistance(lat1, lng1, lat2, lng2) {
			const dLat = lat2 - lat1;
			const dLng = lng2 - lng1;
			return Math.sqrt(dLat * dLat + dLng * dLng);
		}

		// Store coordinates in localStorage
		function storeCoordinates(lat, lng) {
			localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
				lat,
				lng,
				timestamp: Date.now()
			}));
		}

		// Get stored coordinates from localStorage
		function getStoredCoordinates() {
			const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
			return stored ? JSON.parse(stored) : null;
		}

		// Check if coordinates have changed significantly
		function hasLocationChanged(newLat, newLng) {
			const stored = getStoredCoordinates();
			if (!stored) return true;

			const distance = getDistance(stored.lat, stored.lng, newLat, newLng);
			return distance > SIGNIFICANT_DISTANCE;
		}

		async function requestLocation() {

			try {
				document.getElementById('status').textContent = 'Requesting location...';
				document.getElementById('error').textContent = '';

				if (!navigator.geolocation) {
					document.getElementById('error').textContent = 'Geolocation not supported';
					return;
				}


				navigator.geolocation.getCurrentPosition(
					async (position) => {
						const newLat = position.coords.latitude;
						const newLng = position.coords.longitude;

						userCoords = {
							lat: newLat,
							lng: newLng
						};

						// Check if location has changed significantly
						if (hasLocationChanged(newLat, newLng)) {
							document.getElementById('status').textContent = 'Location changed, updating places...';
						}

						// Store new coordinates
						storeCoordinates(newLat, newLng);

						await loadPlaces(userCoords.lat, userCoords.lng);
					},
					(error) => {

						let errorMsg = 'Location error: ' + error.message;
						if (error.code === 1) {
							errorMsg += ' (PERMISSION_DENIED)';
						} else if (error.code === 2) {
							errorMsg += ' (POSITION_UNAVAILABLE)';
						} else if (error.code === 3) {
							errorMsg += ' (TIMEOUT)';
						}

						document.getElementById('error').textContent = errorMsg;
						document.getElementById('status').textContent = '';
					},
					{
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 0
					}
				);

			} catch (e) {
				document.getElementById('error').textContent = 'Exception: ' + e.message;
			}
		}

		async function loadPlaces(lat, lng) {
			document.getElementById('status').textContent = 'Finding nearby places...';

			try {
				const placesUrl = \`/api/admin/places/nearby?lat=\${lat}&lng=\${lng}&radius=500\`;
				const placesResponse = await fetch(placesUrl);
				const placesData = await placesResponse.json();

				const geocodeUrl = \`/api/admin/geocode/reverse?lat=\${lat}&lng=\${lng}\`;
				const geocodeResponse = await fetch(geocodeUrl);
				const geocodeData = await geocodeResponse.json();

				displayPlaces(placesData.results || [], geocodeData);

				document.getElementById('location-btn').textContent = 'Update Places';
			} catch (error) {
				document.getElementById('error').textContent = 'Failed to load places: ' + error.message;
				document.getElementById('status').textContent = '';
			}
		}

		function categorizePlaces(places) {
			const categorizedPlaces = {};
			places.forEach(place => {
				const primaryType = place.types && place.types[0] ? place.types[0] : null;
				const category = getCheckinCategory(primaryType);

				if (enabledCategories.has(category)) {
					if (!categorizedPlaces[category]) {
						categorizedPlaces[category] = [];
					}
					categorizedPlaces[category].push(place);
				}
			});

			return Object.keys(categorizedPlaces).sort((a, b) => {
				return CATEGORY_META[a].weight - CATEGORY_META[b].weight;
			}).reduce((sorted, key) => {
				sorted[key] = categorizedPlaces[key];
				return sorted;
			}, {});
		}

		function buildPlacesHTML(sortedCategorizedPlaces, geocodeData) {
			let html = '<h2>Select a place:</h2>';
			const filteredPlacesFlat = [];

			html += '<ul>';
			html += \`<li style="padding: 5px; margin-bottom: 10px;">
				<button type="button" onclick="selectPlace(null, '\${geocodeData.formatted}')">
					\${geocodeData.formatted}
				</button>
			</li>\`;
			html += '</ul>';

			const categories = Object.keys(sortedCategorizedPlaces);
			if (categories.length === 0) {
				html += '<p><em>No places match the selected categories. Try enabling more filters above.</em></p>';
			} else {
				categories.forEach(categoryId => {
					const categoryPlaces = sortedCategorizedPlaces[categoryId];
					categoryPlaces.sort((a, b) => a.name.localeCompare(b.name));

					html += \`<h3 style="margin-top: 20px; color: #333;">\${CATEGORY_META[categoryId].label} (\${categoryPlaces.length})</h3>\`;
					html += '<ul>';

					categoryPlaces.forEach((place) => {
						const placeIndex = filteredPlacesFlat.length;
						filteredPlacesFlat.push(place);

						html += \`<li>
							<button type="button" onclick="selectPlaceByIndex(\${placeIndex})">
								\${place.name}\${place.address ? ' - ' + place.address : ''}
							</button>
						</li>\`;
					});

					html += '</ul>';
				});
			}

			html += '<ul style="margin-top: 20px;">';
			html += '<li><button type="button" onclick="selectPlace(-1, null)">Submit without location</button></li>';
			html += '</ul>';

			return { html, filteredPlacesFlat };
		}

		function displayPlaces(places, geocodeData) {
			const placesDiv = document.getElementById('places');

			if (!places || places.length === 0) {
				placesDiv.innerHTML = '<p>No nearby places found</p>';
				document.getElementById('status').textContent = '';
				return;
			}

			const sortedCategorizedPlaces = categorizePlaces(places);
			const { html, filteredPlacesFlat } = buildPlacesHTML(sortedCategorizedPlaces, geocodeData);

			placesDiv.innerHTML = html;

			window.placesData = places;
			window.filteredPlaces = filteredPlacesFlat;
			window.geocodeData = geocodeData;

			selectPlace(null, geocodeData.formatted);
		}

		function selectPlaceByIndex(index) {
			// Get place from the filtered places array
			const place = window.filteredPlaces[index];
			if (!place) {
				return;
			}

			// Set selected place
			selectedPlace = {
				type: 'place',
				name: place.name,
				address: place.address || '',
				location: {
					lat: place.lat,
					lng: place.lng
				},
				placeId: place.placeId
			};

			document.getElementById('status').textContent = 'Selected: ' + selectedPlace.name;
		}

		function selectPlace(index, cityState) {
			if (index === -1) {
				// No location
				selectedPlace = null;
			} else if (index === null) {
				// City, State option
				selectedPlace = {
					type: 'citystate',
					name: cityState,
					location: userCoords
				};
			} else {
				// Specific place
				const place = window.placesData[index];
				selectedPlace = {
					type: 'place',
					name: place.name,
					address: place.address || '',
					location: {
						lat: place.lat,
						lng: place.lng
					},
					placeId: place.placeId
				};
			}

			document.getElementById('status').textContent = 'Selected: ' + (selectedPlace ? selectedPlace.name : 'No location');
		}

		async function submitForm(e) {
			e.preventDefault();

			const title = document.getElementById('title').value.trim();
			const content = document.getElementById('content').value.trim();
			const comment = document.getElementById('comment').value.trim();
			const links = getLinks();

			document.getElementById('error').textContent = '';

			// Upload images first if any are selected
			let imageUrls = [];
			const fileInput = document.getElementById('image-files');
			if (fileInput.files && fileInput.files.length > 0) {
				try {
					imageUrls = await uploadImages(Array.from(fileInput.files));
				} catch (error) {
					// Image upload failed - abort everything
					document.getElementById('error').textContent = error.message;
					document.getElementById('status').textContent = '';
					return; // Don't create the chatter
				}
			}

			const payload = {
				kind: 'chatter',
				publish: true
			};

			if (title) payload.title = title;
			if (content) payload.content = content;
			if (comment) payload.comment = comment;
			if (links.length > 0) payload.links = links;
			if (imageUrls.length > 0) payload.images = imageUrls;

			if (selectedPlace) {
				payload.location_hint = {
					lat: selectedPlace.location.lat,
					lng: selectedPlace.location.lng,
					accuracy_m: 50
				};

				if (selectedPlace.type === 'place') {
					payload.place = {
						name: selectedPlace.name,
						formatted_address: selectedPlace.address,
						short_address: selectedPlace.address,
						location: {
							lat: selectedPlace.location.lat,
							lng: selectedPlace.location.lng
						},
						provider_ids: {
							google_places: selectedPlace.placeId
						}
					};
				}
			}

			document.getElementById('status').textContent = 'Creating chatter...';

			try {
				const response = await fetch('/api/admin/chatter', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(payload)
				});

				if (!response.ok) {
					throw new Error(\`HTTP error \${response.status}\`);
				}

				const result = await response.json();

				document.getElementById('status').textContent = 'Chatter created successfully!';
				document.getElementById('form').reset();

				// Clear image previews
				selectedImages = [];
				document.getElementById('image-preview-container').innerHTML = '';
			} catch (error) {
				document.getElementById('error').textContent = 'Failed to create chatter: ' + error.message;
				document.getElementById('status').textContent = '';
			}
		}

		// Initialize on page load
		async function initializePage() {
			// Parse and prepopulate from URL parameters
			parseURLParams();

			// Check if geolocation is supported
			if (!navigator.geolocation) {
				document.getElementById('status').textContent = 'Geolocation not supported';
				return;
			}

			// Check if we can query permissions
			if (!navigator.permissions) {
				// Permissions API not available, keep default behavior
				document.getElementById('status').textContent = '';
				return;
			}

			try {
				// Check if location permission is already granted
				const permission = await navigator.permissions.query({ name: 'geolocation' });

				if (permission.state === 'granted') {
					// Permission already granted, auto-request location
					document.getElementById('status').textContent = 'Checking location...';
					await requestLocation();
				} else {
					// Permission not granted yet
					document.getElementById('status').textContent = '';
				}
			} catch (error) {
				// Permissions query failed, keep default behavior
				document.getElementById('status').textContent = '';
			}
		}

		// Run initialization when page loads
		initializePage();
	</script>
</body>
</html>`;

	return c.html(html);
}
