## Docker

> [!IMPORTANT]
> **Prerequisites**
> - 🐳 [Docker](https://docs.docker.com/engine/install/)
> - 🐳 [Docker Compose](https://docs.docker.com/compose/install/linux/#install-using-the-repository)

---

### Step 1. Download the LETSpred image

Open a terminal and run the command below to download the LETSpred Docker image:
```bash
docker pull annotep/letspredcli:v1
```

> You only need to do this **once**. The image is saved locally.

---

### Step 2. Command structure

The base command for using LETSpred has the following structure:
```bash
docker run --rm \
  --user $(id -u):$(id -g) \
  -v /path/to/your/files:/data \
  annotep/letspredcli:v1 COMMAND [OPTIONS]
```

| Part | What it does | Why it's here |
|---|---|---|
| `docker run` | Runs a container | Main Docker command |
| `--rm` | Removes the container after it finishes | Prevents accumulation of stopped containers |
| `--user $(id -u):$(id -g)` | Uses your user identity inside the container | Generated files are owned by you, without permission issues |
| `-v /path/to/your/files:/data` | Mounts your local folder inside the `/data` folder in the container | Allows the container to access your files |
| `annotep/letspredcli:v1` | Name of the image to use | Identifies which programme to run |
| `COMMAND [OPTIONS]` | LETSpred command and arguments | What you want the tool to do |

> [!WARNING]
> `/path/to/your/files` is a placeholder — you must replace it with the real path to the folder where your files are on your machine.
>
> **Real examples:**
> - Linux/macOS: `-v /home/john/lets_project:/data`
> - macOS (Downloads folder): `-v /Users/mary/Downloads/my_data:/data`
> - Windows (WSL): `-v /mnt/c/Users/peter/Documents/lets_data:/data`
>
> The files you wish to process **must be inside that folder** before running the command.

---

### Step 3. Prepare your files

Before running LETSpred, ensure you have the following files in a folder on your machine:

| File | Description |
|---|---|
| `actives_datawarrior.txt` | Exported from DataWarrior with active compounds |
| `decoys_datawarrior.txt` | Exported from DataWarrior with decoys |
| `active_consolidated.csv` | Consolidated CSV file of actives |
| `decoys_consolidated.csv` | Consolidated CSV file of decoys |

> [!NOTE]
> The programme accepts any filename for these files.

> [!IMPORTANT]
> These files **do not come with Docker** and must be generated or obtained by you before proceeding.

---

### Step 4. Create a predictive model

The `create-model` command trains a machine learning model using your actives and decoys data.
Replace `/path/to/your/files` with the real path to your folder, and `project_name` with your desired prefix:

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

> [!NOTE]
> Notice that the file paths **inside the command** (`/data/actives_datawarrior.txt`, etc.) always begin with `/data/` — this is fixed and must not be changed. `/data` is the folder name **inside the container**, which corresponds to your local folder defined in the `-v` flag.
>
> Results are saved to the same folder as your input files. Each run generates a new folder with the date and time in its name (e.g. `project_name-20260319_1430`), so you can run the command multiple times without overwriting previous results.

> [!TIP]
> The timestamp in the folder name uses **UTC** by default — 3 hours ahead of Brasília time (BRT). If you are in a different time zone, your offset will vary.
>
> To use your local time, add `-e TZ=Your/Timezone` to the command. For example, for the United Kingdom:
> ```bash
> docker run --rm \
>   --user $(id -u):$(id -g) \
>   -e TZ=Europe/London \
>   -v /path/to/your/files:/data \
>   annotep/letspredcli:v1 create-model ...
> ```
> You can find your time zone identifier in the [tz database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

**Parameters:**

| Parameter | Description |
|---|---|
| `--actives-datawarrior` | `.txt` file exported from DataWarrior with active compounds |
| `--decoys-datawarrior` | `.txt` file exported from DataWarrior with decoys |
| `--actives-consolidated` | Consolidated `.csv` file of actives |
| `--decoys-consolidated` | Consolidated `.csv` file of decoys |
| `--output` | Output folder prefix (created automatically with date and time) |

**Expected output:**
```
Starting pipeline | prefix: /data/project_name
[1/6] Preparing files...
[2/6] Pre-treating data...
[3/6] Normalising data...
[4/6] Training models...
[5/6] Computing applicability domain...
[6/6] Predicting compounds...
Pipeline complete! Results saved to: /data/project_name-20260314_1450
```

Results are saved inside `/path/to/your/files/project_name-YYYYMMDD_HHMM/`.

---

### Step 5. Tip: using the current folder

If your files are in the folder where your terminal is currently open, use `$(pwd)` to avoid typing the full path:
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

> `$(pwd)` is automatically replaced with the current folder's path — works on Linux and macOS.

---

### Step 6. Troubleshooting

| Error | Cause | Solution |
|---|---|---|
| `Permission denied` on output folder | Folder lacks write permission | Run `chmod 777 /your/folder` |
| `FileNotFoundError: /data/file.txt` | File not found in the volume | Check that `-v` points to the correct folder and verify the filename with `ls` |
| `no configuration file provided` | Running `docker compose` outside the project folder | Use `docker run` (without compose) from any folder |
| Generated files are locked | Container ran without `--user` | Add `--user $(id -u):$(id -g)` to the command |

---

### Step 7. CLI Help

To view all available commands:
```bash
docker run --rm annotep/letspredcli:v1 --help
```

To view the options for a specific command:
```bash
docker run --rm annotep/letspredcli:v1 create-model --help
```

---

### Further reading

#### Understanding `--user $(id -u):$(id -g)`

By default, processes inside Docker containers run as `root` (superuser). This causes a practical problem: **files generated by LETSpred are owned by `root`**, meaning you cannot open, move, or delete them without using `sudo`.

The `--user $(id -u):$(id -g)` flag resolves this by telling the container to run under your own user identity:

| Part | What it represents | Example |
|---|---|---|
| `$(id -u)` | Your **UID** — your user's numerical identifier on the system | `1000` |
| `$(id -g)` | Your **GID** — your user's primary group number | `1000` |

Docker passes these numbers to the container, which then creates files as though they were yours — no root permissions required.

> You can view your own UID and GID by running `id` in the terminal. The output will look something like `uid=1000(john) gid=1000(john)`.