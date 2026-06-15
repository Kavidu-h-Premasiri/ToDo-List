package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func test_connection() {
	// Update with YOUR actual password
	connStr := "host=localhost user=postgres password=YOUR_ACTUAL_PASSWORD dbname=taskdb port=5432 sslmode=disable"

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Error opening connection:", err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatal("Cannot connect to database:", err)
	}

	fmt.Println("✓ Successfully connected to taskdb database!")
}
