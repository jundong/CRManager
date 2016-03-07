from __future__ import absolute_import

from celery import Celery

IxiaCelery = Celery()
IxiaCelery.config_from_object('celeryconfig')
