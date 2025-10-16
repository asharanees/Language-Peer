#!/bin/bash

# LanguagePeer One-Click Deployment
# The simplest way to deploy LanguagePeer

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 LanguagePeer One-Click Deploy${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Check if this is the first run
if [ ! -f ".deployment-initialized" ]; then
    echo -e "${YELLOW}First-time setup detected. This will:${NC}"
    echo "1. Install all prerequisites automatically"
    echo "2. Configure AWS CDK"
    echo "3. Deploy to development environment"
    echo "4. Run basic tests"
    echo ""
    
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
    
    # Mark as initialized
    touch .deployment-initialized
fi

echo -e "${GREEN}Starting automated deployment...${NC}"
echo ""

# Run the full automated deployment
if [ -f "scripts/auto-deploy.sh" ]; then
    chmod +x scripts/auto-deploy.sh
    ./scripts/auto-deploy.sh development false
else
    echo -e "${RED}Error: auto-deploy.sh not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 One-click deployment completed!${NC}"
echo ""
echo -e "${BLUE}Quick commands:${NC}"
echo -e "  Test the app: ${YELLOW}npm run test:integration${NC}"
echo -e "  View logs:    ${YELLOW}aws logs describe-log-groups --log-group-name-prefix '/aws/languagepeer'${NC}"
echo -e "  Cleanup:      ${YELLOW}npm run rollback${NC}"
echo ""