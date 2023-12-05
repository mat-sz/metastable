import json

def jsonout(event_name, data=None):
    print(json.dumps({ "event": event_name, "data": data }), flush=True)