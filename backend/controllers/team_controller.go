package controllers

import (
	"backend/database"
	"backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateTeam(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateTeamRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if team with same name exists for this user
	var existingTeam models.Team
	if result := database.DB.Where("name = ? AND created_by = ?", req.Name, userID).First(&existingTeam); result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You already have a team with this name"})
		return
	}

	team := models.Team{
		Name:        req.Name,
		Description: req.Description,
		CreatedBy:   userID.(uint),
	}

	if result := database.DB.Create(&team); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create team: " + result.Error.Error()})
		return
	}

	// Add creator as admin
	teamMember := models.TeamMember{
		TeamID:    team.ID,
		UserID:    userID.(uint),
		Role:      "admin",
		Status:    "active",
		InvitedBy: userID.(uint),
	}
	database.DB.Create(&teamMember)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Team created successfully",
		"team":    team,
	})
}

func GetMyTeams(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var teamMembers []models.TeamMember
	if result := database.DB.Preload("Team").Where("user_id = ? AND status = ?", userID, "active").Find(&teamMembers); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch teams: " + result.Error.Error()})
		return
	}

	teams := make([]gin.H, 0)
	for _, tm := range teamMembers {
		if tm.Team.ID == 0 {
			continue
		}
		teamData := gin.H{
			"id":          tm.Team.ID,
			"name":        tm.Team.Name,
			"description": tm.Team.Description,
			"role":        tm.Role,
			"created_at":  tm.Team.CreatedAt,
		}
		teams = append(teams, teamData)
	}

	c.JSON(http.StatusOK, gin.H{"teams": teams})
}

func GetTeamDetails(c *gin.Context) {
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

	var team models.Team
	if result := database.DB.First(&team, teamID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
		return
	}

	var members []models.TeamMember
	database.DB.Preload("User").Where("team_id = ? AND status = ?", teamID, "active").Find(&members)

	memberList := make([]gin.H, 0)
	for _, m := range members {
		memberData := gin.H{
			"id":            m.User.ID,
			"name":          m.User.Name,
			"email":         m.User.Email,
			"role":          m.Role,
			"joined_at":     m.CreatedAt,
			"profile_photo": m.User.ProfilePhoto,
		}
		memberList = append(memberList, memberData)
	}

	c.JSON(http.StatusOK, gin.H{
		"team": gin.H{
			"id":          team.ID,
			"name":        team.Name,
			"description": team.Description,
			"created_by":  team.CreatedBy,
			"created_at":  team.CreatedAt,
		},
		"members":   memberList,
		"user_role": member.Role,
	})
}

func InviteMember(c *gin.Context) {
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

	var adminMember models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND role = ? AND status = ?", uint(teamID), userID, "admin", "active").First(&adminMember); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only team admins can invite members"})
		return
	}

	var req models.InviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var invitedUser models.User
	userExists := database.DB.Where("email = ?", req.Email).First(&invitedUser).Error == nil

	var invitedUserID uint
	if userExists {
		invitedUserID = invitedUser.ID

		var existingMember models.TeamMember
		if database.DB.Where("team_id = ? AND user_id = ?", uint(teamID), invitedUserID).First(&existingMember).Error == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "User is already a member of this team"})
			return
		}
	}

	teamMember := models.TeamMember{
		TeamID:    uint(teamID),
		UserID:    invitedUserID,
		Role:      req.Role,
		Status:    "active",
		InvitedBy: userID.(uint),
	}

	if !userExists {
		teamMember.Status = "pending"
	}

	if result := database.DB.Create(&teamMember); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to invite member: " + result.Error.Error()})
		return
	}

	message := "Invitation sent successfully"
	if userExists {
		message = "Member added successfully"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": message,
		"member": gin.H{
			"email":  req.Email,
			"role":   req.Role,
			"status": teamMember.Status,
		},
	})
}

func UpdateMemberRole(c *gin.Context) {
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

	memberID, err := strconv.ParseUint(c.Param("memberId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	var adminMember models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND role = ?", uint(teamID), userID, "admin").First(&adminMember); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only team admins can update roles"})
		return
	}

	var req models.UpdateMemberRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var member models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ?", uint(teamID), uint(memberID)).First(&member); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}

	member.Role = req.Role
	database.DB.Save(&member)

	c.JSON(http.StatusOK, gin.H{
		"message": "Member role updated successfully",
		"role":    member.Role,
	})
}

func RemoveMember(c *gin.Context) {
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

	memberID, err := strconv.ParseUint(c.Param("memberId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	var adminMember models.TeamMember
	if result := database.DB.Where("team_id = ? AND user_id = ? AND role = ?", uint(teamID), userID, "admin").First(&adminMember); result.Error != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only team admins can remove members"})
		return
	}

	if userID == uint(memberID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot remove yourself from the team"})
		return
	}

	result := database.DB.Where("team_id = ? AND user_id = ?", uint(teamID), uint(memberID)).Delete(&models.TeamMember{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member removed successfully"})
}
