#!/bin/bash

# LanguagePeer Configuration Setup Script
# This script helps you configure all the manual inputs needed for deployment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                    LanguagePeer Configuration Setup                         ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    echo -e "${BLUE}$prompt${NC}"
    if [ -n "$default" ]; then
        echo -e "${YELLOW}Default: $default${NC}"
        read -p "Enter value (or press Enter for default): " input
        if [ -z "$input" ]; then
            input="$default"
        fi
    else
        read -p "Enter value: " input
        while [ -z "$input" ]; do
            echo -e "${RED}This field is required.${NC}"
            read -p "Enter value: " input
        done
    fi
    
    eval "$var_name='$input'"
}

# Function to validate GitHub repository
validate_github_repo() {
    local owner="$1"
    local repo="$2"
    
    echo -e "${BLUE}Validating GitHub repository...${NC}"
    
    if curl -s -f "https://api.github.com/repos/$owner/$repo" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Repository $owner/$repo exists and is accessible${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Repository $owner/$repo may not exist or is not public${NC}"
        echo -e "${YELLOW}  You can continue, but make sure to create the repository later${NC}"
        return 1
    fi
}

# Function to validate AWS credentials
validate_aws_credentials() {
    echo -e "${BLUE}Validating AWS credentials...${NC}"
    
    if aws sts get-caller-identity > /dev/null 2>&1; then
        local account=$(aws sts get-caller-identity --query Account --output text)
        local user=$(aws sts get-caller-identity --query Arn --output text)
        echo -e "${GREEN}✓ AWS credentials are valid${NC}"
        echo -e "${GREEN}  Account: $account${NC}"
        echo -e "${GREEN}  User: $user${NC}"
        return 0
    else
        echo -e "${RED}✗ AWS credentials are not configured${NC}"
        echo -e "${YELLOW}  Please run 'aws configure' to set up your credentials${NC}"
        return 1
    fi
}

echo -e "${BLUE}This script will help you configure the following:${NC}"
echo "1. GitHub repository information"
echo "2. AWS configuration"
echo "3. Domain names (optional)"
echo "4. Environment-specific settings"
echo ""

# Collect GitHub information
echo -e "${PURPLE}=== GitHub Configuration ===${NC}"
prompt_with_default "GitHub Username/Organization:" "" "GITHUB_OWNER"
prompt_with_default "Repository Name:" "language-peer" "GITHUB_REPO"

# Validate GitHub repository
validate_github_repo "$GITHUB_OWNER" "$GITHUB_REPO"

# Collect AWS information
echo ""
echo -e "${PURPLE}=== AWS Configuration ===${NC}"
prompt_with_default "AWS Region:" "us-east-1" "AWS_REGION"

# Validate AWS credentials
validate_aws_credentials

# Collect domain information (optional)
echo ""
echo -e "${PURPLE}=== Domain Configuration (Optional) ===${NC}"
echo -e "${YELLOW}If you have custom domains, enter them. Otherwise, press Enter to skip.${NC}"
prompt_with_default "Production Domain (e.g., languagepeer.com):" "" "PROD_DOMAIN"
prompt_with_default "Staging Domain (e.g., staging.languagepeer.com):" "" "STAGING_DOMAIN"

# Environment-specific questions
echo ""
echo -e "${PURPLE}=== Environment Configuration ===${NC}"
echo -e "${BLUE}Which environments do you want to deploy?${NC}"
echo "1. Development only (recommended for testing)"
echo "2. Development + Staging"
echo "3. All environments (Development + Staging + Production)"
read -p "Choose option (1-3): " env_choice

case $env_choice in
    1) DEPLOY_ENVS="development" ;;
    2) DEPLOY_ENVS="development staging" ;;
    3) DEPLOY_ENVS="development staging production" ;;
    *) DEPLOY_ENVS="development" ;;
esac

# Create configuration files
echo ""
echo -e "${BLUE}Creating configuration files...${NC}"

# Create .env file
cat > .env << EOF
# LanguagePeer Configuration
# Generated on $(date)

# GitHub Configuration
GITHUB_OWNER=$GITHUB_OWNER
GITHUB_REPO=$GITHUB_REPO

# AWS Configuration
AWS_DEFAULT_REGION=$AWS_REGION

# Domain Configuration
PROD_DOMAIN=$PROD_DOMAIN
STAGING_DOMAIN=$STAGING_DOMAIN

# Deployment Configuration
DEPLOY_ENVIRONMENTS="$DEPLOY_ENVS"
EOF

echo -e "${GREEN}✓ Created .env file${NC}"

# Update package.json with correct repository URLs
echo -e "${BLUE}Updating package.json...${NC}"

# Create a temporary file for sed operations
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|your-github-username|$GITHUB_OWNER|g" package.json
else
    # Linux
    sed -i "s|your-github-username|$GITHUB_OWNER|g" package.json
fi

echo -e "${GREEN}✓ Updated package.json${NC}"

# Update README.md
echo -e "${BLUE}Updating README.md...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|your-github-username|$GITHUB_OWNER|g" README.md
else
    # Linux
    sed -i "s|your-github-username|$GITHUB_OWNER|g" README.md
fi

echo -e "${GREEN}✓ Updated README.md${NC}"

# Update deployment guide
echo -e "${BLUE}Updating deployment documentation...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|your-github-username|$GITHUB_OWNER|g" docs/deployment-guide.md
    sed -i '' "s|your-github-username|$GITHUB_OWNER|g" docs/automated-deployment.md
else
    # Linux
    sed -i "s|your-github-username|$GITHUB_OWNER|g" docs/deployment-guide.md
    sed -i "s|your-github-username|$GITHUB_OWNER|g" docs/automated-deployment.md
fi

echo -e "${GREEN}✓ Updated documentation${NC}"

# Update infrastructure files
echo -e "${BLUE}Updating infrastructure configuration...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|your-github-username|$GITHUB_OWNER|g" src/infrastructure/app.ts
    sed -i '' "s|your-github-username|$GITHUB_OWNER|g" src/infrastructure/stacks/demo-stack.ts
    sed -i '' "s|your-github-username|$GITHUB_OWNER|g" scripts/setup-github-topics.sh
else
    # Linux
    sed -i "s|your-github-username|$GITHUB_OWNER|g" src/infrastructure/app.ts
    sed -i "s|your-github-username|$GITHUB_OWNER|g" src/infrastructure/stacks/demo-stack.ts
    sed -i "s|your-github-username|$GITHUB_OWNER|g" scripts/setup-github-topics.sh
fi

echo -e "${GREEN}✓ Updated infrastructure files${NC}"

# Update domain configurations if provided
if [ -n "$PROD_DOMAIN" ] || [ -n "$STAGING_DOMAIN" ]; then
    echo -e "${BLUE}Updating domain configurations...${NC}"
    
    # Update environment config with custom domains
    if [ -n "$PROD_DOMAIN" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|https://languagepeer.com|https://$PROD_DOMAIN|g" src/infrastructure/config/environments.ts
            sed -i '' "s|https://app.languagepeer.com|https://app.$PROD_DOMAIN|g" src/infrastructure/config/environments.ts
        else
            sed -i "s|https://languagepeer.com|https://$PROD_DOMAIN|g" src/infrastructure/config/environments.ts
            sed -i "s|https://app.languagepeer.com|https://app.$PROD_DOMAIN|g" src/infrastructure/config/environments.ts
        fi
    fi
    
    if [ -n "$STAGING_DOMAIN" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|https://staging.languagepeer.com|https://$STAGING_DOMAIN|g" src/infrastructure/config/environments.ts
        else
            sed -i "s|https://staging.languagepeer.com|https://$STAGING_DOMAIN|g" src/infrastructure/config/environments.ts
        fi
    fi
    
    echo -e "${GREEN}✓ Updated domain configurations${NC}"
fi

# Create deployment summary
echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                           CONFIGURATION SUMMARY                             ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}GitHub Repository:${NC} https://github.com/$GITHUB_OWNER/$GITHUB_REPO"
echo -e "${GREEN}AWS Region:${NC} $AWS_REGION"
if [ -n "$PROD_DOMAIN" ]; then
    echo -e "${GREEN}Production Domain:${NC} $PROD_DOMAIN"
fi
if [ -n "$STAGING_DOMAIN" ]; then
    echo -e "${GREEN}Staging Domain:${NC} $STAGING_DOMAIN"
fi
echo -e "${GREEN}Deployment Environments:${NC} $DEPLOY_ENVS"
echo ""

# Create next steps
echo -e "${PURPLE}=== Next Steps ===${NC}"
echo ""
echo -e "${BLUE}1. Review Configuration:${NC}"
echo "   - Check the generated .env file"
echo "   - Verify all placeholders have been replaced"
echo ""
echo -e "${BLUE}2. Set up GitHub Repository (if not exists):${NC}"
echo "   - Create repository: https://github.com/new"
echo "   - Repository name: $GITHUB_REPO"
echo "   - Make it public for GitHub Actions"
echo ""
echo -e "${BLUE}3. Configure AWS Credentials (if not done):${NC}"
echo "   - Run: aws configure"
echo "   - Enter your AWS Access Key ID and Secret"
echo ""
echo -e "${BLUE}4. Deploy the Application:${NC}"
echo "   - Quick deploy: npm run deploy:one-click"
echo "   - Or manual: npm run deploy:auto"
echo ""
echo -e "${BLUE}5. Set up CI/CD (optional):${NC}"
echo "   - Push code to GitHub"
echo "   - Configure GitHub Secrets for AWS credentials"
echo "   - GitHub Actions will handle automatic deployments"
echo ""

# Save configuration for later reference
cat > deployment-config.md << EOF
# LanguagePeer Deployment Configuration

Generated on: $(date)

## Configuration Summary

- **GitHub Repository**: https://github.com/$GITHUB_OWNER/$GITHUB_REPO
- **AWS Region**: $AWS_REGION
- **Production Domain**: ${PROD_DOMAIN:-"Not configured"}
- **Staging Domain**: ${STAGING_DOMAIN:-"Not configured"}
- **Deployment Environments**: $DEPLOY_ENVS

## Environment Variables

The following environment variables have been configured in .env:

\`\`\`bash
GITHUB_OWNER=$GITHUB_OWNER
GITHUB_REPO=$GITHUB_REPO
AWS_DEFAULT_REGION=$AWS_REGION
PROD_DOMAIN=$PROD_DOMAIN
STAGING_DOMAIN=$STAGING_DOMAIN
DEPLOY_ENVIRONMENTS="$DEPLOY_ENVS"
\`\`\`

## Files Updated

- package.json (repository URLs)
- README.md (GitHub links and badges)
- docs/deployment-guide.md (GitHub references)
- docs/automated-deployment.md (GitHub references)
- src/infrastructure/app.ts (GitHub configuration)
- src/infrastructure/stacks/demo-stack.ts (GitHub links)
- src/infrastructure/config/environments.ts (domain configuration)

## Next Steps

1. Review all updated files
2. Create GitHub repository if it doesn't exist
3. Configure AWS credentials: \`aws configure\`
4. Deploy: \`npm run deploy:one-click\`

## Troubleshooting

If you need to reconfigure:
1. Delete .env file
2. Run this script again: \`./scripts/setup-config.sh\`

For deployment issues, check:
- AWS credentials: \`aws sts get-caller-identity\`
- GitHub repository exists and is accessible
- All required AWS services are available in your region
EOF

echo -e "${GREEN}✓ Configuration summary saved to deployment-config.md${NC}"
echo ""
echo -e "${GREEN}🎉 Configuration setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Ready to deploy? Run: ${GREEN}npm run deploy:one-click${NC}"