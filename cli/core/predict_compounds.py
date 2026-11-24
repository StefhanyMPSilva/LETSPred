from __future__ import annotations
import os
import logging
import pandas as pd
import pickle
import re
import warnings
from sklearn.exceptions import InconsistentVersionWarning

logger = logging.getLogger(__name__)


def _load_models(models_dir: str, selected: set = None) -> dict:
    """
    Loads valid ML models from .pkl files in the given directory.

    Args:
        models_dir (str): Directory containing model .pkl files.

    Returns:
        dict: Dictionary mapping model type (e.g. 'RF') to the loaded model object.
    """
    loaded_models = {}
    model_files = [f for f in os.listdir(models_dir) if f.endswith('.pkl')]

    if not model_files:
        raise ValueError(f"No model files found in {models_dir}")

    for model_file in model_files:
        match = re.search(r'(LR|NB|DT|RF|SVM|XGB)_model\.pkl$', model_file)
        if not match:
            continue

        model_type = match.group(1)
        
        if selected and model_type not in selected:
            logger.info(f"Skipping model: {model_type} (not selected)")
            continue

        # if model_type in loaded_models:
        #     continue

        model_path = os.path.join(models_dir, model_file)
        try:
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)

            if hasattr(model, 'predict_proba') and callable(model.predict_proba):
                loaded_models[model_type] = model
                logger.info(f"Loaded model: {model_type} from {model_file}")

        except Exception as e:
            logger.warning(f"Error loading {model_file}: {e}")

    if not loaded_models:
        raise ValueError(f"No valid models found in {models_dir}")

    logger.info(f"Loaded {len(loaded_models)} models: {', '.join(loaded_models.keys())}")
    return loaded_models


def _prepare_input(input_file: pd.DataFrame, expected_columns) -> tuple[pd.Series, pd.DataFrame]:
    """
    Prepares the input DataFrame for prediction.

    Args:
        input_file (pd.DataFrame): Raw input data.
        expected_columns: Feature names expected by the model.

    Returns:
        tuple: (df_name, input_features)
            - df_name: Series with compound names
            - input_features: DataFrame with only the expected feature columns
    """
    df = input_file.copy()
    df.columns = df.columns.str.strip()

    name_cols = [c for c in df.columns if c.lower() == 'name']
    if name_cols:
        df.rename(columns={name_cols[0]: 'name'}, inplace=True)
    else:
        df['name'] = [f"compound_{i}" for i in range(len(df))]

    df_name = df.pop('name')
    df_name.name = 'name'

    missing = [col for col in expected_columns if col not in df.columns]
    if missing:
        raise ValueError(f"Required columns not found in input data: {missing}")

    return df_name, df[expected_columns]


def process(input_file: pd.DataFrame, models_dir: str, selected_models: set = None) -> pd.DataFrame:
    """
    Make predictions using all available trained models in the models directory.

    Args:
        input_file (pd.DataFrame): DataFrame with compounds to predict.
        models_dir (str): Directory containing model .pkl files.

    Returns:
        pd.DataFrame: DataFrame with prediction probabilities and consensus.
    """
    loaded_models = _load_models(models_dir, selected=selected_models)

    model_ref = next(iter(loaded_models.values()))
    expected_columns = getattr(model_ref, "feature_names_in_", None)
    if expected_columns is None:
        raise ValueError("Model does not contain feature_names_in_")

    df_name, input_features = _prepare_input(input_file, expected_columns)

    results = input_features.copy()

    for model_name, model in loaded_models.items():
        results[f'ativd_pred_{model_name}'] = model.predict_proba(input_features)[:, 1]

    pred_columns = [col for col in results.columns if col.startswith('ativd_pred_')]

    results['consensus'] = (results[pred_columns] > 0.5).sum(axis=1)

    results['consensus_Model'] = (
        results[pred_columns]
        .gt(0.5)
        .apply(lambda x: ', '.join(x.index[x].str.replace('ativd_pred_', '')), axis=1)
    )

    # models_used = ', '.join(sorted(loaded_models.keys()))
    # results['models_used'] = models_used

    return pd.concat([df_name, results], axis=1)