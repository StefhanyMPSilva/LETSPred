#Edit Marcos Costa 06/02/26 v_0.0.1
#Edit Marcos Costa 03/03/26 v_0.0.2
#Edit Marcos Costa 22/03/2026 v_0.0.3
#Edit Marcos Costa 26/03/2026 v_0.0.4
#Edit Marcos Costa 26/04/2026 v_0.0.5

import os
N_WORKERS = str(max(1, (os.cpu_count() or 4) // 3))
os.environ.setdefault("OMP_NUM_THREADS",       N_WORKERS)
os.environ.setdefault("OPENBLAS_NUM_THREADS",  N_WORKERS)
os.environ.setdefault("MKL_NUM_THREADS",       N_WORKERS)
os.environ.setdefault("VECLIB_MAXIMUM_THREADS", N_WORKERS)
os.environ.setdefault("NUMEXPR_NUM_THREADS",   N_WORKERS)

import pandas as pd
import numpy as np
import pickle
import shutil
import warnings
from datetime import datetime

# Suppress sklearn version inconsistency warnings
from sklearn.exceptions import InconsistentVersionWarning
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

def create_model(actives_dw_path, decoys_dw_path, actives_cons_path, decoys_cons_path, output_prefix, progress_callback=None) -> dict:
    def log(msg):
        print(msg)
        if progress_callback:
            progress_callback(msg)

    output_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "usermodel")
    os.makedirs(output_root, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    run_name  = f"{output_prefix}-{timestamp}"
    base_dir  = os.path.join(output_root, run_name)

    temp_dir    = os.path.join(base_dir, "temp")
    models_dir  = os.path.join(base_dir, "models")
    metrics_dir = os.path.join(base_dir, "metrics")
    predict_dir = os.path.join(base_dir, "predicts")
    domain_dir  = os.path.join(base_dir, "domain_app")
    train_dir = os.path.join(base_dir, "artifacts")

    for directory in [temp_dir, models_dir, metrics_dir, predict_dir, domain_dir, train_dir]:
        os.makedirs(directory, exist_ok=True)

    # Copia inputs para o temp_dir com nomes esperados
    shutil.copy(actives_dw_path,os.path.join(temp_dir, 'actives_datawarrior.txt'))
    shutil.copy(decoys_dw_path,os.path.join(temp_dir, 'decoys_datawarrior.txt'))
    shutil.copy(actives_cons_path,os.path.join(temp_dir, 'active_consolidated.csv'))
    shutil.copy(decoys_cons_path,os.path.join(temp_dir, 'decoys_consolidated.csv'))

    # Sem os.chdir — tudo usa caminhos absolutos a partir daqui
    try:
        from core import (
            prepare_files,
            pre_treatment,
            normalization,
            train_models,
            predict_compounds,
            domain_applicability,
        )

        # ---------------------------------------------------- step 1
        log("[1/6] Preparing files...")
        # prepare_files.process() usa os.getcwd() internamente — passa o dir explicitamente
        df_final = prepare_files.process(work_dir=temp_dir)
        df_final_path = os.path.join(temp_dir, 'df_final.csv')
        df_final.to_csv(df_final_path, index=False)

        # ---------------------------------------------------- step 2
        log("[2/6] Pre-treating data...")
        df_var_final = pre_treatment.process(df_final_path)
        df_var_path  = os.path.join(temp_dir, 'df_var_final.csv')
        df_var_final.to_csv(df_var_path, index=False)

        # ---------------------------------------------------- step 3
        log("[3/6] Normalizing data...")
        df_reduced, df_reduced_wname, scaler, train_columns, model_columns, to_drop = normalization.process(df_var_path)
        df_reduced_path = os.path.join(temp_dir, 'df_reduced.csv')
        df_reduced.to_csv(df_reduced_path, index=False)
        df_reduced_wname.to_csv(os.path.join(temp_dir, 'df_reduced_wname.csv'), index=False)

        scaler_path = os.path.join(train_dir, "scaler.pkl")
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)

        train_columns_path = os.path.join(train_dir, "train_columns.pkl")
        with open(train_columns_path, 'wb') as f:
            pickle.dump(train_columns, f)

        model_columns_path = os.path.join(train_dir, "model_columns.pkl")
        with open(model_columns_path, 'wb') as f:
            pickle.dump(model_columns, f)

        columns_removed_path = os.path.join(train_dir, "columns_removed.pkl")
        with open(columns_removed_path, 'wb') as f:
            pickle.dump(list(to_drop), f)

        # ---------------------------------------------------- step 4
        log("[4/6] Training models...")
        models, metrics, data_splits, results_df = train_models.process(df_reduced_path)
        results_df.to_csv(os.path.join(models_dir, 'best_model_results.csv'), index=False)

        for model_name, model in models.items():
            model_path = os.path.join(models_dir, f"{model_name}_model.pkl")
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)

        metrics.to_csv(os.path.join(metrics_dir, "model_metrics.csv"), index=False)

        np.savez(
            os.path.join(train_dir, "train_test_data.npz"),
            X_train=data_splits['X_train'],
            X_test=data_splits['X_test'],
            y_train=data_splits['y_train'],
            y_test=data_splits['y_test'],
        )

        X_train = data_splits['X_train']

        # ---------------------------------------------------- step 5
        log("[5/6] Computing applicability domain...")
        distance_df, plot_scatter, df_cat_sem_out, df_externo_distance = domain_applicability.process(df_reduced_wname, X_train)
        distance_df.to_csv(os.path.join(domain_dir, 'distance.csv'), index=False)
        df_cat_sem_out.to_csv(os.path.join(domain_dir, 'data_non_outliers.csv'), index=False)
        df_externo_distance.to_csv(os.path.join(domain_dir, 'df_externo_with_distance.csv'), index=False)

        with open(os.path.join(domain_dir, "domain_applicability.png"), "wb") as f:
            f.write(plot_scatter.getbuffer())

        # ---------------------------------------------------- step 6
        log("[6/6] Predicting compounds...")
        df_pred = predict_compounds.process(df_cat_sem_out, models_dir)
        df_pred.to_csv(os.path.join(predict_dir, 'new_with_consensus.csv'), index=False)

        config_info = {
            'created_at':           datetime.now().strftime("%Y%m%d_%H%M%S"),
            'run_dir':              base_dir,
            'actives_datawarrior':  actives_dw_path,
            'decoys_datawarrior':   decoys_dw_path,
            'actives_consolidated': actives_cons_path,
            'decoys_consolidated':  decoys_cons_path,
            'output_prefix':        output_prefix,
        }

        config_path = os.path.join(output_root, run_name, "config.pkl")
        with open(config_path, 'wb') as f:
            pickle.dump(config_info, f)

        log(f"Pipeline complete! Results saved to: {base_dir}")

        return {
            "run_id":     run_name,
            "output_dir": base_dir,
            "status":     "success",
            "artifacts": {
                "scaler": os.path.join(train_dir, "scaler.pkl"),
                "train_columns": os.path.join(train_dir, "train_columns.pkl"),
                "model_columns": os.path.join(train_dir, "model_columns.pkl"),
                "train_test_data": os.path.join(train_dir, "train_test_data.npz"),
                "best_results": os.path.join(models_dir, "best_model_results.csv"),
                "metrics": os.path.join(metrics_dir, "model_metrics.csv"),
                "distance": os.path.join(domain_dir,  "distance.csv"),
                "non_outliers": os.path.join(domain_dir,  "data_non_outliers.csv"),
                "ext_distance": os.path.join(domain_dir,  "df_externo_with_distance.csv"),
                "domain_plot": os.path.join(domain_dir,  "domain_applicability.png"),
                "predictions": os.path.join(predict_dir, "new_with_consensus.csv"),
                "config": os.path.join(base_dir,    "config.pkl"),
            },
        }

    except Exception as e:
        log(f"ERROR: {str(e)}")
        raise

def run_prediction_pipeline(build_dir: str, actives_dw_path: str, actives_cons_path: str, output_prefix: str, selected_models: set = None, progress_callback=None) -> dict:
    "Pipeline compartilhado entre prebuildmodel e usermodel"

    def log(msg):
        print(msg)
        if progress_callback:
            progress_callback(msg)

    main_root = os.path.dirname(os.path.abspath(__file__))
    predictions_root = os.path.join(main_root, "output_predictions")
    os.makedirs(predictions_root, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    run_name = f"{output_prefix}-{timestamp}"
    base_dir = os.path.join(predictions_root, run_name)
    temp_dir = os.path.join(base_dir, "temp")
    predict_dir = os.path.join(base_dir, "predicts")
    domain_dir = os.path.join(base_dir, "domain_app")

    for directory in [temp_dir, predict_dir, domain_dir]:
        os.makedirs(directory, exist_ok=True)

    shutil.copy(actives_dw_path, os.path.join(temp_dir, 'actives_datawarrior.txt'))
    shutil.copy(actives_cons_path, os.path.join(temp_dir, 'active_consolidated.csv'))

    artifacts_dir = os.path.join(build_dir, "artifacts")
    models_dir = os.path.join(build_dir, "models")

    try:
        from core import (
            prepare_files_predict,
            pre_treatment_predict,
            normalization,
            train_models,
            predict_compounds,
            domain_applicability,
        )

        log("[1/4] Loading artifacts...")
        with open(os.path.join(artifacts_dir, "scaler.pkl"), 'rb') as f:
            scaler = pickle.load(f)
        with open(os.path.join(artifacts_dir, "train_columns.pkl"), 'rb') as f:
            train_columns = pickle.load(f)
        with open(os.path.join(artifacts_dir, "model_columns.pkl"), 'rb') as f:
            model_columns = pickle.load(f)

        data_splits = np.load(os.path.join(artifacts_dir, "train_test_data.npz"))
        X_train = pd.DataFrame(data_splits['X_train'], columns=model_columns)

        log("[2/4] Preparing actives data...")
        df_final = prepare_files_predict.process(work_dir=temp_dir)
        df_final_path = os.path.join(temp_dir, 'df_final.csv')
        df_final.to_csv(df_final_path, index=False)

        df_var_path = os.path.join(temp_dir, 'df_var_final.csv')
        df_var_final = pre_treatment_predict.process(df_final_path, train_columns)
        df_var_final.to_csv(df_var_path, index=False)

        log("[3/4] Applying normalization...")
        df = pd.read_csv(df_var_path)
        df_name = df.pop('name')
        df_activity = df.pop('activity') if 'activity' in df.columns else None

        X_new = df.reindex(columns=train_columns, fill_value=0)
        X_norm = pd.DataFrame(scaler.transform(X_new), columns=train_columns)
        X_final = X_norm.reindex(columns=model_columns, fill_value=0)

        if df_activity is not None:
            X_final['activity'] = df_activity.values

        df_reduced_wname = pd.concat([df_name.reset_index(drop=True), X_final.reset_index(drop=True)], axis=1)

        log("[4/4] Computing applicability domain and predicting...")
        distance_df, plot_scatter, df_cat_sem_out, df_externo_distance = domain_applicability.process(df_reduced_wname, X_train)
        distance_df.to_csv(os.path.join(domain_dir, 'distance.csv'), index=False)
        df_cat_sem_out.to_csv(os.path.join(domain_dir, 'data_non_outliers.csv'), index=False)
        df_externo_distance.to_csv(os.path.join(domain_dir, 'df_externo_with_distance.csv'), index=False)

        with open(os.path.join(domain_dir, "domain_applicability.png"), "wb") as f:
            f.write(plot_scatter.getbuffer())
        
        df_pred = predict_compounds.process(df_cat_sem_out, models_dir, selected_models)
        # df_pred = df_pred[df_pred['consensus'] > 0]
        df_pred.to_csv(os.path.join(predict_dir, 'new_with_consensus.csv'), index=False)

        log(f"Done! Results saved in: {base_dir}")

        return {
            "run_id": run_name,
            "output_dir": base_dir,
            "status": "success",
            "artifacts": {
                "predictions": os.path.join(predict_dir, "new_with_consensus.csv"),
                "distance": os.path.join(domain_dir, "distance.csv"),
                "domain_plot": os.path.join(domain_dir, "domain_applicability.png"),
            }
        }
    
    except Exception as e:
        log(f"ERROR: {str(e)}")
        raise


def prebuild_model(build_name: str, actives_dw_path: str, actives_cons_path: str, output_prefix: str, selected_models: set = None, progress_callback=None) -> dict:
    main_root    = os.path.dirname(os.path.abspath(__file__))
    build_dir    = os.path.join(main_root, "prebuildmodel", build_name)

    if not os.path.isdir(build_dir):
        raise ValueError(f"Pre-built dataset '{build_name}' not found.")

    return run_prediction_pipeline(
        build_dir, actives_dw_path, actives_cons_path, output_prefix, selected_models, progress_callback
    )

def user_model(run_name: str, actives_dw_path: str, actives_cons_path: str, output_prefix: str, selected_models: set = None, progress_callback=None) -> dict:
    main_root = os.path.dirname(os.path.abspath(__file__))
    run_dir   = os.path.join(main_root, "usermodel", run_name)

    if not os.path.isdir(run_dir):
        raise ValueError(f"User model '{run_name}' not found in output/.")

    return run_prediction_pipeline(
        run_dir, actives_dw_path, actives_cons_path, output_prefix, selected_models, progress_callback
    )