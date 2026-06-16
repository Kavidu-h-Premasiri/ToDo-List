package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
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

		// Notification routes
		api.GET("/notifications", controllers.GetMyNotifications)
		api.GET("/notifications/unread", controllers.GetUnreadCount)
		api.PUT("/notifications/:id/read", controllers.MarkNotificationAsRead)
		api.PUT("/notifications/read-all", controllers.MarkAllNotificationsAsRead)
		api.DELETE("/notifications/:id", controllers.DeleteNotification)

		// ========== MESSAGE ROUTES ==========
		api.GET("/chats", controllers.GetTeamChats)
		api.GET("/teams/:id/messages", controllers.GetTeamMessages)
		api.POST("/teams/:id/messages", controllers.SendMessage)
		api.PUT("/teams/:id/messages/read", controllers.MarkMessagesAsRead)
		api.GET("/teams/:id/messages/unread", controllers.GetTeamUnreadCount) // Renamed function
		api.GET("/messages/:messageId/file", controllers.DownloadFile)

		// Team routes
		api.POST("/teams", controllers.CreateTeam)
		api.GET("/teams", controllers.GetMyTeams)
		api.GET("/teams/:id", controllers.GetTeamDetails)
		api.POST("/teams/:id/invite", controllers.InviteMember)
		api.PUT("/teams/:id/members/:memberId", controllers.UpdateMemberRole)
		api.DELETE("/teams/:id/members/:memberId", controllers.RemoveMember)

		// Team Task routes
		api.GET("/teams/:id/members", controllers.GetTeamMembersList)
		api.POST("/teams/:id/tasks", controllers.CreateTeamTask)
		api.GET("/teams/:id/tasks", controllers.GetTeamTasks)
		api.PUT("/teams/:id/tasks/:taskId", controllers.UpdateTeamTask)
		api.DELETE("/teams/:id/tasks/:taskId", controllers.DeleteTeamTask)

		// My tasks
		api.GET("/my-tasks", controllers.GetMyAssignedTasks)

		// Personal task routes
		api.POST("/tasks", controllers.CreateTask)
		api.GET("/tasks", controllers.GetTasks)
		api.GET("/tasks/stats", controllers.GetTaskStats)
		api.GET("/tasks/:id", controllers.GetTask)
		api.PUT("/tasks/:id", controllers.UpdateTask)
		api.DELETE("/tasks/:id", controllers.DeleteTask)
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
}
