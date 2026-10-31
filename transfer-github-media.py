"""Transfer only the owner's allowlisted, hash-verified public portfolio assets."""
import concurrent.futures
import hashlib
import http.client
import json
import os
import pathlib
import tempfile
import threading
import time
import urllib.parse
import urllib.request

REPO = 'stourschurch267-prog/time-magician-portfolio'
ORIGIN = 'https://time-magician-liu-guangzhe.gladbow513.chatgpt.site'
TAG = 'portfolio-v1'
TOKEN = os.environ['GH_TOKEN']
manifest = json.loads(pathlib.Path('transfer-manifest.json').read_text())
if os.environ.get('GITHUB_REPOSITORY') != REPO or manifest['repository'] != REPO:
    raise RuntimeError('Repository identity differs')
items = manifest['assets']
if len(items) != 466 or len({item['name'] for item in items}) != 466:
    raise RuntimeError('Complete unique portfolio inventory required')

def api(endpoint, method='GET'):
    request = urllib.request.Request('https://api.github.com/' + endpoint, method=method,
        headers={'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json', 'User-Agent': 'portfolio-migration'})
    with urllib.request.urlopen(request, timeout=60) as response:
        body = response.read()
        return json.loads(body) if body else None

release = api(f'repos/{REPO}/releases/tags/{TAG}')
if release['draft'] or release['id'] != manifest['releaseId']:
    raise RuntimeError('Public release identity differs')
release_id = release['id']

def list_assets():
    result = []
    page = 1
    while True:
        batch = api(f'repos/{REPO}/releases/{release_id}/assets?per_page=100&page={page}')
        result.extend(batch)
        if len(batch) < 100:
            return result
        page += 1

def verified(asset, item):
    return (asset.get('state') == 'uploaded' and asset.get('size') == item['size']
        and asset.get('digest') == 'sha256:' + item['sha256'])

remote = {asset['name']: asset for asset in list_assets()}
expected = {item['name']: item for item in items}
if set(remote) - set(expected):
    raise RuntimeError('Release has unexpected files')
for name, asset in remote.items():
    if not verified(asset, expected[name]):
        raise RuntimeError('An existing release asset is incomplete or differs: ' + name)

queue = [item for item in reversed(items) if item['name'] not in remote]
print(f'Already verified: {len(remote)} / 466. Remaining: {len(queue)}.', flush=True)
slot_lock = threading.Lock()
result_lock = threading.Lock()
next_slot = 0
done = len(remote)
cancelled = threading.Event()

def reserve_upload_slot():
    global next_slot
    with slot_lock:
        start = max(time.monotonic(), next_slot)
        next_slot = start + 1.2
    time.sleep(max(0, start - time.monotonic()))

def upload(file, item):
    reserve_upload_slot()
    connection = http.client.HTTPSConnection('uploads.github.com', timeout=600)
    endpoint = f'/repos/{REPO}/releases/{release_id}/assets?name=' + urllib.parse.quote(item['name'], safe='')
    try:
        connection.putrequest('POST', endpoint)
        connection.putheader('Authorization', 'Bearer ' + TOKEN)
        connection.putheader('Accept', 'application/vnd.github+json')
        connection.putheader('User-Agent', 'portfolio-migration')
        connection.putheader('Content-Type', 'video/mp4')
        connection.putheader('Content-Length', str(item['size']))
        connection.endheaders()
        with file.open('rb') as stream:
            while chunk := stream.read(1024 * 1024):
                connection.send(chunk)
        response = connection.getresponse()
        body = response.read()
        if response.status != 201:
            raise RuntimeError(f'Upload HTTP {response.status}: {item["name"]}')
        asset = json.loads(body)
        if not verified(asset, item):
            raise RuntimeError('Uploaded asset digest differs: ' + item['name'])
        return asset
    finally:
        connection.close()

def transfer(item):
    global done
    if cancelled.is_set():
        return
    name = item['name']
    source = item['path']
    if not source.startswith('/') or '..' in source or pathlib.PurePosixPath(source).name != name:
        raise RuntimeError('Unsafe source path')
    try:
        with tempfile.TemporaryDirectory(prefix='portfolio-media-') as directory:
            file = pathlib.Path(directory) / name
            for attempt in range(3):
                digest = hashlib.sha256()
                size = 0
                try:
                    # Anonymous public GET: no login, proxy, challenge bypass, or source credential.
                    with urllib.request.urlopen(ORIGIN + urllib.parse.quote(source, safe='/'), timeout=120) as response, file.open('wb') as stream:
                        while chunk := response.read(1024 * 1024):
                            size += len(chunk)
                            if size > item['size']:
                                raise RuntimeError('Source exceeds expected size')
                            digest.update(chunk)
                            stream.write(chunk)
                    if size != item['size'] or digest.hexdigest() != item['sha256']:
                        raise RuntimeError('Source bytes/hash differ: ' + name)
                    break
                except (TimeoutError, ConnectionError, urllib.error.URLError):
                    if attempt == 2:
                        raise
                    time.sleep(3 * (attempt + 1))
            if cancelled.is_set():
                return
            asset = upload(file, item)
            with result_lock:
                done += 1
                remote[name] = asset
                print(f'Verified {done}/466: {name}', flush=True)
    except Exception:
        cancelled.set()
        raise

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
    futures = [executor.submit(transfer, item) for item in queue]
    for future in concurrent.futures.as_completed(futures):
        future.result()

final_assets = {asset['name']: asset for asset in list_assets()}
if len(final_assets) != 466 or any(not verified(final_assets.get(item['name'], {}), item) for item in items):
    raise RuntimeError('Final complete portfolio verification failed')
print('All 466 original videos are uploaded and SHA256 verified.', flush=True)