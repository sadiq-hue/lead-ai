import urllib.request

api_key = 'AIzaSyAaYB_COdoGdMlzU3YEXUvHX_fdlG8mneo'
project = 'leadai-dd858'
url = f'https://identitytoolkit.googleapis.com/v1/projects/{project}/config?key={api_key}'

try:
    with urllib.request.urlopen(url) as r:
        print('HTTP', r.status)
        print(r.read().decode())
except Exception as e:
    print('ERR', type(e), e)
    if hasattr(e, 'read'):
        try:
            print(e.read().decode())
        except Exception:
            pass
