package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// Serve static files for uploaded images
	r.Static("/uploads", "./uploads")

	// Public routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
	}

	// Protected routes
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		// User routes
		api.GET("/user", controllers.GetCurrentUser)

		// Profile photo routes
		api.POST("/user/profile-photo", controllers.UploadProfilePhoto)
		api.GET("/user/profile-photo", controllers.GetProfilePhoto)
		api.DELETE("/user/profile-photo", controllers.DeleteProfilePhoto)

		// Task routes
		api.POST("/tasks", controllers.CreateTask)
		api.GET("/tasks", controllers.GetTasks)
		api.GET("/tasks/stats", controllers.GetTaskStats)
		api.GET("/tasks/:id", controllers.GetTask)
		api.PUT("/tasks/:id", controllers.UpdateTask)
		api.DELETE("/tasks/:id", controllers.DeleteTask)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
