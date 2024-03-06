import argparse
import os
import cv2
import numpy as np
import csv
import json
import torch
from PIL import Image
import onnx
import onnxruntime as ort

IMAGE_SIZE = 448

def jsonout(event_name, data=None):
    print(json.dumps({ "event": event_name, "data": data }), flush=True)

def preprocess_image(image):
    image = np.array(image)
    image = image[:, :, ::-1]  # RGB->BGR

    # pad to square
    size = max(image.shape[0:2])
    pad_x = size - image.shape[1]
    pad_y = size - image.shape[0]
    pad_l = pad_x // 2
    pad_t = pad_y // 2
    image = np.pad(image, ((pad_t, pad_y - pad_t), (pad_l, pad_x - pad_l), (0, 0)), mode="constant", constant_values=255)

    interp = cv2.INTER_AREA if size > IMAGE_SIZE else cv2.INTER_LANCZOS4
    image = cv2.resize(image, (IMAGE_SIZE, IMAGE_SIZE), interpolation=interp)

    image = image.astype(np.float32)
    return image

class ImageLoadingPrepDataset(torch.utils.data.Dataset):
    def __init__(self, image_paths):
        self.images = image_paths

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        image_path = str(self.images[idx])

        try:
            image = Image.open(image_path).convert("RGB")
            image = preprocess_image(image)
            tensor = torch.tensor(image)
        except Exception as e:
            jsonout("tagger.error", {
                "path": image_path,
                "error": tag_text,
                "name": type(error).__name__,
                "description": str(error)
            })
            return None

        return (tensor, image_path)

def collate_fn_remove_corrupted(batch):
    """Collate function that allows to remove corrupted examples in the
    dataloader. It expects that the dataloader returns 'None' when that occurs.
    The 'None's in the batch are removed.
    """
    # Filter out all the Nones (corrupted examples)
    batch = list(filter(lambda x: x is not None, batch))
    return batch

global_progress = 0
def main(args):
    model_path = args.model
    csv_path = args.csv if args.csv is not None else model_path + '.csv'

    max_data_loader_n_workers = 8
    batch_size = 1
    model = onnx.load(model_path)
    input_name = model.graph.input[0].name
    try:
        batch_size = model.graph.input[0].type.tensor_type.shape.dim[0].dim_value
    except:
        batch_size = model.graph.input[0].type.tensor_type.shape.dim[0].dim_param

    del model

    ort_sess = ort.InferenceSession(
        model_path,
        providers=["CUDAExecutionProvider"]
        if "CUDAExecutionProvider" in ort.get_available_providers()
        else ["CPUExecutionProvider"],
    )

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        l = [row for row in reader]
        header = l[0]  # tag_id,name,category,count
        rows = l[1:]
    assert header[0] == "tag_id" and header[1] == "name" and header[2] == "category", f"unexpected csv format: {header}"

    image_paths = args.images
    general_tags = [row[1] for row in rows[1:] if row[2] == "0"]
    character_tags = [row[1] for row in rows[1:] if row[2] == "4"]

    caption_separator = args.caption_separator
    stripped_caption_separator = caption_separator.strip()
    undesired_tags = set(args.undesired_tags.split(stripped_caption_separator))

    def increment_progress():
        global global_progress
        global_progress += 1

    def print_progress():
        global global_progress
        jsonout("tagger.progress", {
            "value": global_progress,
            "max": len(image_paths)
        })

    def run_batch(path_imgs):
        print_progress()

        imgs = np.array([im for _, im in path_imgs])

        if len(imgs) < batch_size:
            imgs = np.concatenate([imgs, np.zeros((batch_size - len(imgs), IMAGE_SIZE, IMAGE_SIZE, 3))], axis=0)
        probs = ort_sess.run(None, {input_name: imgs})[0]  # onnx output numpy
        probs = probs[: len(path_imgs)]

        for (image_path, _), prob in zip(path_imgs, probs):
            # 最初の4つはratingなので無視する
            # # First 4 labels are actually ratings: pick one with argmax
            # ratings_names = label_names[:4]
            # rating_index = ratings_names["probs"].argmax()
            # found_rating = ratings_names[rating_index: rating_index + 1][["name", "probs"]]

            # それ以降はタグなのでconfidenceがthresholdより高いものを追加する
            # Everything else is tags: pick any where prediction confidence > threshold
            combined_tags = []
            general_tag_text = ""
            character_tag_text = ""
            for i, p in enumerate(prob[4:]):
                if i < len(general_tags) and p >= args.general_threshold:
                    tag_name = general_tags[i]
                    if args.remove_underscore and len(tag_name) > 3:  # ignore emoji tags like >_< and ^_^
                        tag_name = tag_name.replace("_", " ")

                    if tag_name not in undesired_tags:
                        general_tag_text += caption_separator + tag_name
                        combined_tags.append(tag_name)
                elif i >= len(general_tags) and p >= args.character_threshold:
                    tag_name = character_tags[i - len(general_tags)]
                    if args.remove_underscore and len(tag_name) > 3:
                        tag_name = tag_name.replace("_", " ")

                    if tag_name not in undesired_tags:
                        character_tag_text += caption_separator + tag_name
                        combined_tags.append(tag_name)

            # 先頭のカンマを取る
            if len(general_tag_text) > 0:
                general_tag_text = general_tag_text[len(caption_separator) :]
            if len(character_tag_text) > 0:
                character_tag_text = character_tag_text[len(caption_separator) :]

            tag_text = caption_separator.join(combined_tags)
            jsonout("tagger.result", {
                "path": image_path,
                "caption": tag_text 
            })

            increment_progress()
            print_progress()

    # 読み込みの高速化のためにDataLoaderを使うオプション
    dataset = ImageLoadingPrepDataset(image_paths)
    data = torch.utils.data.DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=max_data_loader_n_workers,
        collate_fn=collate_fn_remove_corrupted,
        drop_last=False,
    )

    b_imgs = []
    for data_entry in data:
        for data in data_entry:
            if data is None:
                continue

            image, image_path = data
            if image is not None:
                image = image.detach().numpy()
            else:
                try:
                    image = Image.open(image_path)
                    if image.mode != "RGB":
                        image = image.convert("RGB")
                    image = preprocess_image(image)
                except Exception as e:
                    jsonout("tagger.error", {
                        "path": image_path,
                        "error": tag_text,
                        "name": type(error).__name__,
                        "description": str(error)
                    })
                    continue
            b_imgs.append((image_path, image))

            if len(b_imgs) >= batch_size:
                b_imgs = [(str(image_path), image) for image_path, image in b_imgs]  # Convert image_path to string
                run_batch(b_imgs)
                b_imgs.clear()

    if len(b_imgs) > 0:
        b_imgs = [(str(image_path), image) for image_path, image in b_imgs]  # Convert image_path to string
        run_batch(b_imgs)

def setup_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("images", metavar='N', type=str, nargs='+', help='list of image files to generate tags for')
    parser.add_argument("--thresh", type=float, default=0.35, help="threshold of confidence to add a tag / タグを追加するか判定する閾値")
    parser.add_argument("--model", type=str, help="onnx model path")
    parser.add_argument("--csv", type=str, help="csv path")
    parser.add_argument("--general_threshold", type=float, default=None, help="threshold of confidence to add a tag for general category, same as --thresh if omitted")
    parser.add_argument("--character_threshold", type=float, default=None, help="threshold of confidence to add a tag for character category, same as --thres if omitted")
    parser.add_argument("--remove_underscore", action="store_true", help="replace underscores with spaces in the output tags")
    parser.add_argument("--undesired_tags", type=str, default="", help="comma-separated list of undesired tags to remove from the output")
    parser.add_argument("--caption_separator", type=str, default=", ", help="separator for captions, include space if needed")

    return parser


if __name__ == "__main__":
    parser = setup_parser()

    args = parser.parse_args()

    if args.general_threshold is None:
        args.general_threshold = args.thresh
    if args.character_threshold is None:
        args.character_threshold = args.thresh

    main(args)
