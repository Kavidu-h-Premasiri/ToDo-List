package controllers

import (
	"backend/database"
	"backend/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetTeamMembersList - Get list of team members for assignment
func GetTeamMembersList(c *gin.Context) {
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

	var member models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND status = ?", uint(teamID), userID, "active").First(&member); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this team"})
		return
	}

	var members []models.TeamMember
	database.DB.Preload("User").Where("team_id = ? AND status = ?", uint(teamID), "active").Find(&members)

	memberList := make([]gin.H, 0)
	for _, m := range members {
		memberData := gin.H{
			"id":    m.User.ID,
			"name":  m.User.Name,
			"email": m.User.Email,
			"role":  m.Role,
		}
		memberList = append(memberList, memberData)
	}

	c.JSON(http.StatusOK, gin.H{
		"members":   memberList,
		"user_role": member.Role,
	})
}

// CreateTeamTask - ONLY ADMIN can create tasks
func CreateTeamTask(c *gin.Context) {
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

	// ONLY ADMIN can create tasks
	var member models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND role = ? AND status = ?", uint(teamID), userID, "admin", "active").First(&member); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only team admins can create team tasks"})
		return
	}

	var req struct {
		Title       string     `json:"title" binding:"required"`
		Description string     `json:"description"`
		Status      string     `json:"status"`
		Priority    string     `json:"priority"`
		DueDate     *time.Time `json:"due_date"`
		AssignedTo  uint       `json:"assigned_to" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var assignedMember models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND status = ?", uint(teamID), req.AssignedTo, "active").First(&assignedMember); result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Assigned user is not a member of this team"})
		return
	}

	task := models.Task{
		Title:       req.Title,
		Description: req.Description,
		Status:      "pending",
		Priority:    "medium",
		UserID:      userID.(uint),
		TeamID:      &[]uint{uint(teamID)}[0],
		AssignedTo:  &req.AssignedTo,
		AssignedBy:  &[]uint{userID.(uint)}[0],
	}

	if req.Priority != "" {
		task.Priority = req.Priority
	}
	if req.Status != "" {
		task.Status = req.Status
	}
	if req.DueDate != nil {
		task.DueDate = req.DueDate
	}

	if result := database.DB.Create(&task); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task: " + result.Error.Error()})
		return
	}

	var assignee models.User
	database.DB.First(&assignee, req.AssignedTo)

	var team models.Team
	database.DB.First(&team, teamID)

	// Send notifications (async)
	go func() {
		// Notify the assigned user
		notificationData := map[string]interface{}{
			"task_id":     task.ID,
			"task_title":  task.Title,
			"team_id":     teamID,
			"team_name":   team.Name,
			"assigned_by": userID,
		}

		CreateNotification(
			req.AssignedTo,
			"task_assigned",
			"New Task Assigned",
			"You have been assigned a new task: "+task.Title+" in team "+team.Name,
			notificationData,
		)

		// Notify the admin who assigned the task (if different from assignee)
		if userID.(uint) != req.AssignedTo {
			CreateNotification(
				userID.(uint),
				"task_assigned",
				"Task Assigned Successfully",
				"You assigned task '"+task.Title+"' to "+assignee.Name+" in team "+team.Name,
				notificationData,
			)
		}
	}()

	c.JSON(http.StatusCreated, gin.H{
		"message":       "Task assigned successfully",
		"task":          task,
		"assignee_name": assignee.Name,
	})
}

// GetTeamTasks - Members see only their tasks, Admins see all
func GetTeamTasks(c *gin.Context) {
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

	var member models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND status = ?", uint(teamID), userID, "active").First(&member); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have access to this team"})
		return
	}

	var tasks []models.Task
	query := database.DB.Where("team_id = ?", uint(teamID))

	// MEMBERS: Only see their own tasks
	// ADMINS: See all tasks
	if member.Role != "admin" {
		query = query.Where("assigned_to = ?", userID)
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if priority := c.Query("priority"); priority != "" {
		query = query.Where("priority = ?", priority)
	}
	if assignedTo := c.Query("assigned_to"); assignedTo != "" && member.Role == "admin" {
		query = query.Where("assigned_to = ?", assignedTo)
	}

	query.Order("created_at DESC").Find(&tasks)

	type TaskWithAssignee struct {
		models.Task
		AssigneeName  string `json:"assignee_name"`
		AssigneeEmail string `json:"assignee_email"`
		CreatorName   string `json:"creator_name"`
	}

	result := make([]TaskWithAssignee, 0)
	for _, task := range tasks {
		var assignee models.User
		var creator models.User

		if task.AssignedTo != nil {
			database.DB.First(&assignee, *task.AssignedTo)
		}
		database.DB.First(&creator, task.UserID)

		result = append(result, TaskWithAssignee{
			Task:          task,
			AssigneeName:  assignee.Name,
			AssigneeEmail: assignee.Email,
			CreatorName:   creator.Name,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"tasks":     result,
		"user_role": member.Role,
		"total":     len(result),
		"is_admin":  member.Role == "admin",
	})
}

// UpdateTeamTask - STRICT permissions
func UpdateTeamTask(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	taskID, err := strconv.ParseUint(c.Param("taskId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task models.Task
	if result := database.DB.First(&task, taskID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	var member models.TeamMember
	isAdmin := false
	isAssignedUser := false

	if task.TeamID != nil {
		if result := database.DB.Where("team_id = ? AND user_id = ? AND status = ?", *task.TeamID, userID, "active").First(&member); result.Error == nil {
			isAdmin = member.Role == "admin"
			isAssignedUser = (task.AssignedTo != nil && *task.AssignedTo == userID)
		}
	}

	// PERMISSIONS:
	// - Admin: Can update everything
	// - Member: Can ONLY update status
	// - Others: No access
	if !isAdmin && !isAssignedUser {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to update this task"})
		return
	}

	var req struct {
		Title       *string    `json:"title"`
		Description *string    `json:"description"`
		Status      *string    `json:"status"`
		Priority    *string    `json:"priority"`
		DueDate     *time.Time `json:"due_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	oldStatus := task.Status

	// MEMBER: ONLY status can be updated
	if !isAdmin && isAssignedUser {
		// Check if they're trying to update anything else
		if req.Title != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Members can only update task status"})
			return
		}
		if req.Description != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Members can only update task status"})
			return
		}
		if req.Priority != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Members can only update task status"})
			return
		}
		if req.DueDate != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Members can only update task status"})
			return
		}

		// ONLY status
		if req.Status == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status is required"})
			return
		}
		task.Status = *req.Status
	} else if isAdmin {
		// ADMIN: Can update everything
		if req.Title != nil {
			task.Title = *req.Title
		}
		if req.Description != nil {
			task.Description = *req.Description
		}
		if req.Status != nil {
			task.Status = *req.Status
		}
		if req.Priority != nil {
			task.Priority = *req.Priority
		}
		if req.DueDate != nil {
			task.DueDate = req.DueDate
		}
	}

	database.DB.Save(&task)

	// Send notifications for status changes (async)
	if req.Status != nil && *req.Status != oldStatus {
		go func() {
			var updatedBy models.User
			database.DB.First(&updatedBy, userID)

			var team models.Team
			if task.TeamID != nil {
				database.DB.First(&team, *task.TeamID)
			}

			notificationData := map[string]interface{}{
				"task_id":         task.ID,
				"task_title":      task.Title,
				"team_id":         task.TeamID,
				"team_name":       team.Name,
				"old_status":      oldStatus,
				"new_status":      *req.Status,
				"updated_by":      userID,
				"updated_by_name": updatedBy.Name,
			}

			// Notify the assignee if different from updater
			if task.AssignedTo != nil && *task.AssignedTo != userID {
				CreateNotification(
					*task.AssignedTo,
					"task_updated",
					"Task Status Updated",
					"Task '"+task.Title+"' status changed from '"+oldStatus+"' to '"+*req.Status+"' by "+updatedBy.Name,
					notificationData,
				)
			}

			// Notify the creator if different from assignee and updater
			if task.UserID != userID && (task.AssignedTo == nil || task.UserID != *task.AssignedTo) {
				CreateNotification(
					task.UserID,
					"task_updated",
					"Task Status Updated",
					"Task '"+task.Title+"' status changed from '"+oldStatus+"' to '"+*req.Status+"' by "+updatedBy.Name,
					notificationData,
				)
			}

			// If task is completed, send completion notification
			if *req.Status == "completed" && oldStatus != "completed" {
				if task.AssignedTo != nil {
					CreateNotification(
						*task.AssignedTo,
						"task_completed",
						"Task Completed 🎉",
						"Task '"+task.Title+"' has been marked as completed by "+updatedBy.Name,
						notificationData,
					)
				}
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Task updated successfully",
		"task":    task,
	})
}

// DeleteTeamTask - ONLY ADMIN can delete
func DeleteTeamTask(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	taskID, err := strconv.ParseUint(c.Param("taskId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task models.Task
	if result := database.DB.First(&task, taskID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	if task.TeamID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This is not a team task"})
		return
	}

	var member models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND role = ? AND status = ?", *task.TeamID, userID, "admin", "active").First(&member); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only team admins can delete team tasks"})
		return
	}

	// Notify the assignee before deletion (async)
	if task.AssignedTo != nil {
		go func() {
			var team models.Team
			database.DB.First(&team, *task.TeamID)

			var deletedBy models.User
			database.DB.First(&deletedBy, userID)

			notificationData := map[string]interface{}{
				"task_id":         task.ID,
				"task_title":      task.Title,
				"team_id":         task.TeamID,
				"team_name":       team.Name,
				"deleted_by":      userID,
				"deleted_by_name": deletedBy.Name,
			}

			CreateNotification(
				*task.AssignedTo,
				"task_deleted",
				"Task Deleted",
				"Task '"+task.Title+"' has been deleted by "+deletedBy.Name+" from team "+team.Name,
				notificationData,
			)
		}()
	}

	database.DB.Delete(&task)

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
