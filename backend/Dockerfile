# --- Stage 1: Build the binary ---
FROM golang:1.25-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy and download dependencies (enables Docker layer caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build a statically linked binary (CGO disabled for smaller binary)
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o main .

# --- Stage 2: Final lightweight runtime ---
FROM alpine:latest

# Install ca-certificates and timezone data
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the compiled binary from the builder stage
COPY --from=builder /app/main .

# Copy .env file if it exists
COPY --from=builder /app/.en[v] ./

# Create uploads directories
RUN mkdir -p uploads/profile_photos uploads/messages

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"]