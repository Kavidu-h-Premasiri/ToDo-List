// backend/database/database.go
package database

import (
	"backend/models"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() {
	var dsn string

	// Cloud එකේදී Render/Neon මඟින් දෙන DATABASE_URL එක තියෙනවද බලනවා
	if cloudURL := os.Getenv("DATABASE_URL"); cloudURL != "" {
		dsn = cloudURL
	} else {
		// DATABASE_URL එක නැත්නම් (Local එකේදී) ඔයාගේ කලින් DSN එකම පාවිච්චි කරනවා
		dsn = "host=" + os.Getenv("DB_HOST") +
			" user=" + os.Getenv("DB_USER") +
			" password=" + os.Getenv("DB_PASSWORD") +
			" dbname=" + os.Getenv("DB_NAME") +
			" port=" + os.Getenv("DB_PORT") +
			" sslmode=disable TimeZone=UTC"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully")

	// Auto migrate all schemas
	err = DB.AutoMigrate(
		&models.User{},
		&models.Task{},
		&models.Team{},
		&models.TeamMember{},
		&models.TeamTask{},
		&models.Notification{},
		&models.TaskMention{},
		&models.Message{},
		&models.MessageRead{},
		&models.MessageAttachment{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database migration completed")
}
