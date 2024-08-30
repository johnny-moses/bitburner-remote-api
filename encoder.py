import base64
import json


def encode_json_to_base64(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    json_str = json.dumps(data)

    base64_encoded = base64.b64encode(json_str.encode('utf-8'))

    return base64_encoded.decode('utf-8')


encoded_data = encode_json_to_base64('./bitburner_save/bitburnerSave_1724910960_BN1x2.json')
print(encoded_data)
