#!/bin/sh

if [ -e $VENV/bin/activate ]; then
        . $VENV/bin/activate
fi

exec $IXIACR/bin/results_consumer.py
