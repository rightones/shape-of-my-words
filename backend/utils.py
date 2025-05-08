# Utility functions for data loading, preprocessing, and PCA transformation

import gensim.downloader as api
from sklearn.decomposition import PCA
import numpy as np
import joblib  # For saving/loading sklearn models
import os
import gzip
import shutil
import requests
import pickle

import torch

# --- Device Configuration ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using PyTorch device: {device}")

# Global variable to hold the model and PCA
# We load them once to save time on subsequent requests
numberbatch_model = None
pca_model = None
PCA_MODEL_PATH = "data/pca_model.joblib"
WORD_VECTORS_PATH = "data/word_vectors_for_pca.npy"  # For storing subset of vectors used for PCA training

# --- Configuration for Numberbatch (Multilingual EN+KO) ---
# Using the full multilingual Numberbatch file
NUMBERBATCH_RAW_URL = "https://conceptnet.s3.amazonaws.com/downloads/2019/numberbatch/numberbatch-19.08.txt.gz"
NUMBERBATCH_DIM = 300
SUPPORTED_LANGUAGES = ["en", "ko"]  # Specify supported languages

DATA_DIR = "data"
# Update filenames to reflect multilingual (en+ko) nature
NUMBERBATCH_GZ_PATH = os.path.join(
    DATA_DIR, "numberbatch-19.08.txt.gz"
)  # Full multilingual file
NUMBERBATCH_TXT_PATH = os.path.join(
    DATA_DIR, "numberbatch-19.08.txt"
)  # Full multilingual file

PYTORCH_EMBEDDINGS_PATH = os.path.join(DATA_DIR, "nb_embeddings_enko.pt")
PYTORCH_WORD_TO_IDX_PATH = os.path.join(DATA_DIR, "nb_word_to_idx_enko.pkl")
PYTORCH_IDX_TO_WORD_PATH = os.path.join(
    DATA_DIR, "nb_idx_to_word_enko.pkl"
)  # This might be less useful if keys are full paths

# --- Configuration for PCA (trained on EN+KO embeddings) ---
PCA_MODEL_PT_PATH = os.path.join(DATA_DIR, "pca_model_enko.joblib")
WORD_VECTORS_PT_PATH = os.path.join(DATA_DIR, "word_vectors_for_pca_enko.npy")

# --- Global Variables (to be loaded) ---
# For PyTorch Numberbatch embeddings
embeddings_tensor = None
word_to_idx = None
idx_to_word_list = None  # Will store list of '/c/lang/word' strings

# For PCA model (still scikit-learn, but trained on data from PyTorch embeddings)
pca_model_pt = None

# Fallback sample words for PCA training if dedicated training data is not available
SAMPLE_WORDS_FOR_PCA = [
    {"word": "king", "lang": "en"},
    {"word": "queen", "lang": "en"},
    {"word": "apple", "lang": "en"},
    {"word": "love", "lang": "en"},
    {"word": "왕", "lang": "ko"},
    {"word": "여왕", "lang": "ko"},
    {"word": "사과", "lang": "ko"},
    {"word": "사랑", "lang": "ko"},
]

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# --- Helper Functions for Data Preparation (Download, Decompress, Parse) ---


def _download_numberbatch_raw_file():
    """Downloads the ConceptNet Numberbatch raw .txt.gz file if it doesn't exist."""
    if not os.path.exists(NUMBERBATCH_GZ_PATH):
        print(
            f"Downloading FULL Multilingual ConceptNet Numberbatch from {NUMBERBATCH_RAW_URL}..."
        )
        print(
            "WARNING: This is a very large file and may take a long time and significant disk space."
        )
        try:
            response = requests.get(NUMBERBATCH_RAW_URL, stream=True)
            response.raise_for_status()  # Raise an exception for HTTP errors
            with open(NUMBERBATCH_GZ_PATH, "wb") as f:
                for chunk in response.iter_content(
                    chunk_size=1024 * 1024
                ):  # Larger chunk size for large file
                    f.write(chunk)
                    print(".", end="", flush=True)  # Progress indicator
            print(f"\nDownloaded to {NUMBERBATCH_GZ_PATH}")
        except requests.exceptions.RequestException as e:
            print(f"Error downloading Numberbatch: {e}")
            if os.path.exists(NUMBERBATCH_GZ_PATH):  # Clean up partial download
                os.remove(NUMBERBATCH_GZ_PATH)
            return False
    else:
        print(
            f"Multilingual Numberbatch raw file {NUMBERBATCH_GZ_PATH} already exists."
        )
    return True


def _decompress_numberbatch_gz():
    """Decompresses the .gz file to .txt if the .txt file doesn't exist."""
    if not os.path.exists(NUMBERBATCH_TXT_PATH):
        if not os.path.exists(NUMBERBATCH_GZ_PATH):
            print(f"Error: {NUMBERBATCH_GZ_PATH} not found. Cannot decompress.")
            return False
        print(f"Decompressing {NUMBERBATCH_GZ_PATH} to {NUMBERBATCH_TXT_PATH}...")
        print(
            "WARNING: This may take a very long time and create a very large text file."
        )
        try:
            with gzip.open(NUMBERBATCH_GZ_PATH, "rb") as f_in:
                with open(NUMBERBATCH_TXT_PATH, "wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)
            print(f"Decompressed to {NUMBERBATCH_TXT_PATH}")
        except Exception as e:
            print(f"Error decompressing Numberbatch: {e}")
            if os.path.exists(NUMBERBATCH_TXT_PATH):  # Clean up partial extraction
                os.remove(NUMBERBATCH_TXT_PATH)
            return False
    else:
        print(
            f"Decompressed multilingual Numberbatch file {NUMBERBATCH_TXT_PATH} already exists."
        )
    return True


def _parse_numberbatch_and_save_pytorch():
    """
    Parses the raw Numberbatch .txt file, creates PyTorch tensors and mappings,
    and saves them to disk. Tensors are moved to the configured device.
    """
    global device, SUPPORTED_LANGUAGES
    if not os.path.exists(NUMBERBATCH_TXT_PATH):
        print(f"Error: {NUMBERBATCH_TXT_PATH} not found. Cannot parse.")
        return False

    print(
        f"Parsing {NUMBERBATCH_TXT_PATH} for EN/KO and creating PyTorch artifacts on device: {device}..."
    )
    local_word_to_idx = {}
    local_idx_to_word_list = []
    local_embeddings_list = []
    processed_count = 0

    try:
        with open(NUMBERBATCH_TXT_PATH, "r", encoding="utf-8") as f:
            # First line is header (e.g., "516783 300")
            num_embeddings_header, dim_header = map(int, f.readline().split())
            if dim_header != NUMBERBATCH_DIM:
                print(
                    f"Warning: Expected dimension {NUMBERBATCH_DIM}, but file reports {dim_header}. Using reported dimension."
                )
                # Update global NUMBERBATCH_DIM if you want to adapt dynamically, or stick to a fixed one.

            print(
                f"Header indicates {num_embeddings_header} total embeddings. Filtering for {SUPPORTED_LANGUAGES}..."
            )

            for i, line in enumerate(f):
                parts = line.strip().split(" ")
                word_full_path = parts[0]

                # Filter for supported languages (e.g., /c/en/word or /c/ko/word)
                path_parts = word_full_path.split("/")
                if (
                    len(path_parts) >= 3
                    and path_parts[1] == "c"
                    and path_parts[2] in SUPPORTED_LANGUAGES
                ):
                    lang_code = path_parts[2]
                    # word_token = path_parts[3] # The actual word token
                    # We will use the full path like '/c/en/king' as the key in word_to_idx

                    vector_values = [float(x) for x in parts[1:]]
                    if len(vector_values) != dim_header:
                        # print(f"Warning: Skipping line {i+2} for word '{word_full_path}'. Dim mismatch.")
                        continue

                    current_idx = len(local_idx_to_word_list)
                    local_word_to_idx[word_full_path] = current_idx
                    local_idx_to_word_list.append(word_full_path)
                    local_embeddings_list.append(vector_values)
                    processed_count += 1
                    if processed_count % 50000 == 0:
                        print(f"Processed {processed_count} EN/KO embeddings...")
    except Exception as e:
        print(f"Error parsing Numberbatch text file: {e}")
        return False

    if not local_embeddings_list:
        print(f"No EN/KO embeddings were parsed from {NUMBERBATCH_TXT_PATH}.")
        return False
    print(f"Finished parsing. Found {processed_count} EN/KO embeddings.")

    try:
        global embeddings_tensor, word_to_idx, idx_to_word_list
        # Create tensor on CPU first, then move to device to avoid potential OOM on GPU during large list conversion
        temp_embeddings_tensor = torch.tensor(
            local_embeddings_list, dtype=torch.float32
        )
        embeddings_tensor = temp_embeddings_tensor.to(
            device
        )  # Move to configured device
        word_to_idx = local_word_to_idx
        idx_to_word_list = local_idx_to_word_list  # Store the list of full paths

        # When saving, it saves the tensor as it is (including its device).
        # For better portability, one might save the CPU version (embeddings_tensor.cpu())
        # and then move to device on load. However, for simplicity, we save as is.
        print(
            f"Saving PyTorch EN/KO embeddings (on {embeddings_tensor.device}) to {PYTORCH_EMBEDDINGS_PATH}"
        )
        torch.save(embeddings_tensor, PYTORCH_EMBEDDINGS_PATH)

        print(f"Saving EN/KO word_to_idx mapping to {PYTORCH_WORD_TO_IDX_PATH}")
        with open(PYTORCH_WORD_TO_IDX_PATH, "wb") as f_w2i:
            pickle.dump(word_to_idx, f_w2i)

        print(f"Saving EN/KO idx_to_word_list mapping to {PYTORCH_IDX_TO_WORD_PATH}")
        with open(PYTORCH_IDX_TO_WORD_PATH, "wb") as f_i2w:
            pickle.dump(idx_to_word_list, f_i2w)

        print("PyTorch EN/KO Numberbatch artifacts saved successfully.")
    except Exception as e:
        print(f"Error saving PyTorch EN/KO artifacts: {e}")
        return False
    return True


# --- Main Loading Function for PyTorch Numberbatch Embeddings ---
def load_numberbatch_pytorch():
    """
    Loads Numberbatch embeddings as PyTorch tensors to the configured device.
    If preprocessed files don't exist, it triggers download, decompression, and parsing.
    """
    global embeddings_tensor, word_to_idx, idx_to_word_list, device

    if (
        embeddings_tensor is not None
        and word_to_idx is not None
        and idx_to_word_list is not None
    ):
        # Ensure tensor is on the correct device if it was already loaded
        if embeddings_tensor.device != device:
            embeddings_tensor = embeddings_tensor.to(device)
            print(f"Moved existing EN/KO embeddings_tensor to device: {device}")
        print(
            "PyTorch EN/KO Numberbatch embeddings already loaded and on correct device."
        )
        return True

    if (
        os.path.exists(PYTORCH_EMBEDDINGS_PATH)
        and os.path.exists(PYTORCH_WORD_TO_IDX_PATH)
        and os.path.exists(PYTORCH_IDX_TO_WORD_PATH)
    ):
        print(f"Loading preprocessed PyTorch EN/KO artifacts to device: {device}...")
        try:
            # Load tensor and explicitly map to the configured device
            embeddings_tensor = torch.load(PYTORCH_EMBEDDINGS_PATH, map_location=device)
            with open(PYTORCH_WORD_TO_IDX_PATH, "rb") as f_w2i:
                word_to_idx = pickle.load(f_w2i)
            with open(PYTORCH_IDX_TO_WORD_PATH, "rb") as f_i2w:
                idx_to_word_list = pickle.load(f_i2w)
            print(
                f"PyTorch EN/KO artifacts loaded successfully to {embeddings_tensor.device}."
            )

            if (
                not isinstance(embeddings_tensor, torch.Tensor)
                or not isinstance(word_to_idx, dict)
                or not isinstance(idx_to_word_list, list)
            ):
                print(
                    "Error: Loaded PyTorch EN/KO artifacts have incorrect types. Attempting to re-process."
                )
                embeddings_tensor, word_to_idx, idx_to_word_list = None, None, None
            else:
                if embeddings_tensor.shape[1] != NUMBERBATCH_DIM:
                    print(
                        f"Warning: Loaded embeddings tensor has dimension {embeddings_tensor.shape[1]}, expected {NUMBERBATCH_DIM}."
                    )
                return True
        except Exception as e:
            print(
                f"Error loading preprocessed PyTorch EN/KO artifacts: {e}. Attempting to re-process."
            )
            embeddings_tensor, word_to_idx, idx_to_word_list = None, None, None

    print(
        "Preprocessed PyTorch EN/KO artifacts not found or failed to load. Starting full preparation..."
    )
    if not _download_numberbatch_raw_file():
        return False
    if not _decompress_numberbatch_gz():
        return False
    if not _parse_numberbatch_and_save_pytorch():
        return False

    print("Full EN/KO Numberbatch preparation and loading complete.")
    return True


# --- Word Vector Retrieval (PyTorch version) ---
def get_word_vector_pytorch(word, lang):
    """
    Gets the PyTorch tensor for a word in a specific language.
    Constructs the key as '/c/lang/word'.
    Returns a zero tensor on the configured device if the word is not in vocabulary.
    """
    global embeddings_tensor, word_to_idx, device, SUPPORTED_LANGUAGES
    if lang not in SUPPORTED_LANGUAGES:
        # print(f"Warning: Language '{lang}' not in supported languages: {SUPPORTED_LANGUAGES}. Cannot get vector for '{word}'.")
        return torch.zeros(NUMBERBATCH_DIM, dtype=torch.float32, device=device)

    conceptnet_key = (
        f"/c/{lang}/{word.lower()}"  # Numberbatch usually has lowercase words
    )

    if embeddings_tensor is None or word_to_idx is None:
        print(
            "Error: PyTorch EN/KO Numberbatch embeddings not loaded. Attempting to load..."
        )
        if not load_numberbatch_pytorch() or embeddings_tensor is None:
            return torch.zeros(NUMBERBATCH_DIM, dtype=torch.float32, device=device)

    if conceptnet_key in word_to_idx:
        idx = word_to_idx[conceptnet_key]
        return embeddings_tensor[idx]
    else:
        # print(f"Warning: Word '{word}' (lang: {lang}, key: {conceptnet_key}) not in EN/KO vocabulary.")
        return torch.zeros(NUMBERBATCH_DIM, dtype=torch.float32, device=device)


# --- PCA Related Functions (using scikit-learn, adapted for PyTorch tensors) ---


def train_and_save_pca_pytorch(n_components=2, force_retrain=False):
    """
    Trains a scikit-learn PCA model on a subset of PyTorch word vectors and saves it.
    Word vectors are moved to CPU for scikit-learn processing.
    """
    global pca_model_pt, embeddings_tensor, word_to_idx, device, idx_to_word_list

    if not force_retrain and os.path.exists(PCA_MODEL_PT_PATH):
        print(f"Loading existing EN/KO PCA model from {PCA_MODEL_PT_PATH}")
        try:
            pca_model_pt = joblib.load(PCA_MODEL_PT_PATH)
            print("EN/KO PCA model loaded.")
            if not hasattr(pca_model_pt, "transform") or not hasattr(
                pca_model_pt, "n_components_"
            ):
                print("Warning: Loaded EN/KO PCA model appears invalid. Will retrain.")
                pca_model_pt = None
            else:
                return pca_model_pt
        except Exception as e:
            print(
                f"Error loading EN/KO PCA model from {PCA_MODEL_PT_PATH}: {e}. Will retrain."
            )
            pca_model_pt = None

    print("Training new EN/KO PCA model...")
    if embeddings_tensor is None or word_to_idx is None or idx_to_word_list is None:
        print(
            "EN/KO Numberbatch embeddings not loaded. Attempting to load them first..."
        )
        if not load_numberbatch_pytorch() or embeddings_tensor is None:
            print("Cannot train EN/KO PCA: Numberbatch embeddings failed to load.")
            return None

    pca_training_data_np = None
    if os.path.exists(WORD_VECTORS_PT_PATH):
        print(
            f"Loading word vectors for EN/KO PCA training from {WORD_VECTORS_PT_PATH}"
        )
        try:
            # This file contains NumPy array, already on CPU
            pca_training_data_np = np.load(WORD_VECTORS_PT_PATH)
            if pca_training_data_np.ndim == 1 and pca_training_data_np.shape[0] > 0:
                pca_training_data_np = pca_training_data_np.reshape(1, -1)
            elif pca_training_data_np.ndim == 0:
                pca_training_data_np = None
        except Exception as e:
            print(
                f"Error loading EN/KO word vectors from {WORD_VECTORS_PT_PATH}: {e}. Falling back."
            )
            pca_training_data_np = None
    else:
        print(
            f"EN/KO word vectors file {WORD_VECTORS_PT_PATH} not found. Using fallback sample words."
        )

    if pca_training_data_np is None or pca_training_data_np.shape[0] < n_components:
        if pca_training_data_np is not None:
            print(
                f"Loaded EN/KO data has only {pca_training_data_np.shape[0]} samples. Fallback to SAMPLE_WORDS_FOR_PCA."
            )
        else:
            print(f"Falling back to using SAMPLE_WORDS_FOR_PCA for EN/KO PCA training.")

        sample_word_vectors_pt = []
        for (
            item
        ) in (
            SAMPLE_WORDS_FOR_PCA
        ):  # SAMPLE_WORDS_FOR_PCA now contains dicts {"word": w, "lang": l}
            vec_pt = get_word_vector_pytorch(item["word"], item["lang"])
            if not torch.all(vec_pt.eq(0)):
                sample_word_vectors_pt.append(vec_pt)

        if not sample_word_vectors_pt or len(sample_word_vectors_pt) < n_components:
            print(
                f"Not enough valid vectors ({len(sample_word_vectors_pt)}) from SAMPLE_WORDS_FOR_PCA for EN/KO PCA."
            )
            return None

        stacked_tensors = torch.stack(sample_word_vectors_pt)  # Still on device
        pca_training_data_np = (
            stacked_tensors.detach().cpu().numpy()
        )  # Move to CPU for scikit-learn
        if pca_training_data_np.ndim == 1:
            pca_training_data_np = pca_training_data_np.reshape(1, -1)

    if pca_training_data_np.shape[0] < n_components:
        print(
            f"Not enough samples ({pca_training_data_np.shape[0]}) for EN/KO PCA with {n_components} components."
        )
        return None

    try:
        current_pca = PCA(n_components=n_components)
        current_pca.fit(pca_training_data_np)  # scikit-learn PCA runs on CPU
        pca_model_pt = current_pca
        joblib.dump(pca_model_pt, PCA_MODEL_PT_PATH)
        print(f"EN/KO PCA model trained and saved to {PCA_MODEL_PT_PATH}")
    except Exception as e:
        print(f"Error during EN/KO PCA training or saving: {e}")
        pca_model_pt = None
        return None
    return pca_model_pt


def get_pca_model_pytorch(force_retrain=False):
    """
    Loads the scikit-learn PCA model (trained on PyTorch embeddings), training if necessary.
    """
    global pca_model_pt
    if pca_model_pt is None or force_retrain or not hasattr(pca_model_pt, "transform"):
        if pca_model_pt is not None and not hasattr(pca_model_pt, "transform"):
            print("EN/KO PCA model found but seems invalid. Retraining.")
        pca_model_pt = train_and_save_pca_pytorch(force_retrain=force_retrain)
    return pca_model_pt


def transform_to_2d_pytorch(word_vector_pt):
    """
    Transforms a high-dimensional PyTorch word vector (on device) to 2D NumPy array (on CPU).
    """
    global pca_model_pt
    if pca_model_pt is None or not hasattr(pca_model_pt, "transform"):
        print("EN/KO PCA model not loaded or invalid. Attempting to load/train...")
        if get_pca_model_pytorch() is None or not hasattr(
            pca_model_pt, "transform"
        ):  # Ensure it tries to load/train
            print(
                "Error: EN/KO PCA model could not be loaded/trained or is invalid after attempt."
            )
            return None

    if word_vector_pt is None or not isinstance(word_vector_pt, torch.Tensor):
        print("Invalid input: word_vector_pt must be a PyTorch Tensor.")
        return None

    # Ensure word_vector_pt is on CPU for scikit-learn transform
    word_vector_np = word_vector_pt.detach().cpu().numpy().reshape(1, -1)

    try:
        transformed_vector_np = pca_model_pt.transform(
            word_vector_np
        )  # scikit-learn runs on CPU
        return transformed_vector_np[0]
    except Exception as e:
        print(f"Error transforming vector with EN/KO PCA: {e}")
        if (
            hasattr(pca_model_pt, "n_features_in_")
            and word_vector_np.shape[1] != pca_model_pt.n_features_in_
        ):
            print(
                f"PCA model expects {pca_model_pt.n_features_in_} features, got {word_vector_np.shape[1]}."
            )
        return None


# --- Old function definitions kept for reference during refactor ---
# def load_numberbatch_model(): (old version)
#     # Load ConceptNet Numberbatch model (e.g., using gensim)
#     pass

# def get_word_vector(word, model): (old version)
#     # Get 600D vector for a word
#     pass

# def train_pca(data, n_components=2): (old version)
#     # Train PCA model
#     pass

# def transform_pca(vector, pca_model): (old version)
#     # Transform vector to 2D using PCA
#     pass
