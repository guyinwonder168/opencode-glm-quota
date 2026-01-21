#!/bin/bash
# SonarQube MCP Server Launcher
# Ensures environment variables are expanded before running podman

set -a  # Export all environment variables
export SONARQUBE_TOKEN="${SONAR_TOKEN:-}"
export SONARQUBE_ORG="${SONAR_ORG:-}"

echo "Starting SonarQube MCP Server..."
echo "  Token: ${SONARQUBE_TOKEN:0:20}..."
echo "  Organization: ${SONARQUBE_ORG}"

exec podman run --rm --network host -i \
  -e "SONARQUBE_TOKEN=${SONARQUBE_TOKEN}" \
  -e "SONARQUBE_ORG=${SONARQUBE_ORG}" \
  mcp/sonarqube
