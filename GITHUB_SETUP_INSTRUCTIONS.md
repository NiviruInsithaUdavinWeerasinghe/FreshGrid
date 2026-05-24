# GitHub Setup Instructions

Follow these steps to initialize a Git repository for your FreshGrid project and push it to GitHub.

## 1. Prerequisites: Ignore Sensitive & Unnecessary Files
Before you start tracking files, make sure you don't commit `node_modules`, `.env` files, or any build artifacts. 
Since you have a Node.js backend and frontend, ensure you have a `.gitignore` file in your root directory (or in both `frontend/` and `backend/` directories) containing at least the following:
```text
node_modules/
.env
.DS_Store
dist/
build/
```

## 2. Initialize the Local Git Repository
Open your terminal, navigate to the root directory of your project (`c:\FreshGrid`), and run:
```bash
git init
```

## 3. Stage All Your Files
Add all your project files to the staging area:
```bash
git add .
```

## 4. Commit Your Files
Create your first commit with a descriptive message:
```bash
git commit -m "Initial commit: Set up FreshGrid project"
```

## 5. Create a New Repository on GitHub
1. Go to [github.com](https://github.com/) and log in to your account.
2. Click the **"+"** icon in the top right corner and select **"New repository"**.
3. Name your repository (e.g., `FreshGrid`).
4. Leave it as Public or Private according to your preference.
5. **Do NOT** check "Initialize this repository with a README", "Add .gitignore", or "Choose a license" (since you already have local files).
6. Click **"Create repository"**.

## 6. Link Your Local Repo to GitHub
After creating the repository, GitHub will show you a "Quick setup" page. Copy the commands under the section titled **"…or push an existing repository from the command line"**.

Usually, the commands look like this:

Rename your default branch to `main` (if it isn't already):
```bash
git branch -M main
```

Add the remote repository URL (replace the URL with your actual repository URL):
```bash
git remote add origin https://github.com/YourUsername/FreshGrid.git
```

## 7. Push Your Code to GitHub
Finally, push your committed code to the GitHub repository:
```bash
git push -u origin main
```

That's it! Your code is now safely backed up on GitHub. For future changes, you only need to run:
1. `git add .`
2. `git commit -m "Your update message"`
3. `git push`
