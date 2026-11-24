import os
import pandas as pd
import numpy as np
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.metrics import (
    recall_score, precision_score, f1_score,
    accuracy_score, cohen_kappa_score,
    matthews_corrcoef, roc_auc_score, make_scorer
)
from imblearn.over_sampling import SMOTE
from joblib import parallel_backend

# Com max_workers=3 pipelines e 12 CPUs: 12 // 3 = 4 workers por pipeline.
PIPELINE_WORKERS = max(1, (os.cpu_count() or 4) // 3)

def format_model(model):
    params = model.get_params()
    default = model.__class__().get_params()
    changed = {k: v for k, v in params.items() 
            if v != default.get(k) and v is not None}
    name = model.__class__.__name__
    params_str = ', '.join(f"{k}={v}" for k, v in changed.items())
    return f"{name}({params_str})"

def process(input_file):
    """
    Train and evaluate multiple ML models on the processed data.
    This is based on 4_smote_ml_v2.py.
    
    Args:
        input_file (str): Path to the input CSV file.
    
    Returns:
        tuple: (models, metrics_df, data_splits)
            - models: Dictionary of trained models
            - metrics_df: DataFrame of model performance metrics
            - data_splits: Dictionary containing X_train, X_test, y_train, y_test
            - results_df: DataFrame with best CV MCC score per model
    """
    # Load the dataframe
    df = pd.read_csv(input_file, delimiter=',')
    
    # Separate features and target
    X = df.drop('activity', axis=1)
    y = df['activity']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Apply SMOTE to balance classes
    # smote = SMOTE(random_state=42)
    # X_resampled, y_resampled = smote.fit_resample(X, y)
    smote = SMOTE(random_state=42)
    X_train, y_train = smote.fit_resample(X_train, y_train)
    
    # Define models and their parameters for optimization
    models_params = {
        'LR':  (LogisticRegression(),{'C': [0.1, 1, 10]}),
        'NB':  (GaussianNB(),{'var_smoothing': [1e-2, 1e-5, 1e-9, 1e-15]}),
        'DT':  (DecisionTreeClassifier(),{'max_depth': [3, 5, 10], 'min_samples_split': [2, 5, 10]}),
        'RF':  (RandomForestClassifier(n_jobs=PIPELINE_WORKERS), {'n_estimators': [50, 100, 200], 'max_depth': [None, 10, 20]}),
        'SVM': (SVC(probability=True), {'C': [0.1, 1, 10], 'kernel': ['linear', 'rbf']}),
        'XGB': (XGBClassifier(eval_metric='logloss', n_jobs=PIPELINE_WORKERS, nthread=PIPELINE_WORKERS), {'n_estimators': [50, 100, 200], 'learning_rate': [0.01, 0.1, 0.2]}),
    }

    mcc_scorer = make_scorer(matthews_corrcoef)
    
    # K-Fold Cross Validation
    kfold = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
    best_models = {}
    cv_mcc_scores = {}
    
    with parallel_backend("threading", n_jobs=PIPELINE_WORKERS):
        for name, (model, params) in models_params.items():
            grid_search = GridSearchCV(
                model, params,
                cv=kfold,
                scoring=mcc_scorer,
                n_jobs=PIPELINE_WORKERS,
            )
            grid_search.fit(X_train, y_train)
            best_models[name] = grid_search.best_estimator_
            cv_mcc_scores[name] = grid_search.best_score_

    results_df = pd.DataFrame({
        'Model':      list(best_models.keys()),
        'Best Model': [str(m) for m in best_models.values()],
        'MCC':        [cv_mcc_scores[n] for n in best_models],
    })
    
    
    # Dictionary for metrics
    metrics_dict = {
        'Model': [],
        'Database': [],
        'Recall': [],
        'Precision': [],
        'Specificity': [],
        'Accuracy': [],
        'Error': [],
        'F_Score': [],
        'Cohen_s_kappa': [],
        'MCC': [],
        'AUC_ROC': []
    }
    
    # Evaluate models
    for name, model in best_models.items():
        y_pred_train = model.predict(X_train)
        y_prob_train = model.predict_proba(X_train)[:,1]
        
        y_pred_test = model.predict(X_test)
        y_prob_test = model.predict_proba(X_test)[:,1]
        
        for (y_true, y_pred, y_prob, banco) in [
            (y_train, y_pred_train, y_prob_train, "Training"), 
            (y_test, y_pred_test, y_prob_test, "Test")
        ]:
            
            metrics_dict['Model'].append(name)
            metrics_dict['Database'].append(banco)
            metrics_dict['Recall'].append(round(recall_score(y_true, y_pred) * 100, 2))
            # metrics_dict['Precision'].append(round(precision_score(y_true, y_pred) * 100, 2))
            metrics_dict['Precision'].append(round(precision_score(y_true, y_pred, zero_division=0) * 100, 2))
            metrics_dict['Specificity'].append(round(recall_score(y_true, y_pred, pos_label=0) * 100, 2))
            metrics_dict['Accuracy'].append(round(accuracy_score(y_true, y_pred) * 100, 2))
            metrics_dict['Error'].append(round((1 - accuracy_score(y_true, y_pred)) * 100, 2))
            metrics_dict['F_Score'].append(round(f1_score(y_true, y_pred), 2))
            metrics_dict['Cohen_s_kappa'].append(round(cohen_kappa_score(y_true, y_pred), 2))
            metrics_dict['MCC'].append(round(matthews_corrcoef(y_true, y_pred), 2))
            metrics_dict['AUC_ROC'].append(round(roc_auc_score(y_true, y_prob), 2))
    
    # Convert metrics to DataFrame
    metrics_df = pd.DataFrame(metrics_dict)
    
    # Prepare return values
    data_splits = {
        'X_train': X_train,
        'X_test': X_test,
        'y_train': y_train,
        'y_test': y_test
    }
    
    return best_models, metrics_df, data_splits, results_df