import sys
import os

# Add the project root and backend directory to sys.path to allow imports
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)  # This should be the 'backend' directory
PROJECT_ROOT_DIR = os.path.dirname(BACKEND_DIR)  # This should be the project root
sys.path.insert(0, BACKEND_DIR)
sys.path.insert(0, PROJECT_ROOT_DIR)

import utils
import numpy as np
import torch  # For torch.Tensor and torch.stack


def create_and_save_pca_training_data_enko(
    output_path=utils.WORD_VECTORS_PT_PATH,
    num_words=40000,  # Default number of words for PCA training (e.g., 20k EN + 20k KO)
):
    """
    Creates a subset of EN/KO word vectors from PyTorch-based Numberbatch embeddings
    and saves them as a NumPy array for scikit-learn PCA training.
    This should be run once as a preprocessing step after Numberbatch EN/KO data is prepared.
    """
    print(f"Attempting to create and save EN/KO PCA training data to {output_path}...")

    if not utils.load_numberbatch_pytorch():
        print(
            "EN/KO Numberbatch PyTorch embeddings could not be loaded. Cannot create PCA training data."
        )
        return

    if (
        utils.embeddings_tensor is None
        or utils.word_to_idx is None
        or utils.idx_to_word_list is None
    ):
        print(
            "Critical error: EN/KO Numberbatch embeddings not populated in utils module after loading."
        )
        return

    word_vectors_pt_list = []

    source_word_list = utils.idx_to_word_list
    if not source_word_list:
        print(
            "Vocabulary (idx_to_word_list for EN/KO) is empty. Cannot collect vectors."
        )
        return

    print(f"Collecting up to {num_words} EN/KO word vectors for PCA training...")

    collected_count = 0
    for full_word_path in source_word_list:
        if collected_count >= num_words:
            break

        try:
            # full_word_path is like '/c/en/word' or '/c/ko/word'
            path_parts = full_word_path.split("/")
            if len(path_parts) < 4 or path_parts[1] != "c":  # Basic validation
                # print(f"Skipping malformed path: {full_word_path}")
                continue
            lang_code = path_parts[2]
            actual_word = path_parts[3]
        except ValueError:
            # print(f"Could not parse lang/word from '{full_word_path}'. Skipping.")
            continue

        if lang_code not in utils.SUPPORTED_LANGUAGES:
            # This check should be redundant if idx_to_word_list from utils.py is already correctly filtered
            # print(f"Skipping path with unsupported lang_code '{lang_code}': {full_word_path}")
            continue

        # Call get_word_vector_pytorch with both actual_word and lang_code
        vector_pt = utils.get_word_vector_pytorch(actual_word, lang_code)

        if not torch.all(vector_pt.eq(0)):
            word_vectors_pt_list.append(vector_pt)
            collected_count += 1

        if collected_count > 0 and collected_count % 5000 == 0:
            print(f"Collected {collected_count} EN/KO vectors...")

    if not word_vectors_pt_list:
        print("No EN/KO word vectors collected. PCA training data not saved.")
        return

    print(f"Finished collecting {len(word_vectors_pt_list)} EN/KO vectors.")

    try:
        stacked_tensors = torch.stack(word_vectors_pt_list)
        data_np = stacked_tensors.detach().cpu().numpy()
    except Exception as e:
        print(f"Error converting PyTorch EN/KO tensors to NumPy array: {e}")
        return

    if data_np.ndim == 1 and data_np.shape[0] > 0:
        data_np = data_np.reshape(1, -1)
    elif data_np.shape[0] < 2:
        print(
            f"Collected only {data_np.shape[0]} EN/KO vectors. PCA requires at least 2 samples. Data not saved."
        )
        return

    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        np.save(output_path, data_np)
        print(
            f"EN/KO PCA training data ({data_np.shape[0]} vectors, {data_np.shape[1]} dims) saved to {output_path}"
        )
    except Exception as e:
        print(f"Error saving EN/KO PCA training data NumPy array: {e}")


if __name__ == "__main__":

    print("Starting EN/KO PCA training data preparation script (PyTorch-based)...")

    # Adjust num_pca_words as needed. More words give better PCA but take longer.
    # Consider roughly how many English vs. Korean words you want if not taking from combined list.
    num_pca_words = 40000
    print(
        f"Will attempt to use up to {num_pca_words} EN/KO words for PCA training data."
    )

    # Ensure the correct function name from the last utils.py update is used if it was also changed there.
    # Assuming create_and_save_pca_training_data_enko is the consistent name for the EN/KO version.
    create_and_save_pca_training_data_enko(num_words=num_pca_words)

    print("EN/KO PCA training data preparation (PyTorch-based) finished.")
