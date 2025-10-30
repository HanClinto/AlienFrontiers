# GitHub Pages Deployment Setup

This repository is configured to automatically deploy the Alien Frontiers game to GitHub Pages whenever code is pushed to the `main` branch.

## Required Repository Settings

As the repository administrator, you need to complete the following one-time setup steps:

### 1. Enable GitHub Pages

1. Go to your repository Settings
2. Navigate to **Pages** (in the left sidebar under "Code and automation")
3. Under **Source**, select **GitHub Actions**
   - This allows the workflow to deploy to GitHub Pages

### 2. Verify Workflow Permissions

1. Go to your repository Settings
2. Navigate to **Actions** → **General** (in the left sidebar)
3. Scroll down to **Workflow permissions**
4. Ensure that **Read and write permissions** is selected (or at minimum, ensure workflows have permission to deploy to Pages)

## How It Works

The deployment workflow (`.github/workflows/deploy-pages.yml`) will:

1. Trigger automatically on every push to the `main` branch
2. Install Node.js and project dependencies
3. Build the project using `npm run build` in the `af-js/` directory
4. Deploy the contents of `af-js/dist/` to GitHub Pages

## After Setup

Once you've completed the required settings:

1. Merge this PR to the `main` branch
2. The workflow will automatically run and deploy the game
3. After the first successful deployment, your game will be available at:
   - `https://<your-username>.github.io/AlienFrontiers/`
   - Or if this is an organization: `https://<org-name>.github.io/AlienFrontiers/`

## Monitoring Deployments

You can monitor deployment status:
- Go to the **Actions** tab in your repository
- Look for the "Deploy to GitHub Pages" workflow runs
- Each run shows the build and deployment status

## Troubleshooting

If the deployment fails:
1. Check the Actions tab for error messages
2. Ensure the "Source" in Pages settings is set to "GitHub Actions"
3. Verify that the workflow has proper permissions
4. Check that the build completes successfully in the workflow logs

## Manual Deployment

If you need to manually trigger a deployment:
1. Make any commit to the `main` branch
2. Or use the "Re-run jobs" button on a previous workflow run in the Actions tab
