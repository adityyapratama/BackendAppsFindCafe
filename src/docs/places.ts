/**
 * @swagger
 * tags:
 *   - name: Places
 *     description: Cafe/place management
 */

/**
 * @swagger
 * /places:
 *   get:
 *     tags: [Places]
 *     summary: List places (search, filter, distance)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, address, description
 *       - in: query
 *         name: category_id
 *         schema: { type: integer }
 *       - in: query
 *         name: tag_ids
 *         schema: { type: string }
 *         description: Comma-separated tag IDs
 *       - in: query
 *         name: district
 *         schema: { type: string }
 *       - in: query
 *         name: min_rating
 *         schema: { type: number }
 *       - in: query
 *         name: price_min
 *         schema: { type: integer }
 *       - in: query
 *         name: price_max
 *         schema: { type: integer }
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *         description: User latitude for distance calc
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *         description: User longitude for distance calc
 *       - in: query
 *         name: radius_km
 *         schema: { type: number }
 *         description: Filter by radius (requires lat/lng)
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, rating, recommended, distance] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of places with pagination meta
 */

/**
 * @swagger
 * /places/{id}:
 *   get:
 *     tags: [Places]
 *     summary: Get place detail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Place detail with category, tags, hours, photos
 *       404:
 *         description: Place not found
 */

/**
 * @swagger
 * /places/mine:
 *   get:
 *     tags: [Places]
 *     summary: List the authenticated user's own submitted places (any status)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, archived] }
 *         description: Optional filter by submission status
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: User's submissions with pagination meta. All ids are serialized as numeric strings.
 *       401:
 *         description: Missing or invalid token
 */

/**
 * @swagger
 * /places:
 *   post:
 *     tags: [Places]
 *     summary: Submit new place
 *     description: >
 *       Accepts application/json or multipart/form-data. With multipart you may
 *       attach an optional `photo` file which becomes the cover image (P1).
 *       latitude/longitude are optional when `googleMapsUrl` contains
 *       coordinates the server can parse (P5). The response `data` also carries
 *       a `possibleDuplicates` array of nearby existing places (P4, non-blocking).
 *       Note: every id in the response is serialized as a numeric string (P2).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, categoryId]
 *             properties:
 *               name: { type: string, maxLength: 150 }
 *               description: { type: string }
 *               address: { type: string }
 *               district: { type: string }
 *               latitude: { type: number, minimum: -90, maximum: 90, description: "Optional if googleMapsUrl has coordinates" }
 *               longitude: { type: number, minimum: -180, maximum: 180, description: "Optional if googleMapsUrl has coordinates" }
 *               categoryId: { type: integer }
 *               priceMin: { type: integer }
 *               priceMax: { type: integer }
 *               phone: { type: string }
 *               websiteUrl: { type: string, format: uri }
 *               instagramUrl: { type: string, format: uri }
 *               googleMapsUrl: { type: string, format: uri }
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, address, categoryId]
 *             properties:
 *               name: { type: string, maxLength: 150 }
 *               description: { type: string }
 *               address: { type: string }
 *               district: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               categoryId: { type: integer }
 *               priceMin: { type: integer }
 *               priceMax: { type: integer }
 *               phone: { type: string }
 *               websiteUrl: { type: string, format: uri }
 *               instagramUrl: { type: string, format: uri }
 *               googleMapsUrl: { type: string, format: uri }
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Optional cover photo (JPEG/PNG/WebP, max 5MB)
 *               caption: { type: string, maxLength: 150 }
 *     responses:
 *       201:
 *         description: Place submitted (pending approval). data includes possibleDuplicates[].
 */

/**
 * @swagger
 * /places/{id}/photos:
 *   post:
 *     tags: [Places]
 *     summary: Upload photo for a place
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [photo]
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: JPEG/PNG/WebP, max 5MB
 *               caption: { type: string, maxLength: 150 }
 *               isCover: { type: string, enum: ['true', 'false'] }
 *     responses:
 *       201:
 *         description: Photo uploaded
 */

/**
 * @swagger
 * /places/{id}/edit-requests:
 *   post:
 *     tags: [Places]
 *     summary: Submit edit request for a place
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proposedData:
 *                 type: object
 *                 description: "Allowed fields: name, description, address, district, phone, priceMin, priceMax, etc."
 *     responses:
 *       201:
 *         description: Edit request submitted
 */

/**
 * @swagger
 * /places/{id}/reports:
 *   post:
 *     tags: [Places]
 *     summary: Report a place
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reasonType]
 *             properties:
 *               reasonType:
 *                 type: string
 *                 enum: [wrong_location, closed, duplicate, inappropriate, wrong_information, other]
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Report submitted
 */

/**
 * @swagger
 * /places/{id}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews for a place
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of approved reviews
 *   post:
 *     tags: [Reviews]
 *     summary: Create review for a place
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Review created
 */
