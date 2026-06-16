package controllers

import (
	"backend/database"
	"backend/models"
	"backend/utils"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func UploadProfilePhoto(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get file from form data
	file, err := c.FormFile("profile_photo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Check file type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	contentType := file.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only images are allowed"})
		return
	}

	// Check file size (max 5MB)
	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large. Maximum size is 5MB"})
		return
	}

	// Create uploads directory if not exists
	uploadDir := "uploads/profile_photos"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename
	extension := filepath.Ext(file.Filename)
	filename := utils.GenerateRandomString() + extension
	filePath := filepath.Join(uploadDir, filename)

	// Save file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Update user profile photo path in database
	var user models.User
	if result := database.DB.First(&user, userID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Delete old photo if exists
	if user.ProfilePhoto != "" {
		oldPath := user.ProfilePhoto
		os.Remove(oldPath)
	}

	// Update user with new photo path
	user.ProfilePhoto = filePath
	database.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Profile photo uploaded successfully",
		"photo_url": "/" + filePath,
	})
}

func GetProfilePhoto(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var user models.User
	if result := database.DB.First(&user, userID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"profile_photo": user.ProfilePhoto,
	})
}

func DeleteProfilePhoto(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var user models.User
	if result := database.DB.First(&user, userID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Delete photo file
	if user.ProfilePhoto != "" {
		os.Remove(user.ProfilePhoto)
	}

	// Clear photo path in database
	user.ProfilePhoto = ""
	database.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{"message": "Profile photo deleted successfully"})
}
