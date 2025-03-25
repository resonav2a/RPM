#!/bin/bash
# Simple deployment script for RPM frontend

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start the Docker container
echo "Building and starting the Docker container..."
docker-compose up --build -d

# Check if the container is running
if [ $? -eq 0 ]; then
    echo "Deployment successful! Your application is now running at http://localhost:8080"
    echo "To view logs: docker-compose logs -f"
    echo "To stop the container: docker-compose down"
else
    echo "Deployment failed. Please check the logs: docker-compose logs"
fi