# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
BINARY_NAME=monitor-server
BINARY_UNIX=$(BINARY_NAME)_unix

# Build the application
build:
	$(GOBUILD) -o $(BINARY_NAME) -v ./cmd/server

# Build for Linux
build-linux:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) -o $(BINARY_UNIX) -v ./cmd/server

# Clean build artifacts
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -f $(BINARY_UNIX)

# Run tests
test:
	$(GOTEST) -v ./...

# Run tests with coverage
test-coverage:
	$(GOTEST) -v -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out

# Download dependencies
deps:
	$(GOMOD) download
	$(GOMOD) tidy

# Run the application
run: build
	./$(BINARY_NAME)

# Run the application in development mode
dev:
	$(GOCMD) run ./cmd/server

# Database migration to remove host management
migrate-remove-hosts:
	$(GOCMD) run ./cmd/migrate-remove-hosts

# Setup database with initial data
setup-db:
	$(GOCMD) run ./cmd/setup-db

# Format code
fmt:
	$(GOCMD) fmt ./...

# Run linter
lint:
	golangci-lint run

# Install golangci-lint
install-lint:
	curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $$(go env GOPATH)/bin v1.54.2

# Docker build
docker-build:
	docker build -t $(BINARY_NAME) .

# Docker run
docker-run:
	docker run -p 9000:9000 $(BINARY_NAME)

# Help
help:
	@echo "Available commands:"
	@echo "  build                - Build the application"
	@echo "  build-linux          - Build for Linux"
	@echo "  clean                - Clean build artifacts"
	@echo "  test                 - Run tests"
	@echo "  test-coverage        - Run tests with coverage"
	@echo "  deps                 - Download and tidy dependencies"
	@echo "  run                  - Build and run the application"
	@echo "  dev                  - Run in development mode"
	@echo "  migrate-remove-hosts - Remove host management from database"
	@echo "  setup-db             - Setup database with initial data"
	@echo "  fmt                  - Format code"
	@echo "  lint                 - Run linter"
	@echo "  install-lint         - Install golangci-lint"
	@echo "  docker-build         - Build Docker image"
	@echo "  docker-run           - Run Docker container"
	@echo "  help                 - Show this help"

.PHONY: build build-linux clean test test-coverage deps run dev migrate-remove-hosts setup-db fmt lint install-lint docker-build docker-run help