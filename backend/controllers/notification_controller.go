package controllers

import (
	"backend/database"
	"backend/models"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// CreateNotification - Helper function to create notifications
func CreateNotification(userID uint, notificationType, title, message string, data interface{}) error {
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return err
	}

	notification := models.Notification{
		UserID:  userID,
		Type:    notificationType,
		Title:   title,
		Message: message,
		Data:    string(dataJSON),
		IsRead:  false,
	}

	result := database.DB.Create(&notification)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

// GetMyNotifications - Get notifications for current user
func GetMyNotifications(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var notifications []models.Notification
	query := database.DB.Where("user_id = ?", userID).Order("created_at DESC")

	// Filter by read status
	if readStatus := c.Query("read"); readStatus != "" {
		isRead := readStatus == "true"
		query = query.Where("is_read = ?", isRead)
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	var total int64
	query.Model(&models.Notification{}).Count(&total)

	query.Offset(offset).Limit(limit).Find(&notifications)

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"total":         total,
		"page":          page,
		"limit":         limit,
	})
}

// MarkNotificationAsRead - Mark a specific notification as read
func MarkNotificationAsRead(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	var notification models.Notification
	if result := database.DB.Where("id = ? AND user_id = ?", notificationID, userID).First(&notification); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	now := time.Now()
	notification.IsRead = true
	notification.ReadAt = &now
	database.DB.Save(&notification)

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// MarkAllNotificationsAsRead - Mark all notifications as read
func MarkAllNotificationsAsRead(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	now := time.Now()
	database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Updates(map[string]interface{}{
			"is_read":    true,
			"read_at":    now,
			"updated_at": now,
		})

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

// GetUnreadCount - Get count of unread notifications
func GetUnreadCount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var count int64
	database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count)

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

// DeleteNotification - Delete a notification
func DeleteNotification(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	result := database.DB.Where("id = ? AND user_id = ?", notificationID, userID).Delete(&models.Notification{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted successfully"})
}
