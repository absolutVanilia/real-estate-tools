import os

environment = os.environ.get('DJANGO_ENV', 'local')

if environment == 'production':
    from .production import *
else:
    from .local import *