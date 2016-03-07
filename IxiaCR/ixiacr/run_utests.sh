#!/usr/bin/env bash

# Quick and dirty utest runner

PYC=`which /local/pythonenv/bin/python`

for i in `/bin/find . -path '*/utest/*test.py'`; do
    echo "Running $i..."
    $PYC $i
done
