import json
import os

out = os.fdopen(3, 'bw')

def write(data):
    global out
    out.write(data.encode('utf-8'))
    out.write(b'\x1e')
    out.flush()

def write_json(data=None):
    write(json.dumps(data))

def write_event(event_name, data=None):
    write_json({ "type": "event", "event": event_name, "data": data })