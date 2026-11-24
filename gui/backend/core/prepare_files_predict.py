import os
import pandas as pd

def process(work_dir: str = None):
    """
    Process actives-only files for prediction (no decoys).
    Used by the prebuildmodel command.
    """
    caminho_diretorio = work_dir if work_dir else os.getcwd()
    colunas_remover = ['Structure of smiles [idcode]', 'smiles', 'Unnamed: 16', 'Structure[idcode]']

    # DataWarrior — actives only
    df_dw = pd.read_csv(os.path.join(caminho_diretorio, 'actives_datawarrior.txt'), delimiter='\t', header=0)
    df_dw = df_dw.drop(columns=colunas_remover, errors='ignore')

    # GOLD consolidated — actives only
    df_cons = pd.read_csv(os.path.join(caminho_diretorio, 'active_consolidated.csv'), delimiter=',', header=0)

    # Normalize name column — DataWarrior
    df_dw['name'] = (
        df_dw['name']
        .str.replace('Resultados/', '', regex=False)
        .str.replace('.pdb', '', regex=False)
        .str.strip()
        .str.upper()
    )

    # Normalize name column — GOLD
    df_cons = df_cons.rename(columns={'Entry': 'name'})
    df_cons['name'] = (
        df_cons['name']
        .str.split('|').str[1]
        .str.replace('Resultados/', '', regex=False)
        .str.replace('.pdb', '', regex=False)
        .str.strip()
        .str.upper()
    )

    # Combine — drop duplicate name from GOLD
    df_final = pd.concat([df_dw, df_cons.iloc[:, 1:]], axis=1)

    # Remove unnecessary columns
    remove_colunas = ["Index", "Rescore.Rmsd", "Version", "time", "ASP.1"]
    df_final = df_final.drop(columns=remove_colunas, errors='ignore')

    return df_final