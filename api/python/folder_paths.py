import os
import time

supported_pt_extensions = set(['.ckpt', '.pt', '.bin', '.pth', '.safetensors'])

folder_names_and_paths = {}

base_path = os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "..", "data"))
models_dir = os.path.join(base_path, "models")
folder_names_and_paths["checkpoints"] = ([os.path.join(models_dir, "checkpoints")], supported_pt_extensions)
folder_names_and_paths["configs"] = ([os.path.join(models_dir, "configs")], [".yaml"])

folder_names_and_paths["loras"] = ([os.path.join(models_dir, "loras")], supported_pt_extensions)
folder_names_and_paths["vae"] = ([os.path.join(models_dir, "vae")], supported_pt_extensions)
folder_names_and_paths["clip"] = ([os.path.join(models_dir, "clip")], supported_pt_extensions)
folder_names_and_paths["unet"] = ([os.path.join(models_dir, "unet")], supported_pt_extensions)
folder_names_and_paths["clip_vision"] = ([os.path.join(models_dir, "clip_vision")], supported_pt_extensions)
folder_names_and_paths["style_models"] = ([os.path.join(models_dir, "style_models")], supported_pt_extensions)
folder_names_and_paths["embeddings"] = ([os.path.join(models_dir, "embeddings")], supported_pt_extensions)
folder_names_and_paths["diffusers"] = ([os.path.join(models_dir, "diffusers")], ["folder"])
folder_names_and_paths["vae_approx"] = ([os.path.join(models_dir, "vae_approx")], supported_pt_extensions)

folder_names_and_paths["controlnet"] = ([os.path.join(models_dir, "controlnet"), os.path.join(models_dir, "t2i_adapter")], supported_pt_extensions)
folder_names_and_paths["gligen"] = ([os.path.join(models_dir, "gligen")], supported_pt_extensions)

folder_names_and_paths["upscale_models"] = ([os.path.join(models_dir, "upscale_models")], supported_pt_extensions)

folder_names_and_paths["hypernetworks"] = ([os.path.join(models_dir, "hypernetworks")], supported_pt_extensions)

folder_names_and_paths["classifiers"] = ([os.path.join(models_dir, "classifiers")], {""})

temp_directory = os.path.join(os.path.dirname(os.path.realpath(__file__)), "temp")
projects_directory = os.path.join(base_path, "projects")

filename_list_cache = {}

def create_if_not_found(path):
    if not os.path.exists(path):
        os.makedirs(path)

def create_project_tree(project_id):
    global projects_directory

    project_id = str(project_id)
    create_if_not_found(os.path.join(projects_directory, project_id))

    create_if_not_found(get_output_directory(project_id))
    create_if_not_found(get_input_directory(project_id))

def get_output_directory(project_id):
    global projects_directory

    project_id = str(project_id)
    return os.path.join(projects_directory, project_id, "output")

def get_temp_directory():
    global temp_directory
    return temp_directory

def get_input_directory(project_id):
    global projects_directory

    project_id = str(project_id)
    return os.path.join(projects_directory, project_id, "input")

def recursive_search(directory, excluded_dir_names=None):
    if not os.path.isdir(directory):
        return [], {}

    if excluded_dir_names is None:
        excluded_dir_names = []

    result = []
    dirs = {directory: os.path.getmtime(directory)}
    for dirpath, subdirs, filenames in os.walk(directory, followlinks=True, topdown=True):
        subdirs[:] = [d for d in subdirs if d not in excluded_dir_names]
        for file_name in filenames:
            relative_path = os.path.relpath(os.path.join(dirpath, file_name), directory)
            result.append(relative_path)
        for d in subdirs:
            path = os.path.join(dirpath, d)
            dirs[path] = os.path.getmtime(path)
    return result, dirs

def filter_files_extensions(files, extensions):
        return sorted(list(filter(lambda a: os.path.splitext(a)[-1].lower() in extensions or len(extensions) == 0, files)))

def get_full_path(folder_name, filename, check_exists=True):
    global folder_names_and_paths
    if folder_name not in folder_names_and_paths:
        return None
    folders = folder_names_and_paths[folder_name]
    filename = os.path.relpath(os.path.join("/", filename), "/")
    for x in folders[0]:
        full_path = os.path.join(x, filename)
        if not check_exists or os.path.isfile(full_path):
            return full_path

    return None

def get_filename_list_(folder_name):
    global folder_names_and_paths
    output_list = set()
    folders = folder_names_and_paths[folder_name]
    output_folders = {}
    for x in folders[0]:
        files, folders_all = recursive_search(x, excluded_dir_names=[".git"])
        output_list.update(filter_files_extensions(files, folders[1]))
        output_folders = {**output_folders, **folders_all}

    return (sorted(list(output_list)), output_folders, time.perf_counter())

def cached_filename_list_(folder_name):
    global filename_list_cache
    global folder_names_and_paths
    if folder_name not in filename_list_cache:
        return None
    out = filename_list_cache[folder_name]
    if time.perf_counter() < (out[2] + 0.5):
        return out
    for x in out[1]:
        time_modified = out[1][x]
        folder = x
        if os.path.getmtime(folder) != time_modified:
            return None

    folders = folder_names_and_paths[folder_name]
    for x in folders[0]:
        if os.path.isdir(x):
            if x not in out[1]:
                return None

    return out

def get_filename_list(folder_name):
    out = cached_filename_list_(folder_name)
    if out is None:
        out = get_filename_list_(folder_name)
        global filename_list_cache
        filename_list_cache[folder_name] = out
    return list(out[0])

def get_save_image_counter(output_dir):
    def map_filename(filename):
        try:
            digits = int(filename.split('.')[0].split('_')[0])
        except:
            digits = 0
        return digits

    try:
        counter = max(map(map_filename, os.listdir(output_dir))) + 1
    except ValueError:
        counter = 1
    except FileNotFoundError:
        os.makedirs(output_dir, exist_ok=True)
        counter = 1
    return counter
