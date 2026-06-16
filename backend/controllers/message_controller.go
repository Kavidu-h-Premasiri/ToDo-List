package controllers

import (
	"backend/database"
	"backend/models"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// SendMessage - Send a message with optional file attachment
func SendMessage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	teamID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	// Check if user is a member of this team
	var member models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND status = ?", uint(teamID), userID, "active").First(&member); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this team"})
		return
	}

	// Get content from form data
	content := c.PostForm("content")

	// Handle file upload
	var fileURL, fileName, fileType string
	var fileSize int64

	file, err := c.FormFile("file")
	if err == nil && file != nil {
		// Validate file size (max 10MB)
		if file.Size > 10*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum size is 10MB"})
			return
		}

		// Get file extension
		ext := strings.ToLower(filepath.Ext(file.Filename))

		// Allowed file types
		allowedTypes := map[string]bool{
			".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
			".pdf": true, ".doc": true, ".docx": true, ".xls": true, ".xlsx": true,
			".txt": true, ".zip": true, ".rar": true, ".mp4": true, ".mp3": true,
		}

		if !allowedTypes[ext] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File type not allowed"})
			return
		}

		// Create upload directory if not exists
		uploadDir := "uploads/messages"
		// Create directory (handled by os package)

		// Generate unique filename
		filename := fmt.Sprintf("%d_%d%s", time.Now().UnixNano(), userID, ext)
		filePath := filepath.Join(uploadDir, filename)

		// Save file
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		fileURL = "/" + filePath
		fileName = file.Filename
		fileType = file.Header.Get("Content-Type")
		fileSize = file.Size
	}

	// Create message
	message := models.Message{
		TeamID:   uint(teamID),
		SenderID: userID.(uint),
		Content:  content,
		FileURL:  fileURL,
		FileName: fileName,
		FileType: fileType,
		FileSize: fileSize,
		IsRead:   false,
	}

	if result := database.DB.Create(&message); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// Get sender details
	var sender models.User
	database.DB.First(&sender, userID)

	// Get team details
	var team models.Team
	database.DB.First(&team, teamID)

	// Send notification to all team members (async)
	go func() {
		var members []models.TeamMember
		database.DB.Where("team_id = ? AND user_id != ?", uint(teamID), userID).Find(&members)

		messageText := content
		if fileURL != "" {
			if content != "" {
				messageText = content + " 📎 " + fileName
			} else {
				messageText = "📎 " + fileName
			}
		}

		for _, m := range members {
			notificationData := map[string]interface{}{
				"message_id":   message.ID,
				"team_id":      teamID,
				"team_name":    team.Name,
				"sender_id":    userID,
				"sender_name":  sender.Name,
				"content":      messageText,
				"file_url":     fileURL,
				"file_name":    fileName,
				"message_type": "chat",
			}

			CreateNotification(
				m.UserID,
				"new_message",
				"New Message in "+team.Name,
				sender.Name+": "+messageText,
				notificationData,
			)
		}
	}()

	c.JSON(http.StatusCreated, gin.H{
		"message": "Message sent successfully",
		"data":    message,
	})
}

// GetTeamMessages - Get messages for a team
func GetTeamMessages(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	teamID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	// Check if user is a member of this team
	var member models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND status = ?", uint(teamID), userID, "active").First(&member); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this team"})
		return
	}

	// Get messages
	var messages []models.Message
	query := database.DB.Preload("Sender").Where("team_id = ?", uint(teamID)).Order("created_at ASC")

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	var total int64
	query.Model(&models.Message{}).Count(&total)

	query.Offset(offset).Limit(limit).Find(&messages)

	// Mark messages as read (for the current user)
	go func() {
		var unreadMessages []models.Message
		database.DB.Where("team_id = ?", uint(teamID)).Find(&unreadMessages)

		for _, msg := range unreadMessages {
			var existingRead models.MessageRead
			result := database.DB.Where("message_id = ? AND user_id = ?", msg.ID, userID).First(&existingRead)

			if result.Error != nil {
				read := models.MessageRead{
					MessageID: msg.ID,
					UserID:    userID.(uint),
					ReadAt:    time.Now(),
				}
				database.DB.Create(&read)
			}
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

// MarkMessagesAsRead - Mark all messages in a team as read for current user
func MarkMessagesAsRead(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	teamID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	// Check if user is a member
	var member models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND status = ?", uint(teamID), userID, "active").First(&member); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this team"})
		return
	}

	// Get unread messages
	var messages []models.Message
	database.DB.Where("team_id = ?", uint(teamID)).Find(&messages)

	now := time.Now()
	for _, msg := range messages {
		var existingRead models.MessageRead
		result := database.DB.Where("message_id = ? AND user_id = ?", msg.ID, userID).First(&existingRead)

		if result.Error != nil {
			read := models.MessageRead{
				MessageID: msg.ID,
				UserID:    userID.(uint),
				ReadAt:    now,
			}
			database.DB.Create(&read)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Messages marked as read"})
}

// GetTeamUnreadCount - Get unread message count for current user in a team
func GetTeamUnreadCount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	teamID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID"})
		return
	}

	// Check if user is a member
	var member models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND status = ?", uint(teamID), userID, "active").First(&member); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this team"})
		return
	}

	// Count unread messages
	var count int64
	database.DB.Model(&models.Message{}).
		Where("team_id = ? AND NOT EXISTS (SELECT 1 FROM message_reads WHERE message_id = messages.id AND user_id = ?)", uint(teamID), userID).
		Count(&count)

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

// GetTeamChats - Get all teams with latest message for chat list
func GetTeamChats(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get all teams user is a member of
	var teamMembers []models.TeamMember
	database.DB.Preload("Team").Where("user_id = ? AND status = ?", userID, "active").Find(&teamMembers)

	type ChatInfo struct {
		TeamID        uint      `json:"team_id"`
		TeamName      string    `json:"team_name"`
		LastMessage   string    `json:"last_message"`
		LastMessageAt time.Time `json:"last_message_at"`
		SenderName    string    `json:"sender_name"`
		UnreadCount   int64     `json:"unread_count"`
	}

	chatList := make([]ChatInfo, 0)
	for _, tm := range teamMembers {
		var lastMessage models.Message
		result := database.DB.Preload("Sender").Where("team_id = ?", tm.TeamID).Order("created_at DESC").First(&lastMessage)

		var unreadCount int64
		database.DB.Model(&models.Message{}).
			Where("team_id = ? AND NOT EXISTS (SELECT 1 FROM message_reads WHERE message_id = messages.id AND user_id = ?)", tm.TeamID, userID).
			Count(&unreadCount)

		chatInfo := ChatInfo{
			TeamID:      tm.TeamID,
			TeamName:    tm.Team.Name,
			UnreadCount: unreadCount,
		}

		if result.Error == nil {
			// Format last message with file indicator
			if lastMessage.FileURL != "" {
				if lastMessage.Content != "" {
					chatInfo.LastMessage = lastMessage.Content + " 📎 " + lastMessage.FileName
				} else {
					chatInfo.LastMessage = "📎 " + lastMessage.FileName
				}
			} else {
				chatInfo.LastMessage = lastMessage.Content
			}
			chatInfo.LastMessageAt = lastMessage.CreatedAt
			chatInfo.SenderName = lastMessage.Sender.Name
		}

		chatList = append(chatList, chatInfo)
	}

	c.JSON(http.StatusOK, gin.H{"chats": chatList})
}

// DownloadFile - Download a file from a message
func DownloadFile(c *gin.Context) {
	messageID, err := strconv.ParseUint(c.Param("messageId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var message models.Message
	if result := database.DB.First(&message, messageID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	// Check if user is a member of the team
	var member models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND status = ?", message.TeamID, userID, "active").First(&member); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this file"})
		return
	}

	if message.FileURL == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "No file attached to this message"})
		return
	}

	c.File(message.FileURL)
}
