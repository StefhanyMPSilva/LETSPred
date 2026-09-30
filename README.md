<div align="center"> 
    <img src="LOGO_Oficial.png" alt="Logo" style="width: 30rem">
</div>

# 


<div align="center">
    
![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)

</div>
 

The LETSPred is a machine learning pipeline designed to **predict the biological activity of chemical compounds** against relevant biological targets.  
Its distinctive feature lies in the integration of **molecular docking data** with **physicochemical descriptors** of ligands, derived from the GOLD and DataWarrior software.  
This synergy enhances predictive accuracy, surpassing the limitations of scoring functions when applied in isolation.

## Features
- Six classification algorithms to identify bioactive compounds
- Transparent and accessible analyses
- Applicability domain calculations to ensure reliability
- Outlier filtering before final prediction

## Outputs
Detailed reports:

- **Metrics:**
  - Accuracy
  - Sensitivity
  - Specificity
  - MCC
  - AUC ROC
 
- **Applicability Domain:**
  - Graphic
  - Limits Eclidians and Mahalanobis

- **Prediction:**
  - Bioactivity of Compounds (actives and inactives)
  - Consesus Model

## Customization
- Parameter tuning
- Reuse of generated models

#
**Conclusion:**  
LETSPred constitutes a robust and standardized resource to support **drug discovery research**.

---

## Installing LETSPred

LETSpred is a machine learning pipeline tool for predicting the activity of chemical compounds against biological targets. It uses molecular descriptors (DataWarrior) and docking scores (GOLD) to classify compounds as active or inactive.

The tool is available in two modes:
- **CLI (Command-Line Interface)** — runs via Docker (no local Python installation required) or directly via a local Python environment
- **GUI (Graphical Interface)** — runs a local web application with a FastAPI backend and React frontend

> The Portuguese version of this guide is available at [README-PTBR.md](README-PTBR.md).

---

## System Requirements

| Component | Minimum | Recommended |
|---|---|---|
| Operating System | Ubuntu 20.04 | Ubuntu 22.04, ... |
| RAM | 4 GB | 8 GB or more |
| Disc space | 5 GB free | 10 GB free |
| CPU | 4 threads | 16+ threads |

> The model training step is CPU-intensive. More cores and RAM will speed up the process considerably.

---

## Mode 1 — CLI (via Docker)

This mode requires only Docker. There is no need to install Python, Node.js, or any other runtime manually.

### Required tools

| Tool | Purpose | Download |
|---|---|---|
| Docker | Runs the pipeline inside a container | [docs.docker.com/engine/install](https://docs.docker.com/engine/install/) |
| Docker Compose | Manages multi-container configuration | [docs.docker.com/compose/install](https://docs.docker.com/compose/install/linux/#install-using-the-repository) |

> **Windows users:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), which already includes both Docker and Docker Compose.
>
> **Linux users:** After installing Docker, follow the [post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user) to run Docker without `sudo`.

### Step 1 — Pull the LETSpred image

Open a terminal and run:

```bash
docker pull annotep/letspredcli:v1
```

> You only need to do this once. The image is saved locally thereafter.

### Step 2 — Prepare the input files

Before running LETSpred, place the following files in a folder on your computer:

| File | Description |
|---|---|
| `actives_datawarrior.txt` | Exported from DataWarrior with active compounds |
| `decoys_datawarrior.txt` | Exported from DataWarrior with decoys |
| `active_consolidated.csv` | Consolidated CSV of actives (from GOLD) |
| `decoys_consolidated.csv` | Consolidated CSV of decoys (from GOLD) |

> These files are not included in the image and must be generated or obtained by you before proceeding.

### Step 3 — Create a predictive model

The `create-model` command trains machine learning models using your actives and decoys data. Replace `/path/to/your/files` with the actual path to the folder containing your files, and `project_name` with a name of your choice:

```bash
docker run --rm \
  --user $(id -u):$(id -g) \
  -v /path/to/your/files:/data \
  annotep/letspredcli:v1 create-model \
  --actives-datawarrior /data/actives_datawarrior.txt \
  --decoys-datawarrior /data/decoys_datawarrior.txt \
  --actives-consolidated /data/active_consolidated.csv \
  --decoys-consolidated /data/decoys_consolidated.csv \
  --output /data/project_name
```

**Path examples by operating system:**

| OS | Example `-v` flag |
|---|---|
| Linux | `-v /home/john/my_project:/data` |
| macOS | `-v /Users/mary/Downloads/my_data:/data` |
| Windows (WSL) | `-v /mnt/c/Users/peter/Documents/my_data:/data` |

> The paths **inside the command** (beginning with `/data/`) are fixed — they refer to the folder inside the container, not your computer. Only the part before the colon in the `-v` flag should be changed.

**Expected output:**

```
[1/6] Preparing files...
[2/6] Pre-treating data...
[3/6] Normalising data...
[4/6] Training models...
[5/6] Computing applicability domain...
[6/6] Predicting compounds...
Pipeline complete! Results saved to: /data/project_name-20260319_1430
```

Results are saved in a new folder inside `/path/to/your/files/`, with the prefix and a timestamp in the name (e.g. `project_name-20260319_1430`).

### Step 4 — Predict using a pre-built model

If you wish to use a model that is already trained and bundled with the tool:

```bash
docker run --rm \
  --user $(id -u):$(id -g) \
  -v /path/to/your/files:/data \
  annotep/letspredcli:v1 prebuildmodel \
  --build-name MODEL_NAME \
  --actives-datawarrior /data/actives_datawarrior.txt \
  --actives-consolidated /data/active_consolidated.csv \
  --output /data/results_name
```

### Step 5 — Predict using your own trained model

If you have previously run `create-model` and wish to use that model for new predictions:

```bash
docker run --rm \
  --user $(id -u):$(id -g) \
  -v /path/to/your/files:/data \
  annotep/letspredcli:v1 usermodel \
  --run-name project_name-20260319_1430 \
  --actives-datawarrior /data/actives_datawarrior.txt \
  --actives-consolidated /data/active_consolidated.csv \
  --output /data/results_name
```

### Tip — using the current folder

If your files are in the folder where the terminal is open, use `$(pwd)` to avoid typing the full path:

```bash
cd /path/to/your/files

docker run --rm \
  --user $(id -u):$(id -g) \
  -v $(pwd):/data \
  annotep/letspredcli:v1 create-model \
  --actives-datawarrior /data/actives_datawarrior.txt \
  --decoys-datawarrior /data/decoys_datawarrior.txt \
  --actives-consolidated /data/active_consolidated.csv \
  --decoys-consolidated /data/decoys_consolidated.csv \
  --output /data/result
```

> `$(pwd)` works on Linux and macOS. On Windows (PowerShell), use `${PWD}` instead.

### CLI help

```bash
# List all available commands
docker run --rm annotep/letspredcli:v1 --help

# View the options for a specific command
docker run --rm annotep/letspredcli:v1 create-model --help
```

### Troubleshooting

| Error | Cause | Solution |
|---|---|---|
| `Permission denied` on output folder | Folder lacks write permission | Run `chmod 777 /your/folder` |
| `FileNotFoundError: /data/file.txt` | File not found inside the container | Check that `-v` points to the correct folder and verify the filename with `ls` |
| Output files with blocked permissions | Container running without `--user` | Add `--user $(id -u):$(id -g)` to the command |

---

## Mode 1b — CLI (local installation, without Docker)

Use this option if you prefer to run the CLI directly in Python, without Docker.

### Required tools

| Tool | Minimum version | Purpose | Download |
|---|---|---|---|
| Python | 3.9 | Run the pipeline | [python.org/downloads](https://www.python.org/downloads/) |
| pip | included with Python | Install dependencies | — |
| Git | any | Clone the repository | [git-scm.com](https://git-scm.com/) |

### Step 1 — Clone the repository

```bash
git clone https://github.com/...
cd LETSpred-GUI
```

### Step 2 — Create and activate a virtual environment
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3 — Install dependencies

```bash
cd cli
pip install -r requirements.txt
```

> This step may take a few minutes on the first run.

### Step 4 — Run the CLI

With the virtual environment active, the commands are the same as the Docker versions but without the `docker run` prefix:

**Create a model:**
```bash
python cli.py create-model \
  --actives-datawarrior /path/to/actives_datawarrior.txt \
  --decoys-datawarrior /path/to/decoys_datawarrior.txt \
  --actives-consolidated /path/to/active_consolidated.csv \
  --decoys-consolidated /path/to/decoys_consolidated.csv \
  --output project_name
```

**Use a pre-built model:**
```bash
python cli.py prebuildmodel \
  --build MODEL_NAME \
  --actives-datawarrior /path/to/actives_datawarrior.txt \
  --actives-consolidated /path/to/active_consolidated.csv \
  --output results_name
```

**Use your own trained model:**
```bash
python cli.py usermodel \
  --run project_name-20260319_1430 \
  --actives-datawarrior /path/to/actives_datawarrior.txt \
  --actives-consolidated /path/to/active_consolidated.csv \
  --output results_name
```

### CLI help

```bash
# List all available commands
python cli.py --help

# View the options for a specific command
python cli.py create-model --help
```

### Comparison — Docker vs local installation

| | Docker | Local installation |
|---|---|---|
| Install Python | ❌ Not required | ✅ Required |
| Install dependencies | ❌ Not required | ✅ Required |
| Guaranteed compatibility | ✅ Always | ⚠️ Depends on environment |
| File access | Via `-v` (volume mount) | Direct paths |
| Best suited for | One-off use, any OS | Development and testing |

### Troubleshooting

| Error | Cause | Solution |
|---|---|---|
| `ModuleNotFoundError` | Dependencies not installed or virtual environment inactive | Activate the venv and run `pip install -r requirements.txt` |
| `python` command not found on Linux/macOS | `python3` is the system default | Use `python3 cli.py` instead of `python cli.py` |
| `Permission denied` on output folder | Folder lacks write permission | Run `chmod 777 /your/folder` |

---

## Mode 2 — GUI (FastAPI + React)

This mode runs a local web application. The backend is a FastAPI server and the frontend is a React application built with Vite.

### Required tools

| Tool | Minimum version | Purpose | Download |
|---|---|---|---|
| Python | 3.9 | Backend (FastAPI) | [python.org/downloads](https://www.python.org/downloads/) |
| pip | included with Python | Python package manager | — |
| Node.js | 18 | Frontend build tool | [nodejs.org](https://nodejs.org/) |
| npm | included with Node.js | JavaScript package manager | — |
| Git | any | Clone the repository | [git-scm.com](https://git-scm.com/) |

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-org/LETSpred-GUI.git
cd LETSpred-GUI
```

> Replace the URL with the actual repository address if it differs.

### Step 2 — Set up the Python backend

Navigate to the backend folder and create an isolated Python environment:

```bash
cd gui/backend
```

#### Create the virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

> The virtual environment isolates the project's Python packages from the rest of your system. The terminal prompt will change to show `(venv)` when it is active.

#### Install Python dependencies

```bash
pip install -r requirements.txt
```

> This step may take a few minutes on the first run, as it downloads libraries such as scikit-learn, XGBoost, and FastAPI.

#### Start the FastAPI server

```bash
uvicorn app.api:app --reload --host 0.0.0.0 --port 8000
```

You should see output similar to:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

> Keep this terminal open whilst using the application. The `--reload` flag restarts the server automatically when backend code is changed. Remove it in production.

### Step 3 — Set up the React frontend

Open a **new terminal** (keep the backend terminal open) and navigate to the frontend folder:

```bash
cd gui/frontend
```

#### Install JavaScript dependencies

```bash
npm install
```

> This downloads all frontend packages into the `node_modules` folder. It may take a moment on the first run.

#### Start the development server

```bash
npm run dev
```

You should see:

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### Step 4 — Open the application

Open your browser and go to:

```
http://localhost:5173
```

The GUI will be available and will communicate with the FastAPI backend running at `http://localhost:8000`.

### Directory structure

```
LETSpred-GUI/
├── cli/                        # CLI source code
│   ├── cli.py                  # Main CLI entry point
│   ├── core/                   # Pipeline processing modules
│   └── example_files/          # Example input files
└── gui/
    ├── backend/                # FastAPI server
    │   ├── app/
    │   │   ├── api.py          # FastAPI application definition
    │   │   ├── routes.py       # API route handlers
    │   │   └── schemas.py      # Request/response schemas
    │   ├── core/               # Pipeline processing modules
    │   ├── prebuildmodel/      # Pre-built model files
    │   ├── usermodel/          # User-trained models (generated)
    │   ├── output_predictions/ # Prediction results (generated)
    │   ├── main.py             # Pipeline orchestration
    │   └── requirements.txt    # Python dependencies
    └── frontend/               # React application
        ├── src/                # Application source code
        ├── public/             # Static files
        └── package.json        # JavaScript dependencies
```

### Stopping the application

- **Frontend:** Press `Ctrl+C` in the frontend terminal.
- **Backend:** Press `Ctrl+C` in the backend terminal.
- **Deactivate the Python environment:** Run `deactivate` in the backend terminal after stopping the server.

### Troubleshooting

| Error | Cause | Solution |
|---|---|---|
| `ModuleNotFoundError` when starting uvicorn | Dependencies not installed or venv not active | Activate the venv and run `pip install -r requirements.txt` again |
| Port 8000 already in use | Another process is using port 8000 | Change the port: `uvicorn app.api:app --port 8001` and update the frontend configuration accordingly |
| Port 5173 already in use | Another Vite server is running | Stop the other process or run `npm run dev -- --port 5174` |
| CORS error in the browser console | Backend not running or incorrect URL | Ensure the FastAPI server is running on port 8000 |
| `npm install` fails with a permissions error | npm configuration issue | Try `npm install --legacy-peer-deps` or check your Node.js version with `node --version` |
| `python` command not found on Linux/macOS | `python3` is the system default | Use `python3` and `pip3` in place of `python` and `pip` |

