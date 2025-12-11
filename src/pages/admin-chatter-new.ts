import type { Context } from "hono";
import { renderPage } from "../ui/layout";

export function handleAdminChatterNew(c: Context<{ Bindings: Env }>) {
	const body = `
		<div class="wa-stack wa-gap-xl">
			<div id="dev-banner" style="display: none; background: #ff9800; color: #000; padding: 10px; text-align: center; font-weight: bold; font-size: 52px; border-bottom: 3px solid #f57c00;">
				⚠️ DEVELOPMENT SERVER ⚠️
			</div>

			<h1 style="font-size: 52px;">Create Chatter</h1>

			<div id="status" style="font-size: 52px; font-weight: bold;"></div>
			<div id="error" style="font-size: 52px; color: red; font-weight: bold;"></div>

			<wa-button id="location-btn" variant="primary" size="large" style="font-size: 52px;">Enable Location</wa-button>

			<form id="form" class="wa-stack wa-gap-l">
				<div class="wa-stack wa-gap-m">
					<wa-textarea id="content" label="Content (optional)" rows="5" placeholder="What's happening?" size="large" style="font-size: 52px;"></wa-textarea>
				</div>

				<div class="wa-stack wa-gap-m">
					<label style="font-size: 52px;"><strong>Links (optional)</strong></label>
					<div id="links-container" class="wa-stack wa-gap-m"></div>
					<wa-button type="button" id="add-link-btn" variant="default" size="large" style="font-size: 52px;">+ Add Link</wa-button>
				</div>

				<div class="wa-stack wa-gap-m">
					<label style="font-size: 52px;"><strong>Images (optional)</strong></label>
					<input type="file" id="image-files" accept="image/jpeg,image/png,image/gif,image/webp" multiple style="font-size: 52px;">
					<div id="image-preview-container" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>
				</div>

				<wa-button type="submit" variant="primary" size="large" style="font-size: 52px;">Create Chatter</wa-button>
			</form>

			<div id="places" class="wa-stack wa-gap-l"></div>
			<div id="response"></div>
		</div>

		<script>
			// ========== DEV BANNER ==========

			if (window.location.hostname === 'dev.eick.com') {
				document.getElementById('dev-banner').style.display = 'block';
			}

			// ========== URL PARAMETER PARSING ==========

			function parseURLParams() {
				const params = new URLSearchParams(window.location.search);

				// Prepopulate content
				if (params.has('content')) {
					document.getElementById('content').value = params.get('content');
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
						const imageUrl = \`https://eick.com/\${result.objectKey}/chatter\`;
						imageUrls.push(imageUrl);

					} catch (error) {
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
				linkDiv.style.cssText = 'display: flex; gap: 10px; align-items: center;';

				const input = document.createElement('wa-input');
				input.id = 'link-url-' + linkId;
				input.type = 'url';
				input.placeholder = 'https://example.com';
				input.value = initialUrl;
				input.required = true;
				input.size = 'large';
				input.style.cssText = 'flex: 1; font-size: 52px;';

				const removeBtn = document.createElement('wa-button');
				removeBtn.type = 'button';
				removeBtn.textContent = 'Remove';
				removeBtn.variant = 'default';
				removeBtn.size = 'large';
				removeBtn.style.fontSize = '52px';
				removeBtn.onclick = function() {
					removeLinkField(linkId);
				};

				linkDiv.appendChild(input);
				linkDiv.appendChild(removeBtn);
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

			// Add link button handler
			document.addEventListener('DOMContentLoaded', function() {
				const addLinkBtn = document.getElementById('add-link-btn');
				if (addLinkBtn) {
					addLinkBtn.addEventListener('click', () => addLinkField());
				}
			});

			// ========== CATEGORY SYSTEM ==========

			// Map Google Place types to categories
			const TYPE_TO_CATEGORY = {
				// Culture & Museums
				'art_gallery': 'culture_museum',
				'museum': 'culture_museum',
				'cultural_center': 'culture_museum',
				'historical_place': 'culture_museum',
				'historical_landmark': 'culture_museum',
				'cultural_landmark': 'culture_museum',
				'monument': 'culture_museum',
				'zoo': 'culture_museum',
				'aquarium': 'culture_museum',

				// Entertainment & Attractions
				'movie_theater': 'entertainment',
				'movie_rental': 'entertainment',
				'video_arcade': 'entertainment',
				'amusement_center': 'entertainment',
				'amusement_park': 'entertainment',
				'water_park': 'entertainment',
				'roller_coaster': 'entertainment',
				'community_center': 'entertainment',
				'event_venue': 'entertainment',
				'convention_center': 'entertainment',
				'banquet_hall': 'entertainment',
				'wedding_venue': 'entertainment',
				'visitor_center': 'entertainment',
				'plaza': 'entertainment',
				'marina': 'entertainment',
				'tourist_attraction': 'entertainment',

				// Parks & Outdoors
				'park': 'outdoors',
				'national_park': 'outdoors',
				'state_park': 'outdoors',
				'botanical_garden': 'outdoors',
				'garden': 'outdoors',
				'dog_park': 'outdoors',
				'playground': 'outdoors',
				'hiking_area': 'outdoors',
				'wildlife_park': 'outdoors',
				'wildlife_refuge': 'outdoors',
				'beach': 'outdoors',

				// Food & Drink
				'bar_and_grill': 'food_drink',
				'barbecue_restaurant': 'food_drink',
				'breakfast_restaurant': 'food_drink',
				'brunch_restaurant': 'food_drink',
				'buffet_restaurant': 'food_drink',
				'deli': 'food_drink',
				'diner': 'food_drink',
				'food_court': 'food_drink',

				// Coffee & Tea
				'cafe': 'coffee_tea',
				'coffee_shop': 'coffee_tea',
				'tea_house': 'coffee_tea',
				'acai_shop': 'coffee_tea',
				'juice_shop': 'coffee_tea',
				'cat_cafe': 'coffee_tea',
				'dog_cafe': 'coffee_tea',

				// Desserts
				'bakery': 'dessert',
				'ice_cream_shop': 'dessert',
				'dessert_shop': 'dessert',
				'candy_store': 'dessert',
				'donut_shop': 'dessert',

				// Nightlife
				'bar': 'nightlife',
				'pub': 'nightlife',
				'wine_bar': 'nightlife',
				'night_club': 'nightlife',
				'karaoke': 'nightlife',
				'comedy_club': 'nightlife',

				// Shopping
				'shopping_mall': 'shopping',
				'market': 'shopping',
				'supermarket': 'shopping',
				'grocery_store': 'shopping',
				'convenience_store': 'shopping',
				'department_store': 'shopping',
				'discount_store': 'shopping',
				'warehouse_store': 'shopping',
				'store': 'shopping',
				'clothing_store': 'shopping',
				'shoe_store': 'shopping',
				'book_store': 'shopping',
				'electronics_store': 'shopping',
				'furniture_store': 'shopping',
				'gift_shop': 'shopping',
				'home_goods_store': 'shopping',
				'home_improvement_store': 'shopping',
				'hardware_store': 'shopping',
				'liquor_store': 'shopping',
				'pet_store': 'shopping',
				'sporting_goods_store': 'shopping',
				'bicycle_store': 'shopping',
				'auto_parts_store': 'shopping',
				'asian_grocery_store': 'shopping',
				'butcher_shop': 'shopping',
				'cell_phone_store': 'shopping',

				// Lodging
				'hotel': 'lodging',
				'motel': 'lodging',
				'hostel': 'lodging',
				'bed_and_breakfast': 'lodging',
				'guest_house': 'lodging',
				'inn': 'lodging',
				'resort_hotel': 'lodging',
				'extended_stay_hotel': 'lodging',
				'campground': 'lodging',
				'camping_cabin': 'lodging',
				'farmstay': 'lodging',
				'rv_park': 'lodging',
				'cottage': 'lodging',
				'lodging': 'lodging',

				// Sports & Fitness
				'gym': 'sports_fitness',
				'fitness_center': 'sports_fitness',
				'sports_club': 'sports_fitness',
				'sports_complex': 'sports_fitness',
				'arena': 'sports_fitness',
				'stadium': 'sports_fitness',
				'athletic_field': 'sports_fitness',
				'swimming_pool': 'sports_fitness',
				'ski_resort': 'sports_fitness',
				'golf_course': 'sports_fitness',
				'ice_skating_rink': 'sports_fitness',
				'sports_activity_location': 'sports_fitness',
				'sports_coaching': 'sports_fitness',
				'cycling_park': 'sports_fitness',
				'skateboard_park': 'sports_fitness',

				// Education
				'library': 'education',
				'university': 'education',

				// Transport
				'airport': 'transport',
				'international_airport': 'transport',
				'airstrip': 'transport',
				'train_station': 'transport',
				'subway_station': 'transport',
				'bus_station': 'transport',
				'bus_stop': 'transport',
				'transit_station': 'transport',
				'transit_depot': 'transport',
				'ferry_terminal': 'transport',
				'park_and_ride': 'transport',
				'taxi_stand': 'transport',
				'truck_stop': 'transport',

				// Health & Wellness
				'hospital': 'health',
				'doctor': 'health',
				'dental_clinic': 'health',
				'dentist': 'health',
				'pharmacy': 'health',
				'drugstore': 'health',
				'spa': 'health',
				'wellness_center': 'health',
				'massage': 'health',
				'yoga_studio': 'health',
				'sauna': 'health',
				'skin_care_clinic': 'health',
				'tanning_studio': 'health',
				'physiotherapist': 'health',
				'chiropractor': 'health',

				// Services
				'hair_salon': 'services',
				'hair_care': 'services',
				'barber_shop': 'services',
				'laundry': 'services',
				'tour_agency': 'services',
				'tourist_information_center': 'services',
				'travel_agency': 'services',
				'funeral_home': 'services',
				'storage': 'services',
				'cemetery': 'services',

				// Work
				'corporate_office': 'work_office'
			};

			// Category metadata with reordered priorities (culture/museums first)
			const CATEGORY_META = {
				culture_museum: { id: 'culture_museum', label: 'Museums & Culture', weight: 10 },
				entertainment: { id: 'entertainment', label: 'Entertainment & Attractions', weight: 20 },
				outdoors: { id: 'outdoors', label: 'Parks & Outdoors', weight: 30 },
				food_drink: { id: 'food_drink', label: 'Food & Drink', weight: 40 },
				coffee_tea: { id: 'coffee_tea', label: 'Coffee & Tea', weight: 50 },
				dessert: { id: 'dessert', label: 'Desserts & Bakeries', weight: 60 },
				nightlife: { id: 'nightlife', label: 'Nightlife', weight: 70 },
				shopping: { id: 'shopping', label: 'Shopping', weight: 80 },
				lodging: { id: 'lodging', label: 'Hotels & Stays', weight: 90 },
				sports_fitness: { id: 'sports_fitness', label: 'Sports & Fitness', weight: 100 },
				education: { id: 'education', label: 'Education', weight: 110 },
				transport: { id: 'transport', label: 'Transport Hubs', weight: 120 },
				health: { id: 'health', label: 'Health & Wellness', weight: 130 },
				services: { id: 'services', label: 'Services', weight: 140 },
				work_office: { id: 'work_office', label: 'Offices & Work', weight: 150 },
				other: { id: 'other', label: 'Other', weight: 999 }
			};

			function getCheckinCategory(primaryType) {
				if (!primaryType) return 'other';
				if (primaryType === 'restaurant' || primaryType.endsWith('_restaurant')) {
					return 'food_drink';
				}
				return TYPE_TO_CATEGORY[primaryType] || 'other';
			}

			function categorizePlaces(places) {
				const categorizedPlaces = {};
				places.forEach(place => {
					const primaryType = place.types && place.types[0] ? place.types[0] : null;
					const category = getCheckinCategory(primaryType);

					if (!categorizedPlaces[category]) {
						categorizedPlaces[category] = [];
					}
					categorizedPlaces[category].push(place);
				});

				// Sort by weight
				return Object.keys(categorizedPlaces).sort((a, b) => {
					return CATEGORY_META[a].weight - CATEGORY_META[b].weight;
				}).reduce((sorted, key) => {
					sorted[key] = categorizedPlaces[key];
					return sorted;
				}, {});
			}

			// ========== LOCATION AND PLACES ==========

			let selectedPlace = null;
			let userCoords = null;
			const LOCATION_STORAGE_KEY = 'chatter_last_location';
			const SIGNIFICANT_DISTANCE = 0.01; // ~1km in degrees

			function getDistance(lat1, lng1, lat2, lng2) {
				const dLat = lat2 - lat1;
				const dLng = lng2 - lng1;
				return Math.sqrt(dLat * dLat + dLng * dLng);
			}

			function storeCoordinates(lat, lng) {
				localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
					lat,
					lng,
					timestamp: Date.now()
				}));
			}

			function getStoredCoordinates() {
				const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
				return stored ? JSON.parse(stored) : null;
			}

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

							if (hasLocationChanged(newLat, newLng)) {
								document.getElementById('status').textContent = 'Location changed, updating places...';
							}

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

			// Location button handler
			document.addEventListener('DOMContentLoaded', function() {
				const locationBtn = document.getElementById('location-btn');
				if (locationBtn) {
					locationBtn.addEventListener('click', requestLocation);
				}
			});

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

			function displayPlaces(places, geocodeData) {
				const placesDiv = document.getElementById('places');

				if (!places || places.length === 0) {
					placesDiv.innerHTML = '<p style="font-size: 52px;">No nearby places found</p>';
					document.getElementById('status').textContent = '';
					return;
				}

				// Store data globally for selection
				window.placesData = places;
				window.geocodeData = geocodeData;

				// Categorize places
				const categorized = categorizePlaces(places);

				// Build HTML with wa-radio-group
				let html = '<h2 style="font-size: 52px;">Select a place:</h2>';
				html += '<wa-radio-group id="place-radio-group" size="large">';

				// First option: City/State
				html += \`<wa-radio appearance="button" value="citystate"><span style="font-size: 52px;">\${escapeHtml(geocodeData.formatted)}</span></wa-radio>\`;

				// Display places grouped by category
				Object.keys(categorized).forEach(categoryId => {
					const categoryPlaces = categorized[categoryId];
					const categoryLabel = CATEGORY_META[categoryId].label;

					// Category heading
					html += \`<div style="margin-top: 20px; margin-bottom: 12px;"><strong style="font-size: 52px;">\${categoryLabel} (\${categoryPlaces.length})</strong></div>\`;

					// Sort places alphabetically within category
					categoryPlaces.sort((a, b) => a.name.localeCompare(b.name));

					// Display each place (name only, no address)
					categoryPlaces.forEach((place) => {
						html += \`<wa-radio appearance="button" value="place-\${escapeHtml(place.placeId)}"><span style="font-size: 52px;">\${escapeHtml(place.name)}</span></wa-radio>\`;
					});
				});

				// Last option: No location
				html += \`<div style="margin-top: 16px;"></div>\`;
				html += \`<wa-radio appearance="button" value="none"><span style="font-size: 52px;">Submit without location</span></wa-radio>\`;

				html += '</wa-radio-group>';

				placesDiv.innerHTML = html;

				// Auto-select city/state option
				const radioGroup = document.getElementById('place-radio-group');
				if (radioGroup) {
					radioGroup.value = 'citystate';
					radioGroup.addEventListener('change', handlePlaceSelection);
				}

				// Update selected place
				selectPlace(null, geocodeData.formatted);
			}

			function escapeHtml(str) {
				const div = document.createElement('div');
				div.textContent = str;
				return div.innerHTML;
			}

			function handlePlaceSelection(event) {
				const value = event.target.value;

				if (value === 'citystate') {
					// City/State option
					selectPlace(null, window.geocodeData.formatted);
				} else if (value === 'none') {
					// No location
					selectPlace(-1, null);
				} else if (value.startsWith('place-')) {
					// Specific place - find by placeId
					const placeId = value.substring(6); // Remove 'place-' prefix
					const place = window.placesData.find(p => p.placeId === placeId);
					if (place) {
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
				}
			}

			function selectPlaceByIndex(index) {
				const place = window.placesData[index];
				if (!place) {
					return;
				}

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

			// ========== FORM SUBMISSION ==========

			async function submitForm(e) {
				e.preventDefault();

				const content = document.getElementById('content').value.trim();
				const links = getLinks();

				document.getElementById('error').textContent = '';

				// Upload images first if any are selected
				let imageUrls = [];
				const fileInput = document.getElementById('image-files');
				if (fileInput.files && fileInput.files.length > 0) {
					try {
						imageUrls = await uploadImages(Array.from(fileInput.files));
					} catch (error) {
						document.getElementById('error').textContent = error.message;
						document.getElementById('status').textContent = '';
						return;
					}
				}

				const payload = {
					kind: 'chatter',
					publish: true
				};

				if (content) payload.content = content;
				if (links.length > 0) payload.links = links;
				if (imageUrls.length > 0) payload.images = imageUrls;

				// Add location if selected
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

					// Clear links
					document.getElementById('links-container').innerHTML = '';
					linkCount = 0;
				} catch (error) {
					document.getElementById('error').textContent = 'Failed to create chatter: ' + error.message;
					document.getElementById('status').textContent = '';
				}
			}

			// Form submit handler
			document.addEventListener('DOMContentLoaded', function() {
				const form = document.getElementById('form');
				if (form) {
					form.addEventListener('submit', submitForm);
				}
			});

			// ========== INITIALIZATION ==========

			async function initializePage() {
				parseURLParams();

				if (!navigator.geolocation) {
					document.getElementById('status').textContent = 'Geolocation not supported';
					return;
				}

				if (!navigator.permissions) {
					document.getElementById('status').textContent = '';
					return;
				}

				try {
					const permission = await navigator.permissions.query({ name: 'geolocation' });

					if (permission.state === 'granted') {
						document.getElementById('status').textContent = 'Checking location...';
						await requestLocation();
					} else {
						document.getElementById('status').textContent = '';
					}
				} catch (error) {
					document.getElementById('status').textContent = '';
				}
			}

			initializePage();
		</script>
	`;

	const html = renderPage({
		title: "New Chatter - Admin",
		description: "Create a new chatter entry",
		body,
		version: c.env.VERSION,
	});

	return c.html(html);
}
