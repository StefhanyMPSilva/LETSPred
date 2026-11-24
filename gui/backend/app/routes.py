import os, shutil, uuid, asyncio, pickle, zipfile, io

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from typing import Dict, Set, Optional

from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from app.validators import validate_all_files
from main import create_model, prebuild_model, user_model

router = APIRouter()

# Executor dedicado com limite explícito de threads — apenas para os pipelines pesados
# Isso desacopla o pool do event loop e dá controle real sobre concorrência
pipeline_executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="pipeline",)
active_tasks: Set[asyncio.Task] = set()
UPLOAD_CHUNK_SIZE = 1 * 1024 * 1024  # 1 MB por chunk

MAIN_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREBUILD_DIR = os.path.join(MAIN_ROOT, "prebuildmodel")
USERMODEL_DIR  = os.path.join(MAIN_ROOT, "usermodel")
OUTPUT_PREDICT_DIR = os.path.join(MAIN_ROOT, "output_predictions")

# === Funções da página Home ===
def sanitize_filename(filename: Optional[str]) -> str:
    if not filename:
        raise HTTPException(status_code=400, detail="Upload sem nome de arquivo.")
    safe = Path(filename).name
    if not safe or safe in (".", ".."):
        raise HTTPException(status_code=400, detail=f"Nome de arquivo inválido: {filename!r}")
    return safe


async def stream_upload_to_disk(upload: UploadFile, dest: Path) -> None:
    """
    Grava o upload em disco em chunks sem carregar tudo na memória.
    O await a cada chunk devolve o controle ao event loop, mantendo
    a aplicação responsiva mesmo com arquivos grandes.
    """
    loop = asyncio.get_running_loop()
    with dest.open("wb") as out_file:
        while True:
            # Leitura do chunk ainda vai para executor pois upload.file é síncrono
            chunk = await loop.run_in_executor(None, upload.file.read, UPLOAD_CHUNK_SIZE)
            if not chunk:
                break
            # Escrita também não bloqueia o event loop
            await loop.run_in_executor(None, out_file.write, chunk)

def list_models(base_path: str) -> list:
    if not os.path.isdir(base_path):
        return []
    
    models = []
    for name in sorted(os.listdir(base_path)):
        model_dir = os.path.join(base_path, name)
        if not os.path.isdir(model_dir):
            continue

        models_subdir = os.path.join(model_dir, "models")
        model_files = []
        if os.path.isdir(models_subdir):
            model_files = [
                f.replace("_model.pkl", "")
                for f in os.listdir(models_subdir)
                if f.endswith("_model.pkl")
            ]

        created_at = None
        config_path = os.path.join(model_dir, "config.pkl")
        if os.path.exists(config_path):
            try:
                with open(config_path, "rb") as f:
                    config = pickle.load(f)
                created_at = config.get("created_at")
            except Exception:
                pass

        artifacts_dir = os.path.join(model_dir, "artifacts")
        models.append({
            "id": name,
            "name": name,
            "created_at": created_at,
            "models": sorted(model_files),
            "ready": os.path.isdir(artifacts_dir) and bool(model_files),
        })
    return models

# === Função destinada para a pagina de resultados ===
def list_runs(base_path: str) -> list:
    """Listar pastas de resultados ordenadas pela mais recente"""
    if not os.path.isdir(base_path):
        return []
    runs = []

    for name in sorted(os.listdir(base_path), reverse=True):
        run_dir = os.path.join(base_path, name)
        if not os.path.isdir(run_dir):
            continue
        runs.append({"id": name, "name": name, "modified": os.path.getmtime(run_dir)})

    # Ordena pelo mais recente primeiro
    runs.sort(key=lambda x: x["modified"], reverse=True)

    # Remove o campo auxiliar antes de retornar
    for run in runs:
        del run["modified"]

    return runs

# === Rota para enviar os dados ===
@router.post("/models/run")
async def data_analysis(
    actives_datawarrior: UploadFile = File(...),
    decoys_datawarrior: UploadFile = File(None),
    actives_consolidated: UploadFile = File(...),
    decoys_consolidated: UploadFile = File(None),
    output_prefix: str = Form(...),
    model_type: str = Form(...),
    prebuild_table_id: Optional[str] = Form(None),
    user_run_id: Optional[str] = Form(None),
    selected_models: Optional[str] = Form("ALL"),
) -> StreamingResponse:

    # await validate_all_files(
    #     actives_datawarrior,
    #     decoys_datawarrior,
    #     actives_consolidated,
    #     decoys_consolidated,
    # )

    # Validar apenas para createmodel
    if model_type == "createmodel":
        await validate_all_files( actives_datawarrior, decoys_datawarrior, actives_consolidated, decoys_consolidated)

    run_id = str(uuid.uuid4())
    temp_dir = Path("temp_api") / run_id
    temp_dir.mkdir(parents=True, exist_ok=True)

    # uploads = [
    #     actives_datawarrior,
    #     decoys_datawarrior,
    #     actives_consolidated,
    #     decoys_consolidated,
    # ]

    paths: Dict[str, Path] = {}
    for upload in [actives_datawarrior, actives_consolidated, decoys_datawarrior, decoys_consolidated]:
        if upload and upload.filename:
            safe_name = sanitize_filename(upload.filename)
            dest = temp_dir / safe_name
            await stream_upload_to_disk(upload, dest)
            paths[upload.filename] = dest

    # Resolver selected_models
    VALID_MODELS = {'LR', 'NB', 'DT', 'RF', 'SVM', 'XGB'}
    models_set = None
    if selected_models and selected_models.upper() != "ALL":
        models_set = {m.strip().upper() for m in selected_models.split(",")}
        invalid = models_set - VALID_MODELS
        if invalid:
            raise HTTPException(status_code=400, detail=f"Invalid models: {invalid}")

    queue: asyncio.Queue[str] = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def progress_callback(message: str) -> None:
        loop.call_soon_threadsafe(queue.put_nowait, message)

    def run_by_model_type() -> None:
        if model_type == "createmodel":
            create_model(
                actives_dw_path=str(paths[actives_datawarrior.filename]),
                decoys_dw_path=str(paths[decoys_datawarrior.filename]),
                actives_cons_path=str(paths[actives_consolidated.filename]),
                decoys_cons_path=str(paths[decoys_consolidated.filename]),
                output_prefix=output_prefix,
                progress_callback=progress_callback,
            )
        elif model_type == "prebuildmodel":
            if not prebuild_table_id:
                raise ValueError("prebuildmodel requer prebuild_table_id")
            prebuild_model(
                build_name=prebuild_table_id,
                actives_dw_path=str(paths[actives_datawarrior.filename]),
                actives_cons_path=str(paths[actives_consolidated.filename]),
                output_prefix=output_prefix,
                selected_models=models_set,
                progress_callback=progress_callback,
            )
        elif model_type == "usermodel":
            if not user_run_id:
                raise ValueError("usermodel requer user_run_id")
            user_model(
                run_name=user_run_id,
                actives_dw_path=str(paths[actives_datawarrior.filename]),
                actives_cons_path=str(paths[actives_consolidated.filename]),
                output_prefix=output_prefix,
                selected_models=models_set,
                progress_callback=progress_callback,
            )
        else:
            raise ValueError(f"model_type desconhecido: {model_type!r}")

    async def run_pipeline() -> None:
        try:
            # Usa o executor dedicado — não compete com I/O do event loop
            await loop.run_in_executor(pipeline_executor, run_by_model_type)
        except (NotImplementedError, ValueError) as e:
            queue.put_nowait(f"ERROR: {e}")
        except Exception as e:
            queue.put_nowait(f"ERROR: erro interno — {e}")
        finally:
            queue.put_nowait("DONE")
            shutil.rmtree(temp_dir, ignore_errors=True)

            try:
                temp_dir.parent.rmdir()
            except OSError:
                pass

    task = asyncio.create_task(run_pipeline())
    active_tasks.add(task)
    task.add_done_callback(active_tasks.discard)

    async def event_stream():
        try:
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {message}\n\n"
                    if message.startswith(("DONE", "ERROR")):
                        break
                except asyncio.TimeoutError:
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# === Rota para consultar os modelos ==
@router.get("/models/prebuild")
def list_prebuild_models():
    return {"models": list_models(PREBUILD_DIR)}

@router.get("/models/usermodel")
def list_user_models():
    return {"models": list_models(USERMODEL_DIR)}

@router.get("/models/prebuild/{name}/metrics")
def get_prebuild_metrics(name: str):
    path = os.path.join(PREBUILD_DIR, name, "metrics", "model_metrics.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Metrics not found for '{name}'")
    return FileResponse(path, media_type="text/csv")

@router.get("/models/usermodel/{name}/metrics")
def get_usermodel_metrics(name: str):
    path = os.path.join(USERMODEL_DIR, name, "metrics", "model_metrics.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Metrics not found for '{name}'")
    return FileResponse(path, media_type="text/csv")

# === Rotas para listar resultados ===
@router.get("/results/usermodel")
def list_usermodel_runs():
    return {"runs": list_runs(USERMODEL_DIR)}

@router.get("/results/output_predictions")
def list_predict_runs():
    return {"runs": list_runs(OUTPUT_PREDICT_DIR)}

# === Arquivos de resultado — usermodel ===
@router.get("/results/usermodel/{name}/metrics")
def get_usermodel_run_metrics(name: str):
    path = os.path.join(USERMODEL_DIR, name, "metrics", "model_metrics.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Metrics not found")
    return FileResponse(path, media_type="text/csv")

@router.get("/results/usermodel/{name}/domain")
def get_usermodel_run_domain(name: str):
    path = os.path.join(USERMODEL_DIR, name, "domain_app", "domain_applicability.png")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Domain plot not found")
    return FileResponse(path, media_type="image/png")

@router.get("/results/usermodel/{name}/predictions")
def get_usermodel_run_predictions(name: str):
    path = os.path.join(USERMODEL_DIR, name, "predicts", "new_with_consensus.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Predictions not found")
    return FileResponse(path, media_type="text/csv")

@router.get("/results/usermodel/{name}/domain/points")
def get_usermodel_domain_points(name: str):
    path = os.path.join(USERMODEL_DIR, name, "domain_app", "df_externo_with_distance.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Points not found")
    return FileResponse(path, media_type="text/csv")

@router.get("/results/usermodel/{name}/domain/distance")
def get_usermodel_domain_distance(name: str):
    path = os.path.join(USERMODEL_DIR, name, "domain_app", "distance.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Distance not found")
    return FileResponse(path, media_type="text/csv")

# === Arquivos de resultado — output_predictions ===
@router.get("/results/output_predictions/{name}/domain")
def get_predict_run_domain(name: str):
    path = os.path.join(OUTPUT_PREDICT_DIR, name, "domain_app", "domain_applicability.png")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Domain plot not found")
    return FileResponse(path, media_type="image/png")

@router.get("/results/output_predictions/{name}/predictions")
def get_predict_run_predictions(name: str):
    path = os.path.join(OUTPUT_PREDICT_DIR, name, "predicts", "new_with_consensus.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Predictions not found")
    return FileResponse(path, media_type="text/csv")

@router.get("/results/output_predictions/{name}/domain/points")
def get_predict_domain_points(name: str):
    path = os.path.join(OUTPUT_PREDICT_DIR, name, "domain_app", "df_externo_with_distance.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Points not found")
    return FileResponse(path, media_type="text/csv")

@router.get("/results/output_predictions/{name}/domain/distance")
def get_predict_domain_distance(name: str):
    path = os.path.join(OUTPUT_PREDICT_DIR, name, "domain_app", "distance.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Distance not found")
    return FileResponse(path, media_type="text/csv")

# ==== Export results =====
def _create_zip(run_dir: str, include_models: bool = False) -> io.BytesIO:
    """Compacta os arquivos de resultado em um ZIP."""
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Artefatos
        artifacts_dir = os.path.join(run_dir, "artifacts")
        for filename in ["columns_removed.pkl", "model_columns.pkl", "scaler.pkl", "train_columns.pkl", "train_test_data.npz"]:
            path = os.path.join(artifacts_dir, filename)
            if os.path.exists(path):
                zf.write(path, f"artifacts/{filename}")

        # Temporários
        temp_dir = os.path.join(run_dir, "temp")
        for filename in ["df_final.csv", "df_reduced.csv", "df_reduced_wname.csv", "df_var_final.csv"]:
            path = os.path.join(temp_dir, filename)
            if os.path.exists(path):
                zf.write(path, f"temp/{filename}")

        # Predições
        predictions_path = os.path.join(run_dir, "predicts", "new_with_consensus.csv")
        if os.path.exists(predictions_path):
            zf.write(predictions_path, "predictions/new_with_consensus.csv")

        # Domínio de aplicabilidade
        domain_dir = os.path.join(run_dir, "domain_app")
        for filename in ["data_non_outliers.csv", "distance.csv", "df_externo_with_distance.csv", "domain_applicability.png"]:
            path = os.path.join(domain_dir, filename)
            if os.path.exists(path):
                zf.write(path, f"domain_app/{filename}")

        # Métricas — só para usermodel
        if include_models:
            metrics_path = os.path.join(run_dir, "metrics", "model_metrics.csv")
            if os.path.exists(metrics_path):
                zf.write(metrics_path, "metrics/model_metrics.csv")

            models_dir = os.path.join(run_dir, "models")
            if os.path.isdir(models_dir):
                for filename in os.listdir(models_dir):
                    path = os.path.join(models_dir, filename)
                    if os.path.isfile(path):
                        zf.write(path, f"models/{filename}")

            config_file = os.path.join(run_dir, "config.pkl")
            if os.path.exists(config_file):
                zf.write(config_file, "config.pkl")

    buffer.seek(0)
    return buffer


@router.get("/results/usermodel/{name}/export")
def export_usermodel_run(name: str):
    """Exporta todos os resultados do run como ZIP."""
    run_dir = os.path.join(USERMODEL_DIR, name)
    if not os.path.isdir(run_dir):
        raise HTTPException(status_code=404, detail=f"Run '{name}' not found")

    buffer   = _create_zip(run_dir, include_models=True)
    filename = f"{name}_results.zip"

    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/results/output_predictions/{name}/export")
def export_predict_run(name: str):
    """Exporta resultados de predição como ZIP (sem modelos)."""
    run_dir = os.path.join(OUTPUT_PREDICT_DIR, name)
    if not os.path.isdir(run_dir):
        raise HTTPException(status_code=404, detail=f"Run '{name}' not found")

    buffer   = _create_zip(run_dir, include_models=False)
    filename = f"{name}_predictions.zip"

    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.delete("/results/usermodel/{name}")
def delete_usermodel_run(name: str):
    run_dir = os.path.join(USERMODEL_DIR, name)
    if not os.path.isdir(run_dir):
        raise HTTPException(status_code=404, detail=f"Run '{name}' not found")
    shutil.rmtree(run_dir)
    return {"deleted": name}

@router.delete("/results/output_predictions/{name}")
def delete_predict_run(name: str):
    run_dir = os.path.join(OUTPUT_PREDICT_DIR, name)
    if not os.path.isdir(run_dir):
        raise HTTPException(status_code=404, detail=f"Run '{name}' not found")
    shutil.rmtree(run_dir)
    return {"deleted": name}