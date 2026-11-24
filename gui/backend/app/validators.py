from typing import Tuple, List, Dict, Set, Optional
# validators.py
import csv
import io
from fastapi import HTTPException, UploadFile

# Colunas obrigatórias de cada arquivo
REQUIRED_COLUMNS = {
    "actives_datawarrior": {"Structure of smiles [idcode]", "smiles", "name", "Total Molweight", "cLogP"},
    "decoys_datawarrior":  {"Structure of smiles [idcode]", "smiles", "name", "Total Molweight", "cLogP"},
    "actives_consolidated": {"Entry", "Index", "PLP.Fitness", "PLP.PLP"},
    "decoys_consolidated":  {"Entry", "Index", "PLP.Fitness", "PLP.PLP"},
}

# Extensões permitidas
ALLOWED_EXTENSIONS = {".csv", ".txt"}

# Tamanho máximo: 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024

# Padrões suspeitos (injection)
DANGEROUS_PATTERNS = [
    "=CMD", "=cmd", "=SYS", "=sys",        # CSV injection via fórmula
    "=HYPERLINK", "=hyperlink",
    "__import__", "exec(", "eval(",          # Python injection
    "<script", "javascript:",                # XSS
    "../", "..\\",                           # Path traversal
    "DROP TABLE", "SELECT *", "INSERT INTO", # SQL injection
]


def check_dangerous_content(content: str, filename: str):
    for pattern in DANGEROUS_PATTERNS:
        if pattern in content:
            raise HTTPException(
                status_code=400,
                detail=f"File '{filename}' contains suspicious content: '{pattern}'"
            )


def validate_file(file_bytes: bytes, filename: str, file_key: str):
    # 1. Extensão
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' has invalid extension. Allowed: {ALLOWED_EXTENSIONS}"
        )

    # 2. Tamanho
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' exceeds the 50MB limit."
        )

    # 3. Arquivo vazio
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' is empty."
        )

    # 4. Decode
    try:
        content = file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' is not a valid UTF-8 text file."
        )

    # 5. Injection
    check_dangerous_content(content, filename)

    # 6. Colunas obrigatórias
    delimiter = "\t" if ext == ".txt" else ","
    try:
        reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)
        headers = set(reader.fieldnames or [])

        if not headers:
            raise HTTPException(
                status_code=400,
                detail=f"File '{filename}' has no headers."
            )

        required = REQUIRED_COLUMNS.get(file_key, set())
        missing = required - headers
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"File '{filename}' is missing required columns: {missing}"
            )

        # 7. Pelo menos 1 linha de dados além do header
        rows = list(reader)
        if len(rows) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"File '{filename}' has headers but no data rows."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"File '{filename}' could not be parsed: {str(e)}"
        )

async def validate_all_files(
    actives_datawarrior: UploadFile,
    decoys_datawarrior: UploadFile,
    actives_consolidated: UploadFile,
    decoys_consolidated: UploadFile,
):
    uploads = {
        "actives_datawarrior":  actives_datawarrior,
        "decoys_datawarrior":   decoys_datawarrior,
        "actives_consolidated": actives_consolidated,
        "decoys_consolidated":  decoys_consolidated,
    }

    # Verifica nomes duplicados entre os 4 arquivos
    filenames = [upload.filename for upload in uploads.values()]
    if len(filenames) != len(set(filenames)):
        duplicates = [name for name in filenames if filenames.count(name) > 1]
        raise HTTPException(
            status_code=400,
            detail=f"Duplicate files detected: {list(set(duplicates))}. Each file must be unique."
        )

    file_bytes_map = {}

    for key, upload in uploads.items():
        file_bytes = await upload.read()
        validate_file(file_bytes, upload.filename, key)
        # Rebobina para o shutil.copyfileobj funcionar depois
        upload.file.seek(0)
        file_bytes_map[key] = file_bytes

    return file_bytes_map