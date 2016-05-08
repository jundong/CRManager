Few Pre-requirements to run REST API

1> Install Python version 2.7.11+
2> Install latest requests of python module
    e.g. pip install requests/ ssl and json
###################################################
1    exampleRaw_PortReservation.py                ||  Example on a basic python  implementation on reserving ports using REST Calls
2    exampleRaw_importBpt.py                      ||  Example on a basic python  implementation on importing bpt using REST Calls
3    exampleUsing_bpsRest_configureAndRunTest.py  ||  Example configure/saveas/run/print real time stats/ export results  using the bpsRest python library provided
4    bpsTest.py                                   ||  Example stript used to start bps labs or tests from CLI using python and REST
5    bpsRest.py                                   ||  Example Library for REST Calls 
6    statThread.py                                ||  Example Library for handling real time stats
7    exampleRaw_connectWorkArround.py             ||  Example  to workarround SSL  connection issues from some python versions
8    simple_appsim.bpt                            ||  bpt configuration used in the examples

###################################################

Note: this examples asume all files are in the same location



###################################################
Aditional info for bpstest_start_from_cli_using_rest.py
###################################################
steps to run the test.

1. Copy the file "bpstest_start_from_cli_using_rest.py", "bpsRest.py", "statThread.py" & "simple_appsim.bpt" to a directory.
2. Go to the directory where the above files were copied
3. Open a shell or a command prompt and change the directory  to the one above (1)
4. Fire the following command to upload a bpt and run the test
    python bpstest_start_from_cli_using_rest.py --SCIP <BPS WEB_UI IP> --User <Username> --Passwd <password> --UR 1 --slot <slot Id, e.g. 2> --ports <comma separated ports, e.g. 0,1> --bptName simple_appsim.bpt --force true
5. In case if anybody wants to run a RFC2544 lab test they can fire the following command
    python bpsTest.py --SCIP <BPs WEbUI IP> --User <Username> --Passwd <password> --RFC 1 --slot <slot Id, e.g. 2> --ports <comma separated ports, e.g. 0,1> --force true

Example:
$VENV/bin/python bpsTest.py --SCIP 192.168.0.132 --User admin --Passwd admin --UR 1 --slot 0 --port 0,1 --bptName Simple_AppSim.bpt --force true
$VENV/bin/python bpsTest.py --SCIP 192.168.0.132 --User admin --Passwd admin --UR 1 --slot 0 --port 0,1 --bptName $IXIACR/ixiacr/lib/bps/bpt/CR-Exercise1.bpt --force true
$VENV/bin/python bpsTest.py --SCIP 192.168.0.132 --User admin --Passwd admin --UR 1 --slot 0 --port 0,1 --bptName $IXIACR/ixiacr/lib/bps/bpt/CR-Exercise2.bpt --force true