import io
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.spatial.distance import cdist, mahalanobis
from scipy.linalg import inv

def process(input_data, x_train):
    # == EDIT ==
    # Deriva colunas diretamente do treino
    train_columns = x_train.columns.tolist()

    # 1. Calcula o centroide e a matriz de covariância inversa do treino
    centroid = np.mean(x_train, axis=0)
    # dist_euclidiana_train = cdist(x_test, [centroid], metric='euclidean')
    cov_matrix = np.cov(x_train, rowvar=False)
    inv_cov_matrix = inv(cov_matrix)
    # =====

    # Calcula a distância de Mahalanobis entre cada ponto de X_test e o centroide de X_train
    # x_test_np = np.asarray(x_test)
    # dist_mahalanobis_test = np.array([
    #     mahalanobis(row.ravel(), centroid.ravel(), inv_cov_matrix)
    #     for row in x_test_np
    # ])

    # 2. Calcula distâncias do TREINO ao centroide (base para os limites)
    dist_euclidiana_train = cdist(x_train, [centroid], metric='euclidean').flatten()
    dist_mahalanobis_train = np.array([
        mahalanobis(row, centroid, inv_cov_matrix)
        for row in x_train.to_numpy()
    ])

    # 3. Definir os limites máximos (usando quantil 95% como exemplo)
    limite_euclidiana = np.percentile(dist_euclidiana_train, 95)
    # limite_mahalanobis = np.percentile(dist_mahalanobis_test, 95)
    limite_mahalanobis = np.percentile(dist_mahalanobis_train, 95)

    distance_df = pd.DataFrame({
        "Distance": ["euclidean", "mahalanobis"],
        "limite": [limite_euclidiana, limite_mahalanobis]
    })

    # Ler Dataframe
    df_externo = input_data.copy()
    df_name = df_externo.pop("name")

    # train_columns = ['Total Molweight', 'cLogP', 'H-Acceptors', 'H-Donors',
    #              'Druglikeness', 'Molecular Flexibility', 'PLP.Chemscore.Hbond',
    #              'PLP.part.buried', 'PLP.part.repulsive', 'energies_residues.GLN198.PLP.S(buried)', 'energies_residues.GLN198.PLP.total',
    #              'energies_residues.GLU263.PLP.S(buried)', 'energies_residues.GLU263.PLP.total', 'energies_residues.ILE365.PLP.total',
    #              'energies_residues.MET261.PLP.S(buried)', 'energies_residues.MET261.PLP.S(nonpolar)', 'energies_residues.PHE367.PLP.S(buried)',
    #              'energies_residues.TYR260.PLP.total', 'energies_residues.TYR366.PLP.S(buried)', 'energies_residues.ARG263.PLP.S(buried)',
    #              'energies_residues.ASP264.PLP.S(buried)', 'energies_residues.ILE265.PLP.S(buried)', 'energies_residues.PHE51.PLP.S(buried)']
    
    # Verificar se todas as colunas do treinamento estão no conjunto externo
    missing_columns = [col for col in train_columns if col not in df_externo.columns]
    extra_columns   = [col for col in df_externo.columns if col not in train_columns]

    if missing_columns:
        print(f"Colunas faltando no conjunto externo: {missing_columns}")

    if extra_columns:
        df_externo = df_externo.drop(columns=extra_columns)

    # Ordenar as colunas do DataFrame externo para que correspondam ao conjunto de treinamento
    df_externo = df_externo[train_columns]

    # 5. Calcular as distâncias euclidiana e de Mahalanobis
    #centroid = np.mean(X_train, axis=0)
    dist_euclidiana_externo = cdist(df_externo, [centroid], metric='euclidean').flatten()
    # dist_mahalanobis_externo = [mahalanobis(x, centroid, inv_cov_matrix) for x in df_externo.to_numpy()]
    dist_mahalanobis_externo = np.array([
        mahalanobis(row, centroid, inv_cov_matrix)
        for row in df_externo.to_numpy()
    ])

    # cores = np.where((dist_euclidiana_externo > limite_euclidiana) | (dist_mahalanobis_externo > limite_mahalanobis), 'red', 'blue')
    # Validações
    if len(dist_euclidiana_externo) != len(df_externo):
        raise ValueError("Inconsistência no tamanho das distâncias euclidianas")
    if len(dist_mahalanobis_externo) != len(df_externo):
        raise ValueError("Inconsistência no tamanho das distâncias de Mahalanobis")

    # 6. Identifica outliers
    outliers = (dist_euclidiana_externo > limite_euclidiana) | (dist_mahalanobis_externo > limite_mahalanobis)
    cores = np.where(outliers, 'red', 'blue')

    # 7. Plotagem de gráficos
    fig, ax = plt.subplots(figsize=(14, 8), dpi=300)

    ax.scatter(dist_euclidiana_externo, dist_mahalanobis_externo, color=cores)

    ax.axhline(y=limite_mahalanobis, linestyle='-', color='red')
    ax.axvline(x=limite_euclidiana, linestyle='-', color='red')

    x_max = max(max(dist_euclidiana_externo) * 1.1, limite_euclidiana * 1.1)
    y_max = max(max(dist_mahalanobis_externo) * 1.1, limite_mahalanobis * 1.1)

    ax.set_xlim(0, x_max)
    ax.set_ylim(0, y_max)
    
    ax.set_xlabel('Domain (Euclidean Distance)')
    ax.set_ylabel('Leverage (Mahalanobis Distance)')
    ax.set_title('Domain of Applicability')
    ax.grid(True)

    plot_scatter = io.BytesIO()
    fig.savefig(plot_scatter, format="png", dpi=300, bbox_inches="tight")
    plot_scatter.seek(0)
    plt.close(fig)

    # Identificar os outliers com base nos limites de distância
    # outliers = (dist_euclidiana_externo > limite_euclidiana) | (dist_mahalanobis_externo > limite_mahalanobis)

    # 8. Separa compostos dentro e fora do domínio
    df_externo_distance = df_externo.copy()
    df_externo_distance["dist_euclidiana"]  = dist_euclidiana_externo
    df_externo_distance["dist_mahalanobis"] = dist_mahalanobis_externo
    df_externo_distance = pd.concat([pd.DataFrame(df_name), df_externo_distance], axis=1)   

    data_sem_outliers  = df_externo[~outliers]
    names_sem_outliers = df_name[~outliers]
    df_cat_sem_out = pd.concat([names_sem_outliers, data_sem_outliers], axis=1)

    return distance_df, plot_scatter, df_cat_sem_out, df_externo_distance