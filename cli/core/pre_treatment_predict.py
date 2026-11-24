import pandas as pd

def process(input_file: str, train_columns: list):
    """
    Pre-treat actives using the pre-built column list.
    Instead of recalculating variance/zeros thresholds,
    aligns to the columns used during training.

    Args:
        input_file (str): Path to the input CSV file.
        train_columns (list): Columns used during training (from train_columns.pkl).

    Returns:
        pd.DataFrame: Pre-treated dataframe aligned to training columns.
    """
    df = pd.read_csv(input_file, delimiter=',')
    df_name = df.pop('name')

    # Convert to numeric
    df = df.apply(pd.to_numeric, errors='coerce').fillna(0)

    # Align to training columns (fill missing with 0, drop extras)
    df = df.reindex(columns=train_columns, fill_value=0)

    # Restore name and activity
    df.insert(0, 'name', df_name.values)

    return df