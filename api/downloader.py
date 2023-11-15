import os
import sys
import copy
import json
import logging
import threading
import heapq
import traceback
import gc
import urllib.request
import io

import folder_paths

class Downloader:
    def __init__(self, server):
        self.server = server

    def execute(self, settings, download_id, extra_data={}):
        if "client_id" in extra_data:
            self.server.client_id = extra_data["client_id"]
        else:
            self.server.client_id = None

        self.server.send_sync("download.start", { "download_id": download_id }, self.server.client_id)
        path = folder_paths.get_full_path(settings["type"], settings["filename"], False)
        url = settings["url"]
        buffer = io.BytesIO()

        with urllib.request.urlopen(url) as response:
            length = response.getheader('content-length')
            chunk_size = 1000000

            if length:
                length = int(length)
                chunk_size = max(4096, length // 20)
                self.server.send_sync("download.progress", { "download_id": download_id, "value": 0, "max": length }, self.server.client_id)

            offset = 0
            print(f"Download started: {url}")

            while True:
                chunk = response.read(chunk_size)

                if not chunk:
                    break
                
                buffer.write(chunk)
                offset += len(chunk)

                if length:
                    self.server.send_sync("download.progress", { "download_id": download_id, "value": offset, "max": length }, self.server.client_id)
                    print(f"Download: {offset}/{length}")

        with open(path, "wb") as f:
            f.write(buffer.getbuffer())

        print(f"Download done: {url}")
        self.server.send_sync("download.end", { "download_id": download_id }, self.server.client_id)
                        

class DownloadQueue:
    def __init__(self, server):
        self.server = server
        self.mutex = threading.RLock()
        self.not_empty = threading.Condition(self.mutex)
        self.task_counter = 0
        self.queue = []
        self.currently_running = {}
        server.download_queue = self

    def put(self, item):
        with self.mutex:
            heapq.heappush(self.queue, item)
            self.server.download_queue_updated()
            self.not_empty.notify()

    def get(self):
        with self.not_empty:
            while len(self.queue) == 0:
                self.not_empty.wait()
            item = heapq.heappop(self.queue)
            i = self.task_counter
            self.currently_running[i] = copy.deepcopy(item)
            self.task_counter += 1
            self.server.download_queue_updated()
            return (item, i)

    def task_done(self, item_id):
        with self.mutex:
            self.currently_running.pop(item_id)
            self.server.download_queue_updated()

    def get_current_queue(self):
        with self.mutex:
            out = []
            for x in self.currently_running.values():
                out += [x]
            return (out, copy.deepcopy(self.queue))

    def get_tasks_remaining(self):
        with self.mutex:
            return len(self.queue) + len(self.currently_running)

    def wipe_queue(self):
        with self.mutex:
            self.queue = []
            self.server.download_queue_updated()

    def delete_queue_item(self, function):
        with self.mutex:
            for x in range(len(self.queue)):
                if function(self.queue[x]):
                    if len(self.queue) == 1:
                        self.wipe_queue()
                    else:
                        self.queue.pop(x)
                        heapq.heapify(self.queue)
                    self.server.download_queue_updated()
                    return True
        return False