import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

import folder_paths

class Watcher:
    def __init__(self, server):
        self.server = server
        self.observer = Observer()

    def run(self):
        event_handler = Handler(self.server)
        self.observer.schedule(event_handler, folder_paths.get_models_dir(), recursive=True)
        self.observer.start()

class Handler(FileSystemEventHandler):
    def __init__(self, server):
        self.server = server
    
    def on_any_event(self, event):
        if event.is_directory:
            return None

        self.server.send_sync("models.changed", { }, self.server.client_id)
        