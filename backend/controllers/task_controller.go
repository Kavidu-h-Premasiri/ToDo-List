package controllers

import (
	"backend/database"
	"backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateTask(c *gin.Context) {
	userID, _ := c.Get("userID")

	var task models.Task
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	task.UserID = userID.(uint)

	if result := database.DB.Create(&task); result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to create task"})
		return
	}

	c.JSON(http.StatusCreated, models.SuccessResponse{
		Message: "Task created successfully",
		Data:    task,
	})
}

func GetTasks(c *gin.Context) {
	userID, _ := c.Get("userID")

	var tasks []models.Task

	// IMPORTANT: Get tasks where user is the creator OR assigned to the user
	query := database.DB.Where("user_id = ? OR assigned_to = ?", userID, userID)

	// Filter by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by priority
	if priority := c.Query("priority"); priority != "" {
		query = query.Where("priority = ?", priority)
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var total int64
	query.Model(&models.Task{}).Count(&total)

	result := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&tasks)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to fetch tasks"})
		return
	}

	// Get assignee names for tasks
	type TaskWithAssignee struct {
		models.Task
		AssigneeName string `json:"assignee_name"`
	}

	resultTasks := make([]TaskWithAssignee, 0)
	for _, task := range tasks {
		var assignee models.User
		assigneeName := ""
		if task.AssignedTo != nil {
			database.DB.First(&assignee, *task.AssignedTo)
			assigneeName = assignee.Name
		}
		resultTasks = append(resultTasks, TaskWithAssignee{
			Task:         task,
			AssigneeName: assigneeName,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"tasks": resultTasks,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func GetTask(c *gin.Context) {
	userID, _ := c.Get("userID")
	taskID := c.Param("id")

	var task models.Task
	// Allow access if user created it OR is assigned to it
	if result := database.DB.Where("id = ? AND (user_id = ? OR assigned_to = ?)", taskID, userID, userID).First(&task); result.Error != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Task not found"})
		return
	}

	c.JSON(http.StatusOK, task)
}

func UpdateTask(c *gin.Context) {
	userID, _ := c.Get("userID")
	taskID := c.Param("id")

	var task models.Task
	if result := database.DB.Where("id = ? AND (user_id = ? OR assigned_to = ?)", taskID, userID, userID).First(&task); result.Error != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Task not found"})
		return
	}

	var req models.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
		return
	}

	// Update fields
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

	database.DB.Save(&task)

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Task updated successfully",
		Data:    task,
	})
}

func DeleteTask(c *gin.Context) {
	userID, _ := c.Get("userID")
	taskID := c.Param("id")

	// Only creator can delete
	result := database.DB.Where("id = ? AND user_id = ?", taskID, userID).Delete(&models.Task{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete task"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Task not found"})
		return
	}

	c.JSON(http.StatusOK, models.SuccessResponse{
		Message: "Task deleted successfully",
	})
}

func GetTaskStats(c *gin.Context) {
	userID, _ := c.Get("userID")

	var stats struct {
		Total      int64 `json:"total"`
		Pending    int64 `json:"pending"`
		InProgress int64 `json:"in_progress"`
		Completed  int64 `json:"completed"`
		High       int64 `json:"high_priority"`
		Medium     int64 `json:"medium_priority"`
		Low        int64 `json:"low_priority"`
	}

	// Count tasks where user is creator OR assigned
	database.DB.Model(&models.Task{}).Where("user_id = ? OR assigned_to = ?", userID, userID).Count(&stats.Total)
	database.DB.Model(&models.Task{}).Where("(user_id = ? OR assigned_to = ?) AND status = ?", userID, userID, "pending").Count(&stats.Pending)
	database.DB.Model(&models.Task{}).Where("(user_id = ? OR assigned_to = ?) AND status = ?", userID, userID, "in_progress").Count(&stats.InProgress)
	database.DB.Model(&models.Task{}).Where("(user_id = ? OR assigned_to = ?) AND status = ?", userID, userID, "completed").Count(&stats.Completed)
	database.DB.Model(&models.Task{}).Where("(user_id = ? OR assigned_to = ?) AND priority = ?", userID, userID, "high").Count(&stats.High)
	database.DB.Model(&models.Task{}).Where("(user_id = ? OR assigned_to = ?) AND priority = ?", userID, userID, "medium").Count(&stats.Medium)
	database.DB.Model(&models.Task{}).Where("(user_id = ? OR assigned_to = ?) AND priority = ?", userID, userID, "low").Count(&stats.Low)

	c.JSON(http.StatusOK, stats)
}

// GetMyAssignedTasks - Get tasks assigned to current user (for team tasks)
func GetMyAssignedTasks(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var tasks []models.Task
	query := database.DB.Where("assigned_to = ?", userID).Order("created_at DESC")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	query.Find(&tasks)

	type TaskWithDetails struct {
		models.Task
		TeamName       string `json:"team_name"`
		AssignedByName string `json:"assigned_by_name"`
	}

	result := make([]TaskWithDetails, 0)
	for _, task := range tasks {
		var team models.Team
		var assigner models.User

		if task.TeamID != nil {
			database.DB.First(&team, *task.TeamID)
		}
		if task.AssignedBy != nil {
			database.DB.First(&assigner, *task.AssignedBy)
		}

		result = append(result, TaskWithDetails{
			Task:           task,
			TeamName:       team.Name,
			AssignedByName: assigner.Name,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"tasks": result,
		"total": len(result),
	})
}
