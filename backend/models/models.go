package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"not null" json:"name"`
	Email        string         `gorm:"unique;not null" json:"email"`
	Password     string         `gorm:"not null" json:"-"`
	ProfilePhoto string         `json:"profile_photo"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	Tasks        []Task         `json:"tasks,omitempty"`
}

type Task struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `json:"description"`
	Status      string         `gorm:"default:pending" json:"status"`
	Priority    string         `gorm:"default:medium" json:"priority"`
	DueDate     *time.Time     `json:"due_date"`
	UserID      uint           `gorm:"not null" json:"user_id"`
	TeamID      *uint          `json:"team_id"`
	AssignedTo  *uint          `json:"assigned_to"`
	AssignedBy  *uint          `json:"assigned_by"`
	User        User           `gorm:"foreignKey:UserID" json:"-"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Team struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Description string         `json:"description"`
	CreatedBy   uint           `gorm:"not null" json:"created_by"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type TeamMember struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	TeamID    uint           `gorm:"not null" json:"team_id"`
	UserID    uint           `gorm:"not null" json:"user_id"`
	Role      string         `gorm:"default:member" json:"role"`
	Status    string         `gorm:"default:active" json:"status"`
	InvitedBy uint           `json:"invited_by"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Team      Team           `gorm:"foreignKey:TeamID" json:"team,omitempty"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type UpdateTaskRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	Status      *string    `json:"status"`
	Priority    *string    `json:"priority"`
	DueDate     *time.Time `json:"due_date"`
}

type CreateTeamRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type InviteRequest struct {
	Email string `json:"email" binding:"required,email"`
	Role  string `json:"role" binding:"required,oneof=admin member"`
}

type UpdateMemberRoleRequest struct {
	Role string `json:"role" binding:"required,oneof=admin member"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type AssignTaskRequest struct {
	AssignedTo uint `json:"assigned_to" binding:"required"`
}

type TeamTaskRequest struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	Priority    string     `json:"priority"`
	DueDate     *time.Time `json:"due_date"`
	AssignedTo  uint       `json:"assigned_to" binding:"required"`
}

// ============ NOTIFICATION MODELS ============
type Notification struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"not null" json:"user_id"`
	Type      string         `gorm:"not null" json:"type"`
	Title     string         `gorm:"not null" json:"title"`
	Message   string         `gorm:"not null" json:"message"`
	Data      string         `gorm:"type:jsonb" json:"data"`
	IsRead    bool           `gorm:"default:false" json:"is_read"`
	ReadAt    *time.Time     `json:"read_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type TaskMention struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TaskID      uint      `gorm:"not null" json:"task_id"`
	UserID      uint      `gorm:"not null" json:"user_id"`
	MentionedBy uint      `gorm:"not null" json:"mentioned_by"`
	CreatedAt   time.Time `json:"created_at"`
	Task        Task      `gorm:"foreignKey:TaskID" json:"task,omitempty"`
	User        User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// ============ MESSAGE MODELS ============
type Message struct {
	ID          uint                `gorm:"primaryKey" json:"id"`
	TeamID      uint                `gorm:"not null" json:"team_id"`
	SenderID    uint                `gorm:"not null" json:"sender_id"`
	Content     string              `json:"content"`
	FileURL     string              `json:"file_url"`
	FileName    string              `json:"file_name"`
	FileType    string              `json:"file_type"`
	FileSize    int64               `json:"file_size"`
	IsRead      bool                `gorm:"default:false" json:"is_read"`
	ReadAt      *time.Time          `json:"read_at"`
	CreatedAt   time.Time           `json:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at"`
	DeletedAt   gorm.DeletedAt      `gorm:"index" json:"-"`
	Team        Team                `gorm:"foreignKey:TeamID" json:"team,omitempty"`
	Sender      User                `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	ReadBy      []MessageRead       `gorm:"foreignKey:MessageID" json:"read_by,omitempty"`
	Attachments []MessageAttachment `gorm:"foreignKey:MessageID" json:"attachments,omitempty"`
}

// MessageRead - Tracks who has read which messages
type MessageRead struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	MessageID uint      `gorm:"not null" json:"message_id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	ReadAt    time.Time `json:"read_at"`
	Message   Message   `gorm:"foreignKey:MessageID" json:"-"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

type MessageAttachment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	MessageID uint      `gorm:"not null" json:"message_id"`
	FileURL   string    `gorm:"not null" json:"file_url"`
	FileName  string    `gorm:"not null" json:"file_name"`
	FileType  string    `gorm:"not null" json:"file_type"`
	FileSize  int64     `gorm:"not null" json:"file_size"`
	CreatedAt time.Time `json:"created_at"`
	Message   Message   `gorm:"foreignKey:MessageID" json:"-"`
}
