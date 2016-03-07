#!/bin/sh -x 

su web -c '$VENV/bin/python $IXIACR/unittests/cyberrange_tests.py functional'
