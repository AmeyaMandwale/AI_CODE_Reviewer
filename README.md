# Ctpl-Code-Reviewer

## 🚀 How to Run the Project

Follow the steps below to set up and run both the backend and frontend.

---

### ✅ 1. Start the Backend

````bash
cd Ctpl-Code-Reviewer
cd GitHubIntegrationsBackend
dotnet run

### To create database:
 # Update the appsetting.json:
"ConnectionStrings": {
    "DefaultConnection": "server=localhost;port=3306;database=CodeReviewerDB;user=root;password=yourMysqlpassword"
  }

#  Then run below commands in terminal inside Ctpl-Code-Reviewer\GitHubIntegrationsBackend>:
  dotnet ef migrations add InitialCreate
  dotnet ef database update

### To "Continue with Github and GitLab" make sure below credentials are present:

  1. In appsetting.json:

  "GitHub": {
    "ClientId": "Ov23lijTHNbYocp5JnYL",
    "ClientSecret": "389b27a232d8896ceadaaf3f6043f35cb7531780"
  }

  2.  if .env is present then update below credentials, otherwise create new  file with .env in backend
# GITHUB OAUTH
GITHUB_CLIENT_ID=Ov23liC4CVKZQJFKbe9b
GITHUB_CLIENT_SECRET=536d955efd41ae9d176374e43528600229a08d39
GITHUB_REDIRECT_URI=http://localhost:5142/api/sourcecontrol/github/callback

# GITLAB OAUTH
GITLAB_CLIENT_ID=c40d8ff4fa806dc98017fe9e4420ff5a9b34716d7e371412942c5d82dfeb29fb
GITLAB_CLIENT_SECRET=gloas-67c2e901140a09ed164fda47e91a51d15d3e35b47f364ed7b8106d9f2541465f
GITLAB_REDIRECT_URI=http://localhost:5142/api/sourcecontrol/gitlab/callback
GITHUB_TOKEN=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 # for access github logs need permissions.

✅ 2. Start the Frontend

```bash
cd Ctpl-Code-Reviewer
cd frontend
npm install
npm run dev

````

## Set Up for SAST SCA Report
## 1. **Install Snyk CLI** 
```bash
npm install -g snyk snyk-to-html
snyk --version
snyk-to-html --version
```
## 2. **Login to Snyk** 
```bash
snyk auth
```
## 3.**Configure Backend (appsettings.json)**
```bash
"Snyk": {
  "Path": "C:\\Users\\<user>\\AppData\\Roaming\\npm\\snyk.cmd",
  "HtmlConverter": "C:\\Users\\<user>\\AppData\\Roaming\\npm\\snyk-to-html.cmd",
  "Severity": "low",
  "Org": ""
},
"SastTriggerSecret": "your-secret",
"PublicBaseUrl": "http://localhost:5142",
"GitHubPAT": "ghp_xxxxxxxxxxxxxxxxxxx"
```
## 4.**Validate paths:**
```bash
where snyk
where snyk-to-html
```
### 1.**where snyk** --> output of this command paste into Path (.cmd )<br/>
### 2.**where snyk-to-html** --> output of this command paste into HtmlConverter (.cmd )

## 5. **Generate GitHub PAT**

**Open:** https://github.com/settings/tokens  
**Fine-grained tokens → Generate**  

### **Permissions:**

- **Contents → Read**  
- **Pull Requests → Read & Write**  
- **Metadata → Read**



## Run in Extension Development Host (Debug Mode)

1. **Open the extension project folder** in VS Code (/extensionReviewer).
   2.\*\* Make sure backend is runnning.
2. **Compile TypeScript (if the extension is written in TypeScript)**

   ```bash
   npm run compile

   ```

3. Press **F5** (or go to **Run → Start Debugging**) [go to extension folder].

4. A new VS Code window will open — this is called the **Extension Development Host**.

5. **Trigger a review**

   Make a code change, then stage and commit it to trigger the automatic review hook:

   ```bash
   git add .
   git commit -m "Test AI Review"
   ```

   The extension detects the commit and starts the AI Code Review. Results appear in **View → Output → AI Code Review**.


# AI Code Review — Quick Steps

### 1. Install Extension [Backend Should be Running]

* Open: [https://marketplace.visualstudio.com/items?itemName=ConnecticusTechnologies.aicodereview](https://marketplace.visualstudio.com/items?itemName=ConnecticusTechnologies.aicodereview)
* Click **Install** → Reload VS Code.

### 2. Open Extension

* In VS Code left sidebar, click **AI Review**.
* Login page appears.

### 3. Login

* Enter the default username & password provided to you (Given In Below).

### 4. Open Git Repo

* Open any project folder with Git.
* Make a commit.

### 5. Run AI Review

* After commit, results appear in:

  * **Output panel**
  * **AI Code Review panel**

### 6. Generate Test Case

* Click **Generate Test Case** in the extension panel.

### 7. Validate Test Case

* Click **Validate Test Case**.
* If validation succeeds → next step happens automatically.

### 8. Auto Push to `test/` Folder

* After successful validation, test files are automatically pushed/added into the `test` folder.

---
# Extension Credentials

```text
email: admin@example.com
password: 123456
```

---

   ## 🧩 How to Run and Test the Eclipse Plugin

Follow these steps to launch and verify your Eclipse plugin inside a runtime Eclipse environment.

---

### 🪜 Step-by-Step Instructions

## URL : https://pnkjshahare.github.io/eclipse-aicodereview-update-site/
## 1 Open Install Dialog
- In Eclipse: **Help → Install New Software…**

## 2 Add Update Site
- Click **Add…**
- **Name:** `AI Code Review Update Site`
- **Location:** paste the URL above
- Click **OK**

## 3 Select Plugin
- Wait for loading  
- If empty → **uncheck “Group items by category”**
- Select your feature (e.g. *AI Code Review Plugin*)
- Click **Next**

## 4 Accept License
- Click **Next → I accept the terms → Finish**

## 5 Security Warning
- If shown, click **Install anyway**

## 7 Restart Eclipse
- Choose **Restart Now**

---

### ✔ After Installation
- **View plugin:** `AI Tool show in Top Navbar
- login using above credential which same for vs code also.
- Or check menu/context options based on your plugin configuration.

---

🎉 Your plugin should now be active!

# Demo video drive link

https://drive.google.com/drive/folders/1ikb5ATEk6RriyCFNy_yjp8fDHdnpa1bY?usp=sharing