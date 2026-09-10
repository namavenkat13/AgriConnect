// backend/routes/notifications.js
// Handles in-app notification logs and read states

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');

/**
 * GET /api/notifications/my
 * Fetch list of notifications for the authenticated farmer/user
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const notifications = await db.query(
      `SELECT n.*, b.crop_name, b.slot_date 
       FROM notifications n 
       LEFT JOIN bookings b ON n.booking_id = b.booking_id 
       WHERE n.farmer_id = ? 
       ORDER BY n.sent_at DESC, n.notification_id DESC 
       LIMIT 50`,
      [userId]
    );

    const unreadCountRow = await db.get(
      'SELECT COUNT(*) as unread FROM notifications WHERE farmer_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      unread_count: unreadCountRow ? Number(unreadCountRow.unread) : 0,
      notifications
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.user_id;

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND farmer_id = ?',
      [notificationId, userId]
    );

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for current user
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE farmer_id = ?',
      [userId]
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error updating all notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to mark all as read.' });
  }
});

module.exports = router;
