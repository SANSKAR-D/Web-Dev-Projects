FROM ubuntu:22.04

# Avoid prompts from apt during build
ENV DEBIAN_FRONTEND=noninteractive

# Update apt and install required tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create a non-privileged user for running code
RUN useradd -m judgeuser

# Set the working directory
WORKDIR /app
