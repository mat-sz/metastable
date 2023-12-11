import json
import os

def jsonout(event_name, data=None):
    print(json.dumps({ "event": event_name, "data": data }), flush=True)

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
