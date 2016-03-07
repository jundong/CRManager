#!/bin/sh

if [ -e $VENV/bin/activate ]; then
	. $VENV/bin/activate
fi

$VENV/bin/python setup.py develop



