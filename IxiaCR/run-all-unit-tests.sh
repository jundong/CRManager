#!/bin/sh -x

su web -c '$VENV/bin/python $IXIACR/unittests/ixiacr_tests.py'
