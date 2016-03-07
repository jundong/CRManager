import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.txt')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

requires = [
    'babel',
    'pyramid',
    'SQLAlchemy',
    'transaction',
    'pyramid_tm',
    'zope.sqlalchemy',
    'waitress',
    'psycopg2',
    'celery',
    'pyramid_handlers',
    'pyramid_jinja2',
    'pyramid_debugtoolbar',
    'simplejson',
    'anyjson',    
    'pyramid_celery',
    'WebTest',
    'pycrypto'
]

message_extractors = {
    'ixiacr': [
        ('**.py', 'python', None),
        ('**.jinja2', 'jinja2', {
            'encoding': 'utf-8',
            'silent': 'false'
        })
    ]
}

setup(name='IxiaCR',
      version='1.0',
      description='IxiaCR',
      long_description=README + '\n\n' +  CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Network",
        ],
      author='',
      author_email='',
      url='',
      keywords='Network Security',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      test_suite='ixiacr',
      install_requires=requires,
      message_extractors=message_extractors,
      entry_points="""\
      [paste.app_factory]
      main = ixiacr:main
      [console_scripts]
      initialize_IxiaCR_db = ixiacr.scripts.initializedb:main
      """,
      )

