/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Review management
 *   - name: Favorites
 *     description: User favorites
 *   - name: Recommendations
 *     description: Place recommendations
 *   - name: Master Data
 *     description: Categories & tags
 *   - name: Admin
 *     description: Admin moderation (requires admin/super_admin role)
 */

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Update own review
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
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       200:
 *         description: Review updated
 *       403:
 *         description: Not authorized
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete own review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Review deleted
 */

/**
 * @swagger
 * /favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: List user favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of favorites
 * /favorites/places/{id}/favorite:
 *   post:
 *     tags: [Favorites]
 *     summary: Add place to favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: Added to favorites
 *       409:
 *         description: Already in favorites
 *   delete:
 *     tags: [Favorites]
 *     summary: Remove from favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Removed from favorites
 */

/**
 * @swagger
 * /recommendations/places/{id}/recommend:
 *   post:
 *     tags: [Recommendations]
 *     summary: Recommend a place
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: Place recommended
 *       409:
 *         description: Already recommended
 *   delete:
 *     tags: [Recommendations]
 *     summary: Remove recommendation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Recommendation removed
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Master Data]
 *     summary: List all active categories
 *     responses:
 *       200:
 *         description: List of categories
 * /tags:
 *   get:
 *     tags: [Master Data]
 *     summary: List all active tags
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [facility, vibe, purpose, payment] }
 *     responses:
 *       200:
 *         description: List of tags
 */

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     tags: [Admin]
 *     summary: Get app settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: App settings
 *   put:
 *     tags: [Admin]
 *     summary: Update app settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               placeApprovalMode: { type: string, enum: [manual, auto] }
 *               reviewApprovalMode: { type: string, enum: [manual, auto] }
 *               photoApprovalMode: { type: string, enum: [manual, auto] }
 *               allowUserPlaceSubmission: { type: boolean }
 *               allowUserReviews: { type: boolean }
 *     responses:
 *       200:
 *         description: Settings updated
 * /admin/places:
 *   get:
 *     tags: [Admin]
 *     summary: List all places (any status)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, archived] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Places list
 * /admin/places/{id}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve a place
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Place approved
 * /admin/places/{id}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Reject a place
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
 *             required: [rejectionReason]
 *             properties:
 *               rejectionReason: { type: string, minLength: 3 }
 *     responses:
 *       200:
 *         description: Place rejected
 * /admin/reviews/{id}/approve:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve a review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Review approved
 * /admin/reviews/{id}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Reject a review
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
 *             required: [rejectionReason]
 *             properties:
 *               rejectionReason: { type: string }
 *     responses:
 *       200:
 *         description: Review rejected
 * /admin/moderation-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get moderation audit trail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Moderation logs
 */
