# Sprint-3

## Environment Readiness Check (Python + Anaconda)

This PR is a minimal proof that my local machine is ready for upcoming Data Science/ML work.

## Installation Status

1. Python: Installed and accessible from terminal
2. Anaconda: Installed locally
3. Conda: Verified from terminal after PowerShell initialization

## Terminal Verification

Commands used:

```powershell
python --version
py --version
"$env:USERPROFILE\anaconda3\Scripts\conda.exe" --version
conda --version
```

Observed output:

```text
Python 3.13.9
Python 3.13.5
conda 25.11.1
conda 25.11.1
```

## Readiness Statement

The local environment is ready for future DS/ML tasks:
- Python is available in terminal.
- Anaconda is installed.
- Conda is available for creating and managing environments/packages.

## 2-Minute Video Walkthrough Plan

1. Show terminal and run `python --version` and `py --version`.
2. Show terminal and run `conda --version`.
3. Briefly explain this confirms environment readiness for DS/ML work.
4. Show this README as the PR proof artifact.

---

## Jupyter Notebook Workspace Proof (Milestone)

This PR also includes a minimal Jupyter Notebook artifact to demonstrate correct workspace behavior:

- Jupyter is launched from the project directory (`Sprint_3`) via terminal
- The notebook is created/saved inside `Sprint_3/notebooks/` (not at Windows home or random locations)
- At least one simple Python cell runs successfully

### Notebook Location

- `notebooks/00_jupyter_workspace_proof.ipynb`

### Terminal Launch Commands (PowerShell)

From the `Sprint_3` project folder:

```powershell
cd "C:\Users\hp\Desktop\Sprint_3"
Get-Location
jupyter notebook
```

### What to Show in the ~2 Minute Video

1. **Launch directory**
	- In PowerShell, run `cd "C:\Users\hp\Desktop\Sprint_3"` then `Get-Location`
	- Run `jupyter notebook`
2. **Jupyter Home interface**
	- Point out the file list, folders vs notebooks, and the breadcrumb path at the top
	- Navigate into the `notebooks/` folder using the UI (click the folder name)
3. **Notebook execution + save location**
	- Open `00_jupyter_workspace_proof.ipynb`
	- Run the first code cell (it prints the current working directory)
	- Confirm the notebook remains inside `Sprint_3/notebooks/`

### Scenario Answer (Say This in the Video)

If a notebook can’t find a dataset that exists on my machine, I would:

1. Confirm the **launch directory** in the terminal before starting Jupyter (that determines the Jupyter “root” folder).
2. Use the **Jupyter Home interface** and its **breadcrumbs** to navigate to where the notebook lives and where the data file lives.
3. Fix my code to use the correct **relative path** from the notebook to the file, or move the file into the project folder so it’s under the same Jupyter root.
4. Avoid absolute paths tied to my personal machine, because workspace awareness makes projects portable and prevents “works on my computer” issues.
